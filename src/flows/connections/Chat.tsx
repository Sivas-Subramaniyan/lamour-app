// conn/chat: the thread. Your Turn countdown, voice notes, labelled Aura drafts, a scripted warm reply, and "Shall I set a table?".
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, IconButton, Portrait, PairAvatars, ArcRail, Sheet, ListRow, Button, Tag, Chip, Orb, Eyebrow, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { PERSONAS } from '../../data/personas'
import { venue, venuePhoto } from '../../data/venues'
import { useApp, useNow, connection, planWith, send, fitWith, fmtDay, fmtTime, type Message } from '../../state/store'
import { haptic } from '../../lib/voice'
import type { ScreenProps } from '../../shell/screens'
import { useNav } from '../../shell/nav'
import { arcAt, chatId, ensureConn, hrs, plusHours, turnTo, useStamp, usePlayback, VoiceNote, voiceOf } from './kit'
import { bridgeFor, drafts, KEEP_HERE, nextReply, NUDGE } from './copy'

export function Chat({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const fb = useFeedback()
  const now = useNow()
  const at = useStamp()
  const play = usePlayback()
  const id = chatId(s, params)
  const p = PERSONAS[id]
  const c = connection(s, id)
  const msgs = s.messages[id] ?? []
  const plan = planWith(s, id)
  const closed = c?.stage === 'closed' || c?.stage === 'lapsed'
  const arc = arcAt(s, id)

  const [text, setText] = useState('')
  const [assisted, setAssisted] = useState(false)
  const [tip, setTip] = useState<string | undefined>(typeof params.tip === 'string' ? params.tip : undefined)
  const [typing, setTyping] = useState(false)
  const [sheet, setSheet] = useState<'menu' | 'aura' | null>(null)
  const [tableLater, setTableLater] = useState(false)
  const [calm, setCalm] = useState<string[]>([])
  const pending = useRef(false)
  const draftN = useRef(0)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = end.current?.closest('.screen-scroll')
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [msgs.length, typing])

  const threads = bridgeFor(p).slice(0, 3)
  const care = p.aura.careNote || (() => { const e = fitWith(s, id).efforts[0]; return e ? `${e.line} ${e.tip}` : '' })()
  const mine = msgs.filter(m => m.from === 'me').length
  const theirs = msgs.filter(m => m.from === 'them').length
  const offerTable = !closed && !tableLater && !plan && mine >= 2 && theirs >= 2 && !typing && msgs[msgs.length - 1]?.from === 'them'

  const turnLeft = c?.yourTurnUntil ? new Date(c.yourTurnUntil).getTime() - now.getTime() : 0
  const turn = closed ? 'Closed' : c?.yourTurnUntil ? (c.stage === 'introduced' ? `Say hello · ${hrs(turnLeft)}` : `Your turn · ${hrs(turnLeft)}`) : typing ? `${p.first} is typing` : msgs.length ? 'Their turn · no rush' : 'Say hello'

  function edit(v: string) { setText(v); if (!v.trim()) setAssisted(false) }
  function draft(v?: string) {
    const pool = drafts(p)
    setText(v ?? pool[draftN.current++ % pool.length])
    setAssisted(true)
    setSheet(null)
  }

  function submit() {
    const body = text.trim()
    if (!body) return
    const t0 = at()
    update(st => send(ensureConn(st, id, t0), id, { from: 'me', kind: 'text', text: body, ...(assisted ? { assisted: true } : {}) }, t0))
    setText(''); setAssisted(false); setTip(undefined)
    haptic(8)
    if (pending.current) return
    pending.current = true
    const reply = nextReply(id, msgs.filter(m => m.from === 'them').map(m => m.text))
    window.setTimeout(() => setTyping(true), 900)
    window.setTimeout(() => {
      setTyping(false)
      pending.current = false
      const t1 = at()
      update(st => turnTo(send(st, id, { from: 'them', kind: 'text', text: reply }, t1), id, plusHours(t1, 48)))
    }, 2300 + Math.min(1800, reply.length * 16))
  }

  const back = () => (nav.canGoBack ? nav.pop() : nav.goTab('table'))
  const planRow = plan?.status === 'sealed' || plan?.status === 'live'
    ? { title: 'Your Date Pass', sub: 'Everything for the evening, in one place', go: () => nav.push('dates/pass', { id }) }
    : plan ? { title: 'Three evenings', sub: 'Aura is holding options for you two', go: () => nav.push('dates/proposals', { id }) }
    : { title: 'Plan an evening', sub: 'Aura finds three evenings that suit you both', go: () => nav.push('dates/prefs', { id }) }

  return (
    <Screen
      top={<>
        <TopBar left={<IconButton icon="back" label="Back" onClick={back} />}
          title={<button className="cn-who" onClick={() => nav.push('tonight/dossier', { id })} aria-label={`About ${p.first}`}>
            <Portrait photo={p.photos.portrait} name={p.first} shape="circle" w={30} h={30} />
            <span className="serif" style={{ fontSize: 21 }}>{p.first}</span>
          </button>}
          right={<IconButton icon="more" label="More" onClick={() => setSheet('menu')} />} />
        <div className="pad cn-chat-head">
          <div className="grow"><ArcRail at={arc} /></div>
          <span className="row gap-4 t-small" style={{ fontWeight: 600, color: c?.yourTurnUntil && !closed ? 'var(--accent)' : 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            {c?.yourTurnUntil && !closed && <Icon name="clock" size={14} stroke={2} />}{turn}
          </span>
        </div>
      </>}
      footer={closed ? (
        <div className="stack gap-8 center" style={{ alignItems: 'center' }}>
          <span className="t-small faint">This conversation was closed. Only you can see it now.</span>
          <Button kind="soft" block onClick={() => nav.reset('conn/table')}>Back to the Table</Button>
        </div>
      ) : (
        <div className="stack gap-8">
          <AnimatePresence>
            {tip && (
              <motion.div key="tip" className="cn-tip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                <Icon name="sparkle" size={16} style={{ color: 'var(--ember)', flexShrink: 0, marginTop: 2 }} />
                <span className="grow stack" style={{ gap: 2 }}>
                  <span className="t-label" style={{ color: 'var(--ember)' }}>A thread to pull</span>
                  <span className="t-callout">{tip}</span>
                </span>
                <IconButton icon="close" label="Dismiss" size={16} onClick={() => setTip(undefined)} />
              </motion.div>
            )}
          </AnimatePresence>
          {assisted && <span className="row gap-4 t-small" style={{ color: 'var(--ember)', fontWeight: 600 }}><Icon name="sparkle" size={14} />Drafted with Aura · edit it, it’s yours</span>}
          <div className="cn-composer">
            <IconButton icon="sparkle" label="Ask Aura" onClick={() => setSheet('aura')} style={{ color: 'var(--ember)' }} />
            <textarea className="cn-field" value={text} placeholder={`Write to ${p.first}`} rows={Math.min(4, Math.max(1, Math.ceil(text.length / 30)))}
              onChange={e => edit(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} />
            {text.trim()
              ? <button className="cn-send" aria-label="Send" onClick={submit}><Icon name="send" size={18} /></button>
              : <IconButton icon="mic" label="Record a voice note" onClick={() => nav.push('conn/hello', { id })} />}
          </div>
        </div>
      )}>
      <div className="pad stack gap-12" style={{ paddingTop: 8, paddingBottom: 16 }}>
        {msgs.length === 0 && (
          <div className="stack gap-16 center" style={{ alignItems: 'center', padding: '32px 8px' }}>
            <PairAvatars a={{ photo: s.me.photos[0], name: s.me.name }} b={{ photo: p.photos.portrait, name: p.first }} size={64} />
            <h2 className="t-head balance" style={{ margin: 0 }}>You and {p.first}, <span className="i">just introduced.</span></h2>
            <p className="t-callout muted balance" style={{ margin: 0 }}>Start with a voice hello. Twenty seconds lands warmer than a paragraph.</p>
            <div className="row gap-8"><Button kind="commit" size="md" icon="mic" onClick={() => nav.push('conn/hello', { id })}>Record a hello</Button><Button kind="ghost" size="md" onClick={() => nav.push('conn/bridge', { id })}>Bridge Brief</Button></div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {msgs.map((m, i) => {
            const prev = msgs[i - 1]
            const divider = !prev || new Date(m.at).getTime() - new Date(prev.at).getTime() > 3 * 3600e3
            return (
              <motion.div key={m.id} className="stack gap-8" layout="position"
                initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
                {divider && <div className="cn-day">{fmtDay(m.at)} · {fmtTime(m.at)}</div>}
                <Bubble m={m} first={p.first} gender={p.gender} meGender={s.me.gender} play={play} onPass={() => nav.push('dates/pass', { id })} plan={plan} />
                {m.from === 'them' && m.kind === 'text' && NUDGE.test(m.text ?? '') && !calm.includes(m.id) && (
                  <div className="cn-nudge">
                    <span className="row gap-8 t-callout" style={{ fontWeight: 550 }}><Icon name="shield" size={16} />Does this bother you?</span>
                    <span className="t-small muted">Moving off the app early is common. It’s fine to say not yet.</span>
                    <div className="row gap-8 wrap">
                      <Chip onClick={() => setCalm(x => [...x, m.id])}>It’s fine</Chip>
                      <Chip onClick={() => { setCalm(x => [...x, m.id]); draft(KEEP_HERE) }}>Keep it here</Chip>
                      <Chip onClick={() => nav.push('conn/report', { id })}>Report</Chip>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
          {typing && (
            <motion.div key="typing" className="cn-bubble them cn-typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-label={`${p.first} is typing`}>
              <i /><i /><i />
            </motion.div>
          )}
          {offerTable && (
            <motion.div key="table" className="card card-aura card-pad stack gap-12" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }} style={{ marginTop: 8 }}>
              <div className="row gap-12"><Orb size={28} /><span className="t-label" style={{ color: 'var(--ember)' }}>Aura</span></div>
              <span className="t-head i">Shall I set a table?</span>
              <span className="t-callout muted">You two have found an easy rhythm. I can look for three evenings that suit you both and hold a table while you decide.</span>
              <div className="row gap-8">
                <Button kind="ember" size="md" onClick={() => nav.push('dates/prefs', { id })}>Set a table</Button>
                <Button kind="quiet" size="md" onClick={() => setTableLater(true)}>Not yet</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={end} />
      </div>

      <Sheet open={sheet === 'menu'} onClose={() => setSheet(null)} title={p.first}>
        <div className="stack" style={{ paddingBottom: 8 }}>
          <ListRow icon="calendar" title={planRow.title} sub={planRow.sub} onClick={() => { setSheet(null); planRow.go() }} />
          <ListRow icon="wave" title="Voice Hour" sub="Ten minutes, audio only, end any time" onClick={() => { setSheet(null); nav.push('conn/voice-hour', { id }) }} />
          <ListRow icon="feather" title="Bridge Brief" sub="Threads to pull, only you can see it" onClick={() => { setSheet(null); nav.push('conn/bridge', { id }) }} />
          <ListRow icon="hand" title="Close kindly" sub="A short note, never a disappearing chat" onClick={() => { setSheet(null); nav.push('conn/exit', { id }) }} />
          <ListRow icon="flag" title="Report or block" sub="A person reviews every report" onClick={() => { setSheet(null); nav.push('conn/report', { id }) }} />
        </div>
      </Sheet>

      <Sheet open={sheet === 'aura'} onClose={() => setSheet(null)} title={<span className="row gap-12"><Orb size={26} />Aura</span>}>
        <div className="stack gap-20" style={{ paddingBottom: 8 }}>
          <div className="stack gap-8">
            <Eyebrow>Threads to pull</Eyebrow>
            {threads.map(t => (
              <button key={t} className="cn-thread-pick" onClick={() => { setTip(t); setSheet(null) }}>
                <span className="serif i" style={{ fontSize: 18, lineHeight: 1.3 }}>{t}</span>
                <Icon name="chevron" size={16} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
          {care && <div className="card-flat card-pad stack gap-4" style={{ padding: 16 }}><Eyebrow>Go gently on</Eyebrow><span className="t-callout muted">{care}</span></div>}
          <div className="stack gap-8">
            <Button kind="ember" block icon="sparkle" onClick={() => draft()}>Draft with Aura</Button>
            <span className="t-small faint center">Aura suggests. You edit, and nothing is sent until you tap send.</span>
          </div>
        </div>
      </Sheet>
    </Screen>
  )
}

function Bubble({ m, first, gender, meGender, play, onPass, plan }: {
  m: Message; first: string; gender: string; meGender: string; play: ReturnType<typeof usePlayback>; onPass: () => void; plan?: ReturnType<typeof planWith>
}) {
  if (m.kind === 'system') return <div className="cn-system"><span>{m.text}</span></div>
  if (m.kind === 'plan') {
    const v = plan?.chosen !== undefined ? venue(plan.options[plan.chosen].venueId) : undefined
    return (
      <button className="cn-pass" onClick={onPass}>
        {v && <Portrait photo={venuePhoto(v)} name={v.name} shape="rect" w={56} h={56} style={{ borderRadius: 14 }} />}
        <span className="grow stack" style={{ gap: 2, textAlign: 'left' }}>
          <span className="row gap-8"><Tag tone="sage" icon="check">Sealed</Tag><span className="t-label faint">Date Pass</span></span>
          <span className="t-callout" style={{ fontWeight: 550 }}>{m.text}</span>
        </span>
        <Icon name="ticket" size={20} style={{ color: 'var(--ink-3)' }} />
      </button>
    )
  }
  const me = m.from === 'me'
  return (
    <div className={`stack gap-4 ${me ? 'cn-mine' : ''}`}>
      <div className={`cn-bubble ${me ? 'me' : 'them'} ${m.kind === 'voice' ? 'voice' : ''}`}>
        {m.kind === 'voice' ? (
          <div className="stack gap-8">
            <span className="t-label" style={{ opacity: 0.75 }}>{me ? 'Your voice' : `${first}’s voice`}</span>
            <VoiceNote k={m.id} text={m.text ?? ''} secs={m.secs ?? 12} voice={me ? voiceOf(meGender) : voiceOf(gender)} play={play} light={me} />
            {m.text && <span className="cn-caption">“{m.text}”</span>}
          </div>
        ) : m.text}
      </div>
      {me && m.assisted && <span className="row gap-4 t-small faint" style={{ alignSelf: 'flex-end', fontSize: 11.5 }}><Icon name="sparkle" size={12} />Drafted with Aura</span>}
    </div>
  )
}

