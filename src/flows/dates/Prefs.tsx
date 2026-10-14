// dates/prefs: "Shall I set a table?" Every choice writes straight to s.prefs, the standing rules Aura negotiates with.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, IconButton, Chip, Toggle, Segmented, Section, Sheet, Orb, AiBadge, Tag, Eyebrow } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useApp, useNow, leadId, planWith, startPlan, proposalsFor, fmtDay, type State } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { session, closeModal } from './kit'

type Prefs = State['prefs']
const FOOD = ['Vegetarian-friendly', 'Vegan options', 'No shellfish', 'Halal', 'Gluten-free']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BUDGET: { n: 1 | 2 | 3; line: string }[] = [
  { n: 1, line: 'Coffee, wine, small plates' },
  { n: 2, line: 'Dinner, about $90 for two' },
  { n: 3, line: 'An occasion' },
]
const VIBE: Record<Prefs['vibe'], string> = {
  hushed: 'Low light, low voices. Good for listening.',
  conversational: 'Busy enough to feel easy, quiet enough to hear each other.',
  lively: 'Music and a crowd. Less pressure to fill silences.',
}
const CALENDARS: { name: string; icon: IconName }[] = [{ name: 'Google', icon: 'calendar' }, { name: 'Outlook', icon: 'calendar' }, { name: 'iCloud', icon: 'calendar' }]

export function PrefsScreen({ params }: ScreenProps) {
  const { s, update } = useApp()
  const nav = useNav()
  const now = useNow(60000)
  const id = leadId(s, params)
  const first = PERSONAS[id].first
  const p = s.prefs
  const set = (patch: Partial<Prefs>) => update(st => ({ ...st, prefs: { ...st.prefs, ...patch } }))
  const toggleIn = (list: string[], x: string) => (list.includes(x) ? list.filter(y => y !== x) : [...list, x])

  const [calendar, setCalendar] = useState(session.calendar)
  const [named, setNamed] = useState(session.named)
  const [sheet, setSheet] = useState<'' | 'calendar' | 'name'>('')
  const [connecting, setConnecting] = useState('')
  const [pick, setPick] = useState<string[]>(session.named)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const connect = (name: string) => {
    setConnecting(name)
    timer.current = window.setTimeout(() => {
      setConnecting('')
      setCalendar(name); session.calendar = name
      setNamed([]); session.named = []
    }, 1300)
  }
  const evenings = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 + i, 19))

  const find = () => {
    update(st => {
      const pl = planWith(st, id)
      if (pl && pl.status !== 'done') return st // already in the works or sealed: reuse it
      return startPlan(st, id, proposalsFor(st, id, pl ? 1 : 0)).s // a second evening goes to the following week
    })
    nav.replace('dates/planning', { id })
  }

  const autonomy = {
    ask: `I’ll suggest evenings and wait for your yes before I contact anyone.`,
    negotiate: `I’ll compare evenings with ${first}’s side and bring you three. Nothing is booked until you both seal.`,
    hold: `I’ll compare evenings with ${first}’s side and hold tables while you decide. Nothing is booked until you both seal.`,
  }[p.autonomy]

  return (
    <Screen top={<TopBar left={<IconButton icon="close" label="Close" onClick={() => closeModal(nav)} />} right={<AiBadge text="Aura" />} />}
      footer={
        <div className="stack gap-8">
          <Button kind="ember" block onClick={find} icon="sparkle">Find our evenings</Button>
          <span className="t-small faint center">Nothing is booked until you both seal.</span>
        </div>
      }>
      <div className="pad stack gap-32" style={{ paddingTop: 4 }}>
        <motion.div className="stack gap-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="row gap-12"><Orb size={30} /><Eyebrow>For you and {first}</Eyebrow></div>
          <h1 className="t-title balance" style={{ margin: 0 }}><span className="i">Shall I set a table?</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>
            Tell me how you like an evening. I’ll compare notes with {first}’s side and come back with three that are fair to you both.
          </p>
        </motion.div>

        <Section label="Budget">
          <div className="dt-tiles" role="radiogroup" aria-label="Budget">
            {BUDGET.map(b => (
              <button key={b.n} role="radio" aria-checked={p.budget === b.n} className={`dt-tile ${p.budget === b.n ? 'on' : ''}`} onClick={() => set({ budget: b.n })}>
                <span className="t-num" style={{ fontSize: 17, fontWeight: 600 }}>{'$'.repeat(b.n)}</span>
                <span className="t-small dt-tile-sub">{b.line}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section label="Food">
          <div className="row wrap gap-8">
            {FOOD.map(f => <Chip key={f} on={p.food.includes(f)} onClick={() => set({ food: toggleIn(p.food, f) })}>{f}</Chip>)}
          </div>
        </Section>

        <Section label="Drinks">
          <div className="row gap-16">
            <span className="grow stack gap-4">
              <span style={{ fontWeight: 550, fontSize: 15.5 }}>A drink is welcome</span>
              <span className="t-small muted">{p.alcohol ? 'A glass of wine is fine. No bar crawls.' : 'I’ll choose rooms that don’t center the bar.'}</span>
            </span>
            <Toggle on={p.alcohol} onChange={v => set({ alcohol: v })} label="A drink is welcome" />
          </div>
        </Section>

        <Section label="The room">
          <Segmented<Prefs['vibe']> value={p.vibe} onChange={v => set({ vibe: v })} options={[
            { value: 'hushed', label: 'Hushed' }, { value: 'conversational', label: 'Conversational' }, { value: 'lively', label: 'Lively' },
          ]} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={p.vibe} className="t-small muted" style={{ margin: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{VIBE[p.vibe]}</motion.p>
          </AnimatePresence>
        </Section>

        <Section label="Evenings that suit you">
          <div className="row wrap gap-8">
            {DAYS.map(d => <Chip key={d} on={p.days.includes(d)} onClick={() => set({ days: DAYS.filter(x => toggleIn(p.days, d).includes(x)) })}>{d}</Chip>)}
          </div>
        </Section>

        <Section label="Travel, each way" action={<span className="t-num" style={{ fontSize: 14 }}>Up to {p.travelCap} min</span>}>
          <input className="dt-range" type="range" min={10} max={45} step={5} value={p.travelCap} aria-label="Travel cap in minutes"
            onChange={e => set({ travelCap: Number(e.target.value) })} />
          <div className="row between t-small faint" style={{ marginTop: -6 }}><span className="t-num">10</span><span className="t-num">45</span></div>
          <span className="t-small muted">I keep you both within a few minutes of each other, so neither of you crosses the city alone.</span>
        </Section>

        <Section label="When you’re free">
          <div className="dt-choices">
            <button className={`dt-choice ${calendar ? 'on' : ''}`} onClick={() => setSheet('calendar')}>
              <Icon name="calendar" size={22} />
              <span className="stack gap-4">
                <span style={{ fontWeight: 600 }}>Use my calendar</span>
                <span className="t-small dt-tile-sub">{calendar ? `${calendar} · free/busy only` : 'I read free and busy, nothing else'}</span>
              </span>
            </button>
            <button className={`dt-choice ${named.length ? 'on' : ''}`} onClick={() => setSheet('name')}>
              <Icon name="feather" size={22} />
              <span className="stack gap-4">
                <span style={{ fontWeight: 600 }}>I’ll name three evenings</span>
                <span className="t-small dt-tile-sub">{named.length ? named.join(' · ') : 'No calendar needed'}</span>
              </span>
            </button>
          </div>
        </Section>

        <div className="card card-aura card-pad stack gap-12">
          <div className="row between"><Eyebrow>What I’ll do on my own</Eyebrow><Tag tone="ember">{p.autonomy === 'ask' ? 'Ask first' : p.autonomy === 'negotiate' ? 'Negotiate' : 'Hold tables'}</Tag></div>
          <p className="t-quote" style={{ margin: 0, fontSize: 19 }}>{autonomy}</p>
          <button className="row gap-8 t-small" style={{ color: 'var(--ink-2)', fontWeight: 550, minHeight: 40 }} onClick={() => nav.push('you/rules')}>
            Change this in your rules <Icon name="chevron" size={15} />
          </button>
        </div>
      </div>

      <Sheet open={sheet === 'calendar'} onClose={() => setSheet('')} title="Use my calendar">
        <div className="stack gap-16">
          <p className="t-callout muted" style={{ margin: 0 }}>I only see when you’re free or busy. Never titles, places or who you’re with.</p>
          <div className="stack">
            {CALENDARS.map(c => {
              const on = calendar === c.name, busy = connecting === c.name
              return (
                <button key={c.name} className="list-row" onClick={() => !connecting && connect(c.name)} disabled={!!connecting && !busy}>
                  <span className="ico"><Icon name={c.icon} size={20} /></span>
                  <span className="grow stack gap-4">
                    <span style={{ fontWeight: 550, fontSize: 15.5 }}>{c.name} Calendar</span>
                    <span className="t-small muted">{busy ? 'Connecting…' : on ? 'Connected · free/busy only' : 'Free/busy only'}</span>
                  </span>
                  {on ? <Tag tone="sage" icon="check">Connected</Tag> : busy ? <span className="dt-spin" aria-label="Connecting" /> : <Icon name="chevron" size={18} style={{ color: 'var(--ink-3)' }} />}
                </button>
              )
            })}
          </div>
          <Button kind="primary" block disabled={!calendar} onClick={() => setSheet('')}>Done</Button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'name'} onClose={() => setSheet('')} title="Name three evenings">
        <div className="stack gap-16">
          <p className="t-callout muted" style={{ margin: 0 }}>Pick three in the coming week. I’ll match them against {first}’s.</p>
          <div className="row wrap gap-8">
            {evenings.map(d => {
              const label = fmtDay(d)
              const on = pick.includes(label)
              return <Chip key={label} on={on} onClick={() => setPick(on ? pick.filter(x => x !== label) : pick.length < 3 ? [...pick, label] : pick)}>{label}</Chip>
            })}
          </div>
          <span className="t-small faint"><span className="t-num">{pick.length}</span> of 3 chosen</span>
          <Button kind="primary" block disabled={pick.length !== 3} onClick={() => {
            setNamed(pick); session.named = pick
            setCalendar(''); session.calendar = ''
            setSheet('')
          }}>Use these three</Button>
        </div>
      </Sheet>
    </Screen>
  )
}
