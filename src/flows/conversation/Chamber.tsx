// conv/chamber: the voice chamber. Aura asks; your Signature scatters while you speak and settles when you stop.
// speaking -> listening -> thinking -> next. Every step also works by tapping, so a blocked mic never blocks the chapter.
import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, Button, IconButton, ScaleTap, Waveform, Eyebrow, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { Signature, signatureModes } from '../../design/signature'
import { useApp, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { useMicLevel, useTranscript, stopSpeaking, haptic } from '../../lib/voice'
import { useChapterRun, useSpokenReveal, WordReveal, ThinkingDots, useLater, ROMAN } from './shared'

type Phase = 'speaking' | 'listening' | 'thinking'
const join = (...xs: string[]) => xs.map(x => x.trim()).filter(Boolean).join(' ')
export const muteToggle = (st: State): State => ({ ...st, settings: { ...st.settings, auraMuted: !st.settings.auraMuted } })

export function Chamber({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const later = useLater()
  const run = useChapterRun(params)
  const t = run.script[run.turn]
  const open = t.kind === 'open'
  const [phase, setPhase] = useState<Phase>('speaking')
  const [off, setOff] = useState(false)
  const [kept, setKept] = useState('') // words said before an off-the-record hold
  const [typed, setTyped] = useState<string | null>(null) // a sample answer being set down
  const [picked, setPicked] = useState<number>()
  const listening = phase === 'listening'
  const mic = useMicLevel(listening && open && !off && typed === null)
  const tr = useTranscript()
  const askCount = t.ask.split(/\s+/).filter(Boolean).length
  const { shown } = useSpokenReveal(open ? t.ask : `${t.ask} ${t.item}`, phase === 'speaking', () => setPhase('listening'))
  const muted = s.settings.auraMuted

  useEffect(() => {
    if (!listening || !open || off || typed !== null || !tr.supported) return
    tr.start()
    return () => tr.stop()
  }, [listening, open, off, typed === null, run.turn])

  const said = typed ?? (off ? kept : join(kept, tr.text, tr.interim))
  const canSpeak = tr.supported && mic.state !== 'denied' && mic.state !== 'simulated'
  const note = !tr.supported ? 'Live words aren’t available in this browser. Use a sample answer, or write instead.'
    : mic.state === 'denied' ? 'Your microphone is off, so I’ll follow your taps. Use a sample answer, or write instead.'
    : mic.state === 'simulated' ? 'I can’t reach a microphone here, so I’ll follow your taps.' : ''

  const next = () => {
    setPhase('thinking')
    later(() => { setPicked(undefined); setKept(''); setTyped(null); if (run.turn + 1 < run.script.length) setPhase('speaking'); run.advance() }, 1100)
  }
  const submit = (text: string) => { tr.stop(); run.record(run.turn, text); haptic(8); next() }
  const sample = () => {
    if (t.kind !== 'open' || typed !== null || phase === 'thinking') return
    stopSpeaking(); tr.stop(); setKept(''); setTyped(''); setPhase('listening')
    const w = t.sample.split(' ')
    w.forEach((_, i) => later(() => setTyped(w.slice(0, i + 1).join(' ')), 85 * (i + 1)))
    later(() => submit(t.sample), 85 * w.length + 700)
  }
  const pick = (v: number) => {
    if (picked !== undefined) return
    setPicked(v); run.record(run.turn, v); haptic(8)
    later(next, 450)
  }
  const skipAhead = () => { if (phase === 'speaking') { stopSpeaking(); setPhase('listening') } }
  const hold = (on: boolean) => {
    if (on === off) return
    if (on) { setKept(k => join(k, tr.text, tr.interim)); tr.setText(''); haptic(10) }
    setOff(on)
  }
  const holdDown = (e: PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); hold(true) }
  const holdKey = (e: KeyboardEvent, down: boolean) => { if (e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); if (!e.repeat) hold(down) }
  const save = () => {
    run.save()
    toast(run.turn ? `Saved. We’ll pick up at question ${run.turn + 1}.` : 'Saved. Pick this up whenever you like.')
    if (nav.canGoBack) nav.pop()
    else nav.goTab('aura')
  }
  const write = () => nav.replace('conv/text', { chapter: run.chapter, turn: run.turn })

  const agitation = off ? 0 : listening && open && typed === null ? Math.min(1, mic.level * 1.8) : phase === 'thinking' ? 0.1 : 0
  const size = open ? 216 : 148

  return (
    <Screen
      top={
        <div className="pad stack gap-12" style={{ paddingTop: 4 }}>
          <div className="row between">
            <Button kind="quiet" size="sm" icon="back" onClick={save}>Save and finish later</Button>
            <div className="row gap-4">
              <span className="t-num t-small faint">{run.turn + 1} of {run.script.length}</span>
              <IconButton icon={muted ? 'speakerOff' : 'speaker'} label={muted ? 'Let Aura speak aloud' : 'Keep Aura quiet'} onClick={() => { if (!muted) stopSpeaking(); update(muteToggle) }} />
            </div>
          </div>
          <div className="stack gap-8" style={{ alignItems: 'center' }}>
            <Eyebrow>Chapter {ROMAN[run.index]} · {run.meta.title}</Eyebrow>
            <div className="cv-progress" aria-hidden>{run.script.map((_, i) => <i key={i} className={i < run.turn ? 'on' : i === run.turn ? 'now' : ''} />)}</div>
          </div>
        </div>
      }
      footer={
        <div className="stack gap-8">
          {open && (
            <>
              {canSpeak
                ? <Button kind="primary" block disabled={!listening || !said || typed !== null} onClick={() => submit(said)}>That’s my answer</Button>
                : <Button kind="primary" block disabled={typed !== null || phase === 'thinking'} onClick={sample}>Use a sample answer</Button>}
              <div className="row between">
                {canSpeak ? <Button kind="quiet" size="sm" icon="sparkle" disabled={typed !== null || phase === 'thinking'} onClick={sample}>Use a sample answer</Button> : <span />}
                <Button kind="quiet" size="sm" icon="feather" onClick={write}>Write instead</Button>
              </div>
            </>
          )}
          {!open && <div className="row" style={{ justifyContent: 'center' }}><Button kind="quiet" size="sm" icon="feather" onClick={write}>Write instead</Button></div>}
        </div>
      }>
      <div className="pad stack gap-12" style={{ paddingTop: 10 }}>
        <button className="cv-q-wrap" onClick={skipAhead} aria-label={phase === 'speaking' ? 'Show the whole question' : undefined}>
          <p className="cv-q" style={{ opacity: phase === 'thinking' ? 0.4 : 1 }}>
            <WordReveal text={t.ask} shown={Math.min(shown, askCount)} />
          </p>
        </button>

        <div className="cv-stage" style={{ height: size + 16 }}>
          <motion.div className="cv-stage-glow" animate={{ scale: agitation ? 1 + agitation * 0.45 : 1, opacity: off ? 0.15 : 1 }} transition={{ duration: 0.15 }} />
          <div style={{ opacity: off ? 0.25 : 1, transition: 'opacity .5s' }}>
            <Signature layers={[{ modes: signatureModes(s.me.traits), color: '#efb08a' }]} size={size} agitation={agitation} grains={open ? 1700 : 1100} />
          </div>
          <AnimatePresence>
            {off && (
              <motion.div className="cv-off" initial={{ opacity: 0, scaleY: 0.6 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <Icon name="eyeOff" size={18} /> Off the record. Nothing is kept.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="cv-state" aria-live="polite">
          {off ? null
            : phase === 'speaking' ? <span className="row gap-8 t-small faint"><Waveform bars={14} height={16} level={0.6} color="var(--ember)" />Aura is speaking</span>
            : phase === 'thinking' ? <ThinkingDots />
            : !open ? <span className="t-small faint">Tap the number that fits</span>
            : typed !== null ? <span className="t-small faint">Sample answer</span>
            : mic.state === 'live' ? <span className="cv-live">Mic live</span>
            : mic.state === 'idle' ? <span className="t-small faint">Opening your microphone</span>
            : <span className="t-small faint">Following your taps</span>}
        </div>

        {open ? (
          <div className="stack gap-12" style={{ alignItems: 'center' }}>
            {phase !== 'speaking' && (
              <div className="cv-transcript">
                {typed !== null ? <>{typed}<span className="cv-caret" /></>
                  : said ? <>{off ? kept : join(kept, tr.text)} {!off && <span className="interim">{tr.interim}</span>}</>
                  : <span className="serif i faint" style={{ fontSize: 19 }}>Take your time. I’m listening.</span>}
              </div>
            )}
            {listening && note && <p className="t-small faint center balance" style={{ margin: 0 }}>{note}</p>}
            {canSpeak && (
              <button className={`cv-hold ${off ? 'on' : ''}`} onPointerDown={holdDown} onPointerUp={() => hold(false)} onPointerCancel={() => hold(false)}
                onLostPointerCapture={() => hold(false)} onKeyDown={e => holdKey(e, true)} onKeyUp={e => holdKey(e, false)} onContextMenu={e => e.preventDefault()}>
                <Icon name="eyeOff" size={16} />{off ? 'Release to go back on the record' : 'Hold for off the record'}
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {(shown > askCount || phase !== 'speaking') && (
              <motion.div className="cv-item-wrap stack gap-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                <p className="cv-item">{t.item}</p>
                <ScaleTap points={7} value={picked} onChange={pick} left="Disagree strongly" right="Agree strongly" />
                <p className="t-small faint center" style={{ margin: 0 }}>
                  {t.validated ? 'Read exactly as written so it can be scored.' : 'A house statement. There are no right answers.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </Screen>
  )
}
