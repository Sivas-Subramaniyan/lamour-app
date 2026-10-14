// premium/paywall: contextual. The top shows the veiled thing you just tapped; membership sells depth and time, never safety.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, IconButton, Button, Segmented, Tag, Eyebrow, Sheet, Portrait, PairAvatars, Orb, Chip, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, useNow, leadId, fitWith, proposalsFor, planWith, fmtDay, fmtTime } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { venue, venuePhoto } from '../../data/venues'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { haptic } from '../../lib/voice'
import { BILLING, INVITATION_PERKS, SOIREE_PERKS, MAISON_PERKS, NEVER_PAYWALLED, MONOGRAPH_CHAPTERS, pmOf, withPm, partnerId, renewOn, type Billing } from './kit'

type Reason = 'letter' | 'care' | 'autonomy' | 'depth'
const REASONS: Reason[] = ['letter', 'care', 'autonomy', 'depth']
const ROMAN = ['I', 'II', 'III']
const ease = [0.22, 1, 0.36, 1] as const

export function Paywall({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const now = useNow(30000)
  const { toast } = useFeedback()
  const reason: Reason = REASONS.includes(params.reason) ? params.reason : 'letter'
  const [billing, setBilling] = useState<Billing>(pmOf(s).billing ?? 'week')
  const [pay, setPay] = useState<'closed' | 'open' | 'paying' | 'done'>('closed')
  const [apply, setApply] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const member = s.me.tier !== 'invitation'
  const b = BILLING[billing]
  const close = () => (nav.canGoBack ? nav.pop() : nav.goTab('tonight'))

  const confirm = () => {
    setPay('paying')
    haptic(10)
    timers.current.push(window.setTimeout(() => { setPay('done'); haptic([8, 40, 8]) }, 1300))
    timers.current.push(window.setTimeout(() => {
      update(st => withPm({ ...st, me: { ...st.me, tier: 'soiree', datePasses: Math.max(st.me.datePasses, 2) } }, { billing }))
      nav.replace('premium/success', { billing })
    }, 2100))
  }

  return (
    <Screen
      top={<TopBar left={<IconButton icon="close" label="Close" onClick={close} />} right={member ? <Tag tone="sage" icon="check">Soirée</Tag> : undefined} />}
      footer={member
        ? <Button block onClick={() => nav.goTab('tonight')}>Back to tonight</Button>
        : (
          <div className="stack gap-8">
            <Button kind="ember" block onClick={() => setPay('open')}>Begin Soirée</Button>
            <div className="t-small faint center"><span className="t-num">{b.price}</span> / {b.per} · Cancel in two taps.</div>
          </div>
        )}>
      <div className="pad stack gap-32" style={{ paddingTop: 4 }}>
        {reason === 'letter' && <LetterHero />}
        {reason === 'care' && <CareHero id={leadId(s, params)} />}
        {reason === 'autonomy' && <AutonomyHero id={leadId(s, params)} />}
        {reason === 'depth' && <DepthHero />}

        <div className="stack gap-12">
          <Eyebrow>Membership</Eyebrow>
          <Tier i={0} name="Invitation" price="Free" current={s.me.tier === 'invitation'} perks={INVITATION_PERKS} />

          <motion.div className="pm-tier soiree stack gap-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease }}>
            <div className="row between">
              <div className="stack gap-4"><span className="pm-tier-name">Soirée</span><span className="t-small muted">For people who want the whole letter.</span></div>
              {s.me.tier === 'soiree' && <Tag tone="sage">Current</Tag>}
            </div>
            <Segmented value={billing} onChange={setBilling} options={(Object.keys(BILLING) as Billing[]).map(k => ({ value: k, label: BILLING[k].label }))} />
            <AnimatePresence mode="wait">
              <motion.div key={billing} className="row between" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                <span><span className="pm-price t-num">{b.price}</span><span className="muted"> / {b.per}</span></span>
                <span className="t-small faint">{b.note}</span>
              </motion.div>
            </AnimatePresence>
            <hr className="hairline" />
            <ul className="pm-perks">{SOIREE_PERKS.map(p => <li key={p}><Icon name="check" size={16} stroke={2} />{p}</li>)}</ul>
          </motion.div>

          <Tier i={2} name="Maison" price="$399 / month" sub="By application" current={s.me.tier === 'maison'} perks={MAISON_PERKS}
            action={pmOf(s).applied ? <Tag tone="sage" icon="check">Application received</Tag> : <Button kind="ghost" size="sm" onClick={() => setApply(true)}>Apply</Button>} />
        </div>

        <section className="stack gap-12">
          <Eyebrow>Never behind a paywall</Eyebrow>
          <div className="pm-never">
            {NEVER_PAYWALLED.map(x => (
              <div key={x.t} className="row gap-12" style={{ alignItems: 'flex-start' }}>
                <span className="pm-never-ico"><Icon name={x.icon} size={17} /></span>
                <span className="stack" style={{ gap: 2 }}><b className="t-callout">{x.t}</b><span className="t-small faint">{x.d}</span></span>
              </div>
            ))}
          </div>
          <p className="t-small faint center" style={{ margin: '4px 0 0' }}>Cancel in two taps, from You → Membership. No call, no form, no guilt.</p>
        </section>
      </div>

      <Sheet open={pay !== 'closed'} onClose={() => pay === 'open' && setPay('closed')}>
        <div className="stack gap-20" style={{ paddingTop: 4 }}>
          <div className="row between">
            <div className="row gap-12"><span className="pm-app-ico"><Orb size={22} /></span><span className="stack"><b>L’Amour</b><span className="t-small faint">Soirée membership</span></span></div>
            <Tag>Subscription</Tag>
          </div>
          <div className="pm-receipt">
            <div><span>Plan</span><span>Soirée · {b.adj}</span></div>
            <div><span>Starts</span><span>Today</span></div>
            <div><span>Renews</span><span>{fmtDay(renewOn(now, billing))}</span></div>
            <div><span>Pay with</span><span>Visa <span className="t-num">·· 4242</span></span></div>
            <hr className="hairline" />
            <div className="pm-receipt-total"><span>Total today</span><span className="t-num">{b.price}</span></div>
          </div>
          <p className="t-small faint" style={{ margin: 0 }}>Cancel any time, at least a day before renewal. Safety, your data and any sealed evening never depend on a payment.</p>
          <AnimatePresence mode="wait">
            {pay === 'open' && (
              <motion.div key="open" exit={{ opacity: 0 }}>
                <Button kind="commit" block onClick={confirm}>Pay {b.price}</Button>
              </motion.div>
            )}
            {pay === 'paying' && (
              <motion.div key="paying" className="pm-paying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="pm-spin" /> Confirming with your bank
              </motion.div>
            )}
            {pay === 'done' && (
              <motion.div key="done" className="pm-paying" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <span className="pm-done"><Icon name="check" size={18} stroke={2.2} /></span> Done
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Sheet>

      <ApplySheet open={apply} onClose={() => setApply(false)} onSent={() => { setApply(false); update(st => withPm(st, { applied: true })); toast('Received. A matchmaker will write within two days.') }} />
    </Screen>
  )
}

function Tier({ i, name, price, sub, current, perks, action }: { i: number; name: string; price: string; sub?: string; current: boolean; perks: string[]; action?: ReactNode }) {
  return (
    <motion.div className="pm-tier stack gap-12" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease }}>
      <div className="row between">
        <div className="stack gap-4">
          <span className="pm-tier-name">{name}</span>
          <span className="t-small muted">{sub ? `${sub} · ` : ''}<span className="t-num">{price}</span></span>
        </div>
        {current ? <Tag tone="sage">Current</Tag> : action}
      </div>
      <div className="t-small faint">{perks.join(' · ')}</div>
    </motion.div>
  )
}

// ---------- the veiled thing you just tapped ----------

function Headline({ children, sub }: { children: ReactNode; sub: string }) {
  return (
    <motion.div className="stack gap-12 center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7, ease }}>
      <h1 className="t-title balance" style={{ margin: 0 }}>{children}</h1>
      <p className="t-callout muted pretty" style={{ margin: 0 }}>{sub}</p>
    </motion.div>
  )
}

function LetterHero() {
  const { s } = useApp()
  const veiled = s.tonight.ids.slice(1, 3)
  return (
    <div className="stack gap-24" style={{ alignItems: 'center' }}>
      <div className="pm-veiled">
        {veiled.map((id, i) => (
          <motion.div key={id} className="pm-veil" style={{ rotate: i ? 4 : -4 }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.14, duration: 0.8, ease }}>
            <motion.div style={{ width: '100%', height: '100%' }} initial={{ filter: 'blur(26px)' }} animate={{ filter: 'blur(12px)' }} transition={{ duration: 1.8, delay: 0.4 }}>
              <Portrait photo={{ url: PERSONAS[id].photos.portrait.url, alt: 'A veiled introduction' }} w="100%" h="100%" />
            </motion.div>
            <span className="pm-veil-num">{ROMAN[i + 1]}</span>
          </motion.div>
        ))}
      </div>
      <Headline sub="Your letter holds up to three. Invitation opens the first; Soirée opens every one, every evening.">
        <span className="i">{veiled.length === 2 ? 'Two more' : 'More'}</span> were chosen for you tonight.
      </Headline>
    </div>
  )
}

function CareHero({ id }: { id: string }) {
  const { s } = useApp()
  const p = PERSONAS[id]
  const f = fitWith(s, id)
  return (
    <div className="stack gap-24">
      <motion.div className="card card-pad stack gap-12" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
        <div className="row between"><Eyebrow>Where you’ll need care</Eyebrow><span className="t-small faint">You and {p.first}</span></div>
        <p className="serif i" style={{ fontSize: 20, lineHeight: 1.3, margin: 0 }}>{p.aura.careNote || f.efforts[0]?.line || 'You two move at different tempos. Say how you text up front.'}</p>
        {(f.efforts.length ? f.efforts : [{ title: 'Different tempos', tip: 'Say how you text up front.' }]).map(e => (
          <div key={e.title} className="pm-blur stack gap-4" aria-hidden="true">
            <b className="t-callout">{e.title}</b><span className="t-small">{e.tip}</span>
          </div>
        ))}
        <div className="row gap-8 t-small faint"><Icon name="lock" size={14} /> {f.efforts.length || 1} more {f.efforts.length === 1 ? 'note' : 'notes'} with Soirée</div>
      </motion.div>
      <Headline sub="The honest parts are the useful parts. Soirée shows every care note, for everyone in your letter.">
        Every care note, <span className="i">in full.</span>
      </Headline>
    </div>
  )
}

function AutonomyHero({ id }: { id: string }) {
  const { s } = useApp()
  const opt = (planWith(s, id)?.options ?? proposalsFor(s, id))[0]
  const v = venue(opt.venueId)
  const r = 26, c = 2 * Math.PI * r
  return (
    <div className="stack gap-24">
      <motion.div className="card card-pad row gap-16" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
        <Portrait photo={venuePhoto(v)} name={v.name} shape="rect" w={64} h={64} style={{ borderRadius: 16 }} />
        <div className="grow stack gap-4">
          <b className="serif" style={{ fontSize: 20, fontWeight: 400 }}>{v.name}</b>
          <span className="t-small muted">{fmtDay(opt.when)} · {fmtTime(opt.when)}</span>
          <span className="t-small faint"><span className="t-num">{opt.minsMe}</span> min for you · <span className="t-num">{opt.minsThem}</span> for {PERSONAS[id].first}</span>
        </div>
        <div className="pm-ring">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line-2)" strokeWidth="2" />
            <motion.circle cx="32" cy="32" r={r} fill="none" stroke="var(--ember)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={c}
              initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1.4, delay: 0.4, ease }} transform="rotate(-90 32 32)" />
          </svg>
          <span className="t-num">10:00</span>
        </div>
      </motion.div>
      <Headline sub="On Soirée, Aura works inside your rules and holds a table for ten minutes while you decide. You still seal every evening yourself.">
        <span className="i">I can hold this table</span> while you decide.
      </Headline>
    </div>
  )
}

function DepthHero() {
  const { s } = useApp()
  const them = PERSONAS[partnerId(s)]
  return (
    <div className="stack gap-24" style={{ alignItems: 'center' }}>
      <motion.div className="pm-cover theme-day stack gap-12" initial={{ opacity: 0, y: 18, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -1.5 }} transition={{ duration: 0.9, ease }}>
        <div className="row between"><span className="t-label faint">Monograph of Two</span><span className="t-num t-small faint">No. 1</span></div>
        <div className="serif i" style={{ fontSize: 30, lineHeight: 1.05 }}>{s.me.name} <span className="faint">&amp;</span> {them.first}</div>
        <PairAvatars a={{ photo: s.me.photos[0], name: s.me.name }} b={{ photo: them.photos.portrait, name: them.first }} size={34} />
        <hr className="hairline" />
        <ol className="pm-chapters">{MONOGRAPH_CHAPTERS.slice(0, 4).map(c => <li key={c}>{c}</li>)}</ol>
      </motion.div>
      <Headline sub="Ask Aura as often as you like, and a Monograph of Two: a long-form report you both approve before a word is written.">
        A longer read, <span className="i">for two.</span>
      </Headline>
    </div>
  )
}

const HOPES = ['A matchmaker’s eye', 'Introductions beyond the app', 'Salons and dinners', 'Someone to handle the logistics']

function ApplySheet({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [hopes, setHopes] = useState<string[]>([])
  const [note, setNote] = useState('')
  return (
    <Sheet open={open} onClose={onClose} title="Apply to Maison">
      <div className="stack gap-20">
        <p className="t-callout muted" style={{ margin: 0 }}>A matchmaker reads every application. Maison is $399 a month once you’re accepted, and you can stay on your current plan meanwhile.</p>
        <div className="stack gap-8">
          <span className="t-label faint">What would help most</span>
          <div className="row gap-8 wrap">{HOPES.map(h => <Chip key={h} on={hopes.includes(h)} onClick={() => setHopes(x => (x.includes(h) ? x.filter(y => y !== h) : [...x, h]))}>{h}</Chip>)}</div>
        </div>
        <label className="field">
          <span className="t-label faint">Anything we should know</span>
          <textarea className="input" placeholder="Optional. A line or two is plenty." value={note} onChange={e => setNote(e.target.value)} />
        </label>
        <Button kind="commit" block disabled={!hopes.length} onClick={onSent}>Send application</Button>
      </div>
    </Sheet>
  )
}
