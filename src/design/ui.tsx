// Shared primitives. Every flow builds from these + tokens.css classes. Never use position:fixed — the app lives inside the phone.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon, type IconName } from './icons'
import { useNav } from '../shell/nav'
import type { Band as BandName } from '../lib/compat'
import type { ScreenId } from '../shell/screens'
import type { Photo } from '../data/photos'

// ---------- Screen scaffolding ----------

/** Full-screen surface. Put a <TopBar/> in `top`, content as children (scrolls), sticky CTAs in `footer`. */
export function Screen({ children, top, footer, scroll = true, style, className = '', bleed = false }: {
  children: ReactNode; top?: ReactNode; footer?: ReactNode; scroll?: boolean; style?: CSSProperties; className?: string
  bleed?: boolean // true = content starts under the status bar (for full-bleed hero images)
}) {
  return (
    <div className={`screen ${className}`} style={style}>
      {!bleed && <div className="screen-pad-top" />}
      {top}
      <div className={scroll ? 'screen-scroll' : 'grow stack'} style={scroll ? undefined : { overflow: 'hidden' }}>
        {children}
        {scroll && !footer && <div className="screen-pad-bottom" />}
      </div>
      {footer && <div className="screen-footer">{footer}</div>}
    </div>
  )
}

export function TopBar({ title, back, right, left, onBack }: {
  title?: ReactNode; back?: boolean; right?: ReactNode; left?: ReactNode; onBack?: () => void
}) {
  const nav = useNav()
  const showBack = back ?? nav.canGoBack
  return (
    <div className="topbar">
      <div className="topbar-side">
        {left ?? (showBack && <IconButton icon="back" label="Back" onClick={onBack ?? nav.pop} />)}
      </div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side right">{right}</div>
    </div>
  )
}

// ---------- Controls ----------

type BtnKind = 'primary' | 'commit' | 'ember' | 'ghost' | 'soft' | 'quiet' | 'danger'
/** primary = neutral action · commit = a human commitment (lean in, seal, send) · ember = an Aura action or ceremony */
export function Button({ children, kind = 'primary', size = 'lg', block, icon, iconRight, onClick, disabled, style, type = 'button' }: {
  children?: ReactNode; kind?: BtnKind; size?: 'lg' | 'md' | 'sm'; block?: boolean; icon?: IconName; iconRight?: IconName
  onClick?: () => void; disabled?: boolean; style?: CSSProperties; type?: 'button' | 'submit'
}) {
  return (
    <button type={type} className={`btn btn-${kind} ${size !== 'lg' ? `btn-${size}` : ''} ${block ? 'btn-block' : ''}`} onClick={onClick} disabled={disabled} style={style}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 19} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 19} />}
    </button>
  )
}

export function IconButton({ icon, label, onClick, variant, size = 22, style }: {
  icon: IconName; label: string; onClick?: () => void; variant?: 'filled' | 'glass'; size?: number; style?: CSSProperties
}) {
  return (
    <button className={`icon-btn ${variant ?? ''}`} aria-label={label} title={label} onClick={onClick} style={style}>
      <Icon name={icon} size={size} />
    </button>
  )
}

export function Chip({ children, on, onClick, size, icon }: { children: ReactNode; on?: boolean; onClick?: () => void; size?: 'sm'; icon?: IconName }) {
  return (
    <button className={`chip ${on ? 'on' : ''} ${size ?? ''}`} onClick={onClick} aria-pressed={on}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  )
}

export function Tag({ children, tone, icon }: { children: ReactNode; tone?: 'ember' | 'sage' | 'dark'; icon?: IconName }) {
  return <span className={`tag ${tone ?? ''}`}>{icon && <Icon name={icon} size={13} stroke={2} />}{children}</span>
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

/** A 5- or 7-point tap scale for validated items read verbatim. */
export function ScaleTap({ points = 7, value, onChange, left, right }: { points?: 5 | 7; value?: number; onChange: (v: number) => void; left: string; right: string }) {
  return (
    <div className="stack gap-8">
      <div className="scale">
        {Array.from({ length: points }, (_, i) => (
          <button key={i} className={value === i + 1 ? 'on' : ''} onClick={() => onChange(i + 1)} aria-label={`${i + 1} of ${points}`}>{i + 1}</button>
        ))}
      </div>
      <div className="row between t-small faint"><span>{left}</span><span>{right}</span></div>
    </div>
  )
}

export function ListRow({ icon, title, sub, right, onClick, chevron = !!onClick }: {
  icon?: IconName; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; chevron?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="list-row" onClick={onClick}>
      {icon && <span className="ico"><Icon name={icon} size={20} /></span>}
      <span className="grow stack gap-4">
        <span style={{ fontWeight: 550, fontSize: 15.5 }}>{title}</span>
        {sub && <span className="t-small muted">{sub}</span>}
      </span>
      {right}
      {chevron && <Icon name="chevron" size={18} style={{ color: 'var(--ink-3)' }} />}
    </Tag>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="t-label faint">{label}</span>
      {children}
      {hint && <span className="t-small faint">{hint}</span>}
    </label>
  )
}

// ---------- Type helpers ----------

export const Eyebrow = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => <div className="t-label faint" style={style}>{children}</div>
export const Hairline = ({ style }: { style?: CSSProperties }) => <hr className="hairline" style={style} />

export function Section({ label, children, action, style }: { label?: ReactNode; children: ReactNode; action?: ReactNode; style?: CSSProperties }) {
  return (
    <section className="stack gap-12" style={style}>
      {(label || action) && <div className="row between"><Eyebrow>{label}</Eyebrow>{action}</div>}
      {children}
    </section>
  )
}

/** Persistent AI disclosure. */
export const AiBadge = ({ text = 'Aura · AI concierge' }: { text?: string }) => <span className="ai-badge">{text}</span>

// ---------- Media ----------

export function Portrait({ photo, name = '', shape = 'arch', w, h, style, priority }: {
  photo?: Photo | string; name?: string; shape?: 'arch' | 'circle' | 'rect'; w: number | string; h: number | string; style?: CSSProperties; priority?: boolean
}) {
  const p = typeof photo === 'string' ? { url: photo, alt: name } : photo
  const [failed, setFailed] = useState(false)
  return (
    <div className={`portrait ${shape}`} style={{ width: w, height: h, ...style }}>
      {p?.url && !failed
        ? <img src={p.url} alt={p.alt || name} loading={priority ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
        : <div className="portrait-fallback">{name.slice(0, 1)}</div>}
    </div>
  )
}

export function PairAvatars({ a, b, size = 44 }: { a: { photo?: Photo | string; name: string }; b: { photo?: Photo | string; name: string }; size?: number }) {
  return (
    <div className="row" style={{ width: size * 1.7 }}>
      <Portrait photo={a.photo} name={a.name} shape="circle" w={size} h={size} style={{ boxShadow: '0 0 0 2.5px var(--bg)' }} />
      <Portrait photo={b.photo} name={b.name} shape="circle" w={size} h={size} style={{ marginLeft: -size * 0.3, boxShadow: '0 0 0 2.5px var(--bg)' }} />
    </div>
  )
}

/** Verified Halo: ring segments for liveness selfie, ID 18+ token, work. */
export function Halo({ v, size, children }: { v: { selfie: boolean; id: boolean; work: boolean }; size: number; children: ReactNode }) {
  const segs = [v.selfie, v.id, v.work]
  const r = 48, c = 2 * Math.PI * r, gap = 6, len = c / 3 - gap
  return (
    <div className="halo-wrap" style={{ width: size, height: size }}>
      {children}
      <svg viewBox="0 0 100 100" aria-label={`Verified: ${segs.filter(Boolean).length} of 3`}>
        {segs.map((on, i) => (
          <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={on ? 'var(--sage)' : 'var(--line-2)'} strokeWidth="2.2"
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-i * (len + gap) + c / 4} strokeLinecap="round" />
        ))}
      </svg>
    </div>
  )
}

/** Waveform: pass `level` (0–1) for live audio, or nothing for a gentle idle shimmer; `seed` gives a static voice-note shape. */
export function Waveform({ level, bars = 28, seed, color, height = 32, progress }: { level?: number; bars?: number; seed?: number; color?: string; height?: number; progress?: number }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (seed !== undefined) return
    let raf = 0
    const loop = () => { setT(x => x + 1); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [seed])
  return (
    <div className="wave" style={{ color: color ?? 'currentColor', height }}>
      {Array.from({ length: bars }, (_, i) => {
        const base = seed !== undefined
          ? 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + seed) * Math.cos(i * 0.6 + seed * 2))
          : 0.18 + (level ?? 0.15) * (0.6 + 0.4 * Math.sin(t / 5 + i * 0.9)) * (0.5 + 0.5 * Math.sin(i * 2.1))
        const played = progress !== undefined && i / bars <= progress
        return <i key={i} style={{ height: `${Math.max(10, Math.min(100, base * 100))}%`, opacity: progress === undefined || played ? 1 : 0.35 }} />
      })}
    </div>
  )
}

/** Aura's mark: an ember orb. `level` (0–1) swells it with live audio. */
export function Orb({ size = 64, level = 0, style }: { size?: number; level?: number; style?: CSSProperties }) {
  return <div className="orb" style={{ width: size, height: size, transform: `scale(${1 + level * 0.18})`, transition: 'transform 90ms linear', ...style }}><i /></div>
}

// ---------- Compatibility display ----------

const BAND_DOTS: Record<BandName, number> = { Strong: 3, Promising: 2, Exploratory: 1 }
/** Bands, never percentages. Confidence shown as "how well Aura knows you two". */
export function BandMark({ band, confidence, compact }: { band: BandName; confidence?: number; compact?: boolean }) {
  return (
    <div className="stack gap-8">
      <div className="row gap-8">
        <div className="row gap-4">{[1, 2, 3].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: 9, background: i <= BAND_DOTS[band] ? 'var(--accent)' : 'var(--line-2)' }} />)}</div>
        <span className={compact ? 't-label' : 'serif'} style={compact ? undefined : { fontSize: 24 }}>{band}</span>
      </div>
      {confidence !== undefined && !compact && (
        <div className="t-small muted">{confidence >= 0.75 ? 'Aura knows you both well' : confidence >= 0.6 ? 'Aura knows you well · still learning them' : 'Still learning · finish a chapter to sharpen this'}</div>
      )}
    </div>
  )
}

/** The arc of a connection: Introduced → Hello → Voice Hour → Sealed → Met → Debriefed. */
export const ARC_STEPS = ['Introduced', 'Hello', 'Voice Hour', 'Sealed', 'Met', 'Debriefed'] as const
export function ArcRail({ at, labels }: { at: number; labels?: boolean }) {
  return (
    <div className="stack gap-8">
      <div className="arc" aria-label={`Step ${at + 1} of ${ARC_STEPS.length}: ${ARC_STEPS[at]}`}>
        {ARC_STEPS.map((_, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className={`arc-thread ${i <= at ? 'done' : ''}`} />}
            <span className={`arc-knot ${i < at ? 'done' : i === at ? 'now' : ''}`} />
          </span>
        ))}
      </div>
      {labels && <div className="row between t-small faint" style={{ fontSize: 11 }}>{ARC_STEPS.map(s => <span key={s}>{s}</span>)}</div>}
    </div>
  )
}

export function Meter({ value, color, style }: { value: number; color?: string; style?: CSSProperties }) {
  return <div className="meter" style={style}><i style={{ width: `${Math.round(value * 100)}%`, background: color }} /></div>
}

// ---------- Overlays ----------

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="sheet" role="dialog" aria-modal="true"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={(_, i) => { if (i.offset.y > 120) onClose() }}>
            <div className="sheet-handle" />
            {title && <div className="pad row between" style={{ paddingTop: 6, paddingBottom: 6 }}><div className="t-head">{title}</div><IconButton icon="close" label="Close" onClick={onClose} /></div>}
            <div className="sheet-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** Countdown text to a target time, relative to the demo clock passed in. */
export function Countdown({ to, now, prefix = '', done = 'now' }: { to: string | Date; now: Date; prefix?: string; done?: string }) {
  const ms = new Date(to).getTime() - now.getTime()
  if (ms <= 0) return <span>{done}</span>
  const h = Math.floor(ms / 3600e3), m = Math.floor((ms % 3600e3) / 60e3), s = Math.floor((ms % 60e3) / 1e3)
  return <span className="t-num">{prefix}{h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`}</span>
}

export function EmptyState({ icon, title, body, action }: { icon?: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div style={{ width: 56, height: 56, borderRadius: 20, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', color: 'var(--ink-2)' }}><Icon name={icon} size={26} /></div>}
      <div className="t-head balance">{title}</div>
      {body && <div className="t-callout muted balance">{body}</div>}
      {action}
    </div>
  )
}

/** Wax seal with a monogram (e.g. "A·K"). `pressed` animates the press. */
export function WaxSeal({ text, size = 120, pressed = true }: { text: string; size?: number; pressed?: boolean }) {
  const pts = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2, r = 46 + (i % 2 ? 2.8 : -1.5) + Math.sin(i * 2.3) * 1.6
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`
  }).join(' ')
  return (
    <motion.svg width={size} height={size} viewBox="0 0 100 100" initial={pressed ? { scale: 1.6, opacity: 0, rotate: -12 } : false}
      animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }} aria-label={`Seal ${text}`}>
      <defs>
        <radialGradient id="wax" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#c0453c" /><stop offset=".55" stopColor="#8e2a2a" /><stop offset="1" stopColor="#5a1515" /></radialGradient>
      </defs>
      <polygon points={pts} fill="url(#wax)" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(255,220,200,.28)" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(40,5,5,.35)" strokeWidth="1" />
      <text x="50" y="57" textAnchor="middle" fontFamily="Instrument Serif, serif" fontSize="22" fill="#f6d5c4" fontStyle="italic">{text}</text>
    </motion.svg>
  )
}

// ---------- Feedback: toasts and in-phone push banners ----------

type Banner = { id: number; title: string; body: string; onOpen?: () => void }
const FeedbackCtx = createContext<{ banner: (b: Omit<Banner, 'id'>) => void; toast: (text: string) => void }>(null!)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [b, setB] = useState<Banner | null>(null)
  const [t, setT] = useState<{ id: number; text: string } | null>(null)
  const timer = useRef<number>(0)
  const banner = useCallback((x: Omit<Banner, 'id'>) => {
    setB({ ...x, id: Date.now() })
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setB(null), 4800)
  }, [])
  const toast = useCallback((text: string) => {
    const id = Date.now()
    setT({ id, text })
    setTimeout(() => setT(x => (x?.id === id ? null : x)), 2600)
  }, [])
  return (
    <FeedbackCtx.Provider value={{ banner, toast }}>
      {children}
      <AnimatePresence>
        {b && (
          <motion.button key={b.id} className="banner" initial={{ y: -120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }} onClick={() => { setB(null); b.onOpen?.() }}>
            <span className="app-ico"><Orb size={20} /></span>
            <span className="grow stack" style={{ gap: 1 }}>
              <span className="row between"><b style={{ fontSize: 14 }}>{b.title}</b><span style={{ fontSize: 12, opacity: 0.55 }}>now</span></span>
              <span style={{ fontSize: 14, lineHeight: 1.35, opacity: 0.85 }}>{b.body}</span>
            </span>
          </motion.button>
        )}
        {t && (
          <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            style={{ position: 'absolute', left: 20, right: 20, bottom: 'calc(var(--safe-bottom, 34px) + var(--tabbar-h, 0px) + 20px)', zIndex: 110, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ background: '#17130f', color: '#fbf3ea', padding: '11px 18px', borderRadius: 999, fontSize: 14.5, boxShadow: '0 12px 30px -10px rgba(0,0,0,.5)' }}>{t.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackCtx.Provider>
  )
}
export const useFeedback = () => useContext(FeedbackCtx)

/** Go to a screen from inside a notification/banner without importing nav in data code. */
export type Link = { screen: ScreenId; params?: Record<string, any> }
