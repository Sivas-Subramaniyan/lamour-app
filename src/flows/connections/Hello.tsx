// conn/hello: a twenty-second voice hello. Hold to record with live captions, release to stop, listen back, send.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, IconButton, Button, Waveform, Portrait, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { PERSONAS } from '../../data/personas'
import { useApp, leadId, send } from '../../state/store'
import { useMicLevel, useTranscript, haptic } from '../../lib/voice'
import type { ScreenProps } from '../../shell/screens'
import { useNav } from '../../shell/nav'
import { clock, ensureConn, plusHours, turnTo, useLeave, usePlayback, useStamp, VoiceNote, voiceOf } from './kit'
import { bridgeFor, nextReply } from './copy'

const MAX = 20
const R = 92, C = 2 * Math.PI * R

export function Hello({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const fb = useFeedback()
  const at = useStamp()
  const leave = useLeave()
  const id = leadId(s, params)
  const p = PERSONAS[id]
  const play = usePlayback()

  const [mode, setMode] = useState<'idle' | 'rec' | 'done'>('idle')
  const [secs, setSecs] = useState(0)
  const [micOn, setMicOn] = useState(false)
  const mic = useMicLevel(micOn)
  const tr = useTranscript()
  const rec = useRef(false)
  const t0 = useRef(0)
  const tick = useRef(0)
  useEffect(() => () => clearInterval(tick.current), [])

  const page = p.pages.find(x => x.text !== '…')
  const sample = `Hi ${p.first}, it’s ${s.me.name}. ${page ? `I liked your page about ${page.label.toLowerCase()}, and I’d love the longer version.` : 'I’ve been looking forward to saying hello.'} Talk soon.`
  const live = `${tr.text} ${tr.interim}`.trim()
  const caption = live || sample

  function start() {
    if (rec.current) return
    play.stop()
    rec.current = true
    setMicOn(true); setMode('rec'); setSecs(0)
    t0.current = performance.now()
    tr.start()
    haptic(10)
    tick.current = window.setInterval(() => {
      const e = (performance.now() - t0.current) / 1000
      if (e >= MAX) stop(); else setSecs(e)
    }, 100)
  }
  function stop() {
    if (!rec.current) return
    rec.current = false
    clearInterval(tick.current)
    tr.stop()
    setMicOn(false)
    const e = Math.min(MAX, (performance.now() - t0.current) / 1000)
    if (e < 1) { setMode('idle'); setSecs(0); fb.toast('Hold a little longer to record'); return }
    setSecs(e); setMode('done'); haptic(8)
  }
  function redo() { play.stop(); setMode('idle'); setSecs(0) }

  function sendHello() {
    const t = at()
    const n = Math.max(1, Math.round(secs))
    update(st => send(ensureConn(st, id, t), id, { from: 'me', kind: 'voice', secs: n, text: caption }, t))
    fb.toast('Hello sent')
    // They answer a little later, wherever you are in the app.
    const said = (s.messages[id] ?? []).filter(m => m.from === 'them').map(m => m.text)
    window.setTimeout(() => { const t1 = at(); update(st => turnTo(send(st, id, { from: 'them', kind: 'text', text: nextReply(id, said) }, t1), id, plusHours(t1, 48))) }, 6500)
    nav.replace('conn/chat', { id })
  }

  const level = mode === 'rec' ? mic.level : 0

  return (
    <Screen
      top={<TopBar left={<IconButton icon="close" label="Close" onClick={leave('conn/chat', { id })} />} title="A voice hello" />}
      footer={
        <div className="stack gap-8">
          <Button kind="commit" block icon="send" disabled={mode !== 'done'} onClick={sendHello}>Send hello</Button>
          {mode === 'done' && <Button kind="quiet" block icon="refresh" onClick={redo}>Record again</Button>}
        </div>
      }>
      <div className="pad stack gap-24 center" style={{ alignItems: 'center', paddingTop: 4 }}>
        <div className="stack gap-12" style={{ alignItems: 'center' }}>
          <Portrait photo={p.photos.portrait} name={p.first} shape="arch" w={64} h={80} />
          <h1 className="t-title balance" style={{ margin: 0 }}>Say hello to {p.first}<span className="i">, in your own voice.</span></h1>
          <p className="t-callout muted balance" style={{ margin: 0 }}>Twenty seconds at most. A voice lands warmer than a paragraph.</p>
        </div>

        {/* The recorder */}
        <div className="cn-rec-wrap" style={{ width: 220, height: 220 }}>
          <div className="cn-rec-glow" style={{ transform: `scale(${1 + level * 0.6})`, opacity: mode === 'rec' ? 0.9 : 0.35 }} />
          <svg width="220" height="220" viewBox="0 0 220 220" className="cn-ring" aria-hidden="true">
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--line)" strokeWidth="2" />
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" transform="rotate(-90 110 110)"
              strokeDasharray={C} strokeDashoffset={C * (1 - secs / MAX)} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
          </svg>
          <button className={`cn-rec ${mode === 'rec' ? 'on' : ''}`} aria-label={mode === 'rec' ? 'Recording. Release to stop' : 'Hold to record'}
            onPointerDown={e => { e.preventDefault(); if (mode === 'done') return; e.currentTarget.setPointerCapture(e.pointerId); start() }} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
            onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && mode !== 'done') { e.preventDefault(); rec.current ? stop() : start() } }}
            onContextMenu={e => e.preventDefault()} disabled={mode === 'done'}>
            {mode === 'done' ? <Icon name="check" size={34} stroke={1.8} /> : <Icon name="mic" size={34} stroke={1.6} />}
          </button>
        </div>
        <div className="stack gap-4" style={{ alignItems: 'center', minHeight: 44 }}>
          <span className="t-num" style={{ fontSize: 22 }}>{clock(secs)}<span className="faint"> / 0:20</span></span>
          <span className="t-small faint">{mode === 'idle' ? 'Hold to record · release to stop' : mode === 'rec' ? 'Recording · release when you’re done' : 'Listen back before you send'}</span>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'rec' && (
            <motion.div key="live" className="stack gap-12" style={{ width: '100%', alignItems: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Waveform level={level} bars={34} height={34} color="var(--accent)" />
              <p className="serif i balance" style={{ fontSize: 20, margin: 0, minHeight: 52 }}>
                {tr.text}{tr.interim && <span className="faint"> {tr.interim}</span>}
                {!live && <span className="faint">{tr.supported ? 'Listening…' : 'Captions aren’t available in this browser. Your hello still records.'}</span>}
              </p>
            </motion.div>
          )}
          {mode === 'done' && (
            <motion.div key="review" className="card card-pad stack gap-12" style={{ width: '100%', textAlign: 'left' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <VoiceNote k="hello" text={caption} secs={Math.max(1, Math.round(secs))} voice={voiceOf(s.me.gender)} play={play} />
              <span className="t-label faint">{p.first} will read this as captions</span>
              <span className="serif i" style={{ fontSize: 18, lineHeight: 1.35 }}>“{caption}”</span>
              {!live && <span className="t-small faint">{mic.state === 'denied' ? 'Your microphone is off, so this is a practice take with sample words.' : 'We didn’t catch words this time, so a sample stands in for the caption.'}</span>}
            </motion.div>
          )}
          {mode === 'idle' && (
            <motion.div key="idea" className="stack gap-8" style={{ width: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="t-label faint">If you need a way in</span>
              <span className="serif i balance" style={{ fontSize: 19, lineHeight: 1.35 }}>{bridgeFor(p)[0]}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {s.discreet.veil && (
          <div className="row gap-8 t-small muted" style={{ justifyContent: 'center' }}><Icon name="eyeOff" size={16} />Your photos stay soft for now. They come into focus as you both reply.</div>
        )}
      </div>
    </Screen>
  )
}
