// conn/voice-hour: ten minutes, audio only. Two Signatures as presence: yours moves with your live mic, theirs with their voice.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, IconButton, Button, Chip, Sheet, Eyebrow, useFeedback } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { Signature, signatureModes } from '../../design/signature'
import { PERSONAS } from '../../data/personas'
import { useApp, send } from '../../state/store'
import { useMicLevel } from '../../lib/voice'
import type { ScreenProps } from '../../shell/screens'
import { useNav } from '../../shell/nav'
import { chatId, clock, ensureConn, useStamp } from './kit'
import { promptsFor } from './copy'

const DURATION = 600

export function VoiceHour({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const fb = useFeedback()
  const at = useStamp()
  const id = chatId(s, params)
  const p = PERSONAS[id]

  const [left, setLeft] = useState(DURATION)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(true)
  const [ended, setEnded] = useState(false)
  const [their, setTheir] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)
  const [pi, setPi] = useState(0)
  const started = useRef(performance.now())
  const done = useRef(false)
  const mic = useMicLevel(!muted && !ended)
  const mine = muted ? 0 : mic.level
  const mineRef = useRef(0)
  mineRef.current = mine
  const prompts = promptsFor(s.me.traits.interests, p.traits.interests)

  // The clock, and a simulated other voice that takes turns and goes quiet while you speak.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (done.current) return
      const e = (performance.now() - started.current) / 1000
      const l = DURATION - e
      if (l <= 0) { done.current = true; setLeft(0); setEnded(true); return }
      setLeft(l)
      const theirTurn = Math.floor(e / 7) % 2 === 1
      setTheir(theirTurn && mineRef.current < 0.18 ? 0.22 + 0.4 * Math.abs(Math.sin(e * 6.1) * Math.sin(e * 2.3)) : 0.03)
    }, 90)
    return () => clearInterval(t)
  }, [])

  function end() { done.current = true; setTheir(0); setEnded(true) }
  function finish(feel: 'easy' | 'warm' | 'not' | null) {
    const mins = Math.max(1, Math.round((DURATION - left) / 60))
    const t = at()
    update(st => send(ensureConn(st, id, t), id, { from: 'aura', kind: 'system', text: `Voice Hour · ${mins} min` }, t))
    if (feel === 'not') { fb.toast('Thank you for giving it a real chance'); nav.replace('conn/exit', { id }) }
    else { fb.toast(feel ? 'Noted. Only you can see how it felt.' : 'Voice Hour saved to your conversation'); nav.replace('conn/chat', { id }) }
  }

  const speaking = !ended && (mine > 0.18 ? 'me' : their > 0.15 ? 'them' : null)
  const nextPrompt = () => setPi(i => (i + 1) % prompts.length)

  return (
    <Screen scroll={false}
      top={<TopBar left={<IconButton icon="close" label="End" onClick={end} />} title="Voice Hour"
        right={<IconButton icon="flag" label="Report" onClick={() => nav.push('conn/report', { id })} />} />}>
      <div className="pad stack grow" style={{ alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'calc(var(--safe-bottom, 34px) + 12px)' }}>
        <div className="stack gap-4 center" style={{ alignItems: 'center' }}>
          <span className="t-num" style={{ fontSize: 44, letterSpacing: '-0.02em' }}>{clock(left)}</span>
          <span className="t-small faint">{ended ? 'Ended' : 'Audio only · end any time'}</span>
        </div>

        <div className="cn-presence">
          {[
            { key: 'me', name: 'You', modes: signatureModes(s.me.traits), color: '#efb08a', level: mine, note: muted ? 'Muted' : mic.state === 'denied' ? 'Mic off · simulated' : '' },
            { key: 'them', name: p.first, modes: signatureModes(p.traits), color: '#d49a8a', level: their, note: speaker ? '' : 'Speaker off' },
          ].map(x => (
            <div key={x.key} className="stack gap-8" style={{ alignItems: 'center' }}>
              <div className={`cn-sig ${speaking === x.key ? 'on' : ''}`}>
                <Signature layers={[{ modes: x.modes, color: x.color }]} size={132} grains={900} agitation={Math.min(1, x.level * 1.6)} />
              </div>
              <span className="serif" style={{ fontSize: 20 }}>{x.name}</span>
              <span className="t-small faint" style={{ minHeight: 18 }}>{x.note || (speaking === x.key ? 'Speaking' : '')}</span>
            </div>
          ))}
          <motion.i className="cn-thread" animate={{ opacity: 0.25 + Math.min(0.75, (mine + their) * 1.2) }} transition={{ duration: 0.2 }} />
        </div>

        <div style={{ width: '100%', minHeight: 132, display: 'grid', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            {showPrompt ? (
              <motion.div key={pi} className="cn-prompt" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.7}
                onDragEnd={(_, i) => { if (Math.abs(i.offset.x) > 70) nextPrompt() }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <div className="row between"><Eyebrow>{prompts[pi].why}</Eyebrow><IconButton icon="close" label="Hide prompts" size={16} onClick={() => setShowPrompt(false)} /></div>
                <span className="serif i" style={{ fontSize: 21, lineHeight: 1.3 }}>{prompts[pi].text}</span>
                <button className="t-small faint" style={{ textAlign: 'left' }} onClick={nextPrompt}>Swipe or tap for another · {pi + 1} of {prompts.length}</button>
              </motion.div>
            ) : (
              <motion.div key="ask" className="center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button kind="ghost" size="sm" icon="sparkle" onClick={() => setShowPrompt(true)}>Show a prompt</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="cn-controls">
          <Ctl icon={muted ? 'micOff' : 'mic'} label={muted ? 'Unmute' : 'Mute'} on={muted} onClick={() => setMuted(m => !m)} />
          <Ctl icon={speaker ? 'speaker' : 'speakerOff'} label="Speaker" on={!speaker} onClick={() => setSpeaker(v => !v)} />
          <button className="cn-end" onClick={end}><Icon name="hand" size={20} />End kindly</button>
          <Ctl icon="flag" label="Report" onClick={() => nav.push('conn/report', { id })} />
        </div>
      </div>

      <Sheet open={ended} onClose={() => finish(null)} title="How was that?">
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          <p className="t-callout muted" style={{ margin: 0 }}>Just for you. {p.first} won’t see your answer, and it helps Aura plan what comes next.</p>
          <div className="row gap-8 wrap">
            <Chip onClick={() => finish('easy')}>Easy to talk to</Chip>
            <Chip onClick={() => finish('warm')}>Warm, a little shy</Chip>
            <Chip onClick={() => finish('not')}>Not quite for me</Chip>
          </div>
        </div>
      </Sheet>
    </Screen>
  )
}

function Ctl({ icon, label, on, onClick }: { icon: IconName; label: string; on?: boolean; onClick: () => void }) {
  return (
    <button className={`cn-ctl ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} aria-label={label}>
      <span className="cn-ctl-ico"><Icon name={icon} size={22} /></span>
      <span className="t-small" style={{ fontSize: 11.5 }}>{label}</span>
    </button>
  )
}
