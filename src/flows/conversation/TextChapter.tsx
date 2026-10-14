// conv/text: the same chapter, written. Aura's questions on the left in her italic, your answers on the right.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Chip, ScaleTap, Eyebrow } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { SCALE_LABELS, type Turn } from './script'
import { useChapterRun, ThinkingDots, useLater, ROMAN } from './shared'

const settle = { type: 'spring', damping: 30, stiffness: 300 } as const

export function TextChapter({ params }: ScreenProps) {
  const nav = useNav()
  const later = useLater()
  const run = useChapterRun(params)
  const [from] = useState(run.turn)
  const [typing, setTyping] = useState(true)
  const [draft, setDraft] = useState('')
  const [closing, setClosing] = useState(false)
  const [, bump] = useState(0) // answers live in the shared draft; bump re-renders
  const end = useRef<HTMLDivElement>(null)
  const t = run.script[run.turn]
  const answered = run.answers[run.turn] !== undefined
  const ready = !typing && !answered && !closing

  useEffect(() => { setTyping(true); const id = setTimeout(() => setTyping(false), 850); return () => clearTimeout(id) }, [run.turn])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [run.turn, typing, closing, draft === ''])

  const answer = (v: string | number) => {
    if (!ready) return
    run.record(run.turn, v)
    setDraft('')
    bump(x => x + 1)
    if (run.turn + 1 >= run.script.length) { setClosing(true); later(run.finish, 1700) }
    else later(run.advance, 380)
  }
  const leave = () => { run.save(); if (nav.canGoBack) nav.pop(); else nav.goTab('aura') }
  const toVoice = () => nav.replace('conv/chamber', { chapter: run.chapter, turn: run.turn })

  const rows = run.script.slice(0, run.turn + 1).map((tt, i) => ({ tt, i, a: run.answers[i] })).filter(r => r.i >= from || r.a !== undefined)
  const hidden = from > 0 && rows.every(r => r.i >= from)

  return (
    <Screen
      top={<TopBar back title={run.meta.title} onBack={leave} />}
      footer={
        <form className="cv-composer" onSubmit={e => { e.preventDefault(); if (t.kind === 'open' && draft.trim()) answer(draft.trim()) }}>
          <textarea className="input cv-ta" rows={1} value={draft} disabled={t.kind !== 'open' || !ready}
            placeholder={t.kind === 'open' ? 'Write your answer' : 'Tap a number above'} aria-label="Your answer"
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} />
          <button type="submit" className="cv-send commit" disabled={t.kind !== 'open' || !draft.trim() || !ready} aria-label="Send answer"><Icon name="send" size={20} /></button>
        </form>
      }>
      <div className="pad stack gap-12" style={{ paddingTop: 6 }}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <Eyebrow>Chapter {ROMAN[run.index]} · {Math.min(run.turn + 1, run.script.length)} of {run.script.length}</Eyebrow>
          <Chip size="sm" icon="mic" onClick={toVoice}>Switch to voice</Chip>
        </div>
        {hidden && <p className="t-small faint center" style={{ margin: '4px 0 8px' }}>Picking up at question {from + 1}. Your earlier answers are safe.</p>}

        {rows.map(({ tt, i, a }) => (
          <div key={i} className="stack gap-12">
            {(i < run.turn || !typing) && <AuraBubble t={tt} />}
            {a !== undefined && (
              <motion.div className={`cv-bub me ${a === '' ? 'skipped' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={settle}>
                {typeof a === 'number' ? <><span className="t-num">{a}</span> · {SCALE_LABELS[a - 1]}</> : a || 'Skipped'}
              </motion.div>
            )}
          </div>
        ))}

        {typing && !closing && <div className="cv-bub aura cv-bub-typing"><ThinkingDots /></div>}

        <AnimatePresence>
          {ready && t.kind === 'scale' && (
            <motion.div key={`s${run.turn}`} className="stack gap-8 cv-inline-scale" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={settle}>
              <ScaleTap points={7} onChange={v => answer(v)} left="Disagree strongly" right="Agree strongly" />
              <span className="t-small faint">{t.validated ? 'Read exactly as written so it can be scored.' : 'A house statement. Answer on instinct.'}</span>
            </motion.div>
          )}
          {ready && t.kind === 'open' && (
            <motion.div key={`o${run.turn}`} className="row gap-8 wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Chip size="sm" icon="sparkle" onClick={() => setDraft(t.sample)}>Use a sample answer</Chip>
              <Chip size="sm" onClick={() => answer('')}>Skip this one</Chip>
            </motion.div>
          )}
        </AnimatePresence>

        {closing && (
          <motion.div className="cv-bub aura" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...settle, delay: 0.4 }}>
            Thank you. Here’s what I heard.
          </motion.div>
        )}
        <div ref={end} style={{ height: 4 }} />
      </div>
    </Screen>
  )
}

function AuraBubble({ t }: { t: Turn }) {
  return (
    <motion.div className="cv-bub aura" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={settle}>
      {t.ask}
      {t.kind === 'scale' && <span className="cv-bub-item">{t.item}</span>}
    </motion.div>
  )
}
