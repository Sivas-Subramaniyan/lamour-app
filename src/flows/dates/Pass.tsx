// dates/pass: the Date Pass. A letterpress card, rides booked separately, and consequences shown before any change.
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Toggle, Tag, Eyebrow, ListRow, Sheet, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useNow, planWith, patchPlan, setStage, send, proposalsFor, fmtTime, fmtDay } from '../../state/store'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { usePlan, PassCode, weekday, relDay, localIso, guardianOf, freshHold } from './kit'

const ease = [0.22, 1, 0.36, 1] as const

export function DatePass({ params }: ScreenProps) {
  const { s, update, id, plan, first, opt, v, patch } = usePlan(params, { sealed: true })
  const nav = useNav()
  const now = useNow(30000)
  const { toast } = useFeedback()
  const [sheet, setSheet] = useState<'' | 'dir' | 'change'>('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const sealed = plan.status === 'sealed' || plan.status === 'live' || plan.status === 'done'
  const at = new Date(opt.when)
  const leave = new Date(at.getTime() - (opt.minsMe + 6) * 60e3)
  const reveal = new Date(at.getFullYear(), at.getMonth(), at.getDate(), 10)
  const hidden = !!plan.surprise && now < reveal
  const hoursOut = Math.round((at.getTime() - now.getTime()) / 3600e3)
  const graceSafe = hoursOut >= 24
  const day = weekday(opt.when)

  const change = (kind: 'reschedule' | 'cancel') => {
    update(st => {
      const pl = planWith(st, id)
      if (!pl) return st
      let n = kind === 'reschedule'
        ? patchPlan(st, pl.id, { status: 'negotiating', mySeal: false, theirSeal: false, chosen: undefined, surprise: false, options: proposalsFor(st, id, 1), holdUntil: freshHold() })
        : patchPlan(st, pl.id, { status: 'cancelled' })
      n = setStage(n, id, kind === 'reschedule' ? 'planning' : 'talking')
      if (graceSafe) n = { ...n, me: { ...n.me, datePasses: n.me.datePasses + 1 } } // notice given: the credit comes back
      return send(n, id, { from: 'aura', kind: 'system', text: kind === 'reschedule' ? `${day} moved with notice · three new evenings on the way` : `${day} was cancelled with notice` }, localIso(now))
    })
    setSheet('')
    if (kind === 'reschedule') {
      toast(`${first} sees three new evenings. Nothing else changes.`)
      nav.replace('dates/proposals', { id })
    } else {
      toast(graceSafe ? 'Cancelled with notice. Your Grace is intact.' : 'Cancelled. This one counts as late.')
      nav.goTab('plans')
    }
  }

  return (
    <Screen top={<TopBar title="Date Pass" right={sealed ? <Tag tone="sage" icon="check">Sealed</Tag> : <Tag>Draft</Tag>} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 6 }}>
        <div style={{ perspective: 900 }}>
          <motion.div className="dt-pass" initial={{ opacity: 0, rotateX: 16, y: 28 }} animate={{ opacity: 1, rotateX: 0, y: 0 }} transition={{ duration: 1, ease }}>
            <span className="dt-pass-sheen" aria-hidden="true" />
            <div className="row between">
              <span className="dt-pass-mark dt-press">L’Amour</span>
              <span className="dt-lbl">Date Pass</span>
            </div>
            <div className="t-num dt-pass-no">No. {plan.passNo}</div>
            <div className="dt-pass-names dt-press">{s.me.name} <span className="dt-amp">&</span> {first}</div>
            <div className="dt-pass-sub">Table under first names only</div>

            <div className="dt-perf" aria-hidden="true" />

            <div className="dt-pass-grid">
              <div className="stack gap-4">
                <span className="dt-lbl">When</span>
                <span className="dt-pass-big dt-press">{day}</span>
                <span className="t-num dt-pass-small">{fmtDay(opt.when)} · {fmtTime(opt.when)}</span>
              </div>
              <div className="stack gap-4">
                <span className="dt-lbl">Where</span>
                {hidden ? (
                  <>
                    <span className="dt-pass-big dt-blur" aria-hidden="true">{v.name}</span>
                    <span className="dt-pass-small">A surprise until 10 AM on the day</span>
                  </>
                ) : (
                  <>
                    <span className="dt-pass-big dt-press">{v.name}</span>
                    <span className="dt-pass-small">{v.hood}</span>
                  </>
                )}
              </div>
            </div>

            <div className="row between" style={{ alignItems: 'flex-end', marginTop: 20 }}>
              <div className="stack gap-4">
                <span className="dt-lbl">Getting there</span>
                <span className="t-num dt-pass-small" style={{ color: 'var(--p-ink)' }}>{opt.minsMe} min · {opt.minsThem} min</span>
                <span className="dt-pass-small">Separate rides</span>
              </div>
              <span style={{ color: 'var(--p-ink)' }}><PassCode seed={plan.passNo} size={84} /></span>
            </div>
            {!sealed && <span className="dt-draft">Not sealed yet</span>}
          </motion.div>
        </div>

        {!sealed ? (
          <div className="stack gap-8">
            <p className="t-callout muted center" style={{ margin: 0 }}>This evening becomes a pass once you and {first} both seal it.</p>
            <Button kind="commit" block onClick={() => nav.push('dates/seal', { id })}>Seal this evening</Button>
          </div>
        ) : (
          <>
            <motion.div className="row gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}>
              <Button kind="soft" size="md" icon="wallet" style={{ flex: 1 }} onClick={() => toast('Added to Wallet. It surfaces on the morning of.')}>Add to Wallet</Button>
              <Button kind="soft" size="md" icon="map" style={{ flex: 1 }} onClick={() => setSheet('dir')}>Directions</Button>
            </motion.div>

            <div className="row gap-16">
              <span className="grow stack gap-4">
                <span style={{ fontWeight: 600, fontSize: 15.5 }}>Surprise me</span>
                <span className="t-small muted">The room stays a secret until 10 AM on the day. {first} sees it as usual.</span>
              </span>
              <Toggle on={!!plan.surprise} label="Surprise me" onChange={on => {
                patch(() => ({ surprise: on }))
                toast(on ? 'Sealed in an envelope until 10 AM.' : 'The room is back on your pass.')
              }} />
            </div>

            <div className="card card-pad stack gap-12">
              <div className="row between"><Eyebrow>Rides</Eyebrow><span className="t-small muted">{relDay(opt.when, now)}</span></div>
              <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                <span className="dt-ico"><Icon name="car" size={20} /></span>
                <span className="stack gap-4">
                  <span style={{ fontSize: 15.5, lineHeight: 1.45 }}>Uber for you · Lyft for {first}, booked separately. Never a shared pickup.</span>
                  <span className="t-small muted">Yours arrives at <span className="t-num">{fmtTime(leave)}</span>. Neither of you sees where the other starts.</span>
                </span>
              </div>
            </div>

            <div className="stack">
              <ListRow icon="feather" title="Your Brief" sub="Ready on the morning of. Twenty seconds, out loud." onClick={() => nav.push('day/brief', { id })} />
              <ListRow icon="shield" title="Guardian Circle" sub={`${guardianOf(s)} can know where and when`} onClick={() => nav.push('day/guardian', { id })} />
              <ListRow icon="message" title={`Message ${first}`} sub="The chat stays open" onClick={() => nav.push('conn/chat', { id })} />
              <ListRow icon="book" title="Parley Minutes" sub="What was agreed, and what’s left for you two" onClick={() => nav.push('dates/minutes', { id })} />
            </div>

            <Button kind="quiet" block onClick={() => { setConfirmCancel(false); setSheet('change') }}>Reschedule or cancel</Button>
          </>
        )}
      </div>

      <Sheet open={sheet === 'dir'} onClose={() => setSheet('')} title="Directions">
        <div className="stack gap-16">
          <div className="stack gap-4">
            <span className="t-display"><span className="t-num" style={{ fontSize: 40 }}>{opt.minsMe}</span> <span className="serif" style={{ fontSize: 26 }}>minutes</span></span>
            <span className="t-callout muted">By subway, then a short walk. Leave by <span className="t-num">{fmtTime(leave)}</span> and you’ll arrive a few minutes early.</span>
          </div>
          <div className="card-flat card-pad stack gap-8">
            <div className="row gap-8 t-callout"><Icon name="bell" size={17} style={{ color: 'var(--ember)' }} />I’ll nudge you at <span className="t-num">{fmtTime(new Date(leave.getTime() - 10 * 60e3))}</span>.</div>
            <div className="row gap-8 t-callout"><Icon name="eyeOff" size={17} style={{ color: 'var(--sage)' }} />{hidden ? 'Turn by turn, without naming the place.' : 'The entrance appears when you’re five minutes away.'}</div>
            <div className="row gap-8 t-callout"><Icon name="shieldCheck" size={17} style={{ color: 'var(--sage)' }} />{first} gets their own directions.</div>
          </div>
          <Button kind="primary" block icon="map" onClick={() => { setSheet(''); toast(hidden ? 'Opening Maps, guided without the name.' : `Opening Maps to ${v.name}. Your start point stays on your phone.`) }}>Open in Maps</Button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'change'} onClose={() => setSheet('')} title="Change of plans">
        <div className="stack gap-16">
          <div className={`dt-conseq ${graceSafe ? 'safe' : 'late'}`}>
            <Eyebrow>Before you choose</Eyebrow>
            <p className="t-body" style={{ margin: 0 }}>24 hours’ notice keeps your Grace. Two late cancellations: 7 days resting.</p>
            <div className="row gap-8 t-small" style={{ fontWeight: 550 }}>
              <Icon name={graceSafe ? 'shieldCheck' : 'clock'} size={17} />
              {graceSafe ? <span>You’re <span className="t-num">{hoursOut}</span> hours out. Your Grace is safe and your credit comes back.</span> : <span>Inside 24 hours. This one counts as late.</span>}
            </div>
          </div>
          <p className="t-small muted" style={{ margin: 0 }}>{first} gets a short, kind note from L’Amour. Nothing is sent in your voice.</p>
          <Button kind="primary" block icon="calendar" onClick={() => change('reschedule')}>Find another evening</Button>
          {confirmCancel
            ? <Button kind="commit" block onClick={() => change('cancel')}>Cancel and tell {first}</Button>
            : <Button kind="ghost" block onClick={() => setConfirmCancel(true)}>Cancel the evening</Button>}
        </div>
      </Sheet>
    </Screen>
  )
}
