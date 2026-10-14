// E · Plans kit: plan resolution, the stylised map, fairness bar, hold ring, source chip, pass code.
import { useEffect, useId, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { useApp, leadId, planWith, planById, patchPlan, startPlan, proposalsFor, type Plan, type State } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { venue, VENUES, type Venue } from '../../data/venues'
import { useNav } from '../../shell/nav'

export const HOLD_MS = 10 * 60e3
export const ROMAN = ['I', 'II', 'III', 'IV']

/** Session-only choices from dates/prefs (calendar link, named evenings). They reset on reload by design. */
export const session = { calendar: '', named: [] as string[] }

export const weekday = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { weekday: 'long' })
export const shortDate = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const localIso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 19)
export const guardianOf = (s: State) => (s.guardians.find(g => g.on) ?? s.guardians[0])?.name ?? 'someone you trust'
export const NOISE: Record<Venue['noise'], string> = { hushed: 'Hushed room', conversational: 'Conversational room', lively: 'Lively room' }
/** Real-time 10-minute table holds (not the demo clock, so they keep counting across screens). */
export const holdLeft = (pl: Plan) => (pl.holdUntil ? Math.max(0, Math.min(HOLD_MS, new Date(pl.holdUntil).getTime() - Date.now())) : HOLD_MS)
export const freshHold = () => new Date(Date.now() + HOLD_MS).toISOString()
export const clock = (ms: number) => `${Math.floor(ms / 60e3)}:${String(Math.floor((ms % 60e3) / 1e3)).padStart(2, '0')}`
/** Numbers in running copy get the mono face. */
export const nums = (text: string) => text.split(/(\d[\d:,]*)/).map((x, i) => (i % 2 ? <span key={i} className="t-num">{x}</span> : x))
export const closeModal = (nav: ReturnType<typeof useNav>) => (nav.canGoBack ? nav.pop() : nav.goTab('plans'))
export function relDay(when: string, now: Date) {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const n = Math.round((day(new Date(when)) - day(now)) / 864e5)
  return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n > 1 ? `In ${n} days` : 'Past'
}

/** Rooms near the plan that aren't already on it, closest to your rules first. */
export function alternatives(s: State, plan: Plan, exclude: string[] = []) {
  const taken = new Set([...plan.options.map(o => o.venueId), ...exclude])
  const score = (v: Venue) => (v.noise === s.prefs.vibe ? 2 : 0) + (v.price <= s.prefs.budget ? 1 : 0)
  return VENUES.filter(v => !taken.has(v.id)).sort((a, b) => score(b) - score(a)).slice(0, 2)
}

/**
 * The plan a screen is about. params.id may be a persona id (the convention) or a plan id.
 * `sealed` screens (sealed, pass) fall back to the first sealed evening when no person is named.
 * If nothing exists yet, a plan is started once (startPlan + proposalsFor); a draft renders meanwhile.
 */
export function usePlan(params: Record<string, any> = {}, opts: { sealed?: boolean } = {}) {
  const { s, update } = useApp()
  const byPlan = params.id ? planById(s, params.id) : undefined
  const named = params.id && PERSONAS[params.id] ? (params.id as string) : undefined
  const sealedFallback = opts.sealed && !named ? s.plans.find(p => p.status === 'sealed' || p.status === 'live')?.with : undefined
  const id: string = byPlan?.with ?? named ?? sealedFallback ?? leadId(s, params)
  const real = byPlan ?? planWith(s, id)
  useEffect(() => {
    // Only for someone who has never had a plan: a screen exiting after a cancellation must not start a new one.
    if (!real) update(st => (st.plans.some(p => p.with === id) ? st : startPlan(st, id, proposalsFor(st, id)).s))
  }, [real, id, update])
  const plan: Plan = real ?? { id: '', with: id, status: 'negotiating', options: proposalsFor(s, id), passNo: 'LA-0000' }
  const at = Math.max(0, Math.min(plan.chosen ?? 0, plan.options.length - 1))
  const opt = plan.options[at]
  /** Patch the live plan for this person, looked up inside update so it is never stale. */
  const patch = (fn: (pl: Plan, st: State) => Partial<Plan>) =>
    update(st => { const pl = planWith(st, id); return pl ? patchPlan(st, pl.id, fn(pl, st)) : st })
  const p = PERSONAS[id]
  return { s, update, id, plan, at, opt, v: venue(opt.venueId), p, first: p.first, patch }
}

// ---------- the stylised map: rivers and boroughs in paper tones, venue pins only, never a home ----------

const LAND = [
  'M-60 -60 L31 -60 C32 0 30 22 31 40 C32 56 34 70 31 84 C29 100 28 130 27 160 L-60 160 Z', // the Jersey side
  'M41 2 C47 5 51 13 54 23 C57 33 58 41 55 48 C52 54 47 57 44 54 C38 50 34 43 34 33 C34 22 36.5 10 41 2 Z', // Manhattan
  'M47 -60 L160 -60 L160 6 C130 8 90 9 66 8 C57 7 51 3 48 -4 Z', // the Bronx
  'M62 28 C72 24 90 20 160 18 L160 50 C130 50 100 49 84 50 C74 49 66 47 61 42 C59 38 59 32 62 28 Z', // Queens
  'M57 54 C63 51 74 51 84 52 C100 53 130 52 160 52 L160 160 L42 160 C43 120 44 100 46.5 84 C48 72 52 60 57 54 Z', // Brooklyn
  'M45.5 59.5 a2 1.3 0 1 0 4 0 a2 1.3 0 1 0 -4 0 Z', // a small island
]
const PARKS = ['M41.5 15 L45.5 14 L48 26 L44 27 Z', 'M59 73 L65 72 L66 79 L60 80 Z']
const BRIDGES = ['M51 52 L55.5 56.5', 'M54 49.5 L58 54', 'M56 45 L61.5 51.5']

export type Pin = { x: number; y: number; label: string; name?: string }

export function PlanMap({ pins, active = -1, onPin, height = 200, style }: {
  pins: Pin[]; active?: number; onPin?: (i: number) => void; height?: number; style?: CSSProperties
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const xs = pins.map(p => p.x), ys = pins.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const aspect = 346 / height
  const W = Math.max(maxX - minX + 26, (maxY - minY + 24) * aspect, 46)
  const H = W / aspect
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const u = W / 346 // svg units per css px, so pins and labels stay a constant size
  const mid = { x: xs.reduce((a, b) => a + b, 0) / pins.length, y: ys.reduce((a, b) => a + b, 0) / pins.length }
  return (
    <div className="dt-map" style={{ height, ...style }}>
      <svg viewBox={`${cx - W / 2} ${cy - H / 2} ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%"
        role="img" aria-label={`Map with ${pins.length === 1 ? 'one room' : `${pins.length} rooms`} and your fair middle. Homes are never shown.`}>
        <defs>
          <radialGradient id={`${uid}h`}>
            <stop offset="0" style={{ stopColor: '#d9663a', stopOpacity: 0.42 }} />
            <stop offset="0.55" style={{ stopColor: '#d9663a', stopOpacity: 0.14 }} />
            <stop offset="1" style={{ stopColor: '#d9663a', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <rect x="-60" y="-60" width="220" height="220" className="dt-water" />
        {LAND.map((d, i) => <path key={i} d={d} className="dt-land" strokeWidth={u} />)}
        {PARKS.map((d, i) => <path key={i} d={d} className="dt-park" />)}
        {BRIDGES.map((d, i) => <path key={i} d={d} className="dt-bridge" strokeWidth={u * 1.3} strokeDasharray={`${u * 2.5} ${u * 2}`} />)}
        <motion.circle cx={mid.x} cy={mid.y} r={u * 54} fill={`url(#${uid}h)`}
          animate={{ scale: [1, 1.14, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} />
        {pins.map((p, i) => (
          <motion.g key={i} initial={{ opacity: 0, y: -8 * u }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.12, type: 'spring', damping: 28, stiffness: 260 }}
            onClick={onPin ? () => onPin(i) : undefined} style={{ cursor: onPin ? 'pointer' : undefined }}>
            <circle cx={p.x} cy={p.y} r={u * 22} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={u * 12.5} className={`dt-pin ${i === active ? 'on' : ''}`} strokeWidth={u * 1.4} />
            <text x={p.x} y={p.y + u * 4} textAnchor="middle" fontSize={u * 11} className={`dt-pin-t ${i === active ? 'on' : ''}`}>{p.label}</text>
            {i === active && p.name && (
              <text x={p.x} y={p.y + u * 30} textAnchor="middle" fontSize={u * 13} strokeWidth={u * 4} className="dt-pin-name">{p.name}</text>
            )}
          </motion.g>
        ))}
      </svg>
      <span className="dt-map-n" aria-hidden="true">N</span>
    </div>
  )
}

export const MapLegend = () => (
  <div className="dt-legend">
    <span><i className="dt-lg-pin" />Rooms</span>
    <span><i className="dt-lg-mid" />Your fair middle</span>
    <span>Homes are never shown</span>
  </div>
)

// ---------- small marks ----------

/** Minutes for each person, with the even split marked. */
export function FairBar({ me, them, first }: { me: number; them: number; first: string }) {
  return (
    <div className="stack gap-8">
      <div className="dt-fair" aria-hidden="true"><i className="me" style={{ flex: me }} /><i className="them" style={{ flex: them }} /></div>
      <div className="t-small muted"><span className="t-num">{me}</span> min for you · <span className="t-num">{them}</span> min for {first}</div>
    </div>
  )
}

/** Aura is holding the table: the ring empties over ten minutes. */
export function HoldRing({ left, size = 34, onDark }: { left: number; size?: number; onDark?: boolean }) {
  const r = 15, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-label={left ? `Held for ${clock(left)}` : 'Hold lapsed'} role="img">
      <circle cx="18" cy="18" r={r} fill="none" stroke={onDark ? 'rgba(255,255,255,.28)' : 'var(--line-2)'} strokeWidth="2.2" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={left ? 'var(--ember)' : 'var(--ink-3)'} strokeWidth="2.6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - left / HOLD_MS)} transform="rotate(-90 18 18)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
    </svg>
  )
}

export const SourceChip = ({ children }: { children: string }) => <span className="dt-src">{children}</span>

export const PriceBand = ({ n }: { n: number }) => (
  <span className="t-num" aria-label={`Price band ${n} of 3`}>{'$'.repeat(n)}<span aria-hidden="true" style={{ color: 'var(--line-2)' }}>{'$'.repeat(3 - n)}</span></span>
)

export function DrawCheck({ size = 14, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  )
}

/** A geometric, mirrored code drawn from the pass number. Decorative; the venue reads the pass number. */
export function PassCode({ seed, size = 88 }: { seed: string; size?: number }) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  const rnd = () => ((h = (Math.imul(h, 1664525) + 1013904223) >>> 0) / 2 ** 32)
  const n = 9, cells: [number, number][] = []
  for (let y = 0; y < n; y++) for (let x = 0; x <= 4; x++) {
    if ((x < 2 && y < 2) || (x < 2 && y > 6)) continue // keep the corner marks clear
    if (rnd() > 0.46) { cells.push([x, y]); if (x !== 4) cells.push([n - 1 - x, y]) }
  }
  return (
    <svg width={size} height={size} viewBox="-6 -6 102 102" aria-label="Pass code" role="img">
      <rect x="-4" y="-4" width="98" height="98" rx="6" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
      {[[0, 0], [70, 0], [0, 70], [70, 70]].map(([x, y], i) => (
        <g key={i}><rect x={x + 1} y={y + 1} width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" /><rect x={x + 7} y={y + 7} width="6" height="6" fill="currentColor" /></g>
      ))}
      {cells.map(([x, y], i) => <rect key={i} x={x * 10 + 2.5} y={y * 10 + 2.5} width="5" height="5" fill="currentColor" transform={`rotate(45 ${x * 10 + 5} ${y * 10 + 5})`} />)}
    </svg>
  )
}
