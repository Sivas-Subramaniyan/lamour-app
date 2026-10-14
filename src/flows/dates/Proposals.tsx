// dates/proposals: Three evenings on a map with no homes on it. dates/venue: one room, in full, with two swaps.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, IconButton, Tag, Eyebrow, AiBadge, ListRow, Portrait, Sheet, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useNow, proposalsFor, fmtTime, fmtDay } from '../../state/store'
import { VENUES, venue, venuePhoto } from '../../data/venues'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { usePlan, PlanMap, MapLegend, FairBar, HoldRing, PriceBand, holdLeft, freshHold, clock, weekday, alternatives, closeModal, ROMAN, NOISE } from './kit'

const ease = [0.22, 1, 0.36, 1] as const

export function Proposals({ params }: ScreenProps) {
  const { s, id, plan, first, patch } = usePlan(params)
  const nav = useNav()
  const { toast } = useFeedback()
  useNow(1000) // ticks the hold rings
  const [active, setActive] = useState(plan.chosen ?? 0)
  const [none, setNone] = useState(false)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const open = plan.status === 'negotiating'
  const left = holdLeft(plan)

  useEffect(() => { if (plan.id && open && !plan.holdUntil) patch(() => ({ holdUntil: freshHold() })) }, [plan.id])

  const focus = (i: number) => { setActive(i); cards.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  const choose = (i: number) => { patch(() => ({ chosen: i })); nav.push('dates/seal', { id }) }
  const rehold = () => { patch(() => ({ holdUntil: freshHold() })); toast('Asked again. All three held for 10 minutes.') }
  const nextWeek = () => {
    patch((_, st) => ({ options: proposalsFor(st, id, 1), chosen: undefined, holdUntil: freshHold() }))
    setNone(false); setActive(0)
    toast('Three new evenings, the week after.')
  }

  return (
    <Screen top={<TopBar right={<IconButton icon="book" label="Read the minutes" onClick={() => nav.push('dates/minutes', { id })} />} />}>
      <div className="pad stack gap-20" style={{ paddingTop: 2 }}>
        <div className="stack gap-8">
          <div className="row between"><Eyebrow>For you and {first}</Eyebrow><AiBadge text="Found by Aura" /></div>
          <h1 className="t-title" style={{ margin: 0 }}><span className="i">Three</span> evenings</h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>
            {open ? `Fair to you both, a few minutes apart. Choose one and I’ll ask ${first} to seal it.` : plan.status === 'awaiting' ? `Your side is sealed. Waiting for ${first}.` : 'This evening is sealed. The others have been let go.'}
          </p>
        </div>

        <div className="stack gap-12">
          <PlanMap pins={plan.options.map((o, i) => { const v = venue(o.venueId); return { x: v.x, y: v.y, label: ROMAN[i], name: v.name } })} active={active} onPin={focus} height={210} />
          <MapLegend />
        </div>

        {open && (
          <div className={`dt-holdbar ${left ? '' : 'lapsed'}`}>
            <HoldRing left={left} />
            <span className="grow stack gap-4">
              <span style={{ fontWeight: 600, fontSize: 15 }}>{left ? 'Three tables held for you' : 'The holds have lapsed'}</span>
              <span className="t-small muted">{left ? <>Each room is waiting <span className="t-num">{clock(left)}</span>. Nothing is booked.</> : 'The tables may still be free. I can ask again.'}</span>
            </span>
            {!left && <Button kind="ember" size="sm" onClick={rehold}>Hold again</Button>}
          </div>
        )}

        <div className="stack gap-20">
          {plan.options.map((o, i) => {
            const v = venue(o.venueId)
            const mine = plan.chosen === i
            const toVenue = () => nav.push('dates/venue', { id, venue: v.id })
            return (
              <motion.div key={`${o.venueId}${o.when}`} ref={el => { cards.current[i] = el }} className={`card dt-opt ${active === i ? 'on' : ''}`}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.1, duration: 0.6, ease }}
                onPointerDown={() => setActive(i)} onMouseEnter={() => setActive(i)}>
                <button className="dt-opt-photo" onClick={toVenue} aria-label={`About ${v.name}`}>
                  <Portrait photo={venuePhoto(v)} name={v.name} shape="rect" w="100%" h={150} style={{ borderRadius: 0 }} />
                  <span className="dt-opt-num">{ROMAN[i]}</span>
                  {open && <span className="dt-opt-hold"><HoldRing left={left} size={26} onDark /><span className="t-num">{left ? clock(left) : 'Lapsed'}</span></span>}
                </button>
                <div className="card-pad stack gap-16">
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <div className="stack gap-4">
                      <span className="serif" style={{ fontSize: 28, lineHeight: 1 }}>{weekday(o.when)}</span>
                      <span className="t-num t-small muted">{fmtDay(o.when)} · {fmtTime(o.when)}</span>
                    </div>
                    {mine && <Tag tone="sage" icon="check">{open ? 'Your choice' : 'Sealed'}</Tag>}
                  </div>
                  <button className="stack gap-4" style={{ textAlign: 'left' }} onClick={toVenue}>
                    <span className="t-head">{v.name}</span>
                    <span className="t-small muted">{v.kind} · {v.hood}</span>
                  </button>
                  <p className="dt-why">{v.why}</p>
                  <FairBar me={o.minsMe} them={o.minsThem} first={first} />
                  <div className="row gap-8 t-small muted wrap"><PriceBand n={v.price} /><span>·</span><span>Split, unless one of you offers</span></div>
                  {open && (
                    <div className="row gap-8">
                      <Button kind="ghost" size="md" onClick={toVenue}>The room</Button>
                      <Button kind="primary" size="md" style={{ flex: 1 }} onClick={() => choose(i)}>Choose this evening</Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {plan.status === 'awaiting' && <Button kind="commit" block onClick={() => nav.push('dates/seal', { id })}>See your seal</Button>}
        {(plan.status === 'sealed' || plan.status === 'live') && <Button kind="ember" block icon="ticket" onClick={() => nav.push('dates/pass', { id })}>Your Date Pass</Button>}

        <div className="stack">
          <ListRow icon="book" title="Read the minutes" sub="What was agreed, what was flagged, and what’s left for you two" onClick={() => nav.push('dates/minutes', { id })} />
          {open && <ListRow icon="refresh" title="None of these feel right" sub="Try the following week, or change your rules" onClick={() => setNone(true)} />}
        </div>
      </div>

      <Sheet open={none} onClose={() => setNone(false)} title="Not quite right">
        <div className="stack gap-12">
          <p className="t-callout muted" style={{ margin: 0 }}>No harm done. {first} only sees evenings you both could make, never the ones you passed on.</p>
          <Button kind="ember" block onClick={nextWeek}>Try the week after</Button>
          <Button kind="ghost" block onClick={() => { setNone(false); nav.push('dates/prefs', { id }) }}>Change budget, room or travel</Button>
        </div>
      </Sheet>
    </Screen>
  )
}

export function VenueScreen({ params }: ScreenProps) {
  const { s, id, plan, first, patch } = usePlan(params)
  const nav = useNav()
  const { toast } = useFeedback()
  const found = plan.options.findIndex(o => o.venueId === params.venue)
  const idx = found >= 0 ? found : Math.min(plan.chosen ?? 0, plan.options.length - 1)
  const o = plan.options[idx]
  const v = params.venue && VENUES.some(x => x.id === params.venue) ? venue(params.venue) : venue(o.venueId)
  const inPlan = v.id === o.venueId
  const open = plan.status === 'negotiating'
  const alts = alternatives(s, plan, [v.id])
  const nudge = (base: number, x: number) => Math.max(8, base + (x % 7) - 3)

  const swapTo = (to: string, then: 'stay' | 'seal') => {
    const t = venue(to)
    patch(pl => ({ options: pl.options.map((x, j) => (j === idx ? { ...x, venueId: to, minsMe: nudge(x.minsMe, t.x), minsThem: nudge(x.minsThem, t.y) } : x)), ...(then === 'seal' ? { chosen: idx } : {}) }))
    if (then === 'seal') return nav.replace('dates/seal', { id })
    toast(`Swapped to ${t.name}. Asking them to hold the table.`)
    closeModal(nav)
  }
  const chooseHere = () => {
    if (!inPlan) return swapTo(v.id, 'seal')
    patch(() => ({ chosen: idx }))
    nav.replace('dates/seal', { id })
  }

  return (
    <Screen bleed footer={open
      ? <Button kind="primary" block onClick={chooseHere}>{inPlan ? `Choose ${weekday(o.when)} here` : `Use this room on ${weekday(o.when)}`}</Button>
      : (plan.status === 'sealed' || plan.status === 'live') && inPlan ? <Button kind="ember" block icon="ticket" onClick={() => nav.replace('dates/pass', { id })}>Your Date Pass</Button> : undefined}>
      <div className="dt-hero">
        <Portrait photo={venuePhoto(v)} name={v.name} shape="rect" w="100%" h={300} style={{ borderRadius: 0 }} priority />
        <IconButton icon="close" label="Close" variant="glass" onClick={() => closeModal(nav)} style={{ position: 'absolute', top: 'calc(var(--safe-top, 54px) + 2px)', right: 14 }} />
        {inPlan && <span style={{ position: 'absolute', left: 22, bottom: 34 }}><Tag tone="dark">{ROMAN[idx]} · {weekday(o.when)}, {fmtTime(o.when)}</Tag></span>}
      </div>

      <div className="pad stack gap-24" style={{ marginTop: -18, position: 'relative' }}>
        <motion.div className="stack gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <h1 className="t-title" style={{ margin: 0 }}>{v.name}</h1>
          <span className="t-callout muted">{v.kind} · {v.hood}</span>
        </motion.div>

        <div className="dt-facts">
          <div><span className="t-label faint">Room</span><span>{NOISE[v.noise].replace(' room', '')}</span></div>
          <div><span className="t-label faint">Price</span><PriceBand n={v.price} /></div>
          <div><span className="t-label faint">Travel</span><span className="t-num">{o.minsMe} · {o.minsThem} min</span></div>
        </div>

        <div className="card card-aura card-pad stack gap-8">
          <Eyebrow>Why I picked it</Eyebrow>
          <p className="t-quote" style={{ margin: 0, fontSize: 20 }}>{v.why}</p>
          {v.perk && <div className="row gap-8 t-small" style={{ marginTop: 6 }}><Icon name="sparkle" size={16} style={{ color: 'var(--ember)' }} /><span><b style={{ fontWeight: 600 }}>Member perk</b> · {v.perk}</span></div>}
        </div>

        <section className="stack gap-12">
          <Eyebrow>Good to know</Eyebrow>
          <div className="stack gap-12">
            {[...v.details, 'Your names reach the room as first names only'].filter((d, i, a) => a.indexOf(d) === i).map(d => (
              <div key={d} className="row gap-12 t-callout"><Icon name="shieldCheck" size={19} style={{ color: 'var(--sage)', flexShrink: 0 }} /><span>{d}</span></div>
            ))}
          </div>
        </section>

        <section className="stack gap-12">
          <Eyebrow>Where it sits</Eyebrow>
          <PlanMap pins={[{ x: v.x, y: v.y, label: inPlan ? ROMAN[idx] : '·', name: v.hood }]} active={0} height={150} />
          <span className="t-small muted"><span className="t-num">{o.minsMe}</span> min for you, <span className="t-num">{o.minsThem}</span> for {first}. The exact entrance appears on the day.</span>
        </section>

        {open && (
          <section className="stack gap-12">
            <Eyebrow>Or, just as fair</Eyebrow>
            {alts.map(a => (
              <div key={a.id} className="card-flat dt-alt">
                <Portrait photo={venuePhoto(a)} name={a.name} shape="rect" w={72} h={72} style={{ borderRadius: 14 }} />
                <span className="grow stack gap-4">
                  <span style={{ fontWeight: 600, fontSize: 15.5 }}>{a.name}</span>
                  <span className="t-small muted">{a.kind} · {a.hood}</span>
                  <span className="t-small faint">{NOISE[a.noise]} · <PriceBand n={a.price} /></span>
                </span>
                <Button kind="soft" size="sm" onClick={() => swapTo(a.id, 'stay')}>Swap to this</Button>
              </div>
            ))}
          </section>
        )}
        {!open && <p className="t-small muted" style={{ margin: 0 }}>This evening is {plan.status === 'awaiting' ? 'half sealed' : 'sealed'}. To change the room, reschedule from your Date Pass.</p>}
      </div>
    </Screen>
  )
}
