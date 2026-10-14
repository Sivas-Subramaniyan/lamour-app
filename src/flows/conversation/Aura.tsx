// conv/aura: Aura's home (Aura tab root). Hold the orb to talk; Aura answers from live state, cites her sources, and asks before she acts.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, Button, IconButton, Chip, Tag, Toggle, Meter, Eyebrow, AiBadge, Orb, Sheet, useFeedback } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useApp, useNow, CHAPTERS, isDusk, leadId } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { venue } from '../../data/venues'
import { useNav } from '../../shell/nav'
import { useMicLevel, useTranscript, stopSpeaking, haptic } from '../../lib/voice'
import { answerFor, activePlan, nextChapter, yourTurnId, weekday, type AuraAction, type AuraAnswer } from './script'
import { useSpokenReveal, WordReveal, ThinkingDots, useLater } from './shared'

type Exchange = { id: number; q: string; a: AuraAnswer; off: boolean }

export function AuraHome() {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const now = useNow(30000)
  const later = useLater()
  const [holding, setHolding] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [hint, setHint] = useState('')
  const [draft, setDraft] = useState('')
  const [off, setOff] = useState(false)
  const [log, setLog] = useState<Exchange[]>([])
  const [pending, setPending] = useState<AuraAction | null>(null)
  const [sheet, setSheet] = useState(false)
  const mic = useMicLevel(holding)
  const tr = useTranscript()
  const held = useRef(false)
  const heard = useRef('')
  heard.current = `${tr.text} ${tr.interim}`.trim()
  const muted = s.settings.auraMuted

  const ask = (raw: string) => {
    const q = raw.trim()
    if (!q) return
    stopSpeaking()
    setHint('')
    setThinking(true)
    later(() => { setLog(l => [{ id: Date.now(), q, a: answerFor(s, q, now), off }, ...l].slice(0, 6)); setThinking(false) }, 750)
  }

  const begin = () => {
    if (held.current) return
    held.current = true
    stopSpeaking(); haptic(8); setHint(''); setHolding(true)
    if (tr.supported) tr.start()
  }
  const end = () => {
    if (!held.current) return
    held.current = false
    setHolding(false); tr.stop(); setThinking(true)
    later(() => {
      const q = heard.current
      setThinking(false)
      if (q) ask(q)
      else setHint(tr.supported ? 'I didn’t catch that. Hold a little longer, or type below.' : 'Live words aren’t available in this browser. Type below, or tap a suggestion.')
    }, 500)
  }
  const onDown = (e: PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); begin() }
  const onKey = (e: KeyboardEvent, down: boolean) => { if (e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); if (down && !e.repeat) begin(); if (!down) end() }

  const go = (a: AuraAction) => (a.tab ? nav.goTab(a.tab) : a.to && nav.push(a.to, a.params))
  const act = (a: AuraAction) => { if (a.preview) { setPending(a); setSheet(true) } else go(a) }
  const toggleMute = () => {
    if (!muted) stopSpeaking()
    update(st => ({ ...st, settings: { ...st.settings, auraMuted: !muted } }))
    toast(muted ? 'Aura will speak aloud' : 'Aura will stay quiet and write instead')
  }

  // Context-aware suggestions, all read from state
  const tid = yourTurnId(s)
  const lead = PERSONAS[leadId(s)].first
  const plan = activePlan(s)
  const chips: { label: string; icon?: IconName; go: () => void }[] = []
  if (tid) chips.push({ label: `Your turn with ${PERSONAS[tid].first}`, icon: 'message', go: () => nav.push('conn/chat', { id: tid }) })
  if (!isDusk(s)) chips.push({ label: 'When does my letter arrive?', go: () => ask('When does my letter arrive?') })
  else if (!s.tonight.letterOpened) chips.push({ label: 'Open tonight’s letter', icon: 'moon', go: () => nav.goTab('tonight') })
  else chips.push({ label: `Why ${lead}?`, go: () => ask(`Why ${lead}?`) })
  if (plan) {
    const o = plan.options[plan.chosen ?? 0]
    chips.push({ label: `${weekday(o.when)} at ${venue(o.venueId).name}`, icon: 'ticket', go: () => nav.push('dates/pass', { id: plan.with }) })
  }
  chips.push({ label: 'What have you learned about me?', go: () => ask('What have you learned about me?') })

  const done = CHAPTERS.filter(c => s.chapters[c.id] === 'done').length
  const next = nextChapter(s) ?? CHAPTERS.find(c => c.id === 'numbers' && s.chapters.numbers === 'todo')
  const hour = now.getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <Screen
      top={<div className="pad cv-head"><AiBadge /><IconButton icon={muted ? 'speakerOff' : 'speaker'} label={muted ? 'Let Aura speak aloud' : 'Keep Aura quiet'} onClick={toggleMute} /></div>}
      footer={
        <form className="cv-composer" onSubmit={e => { e.preventDefault(); ask(draft); setDraft('') }}>
          <input className="input" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Or type a question" aria-label="Ask Aura" />
          <button type="submit" className="cv-send" disabled={!draft.trim()} aria-label="Ask Aura"><Icon name="send" size={20} /></button>
        </form>
      }>
      <div className="pad stack gap-24" style={{ paddingTop: 8 }}>
        <motion.div className="stack gap-8 center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="t-title balance" style={{ margin: 0 }}>{hello}, <span className="i">{s.me.name}.</span></h1>
          <p className="t-callout muted balance" style={{ margin: 0 }}>Ask about tonight, your plans, or what I’ve learned. I’ll always ask before I act.</p>
        </motion.div>

        <div className="stack center" style={{ alignItems: 'center', gap: 10 }}>
          <button className={`cv-orb ${holding ? 'holding' : ''}`} aria-label="Hold to talk to Aura"
            onPointerDown={onDown} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
            onKeyDown={e => onKey(e, true)} onKeyUp={e => onKey(e, false)} onContextMenu={e => e.preventDefault()}>
            <Orb size={148} level={holding ? Math.min(1, mic.level * 2.2) : 0} />
          </button>
          <div className="cv-orb-caption">
            {holding ? <span className="cv-live">Listening</span> : thinking ? <ThinkingDots /> : <span className="t-small faint">Hold to talk{off ? ' · off the record' : ''}</span>}
          </div>
          <div className="cv-heard-live">
            {holding && heard.current ? <>{tr.text} <span className="faint">{tr.interim}</span></>
              : hint ? <span className="serif i muted" style={{ fontSize: 18 }}>{hint}</span> : null}
          </div>
        </div>

        <div className="row gap-8 wrap" style={{ justifyContent: 'center' }}>
          {chips.map(c => <Chip key={c.label} icon={c.icon} onClick={c.go}>{c.label}</Chip>)}
        </div>

        {log.length > 0 && (
          <div className="stack gap-16">
            <AnimatePresence initial={false}>
              {log.map((x, i) => <AuraCard key={x.id} x={x} live={i === 0} onTry={ask} onAct={act} />)}
            </AnimatePresence>
          </div>
        )}

        <button className="card card-pad stack gap-12 cv-press" style={{ textAlign: 'left', width: '100%' }} onClick={() => nav.push('conv/chapters')}>
          <div className="row between"><Eyebrow>Your conversation with me</Eyebrow><span className="t-num t-small faint">{done} of 7</span></div>
          <div className="serif" style={{ fontSize: 23, lineHeight: 1.2 }}>{next ? <>Next, <span className="i">{next.title.toLowerCase()}</span></> : <span className="i">Every chapter is done</span>}</div>
          <Meter value={done / 7} color="var(--accent)" />
          <div className="row between t-small muted"><span>{next ? `About ${next.mins} minutes. Skip anything.` : 'Correct anything, any time.'}</span><Icon name="chevron" size={18} /></div>
        </button>

        <div className="card-flat card-pad row gap-12" style={{ padding: 16, alignItems: 'flex-start' }}>
          <span className="cv-ico"><Icon name="eyeOff" size={19} /></span>
          <div className="grow stack gap-4">
            <span style={{ fontWeight: 550, fontSize: 15.5 }}>Off the record</span>
            <span className="t-small muted">While this is on, nothing you say here is kept or learned from. Answers still come back to you.</span>
          </div>
          <Toggle on={off} label="Off the record" onChange={v => { setOff(v); toast(v ? 'Off the record. Nothing here is kept.' : 'Back on the record') }} />
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title={pending?.preview?.title}>
        {pending?.preview && (
          <div className="stack gap-20" style={{ paddingBottom: 8 }}>
            <p className="t-quote" style={{ margin: 0 }}>Here’s what I’ll do.</p>
            <div className="stack gap-12">
              {pending.preview.points.map(p => (
                <div key={p} className="row gap-12" style={{ alignItems: 'flex-start' }}>
                  <Icon name="check" size={18} style={{ color: 'var(--sage)', marginTop: 2, flexShrink: 0 }} />
                  <span className="t-callout">{p}</span>
                </div>
              ))}
            </div>
            <div className="stack gap-8">
              <Button kind="ember" block onClick={() => { setSheet(false); go(pending) }}>Go ahead</Button>
              <Button kind="quiet" block onClick={() => setSheet(false)}>Not now</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}

function AuraCard({ x, live, onTry, onAct }: { x: Exchange; live: boolean; onTry: (q: string) => void; onAct: (a: AuraAction) => void }) {
  const { shown, done } = useSpokenReveal(x.a.text, live)
  return (
    <motion.article layout className="card card-aura card-pad stack gap-12"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 260 }}>
      <div className="row between gap-8">
        <span className="t-small faint cv-asked">You asked · “{x.q}”</span>
        {x.off && <Tag icon="eyeOff">Not kept</Tag>}
      </div>
      <p className="cv-aura-text"><WordReveal text={x.a.text} shown={shown} /></p>
      <AnimatePresence>
        {done && (
          <motion.div className="stack gap-12" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            {x.a.points?.map(p => (
              <div key={p.title} className="cv-point stack gap-4">
                <span className="serif" style={{ fontSize: 18.5, lineHeight: 1.25 }}>{p.title}</span>
                <span className="t-small muted">{p.line}</span>
              </div>
            ))}
            {x.a.note && <p className="t-callout muted" style={{ margin: 0 }}>{x.a.note}</p>}
            {x.a.sources.length > 0 && <div className="row gap-8 wrap">{x.a.sources.map(src => <Tag key={src} icon="info">{src}</Tag>)}</div>}
            {x.a.tries && <div className="row gap-8 wrap">{x.a.tries.map(t => <Chip key={t} size="sm" onClick={() => onTry(t)}>{t}</Chip>)}</div>}
            {x.a.actions.length > 0 && (
              <div className="row gap-8 wrap">
                {x.a.actions.map(a => <Button key={a.label} size="sm" kind={a.ember ? 'ember' : 'ghost'} iconRight={a.preview ? undefined : 'chevron'} onClick={() => onAct(a)}>{a.label}</Button>)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
