// you/numbers: the full Numbers folio. Kept below the science: the user sets how much it counts, and it never changes a band.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, IconButton, Button, Eyebrow, Segmented, Sheet, Section } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, myChart, fitWith, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { PERSONAS } from '../../data/personas'
import { ARCHETYPE, chart, resonance, lifePathSteps, type Chart, type Num } from '../../lib/numerology'
import { PERSONAL_YEAR, posOf } from './shared'

type Key = 'expression' | 'soulUrge' | 'personality' | 'birthday' | 'maturity' | 'personalYear'
const CELLS: { key: Key; label: string; karmicOn?: string; from: string }[] = [
  { key: 'expression', label: 'Expression', karmicOn: 'Expression', from: 'Every letter of your birth name. How you tend to show up in what you make and do.' },
  { key: 'soulUrge', label: 'Soul Urge', karmicOn: 'Soul Urge', from: 'The vowels of your birth name. What you want underneath.' },
  { key: 'personality', label: 'Personality', karmicOn: 'Personality', from: 'The consonants of your birth name. How you come across before people know you.' },
  { key: 'birthday', label: 'Birthday', karmicOn: 'Birthday', from: 'The day you were born. A particular gift you carry.' },
  { key: 'maturity', label: 'Maturity', from: 'Life Path plus Expression. Who you grow into, usually after forty.' },
  { key: 'personalYear', label: 'Personal Year 2026', from: 'Your birth month and day with this year. A one-year weather report, not a forecast of events.' },
]
const KARMIC: Record<number, string> = {
  13: 'Patience with slow work. Shortcuts tend to cost more than they save.',
  14: 'Freedom with steadiness. Change is good; constant change can be a way of not choosing.',
  16: 'Humility after a fall. What breaks can be rebuilt more honestly.',
  19: 'Independence that can still ask for help.',
}
const DIAL = {
  off: 'Numbers stay in your folio. Your letter is ordered by the science alone.',
  light: 'Numbers only settle ties between people Aura rates the same.',
  meaningful: 'Numbers can move people within the order of your letter.',
} as const

const lpOf = (id: string) => chart(PERSONAS[id].birthName, PERSONAS[id].dob).lifePath

function yRule(s: State) {
  const w = s.me.birthName.split(/\s+/).find(x => /y/i.test(x))
  if (!w) return 'In Lynn, the Y has no vowel beside it, so it counts as a vowel. In Maya it sits beside an A, so it counts as a consonant.'
  const u = w.toUpperCase(), i = u.indexOf('Y'), V = 'AEIOU'
  const beside = V.includes(u[i - 1] ?? '_') || V.includes(u[i + 1] ?? '_')
  return beside
    ? `In ${w}, the Y sits beside a vowel, so it counts as a consonant.`
    : `In ${w}, the Y has no vowel beside it, so it counts as a vowel.`
}

export function Numbers() {
  const { s, update } = useApp()
  const nav = useNav()
  const c: Chart = myChart(s)
  const me = ARCHETYPE[c.lifePath]
  const [how, setHow] = useState(false)
  const [cellOpen, setCellOpen] = useState(false)
  const [cell, setCell] = useState<Key>('expression')
  const py = PERSONAL_YEAR[c.personalYear] ?? PERSONAL_YEAR[1]
  const moved = s.tonight.ids.filter(id => PERSONAS[id] && resonance(c.lifePath, lpOf(id)).relation === 'Challenging')
  const steps = lifePathSteps(s.me.dob)
  const consent = s.consents.numerology
  const cur = CELLS.find(x => x.key === cell)!
  const n = c[cell] as Num

  return (
    <Screen top={<TopBar title="Your numbers" right={<IconButton icon="info" label="How Resonance works" onClick={() => setHow(true)} />} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-8">
          <Eyebrow>Your folio · a reflective lens</Eyebrow>
          <div className="yu-lp">
            <motion.span className="yu-lp-num serif" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>{c.lifePath}</motion.span>
            <div className="stack gap-4 grow">
              <span className="t-label faint">Life Path</span>
              <span className="t-head i">{me.name}</span>
              <span className="t-callout muted pretty">{me.line}</span>
            </div>
          </div>
          <p className="t-callout pretty" style={{ margin: 0 }}><span className="faint">In love · </span>{me.inLove}</p>
        </div>

        {!consent && (
          <div className="card-flat stack gap-12" style={{ padding: 16 }}>
            <span className="t-callout">You turned numbers off in Privacy. Your folio is shown only to you and never used for matching.</span>
            <Button kind="soft" size="md" onClick={() => update(s => ({ ...s, consents: { ...s.consents, numerology: true } }))}>Turn numbers back on</Button>
          </div>
        )}

        <div className="yu-numgrid">
          {CELLS.map((x, i) => {
            const v = c[x.key] as Num
            const k = c.karmic.find(kk => kk.on === x.karmicOn)
            return (
              <motion.button key={x.key} className="yu-numcell" onClick={() => { setCell(x.key); setCellOpen(true) }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.5 }}>
                <span className="t-num yu-numcell-n">{v}</span>
                <span className="t-label faint">{x.label}</span>
                <span className="serif i" style={{ fontSize: 16.5 }}>{ARCHETYPE[v].name}</span>
                {k && <span className="t-small accent">Karmic {k.number}</span>}
              </motion.button>
            )
          })}
        </div>

        {c.karmic.length > 0 ? (
          <div className="card card-pad stack gap-8">
            <Eyebrow>Karmic note</Eyebrow>
            {c.karmic.map(k => (
              <div key={`${k.number}${k.on}`} className="stack gap-4">
                <span className="t-head"><span className="t-num">{k.number}</span> <span className="i">on your {k.on}</span></span>
                <span className="t-callout muted pretty">{KARMIC[k.number]}</span>
              </div>
            ))}
            <span className="t-small faint">In the tradition, a karmic number is a lesson to carry lightly, not a debt to pay.</span>
          </div>
        ) : (
          <div className="card-flat t-callout muted" style={{ padding: 16 }}>No karmic numbers in your chart. Nothing to carry.</div>
        )}

        <div className="card card-pad stack gap-12 yu-py">
          <div className="row between"><Eyebrow>Personal Year · 2026</Eyebrow><span className="t-num t-small faint">{c.personalYear}</span></div>
          <span className="t-title i balance">{py.title}.</span>
          <p className="t-body muted pretty" style={{ margin: 0 }}>{py.body}</p>
          <span className="t-small faint">Next year turns to {(c.personalYear % 9) + 1}: {PERSONAL_YEAR[(c.personalYear % 9) + 1].title.toLowerCase()}.</span>
        </div>

        <Section label="How much numbers count">
          <div className="stack gap-12">
            <Segmented value={s.me.resonance} onChange={v => update(s => ({ ...s, me: { ...s.me, resonance: v } }))}
              options={[{ value: 'off', label: 'Off' }, { value: 'light', label: 'Light' }, { value: 'meaningful', label: 'Meaningful' }]} />
            <AnimatePresence mode="wait">
              <motion.p key={s.me.resonance} className="t-callout muted pretty" style={{ margin: 0 }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {DIAL[s.me.resonance]}
              </motion.p>
            </AnimatePresence>
            <div className="row gap-8 t-small faint"><Icon name="lock" size={15} />Capped at 15% of the order. Never changes anyone’s band.</div>
          </div>
        </Section>

        <AnimatePresence>
          {s.me.resonance === 'meaningful' && (
            <motion.div key="moved" className="card card-pad stack gap-12" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <Eyebrow>Hidden by numbers</Eyebrow>
              <div className="row gap-16">
                <motion.span className="t-num yu-moved-n" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 26, stiffness: 260 }}>{moved.length}</motion.span>
                <span className="t-callout pretty grow">
                  {moved.length ? `Tonight, numbers moved ${moved.length} ${moved.length === 1 ? 'person' : 'people'} lower in your letter.` : 'Tonight, numbers didn’t move anyone in your letter.'}
                </span>
              </div>
              {moved.map(id => (
                <span key={id} className="t-small muted pretty">
                  {PERSONAS[id].first} is still {fitWith(s, id).band}. Only {posOf(PERSONAS[id].pronouns)} place in the order moved, and {posOf(PERSONAS[id].pronouns)} introduction stays in your letter.
                </span>
              ))}
              <Button kind="ghost" size="md" onClick={() => nav.goTab('tonight')}>See tonight’s letter</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Button kind="soft" block icon="info" onClick={() => setHow(true)}>How Resonance works</Button>
      </div>

      <Sheet open={cellOpen} onClose={() => setCellOpen(false)} title={cur.label}>
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          <div className="row gap-16">
            <span className="t-num yu-numcell-n" style={{ fontSize: 48 }}>{n}</span>
            <div className="stack gap-4"><span className="t-head i">{ARCHETYPE[n].name}</span><span className="t-small faint">{cur.from}</span></div>
          </div>
          {cell === 'personalYear'
            ? <p className="t-body pretty" style={{ margin: 0 }}>{py.body}</p>
            : <><p className="t-body pretty" style={{ margin: 0 }}>{ARCHETYPE[n].line}</p><p className="t-callout muted pretty" style={{ margin: 0 }}>{ARCHETYPE[n].inLove}</p></>}
          <span className="t-small faint">A reflective lens. It doesn’t change your band, or anyone else’s.</span>
        </div>
      </Sheet>

      <Sheet open={how} onClose={() => setHow(false)} title="How Resonance works">
        <div className="stack gap-20" style={{ paddingBottom: 8 }}>
          <p className="t-quote" style={{ margin: 0 }}>A reflective tradition, not science.</p>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>
            Your band comes from values, how you love under stress and how you both talk. Numbers sit below that, and only if you want them.
          </p>
          <ol className="yu-rules">
            <li><b>Letters to numbers.</b> We use the Pythagorean table: A is 1, I is 9, J starts again at 1.</li>
            <li><b>Life Path.</b> Month, day and year are reduced separately, then added. <span className="t-num">{steps.rm} + {steps.rd} + {steps.ry} = {steps.total}</span>{steps.chain.length > 1 && <> → <span className="t-num">{steps.chain.at(-1)}</span></>}.</li>
            <li><b>The Y rule.</b> Y counts as a vowel only when no vowel sits beside it. {yRule(s)}</li>
            <li><b>Master numbers.</b> 11, 22 and 33 are kept, and read as heightened 2, 4 and 6 when two people are compared.</li>
            <li><b>Karmic numbers.</b> 13, 14, 16 and 19, when they appear on the way to a core number.</li>
            <li><b>The limit.</b> Numbers can reorder your letter by 15% at most. They never change a band, and they never introduce or hide anyone.</li>
          </ol>
          <Button kind="ghost" block onClick={() => { setHow(false); nav.push('conv/numbers') }}>Watch your Life Path add up</Button>
        </div>
      </Sheet>
    </Screen>
  )
}

