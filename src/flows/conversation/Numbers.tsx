// conv/numbers: "The Working". Opt-in numerology, shown with its arithmetic, kept below and apart from the science.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Chip, Segmented, Eyebrow, ListRow, Sheet, Tag, useFeedback } from '../../design/ui'
import { useApp, myChart, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { ARCHETYPE, lifePathSteps, reduceChain, type Chart, type Num } from '../../lib/numerology'

const ease = [0.22, 1, 0.36, 1] as const
const digits = (n: number) => String(n).split('').join(' + ')
/** [1997, 26, 8] -> "1 + 9 + 9 + 7 = 26 · 2 + 6 = 8" */
const arithmetic = (chain: number[]) => chain.slice(1).map((n, i) => `${digits(chain[i])} = ${n}`).join(' · ')

type Key = Exclude<keyof Chart, 'karmic'>
const FOLIO: { key: Key; label: string; from: string }[] = [
  { key: 'lifePath', label: 'Life Path', from: 'From your date of birth' },
  { key: 'expression', label: 'Expression', from: 'From all the letters of your birth name' },
  { key: 'soulUrge', label: 'Soul Urge', from: 'From the vowels of your birth name' },
  { key: 'personality', label: 'Personality', from: 'From the consonants of your birth name' },
  { key: 'birthday', label: 'Birthday', from: 'From the day you were born' },
  { key: 'maturity', label: 'Maturity', from: 'From your Life Path plus your Expression' },
  { key: 'personalYear', label: 'Personal Year 2026', from: 'From your birth month and day, plus 2026' },
]
const YEAR: Record<number, { name: string; line: string }> = {
  1: { name: 'The beginning year', line: 'A year for starting things. Plant what you want to be tending in nine years.' },
  2: { name: 'The patient year', line: 'A year of partnership and slow ripening. Little is rushed, much is built.' },
  3: { name: 'The open year', line: 'A year to be seen, to play, and to say yes to the invitation.' },
  4: { name: 'The building year', line: 'A year of foundations. Steady work that pays you back later.' },
  5: { name: 'The changing year', line: 'A year of movement and open doors. Expect the unplanned.' },
  6: { name: 'The home year', line: 'A year of care, commitment and making room for someone.' },
  7: { name: 'The inward year', line: 'A year to go quiet, study, and listen to yourself.' },
  8: { name: 'The harvest year', line: 'A year when effort comes back to you. Say yes to what you have earned.' },
  9: { name: 'The clearing year', line: 'A year of endings that make room for what comes next.' },
}
const KARMIC: Record<number, string> = {
  13: 'steady work over shortcuts', 14: 'freedom balanced with moderation',
  16: 'humility, and rebuilding on truer ground', 19: 'independence that still lets others help',
}
const WEIGHT: { value: State['me']['resonance']; label: string }[] = [{ value: 'off', label: 'Off' }, { value: 'light', label: 'Light' }, { value: 'meaningful', label: 'Meaningful' }]
const WEIGHT_LINE: Record<State['me']['resonance'], string> = {
  off: 'Numbers stay out of your introductions entirely.',
  light: 'A gentle tiebreaker between two equally good introductions.',
  meaningful: 'Numbers can move an introduction up or down a place, never more.',
}
const CONVENTIONS: [string, string][] = [
  ['Pythagorean letters', 'A is 1 through I is 9, then J begins again at 1.'],
  ['Life Path by components', 'Month, day and year are each reduced first, then added and reduced again.'],
  ['Master numbers kept', '11, 22 and 33 stay as they are instead of being reduced.'],
  ['The Y rule', 'Y counts as a vowel only when no vowel sits beside it, as in Lynn. Next to a vowel, as in Maya, it’s a consonant.'],
  ['Your birth name stays private', 'It’s used only for these numbers and never shown to anyone.'],
]

export function Numbers() {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const [how, setHow] = useState(false)
  const [run, setRun] = useState(0)
  const [seen, setSeen] = useState<Record<string, 'yes' | 'no'>>({})
  const consent = s.consents.numerology

  useEffect(() => {
    if (consent && s.chapters.numbers !== 'done') update(st => ({ ...st, chapters: { ...st.chapters, numbers: 'done' } }))
  }, [consent])

  const leave = () => (nav.canGoBack ? nav.pop() : nav.goTab('you'))

  if (!consent) return (
    <Screen top={<TopBar />} footer={
      <div className="stack gap-8">
        <Button kind="ember" block onClick={() => update(st => ({ ...st, consents: { ...st.consents, numerology: true } }))}>Show me my numbers</Button>
        <Button kind="quiet" block onClick={() => { toast('Understood. Your numbers stay off.'); leave() }}>Not for me</Button>
      </div>
    }>
      <div className="pad stack gap-24" style={{ alignItems: 'center', paddingTop: 12 }}>
        <DigitRing />
        <div className="stack gap-12 center">
          <Eyebrow>Your numbers · optional</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>A reflective lens, <span className="i">if you’d like one.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Numerology is a tradition, not a science. If you opt in, I’ll show you your numbers and how they’re worked out. They never change your compatibility band.</p>
        </div>
      </div>
    </Screen>
  )

  const c = myChart(s)
  const w = lifePathSteps(s.me.dob)
  const parts = [{ label: 'Month', raw: w.m }, { label: 'Day', raw: w.d }, { label: 'Year', raw: w.y }]
  const final = reduceChain(w.total)
  const karmic = [...new Map(c.karmic.map(k => [`${k.number}${k.on}`, k])).values()]

  return (
    <Screen top={<TopBar right={<Button kind="quiet" size="sm" icon="refresh" onClick={() => setRun(r => r + 1)}>Replay</Button>} />}
      footer={<Button kind="primary" block onClick={leave}>{nav.canGoBack ? 'Done' : 'Go to You'}</Button>}>
      <div className="pad stack gap-32" style={{ paddingTop: 4 }}>
        <div className="stack gap-12">
          <Eyebrow>The working</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Your Life Path, <span className="i">added up.</span></h1>
        </div>

        <div key={run} className="stack">
          {parts.map((p, i) => {
            const chain = reduceChain(p.raw)
            return (
              <motion.div key={p.label} className="cv-wrow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.7, duration: 0.6, ease }}>
                <span className="t-label faint">{p.label}</span>
                <span className="t-num cv-wraw">{p.raw}</span>
                <span className="serif cv-wres">{chain.at(-1)}</span>
                <span className="t-num faint cv-wsum">{arithmetic(chain) || 'Already a single number'}</span>
              </motion.div>
            )
          })}
          <motion.div className="cv-wtotal t-num" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 0.6 }}>
            {w.rm} + {w.rd} + {w.ry} = {w.total}{final.length > 1 && <> → {final.at(-1)}</>}
          </motion.div>
          <motion.div className="stack center" style={{ alignItems: 'center', gap: 6, marginTop: 8 }}
            initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.1, type: 'spring', damping: 28, stiffness: 140 }}>
            <span className="cv-lp">{c.lifePath}</span>
            <span className="t-label faint">Life Path</span>
            <span className="serif i" style={{ fontSize: 24 }}>{ARCHETYPE[c.lifePath].name}</span>
          </motion.div>
        </div>

        <section className="stack gap-12">
          <Eyebrow>Your folio</Eyebrow>
          <div className="card card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {FOLIO.map(f => {
              const n = c[f.key] as Num
              const a = f.key === 'personalYear' ? YEAR[n] ?? ARCHETYPE[n] : ARCHETYPE[n]
              const r = seen[f.key]
              return (
                <motion.div key={f.key} className="cv-folio" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.55, ease }}>
                  <span className={`cv-folio-n ${f.key === 'lifePath' ? 'accent' : ''}`}>{n}</span>
                  <div className="grow stack gap-4">
                    <div className="row gap-8"><span className="t-label faint">{f.label}</span>{n > 9 && <Tag tone="ember">Master number</Tag>}</div>
                    <span className="serif" style={{ fontSize: 21, lineHeight: 1.2 }}>{a.name}</span>
                    <span className="t-small muted">{a.line}</span>
                    <span className="t-small faint">{f.from}</span>
                    <div className="row gap-8 wrap" style={{ marginTop: 6 }}>
                      <span className="t-small faint">See this in yourself?</span>
                      <Chip size="sm" on={r === 'yes'} onClick={() => setSeen(x => ({ ...x, [f.key]: 'yes' }))}>Yes</Chip>
                      <Chip size="sm" on={r === 'no'} onClick={() => setSeen(x => ({ ...x, [f.key]: 'no' }))}>Not really</Chip>
                    </div>
                    <AnimatePresence>
                      {r && <motion.span key={r} className="serif i muted" style={{ fontSize: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {r === 'yes' ? 'Then keep it.' : 'Then leave it. Numbers don’t get the last word.'}
                      </motion.span>}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {karmic.map(k => KARMIC[k.number] && (
          <div key={`${k.number}${k.on}`} className="card-flat card-pad" style={{ padding: 18 }}>
            <p className="serif i" style={{ fontSize: 18.5, lineHeight: 1.4, margin: 0 }}>
              A <span className="t-num" style={{ fontStyle: 'normal' }}>{k.number}</span> appears on the way to your {k.on} number. Traditionally it speaks of {KARMIC[k.number]}.
            </p>
          </div>
        ))}

        <section className="stack gap-12">
          <Eyebrow>How much should numbers count?</Eyebrow>
          <Segmented value={s.me.resonance} options={WEIGHT} onChange={v => update(st => ({ ...st, me: { ...st.me, resonance: v } }))} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={s.me.resonance} className="serif i" style={{ fontSize: 18, margin: 0 }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
              {WEIGHT_LINE[s.me.resonance]}
            </motion.p>
          </AnimatePresence>
          <p className="t-small muted" style={{ margin: 0 }}>This only changes the order of your introductions, never your compatibility band. It is capped at 15%.</p>
        </section>

        <div className="card card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
          <ListRow icon="info" title="How Resonance works" sub="The house conventions, in plain words" onClick={() => setHow(true)} />
          <ListRow icon="eyeOff" title="Turn numbers off" sub="Hide this lens everywhere" onClick={() => {
            update(st => ({ ...st, consents: { ...st.consents, numerology: false }, me: { ...st.me, resonance: 'off' } }))
            toast('Numbers are off. Nothing else changes.')
          }} />
        </div>
      </div>

      <Sheet open={how} onClose={() => setHow(false)} title="How Resonance works">
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          {CONVENTIONS.map(([t, line], i) => (
            <div key={t} className="row gap-12" style={{ alignItems: 'flex-start' }}>
              <span className="t-num faint" style={{ width: 18, paddingTop: 2 }}>{i + 1}</span>
              <div className="stack gap-4"><span style={{ fontWeight: 550 }}>{t}</span><span className="t-small muted">{line}</span></div>
            </div>
          ))}
          <p className="t-quote" style={{ margin: '8px 0 0' }}>Numerology is a reflective tradition, not science.</p>
        </div>
      </Sheet>
    </Screen>
  )
}

/** Nine digits on a slow-turning ring: the invitation mark, with no numbers of yours shown before you say yes. */
function DigitRing() {
  return (
    <svg width="210" height="210" viewBox="0 0 210 210" aria-hidden>
      <circle cx="105" cy="105" r="80" fill="none" stroke="var(--line-2)" />
      <circle cx="105" cy="105" r="52" fill="none" stroke="var(--ink-3)" strokeDasharray="2 7" className="cv-ring" />
      <circle cx="105" cy="105" r="22" fill="var(--glow)" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 - Math.PI / 2, x = 105 + 80 * Math.cos(a), y = 105 + 80 * Math.sin(a)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="14" fill="var(--bg)" stroke="var(--line-2)" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="var(--ink-2)" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{i + 1}</text>
          </g>
        )
      })}
    </svg>
  )
}
