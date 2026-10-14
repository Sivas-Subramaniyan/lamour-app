// Small pieces shared by the arrival screens.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { TopBar } from '../../design/ui'
import type { State } from '../../state/store'

export const EASE = [0.22, 1, 0.36, 1] as const

/** Editorial rise-in. */
export function Rise({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  return (
    <motion.div className={className} style={style} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: EASE }}>
      {children}
    </motion.div>
  )
}

const STEPS = 6
/** Top bar with the six onboarding steps as quiet marks (invite → verify). */
export function StepBar({ n, right }: { n: number; right?: ReactNode }) {
  return (
    <TopBar right={right} title={
      <span className="arr-steps" role="img" aria-label={`Step ${n} of ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}
      </span>
    } />
  )
}

/** setTimeout that is cleared when the screen unmounts. */
export function useLater() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach(clearTimeout), [])
  return useCallback((fn: () => void, ms: number) => { ids.current.push(window.setTimeout(fn, ms)) }, [])
}

/** Eased count from `from` to `to`, starting on mount. */
export function useCountTo(to: number, from: number, ms = 1400) {
  const [n, setN] = useState(from)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setN(Math.round(from + (to - from) * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, from, ms])
  return n
}

/** Merge into s.me.you (the shared bag for profile extras). */
export const withYou = (s: State, patch: Record<string, any>): State => ({ ...s, me: { ...s.me, you: { ...s.me.you, ...patch } } })

export const memberNo = (s: State) => String(s.me.memberNo).padStart(5, '0')

// A mock camera roll: painted stand-ins (SVG data URIs) so an added photo renders anywhere a URL is expected.
const paint = (a: string, b: string, shapes: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/>${shapes}</svg>`)}`

export const ROLL: { label: string; url: string }[] = [
  { label: 'Studio, Sunday', url: paint('#efe1cf', '#c79b7c', '<rect y="300" width="300" height="100" fill="#8a5a43" opacity=".55"/><path d="M118 170c-18 34-20 82 2 130h60c22-48 20-96 2-130z" fill="#6f3f2c"/><ellipse cx="150" cy="170" rx="33" ry="9" fill="#4f2a1d"/><path d="M196 236c-8 16-8 40 2 64h36c10-24 10-48 2-64z" fill="#a8664a"/>') },
  { label: 'Market at noon', url: paint('#d9dcc4', '#8e9a72', '<rect y="270" width="300" height="130" fill="#6b5a3a" opacity=".5"/><circle cx="90" cy="260" r="34" fill="#c2452a"/><circle cx="150" cy="250" r="30" fill="#e0a43a"/><circle cx="205" cy="265" r="32" fill="#7a8a3a"/><circle cx="125" cy="300" r="28" fill="#b8562e"/><circle cx="185" cy="305" r="30" fill="#d38b3c"/>') },
  { label: 'Rooftop at dusk', url: paint('#2a1a33', '#d9663a', '<rect x="0" y="280" width="60" height="120" fill="#1a1016"/><rect x="55" y="240" width="45" height="160" fill="#22141c"/><rect x="100" y="300" width="70" height="100" fill="#1a1016"/><rect x="165" y="220" width="40" height="180" fill="#22141c"/><rect x="205" y="270" width="95" height="130" fill="#1a1016"/><circle cx="220" cy="120" r="16" fill="#f6c38f" opacity=".8"/>') },
  { label: 'The kiln', url: paint('#3a241b', '#1c120d', '<circle cx="150" cy="210" r="120" fill="#d9663a" opacity=".25"/><circle cx="150" cy="210" r="70" fill="#f08a52" opacity=".55"/><circle cx="150" cy="210" r="34" fill="#ffd2a6" opacity=".85"/><rect x="40" y="330" width="220" height="12" rx="6" fill="#5a3426"/>') },
  { label: 'Museum bench', url: paint('#e6e1d8', '#b9b1a3', '<path d="M90 320V170a60 60 0 0 1 120 0v150z" fill="#f4f0e8"/><rect x="70" y="330" width="160" height="14" fill="#6b6055"/><rect x="82" y="344" width="8" height="30" fill="#6b6055"/><rect x="210" y="344" width="8" height="30" fill="#6b6055"/>') },
  { label: 'Dinner for four', url: paint('#f3e7d3', '#d8b98f', '<ellipse cx="150" cy="300" rx="110" ry="30" fill="#8e2a2a" opacity=".2"/><path d="M80 250h140a70 50 0 0 1-140 0z" fill="#fbf6ee"/><path d="M80 250h140" stroke="#a57a3f" stroke-width="3"/><path d="M130 200c-8-14 8-22 0-36M160 200c-8-14 8-22 0-36" stroke="#a57a3f" stroke-width="3" fill="none" opacity=".6"/>') },
]
