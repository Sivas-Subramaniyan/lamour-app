// conv/life-design: your non-negotiables. An answer and a firmness for each, so Aura knows what to hold to and what to flag.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Chip, Segmented, Tag, Eyebrow, useFeedback } from '../../design/ui'
import { useApp, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import type { Lifestyle } from '../../lib/compat'

type Firmness = 'hard' | 'flexible' | 'any'
type Topic = { id: string; title: string; note?: string; optional?: boolean; options: [string, string][] }

const TOPICS: Topic[] = [
  { id: 'kids', title: 'Children', options: [['want', 'Want them'], ['open', 'Open'], ['dont', 'Don’t want them'], ['have', 'Have kids']] },
  { id: 'marriage', title: 'Marriage', options: [['soon', 'Within two years'], ['someday', 'Someday'], ['unsure', 'Not sure yet'], ['no', 'Not for me']] },
  { id: 'relocate', title: 'Where to live', options: [['no', 'Staying in New York'], ['maybe', 'Open to moving'], ['yes', 'Happy to move']] },
  { id: 'faith', title: 'Faith', optional: true, note: 'Only what you choose to declare. Leave it unsaid and I’ll never guess.', options: [['0', 'Not part of my life'], ['1', 'Quietly'], ['2', 'Important'], ['3', 'Central'], ['unsaid', 'Prefer not to say']] },
  { id: 'drinks', title: 'Drinking', options: [['never', 'Never'], ['socially', 'Socially'], ['often', 'Often']] },
  { id: 'smokes', title: 'Smoking', options: [['no', 'Don’t smoke'], ['yes', 'Smoke']] },
  { id: 'pets', title: 'Pets', options: [['dog', 'Have a dog'], ['cat', 'Have a cat'], ['want', 'Want one'], ['allergic', 'Allergic'], ['none', 'Rather not']] },
  { id: 'diet', title: 'Diet', options: [['anything', 'Eat anything'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['halal', 'Halal'], ['kosher', 'Kosher']] },
]
const FIRM: { value: Firmness; label: string }[] = [{ value: 'hard', label: 'Hard' }, { value: 'flexible', label: 'Flexible' }, { value: 'any', label: 'Don’t mind' }]
const MEANS: Record<Firmness, string> = { hard: 'Never someone who differs', flexible: 'I’ll tell you first', any: 'Won’t come up' }

type Design = NonNullable<State['lifeDesign']>
function initial(s: State): Design {
  const l = s.me.traits.lifestyle
  return {
    kids: { answer: l.kids, firmness: 'hard' },
    marriage: { answer: 'someday', firmness: 'flexible' },
    relocate: { answer: l.relocate, firmness: 'flexible' },
    faith: { answer: String(l.faith), firmness: 'any' },
    drinks: { answer: l.drinks, firmness: 'flexible' },
    smokes: { answer: l.smokes ? 'yes' : 'no', firmness: 'hard' },
    pets: { answer: 'want', firmness: 'any' },
    diet: { answer: 'vegetarian', firmness: 'flexible' },
    ...s.lifeDesign,
  }
}

export function LifeDesign() {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const [d, setD] = useState<Design>(() => initial(s))
  const set = (id: string, patch: Partial<Design[string]>) => setD(x => ({ ...x, [id]: { ...x[id], ...patch } }))
  const count = (f: Firmness) => TOPICS.filter(t => d[t.id].firmness === f).length

  const save = () => {
    update(st => {
      const l = st.me.traits.lifestyle
      const lifestyle: Lifestyle = {
        kids: d.kids.answer as Lifestyle['kids'],
        relocate: d.relocate.answer as Lifestyle['relocate'],
        drinks: d.drinks.answer as Lifestyle['drinks'],
        smokes: d.smokes.answer === 'yes',
        faith: d.faith.answer === 'unsaid' ? l.faith : (Number(d.faith.answer) as Lifestyle['faith']),
      }
      return { ...st, lifeDesign: d, me: { ...st.me, traits: { ...st.me.traits, lifestyle } } }
    })
    toast('Saved. I’ll hold to these.')
    if (nav.canGoBack) nav.pop()
    else nav.goTab('aura')
  }

  return (
    <Screen top={<TopBar title="Life design" />} footer={<Button kind="commit" block onClick={save}>Save my lines</Button>}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <motion.div className="stack gap-12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <Eyebrow>Your non-negotiables</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>The life <span className="i">you’re building</span></h1>
        </motion.div>

        <div className="card card-aura card-pad stack gap-8">
          <p className="serif i" style={{ fontSize: 19, lineHeight: 1.35, margin: 0 }}>Hard means I’ll never introduce someone who differs. Flexible means I’ll tell you first.</p>
          <p className="t-small muted" style={{ margin: 0 }}>Don’t mind means it won’t come up at all. You can change any of these later.</p>
        </div>

        <div className="row gap-8 wrap" aria-live="polite">
          {(['hard', 'flexible', 'any'] as Firmness[]).map(f => (
            <AnimatePresence key={f} mode="popLayout" initial={false}>
              <motion.span key={`${f}${count(f)}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.25 }}>
                <Tag tone={f === 'hard' ? 'dark' : undefined}><span className="t-num">{count(f)}</span>&nbsp;{f === 'any' ? 'don’t mind' : f}</Tag>
              </motion.span>
            </AnimatePresence>
          ))}
        </div>

        {TOPICS.map(t => {
          const v = d[t.id]
          const unsaid = t.id === 'faith' && v.answer === 'unsaid'
          return (
            <section key={t.id} className="stack gap-12 cv-topic">
              <div className="row between gap-8" style={{ alignItems: 'baseline' }}>
                <span className="serif" style={{ fontSize: 22 }}>{t.title}{t.optional && <span className="t-small faint" style={{ fontFamily: 'var(--sans)', marginLeft: 8 }}>Optional</span>}</span>
                <span className="t-small faint">{unsaid ? 'Never used' : MEANS[v.firmness]}</span>
              </div>
              {t.note && <p className="t-small muted" style={{ margin: 0 }}>{t.note}</p>}
              <div className="row gap-8 wrap">
                {t.options.map(([value, label]) => (
                  <Chip key={value} on={v.answer === value} onClick={() => set(t.id, value === 'unsaid' ? { answer: value, firmness: 'any' } : { answer: value })}>{label}</Chip>
                ))}
              </div>
              {!unsaid && <Segmented value={v.firmness} options={FIRM} onChange={f => set(t.id, { firmness: f })} />}
            </section>
          )
        })}
      </div>
    </Screen>
  )
}
