// conn/exit and conn/report: two ways to leave the table. Kindly, with a note. Or safely, with a person reviewing.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, IconButton, Button, Segmented, Portrait, Toggle, Eyebrow, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { PERSONAS } from '../../data/personas'
import { useApp, planWith, send, fmtTime } from '../../state/store'
import type { ScreenProps } from '../../shell/screens'
import { useNav } from '../../shell/nav'
import { chatId, closeWith, useLeave, useStamp, weekdayLong } from './kit'
import { closingNotes } from './copy'

type Tone = 'warm' | 'brief' | 'honest'

export function Exit({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const fb = useFeedback()
  const at = useStamp()
  const leave = useLeave()
  const id = chatId(s, params)
  const p = PERSONAS[id]
  const notes = closingNotes(p.first)
  const [tone, setTone] = useState<Tone>('warm')
  const [text, setText] = useState(notes.warm)
  const [own, setOwn] = useState(false)
  const plan = planWith(s, id)
  const planWhen = plan?.chosen !== undefined && plan.status !== 'done' ? plan.options[plan.chosen].when : undefined

  function pick(t: Tone) { setTone(t); setText(notes[t]); setOwn(false) }
  function edit(v: string) { setText(v); if (!v.trim()) setOwn(true) }
  function close() {
    const t = at()
    update(st => closeWith(send(st, id, { from: 'me', kind: 'text', text: text.trim(), ...(own ? {} : { assisted: true }) }, t), id, 'kind'))
    fb.toast('You left the table gracefully. A chair is free.')
    nav.reset('conn/table')
  }

  return (
    <Screen top={<TopBar left={<IconButton icon="close" label="Close" onClick={leave('conn/chat', { id })} />} title="Close kindly" />}
      footer={
        <div className="stack gap-8">
          <Button kind="commit" block disabled={!text.trim()} onClick={close}>Send and close</Button>
          <Button kind="quiet" block onClick={leave('conn/chat', { id })}>Not now</Button>
        </div>
      }>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <header className="row gap-16" style={{ alignItems: 'flex-end' }}>
          <Portrait photo={p.photos.portrait} name={p.first} shape="arch" w={68} h={86} style={{ filter: 'saturate(.8)' }} />
          <div className="stack gap-4">
            <h1 className="t-title" style={{ margin: 0 }}>Close kindly<span className="i">, with {p.first}.</span></h1>
          </div>
        </header>
        <p className="t-callout muted" style={{ margin: 0 }}>A short, honest note beats a slow fade. Choose a starting point, then make it yours.</p>

        <Segmented value={tone} onChange={pick} options={[{ value: 'warm', label: 'Warm' }, { value: 'brief', label: 'Brief' }, { value: 'honest', label: 'Honest' }]} />

        <div className="stack gap-8">
          <span className="row gap-4 t-small" style={{ color: own ? 'var(--ink-3)' : 'var(--ember)', fontWeight: 600 }}>
            <Icon name={own ? 'edit' : 'sparkle'} size={14} />{own ? 'In your words' : 'Drafted with Aura · edit freely'}
          </span>
          <AnimatePresence mode="wait">
            <motion.textarea key={tone} className="input cn-note" value={text} onChange={e => edit(e.target.value)} rows={6} aria-label="Your note"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
          </AnimatePresence>
        </div>

        <div className="card-flat card-pad stack gap-12" style={{ padding: 16 }}>
          <span className="row gap-8 t-callout" style={{ fontWeight: 550 }}><Icon name="shieldCheck" size={18} style={{ color: 'var(--sage)' }} />They’ll see a kind note, not a disappearing chat.</span>
          <span className="t-small muted">Your chair frees up tonight. Theirs does too, and Aura gives them a gentle word of her own.</span>
          {planWhen && <span className="t-small muted">Your plan for {weekdayLong(planWhen)} at {fmtTime(planWhen)} will be released, and the table let go with notice.</span>}
        </div>
      </div>
    </Screen>
  )
}

const REASONS = ['Made me uncomfortable', 'Pressured me to move off the app', 'Not who they said they were', 'Rude or hostile', 'Asked for money', 'Something else']

export function Report({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const fb = useFeedback()
  const leave = useLeave()
  const id = chatId(s, params)
  const p = PERSONAS[id]
  const [reason, setReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [block, setBlock] = useState(true)

  function submit(reported: boolean) {
    update(st => {
      const n = closeWith(st, id, reported ? 'reported' : 'blocked')
      return block || !reported ? { ...n, discreet: { ...n.discreet, blocked: n.discreet.blocked + 1 } } : n
    })
    fb.toast(reported ? 'Thank you. A person will review this within 24 hours.' : `${p.first} is blocked. A chair is free.`)
    nav.reset('conn/table')
  }

  return (
    <Screen top={<TopBar left={<IconButton icon="close" label="Close" onClick={leave('conn/chat', { id })} />} title="Report or block" />}
      footer={
        <div className="stack gap-8">
          <Button kind="primary" block disabled={!reason} onClick={() => submit(true)}>{block ? 'Report and block' : 'Send report'}</Button>
          <Button kind="quiet" block onClick={() => submit(false)}>Block without reporting</Button>
        </div>
      }>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <header className="stack gap-8">
          <Eyebrow>About {p.first}</Eyebrow>
          <h1 className="t-title" style={{ margin: 0 }}>Tell us what happened<span className="i">, briefly is fine.</span></h1>
        </header>

        <div className="stack" role="radiogroup" aria-label="Reason">
          {REASONS.map(r => (
            <button key={r} role="radio" aria-checked={reason === r} className="cn-reason" onClick={() => setReason(r)}>
              <span className="t-body">{r}</span>
              <span className={`cn-radio ${reason === r ? 'on' : ''}`}>{reason === r && <Icon name="check" size={14} stroke={2.4} />}</span>
            </button>
          ))}
        </div>

        <label className="field">
          <span className="t-label faint">Anything else we should know</span>
          <textarea className="input" value={details} onChange={e => setDetails(e.target.value)} placeholder="Optional. Dates, what was said, how it felt." rows={3} />
        </label>

        <div className="row gap-16">
          <span className="grow stack gap-4">
            <span className="t-callout" style={{ fontWeight: 550 }}>Also block {p.first}</span>
            <span className="t-small muted">They won’t see you or be introduced to you again.</span>
          </span>
          <Toggle on={block} onChange={setBlock} label={`Also block ${p.first}`} />
        </div>

        <div className="card-flat card-pad stack gap-8" style={{ padding: 16 }}>
          <span className="row gap-8 t-callout" style={{ fontWeight: 550 }}><Icon name="shieldCheck" size={18} style={{ color: 'var(--sage)' }} />A person reviews every report within 24 hours.</span>
          <span className="t-small muted">They won’t know it was you. If you feel unsafe right now, call 911.</span>
        </div>
      </div>
    </Screen>
  )
}
