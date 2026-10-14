// conv/heard: "Here's what I heard." Every inference is shown with its source, and you can confirm, adjust or strike it.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, AiBadge, EmptyState, Sheet, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, CHAPTERS, type HeardCard, type Source } from '../../state/store'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'

const ease = [0.22, 1, 0.36, 1] as const

export function SourceTag({ source }: { source: Source }) {
  return source === 'You confirmed' ? <Tag tone="sage" icon="check">You confirmed</Tag> : source === 'Aura inferred' ? <Tag tone="ember" icon="sparkle">Aura inferred</Tag> : <Tag icon="message">You said</Tag>
}

export function Heard({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const ch = CHAPTERS.find(c => c.id === params.chapter && s.heard.some(h => h.chapter === c.id))
  // Fix the list on arrival so confirmed cards stay in view instead of vanishing from a "pending" filter.
  const [ids] = useState(() => (ch ? s.heard.filter(h => h.chapter === ch.id) : s.heard.filter(h => h.status === 'pending')).map(h => h.id))
  const cards = ids.map(id => s.heard.find(h => h.id === id)).filter((h): h is HeardCard => !!h)
  const [editing, setEditing] = useState<HeardCard | null>(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  const set = (id: string, patch: Partial<HeardCard>) => update(st => ({ ...st, heard: st.heard.map(h => (h.id === id ? { ...h, ...patch } : h)) }))
  const confirmed = cards.filter(c => c.status === 'confirmed').length
  const thatsMe = () => {
    const left = new Set(cards.filter(c => c.status === 'pending').map(c => c.id))
    if (left.size) update(st => ({ ...st, heard: st.heard.map(h => (left.has(h.id) ? { ...h, status: 'confirmed', source: 'You confirmed' } : h)) }))
    nav.push('conv/signature')
  }

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}
      footer={cards.length > 0
        ? <Button kind="commit" block onClick={thatsMe}>That’s me</Button>
        : <Button kind="primary" block onClick={() => nav.push('conv/chapters')}>Back to the chapters</Button>}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <motion.div className="stack gap-12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <Eyebrow>{ch ? ch.title : 'Across your chapters'}</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Here’s what <span className="i">I heard.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Confirm what’s true. Adjust or strike anything that isn’t. Struck lines stop shaping your introductions.</p>
          {cards.length > 0 && <span className="t-small faint"><span className="t-num">{confirmed}</span> of <span className="t-num">{cards.length}</span> confirmed</span>}
        </motion.div>

        {cards.length === 0 && (
          <EmptyState icon="feather" title="Nothing waiting" body="After each chapter I’ll show you what I heard, so you can correct me before it shapes anything." />
        )}

        {cards.map((h, i) => {
          const struck = h.status === 'struck'
          return (
            <motion.article key={h.id} className="card card-pad stack gap-16" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.09, duration: 0.6, ease }}>
              <div className="row between"><SourceTag source={h.source} />{!ch && <span className="t-small faint">{CHAPTERS.find(c => c.id === h.chapter)?.title}</span>}</div>
              <div className="cv-heard-body">
                <p className="serif" style={{ fontSize: 21, lineHeight: 1.3, margin: 0, opacity: struck ? 0.4 : 1, transition: 'opacity .5s' }}>{h.quote}</p>
                <p className="serif i muted" style={{ fontSize: 18, lineHeight: 1.35, margin: '10px 0 0', opacity: struck ? 0.4 : 1, transition: 'opacity .5s' }}>{h.inference}</p>
                {struck && <motion.i className="cv-strike" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.55, ease }} />}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {struck ? (
                  <motion.div key="struck" className="row between gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.35 }}>
                    <span className="serif i" style={{ fontSize: 17.5 }}>Noted. I’ll stop assuming that.</span>
                    <Button kind="quiet" size="sm" icon="undo" onClick={() => set(h.id, { status: 'pending' })}>Undo</Button>
                  </motion.div>
                ) : (
                  <motion.div key="live" className="row gap-8 wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {h.status === 'confirmed'
                      ? <span className="row gap-4 t-small" style={{ color: 'var(--sage)', fontWeight: 600, height: 34, paddingRight: 6 }}><Icon name="check" size={16} stroke={2} />Kept</span>
                      : <button className="btn btn-sm cv-btn-sage" onClick={() => { set(h.id, { status: 'confirmed', source: 'You confirmed' }); toast('Kept') }}>Confirm</button>}
                    <Button kind="ghost" size="sm" icon="edit" onClick={() => { setEditing(h); setText(h.inference); setOpen(true) }}>Adjust</Button>
                    <Button kind="quiet" size="sm" onClick={() => set(h.id, { status: 'struck' })}>Strike</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          )
        })}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Adjust what I heard">
        {editing && (
          <div className="stack gap-16" style={{ paddingBottom: 8 }}>
            <p className="serif" style={{ fontSize: 19, lineHeight: 1.3, margin: 0 }}>{editing.quote}</p>
            <label className="field">
              <span className="t-label faint">In your words</span>
              <textarea className="input" value={text} onChange={e => setText(e.target.value)} />
            </label>
            <p className="t-small faint" style={{ margin: 0 }}>I’ll use your wording from now on, and mark it as confirmed by you.</p>
            <Button kind="primary" block disabled={!text.trim()} onClick={() => { set(editing.id, { inference: text.trim(), source: 'You confirmed', status: 'confirmed' }); setOpen(false); toast('Updated. I’ll use your words.') }}>Save</Button>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}
