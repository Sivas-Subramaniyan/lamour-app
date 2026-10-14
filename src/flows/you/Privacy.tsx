// you/privacy: six separate consents with a history, retention in plain words, per-conversation deletion, export, account deletion.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, Toggle, Section, ListRow, Sheet } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, useNow, CHAPTERS, type ConsentKey, type ChapterId } from '../../state/store'
import { useFeedback } from '../../design/ui'
import { useYou, ConfirmSheet, CH_DATE, fmtDate } from './shared'

const CONSENTS: { key: ConsentKey; title: string; body: string }[] = [
  { key: 'voice', title: 'Voice conversations', body: 'Aura listens when you talk to her. Raw audio is deleted within 24 hours. Off: you write instead.' },
  { key: 'profiling', title: 'Your Signature', body: 'Aura builds a picture of you from what you say. Off: matching uses only your direct answers.' },
  { key: 'learning', title: 'Learning from your choices', body: 'Aura notices who you lean in to. Off: she only uses what you tell her.' },
  { key: 'numerology', title: 'Numbers', body: 'Your folio is computed from your birth name and date. Off: never computed, never used.' },
  { key: 'agent', title: 'Planning on your behalf', body: 'Aura talks to venues and holds tables inside your rules. Off: she only suggests.' },
  { key: 'research', title: 'Help improve matching', body: 'Patterns with names and words removed. Off by default, and nothing changes for you either way.' },
]
const RETENTION = [
  { title: 'Raw audio', body: 'Deleted within 24 hours of every conversation.', done: true },
  { title: 'Transcripts', body: 'Kept while your account is active, so Aura remembers. Delete any one below.' },
  { title: 'If you delete your account', body: 'Everything is gone within 30 days.' },
  { title: 'Backups', body: 'Cleared within 90 days, then nothing remains.' },
]

export function Privacy() {
  const { s, update } = useApp()
  const { x, set } = useYou()
  const now = useNow(60000)
  const { toast } = useFeedback()
  const [del, setDel] = useState<ChapterId | null>(null)
  const [last, setLast] = useState<ChapterId>('story')
  const [exporting, setExporting] = useState(false)
  const [closing, setClosing] = useState(false)
  const [typed, setTyped] = useState('')
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const sessions = CHAPTERS.filter(c => s.chapters[c.id] === 'done' && CH_DATE[c.id] && !x.deleted.includes(c.id))
  const lastCh = CHAPTERS.find(c => c.id === last)!

  const setConsent = (key: ConsentKey, on: boolean) => {
    update(s => ({ ...s, consents: { ...s.consents, [key]: on } }))
    set(x => ({ consentLog: [{ key, on, at: now.toISOString() }, ...x.consentLog] }))
    toast('Saved, and noted in your consent history.')
  }
  const deleteSession = (id: ChapterId) => {
    set(x => ({ deleted: [...x.deleted, id] }))
    update(s => ({ ...s, heard: s.heard.map(h => (h.chapter === id ? { ...h, status: 'struck' } : h)) }))
    toast('Deleted. Recomputing your Signature.')
  }
  const exportData = () => {
    setExporting(true)
    timer.current = window.setTimeout(() => { setExporting(false); toast('Your export will arrive by email within 48 hours.') }, 1600)
  }
  const closeAt = new Date(now.getTime() + 30 * 864e5)

  return (
    <Screen top={<TopBar title="Privacy & data" />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-12">
          <Eyebrow>Privacy & data</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Your data, <span className="i">in plain sight.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Six separate choices, not one checkbox. Change any of them at any time; nothing else changes with it.</p>
        </div>

        <AnimatePresence>
          {x.deletionAt && (
            <motion.div className="card card-pad stack gap-12" style={{ boxShadow: 'inset 0 0 0 1px var(--oxblood), var(--shadow)' }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <Eyebrow>Account closing</Eyebrow>
              <span className="t-body">Your account closes on {fmtDate(x.deletionAt)}. Until then you can change your mind and nothing is lost.</span>
              <Button kind="soft" size="md" onClick={() => { set({ deletionAt: undefined }); toast('Kept. Welcome back.') }}>Keep my account</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Section label="Your consents">
          <div>
            {CONSENTS.map(c => (
              <ListRow key={c.key} title={c.title} sub={c.body} chevron={false} right={<Toggle on={s.consents[c.key]} label={c.title} onChange={v => setConsent(c.key, v)} />} />
            ))}
          </div>
        </Section>

        <Section label="Consent history">
          <div className="card-flat stack gap-8" style={{ padding: 16 }}>
            {x.consentLog.slice(0, 4).map((e, i) => (
              <div key={i} className="row between gap-12 t-small">
                <span>{CONSENTS.find(c => c.key === e.key)?.title} <span className="faint">turned {e.on ? 'on' : 'off'}</span></span>
                <span className="t-num faint">{fmtDate(e.at)} {new Date(e.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            ))}
            <div className="row between gap-12 t-small">
              <span>At sign-up <span className="faint">you chose five of six; research off</span></span>
              <span className="t-num faint">{fmtDate('2026-09-24')}</span>
            </div>
          </div>
        </Section>

        <Section label="How long we keep things">
          <ol className="yu-retain">
            {RETENTION.map(r => (
              <li key={r.title} className={r.done ? 'done' : ''}>
                <span className="yu-retain-dot">{r.done && <Icon name="check" size={12} stroke={2.4} />}</span>
                <span className="stack" style={{ gap: 2 }}>
                  <span className="t-callout" style={{ fontWeight: 600 }}>{r.title}{r.done && <> <Tag tone="sage">Done for every session</Tag></>}</span>
                  <span className="t-small muted">{r.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section label="Your conversations with Aura">
          <div>
            <AnimatePresence initial={false}>
              {sessions.map(c => (
                <motion.div key={c.id} layout exit={{ opacity: 0, height: 0, transition: { duration: 0.35 } }} style={{ overflow: 'hidden' }}>
                  <ListRow icon="wave" title={c.title} sub={`${fmtDate(CH_DATE[c.id]!)} · ${c.mins} min · transcript only`} chevron={false}
                    right={<Button kind="quiet" size="sm" icon="trash" onClick={() => { setLast(c.id); setDel(c.id) }}>Delete</Button>} />
                </motion.div>
              ))}
            </AnimatePresence>
            {!sessions.length && <p className="t-callout muted" style={{ margin: 0 }}>No conversations kept. Aura only knows what’s in your profile.</p>}
          </div>
        </Section>

        <div className="stack gap-8">
          <Button kind="soft" block icon="download" disabled={exporting} onClick={exportData}>{exporting ? 'Preparing your export…' : 'Export my data'}</Button>
          <Button kind="ghost" block onClick={() => { setTyped(''); setClosing(true) }} disabled={!!x.deletionAt}>Delete my account</Button>
        </div>

        <div className="card-flat stack gap-8" style={{ padding: 16 }}>
          <Eyebrow>A concern or a complaint</Eyebrow>
          <span className="t-callout muted pretty">Our privacy team answers every message within seven days. If we don’t resolve it, you can take it to your state attorney general.</span>
          <Button kind="quiet" size="sm" icon="message" style={{ alignSelf: 'flex-start', paddingLeft: 0 }}
            onClick={() => { navigator.clipboard?.writeText('privacy@lamour.app').catch(() => {}); toast('Copied: privacy@lamour.app') }}>privacy@lamour.app</Button>
        </div>
      </div>

      <ConfirmSheet open={!!del} onClose={() => setDel(null)} title={`Delete “${lastCh.title}”?`} confirm="Delete this conversation"
        body="The recording is already gone. This deletes the transcript and what I learned from it, then redraws your Signature."
        onConfirm={() => deleteSession(last)} />

      <Sheet open={closing} onClose={() => setClosing(false)} title="Delete your account">
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          <p className="t-body muted pretty" style={{ margin: 0 }}>
            Your profile disappears from every letter today. Everything else is deleted within 30 days, and backups within 90. Anyone you’re talking to sees a kind note, not a vanished chat.
          </p>
          <label className="field">
            <span className="t-label faint">Type DELETE to confirm</span>
            <input className="input" value={typed} onChange={e => setTyped(e.target.value)} autoCapitalize="characters" aria-label="Type DELETE to confirm" />
          </label>
          <Button kind="commit" block disabled={typed.trim().toUpperCase() !== 'DELETE'}
            onClick={() => { set({ deletionAt: closeAt.toISOString() }); setClosing(false); toast('Scheduled. You have 30 days to change your mind.') }}>Delete my account</Button>
          <Button kind="quiet" block onClick={() => setClosing(false)}>Keep my account</Button>
        </div>
      </Sheet>
    </Screen>
  )
}
