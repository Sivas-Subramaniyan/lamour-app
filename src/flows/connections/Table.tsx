// conn/table: the Table tab. A round table seen from above, three chairs, and the people sitting in them.
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen, Eyebrow, Portrait, ArcRail, Sheet, Section, Button, Tag } from '../../design/ui'
import { Icon } from '../../design/icons'
import { PERSONAS } from '../../data/personas'
import { venue } from '../../data/venues'
import { useApp, useNow, planWith, type Connection, type State } from '../../state/store'
import type { ScreenProps } from '../../shell/screens'
import { useNav } from '../../shell/nav'
import { arcAt, chairStatus, isSeated, Ring, TONE_COLOR, weekdayLong } from './kit'

const W = 340, CX = 170, CY = 196, TABLE_R = 78, SEAT_D = 122
const SEATS = [-90, 30, 150].map(a => ({ a, x: CX + SEAT_D * Math.cos((a * Math.PI) / 180), y: CY + SEAT_D * Math.sin((a * Math.PI) / 180) }))

function stageLine(s: State, c: Connection) {
  const plan = planWith(s, c.id)
  switch (c.stage) {
    case 'introduced': return `Introduced ${weekdayLong(c.since)} · a hello is waiting`
    case 'planning': return 'Aura is finding three evenings'
    case 'sealed': return plan?.chosen !== undefined ? `Sealed · ${venue(plan.options[plan.chosen].venueId).name}` : 'Sealed'
    case 'met': return 'You met · your debrief is waiting'
    default: return c.yourTurnUntil ? `Talking since ${weekdayLong(c.since)} · no pressure` : `Talking since ${weekdayLong(c.since)} · their turn, no rush`
  }
}

const PAST_LABEL: Record<string, string> = { kind: 'Closed kindly', reported: 'Reported · a person is reviewing', blocked: 'Blocked' }

export function Table(_: ScreenProps) {
  const { s } = useApp()
  const nav = useNav()
  const now = useNow()
  const [sheet, setSheet] = useState<'etiquette' | 'grace' | null>(null)
  const seated = s.connections.filter(isSeated).sort((a, b) => a.since.localeCompare(b.since)).slice(0, 3)
  const past = s.connections.filter(c => !isSeated(c))
  const overdue = seated.some(c => c.yourTurnUntil && c.stage !== 'introduced' && new Date(c.yourTurnUntil).getTime() < now.getTime())

  return (
    <Screen>
      <div className="pad stack gap-24" style={{ paddingTop: 8 }}>
        <header className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack gap-4">
            <Eyebrow>{weekdayLong(now)} · New York</Eyebrow>
            <h1 className="t-title" style={{ margin: 0 }}>The Table</h1>
            <span className="serif i muted" style={{ fontSize: 19 }}>Three chairs, kept warm.</span>
          </div>
          <div className="stack center" style={{ alignItems: 'flex-end' }}>
            <span className="t-num" style={{ fontSize: 22 }}>{seated.length}<span className="faint"> / 3</span></span>
            <span className="t-label faint">chairs taken</span>
          </div>
        </header>

        {/* The table, from above */}
        <div className="cn-table" style={{ width: W, height: W }}>
          <svg className="cn-surface" viewBox={`0 0 ${W} ${W}`} width={W} height={W} aria-hidden="true">
            <defs>
              <radialGradient id="cn-wood" cx="45%" cy="40%" r="70%"><stop offset="0" stopColor="var(--surface)" /><stop offset="1" stopColor="var(--bg-2)" /></radialGradient>
              <radialGradient id="cn-candle" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="rgba(232,129,79,.45)" /><stop offset="1" stopColor="rgba(232,129,79,0)" /></radialGradient>
            </defs>
            {SEATS.map(({ a }) => {
              const r = SEAT_D + 30, a0 = ((a - 17) * Math.PI) / 180, a1 = ((a + 17) * Math.PI) / 180
              return <path key={a} d={`M${CX + r * Math.cos(a0)} ${CY + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${CX + r * Math.cos(a1)} ${CY + r * Math.sin(a1)}`} fill="none" stroke="var(--line-2)" strokeWidth="7" strokeLinecap="round" />
            })}
            <circle cx={CX} cy={CY} r={TABLE_R} fill="url(#cn-wood)" stroke="var(--line-2)" strokeWidth="1" />
            <circle cx={CX} cy={CY} r={TABLE_R - 10} fill="none" stroke="var(--line)" strokeWidth="1" />
            <circle className="cn-glow" cx={CX} cy={CY} r={46} fill="url(#cn-candle)" />
            <rect x={CX - 6} y={CY - 4} width="12" height="18" rx="2.5" fill="var(--surface)" stroke="var(--line-2)" />
            <path className="cn-flame" d={`M${CX} ${CY - 18} C${CX + 5} ${CY - 11} ${CX + 4} ${CY - 6} ${CX} ${CY - 5} C${CX - 4} ${CY - 6} ${CX - 5} ${CY - 11} ${CX} ${CY - 18}Z`} fill="var(--ember)" />
          </svg>

          {SEATS.map((seat, i) => {
            const c = seated[i]
            const up = seat.a === -90
            const p = c && PERSONAS[c.id]
            const st = c && chairStatus(s, c, now)
            return (
              <motion.div key={seat.a} className="cn-seat" style={{ left: seat.x - 40, top: seat.y - 40 }}
                initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 28, stiffness: 240, delay: 0.15 + i * 0.12 }}>
                {c && p && st ? (
                  <button className="cn-seat-btn" onClick={() => nav.push('conn/chat', { id: c.id })} aria-label={`${p.first}: ${st.label}`}>
                    <Ring size={80} frac={st.frac} tone={st.tone} delay={0.35 + i * 0.12} />
                    <Portrait photo={p.photos.portrait} name={p.first} shape="circle" w={64} h={64} />
                    <span className={`cn-seat-label ${up ? 'up' : 'down'}`}>
                      <span className="serif" style={{ fontSize: 18, lineHeight: 1.1 }}>{p.first}</span>
                      <span className="t-small" style={{ fontSize: 12, color: st.tone === 'quiet' ? 'var(--ink-3)' : TONE_COLOR[st.tone], fontWeight: 600 }}>{st.label}</span>
                    </span>
                  </button>
                ) : (
                  <button className="cn-seat-btn" onClick={() => nav.goTab('tonight')} aria-label="Open chair: see tonight’s letter">
                    <span className="cn-empty"><Icon name="plus" size={20} /></span>
                    <span className={`cn-seat-label ${up ? 'up' : 'down'}`}>
                      <span className="serif i" style={{ fontSize: 17, lineHeight: 1.1 }}>Open</span>
                      <span className="t-small faint" style={{ fontSize: 12 }}>for tonight</span>
                    </span>
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Etiquette */}
        <button className="cn-etq" onClick={() => setSheet('etiquette')} aria-label="How the Table works">
          {[['Three', 'chairs'], ['Your turn', '48 hours'], ['Close', 'kindly']].map(([a, b]) => (
            <span key={a} className="stack gap-4"><span className="serif" style={{ fontSize: 18, lineHeight: 1.1 }}>{a}</span><span className="t-label faint">{b}</span></span>
          ))}
          <Icon name="info" size={18} style={{ color: 'var(--ink-3)', alignSelf: 'center' }} />
        </button>

        {/* At the table */}
        <Section label="At the table">
          {seated.length === 0 && <p className="t-callout muted" style={{ margin: 0 }}>No one yet. Tonight’s letter arrives at dusk.</p>}
          <div className="stack">
            {seated.map((c, i) => {
              const p = PERSONAS[c.id], st = chairStatus(s, c, now)
              return (
                <motion.button key={c.id} className="cn-row" onClick={() => nav.push('conn/chat', { id: c.id })}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <Portrait photo={p.photos.portrait} name={p.first} shape="arch" w={48} h={60} />
                  <span className="grow stack gap-4" style={{ minWidth: 0 }}>
                    <span className="row between gap-8">
                      <span className="serif" style={{ fontSize: 21, lineHeight: 1.1 }}>{p.first} <span className="faint" style={{ fontSize: 15 }}>{p.hood}</span></span>
                      <span className="t-small" style={{ fontWeight: 600, color: st.tone === 'quiet' ? 'var(--ink-3)' : TONE_COLOR[st.tone], whiteSpace: 'nowrap' }}>{st.label}</span>
                    </span>
                    <span className="t-small muted">{stageLine(s, c)}</span>
                    <span style={{ width: 150, marginTop: 4 }}><ArcRail at={arcAt(s, c.id)} /></span>
                  </span>
                  <Icon name="chevron" size={18} style={{ color: 'var(--ink-3)' }} />
                </motion.button>
              )
            })}
          </div>
        </Section>

        {/* Grace: private */}
        <button className="card card-pad cn-grace" onClick={() => setSheet('grace')}>
          <span className="row between">
            <Eyebrow>Your Grace</Eyebrow>
            <span className="row gap-4 t-small faint"><Icon name="lock" size={14} />Only you can see this</span>
          </span>
          <span className="row between" style={{ alignItems: 'flex-end' }}>
            <span className="t-head i">{overdue ? 'Gracious, mostly' : 'Gracious'}</span>
            <span className="row gap-4">{[0, 1, 2].map(i => <i key={i} className="cn-grace-dot" style={{ background: overdue && i === 2 ? 'var(--line-2)' : 'var(--sage)' }} />)}</span>
          </span>
          <span className="t-small muted" style={{ textAlign: 'left' }}>{overdue ? 'One reply is waiting longer than usual. A short “give me a day” counts.' : 'You reply within your turn and close kindly. Your letters stay full.'}</span>
        </button>

        {/* Past */}
        <Section label="Past">
          {past.length === 0
            ? <p className="t-small faint" style={{ margin: 0 }}>When a chair frees up, the conversation closes kindly and rests here. Only you can see it.</p>
            : <div className="stack">{past.map(c => {
                const p = PERSONAS[c.id]
                return (
                  <div key={c.id} className="cn-row past">
                    <Portrait photo={p.photos.portrait} name={p.first} shape="circle" w={38} h={38} />
                    <span className="grow stack" style={{ gap: 2 }}>
                      <span className="serif" style={{ fontSize: 18 }}>{p.first}</span>
                      <span className="t-small faint">{c.stage === 'lapsed' ? 'Lapsed quietly' : c.stage === 'debriefed' ? 'Met · debriefed' : PAST_LABEL[c.note ?? 'kind'] ?? 'Closed kindly'}</span>
                    </span>
                  </div>
                )
              })}</div>}
        </Section>
      </div>

      <Sheet open={sheet === 'etiquette'} onClose={() => setSheet(null)} title="How the Table works">
        <div className="stack gap-20" style={{ paddingBottom: 8 }}>
          {[
            ['Three chairs', 'At most three open conversations at a time. When the table is full, tonight’s letter waits for you.'],
            ['Your turn, 48 hours', 'When it’s your turn, you have two days to reply. Busy is fine. A short “give me a day” counts.'],
            ['Close kindly', 'If it isn’t right, say so in a short note. Aura can draft one. Nobody is left wondering.'],
          ].map(([t, b], i) => (
            <div key={t} className="row gap-16" style={{ alignItems: 'flex-start' }}>
              <span className="serif i faint" style={{ fontSize: 22, width: 20 }}>{['I', 'II', 'III'][i]}</span>
              <span className="stack gap-4"><span className="serif" style={{ fontSize: 21 }}>{t}</span><span className="t-callout muted">{b}</span></span>
            </div>
          ))}
          <Button kind="soft" block onClick={() => setSheet(null)}>Got it</Button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'grace'} onClose={() => setSheet(null)} title="How Grace works">
        <div className="stack gap-20" style={{ paddingBottom: 8 }}>
          <p className="t-callout muted" style={{ margin: 0 }}>Grace is how you keep the table. It’s private: no one else sees it, and it never appears on your profile.</p>
          <div className="stack gap-12">
            {[
              [!overdue, 'You reply within your turn'],
              [true, 'You close kindly, never by going quiet'],
              [true, 'You keep plans, or give 24 hours’ notice'],
            ].map(([ok, t]) => (
              <div key={t as string} className="row gap-12">
                <span className="cn-check" style={{ color: ok ? 'var(--sage)' : 'var(--ember)' }}><Icon name={ok ? 'check' : 'clock'} size={16} stroke={2} /></span>
                <span className="t-callout">{t}</span>
              </div>
            ))}
          </div>
          <div className="card-flat card-pad" style={{ padding: 16 }}>
            <span className="t-small muted">If Grace slips, Aura sends fewer introductions until it recovers. It always recovers. Nothing is ever shown to anyone else.</span>
          </div>
          <div className="row gap-8"><Tag tone="sage" icon="shieldCheck">{overdue ? 'Gracious, mostly' : 'Gracious'}</Tag></div>
        </div>
      </Sheet>
    </Screen>
  )
}
