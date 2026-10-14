// Generative marks.
// Signature: a Chladni figure. Grains jitter in proportion to |f(x,y)| and settle on the nodal lines, so a figure "appears".
// Mode numbers come from traits, so each person's Signature is deterministic. `agitation` (0–1, e.g. live mic level) scatters it.
// Lissajous: the numerology handshake, a curve whose frequency ratio is the two Life Path numbers.
import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { Traits } from '../lib/compat'

export type Modes = [number, number]

export function signatureModes(t: Traits): Modes {
  const n = 1 + Math.round(t.openness * 4)
  const m = n + 1 + Math.round(t.extraversion * 3) + (t.values.indexOf(Math.max(...t.values)) % 2)
  return [n, m]
}

const chladni = (n: number, m: number, x: number, y: number) =>
  Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y)

type Layer = { modes: Modes; color: string }

export function Signature({ layers, size = 260, agitation = 0, grains = 1700, round = true, settle = true }: {
  layers: Layer[] // one layer = one person; two layers = "where you meet"
  size?: number
  agitation?: number // 0–1; live mic level scatters the grains
  grains?: number
  round?: boolean
  settle?: boolean // false keeps it restless (e.g. while listening)
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const agit = useRef(agitation)
  agit.current = agitation
  const key = layers.map(l => l.modes.join('x') + l.color).join('|')

  useEffect(() => {
    const cv = ref.current!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = size * dpr
    cv.height = size * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    const per = Math.floor(grains / layers.length)
    const pts = layers.map(() => Float32Array.from({ length: per * 2 }, () => Math.random()))
    const inside = (x: number, y: number) => !round || (x - 0.5) ** 2 + (y - 0.5) ** 2 < 0.235
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    // Each frame: a damped Newton step toward the nodal line f = 0, plus jitter (more while agitated, a little always so lines stay grainy).
    const step = (k: number) => {
      const jitter = agit.current * 0.06 + (settle ? 0.0025 : 0.01)
      const pull = k * (0.16 * (1 - Math.min(1, agit.current * 1.6)))
      layers.forEach((l, li) => {
        const [n, m] = l.modes
        const nP = n * Math.PI, mP = m * Math.PI
        const a = pts[li]
        for (let i = 0; i < a.length; i += 2) {
          let x = a[i], y = a[i + 1]
          const f = chladni(n, m, x, y)
          const fx = -nP * Math.sin(nP * x) * Math.cos(mP * y) + mP * Math.sin(mP * x) * Math.cos(nP * y)
          const fy = -mP * Math.cos(nP * x) * Math.sin(mP * y) + nP * Math.cos(mP * x) * Math.sin(nP * y)
          const g2 = fx * fx + fy * fy + 1e-6
          const sx = Math.max(-0.03, Math.min(0.03, (-f * fx) / g2)), sy = Math.max(-0.03, Math.min(0.03, (-f * fy) / g2))
          x += sx * pull + (Math.random() - 0.5) * jitter
          y += sy * pull + (Math.random() - 0.5) * jitter
          if (!inside(x, y) || x < 0 || x > 1 || y < 0 || y > 1) { x = Math.random(); y = Math.random() }
          a[i] = x; a[i + 1] = y
        }
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, size, size)
      layers.forEach((l, li) => {
        ctx.fillStyle = l.color
        const a = pts[li]
        for (let i = 0; i < a.length; i += 2) {
          if (!inside(a[i], a[i + 1])) continue
          ctx.fillRect(a[i] * size, a[i + 1] * size, 1.6, 1.6)
        }
      })
    }

    if (reduced) {
      for (let i = 0; i < 220; i++) step(1)
      draw()
      return
    }
    let raf = 0
    const loop = () => { step(1); draw(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [key, size, grains, round, settle])

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-label="Signature: a figure drawn from your traits" role="img" />
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const baseNum = (n: number) => (n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n)

/** Numerology handshake: Lissajous curve at ratio a:b (Life Paths, reduced). */
export function Lissajous({ a, b, size = 220, color = 'var(--accent)', stroke = 1.6, delay = 0.2 }: { a: number; b: number; size?: number; color?: string; stroke?: number; delay?: number }) {
  let x = baseNum(a), y = baseNum(b)
  const g = gcd(x, y)
  x /= g; y /= g
  const N = 900
  const d = Array.from({ length: N + 1 }, (_, i) => {
    const t = (i / N) * Math.PI * 2
    const px = 50 + 44 * Math.sin(x * t + Math.PI / 2)
    const py = 50 + 44 * Math.sin(y * t)
    return `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`
  }).join('')
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Handshake ${x} to ${y}`}>
      <motion.path d={d} fill="none" stroke={color} strokeWidth={stroke * (100 / size) * 1.4} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2.4, delay, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  )
}
export const handshakeRatio = (a: number, b: number) => {
  const x = baseNum(a), y = baseNum(b), g = gcd(x, y)
  return `${x / g}:${y / g}`
}
