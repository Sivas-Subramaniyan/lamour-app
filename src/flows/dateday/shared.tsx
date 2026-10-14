// Shared by day/* and after/*: who the evening is with, which table, pronouns, and how to say their name.
import { useCallback, useEffect, useRef } from 'react'
import { Screen, TopBar, Button, EmptyState } from '../../design/ui'
import { useApp, leadId, planWith, planById, startPlan, patchPlan, setStage, introduce, proposalsFor, fmtDay, fmtTime, type Plan, type Proposal, type State } from '../../state/store'
import { PERSONAS, type Persona } from '../../data/personas'
import { venue, type Venue } from '../../data/venues'
import { useNav } from '../../shell/nav'
import type { Traits } from '../../lib/compat'

// ---------- people ----------

export type Pron = { he: string; him: string; his: string; He: string; Hes: string; hes: string; is: string }
export function pron(pronouns: string): Pron {
  const k = pronouns.split('/')[0]
  if (k === 'she') return { he: 'she', him: 'her', his: 'her', He: 'She', Hes: 'She’s', hes: 'she’s', is: 'is' }
  if (k === 'they') return { he: 'they', him: 'them', his: 'their', He: 'They', Hes: 'They’re', hes: 'they’re', is: 'are' }
  return { he: 'he', him: 'him', his: 'his', He: 'He', Hes: 'He’s', hes: 'he’s', is: 'is' }
}
export const myPron = (s: State) => pron(s.me.gender === 'woman' ? 'she' : s.me.gender === 'man' ? 'he' : 'they')

/** How to say each first name, and where they might be running in from. */
const GUIDE: Record<string, { say: string; from: string }> = {
  kabir: { say: 'KUH-beer', from: 'a site visit' },
  marcus: { say: 'MAR-kus', from: 'court' },
  julien: { say: 'zhool-YAN', from: 'a tasting in Chinatown' },
  tomas: { say: 'toh-MAHS', from: 'school' },
  daniel: { say: 'DAN-yul', from: 'the lab' },
  priya: { say: 'PREE-yuh', from: 'the lab' },
  hana: { say: 'HAH-nah', from: 'a hospital shift' },
  leila: { say: 'LAY-lah', from: 'an edit that ran long' },
  chloe: { say: 'KLOH-ee', from: 'an estate sale' },
  amara: { say: 'ah-MAR-ah', from: 'a community board meeting' },
  rowan: { say: 'ROH-un', from: 'a mixing session' },
}
export const nameGuide = (id: string, first: string) => GUIDE[id] ?? { say: first, from: 'work' }

/** Three things to ask: their Bridge threads, topped up from their pages when a profile is thin. */
export function asksFor(p: Persona): string[] {
  const pr = pron(p.pronouns)
  const fill = [`What a good week looks like as a ${p.job.toLowerCase()}`, `How ${p.hood} became home`, `The last thing that made ${pr.him} lose track of time`]
  return [...p.aura.bridge.filter(b => b && b !== '…'), ...fill].slice(0, 3)
}

/** One topic that keeps for a second evening, chosen from both life designs. */
export function laterFor(me: Traits, p: Persona) {
  const a = me.lifestyle, b = p.traits.lifestyle, pr = pron(p.pronouns)
  if (Math.abs(a.faith - b.faith) >= 2) return { topic: 'Faith', line: `It sits nearer the center of ${pr.his} life than yours. Worth a real conversation, just not over the first glass.` }
  if (a.kids !== b.kids) return { topic: 'Kids', line: 'Your answers point in different directions. Ask by the second evening, as a question rather than a test.' }
  if (a.kids === 'want') return { topic: 'Kids', line: 'You both want a family one day, without a rush. It keeps for a second evening.' }
  return { topic: 'Where you’d settle', line: 'The long-range questions keep. Tonight is for finding out if you like each other.' }
}

export const ROMAN = ['I', 'II', 'III', 'IV']
export const WORDS: Record<number, string> = { 10: 'ten', 15: 'fifteen', 20: 'twenty', 30: 'thirty', 45: 'forty-five', 60: 'sixty' }
export const plus = (iso: string | Date, mins: number) => new Date(new Date(iso).getTime() + mins * 6e4)
/** Local wall-clock ISO (the store keeps times without a zone). */
export const localIso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 19)
export const weekday = (iso: string | Date) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long' })
export const firstOn = (s: State) => s.guardians.filter(g => g.on).map(g => g.name)
export const joinNames = (n: string[]) => (n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`)

// ---------- the evening ----------

const DATED: Plan['status'][] = ['sealed', 'live', 'done']
const isDated = (p?: Plan) => !!p && DATED.includes(p.status)

/** params.id first; otherwise the lead if they have a table, otherwise whoever does. */
export function dateId(s: State, params: Record<string, any>) {
  if (params?.id && PERSONAS[params.id]) return params.id as string
  const lead = leadId(s, params)
  if (isDated(planWith(s, lead))) return lead
  return [...s.plans].reverse().find(isDated)?.with ?? lead
}

export function useDate(params: Record<string, any>, after = false) {
  const { s, update } = useApp()
  const id = dateId(s, params)
  const p = PERSONAS[id]
  // After the date, a newer plan (a second evening) may exist; the debrief is about the one that happened.
  const plan = (after && [...s.plans].reverse().find(x => x.with === id && x.status === 'done')) || planWith(s, id)
  const opt: Proposal | undefined = plan && isDated(plan) ? plan.options[plan.chosen ?? 0] : undefined
  const v: Venue | undefined = opt ? venue(opt.venueId) : undefined
  return { s, update, id, p, pr: pron(p.pronouns), plan, opt, v }
}
export type DateCtx = ReturnType<typeof useDate>
export type Ready = DateCtx & { plan: Plan; opt: Proposal; v: Venue }
export const isReady = (d: DateCtx): d is Ready => !!(d.plan && d.opt && d.v)

/** Presenter shortcut: move this person's story to Saturday night or the morning after so the screen has data. */
export function fastForward(s: State, id: string, to: 'date-night' | 'morning-after'): State {
  let n = introduce(s, id)
  let pl = planWith(n, id)
  if (!pl) { const r = startPlan(n, id, proposalsFor(n, id)); n = r.s; pl = planById(n, r.planId)! }
  n = patchPlan(n, pl.id, { chosen: pl.chosen ?? 1, mySeal: true, theirSeal: true, status: to === 'date-night' ? 'sealed' : 'done', checkedIn: to === 'morning-after' })
  return setStage({ ...n, phase: to }, id, to === 'date-night' ? 'sealed' : 'met')
}

/** The graceful state when there is no table (yet) for the screen to talk about. */
export function NoTable({ d, title, after }: { d: DateCtx; title: string; after?: boolean }) {
  const nav = useNav()
  const { id, p, plan, update } = d
  const first = p.first
  const pending = plan && (plan.status === 'negotiating' || plan.status === 'awaiting')
  const upcoming = after && plan && plan.status === 'sealed' && d.opt
  const to = after ? 'morning-after' : 'date-night'
  const skip = () => { update(s => fastForward(s, id, to)); nav.replace(nav.top.id, { id }) }
  return (
    <Screen top={<TopBar title={title} />}>
      <EmptyState icon={upcoming ? 'moon' : 'calendar'}
        title={upcoming ? `Your evening with ${first} is ${fmtDay(d.opt!.when)}, ${fmtTime(d.opt!.when)}` : pending ? `Aura is still finding your evening with ${first}` : `No table yet with ${first}`}
        body={upcoming ? 'I’ll ask how it went the morning after, at 10. Never at night.'
          : pending ? 'Three evenings are waiting for you two. Choose one and this fills in.'
          : after ? 'After your first evening together, Aura asks how it went at 10 the next morning.'
          : 'Once you both seal an evening, this fills in on its own: the Brief, your Guardian Circle and date mode.'}
        action={
          <div className="stack gap-8" style={{ alignItems: 'center', marginTop: 8 }}>
            {upcoming ? <Button kind="primary" icon="ticket" onClick={() => nav.push('dates/pass', { id })}>Your Date Pass</Button>
              : pending ? <Button kind="ember" onClick={() => nav.push('dates/proposals', { id })}>See the three evenings</Button>
              : <Button kind="ember" icon="sparkle" onClick={() => nav.push('dates/prefs', { id })}>Shall I set a table?</Button>}
            <Button kind="quiet" size="sm" onClick={skip}>{after ? 'Demo: skip to the morning after' : 'Demo: skip to Saturday night'}</Button>
          </div>
        } />
    </Screen>
  )
}

/** setTimeout that is cleared when the screen goes away. */
export function useLater() {
  const ts = useRef<number[]>([])
  useEffect(() => () => ts.current.forEach(clearTimeout), [])
  return useCallback((fn: () => void, ms: number) => { ts.current.push(window.setTimeout(fn, ms)) }, [])
}
