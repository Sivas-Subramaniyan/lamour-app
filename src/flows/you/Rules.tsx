// you/rules: standing orders Aura plans inside, the autonomy dial, and what Aura will never do without you.
import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { Screen, TopBar, Button, Chip, Tag, Eyebrow, Segmented, Sheet, Section, Toggle } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useApp, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { useFeedback } from '../../design/ui'
import { PERSONAS } from '../../data/personas'
import { useYou } from './shared'

type Order = 'when' | 'travel' | 'budget' | 'food' | 'vibe' | 'public' | 'add'
type Prefs = State['prefs']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIMES = ['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM']
const FOODS = ['Vegetarian-friendly', 'Vegan options', 'Halal', 'Kosher', 'Gluten-free', 'No shellfish']
const SUGGESTED = ['Daytime first dates', 'Step-free venues', 'No Sunday evenings', 'Somewhere I can walk home from']
const VIBE = { hushed: 'Quiet rooms', conversational: 'Rooms you can talk in', lively: 'Lively rooms' } as const
const NEVER = ['Send a message in your name', 'Spend your money', 'Share your number', 'Write to your calendar']
const LEVELS: { value: Prefs['autonomy']; title: string; body: string; angle: number }[] = [
  { value: 'ask', title: 'Ask me first', body: 'Aura suggests three evenings. Nothing is held or agreed until you choose.', angle: -58 },
  { value: 'negotiate', title: 'Negotiate for me', body: 'Aura works out a time and place inside both your rules. You seal it, or you don’t.', angle: 0 },
  { value: 'hold', title: 'Negotiate and hold tables', body: 'Aura can also hold a table for ten minutes while you decide. No deposit is ever taken without you.', angle: 58 },
]

function Dial({ value }: { value: Prefs['autonomy'] }) {
  const lv = LEVELS.find(l => l.value === value)!
  const idx = LEVELS.indexOf(lv)
  const a = useSpring(lv.angle, { damping: 26, stiffness: 160 })
  useEffect(() => { a.set(lv.angle) }, [a, lv.angle])
  const x2 = useTransform(a, v => 110 + 70 * Math.sin((v * Math.PI) / 180))
  const y2 = useTransform(a, v => 112 - 70 * Math.cos((v * Math.PI) / 180))
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [110 + 86 * Math.sin((a * Math.PI) / 180), 112 - 86 * Math.cos((a * Math.PI) / 180)]
    const [x0, y0] = p(a0), [x1, y1] = p(a1)
    return `M${x0} ${y0} A86 86 0 0 1 ${x1} ${y1}`
  }
  return (
    <svg viewBox="0 0 220 128" className="yu-dial" role="img" aria-label={`Autonomy: ${lv.title}`}>
      <path d={arc(-74, 74)} fill="none" stroke="var(--line-2)" strokeWidth="2" strokeLinecap="round" />
      <motion.path d={arc(-74, 74)} fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round"
        initial={false} animate={{ pathLength: [0.11, 0.5, 0.89][idx] }} transition={{ type: 'spring', damping: 30, stiffness: 140 }} />
      {LEVELS.map(l => {
        const a = (l.angle * Math.PI) / 180
        return <line key={l.value} x1={110 + 74 * Math.sin(a)} y1={112 - 74 * Math.cos(a)} x2={110 + 98 * Math.sin(a)} y2={112 - 98 * Math.cos(a)} stroke={l.value === value ? 'var(--ember)' : 'var(--ink-3)'} strokeWidth="1.5" />
      })}
      <motion.line x1="110" y1="112" x2={x2} y2={y2} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="110" cy="112" r="7" fill="var(--ember)" />
    </svg>
  )
}

export function Rules() {
  const { s, update } = useApp()
  const { x, set } = useYou()
  const nav = useNav()
  const { toast } = useFeedback()
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState<Order>('when')
  const p = s.prefs
  const them = PERSONAS[s.tonight.ids[0]]?.first ?? 'Kabir'
  const setP = (patch: Partial<Prefs>) => update(s => ({ ...s, prefs: { ...s.prefs, ...patch } }))
  const show = (o: Order) => { setOrder(o); setOpen(true) }
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(i => i !== v) : [...list, v])

  const orders: { key: Order; icon: IconName; label: string }[] = [
    { key: 'when', icon: 'calendar', label: `${p.days.length ? DAYS.filter(d => p.days.includes(d)).join(', ') : 'No evenings yet'} · after ${x.after}` },
    { key: 'travel', icon: 'clock', label: `Up to ${p.travelCap} min each way` },
    { key: 'budget', icon: 'wallet', label: `${'$'.repeat(p.budget)} · split unless one offers` },
    { key: 'food', icon: 'filter', label: p.food.length ? p.food.join(', ') : 'Any kitchen' },
    { key: 'vibe', icon: p.vibe === 'hushed' ? 'speakerOff' : 'speaker', label: VIBE[p.vibe] },
    { key: 'public', icon: 'lock', label: 'Public places only' },
  ]
  const TITLES: Record<Order, string> = { when: 'Which evenings', travel: 'How far', budget: 'Budget', food: 'Food and drink', vibe: 'The room', public: 'Public places only', add: 'Add a standing order' }

  const pickLevel = (v: Prefs['autonomy']) => {
    if (v === 'hold' && s.me.tier === 'invitation') { nav.push('premium/paywall', { reason: 'autonomy' }); return }
    setP({ autonomy: v })
    toast(v === 'ask' ? 'Aura will ask before anything.' : v === 'negotiate' ? 'Aura will negotiate. You still seal.' : 'Aura may now hold tables for ten minutes.')
  }

  return (
    <Screen top={<TopBar title="Your rules" />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-12">
          <Eyebrow>Standing orders</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Your rules, <span className="i">kept every time.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Aura plans inside these. Change one and every future evening follows it. Tap any order to edit it.</p>
        </div>

        <div className="row gap-8 wrap">
          {orders.map(o => (
            <button key={o.key} className={`yu-order ${o.key === 'public' ? 'locked' : ''}`} onClick={() => show(o.key)}>
              <Icon name={o.icon} size={16} />{o.label}
            </button>
          ))}
          {x.extraRules.map(r => (
            <button key={r} className="yu-order" onClick={() => { set(x => ({ extraRules: x.extraRules.filter(i => i !== r) })); toast(`Removed: ${r.toLowerCase()}.`) }} aria-label={`Remove ${r}`}>
              <Icon name="check" size={16} />{r}<Icon name="close" size={14} style={{ color: 'var(--ink-3)' }} />
            </button>
          ))}
          <button className="yu-order add" onClick={() => show('add')}><Icon name="plus" size={16} />Add a rule</button>
        </div>

        <Section label="How far Aura goes">
          <div className="card card-pad stack gap-16" style={{ alignItems: 'center' }}>
            <Dial value={p.autonomy} />
            <div className="stack gap-8" style={{ width: '100%' }}>
              {LEVELS.map(l => {
                const locked = l.value === 'hold' && s.me.tier === 'invitation'
                const on = p.autonomy === l.value
                return (
                  <button key={l.value} className={`yu-option ${on ? 'on' : ''}`} onClick={() => pickLevel(l.value)} aria-pressed={on}>
                    <span className="row between gap-8">
                      <span style={{ fontWeight: 600, fontSize: 15.5 }}>{l.title}</span>
                      {locked ? <Tag icon="lock">Soirée</Tag> : l.value === 'hold' ? <Tag tone="ember">Soirée</Tag> : on ? <Icon name="check" size={18} style={{ color: 'var(--ember)' }} /> : null}
                    </span>
                    <span className="t-small muted pretty">{l.body}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        <div className="card card-pad stack gap-12">
          <Eyebrow>Aura will never, without you</Eyebrow>
          {NEVER.map(n => (
            <div key={n} className="row gap-12">
              <span className="yu-never"><Icon name="close" size={14} stroke={2} /></span>
              <span className="t-body">{n}</span>
            </div>
          ))}
          <span className="t-small faint pretty">These aren’t settings. They’re how Aura is built, at every tier.</span>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={TITLES[order]}>
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          {order === 'when' && <>
            <div className="row gap-8 wrap">{DAYS.map(d => <Chip key={d} on={p.days.includes(d)} onClick={() => setP({ days: toggle(p.days, d) })}>{d}</Chip>)}</div>
            <Eyebrow>Weeknights start after</Eyebrow>
            <Segmented value={x.after} onChange={v => set({ after: v })} options={TIMES.map(t => ({ value: t, label: t.replace(' PM', '') }))} />
            <p className="t-small muted" style={{ margin: 0 }}>Aura only proposes evenings you’ve opened here, and never earlier than {x.after} on a weeknight.</p>
          </>}
          {order === 'travel' && <>
            <Segmented value={String(p.travelCap)} onChange={v => setP({ travelCap: Number(v) })} options={['15', '20', '30', '45'].map(m => ({ value: m, label: `${m} min` }))} />
            <p className="t-small muted" style={{ margin: 0 }}>Each of you, door to door. Aura looks for somewhere fair to both of you and shows minutes, never an address.</p>
          </>}
          {order === 'budget' && <>
            <Segmented value={String(p.budget)} onChange={v => setP({ budget: Number(v) as 1 | 2 | 3 })} options={[{ value: '1', label: '$' }, { value: '2', label: '$$' }, { value: '3', label: '$$$' }]} />
            <p className="t-small muted" style={{ margin: 0 }}>Split, unless one of you offers. Aura never pays for anything on your behalf.</p>
          </>}
          {order === 'food' && <>
            <div className="row gap-8 wrap">{FOODS.map(f => <Chip key={f} on={p.food.includes(f)} onClick={() => setP({ food: toggle(p.food, f) })}>{f}</Chip>)}</div>
            <div className="row gap-12"><span className="grow t-callout">Somewhere that serves drinks</span><Toggle on={p.alcohol} label="Somewhere that serves drinks" onChange={v => setP({ alcohol: v })} /></div>
            <p className="t-small muted" style={{ margin: 0 }}>Shared with venues as a dietary note, never with your name attached.</p>
          </>}
          {order === 'vibe' && <>
            <Segmented value={p.vibe} onChange={v => setP({ vibe: v })} options={[{ value: 'hushed', label: 'Quiet' }, { value: 'conversational', label: 'Talkable' }, { value: 'lively', label: 'Lively' }]} />
            <p className="t-small muted" style={{ margin: 0 }}>{p.vibe === 'hushed' ? 'Rooms where you can hear each other without leaning in.' : p.vibe === 'conversational' ? 'A little buzz, but you won’t have to raise your voice.' : 'Music and a crowd. Better for a second evening than a first.'}</p>
          </>}
          {order === 'public' && <>
            <div className="row gap-12"><span className="yu-halo-ico"><Icon name="lock" size={18} /></span><span className="t-body">Always on for first evenings.</span></div>
            <p className="t-callout muted pretty" style={{ margin: 0 }}>Every first meeting is somewhere public, staffed and well lit, and each of you travels there separately. This one isn’t a setting, so {them} has it too.</p>
          </>}
          {order === 'add' && <>
            <div className="row gap-8 wrap">
              {SUGGESTED.filter(r => !x.extraRules.includes(r)).map(r => (
                <Chip key={r} icon="plus" onClick={() => { set(x => ({ extraRules: [...x.extraRules, r] })); setOpen(false); toast('Added to your standing orders.') }}>{r}</Chip>
              ))}
            </div>
            {SUGGESTED.every(r => x.extraRules.includes(r)) && <p className="t-small muted" style={{ margin: 0 }}>You’ve added every suggestion. Tell Aura anything else in conversation.</p>}
          </>}
          <Button kind="primary" block onClick={() => { setOpen(false); if (order !== 'public' && order !== 'add') toast('Saved. Every future plan follows it.') }}>Done</Button>
        </div>
      </Sheet>
    </Screen>
  )
}
