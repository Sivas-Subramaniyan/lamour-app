// tonight/letter: the sealed letter. Hold to break the seal; the letter unfolds and Aura reads the preface.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, Button, IconButton, Eyebrow, WaxSeal } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, goToPhase, PHASE_TIME, SUNSET } from '../../state/store'
import { useNav } from '../../shell/nav'
import { PERSONAS } from '../../data/personas'
import { speak, stopSpeaking, chime, haptic } from '../../lib/voice'
import { ROMAN, editionDate } from './parts'

const HOLD_MS = 1200
const PREFACE = 'Three people tonight. One I’m sure about, one I’m curious about, and one wildcard.'
const ROLES = ['The one I’m sure about', 'The one I’m curious about', 'My wildcard']
const EASE = [0.22, 1, 0.36, 1] as const

/** A deckled paper edge: a polygon with a soft, deterministic tremor on every side. */
const DECKLE = (() => {
  const j = (i: number, k: number) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1
  const n = 26, pts: string[] = []
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${Math.abs(j(i, 1)) * 0.9}%`)
  for (let i = 0; i <= n; i++) pts.push(`${100 - Math.abs(j(i, 2)) * 1.4}% ${(i / n) * 100}%`)
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - Math.abs(j(i, 3)) * 0.9}%`)
  for (let i = n; i >= 0; i--) pts.push(`${Math.abs(j(i, 4)) * 1.4}% ${(i / n) * 100}%`)
  return `polygon(${pts.join(',')})`
})()

const CRACK = '52,0 46,22 55,41 45,60 53,79 48,100'
const HALF_L = 'polygon(0 0, 52% 0, 46% 22%, 55% 41%, 45% 60%, 53% 79%, 48% 100%, 0 100%)'
const HALF_R = 'polygon(52% 0, 100% 0, 100% 100%, 48% 100%, 53% 79%, 45% 60%, 55% 41%, 46% 22%)'

export function Letter() {
  const { s, update } = useApp()
  const nav = useNav()
  const already = useRef(s.tonight.letterOpened).current
  const [stage, setStage] = useState<'sealed' | 'breaking' | 'open'>(already ? 'open' : 'sealed')
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const raf = useRef(0)
  const t0 = useRef(0)
  const timers = useRef<number[]>([])
  const muted = s.settings.auraMuted
  useEffect(() => () => { cancelAnimationFrame(raf.current); timers.current.forEach(clearTimeout) }, [])

  const readAloud = () => speak(PREFACE, { voice: s.me.voice, muted: s.settings.auraMuted })

  const breakSeal = () => {
    haptic([18, 40, 26])
    chime()
    setStage('breaking')
    update(st => { const n = st.phase === 'afternoon' ? goToPhase(st, 'dusk') : st; return { ...n, tonight: { ...n.tonight, letterOpened: true } } })
    timers.current.push(window.setTimeout(() => setStage('open'), 750), window.setTimeout(readAloud, 2100))
  }

  const begin = () => {
    if (stage !== 'sealed' || holding) return
    setHolding(true)
    haptic(8)
    t0.current = performance.now()
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0.current) / HOLD_MS)
      setProgress(p)
      if (p >= 1) { setHolding(false); breakSeal(); return }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  const end = () => {
    if (!holding) return
    cancelAnimationFrame(raf.current)
    setHolding(false)
    setProgress(0)
  }

  const toggleVoice = () => {
    if (!muted) stopSpeaking()
    update(st => ({ ...st, settings: { ...st.settings, auraMuted: !muted } }))
  }

  const C = 2 * Math.PI * 70
  return (
    <Screen className="tn-ink"
      top={
        <div className="topbar">
          <div className="grow" style={{ paddingLeft: 10 }}><Eyebrow>Edition No. {s.tonight.edition} · L’Heure Bleue</Eyebrow></div>
          <IconButton icon={muted ? 'speakerOff' : 'speaker'} label={muted ? 'Let Aura read aloud' : 'Mute Aura'} onClick={toggleVoice} />
        </div>
      }
      footer={stage === 'open' ? (
        <motion.div className="stack gap-4" initial={already ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: already ? 0 : 2.2, duration: 0.7, ease: EASE }}>
          <Button kind="ember" block iconRight="chevron" onClick={() => nav.replace('tonight/deck')}>Read tonight’s letter</Button>
          <Button kind="quiet" block icon="speaker" onClick={readAloud}>Hear Aura’s preface</Button>
        </motion.div>
      ) : undefined}>
      <div className="pad stack" style={{ alignItems: 'center', paddingTop: 8, minHeight: '100%' }}>
        <AnimatePresence mode="wait" initial={false}>
          {stage !== 'open' ? (
            <motion.div key="env" className="stack gap-24" style={{ alignItems: 'center', width: '100%' }}
              exit={{ opacity: 0, y: 40, scale: 0.96, transition: { duration: 0.45, ease: EASE } }}>
              <div className="tn-masthead-ink center">
                <div className="t-small faint">{editionDate(PHASE_TIME.dusk)} · New York · Sunset {SUNSET}</div>
              </div>

              <div className="tn-env-wrap">
                <motion.div className="tn-paper tn-envelope" style={{ clipPath: DECKLE }} initial={already ? false : { y: -30, opacity: 0, rotate: -2 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ duration: 1.2, ease: EASE }}>
                  <svg className="tn-flap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 L50 46 L100 0" fill="none" stroke="var(--line-2)" strokeWidth=".6" vectorEffect="non-scaling-stroke" /></svg>
                  <div className="tn-env-address stack gap-4">
                    <span className="t-label faint">For</span>
                    <span className="serif i" style={{ fontSize: 34, lineHeight: 1 }}>{s.me.name}</span>
                    <span className="t-small faint">Three introductions, chosen at dusk</span>
                  </div>
                  <div className="tn-env-foot row between t-small faint"><span>L’Amour · New York</span><span className="t-num">No. {s.tonight.edition}</span></div>
                </motion.div>

                <button className={`tn-seal ${holding ? 'holding' : ''}`} aria-label="Hold to break the seal"
                  onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); begin() }}
                  onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onContextMenu={e => e.preventDefault()}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin() } }}
                  onKeyUp={e => { if (e.key === 'Enter' || e.key === ' ') end() }}>
                  <svg className="tn-seal-ring" viewBox="0 0 160 160" aria-hidden="true">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(243,235,224,.14)" strokeWidth="1.5" />
                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 80 80)" style={{ transition: holding ? 'none' : 'stroke-dashoffset .45s var(--ease-out)' }} />
                  </svg>
                  {stage === 'sealed' ? (
                    <motion.div style={{ position: 'relative' }} animate={{ scale: 1 + progress * 0.06, rotate: holding ? [0, -1.2, 1.2, 0] : 0 }} transition={holding ? { rotate: { repeat: Infinity, duration: 0.18 } } : { duration: 0.3 }}>
                      <WaxSeal text="L’A" size={112} pressed={!already} />
                      <svg viewBox="0 0 100 100" width="112" height="112" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
                        <polyline points={CRACK} fill="none" stroke="rgba(30,4,4,.75)" strokeWidth="1.3" pathLength={1}
                          strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, (progress - 0.35) / 0.65)} />
                      </svg>
                    </motion.div>
                  ) : (
                    <div style={{ position: 'relative', width: 112, height: 112 }}>
                      {[{ clip: HALF_L, x: -54, r: -26 }, { clip: HALF_R, x: 54, r: 22 }].map((h, i) => (
                        <motion.div key={i} style={{ position: 'absolute', inset: 0, clipPath: h.clip }}
                          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }} animate={{ x: h.x, y: 34, rotate: h.r, opacity: 0 }} transition={{ duration: 0.95, ease: EASE }}>
                          <WaxSeal text="L’A" size={112} pressed={false} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </button>
              </div>

              <div className="stack gap-4 center" style={{ alignItems: 'center' }}>
                <span className="row gap-8 t-callout" style={{ fontWeight: 550 }}><Icon name="hand" size={18} /> Hold to break the seal</span>
                <span className="t-small faint">Press and keep holding for a moment</span>
              </div>
            </motion.div>
          ) : (
            <OpenLetter key="letter" animate={!already} />
          )}
        </AnimatePresence>
      </div>
    </Screen>
  )
}

function OpenLetter({ animate }: { animate: boolean }) {
  const { s } = useApp()
  const nav = useNav()
  const member = s.me.tier !== 'invitation'
  const words = PREFACE.split(' ')
  const d = (x: number) => (animate ? x : 0)
  return (
    <div className="tn-env-wrap" style={{ width: '100%' }}>
      <motion.div style={{ transformOrigin: 'top center' }}
        initial={animate ? { clipPath: 'inset(0% 0% 92% 0%)', y: 24, rotateX: 18 } : false}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)', y: 0, rotateX: 0 }} transition={{ duration: 1.4, ease: EASE }}>
        <div className="tn-paper tn-letter stack gap-16" style={{ clipPath: DECKLE }}>
          <motion.i className="tn-crease" style={{ top: '33%' }} initial={animate ? { opacity: 0.8 } : false} animate={{ opacity: 0.28 }} transition={{ delay: 0.9, duration: 1.2 }} />
          <motion.i className="tn-crease" style={{ top: '66%' }} initial={animate ? { opacity: 0.8 } : false} animate={{ opacity: 0.28 }} transition={{ delay: 0.9, duration: 1.2 }} />
          <div className="row between" style={{ alignItems: 'baseline' }}>
            <span className="serif" style={{ fontSize: 26, letterSpacing: '-0.01em' }}>L’Amour</span>
            <span className="t-label faint">Edition No. {s.tonight.edition}</span>
          </div>
          <div className="t-small faint" style={{ marginTop: -10 }}>{editionDate(PHASE_TIME.dusk)} · New York · Sunset {SUNSET}</div>
          <hr className="hairline" />
          <span className="serif i" style={{ fontSize: 21 }}>Dear {s.me.name},</span>
          <p className="t-quote" style={{ margin: 0, fontSize: 25, lineHeight: 1.28 }} aria-label={PREFACE}>
            {words.map((w, i) => (
              <motion.span key={i} aria-hidden="true" initial={animate ? { opacity: 0, filter: 'blur(4px)' } : false} animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: d(1.15 + i * 0.07), duration: 0.6 }}>{w} </motion.span>
            ))}
          </p>
          <ol className="tn-toc">
            {s.tonight.ids.slice(0, 3).map((id, i) => {
              const p = PERSONAS[id]
              const veiled = !member && i > 0
              return (
                <motion.li key={id} initial={animate ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: d(2 + i * 0.18), duration: 0.6, ease: EASE }}>
                  <button className="tn-toc-row" onClick={() => { if (veiled) return nav.push('premium/paywall', { reason: 'letter' }); nav.replace('tonight/deck'); nav.push('tonight/dossier', { id }) }}>
                    <span className="tn-numeral">{ROMAN[i]}</span>
                    <span className="grow stack" style={{ gap: 2 }}>
                      <span className="serif" style={{ fontSize: 21, lineHeight: 1.1 }}>{veiled ? <span className="row gap-8"><Icon name="lock" size={15} /> Sealed for Soirée</span> : `${p.first}, ${p.hood}`}</span>
                      <span className="t-small faint i">{ROLES[i]}</span>
                    </span>
                  </button>
                </motion.li>
              )
            })}
          </ol>
          <span className="serif i muted" style={{ fontSize: 18 }}>Read slowly. Nothing closes before dusk tomorrow.</span>
          <span className="serif i" style={{ fontSize: 20, alignSelf: 'flex-end' }}>Aura</span>
        </div>
      </motion.div>
    </div>
  )
}
