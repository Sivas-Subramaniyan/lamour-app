// conv/chapters: the Chapter Book. Seven short conversations, what's done, what's next, and when the first letter arrives.
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Eyebrow, AiBadge, Meter, ListRow, Sheet } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, CHAPTERS, type ChapterId } from '../../state/store'
import { useNav } from '../../shell/nav'
import { nextChapter } from './script'
import { ROMAN } from './shared'

const ease = [0.22, 1, 0.36, 1] as const

export function Chapters() {
  const { s } = useApp()
  const nav = useNav()
  const [revisit, setRevisit] = useState<(typeof CHAPTERS)[number] | null>(null)
  const [sheet, setSheet] = useState(false)
  const done = CHAPTERS.filter(c => s.chapters[c.id] === 'done').length
  const left = CHAPTERS.filter(c => s.chapters[c.id] === 'todo').reduce((m, c) => m + c.mins, 0)
  const toLetter = CHAPTERS.slice(0, 3).filter(c => s.chapters[c.id] === 'todo').reduce((m, c) => m + c.mins, 0)
  const pending = s.heard.filter(h => h.status === 'pending').length
  const next = nextChapter(s)

  const openChapter = (id: ChapterId) => {
    const c = CHAPTERS.find(x => x.id === id)!
    if (id === 'numbers') nav.push('conv/numbers')
    else if (s.chapters[id] === 'done') { setRevisit(c); setSheet(true) }
    else nav.push('conv/chamber', { chapter: id })
  }
  const go = (fn: () => void) => { setSheet(false); fn() }

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}
      footer={next
        ? <Button kind="ember" block icon="mic" onClick={() => nav.push('conv/chamber', { chapter: next.id })}>Continue with {next.title.toLowerCase()}</Button>
        : s.chapters.numbers === 'todo' && <Button kind="ember" block onClick={() => nav.push('conv/numbers')}>See your numbers</Button>}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <motion.div className="stack gap-12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <Eyebrow>The First Conversation</Eyebrow>
          <h1 className="t-title" style={{ margin: 0 }}>The chapter <span className="i">book</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Seven short conversations with Aura. Talk or write, skip anything, and correct whatever I get wrong.</p>
        </motion.div>

        <div className="stack gap-12">
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <span className="row gap-8" style={{ alignItems: 'baseline' }}><span className="serif" style={{ fontSize: 44, lineHeight: 1 }}>{done}</span><span className="t-callout muted">of 7 done</span></span>
            <span className="t-small faint">{left ? <>About <span className="t-num">{left}</span> minutes left</> : 'All done'}</span>
          </div>
          <Meter value={done / 7} color="var(--accent)" />
        </div>

        <div className="card-flat card-pad row gap-12" style={{ padding: 16, alignItems: 'flex-start' }}>
          <span className="cv-ico"><Icon name="moon" size={19} /></span>
          <p className="t-callout" style={{ margin: 0 }}>
            {toLetter ? <>Your first letter arrives after Chapter III <span className="muted">(about {toLetter} minutes)</span>.</> : <>Your letter is on. <span className="muted">Each chapter you finish sharpens it.</span></>}
          </p>
        </div>

        <div>
          {CHAPTERS.map((c, i) => {
            const isDone = s.chapters[c.id] === 'done'
            return (
              <motion.button key={c.id} className="cv-chap" onClick={() => openChapter(c.id)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.55, ease }}>
                <span className="cv-roman">{ROMAN[i]}</span>
                <span className="stack gap-4">
                  <span className="serif" style={{ fontSize: 21, lineHeight: 1.2, color: isDone ? 'var(--ink-2)' : 'var(--ink)' }}>{c.title}</span>
                  <span className="t-small muted">{c.blurb}</span>
                </span>
                {isDone
                  ? <span className="cv-check" aria-label="Done"><Icon name="check" size={16} stroke={2} /></span>
                  : <span className="row gap-4 t-small faint" style={{ paddingTop: 4 }}><span className="t-num">{c.mins} min</span><Icon name="chevron" size={16} /></span>}
              </motion.button>
            )
          })}
        </div>

        <div className="card card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
          {pending > 0 && <ListRow icon="feather" title="Here’s what I heard" sub={`${pending} ${pending === 1 ? 'line is' : 'lines are'} waiting for your say`} onClick={() => nav.push('conv/heard')} />}
          <ListRow icon="edit" title="Prefer to write?" sub="Answer the same chapter as a chat" onClick={() => nav.push('conv/text')} />
          <ListRow icon="compass" title="Life design" sub="Your non-negotiables, and how firm each one is" onClick={() => nav.push('conv/life-design')} />
          <ListRow icon="sparkle" title="See your Signature" sub="The figure drawn from everything so far" onClick={() => nav.push('conv/signature')} />
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title={revisit?.title}>
        {revisit && (
          <div className="stack gap-12" style={{ paddingBottom: 8 }}>
            <p className="t-quote" style={{ margin: '0 0 8px' }}>You’ve finished this one. We can talk it through again, or you can check what I took from it.</p>
            <Button kind="ember" block icon="mic" onClick={() => go(() => nav.push('conv/chamber', { chapter: revisit.id }))}>Talk it through again</Button>
            <Button kind="ghost" block onClick={() => go(() => nav.push('conv/heard', { chapter: revisit.id }))}>See what I heard</Button>
            <Button kind="quiet" block onClick={() => go(() => nav.push('conv/text', { chapter: revisit.id }))}>Write it instead</Button>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}
