// tonight/dusk: the quiet afternoon. A sky clock walks the sun toward the horizon; the letter arrives at sunset.
import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { Screen, Button, IconButton, Eyebrow, Countdown, ScaleTap, ListRow, Tag } from '../../design/ui'
import { Signature, signatureModes } from '../../design/signature'
import { useApp, useNow, goToPhase, openChairs, planWith, PHASE_TIME, SUNSET, fmtLeft, fmtTime } from '../../state/store'
import { useNav } from '../../shell/nav'
import { PERSONAS } from '../../data/personas'
import { venue } from '../../data/venues'
import { Chair, editionDate } from './parts'

const SUNRISE = '2026-10-14T07:09:00'
const R = 132, CX = 160, CY = 156

export function Dusk() {
  const { s, update } = useApp()
  const nav = useNav()
  const now = useNow()
  const dusk = new Date(PHASE_TIME.dusk)
  const arrived = now >= dusk || s.phase !== 'afternoon'
  const open = openChairs(s)
  const active = s.connections.filter(c => !['closed', 'lapsed', 'debriefed'].includes(c.stage))
  const yourTurn = active.find(c => c.stage === 'talking' && c.yourTurnUntil)
  const sealed = active.find(c => c.stage === 'sealed')
  const sealedPlan = sealed && planWith(s, sealed.id)
  const sealedOpt = sealedPlan?.options[sealedPlan.chosen ?? 0]

  const span = dusk.getTime() - new Date(SUNRISE).getTime()
  const f = Math.max(0, Math.min(1, (now.getTime() - new Date(SUNRISE).getTime()) / span))

  const openLetter = () => { update(st => (st.phase === 'afternoon' ? goToPhase(st, 'dusk') : st)); nav.reset('tonight/letter') }

  return (
    <Screen top={
      <div className="topbar">
        <div className="grow pad" style={{ paddingLeft: 10 }}><Eyebrow>Tonight · Edition No. {s.tonight.edition}</Eyebrow></div>
        <IconButton icon="bell" label="Notifications" onClick={() => nav.push('sys/notifications')} />
      </div>
    }>
      <div className="pad stack gap-24" style={{ paddingTop: 6 }}>
        <motion.div className="stack gap-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="t-title balance" style={{ margin: 0 }}>
            {arrived ? <>Your letter <span className="i">has arrived.</span></> : <>A quiet afternoon. <span className="i">Your letter arrives at dusk.</span></>}
          </h1>
          <span className="t-callout muted">{editionDate(now)} · New York</span>
        </motion.div>

        <SkyClock f={f} />

        <div className="stack gap-8 center" style={{ alignItems: 'center', marginTop: -8 }}>
          <span className="t-small faint">Sunset {SUNSET} · Your letter arrives at dusk</span>
          {arrived
            ? <Button kind="ember" icon="feather" onClick={openLetter}>Open your letter</Button>
            : <div className="tn-dusk-count" aria-live="off"><Countdown to={dusk} now={now} /></div>}
          {!arrived && <span className="t-small faint">until dusk</span>}
        </div>

        <section className="stack gap-12">
          <div className="row between"><Eyebrow>Your table tonight</Eyebrow><span className="t-small faint">Three chairs</span></div>
          <button className="tn-chairs" onClick={() => nav.goTab('table')} aria-label={`${3 - open} of 3 chairs taken. Open your table`}>
            {[0, 1, 2].map(i => {
              const c = active[i]
              return (
                <span key={i} className="stack gap-4" style={{ alignItems: 'center', flex: 1 }}>
                  <Chair filled={!!c} />
                  <span className="t-small" style={{ color: c ? 'var(--ink-2)' : 'var(--ink-3)' }}>{c ? PERSONAS[c.id].first : 'Open'}</span>
                </span>
              )
            })}
          </button>
          {open === 0 ? (
            <div className="card-flat card-pad stack gap-12" style={{ padding: 16 }}>
              <span className="t-callout pretty">Your table is full tonight. Finish or close a conversation to make room.</span>
              <Button kind="ghost" size="sm" onClick={() => nav.goTab('table')} style={{ alignSelf: 'flex-start' }}>Go to your table</Button>
            </div>
          ) : (
            <span className="t-small muted pretty">{open === 1 ? 'One chair is open, so tonight’s letter can bring one new person to your table.' : `${open} chairs are open tonight.`}</span>
          )}
        </section>

        <Tuning />

        {(yourTurn || sealed) && (
          <section className="stack gap-4">
            <Eyebrow>While you wait</Eyebrow>
            <div>
              {yourTurn && (
                <ListRow icon="message" title={`Your turn with ${PERSONAS[yourTurn.id].first}`} sub={`${fmtLeft(new Date(yourTurn.yourTurnUntil!).getTime() - now.getTime())} left · no pressure, just a nudge`}
                  onClick={() => nav.push('conn/chat', { id: yourTurn.id })} />
              )}
              {sealed && sealedOpt && (
                <ListRow icon="ticket" title={`${new Date(sealedOpt.when).toLocaleDateString('en-US', { weekday: 'long' })} with ${PERSONAS[sealed.id].first}`} sub={`${venue(sealedOpt.venueId).name} · ${fmtTime(sealedOpt.when)}`}
                  right={<Tag tone="sage" icon="check">Sealed</Tag>} onClick={() => nav.push('dates/pass', { id: sealed.id })} />
              )}
            </div>
          </section>
        )}

        {!arrived && <Button kind="quiet" block onClick={openLetter}>Preview tonight’s letter</Button>}
      </div>
    </Screen>
  )
}

/** An arc from sunrise to sunset; the sun slides along it to where it is now. */
function SkyClock({ f }: { f: number }) {
  const t = useMotionValue(Math.max(0, f - 0.35))
  const swept = useRef(false)
  useEffect(() => {
    if (swept.current) { if (!t.isAnimating()) t.set(f); return }
    swept.current = true
    animate(t, f, { duration: 2.2, ease: [0.22, 1, 0.36, 1] })
  }, [f, t])
  const x = useTransform(t, v => CX - R * Math.cos(Math.PI * v))
  const y = useTransform(t, v => CY - R * Math.sin(Math.PI * v))
  const arc = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`
  return (
    <div className="tn-sky" role="img" aria-label={`The sun is ${Math.round((1 - f) * 100) < 10 ? 'close to' : 'moving toward'} the horizon`}>
      <svg viewBox="0 0 320 178" width="100%">
        <defs>
          <radialGradient id="tn-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ffd9b8" /><stop offset=".5" stopColor="#e8814f" /><stop offset="1" stopColor="#c2452a" /></radialGradient>
          <radialGradient id="tn-sunglow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="rgba(232,129,79,.45)" /><stop offset="1" stopColor="rgba(232,129,79,0)" /></radialGradient>
          <linearGradient id="tn-horizon" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgba(217,102,58,0)" /><stop offset="1" stopColor="rgba(217,102,58,.16)" /></linearGradient>
        </defs>
        <rect x="0" y="96" width="320" height={CY - 96} fill="url(#tn-horizon)" />
        <path d={arc} fill="none" stroke="var(--line-2)" strokeWidth="1.2" strokeDasharray="2 5" />
        <motion.path d={arc} fill="none" stroke="var(--ember)" strokeWidth="1.6" strokeLinecap="round" style={{ pathLength: t }} />
        {[0.25, 0.5, 0.75].map(k => (
          <line key={k} x1={CX - (R + 6) * Math.cos(Math.PI * k)} y1={CY - (R + 6) * Math.sin(Math.PI * k)} x2={CX - (R - 2) * Math.cos(Math.PI * k)} y2={CY - (R - 2) * Math.sin(Math.PI * k)} stroke="var(--line-2)" strokeWidth="1" />
        ))}
        <motion.circle cx={x} cy={y} r="26" fill="url(#tn-sunglow)" />
        <motion.circle cx={x} cy={y} r="9" fill="url(#tn-sun)" />
        <line x1="8" x2="312" y1={CY} y2={CY} stroke="var(--ink-3)" strokeWidth="1" />
        <text x={CX - R} y={CY + 18} textAnchor="middle" className="tn-sky-label">7:09 AM</text>
        <text x={CX} y={CY + 18} textAnchor="middle" className="tn-sky-label">Horizon</text>
        <text x={CX + R} y={CY + 18} textAnchor="middle" className="tn-sky-label">{SUNSET}</text>
      </svg>
    </div>
  )
}

const TUNING = { q: 'After a long week, which sounds better?', left: 'Dinner for two', right: 'A full table' }

/** One quick question a day that sharpens the Signature. */
function Tuning() {
  const { s, update } = useApp()
  const answered: number | undefined = s.me.you?.tuning
  const [settling, setSettling] = useState(false)
  useEffect(() => { if (!settling) return; const t = setTimeout(() => setSettling(false), 1800); return () => clearTimeout(t) }, [settling])
  const answer = (v: number) => {
    update(st => ({ ...st, me: { ...st.me, you: { ...(st.me.you ?? {}), tuning: v } } }))
    setSettling(true)
  }
  return (
    <div className="card card-aura card-pad stack gap-16">
      <div className="row between"><Eyebrow>Tuning · ten seconds</Eyebrow><span className="ai-badge">Aura</span></div>
      {answered === undefined ? (
        <>
          <div className="t-head balance">{TUNING.q}</div>
          <ScaleTap points={5} onChange={answer} left={TUNING.left} right={TUNING.right} />
          <span className="t-small faint">One question a day sharpens your Signature. Skip it any time.</span>
        </>
      ) : (
        <motion.div className="row gap-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Signature layers={[{ modes: signatureModes(s.me.traits), color: '#d9663a' }]} size={76} grains={700} agitation={settling ? 0.5 : 0} />
          <div className="stack gap-4 grow">
            <span className="t-quote" style={{ fontSize: 20 }}>Thank you. That sharpens your Signature.</span>
            <span className="t-small muted">You leaned toward {answered <= 2 ? TUNING.left.toLowerCase() : answered >= 4 ? TUNING.right.toLowerCase() : 'a bit of both'}. I’ll weigh it tonight.</span>
            <button className="t-small faint" style={{ alignSelf: 'flex-start', textDecoration: 'underline', textUnderlineOffset: 3, minHeight: 40 }}
              onClick={() => update(st => ({ ...st, me: { ...st.me, you: { ...(st.me.you ?? {}), tuning: undefined } } }))}>Change my answer</button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
