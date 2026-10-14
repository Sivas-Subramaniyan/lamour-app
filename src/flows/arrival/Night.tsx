// The candlelit arrival screens: splash, manifesto, member card, meeting Aura.
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react'
import { Screen, TopBar, Button, Eyebrow, IconButton, AiBadge, Orb, Waveform, useFeedback } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { Signature, signatureModes } from '../../design/signature'
import { useApp, CHAPTERS, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { speak, chime, haptic } from '../../lib/voice'
import { EASE, Rise, useLater, memberNo } from './parts'

// ---------- arrival/splash ----------

const VOWS = ['No swiping. Ever.', 'No feed.', 'At most three people a night.']

export function Splash() {
  const { s } = useApp()
  const nav = useNav()
  return (
    <Screen bleed scroll={false} className="arr-splash">
      <div className="arr-sky" />
      <motion.div className="arr-drift" initial={{ opacity: 0 }} animate={{ opacity: 1, x: [-16, 18, -16], y: [0, -18, 0], rotate: [0, 5, 0] }}
        transition={{ opacity: { duration: 2.4 }, default: { duration: 30, repeat: Infinity, ease: 'easeInOut' } }}>
        <Signature layers={[{ modes: signatureModes(s.me.traits), color: 'rgba(240, 180, 143, 0.6)' }]} size={440} grains={1500} />
      </motion.div>
      <div className="arr-horizon" />

      <div className="arr-splash-body">
        <Rise delay={0.2} className="center"><span className="t-label faint">New York · by invitation</span></Rise>
        <div className="grow" />
        <div className="stack gap-12" style={{ alignItems: 'center', textAlign: 'center' }}>
          <motion.h1 className="arr-wordmark" initial={{ opacity: 0, y: 18, letterSpacing: '0.06em' }} animate={{ opacity: 1, y: 0, letterSpacing: '-0.02em' }} transition={{ duration: 1.8, ease: EASE }}>
            L’Amour
          </motion.h1>
          <Rise delay={0.9}><p className="t-quote arr-tagline">Be heard before you’re seen.</p></Rise>
        </div>
        <motion.ul className="arr-vows" initial="h" animate="v" variants={{ v: { transition: { staggerChildren: 0.2, delayChildren: 1.4 } } }} aria-label="Our promises">
          {VOWS.map(v => (
            <motion.li key={v} variants={{ h: { opacity: 0, y: 8 }, v: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}>{v}</motion.li>
          ))}
        </motion.ul>
        <div className="grow" />
        <Rise delay={2.1} className="stack gap-12">
          <Button block onClick={() => nav.push('arrival/manifesto')}>Request an invitation</Button>
          <Button block kind="ghost" onClick={() => nav.push('arrival/invite', { have: '1' })}>I have an invitation</Button>
          <button className="arr-skip" onClick={() => nav.goTab('tonight')}>Skip to the app</button>
        </Rise>
      </div>
    </Screen>
  )
}

// ---------- arrival/manifesto ----------

const RULES = [
  { n: 'I', title: 'Three Chairs', line: 'At most three open conversations at a time. When your table is full, introductions pause until a chair is free.' },
  { n: 'II', title: 'Your Turn', line: 'You have 48 hours to reply. If the moment passes, the conversation lapses kindly, with a note instead of a silence.' },
  { n: 'III', title: 'Close kindly', line: 'No disappearing. Ending things takes one tap and a short, honest note.' },
  { n: 'IV', title: 'Aura writes about you, never as you', line: 'She introduces you, briefs you and plans the evening. Every word you send is yours, and anything she drafts is labeled.' },
  { n: 'V', title: 'Your data, your call', line: 'Raw audio is deleted within 24 hours. You can see, correct or forget anything Aura knows about you.' },
]

export function Manifesto() {
  const nav = useNav()
  return (
    <Screen top={<TopBar />} footer={<Button kind="commit" block onClick={() => nav.push('arrival/invite')}>I’ll keep to these</Button>}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <Rise className="stack gap-12">
          <Eyebrow>The etiquette</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Five house rules, <span className="i">kept kindly.</span></h1>
          <p className="t-body muted pretty" style={{ margin: 0 }}>L’Amour is small on purpose. These are what make it feel different, and every member keeps them.</p>
        </Rise>
        <div>
          {RULES.map((r, i) => (
            <motion.div key={r.n} className="arr-rule" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 + i * 0.12, ease: EASE }}>
              <span className="arr-numeral">{r.n}</span>
              <span className="serif" style={{ fontSize: 23, lineHeight: 1.15 }}>{r.title}</span>
              <span className="t-callout muted pretty">{r.line}</span>
            </motion.div>
          ))}
        </div>
        <Rise delay={1} className="center stack gap-8" style={{ padding: '4px 8px 12px' }}>
          <p className="t-quote balance" style={{ margin: 0 }}>Three people you’ll remember, rather than three hundred you won’t.</p>
        </Rise>
      </div>
    </Screen>
  )
}

// ---------- arrival/member ----------

export function Member() {
  const { s } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const later = useLater()
  const [inWallet, setInWallet] = useState(false)
  const rx = useMotionValue(0), ry = useMotionValue(0)
  const sx = useSpring(rx, { damping: 28, stiffness: 180 }), sy = useSpring(ry, { damping: 28, stiffness: 180 })
  useEffect(() => { later(() => { if (!s.settings.auraMuted) chime(); haptic([10, 40, 10]) }, 1300) }, [])
  const tilt = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 14)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12)
  }
  const issued = new Date('2026-10-14T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <Screen top={<TopBar />} footer={<Button kind="ember" block onClick={() => nav.push('arrival/meet-aura')}>Meet Aura</Button>}>
      <div className="pad stack gap-24" style={{ paddingTop: 8 }}>
        <div className="stack gap-12 center" style={{ alignItems: 'center' }}>
          <Rise><Eyebrow>Welcome to L’Amour</Eyebrow></Rise>
          <Rise delay={0.15}><h1 className="t-display" style={{ margin: 0 }}>You’re <span className="i">in.</span></h1></Rise>
        </div>

        <div className="arr-card-stage" onPointerMove={tilt} onPointerLeave={() => { rx.set(0); ry.set(0) }}>
          <div className="arr-glow" />
          <motion.div style={{ width: '100%', display: 'grid', placeItems: 'center' }}
            initial={{ opacity: 0, rotateX: 48, y: 40, scale: 0.92 }} animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }} transition={{ duration: 1.4, delay: 0.35, ease: EASE }}>
            <motion.div className="arr-mcard" style={{ rotateX: sx, rotateY: sy }} aria-label={`Member card for ${s.me.name}, number ${memberNo(s)}`}>
              <motion.div className="arr-sheen" initial={{ left: '-60%' }} animate={{ left: '130%' }} transition={{ duration: 1.5, delay: 1.6, ease: 'easeInOut' }} />
              <div className="arr-mcard-sig"><Signature layers={[{ modes: signatureModes(s.me.traits), color: 'rgba(142, 42, 42, 0.75)' }]} size={64} grains={520} /></div>
              <div className="arr-deboss serif" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>L’Amour</div>
              <div className="stack gap-4">
                <div className="arr-deboss serif" style={{ fontSize: 34, lineHeight: 1 }}>{s.me.name || 'Member'}</div>
                <div className="arr-deboss t-num" style={{ fontSize: 12, letterSpacing: '0.08em' }}>MEMBER NO. {memberNo(s)} · {s.me.city.toUpperCase()}</div>
              </div>
              <div className="row between arr-deboss" style={{ fontSize: 11.5 }}>
                <span>Issued {issued}</span>
                <span className="serif i" style={{ fontSize: 15 }}>by invitation</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <Rise delay={1.2} className="stack gap-16" style={{ alignItems: 'center' }}>
          <p className="t-callout muted center pretty" style={{ margin: 0, maxWidth: 300 }}>
            Your card lives in You. It carries your number and your Signature, never your surname.
          </p>
          <Button kind="soft" size="md" icon={inWallet ? 'check' : 'wallet'} onClick={() => { setInWallet(true); toast(inWallet ? 'Already in your Wallet' : 'Added to Wallet') }}>
            {inWallet ? 'In your Wallet' : 'Add to Wallet'}
          </Button>
        </Rise>
      </div>
    </Screen>
  )
}

// ---------- arrival/meet-aura ----------

type Voice = State['me']['voice']
const SAMPLE: Record<Voice, (n: string) => string> = {
  Warm: n => `Hello, ${n}. I’m Aura. Take your time. I’m listening.`,
  Bright: n => `Hi, ${n}. I’m Aura. Tell me about a good Sunday, and we’ll go from there.`,
  Low: n => `Good evening, ${n}. I’m Aura. Whenever you’re ready.`,
}
const VOICES: { v: Voice; line: string }[] = [{ v: 'Warm', line: 'Unhurried' }, { v: 'Bright', line: 'Quick, light' }, { v: 'Low', line: 'Late-night' }]
const MODES: { v: State['me']['mode']; icon: IconName; title: string; line: string }[] = [
  { v: 'voice', icon: 'mic', title: 'Speak', line: 'Talk with Aura out loud. Captions are always on.' },
  { v: 'text', icon: 'edit', title: 'Write', line: 'Type instead. Same questions, at your pace.' },
  { v: 'quiet', icon: 'hand', title: 'Quiet', line: 'Push to talk. Aura only listens while you hold.' },
]

export function MeetAura() {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const later = useLater()
  const name = s.me.name || 'there'
  const [line, setLine] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [level, setLevel] = useState(0)
  const tok = useRef(0) // the latest sample wins when voices are tapped quickly
  const muted = s.settings.auraMuted
  const totalMins = CHAPTERS.reduce((a, c) => a + c.mins, 0)

  useEffect(() => {
    if (!speaking) { setLevel(0); return }
    let raf = 0
    const t0 = performance.now()
    const loop = (t: number) => { const k = (t - t0) / 1000; setLevel(0.35 + 0.25 * Math.sin(k * 7) * Math.sin(k * 2.3) + 0.15 * Math.sin(k * 13)); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [speaking])

  const sample = (v: Voice) => {
    update(st => ({ ...st, me: { ...st.me, voice: v } }))
    const text = SAMPLE[v](name)
    setLine(text)
    setSpeaking(true)
    const my = ++tok.current, t0 = Date.now()
    speak(text, { voice: v, muted }).then(() => later(() => { if (tok.current === my) setSpeaking(false) }, Math.max(0, 2400 - (Date.now() - t0))))
  }
  useEffect(() => { later(() => sample(s.me.voice), 900) }, [])

  const begin = () => { update(st => ({ ...st, onboarded: true })); nav.reset('conv/chapters') }

  return (
    <Screen
      top={<TopBar right={<IconButton icon={muted ? 'speakerOff' : 'speaker'} label={muted ? 'Let Aura speak aloud' : 'Mute Aura'}
        onClick={() => { update(st => ({ ...st, settings: { ...st.settings, auraMuted: !muted } })); toast(muted ? 'Aura will speak aloud' : 'Aura is muted. Captions stay on.') }} />} />}
      footer={<div className="stack gap-8">
        <Button kind="ember" block onClick={begin}>Begin the First Conversation</Button>
        <span className="t-small faint center">About {totalMins} minutes across {CHAPTERS.length} chapters. Stop whenever you like.</span>
      </div>}>
      <div className="pad stack gap-24">
        <div className="arr-orb-stage">
          <div className="arr-glow" style={{ width: 300, height: 300 }} />
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, ease: EASE }}>
            <Orb size={132} level={level} />
          </motion.div>
        </div>
        <div className="stack gap-12 center" style={{ alignItems: 'center', marginTop: -12 }}>
          <Rise delay={0.3}><h1 className="t-title" style={{ margin: 0 }}>This is <span className="i">Aura.</span></h1></Rise>
          <div className="arr-caption" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p key={line} className="t-quote muted balance" style={{ margin: 0, fontSize: 19 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                {line || 'She’ll talk with you, write you a letter at dusk, and plan the evenings you say yes to.'}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <section className="stack gap-12">
          <Eyebrow>Her voice</Eyebrow>
          <div className="arr-voices">
            {VOICES.map(({ v, line: l }) => {
              const on = s.me.voice === v
              return (
                <button key={v} className={`arr-voice ${on ? 'on' : ''}`} onClick={() => sample(v)} aria-pressed={on}>
                  <span style={{ height: 22, display: 'grid', placeItems: 'center', color: on ? 'var(--accent)' : 'var(--ink-3)' }}>
                    {on && speaking ? <Waveform level={0.6} bars={9} height={22} /> : <Icon name="play" size={18} />}
                  </span>
                  <span className="serif" style={{ fontSize: 21, lineHeight: 1 }}>{v}</span>
                  <span className="t-small faint">{l}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="stack gap-12">
          <Eyebrow>How you’d like to talk</Eyebrow>
          <div className="stack gap-8">
            {MODES.map(m => {
              const on = s.me.mode === m.v
              return (
                <button key={m.v} className={`arr-option ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => update(st => ({ ...st, me: { ...st.me, mode: m.v } }))}>
                  <span className="arr-option-ico"><Icon name={m.icon} size={19} /></span>
                  <span className="grow stack gap-4"><span style={{ fontWeight: 600 }}>{m.title}</span><span className="t-small muted">{m.line}</span></span>
                  <span className="arr-radio"><i /></span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="card-flat stack gap-8" style={{ padding: 16 }}>
          <AiBadge text="Aura · AI concierge" />
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Aura is an AI. Raw audio is deleted within 24 hours. Go off the record any time.</p>
        </div>
      </div>
    </Screen>
  )
}
