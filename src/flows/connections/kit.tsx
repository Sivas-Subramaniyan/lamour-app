// Shared bits for the Table flow: who a screen is about, the demo clock as message stamps, chair status, playback.
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CAST, PERSONAS } from '../../data/personas'
import { introduce, patchPlan, planWith, setStage, useNow, fmtTime, type Connection, type State } from '../../state/store'
import { speak, stopSpeaking } from '../../lib/voice'
import { useNav } from '../../shell/nav'
import type { ScreenId } from '../../shell/screens'
import { Icon } from '../../design/icons'
import { Waveform } from '../../design/ui'

export const isSeated = (c: Connection) => !['closed', 'lapsed', 'debriefed'].includes(c.stage)

/** Chat-side screens default to the person whose turn it is; new-introduction screens use leadId. */
export const chatId = (s: State, params?: Record<string, any>) => (params?.id && PERSONAS[params.id] ? params.id : CAST[s.me.seeking].yourTurn) as string

/** Local ISO without zone, matching the store's seeded timestamps. */
export const stamp = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 19)
export const plusHours = (at: string, h: number) => stamp(new Date(new Date(at).getTime() + h * 3600e3))

/** Returns a function giving the demo "now" as a stamp, valid inside timers too. */
export function useStamp() {
  const now = useNow()
  const off = useRef(0)
  off.current = now.getTime() - Date.now()
  return useCallback(() => stamp(new Date(Date.now() + off.current)), [])
}

/** Introduce on first contact (e.g. a presenter jumping straight to a chat), without a duplicate notification. */
export function ensureConn(s: State, id: string, at: string): State {
  if (s.connections.some(c => c.id === id)) return s
  return { ...introduce(s, id, at), notifications: s.notifications }
}

// ponytail: store's send() stamps the 48h turn in UTC; we re-stamp in local time until the shared helper is fixed.
export const turnTo = (s: State, id: string, until: string): State => ({ ...s, connections: s.connections.map(c => (c.id === id ? { ...c, yourTurnUntil: until } : c)) })

/** Leave the table: release any open plan, close the chair, remember why (shown only to you). */
export function closeWith(s: State, id: string, note: 'kind' | 'reported' | 'blocked'): State {
  const plan = planWith(s, id)
  let n = plan && plan.status !== 'done' ? patchPlan(s, plan.id, { status: 'cancelled' }) : s
  n = setStage(n, id, 'closed')
  return { ...n, connections: n.connections.map(c => (c.id === id ? { ...c, note, yourTurnUntil: undefined } : c)) }
}

/** Arc step: Introduced 0 · Hello 1 · Voice Hour 2 · Sealed 3 · Met 4 · Debriefed 5. */
export function arcAt(s: State, id: string) {
  const c = s.connections.find(x => x.id === id)
  const msgs = s.messages[id] ?? []
  if (c?.stage === 'sealed') return 3
  if (c?.stage === 'met') return 4
  if (c?.stage === 'debriefed') return 5
  if (msgs.some(m => m.kind === 'system' && /voice hour/i.test(m.text ?? ''))) return 2
  return msgs.some(m => m.from === 'me') && msgs.some(m => m.from === 'them') ? 1 : 0
}

export const hrs = (ms: number) => (ms <= 0 ? 'today' : ms < 3600e3 ? `${Math.ceil(ms / 60e3)}m` : `${Math.ceil(ms / 3600e3)}h`)
const weekday = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })
export const weekdayLong = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { weekday: 'long' })
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

export type Tone = 'turn' | 'sealed' | 'aura' | 'quiet'
export function chairStatus(s: State, c: Connection, now: Date): { label: string; tone: Tone; frac: number } {
  const plan = planWith(s, c.id)
  if ((c.stage === 'sealed' || plan?.status === 'live') && plan?.chosen !== undefined) {
    const when = plan.options[plan.chosen].when
    return { label: sameDay(new Date(when), now) ? `Today · ${fmtTime(when)}` : `${weekday(when)} ${fmtTime(when)}`, tone: 'sealed', frac: 1 }
  }
  if (c.stage === 'met') return { label: 'You met', tone: 'sealed', frac: 1 }
  if (c.stage === 'planning') return { label: 'Aura is planning', tone: 'aura', frac: 1 }
  if (c.yourTurnUntil) {
    const left = new Date(c.yourTurnUntil).getTime() - now.getTime()
    return c.stage === 'introduced'
      ? { label: `Say hello · ${hrs(left)}`, tone: 'aura', frac: Math.max(0.04, Math.min(1, left / (72 * 3600e3))) }
      : { label: `Your turn · ${hrs(left)}`, tone: 'turn', frac: Math.max(0.04, Math.min(1, left / (48 * 3600e3))) }
  }
  return { label: 'Their turn', tone: 'quiet', frac: 1 }
}
export const TONE_COLOR: Record<Tone, string> = { turn: 'var(--accent)', sealed: 'var(--sage)', aura: 'var(--ember)', quiet: 'var(--line-2)' }

/** A status ring that draws itself in. */
export function Ring({ size, frac, tone, delay = 0, stroke = 2.2 }: { size: number; frac: number; tone: Tone; delay?: number; stroke?: number }) {
  const r = size / 2 - stroke
  return (
    <svg className="cn-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE_COLOR[tone]} strokeWidth={stroke} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} initial={{ pathLength: 0 }} animate={{ pathLength: frac }} transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  )
}

/** Close a modal screen, or fall back somewhere sensible when it was opened directly. */
export function useLeave() {
  const nav = useNav()
  return (fallback: ScreenId, params?: Record<string, any>) => () => (nav.canGoBack ? nav.pop() : nav.reset(fallback, params))
}

export const seedOf = (str: string) => [...str].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 97
export const clock = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`

/** One voice note plays at a time: the text is read aloud while a progress sweep runs for `secs`. */
export function usePlayback() {
  const [cur, setCur] = useState<{ key: string; p: number } | null>(null)
  const timer = useRef(0)
  const stop = useCallback(() => { clearInterval(timer.current); stopSpeaking(); setCur(null) }, [])
  useEffect(() => () => { clearInterval(timer.current); stopSpeaking() }, [])
  const toggle = (key: string, text: string, secs: number, voice: 'Warm' | 'Bright' | 'Low') => {
    if (cur?.key === key) return stop()
    stop()
    speak(text, { voice })
    const t0 = performance.now()
    setCur({ key, p: 0 })
    timer.current = window.setInterval(() => {
      const p = (performance.now() - t0) / (secs * 1000)
      if (p >= 1) { clearInterval(timer.current); setCur(null) } else setCur({ key, p })
    }, 80)
  }
  return { cur, toggle, stop }
}

export function VoiceNote({ k, text, secs, voice, play, light }: {
  k: string; text: string; secs: number; voice: 'Warm' | 'Bright' | 'Low'; play: ReturnType<typeof usePlayback>; light?: boolean
}) {
  const on = play.cur?.key === k
  return (
    <div className="row gap-12">
      <button className={`cn-play ${light ? 'light' : ''}`} aria-label={on ? 'Pause' : 'Play voice note'} onClick={() => play.toggle(k, text, secs, voice)}>
        <Icon name={on ? 'pause' : 'play'} size={16} fill={!on} stroke={on ? 2.2 : 1.5} />
      </button>
      <div className="grow"><Waveform seed={seedOf(k)} bars={26} height={26} progress={on ? play.cur!.p : undefined} /></div>
      <span className="t-num" style={{ fontSize: 12, opacity: 0.8 }}>{clock(on ? secs * (1 - play.cur!.p) : secs)}</span>
    </div>
  )
}

export const voiceOf = (gender: string): 'Low' | 'Bright' => (gender === 'man' ? 'Low' : 'Bright')
