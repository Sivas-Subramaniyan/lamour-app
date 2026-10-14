// dates/seal: the two-sided commitment, privacy defaults on, deposit explained before anything is taken.
// dates/sealed: the ceremony. The wax presses in, then what's already been taken care of.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, IconButton, Toggle, Tag, Eyebrow, Sheet, PairAvatars, Portrait, WaxSeal } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useNow, planWith, patchPlan, seal, fmtLongDay, fmtTime } from '../../state/store'
import { venuePhoto, type Venue } from '../../data/venues'
import { chime, haptic } from '../../lib/voice'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { usePlan, HoldRing, DrawCheck, holdLeft, clock, weekday, guardianOf, alternatives, closeModal, ROMAN, NOISE } from './kit'

const ease = [0.22, 1, 0.36, 1] as const

export function SealScreen({ params }: ScreenProps) {
  const { s, update, id, plan, at, first, p, opt, v } = usePlan(params)
  const nav = useNav()
  useNow(1000)
  const [names, setNames] = useState(true)
  const [mask, setMask] = useState(true)
  const [cal, setCal] = useState(true)
  const [fall, setFall] = useState(false)
  const awaiting = !!plan.mySeal && !plan.theirSeal
  const sealed = plan.status === 'sealed' || plan.status === 'live' || plan.status === 'done'
  const credits = s.me.datePasses
  const gi = Math.max(0, s.guardians.findIndex(g => g.on))
  const guardian = s.guardians[gi]

  // The other side seals a moment after yours (simulated), then the ceremony.
  useEffect(() => {
    if (!awaiting) return
    const t = setTimeout(() => {
      update(st => { const pl = planWith(st, id); return pl && pl.mySeal && !pl.theirSeal ? seal(st, pl.id, true) : st })
      nav.replace('dates/sealed', { id })
    }, 2200)
    return () => clearTimeout(t)
  }, [awaiting])

  const doSeal = () => update(st => {
    const pl = planWith(st, id)
    return pl && !pl.mySeal ? seal(patchPlan(st, pl.id, { chosen: pl.chosen ?? 0 }), pl.id) : st
  })
  const toggleGuardian = () => update(st => ({ ...st, guardians: st.guardians.map((g, i) => (i === gi ? { ...g, on: !g.on } : g)) }))
  const meal = new Date(opt.when).getHours() >= 17 ? 'Dinner' : 'Lunch'

  return (
    <Screen top={<TopBar left={<IconButton icon="close" label="Close" onClick={() => closeModal(nav)} />} title="Seal the evening" />}
      footer={
        sealed ? <Button kind="ember" block icon="ticket" onClick={() => nav.replace('dates/pass', { id })}>Your Date Pass</Button>
          : awaiting ? (
            <motion.div className="dt-await" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} aria-live="polite">
              <div className="dt-seals">
                <WaxSeal text={s.me.name.slice(0, 1)} size={46} />
                <span className="dt-seal-empty serif">{first.slice(0, 1)}</span>
              </div>
              <span className="grow stack gap-4">
                <span style={{ fontWeight: 600, fontSize: 15 }}>Your side is sealed</span>
                <span className="t-small muted">Waiting for {first}<span className="dt-dots inline" aria-hidden="true"><i /><i /><i /></span></span>
              </span>
              <span className="stack" style={{ alignItems: 'center', gap: 2 }}>
                <HoldRing left={holdLeft(plan)} size={30} />
                <span className="t-num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{clock(holdLeft(plan))}</span>
              </span>
            </motion.div>
          ) : (
            <div className="stack gap-8">
              <HoldToSeal onDone={doSeal} />
              <span className="t-small faint center">{first} seals on their side. Nothing is booked until you both do.</span>
            </div>
          )
      }>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <motion.div className="card dt-sum" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <div className="dt-sum-photo">
            <Portrait photo={venuePhoto(v)} name={v.name} shape="rect" w="100%" h={110} style={{ borderRadius: 0 }} />
          </div>
          <div className="card-pad stack gap-16" style={{ paddingTop: 0 }}>
            <div className="row between" style={{ marginTop: -22, position: 'relative', zIndex: 1 }}>
              <PairAvatars a={{ photo: s.me.photos[0], name: s.me.name }} b={{ photo: p.photos.portrait, name: first }} size={48} />
              <Tag>Evening {ROMAN[at]}</Tag>
            </div>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1.08 }}>{s.me.name} <span className="i accent">&</span> {first}</div>
            <div className="stack gap-12">
              <SumRow icon="calendar" text={`${fmtLongDay(opt.when)} · ${fmtTime(opt.when)}`} />
              <SumRow icon="pin" text={`${v.name} · ${v.hood}`} />
              <SumRow icon="car" text={`${opt.minsMe} min for you · ${opt.minsThem} min for ${first}`} />
            </div>
            {plan.status === 'negotiating' && (
              <button className="row gap-8 t-small" style={{ color: 'var(--ink-2)', fontWeight: 550, minHeight: 40 }}
                onClick={() => (nav.canGoBack ? nav.pop() : nav.replace('dates/proposals', { id }))}>
                Choose a different evening <Icon name="chevron" size={15} />
              </button>
            )}
          </div>
        </motion.div>

        <section className="stack">
          <Eyebrow style={{ marginBottom: 4 }}>Before you seal</Eyebrow>
          <ToggleRow title="First names only" sub={`${v.name} holds the table for ${s.me.name} and ${first}. No surnames, no numbers.`} on={names} onChange={setNames} />
          <ToggleRow title="Masked phone number" sub="If either of you runs late, calls go through a relay. Your number stays yours." on={mask} onChange={setMask} />
          <ToggleRow title="Add to my calendar" sub={`It shows as ‘${meal}’ until the day.`} on={cal} onChange={setCal} />
          {guardian && (
            <ToggleRow title={`Tell ${guardian.name} where you’ll be`} sub={`Your ${guardian.relation.toLowerCase()} gets the place and time, and an “All well?” check-in. Never ${first}’s last name.`}
              on={guardian.on} onChange={toggleGuardian} />
          )}
        </section>

        <div className="card-flat card-pad row gap-12" style={{ alignItems: 'flex-start' }}>
          <span className="dt-ico"><Icon name="ticket" size={20} /></span>
          <span className="grow stack gap-4">
            <span className="row between gap-8">
              <span style={{ fontWeight: 600, fontSize: 15.5 }}>Date Pass deposit</span>
              {credits > 0 ? <Tag tone="sage" icon="check">Credit applied</Tag> : <span className="t-num" style={{ fontWeight: 600 }}>$15</span>}
            </span>
            <span className="t-small muted">
              {credits > 0 ? (credits === 1 ? 'Uses your Date Pass credit. Nothing is charged.' : `Uses 1 of your ${credits} Date Pass credits. Nothing is charged.`)
                : '$15, returned as venue credit when you both check in.'} If one of you doesn’t come, it goes to the one who did.
            </span>
          </span>
        </div>

        <button className="row gap-8 t-callout" style={{ color: 'var(--ink-2)', minHeight: 40, alignSelf: 'flex-start' }} onClick={() => setFall(true)}>
          <Icon name="info" size={18} /> What if the table falls through?
        </button>
      </div>

      <FallThrough open={fall} onClose={() => setFall(false)} alts={alternatives(s, plan)} room={v.name} />
    </Screen>
  )
}

function FallThrough({ open, onClose, alts, room }: { open: boolean; onClose: () => void; alts: Venue[]; room: string }) {
  const [asks, setAsks] = useState<Record<string, 'requested' | 'held'>>({})
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const ask = (vid: string) => {
    setAsks(a => ({ ...a, [vid]: 'requested' }))
    timers.current.push(window.setTimeout(() => setAsks(a => ({ ...a, [vid]: 'held' })), 1600))
  }
  return (
    <Sheet open={open} onClose={onClose} title="If the table falls through">
      <div className="stack gap-16">
        <p className="t-callout muted" style={{ margin: 0 }}>
          Rooms sometimes overbook. If {room} can’t keep your table, I move to these, in this order. You’ll both hear before anything changes.
        </p>
        {alts.map((a, i) => {
          const st = asks[a.id]
          return (
            <div key={a.id} className="card-flat dt-alt">
              <Portrait photo={venuePhoto(a)} name={a.name} shape="rect" w={60} h={60} style={{ borderRadius: 12 }} />
              <span className="grow stack gap-4">
                <span className="t-small faint">{i === 0 ? 'First choice' : 'Then'}</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
                <span className="t-small muted">{NOISE[a.noise]} · {a.hood}</span>
              </span>
              {st === 'held' ? <Tag tone="ember">Held · 10 min</Tag> : st === 'requested' ? <Tag tone="ember">Requested</Tag> : <Button kind="soft" size="sm" onClick={() => ask(a.id)}>Ask to hold</Button>}
            </div>
          )
        })}
        <div className="dt-states">
          <div><Tag>Requested</Tag><span className="t-small muted">I’ve asked. No answer yet.</span></div>
          <div><Tag tone="ember">Held</Tag><span className="t-small muted">They’re keeping it for ten minutes.</span></div>
          <div><Tag tone="sage">Confirmed</Tag><span className="t-small muted">Booked under first names, only after you both seal.</span></div>
        </div>
        <Button kind="primary" block onClick={onClose}>Understood</Button>
      </div>
    </Sheet>
  )
}

function SumRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="row gap-12">
      <Icon name={icon} size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
      <span className="t-callout" style={{ fontWeight: 500 }}>{text}</span>
    </div>
  )
}

function ToggleRow({ title, sub, on, onChange }: { title: string; sub: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="list-row" style={{ alignItems: 'flex-start' }}>
      <span className="grow stack gap-4">
        <span style={{ fontWeight: 550, fontSize: 15.5 }}>{title}</span>
        <span className="t-small muted">{sub}</span>
      </span>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  )
}

/** Press and hold for one second. Letting go early resets it. Works with pointer and keyboard. */
function HoldToSeal({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0)
  const raf = useRef(0), t0 = useRef(0), fired = useRef(false)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const tick = (t: number) => {
    const x = Math.min(1, (t - t0.current) / 1000)
    setP(x)
    if (x >= 1) { fired.current = true; haptic(28); onDone(); return }
    raf.current = requestAnimationFrame(tick)
  }
  const down = () => { if (fired.current) return; cancelAnimationFrame(raf.current); t0.current = performance.now(); haptic(8); raf.current = requestAnimationFrame(tick) }
  const up = () => { if (fired.current) return; cancelAnimationFrame(raf.current); setP(0) }
  const r = 12, c = 2 * Math.PI * r
  return (
    <button className="dt-holdbtn" aria-label="Press and hold to seal"
      onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down() } }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') up() }}>
      <span className="dt-holdfill" style={{ transform: `scaleX(${p})`, transition: p === 0 ? 'transform .35s var(--ease)' : 'none' }} />
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(251,243,234,.3)" strokeWidth="2" />
        <circle cx="14" cy="14" r={r} fill="none" stroke="#fbf3ea" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 14 14)" />
      </svg>
      <span>{p > 0 ? 'Keep holding' : 'Press and hold to seal'}</span>
    </button>
  )
}

export function Sealed({ params }: ScreenProps) {
  const { s, id, first, opt, v } = usePlan(params, { sealed: true })
  const nav = useNav()
  useEffect(() => {
    const t = setTimeout(() => { if (!s.settings.auraMuted) chime(); haptic([14, 70, 22]) }, 520)
    return () => clearTimeout(t)
  }, [])
  const day = weekday(opt.when)
  const meal = new Date(opt.when).getHours() >= 17 ? 'Dinner' : 'Lunch'
  const g = guardianOf(s)
  const items: { icon: IconName; title: string; sub: string; action?: { label: string; go: () => void } }[] = [
    { icon: 'calendar', title: 'Added to your calendar', sub: `It shows as ‘${meal}’ until the day.` },
    { icon: 'car', title: 'Separate rides ready', sub: `Uber for you, Lyft for ${first}. Never a shared pickup.` },
    { icon: 'shield', title: 'Guardian Circle', sub: `Tell ${g} where you’ll be?`, action: { label: 'Choose', go: () => nav.push('day/guardian', { id }) } },
    { icon: 'message', title: 'The chat stays open', sub: `Say something about ${day}, or don’t.`, action: { label: 'Open', go: () => nav.push('conn/chat', { id }) } },
  ]

  return (
    <Screen top={<TopBar left={<span />} />}
      footer={
        <div className="stack gap-8">
          <Button kind="ember" block icon="ticket" onClick={() => nav.replace('dates/pass', { id })}>Your Date Pass</Button>
          <Button kind="quiet" block onClick={() => nav.goTab('plans')}>Back to Plans</Button>
        </div>
      }>
      <div className="pad stack gap-24" style={{ alignItems: 'center' }}>
        <div className="dt-sealstage">
          <motion.div className="dt-sealglow" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 1.4, ease }} />
          <motion.span className="dt-ripple" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: [0.7, 1.9], opacity: [0.7, 0] }} transition={{ delay: 0.55, duration: 1.5, ease: 'easeOut' }} />
          <WaxSeal text={`${s.me.name.slice(0, 1)}·${first.slice(0, 1)}`} size={150} />
        </div>

        <motion.div className="stack gap-8 center" style={{ alignItems: 'center' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.8, ease }}>
          <h1 className="t-display balance" style={{ margin: 0 }}><span className="i">{day}</span> is sealed.</h1>
          <span className="t-num t-small muted">{fmtLongDay(opt.when)} · {fmtTime(opt.when)}</span>
          <span className="t-callout muted">{v.name}, {v.hood}</span>
        </motion.div>

        <div className="dt-checklist">
          {items.map((it, i) => (
            <motion.div key={it.title} className="dt-checkrow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.28, duration: 0.5, ease }}>
              <span className="dt-check sage"><DrawCheck delay={1.55 + i * 0.28} /></span>
              <span className="grow stack gap-4">
                <span style={{ fontWeight: 600, fontSize: 15 }}>{it.title}</span>
                <span className="t-small muted">{it.sub}</span>
              </span>
              {it.action && <Button kind="soft" size="sm" onClick={it.action.go}>{it.action.label}</Button>}
            </motion.div>
          ))}
        </div>
      </div>
    </Screen>
  )
}
