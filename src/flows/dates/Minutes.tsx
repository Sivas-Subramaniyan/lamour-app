// dates/minutes: Parley Minutes. What both sides settled, what was flagged, what's left for the two of you. Every line is sourced.
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Eyebrow, PairAvatars, AiBadge, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useNow, fmtDay, fmtTime } from '../../state/store'
import { venue } from '../../data/venues'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { usePlan, SourceChip, nums, weekday } from './kit'

type Line = { t: string; why?: string; src: string[] }
const ease = [0.22, 1, 0.36, 1] as const
const join = (a: string[]) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)

export function Minutes({ params }: ScreenProps) {
  const { s, id, plan, p, first } = usePlan(params)
  const nav = useNav()
  const now = useNow(60000)
  const { toast } = useFeedback()
  const [kept, setKept] = useState<string[]>([])
  const theirs = `from ${first}’s rules`
  const pr = s.prefs

  const slots = plan.options.map(o => `${weekday(o.when)} ${new Date(o.when).getHours() >= 17 ? 'evening' : 'lunch'}`)
  const gaps = plan.options.map(o => ({ o, d: o.minsThem - o.minsMe })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
  const widest = gaps[0]
  const anyLively = plan.options.some(o => venue(o.venueId).noise === 'lively')
  const sundays = p.pages.some(x => /sunday/i.test(x.label)) && s.me.prompts.some(x => /sunday/i.test(x.label))

  const agreed: Line[] = [
    { t: `Both free ${join(slots)}`, src: ['from both calendars'] },
    { t: `Both prefer ${pr.vibe} rooms`, src: ['from your rules', theirs] },
    ...(pr.food.length ? [{ t: `${join(pr.food)} at every table`, src: ['from your rules'] }] : []),
    { t: pr.alcohol ? 'A glass of wine is welcome. No bar crawls.' : 'Rooms that don’t center the bar', src: ['from your rules'] },
    { t: `Under ${pr.travelCap} minutes each way, for each of you`, src: ['from your rules', theirs] },
    { t: 'Split the bill, unless one of you offers', src: [theirs] },
  ]
  const flagged: Line[] = [
    { t: `${first} prefers not to plan more than a week ahead`, why: 'So every evening here falls within seven days.', src: [theirs] },
    ...(widest && Math.abs(widest.d) >= 4 ? [{
      t: `${weekday(widest.o.when)} asks ${Math.abs(widest.d)} more minutes of ${widest.d > 0 ? first : 'you'}`,
      why: widest.d > 0 ? `${first} said that’s fine for the right room.` : 'Your rules allow it. Swap the room if you’d rather not.',
      src: [widest.d > 0 ? theirs : 'from your rules'],
    }] : []),
    ...(!anyLively && pr.vibe !== 'lively' ? [{ t: 'Loud rooms came up as a no', why: 'So the supper clubs stayed off the list.', src: ['from your chats'] }] : []),
  ]
  const left: Line[] = [
    { t: 'Who picks the second place', why: 'You both joked about it. I stayed out of it.', src: ['from your chats'] },
    { t: 'What Sundays are for', why: 'You both wrote about Sundays. That one is a conversation, not a booking.', src: [sundays ? 'from both your pages' : 'from your pages'] },
    { t: 'Whether it’s one drink or dinner', why: 'Every room here does either. Decide on the night.', src: ['from your rules'] },
  ]

  const keep = (t: string) => {
    const on = kept.includes(t)
    setKept(on ? kept.filter(x => x !== t) : [...kept, t])
    toast(on ? 'Removed from your Brief.' : 'Kept for your Brief on the day.')
  }

  const sections: { n: string; title: string; lines: Line[]; keepable?: boolean }[] = [
    { n: 'I', title: 'Agreed', lines: agreed },
    { n: 'II', title: 'Gently flagged', lines: flagged },
    { n: 'III', title: 'Left for you two', lines: left, keepable: true },
  ]
  let k = 0

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 2 }}>
        <div className="stack gap-8">
          <Eyebrow>Parley Minutes</Eyebrow>
          <h1 className="t-title" style={{ margin: 0 }}><span className="i">The minutes</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>
            I compared notes with {first}’s side so neither of you had to haggle. Here’s what was settled, and what wasn’t.
          </p>
        </div>

        <div className="dt-doc">
          <div className="row between" style={{ paddingBottom: 18 }}>
            <PairAvatars a={{ photo: s.me.photos[0], name: s.me.name }} b={{ photo: p.photos.portrait, name: first }} size={34} />
            <span className="t-small faint" style={{ textAlign: 'right' }}>
              <span className="t-num">{fmtDay(now)} · {fmtTime(now)}</span><br />{s.me.name} and {first}
            </span>
          </div>

          {sections.map(sec => (
            <section key={sec.n} className="dt-min-sec">
              <div className="dt-min-h"><span className="dt-min-n">{sec.n}</span><span className="t-head">{sec.title}</span></div>
              {sec.lines.map(l => {
                const delay = 0.15 + k++ * 0.06
                const on = kept.includes(l.t)
                return (
                  <motion.div key={l.t} className="dt-line" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease }}>
                    <div className="row between gap-12" style={{ alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16, lineHeight: 1.45 }}>{nums(l.t)}</span>
                      {sec.keepable && (
                        <button className={`dt-keep ${on ? 'on' : ''}`} aria-pressed={on} aria-label={on ? 'Kept for your Brief' : 'Keep for your Brief'} onClick={() => keep(l.t)}>
                          <Icon name={on ? 'check' : 'plus'} size={16} />
                        </button>
                      )}
                    </div>
                    {l.why && <span className="i serif muted" style={{ fontSize: 16.5, lineHeight: 1.35 }}>{l.why}</span>}
                    <div className="row gap-8 wrap">{l.src.map(x => <SourceChip key={x}>{x}</SourceChip>)}</div>
                  </motion.div>
                )
              })}
            </section>
          ))}

          <div className="dt-doc-foot">
            <Icon name="feather" size={18} style={{ color: 'var(--ink-3)' }} />
            <span className="t-quote" style={{ fontSize: 19 }}>Nothing here was said in your voice.</span>
            <span className="t-small muted">I spoke for your calendar and your rules. The rest is yours to say.</span>
          </div>
        </div>

        <Button kind="primary" block onClick={() => (nav.canGoBack ? nav.pop() : nav.replace('dates/proposals', { id }))}>{plan.status === 'negotiating' ? 'Back to the three evenings' : 'Done'}</Button>
      </div>
    </Screen>
  )
}
