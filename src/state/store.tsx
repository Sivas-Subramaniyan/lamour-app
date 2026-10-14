// One app state, persisted to localStorage. Screens read `s` and write with `update(s => ...)`.
// Domain moves (leanIn, sealPlan, …) are plain functions below so every flow uses the same rules.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Traits, Learned } from '../lib/compat'
import { fit } from '../lib/compat'
import { CAST, PERSONAS, type Gender, type Intent } from '../data/personas'
import { chart } from '../lib/numerology'
import { PHOTOS } from '../data/photos'
import type { ScreenId } from '../shell/screens'

export type ChapterId = 'story' | 'people' | 'life' | 'love' | 'hard' | 'care' | 'numbers'
export const CHAPTERS: { id: ChapterId; title: string; mins: number; blurb: string }[] = [
  { id: 'story', title: 'Your story', mins: 6, blurb: 'Where you’re from, what you make, what you’re proud of.' },
  { id: 'people', title: 'Your people', mins: 5, blurb: 'Friends, family, how you spend your energy.' },
  { id: 'life', title: 'The life you’re building', mins: 6, blurb: 'Home, kids, faith, work: your non-negotiables.' },
  { id: 'love', title: 'Love so far', mins: 7, blurb: 'What you’ve learned. Gentle, and you can skip anything.' },
  { id: 'hard', title: 'When things get hard', mins: 5, blurb: 'Disagreements, silence, repair.' },
  { id: 'care', title: 'Care & rituals', mins: 5, blurb: 'How you like to be looked after, and how you look after.' },
  { id: 'numbers', title: 'Your numbers', mins: 3, blurb: 'Optional. A reflective lens from numerology.' },
]

export type ConsentKey = 'voice' | 'profiling' | 'learning' | 'numerology' | 'agent' | 'research'
export type Source = 'You said' | 'Aura inferred' | 'You confirmed'
export type HeardCard = { id: string; chapter: ChapterId; quote: string; inference: string; source: Source; status: 'pending' | 'confirmed' | 'struck' }
export type NoticedCard = { id: string; told?: string; lean: string; from: string; status: 'new' | 'confirmed' | 'notme' | 'forgotten'; likes?: string[]; avoids?: string[] }
export type Decision = 'lean' | 'not' | 'hold'
export type Stage = 'introduced' | 'talking' | 'planning' | 'sealed' | 'met' | 'debriefed' | 'closed' | 'lapsed'
export type Connection = { id: string; stage: Stage; since: string; yourTurnUntil?: string; note?: string }
export type Message = { id: string; from: 'me' | 'them' | 'aura'; kind: 'text' | 'voice' | 'plan' | 'system'; text?: string; secs?: number; at: string; assisted?: boolean }
export type Proposal = { venueId: string; when: string; minsMe: number; minsThem: number }
export type Plan = {
  id: string; with: string
  status: 'negotiating' | 'awaiting' | 'sealed' | 'live' | 'done' | 'cancelled'
  options: Proposal[]; chosen?: number
  mySeal?: boolean; theirSeal?: boolean
  passNo: string; lateNotice?: boolean; checkedIn?: boolean
  checkInMins?: number; holdUntil?: string; surprise?: boolean
}
export type Notice = { id: string; title: string; body: string; at: string; screen?: ScreenId; params?: Record<string, any>; read?: boolean }
export type Phase = 'afternoon' | 'dusk' | 'date-night' | 'morning-after'

export type State = {
  v: 1
  onboarded: boolean
  me: {
    name: string; birthName: string; dob: string; gender: Gender | 'self'; genderSelf?: string; languages?: string[]; seeking: 'men' | 'women' | 'everyone'; intent: Intent; city: string
    photos: string[]; prompts: { label: string; answer: string }[]
    verified: { selfie: boolean; id: boolean; work: boolean }
    memberNo: number; voice: 'Warm' | 'Bright' | 'Low'; mode: 'voice' | 'text' | 'quiet'
    tier: 'invitation' | 'soiree' | 'maison'; resonance: 'off' | 'light' | 'meaningful'; datePasses: number
    traits: Traits
    you?: Record<string, any> // You-flow extras (shared lens, trait flags, foreword edits)
  }
  lifeDesign?: Record<string, { answer: string; firmness: 'hard' | 'flexible' | 'any' }>
  chapterTurn?: Partial<Record<ChapterId, number>> // resume mid-chapter
  consents: Record<ConsentKey, boolean>
  chapters: Record<ChapterId, 'todo' | 'done'>
  heard: HeardCard[]
  noticed: NoticedCard[]
  learned: Learned
  phase: Phase
  tonight: { letterOpened: boolean; edition: number; ids: string[]; decisions: Record<string, Decision | undefined>; reasons: Record<string, string[]> }
  connections: Connection[]
  messages: Record<string, Message[]>
  plans: Plan[]
  prefs: { budget: 1 | 2 | 3; food: string[]; alcohol: boolean; vibe: 'hushed' | 'conversational' | 'lively'; travelCap: number; autonomy: 'ask' | 'negotiate' | 'hold'; days: string[] }
  guardians: { name: string; relation: string; on: boolean }[]
  discreet: { veil: boolean; screenshotShield: boolean; hideNames: boolean; blocked: number; sabbatical: boolean }
  notifications: Notice[]
  settings: { auraMuted: boolean; quietHours?: string } // quiet hours default '10 PM–9 AM'
}

export const PHASE_TIME: Record<Phase, string> = {
  afternoon: '2026-10-14T17:40:00',
  dusk: '2026-10-14T18:17:00',
  'date-night': '2026-10-17T19:24:00',
  'morning-after': '2026-10-18T10:00:00',
}
export const SUNSET = '6:17 PM'

const ME_TRAITS: Traits = {
  values: [5.5, 4.2, 3.8, 4.5, 2.2, 4.0, 2.8, 3.0, 5.6, 5.0], anxiety: 3.6, avoidance: 2.4, extraversion: 0.45, openness: 0.82,
  conflict: 'pursue', replyMins: 25, msgLen: 3, humour: 0.7,
  lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' },
  interests: ['ceramics', 'design', 'jazz', 'long walks', 'cooking', 'museums', 'film'],
}

const SEED_CHATS: Record<string, Message[]> = {
  chloe: [
    { id: 'm1', from: 'aura', kind: 'system', text: 'Introduced Monday · Your Turn rules apply', at: '2026-10-12T19:02:00' },
    { id: 'm2', from: 'them', kind: 'voice', secs: 17, text: 'Hi. Aura says you invented a glaze by accident. I once found a pressed violet in a 1902 travel guide and spent a whole afternoon trying to work out who put it there.', at: '2026-10-12T20:10:00' },
    { id: 'm3', from: 'me', kind: 'text', text: 'That is the best possible use of an afternoon. Did you find out?', at: '2026-10-12T20:31:00' },
    { id: 'm4', from: 'them', kind: 'text', text: 'A honeymooning schoolteacher from Ohio, I think. The handwriting in the margins gave her away.', at: '2026-10-13T08:15:00' },
  ],
}

export function initialState(seeking: State['me']['seeking'] = 'men'): State {
  const cast = CAST[seeking]
  return {
    v: 1,
    onboarded: true,
    me: {
      name: 'Ananya', birthName: 'Ananya Rao', dob: '1997-02-14', gender: 'woman', seeking, intent: 'long-term', city: 'New York',
      photos: [PHOTOS.ananya.portrait.url, PHOTOS.ananya.portrait2!.url], prompts: [
        { label: 'A Sunday, ideally', answer: 'Wheel in the morning, farmers market at noon, cooking something slow for friends by dark.' },
        { label: 'I’m weirdly proud of', answer: 'A glaze I invented by accident. It’s the colour of a peach at 6 PM.' },
      ],
      verified: { selfie: true, id: true, work: false }, memberNo: 1204, voice: 'Warm', mode: 'voice',
      tier: 'invitation', resonance: 'light', datePasses: 1, traits: ME_TRAITS,
    },
    consents: { voice: true, profiling: true, learning: true, numerology: true, agent: true, research: false },
    chapters: { story: 'done', people: 'done', life: 'done', love: 'done', hard: 'done', care: 'todo', numbers: 'todo' },
    heard: [
      { id: 'h1', chapter: 'story', quote: '“I like making things that take a long time.”', inference: 'You value craft and patience over speed.', source: 'You said', status: 'confirmed' },
      { id: 'h2', chapter: 'people', quote: '“Four friends, one long table, that’s my ideal night.”', inference: 'Small gatherings recharge you; big parties drain you.', source: 'Aura inferred', status: 'confirmed' },
      { id: 'h3', chapter: 'love', quote: '“If someone goes quiet, I assume I did something.”', inference: 'Early reassurance matters to you.', source: 'Aura inferred', status: 'pending' },
      { id: 'h4', chapter: 'hard', quote: '“I’d rather talk it out tonight than sleep on it.”', inference: 'In conflict you move toward the other person.', source: 'You confirmed', status: 'confirmed' },
    ],
    noticed: [
      { id: 'n1', told: 'You told me you want someone ambitious.', lean: 'You keep leaning in to people who are kind first, ambitious second.', from: '9 introductions, 3 lean-ins', status: 'new', likes: ['kindness'] },
      { id: 'n2', told: 'You said you don’t mind nightlife.', lean: 'You pass on every profile built around clubs and late nights.', from: '4 “Not tonight” reasons', status: 'new', avoids: ['nightlife'] },
      { id: 'n3', lean: 'You reply faster to people who make things with their hands.', from: 'Reply times across 3 conversations', status: 'confirmed', likes: ['ceramics', 'architecture', 'cooking'] },
    ],
    learned: { likes: ['ceramics', 'architecture', 'cooking', 'long walks'], avoids: ['nightlife'], interactions: 12 },
    phase: 'afternoon',
    tonight: { letterOpened: false, edition: 37, ids: cast.tonight, decisions: {}, reasons: {} },
    connections: [
      { id: cast.yourTurn, stage: 'talking', since: '2026-10-12T19:02:00', yourTurnUntil: '2026-10-16T00:40:00' },
      { id: cast.sealed, stage: 'sealed', since: '2026-10-08T18:40:00' },
    ],
    messages: {
      [cast.yourTurn]: SEED_CHATS[cast.yourTurn] ?? [
        { id: 'm1', from: 'aura', kind: 'system', text: 'Introduced Monday · Your Turn rules apply', at: '2026-10-12T19:02:00' },
        { id: 'm2', from: 'them', kind: 'voice', secs: 19, text: 'Hey! So Aura told me you invented a glaze by accident. I teach glazing to fifteen-year-olds and I have never once done that on purpose.', at: '2026-10-12T20:10:00' },
        { id: 'm3', from: 'me', kind: 'text', text: 'Ha! It was a happy disaster. Peach at 6 PM. What’s the worst one a student has made?', at: '2026-10-12T20:31:00' },
        { id: 'm4', from: 'them', kind: 'text', text: 'A kid named Marisol made one we call “wet parking lot”. It’s now the most requested glaze in the school.', at: '2026-10-13T08:15:00' },
      ],
      [cast.sealed]: [
        { id: 'm5', from: 'aura', kind: 'system', text: 'Introduced Thursday', at: '2026-10-08T18:40:00' },
        { id: 'm6', from: 'them', kind: 'text', text: 'Saturday works. I’ll be the one who’s early and pretending not to be.', at: '2026-10-11T12:02:00' },
        { id: 'm7', from: 'aura', kind: 'plan', text: 'Sat 17 Oct · 1:00 PM · The Glasshouse, Brooklyn Heights', at: '2026-10-11T12:30:00' },
      ],
    },
    plans: [
      { id: 'p-sealed', with: cast.sealed, status: 'sealed', options: [{ venueId: 'glasshouse', when: '2026-10-17T13:00:00', minsMe: 24, minsThem: 21 }], chosen: 0, mySeal: true, theirSeal: true, passNo: 'LA-0417' },
    ],
    prefs: { budget: 2, food: ['Vegetarian-friendly'], alcohol: true, vibe: 'conversational', travelCap: 30, autonomy: 'negotiate', days: ['Thu', 'Fri', 'Sat'] },
    guardians: [{ name: 'Meera', relation: 'Sister', on: true }, { name: 'Jo', relation: 'Best friend', on: false }],
    discreet: { veil: false, screenshotShield: true, hideNames: false, blocked: 6, sabbatical: false },
    settings: { auraMuted: false },
    notifications: [
      { id: 'x1', title: `Your turn with ${PERSONAS[cast.yourTurn].first}`, body: '31 hours left to reply. No pressure, just a nudge.', at: '2026-10-14T17:30:00', screen: 'conn/chat', params: { id: cast.yourTurn } },
      { id: 'x2', title: 'Saturday is sealed', body: 'The Glasshouse, 1:00 PM. Your Date Pass is ready.', at: '2026-10-11T12:30:00', screen: 'dates/pass', params: { id: cast.sealed } },
    ],
  }
}

// ---------- derived helpers ----------

export const myChart = (s: State) => chart(s.me.birthName, s.me.dob)
export const completeness = (s: State) => Object.values(s.chapters).filter(c => c === 'done').length / 7
export const fitWith = (s: State, id: string) => fit(s.me.traits, PERSONAS[id].traits, completeness(s), s.learned, { them: PERSONAS[id].first })
export const connection = (s: State, id: string) => s.connections.find(c => c.id === id)
export const openChairs = (s: State) => 3 - s.connections.filter(c => !['closed', 'lapsed', 'debriefed'].includes(c.stage)).length
export const planWith = (s: State, id: string) => [...s.plans].reverse().find(p => p.with === id && p.status !== 'cancelled')
export const planById = (s: State, id: string) => s.plans.find(p => p.id === id)
export const isDusk = (s: State) => s.phase !== 'afternoon'
/** Person screens take params.id; fall back to tonight's first introduction so every screen renders from the Flow Navigator. */
export const leadId = (s: State, params?: Record<string, any>) => (params?.id && PERSONAS[params.id] ? params.id : s.tonight.ids[0]) as string

/** Three Evenings: deterministic proposals matched to both people's tastes. Minutes only, never addresses. */
export function proposalsFor(s: State, id: string, weekOffset = 0): Proposal[] {
  const t = PERSONAS[id].traits.interests
  const rank: Record<string, number> = { lantern: 2, kiln: t.includes('ceramics') || t.includes('architecture') ? 3 : 1, oriole: t.includes('jazz') || t.includes('music') ? 3 : 1,
    sable: t.includes('food') ? 3 : 1, marrow: t.includes('cooking') || t.includes('food') ? 2 : 1, halcyon: t.includes('jazz') ? 2 : 0, glasshouse: 1, paperback: t.includes('writing') || t.includes('film') ? 2 : 1 }
  const picks = Object.entries(rank).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([v]) => v)
  const shift = (iso: string) => new Date(new Date(iso).getTime() + weekOffset * 7 * 864e5 - new Date(iso).getTimezoneOffset() * 6e4).toISOString().slice(0, 19)
  const slots = ['2026-10-16T20:00:00', '2026-10-17T19:30:00', '2026-10-18T12:30:00'].map(shift)
  const mins = [[21, 23], [19, 26], [24, 22]]
  return picks.map((venueId, i) => ({ venueId, when: slots[i], minsMe: mins[i][0], minsThem: mins[i][1] }))
}

let seq = 0
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`

// ---------- domain moves (pure: State -> State) ----------

export function decide(s: State, id: string, d: Decision, reasons: string[] = []): State {
  const learned = { ...s.learned, interactions: s.learned.interactions + 1 }
  return { ...s, learned, tonight: { ...s.tonight, decisions: { ...s.tonight.decisions, [id]: d }, reasons: { ...s.tonight.reasons, [id]: reasons } } }
}

/** Both leaned in: a chair fills and the 72-hour arc starts. */
export function introduce(s: State, id: string, at = PHASE_TIME.dusk): State {
  if (s.connections.some(c => c.id === id)) return s
  const until = new Date(new Date(at).getTime() + 72 * 3600e3).toISOString().slice(0, 19)
  return {
    ...s,
    connections: [...s.connections, { id, stage: 'introduced', since: at, yourTurnUntil: until }],
    messages: { ...s.messages, [id]: [{ id: uid('m'), from: 'aura', kind: 'system', text: `You both leaned in · ${PERSONAS[id].first} and you have 72 hours to say hello`, at }] },
    notifications: [{ id: uid('x'), title: 'You both leaned in', body: `Meet ${PERSONAS[id].first}. Your Bridge Brief is ready.`, at, screen: 'tonight/introduced', params: { id } }, ...s.notifications],
  }
}

export function send(s: State, id: string, m: Omit<Message, 'id' | 'at'>, at = PHASE_TIME.dusk): State {
  const msgs = [...(s.messages[id] ?? []), { ...m, id: uid('m'), at }]
  // Your Turn: sending passes the turn to them; their message gives you 48 hours.
  const turn = m.from === 'me' ? undefined : m.from === 'them' ? new Date(new Date(at).getTime() + 48 * 3600e3).toISOString().slice(0, 19) : null
  const connections = s.connections.map(c => {
    if (c.id !== id) return c
    const stage = c.stage === 'introduced' ? ('talking' as Stage) : c.stage
    return turn === null ? { ...c, stage } : { ...c, stage, yourTurnUntil: turn }
  })
  return { ...s, messages: { ...s.messages, [id]: msgs }, connections }
}

export function setStage(s: State, id: string, stage: Stage): State {
  return { ...s, connections: s.connections.map(c => (c.id === id ? { ...c, stage } : c)) }
}

export function startPlan(s: State, id: string, options: Proposal[]): { s: State; planId: string } {
  const planId = uid('p')
  const plan: Plan = { id: planId, with: id, status: 'negotiating', options, passNo: `LA-${String(400 + s.plans.length * 37).padStart(4, '0')}` }
  return { s: setStage({ ...s, plans: [...s.plans, plan] }, id, 'planning'), planId }
}

export function patchPlan(s: State, planId: string, patch: Partial<Plan>): State {
  return { ...s, plans: s.plans.map(p => (p.id === planId ? { ...p, ...patch } : p)) }
}

/** I seal my side; in the demo the other person seals a moment later (call again with them=true). */
export function seal(s: State, planId: string, them = false): State {
  const next = patchPlan(s, planId, them ? { theirSeal: true } : { mySeal: true, status: 'awaiting' })
  const p = planById(next, planId)!
  if (!(p.mySeal && p.theirSeal)) return next
  const sealed = patchPlan(next, planId, { status: 'sealed' })
  return setStage({ ...sealed, me: { ...sealed.me, datePasses: Math.max(0, sealed.me.datePasses - 1) } }, p.with, 'sealed')
}

export function addNotice(s: State, n: Omit<Notice, 'id'>): State {
  return { ...s, notifications: [{ ...n, id: uid('x') }, ...s.notifications] }
}

/** Presenter time controls. Moving forward also moves the golden-path story forward so every screen has data. */
export function goToPhase(s: State, phase: Phase): State {
  let n: State = { ...s, phase }
  if (phase === 'date-night' || phase === 'morning-after') {
    const lead = n.tonight.ids[0]
    if (!n.tonight.decisions[lead]) n = decide(n, lead, 'lean')
    n = introduce(n, lead)
    let plan = planWith(n, lead)
    if (!plan) {
      const r = startPlan(n, lead, proposalsFor(n, lead))
      n = r.s
      plan = planById(n, r.planId)!
    }
    if (plan.status !== 'sealed' && plan.status !== 'live' && plan.status !== 'done') n = patchPlan(n, plan.id, { chosen: plan.chosen ?? 1, mySeal: true, theirSeal: true, status: 'sealed' })
    n = setStage(n, lead, 'sealed')
    if (phase === 'date-night') n = patchPlan(n, planWith(n, lead)!.id, { status: 'live' })
    if (phase === 'morning-after') n = setStage(patchPlan(n, planWith(n, lead)!.id, { status: 'done', checkedIn: true }), lead, 'met')
  }
  return n
}

// ---------- provider ----------

const KEY = 'lamour.v1'
type Ctx = { s: State; update: (fn: (s: State) => State) => void; reset: (seeking?: State['me']['seeking']) => void }
const AppCtx = createContext<Ctx>(null!)

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      if (s.v === 1) return s
    }
  } catch {}
  return initialState()
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load)
  const update = useCallback((fn: (s: State) => State) => setS(prev => fn(prev)), [])
  const reset = useCallback((seeking?: State['me']['seeking']) => setS(initialState(seeking)), [])
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }, 250)
    return () => clearTimeout(t)
  }, [s])
  const value = useMemo(() => ({ s, update, reset }), [s, update, reset])
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => useContext(AppCtx)

/** Demo "now": the phase's clock, ticking forward in real time from when the phase was entered. */
export function useNow(tickMs = 1000) {
  const { s } = useApp()
  const entered = useRef({ phase: s.phase, at: Date.now() })
  if (entered.current.phase !== s.phase) entered.current = { phase: s.phase, at: Date.now() }
  const [, force] = useState(0)
  useEffect(() => { const t = setInterval(() => force(x => x + 1), tickMs); return () => clearInterval(t) }, [tickMs])
  return new Date(new Date(PHASE_TIME[s.phase]).getTime() + (Date.now() - entered.current.at))
}

// ---------- formatting ----------

export const fmtTime = (d: Date | string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const fmtDay = (d: Date | string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
export const fmtLongDay = (d: Date | string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
export function fmtLeft(ms: number) {
  if (ms <= 0) return '0m'
  const h = Math.floor(ms / 3600e3), m = Math.floor((ms % 3600e3) / 60e3)
  return h ? `${h}h ${m}m` : `${m}m`
}
