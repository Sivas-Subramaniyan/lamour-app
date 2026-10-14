// dates/list: the Plans tab. Sealed evenings as mini Date Passes, negotiations in progress, and what's behind you.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, Segmented, Tag, Eyebrow, IconButton, ListRow, EmptyState, Button, PairAvatars, Portrait } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, useNow, fmtTime, fmtLongDay, type Plan } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { venue, venuePhoto } from '../../data/venues'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { weekday, shortDate, relDay, holdLeft } from './kit'

type Tab = 'up' | 'neg' | 'past'
const when = (p: Plan) => p.options[p.chosen ?? 0]?.when ?? p.options[0].when
const ease = [0.22, 1, 0.36, 1] as const

export function PlansList(_: ScreenProps) {
  const { s } = useApp()
  const nav = useNav()
  const now = useNow(30000)
  const upcoming = s.plans.filter(p => p.status === 'sealed' || p.status === 'live').sort((a, b) => when(a).localeCompare(when(b)))
  const negotiating = s.plans.filter(p => p.status === 'negotiating' || p.status === 'awaiting')
  const past = s.plans.filter(p => p.status === 'done' || p.status === 'cancelled').reverse()
  const ready = s.connections.filter(c => (c.stage === 'introduced' || c.stage === 'talking') && !s.plans.some(p => p.with === c.id && p.status !== 'cancelled' && p.status !== 'done'))
  const [tab, setTab] = useState<Tab>(upcoming.length ? 'up' : negotiating.length || ready.length ? 'neg' : 'up')
  const nextTable = ready[0]?.id ?? s.tonight.ids[0]
  const p = s.prefs

  return (
    <Screen>
      <div className="pad stack gap-24" style={{ paddingTop: 10 }}>
        <div className="stack gap-8">
          <div className="row between">
            <Eyebrow>{fmtLongDay(now)}</Eyebrow>
            <IconButton icon="plus" label="Shall I set a table?" variant="filled" onClick={() => nav.push('dates/prefs', { id: nextTable })} />
          </div>
          <h1 className="t-title" style={{ margin: 0 }}>Your evenings</h1>
          <p className="t-quote muted" style={{ margin: 0, fontSize: 19 }}>Aura keeps the tables. You keep the evenings.</p>
        </div>

        <Segmented<Tab> value={tab} onChange={setTab} options={[
          { value: 'up', label: `Upcoming${upcoming.length ? ` · ${upcoming.length}` : ''}` },
          { value: 'neg', label: `Negotiating${negotiating.length ? ` · ${negotiating.length}` : ''}` },
          { value: 'past', label: 'Past' },
        ]} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} className="stack gap-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease }}>
            {tab === 'up' && (upcoming.length
              ? upcoming.map((pl, i) => <MiniPass key={pl.id} plan={pl} i={i} now={now} me={{ photo: s.me.photos[0], name: s.me.name }} onOpen={() => nav.push('dates/pass', { id: pl.with })} />)
              : <EmptyState icon="ticket" title="Nothing sealed yet" body="When you and someone both seal an evening, the Date Pass lives here."
                  action={<Button kind="ember" size="md" onClick={() => nav.push('dates/prefs', { id: nextTable })}>Shall I set a table?</Button>} />)}

            {tab === 'neg' && (
              negotiating.length || ready.length ? (
                <>
                  {negotiating.map((pl, i) => {
                    const pr = PERSONAS[pl.with]
                    const awaiting = pl.status === 'awaiting'
                    const chose = pl.chosen !== undefined
                    const left = holdLeft(pl)
                    return (
                      <motion.button key={pl.id} className="card card-pad dt-neg" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.5, ease }}
                        onClick={() => nav.push(awaiting || chose ? 'dates/seal' : 'dates/proposals', { id: pl.with })}>
                        <Portrait photo={pr.photos.portrait} name={pr.first} shape="arch" w={56} h={70} />
                        <span className="grow stack gap-4">
                          <span className="t-label faint">{awaiting ? 'Waiting on their seal' : 'Three evenings'}</span>
                          <span className="serif" style={{ fontSize: 23, lineHeight: 1.15 }}>With {pr.first}</span>
                          <span className="t-small muted">
                            {awaiting ? `Your side is sealed · waiting for ${pr.first}` : chose ? `You chose ${weekday(when(pl))}. Ready to seal.` : left ? 'Aura is holding three tables' : 'The holds lapsed. Tap to ask again.'}
                          </span>
                        </span>
                        <Icon name="chevron" size={18} style={{ color: 'var(--ink-3)' }} />
                      </motion.button>
                    )
                  })}
                  {ready.length > 0 && (
                    <div className="stack" style={{ marginTop: negotiating.length ? 8 : 0 }}>
                      <Eyebrow style={{ marginBottom: 4 }}>Ready when you are</Eyebrow>
                      {ready.map(c => {
                        const pr = PERSONAS[c.id]
                        return (
                          <ListRow key={c.id} title={`Shall I set a table with ${pr.first}?`} sub="You’ve been talking. I can find three evenings that suit you both."
                            right={<Portrait photo={pr.photos.portrait} name={pr.first} shape="circle" w={40} h={40} />}
                            onClick={() => nav.push('dates/prefs', { id: c.id })} />
                        )
                      })}
                    </div>
                  )}
                </>
              ) : <EmptyState icon="calendar" title="Nothing in the works" body="Once a conversation warms up, Aura offers to find three evenings that work for you both." />
            )}

            {tab === 'past' && (past.length
              ? past.map(pl => {
                  const pr = PERSONAS[pl.with], v = venue(pl.options[pl.chosen ?? 0]?.venueId ?? pl.options[0].venueId)
                  const row = { title: pl.status === 'done' ? `${weekday(when(pl))} with ${pr.first}` : `${weekday(when(pl))}, cancelled with notice`, sub: `${v.name} · ${shortDate(when(pl))}` }
                  return pl.status === 'done'
                    ? <ListRow key={pl.id} icon="book" {...row} onClick={() => nav.push('after/morning', { id: pl.with })} />
                    : <ListRow key={pl.id} icon="clock" {...row} />
                })
              : <EmptyState icon="book" title="No evenings behind you yet" body="After a date, the debrief and what Aura learned will live here." />)}
          </motion.div>
        </AnimatePresence>

        <button className="dt-salon" onClick={() => nav.push('premium/membership')}>
          <span className="t-label">Salon · by invitation</span>
          <span className="serif" style={{ fontSize: 30, lineHeight: 1.05, marginTop: 10 }}>Dinner for six</span>
          <span className="t-num" style={{ fontSize: 13.5, marginTop: 4 }}>Thursday 29 October</span>
          <span className="dt-salon-sub">Six members, one long table, a chef’s menu. Aura does the seating.</span>
          <span className="dt-salon-go"><Icon name="chevron" size={18} /></span>
        </button>

        <div className="stack">
          <ListRow icon="feather" title="Your rules" onClick={() => nav.push('you/rules')}
            sub={`${p.days.join(', ') || 'Any evening'} · under ${p.travelCap} min · ${'$'.repeat(p.budget)} · ${p.vibe} rooms`} />
        </div>
      </div>
    </Screen>
  )
}

function MiniPass({ plan, i, now, me, onOpen }: { plan: Plan; i: number; now: Date; me: { photo?: string; name: string }; onOpen: () => void }) {
  const pr = PERSONAS[plan.with]
  const o = plan.options[plan.chosen ?? 0] ?? plan.options[0]
  const v = venue(o.venueId)
  const live = plan.status === 'live'
  return (
    <motion.button className="card dt-mini" onClick={onOpen} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.6, ease }}
      aria-label={`Date Pass with ${pr.first}, ${weekday(o.when)} at ${fmtTime(o.when)}`}>
      <div className="dt-mini-photo">
        <Portrait photo={plan.surprise ? undefined : venuePhoto(v)} name={plan.surprise ? '?' : v.name} shape="rect" w="100%" h={104} style={{ borderRadius: 0 }} />
        <span className="dt-mini-tag">{live ? <Tag tone="ember">Tonight</Tag> : <Tag tone="dark">{relDay(o.when, now)}</Tag>}</span>
      </div>
      <div className="dt-mini-body">
        <div className="row between">
          <span className="t-label faint">Date Pass · <span className="t-num">{plan.passNo}</span></span>
          <Tag tone="sage" icon="check">Sealed</Tag>
        </div>
        <div className="row between" style={{ alignItems: 'flex-end', marginTop: 8 }}>
          <div className="stack">
            <span className="serif" style={{ fontSize: 34, lineHeight: 1 }}>{weekday(o.when)}</span>
            <span className="t-num t-small muted" style={{ marginTop: 6 }}>{shortDate(o.when)} · {fmtTime(o.when)}</span>
          </div>
          <PairAvatars a={me} b={{ photo: pr.photos.portrait, name: pr.first }} size={40} />
        </div>
        <div className="dt-perf" />
        <div className="row between t-small">
          <span className="muted">With <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{pr.first}</b> · {plan.surprise ? 'a surprise until 10 AM' : `${v.name}, ${v.hood}`}</span>
          <Icon name="chevron" size={16} style={{ color: 'var(--ink-3)' }} />
        </div>
      </div>
    </motion.button>
  )
}
