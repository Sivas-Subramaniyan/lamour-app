// you/memory: the Sunday Almanac, then Memory Lane, a timeline of what Aura learned, each with the Signature as it was then.
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, Sheet, AiBadge, Orb } from '../../design/ui'
import { useApp, myChart, CHAPTERS, type State, type Source, type ChapterId } from '../../state/store'
import { useNav } from '../../shell/nav'
import type { Modes } from '../../design/signature'
import { MiniSig, SourceChip, SIG, CH_DATE, PERSONAL_YEAR, fmtDate, myModes, useYou } from './shared'
import { useFeedback } from '../../design/ui'

type Item = { id: string; at: string; kind: string; title: string; body: string; quote?: string; source?: Source; struck?: boolean; modes: Modes; link?: 'you/explorer' | 'you/noticed' | 'conv/chapters' }

const CH_MODES: Partial<Record<ChapterId, Modes>> = { story: [2, 4], people: [3, 4], life: [3, 5], love: [3, 5], hard: [4, 5] }
const CH_HEARD: Partial<Record<ChapterId, string>> = { story: 'h1', people: 'h2', love: 'h3', hard: 'h4' }

function lane(s: State): Item[] {
  const t = s.me.traits.lifestyle
  const items: Item[] = [
    { id: 'joined', at: '2026-09-24', kind: 'Beginning', title: 'You joined L’Amour', body: `Member No. ${String(s.me.memberNo).padStart(5, '0')}. You chose five of six consents and kept research off.`, modes: [2, 3] },
    { id: 'letter1', at: '2026-10-01', kind: 'Letter', title: 'Your first evening letter', body: 'Three introductions. You leaned in to one, held one, and told me why you passed on the third.', modes: [3, 4] },
    { id: 'debrief', at: '2026-10-10', kind: 'Morning After', title: 'A debrief after Friday', body: 'You said the conversation was easy but the bar was too loud to hear each other. I stopped suggesting loud rooms for first dates.', modes: [4, 5], link: 'you/explorer' },
    { id: 'almanac', at: '2026-10-11', kind: 'Almanac', title: 'Almanac No. 6', body: 'You said ambitious. You kept choosing kind.', modes: [4, 6], link: 'you/noticed' },
  ]
  CHAPTERS.forEach(c => {
    if (s.chapters[c.id] !== 'done' || !CH_DATE[c.id]) return
    const h = s.heard.find(x => x.id === CH_HEARD[c.id])
    items.push({
      id: c.id, at: CH_DATE[c.id]!, kind: 'Chapter', title: c.title, modes: CH_MODES[c.id] ?? [3, 4], link: 'you/explorer',
      body: h ? (h.status === 'struck' ? 'You asked me to forget what I heard here.' : h.inference)
        : c.id === 'life' ? `Kids ${t.kids === 'want' ? 'one day, without a rush' : t.kids === 'open' ? 'are an open question' : 'aren’t in the plan'}. You’d ${t.relocate === 'no' ? 'rather stay in New York' : 'move for the right reason'}.` : c.blurb,
      quote: h && h.status !== 'struck' ? h.quote : undefined, source: h?.source, struck: h?.status === 'struck',
    })
  })
  s.noticed.filter(n => n.status === 'confirmed').forEach(n => items.push({
    id: n.id, at: n.id === 'n3' ? '2026-10-12' : '2026-10-14', kind: 'Confirmed', title: 'You confirmed a pattern', body: n.lean, source: 'You confirmed', modes: myModes(s), link: 'you/noticed',
  }))
  return items.sort((a, b) => a.at.localeCompare(b.at))
}

export function Memory() {
  const { s } = useApp()
  const { x, set } = useYou()
  const nav = useNav()
  const { toast } = useFeedback()
  const items = lane(s)
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<Item>(items[0])
  const py = myChart(s).personalYear
  const stats = [
    { n: 9, label: 'introductions' }, { n: 3, label: 'lean-ins' },
    { n: Math.max(2, s.connections.length), label: 'conversations' }, { n: 1, label: 'evening' },
  ]

  return (
    <Screen top={<TopBar title="Memory Lane" right={<AiBadge text="Aura" />} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <motion.article className="card card-pad stack gap-16 yu-almanac" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="row between t-label faint"><span>Almanac No. 6</span><span>Sunday 11 October</span></div>
          <div className="yu-double-rule" />
          <h1 className="t-title balance" style={{ margin: 0 }}>You said ambitious. <span className="i">You kept choosing kind.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>
            Every person you leaned in to this week led with warmth. I’ve started weighing kindness ahead of drive in your letter.
          </p>
          <div className="yu-stats">
            {stats.map((st, i) => (
              <motion.div key={st.label} className="stack" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                <span className="t-num" style={{ fontSize: 26, lineHeight: 1.1 }}>{st.n}</span>
                <span className="t-small faint">{st.label}</span>
              </motion.div>
            ))}
          </div>
          <div className="hairline" />
          <div className="row between gap-12">
            <div className="stack" style={{ gap: 2 }}><span className="t-label faint">Grace standing</span><span className="t-small muted">Every reply inside your turn. No one left wondering.</span></div>
            <Tag tone="sage" icon="check">Gracious</Tag>
          </div>
          <div className="stack" style={{ gap: 2 }}>
            <span className="t-label faint">Personal Year {py}</span>
            <span className="t-small muted">{PERSONAL_YEAR[py]?.title}. This week rewarded the steady choice over the dazzling one.</span>
          </div>
        </motion.article>

        <div className="card card-aura card-pad row gap-16">
          <Orb size={40} />
          <div className="grow stack gap-4">
            <Eyebrow>Next week’s wildcard</Eyebrow>
            <span className="serif i" style={{ fontSize: 19, lineHeight: 1.3 }}>Someone who reads more than you do, and cooks less. Arrives Sunday at dusk.</span>
            {x.wildcardReminder
              ? <Tag tone="sage" icon="check">I’ll remind you</Tag>
              : <Button kind="ghost" size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => { set({ wildcardReminder: true }); toast('I’ll tap you on Sunday, just before dusk.') }}>Remind me</Button>}
          </div>
        </div>

        <div className="stack gap-8">
          <Eyebrow>Memory Lane</Eyebrow>
          <p className="t-callout muted" style={{ margin: 0 }}>What I learned, when I learned it. Your Signature as it looked each time.</p>
        </div>

        <ol className="yu-lane">
          {items.map((it, i) => (
            <motion.li key={it.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}>
              <button className="yu-lane-item" onClick={() => { setSel(it); setOpen(true) }}>
                <span className="yu-lane-sig"><MiniSig modes={it.modes} size={44} color={SIG.day} /></span>
                <span className="grow stack" style={{ gap: 2 }}>
                  <span className="t-small faint">{fmtDate(it.at)} · {it.kind}</span>
                  <span style={{ fontWeight: 550, fontSize: 15.5, textDecoration: it.struck ? 'line-through' : undefined }}>{it.title}</span>
                  <span className="t-small muted yu-clamp">{it.body}</span>
                </span>
              </button>
            </motion.li>
          ))}
        </ol>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={sel.title}>
        <div className="stack gap-20" style={{ paddingBottom: 8 }}>
          <div className="row gap-16">
            <span className="yu-lane-sig" style={{ width: 120, height: 120 }}><MiniSig modes={sel.modes} size={112} color={SIG.day} /></span>
            <div className="stack gap-4">
              <span className="t-label faint">{sel.kind}</span>
              <span className="t-callout">{fmtDate(sel.at)}</span>
              <span className="t-small faint">Your Signature that day</span>
            </div>
          </div>
          {sel.quote && <p className="serif" style={{ margin: 0, fontSize: 21, lineHeight: 1.3 }}>{sel.quote}</p>}
          <div className="stack gap-8">
            <Eyebrow>What I learned</Eyebrow>
            <p className="t-body pretty" style={{ margin: 0 }}>{sel.body}</p>
            {sel.source && !sel.struck && <div><SourceChip source={sel.source} /></div>}
          </div>
          {sel.link && (
            <Button kind="soft" block icon="edit" onClick={() => { setOpen(false); nav.push(sel.link!) }}>
              {sel.link === 'you/noticed' ? 'Review what I’ve noticed' : 'Correct this in your Signature'}
            </Button>
          )}
        </div>
      </Sheet>
    </Screen>
  )
}
