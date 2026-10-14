// The single list of screen ids. Flows implement these; cross-flow links are type-checked against it.
// Need a sub-state? Use local state or a <Sheet>, not a new id.
import type { FC } from 'react'

export const SCREEN_IDS = [
  // A. Arrival
  'arrival/splash', 'arrival/manifesto', 'arrival/invite', 'arrival/phone', 'arrival/basics',
  'arrival/consent', 'arrival/photos', 'arrival/verify', 'arrival/member', 'arrival/meet-aura',
  // B. The First Conversation (Aura tab)
  'conv/aura', 'conv/chapters', 'conv/chamber', 'conv/heard', 'conv/life-design', 'conv/text', 'conv/signature', 'conv/numbers',
  // C. Tonight
  'tonight/dusk', 'tonight/letter', 'tonight/deck', 'tonight/dossier', 'tonight/briefing', 'tonight/why',
  'tonight/blueprint', 'tonight/resonance', 'tonight/decide', 'tonight/introduced',
  // D. The Table (connections)
  'conn/table', 'conn/hello', 'conn/bridge', 'conn/chat', 'conn/voice-hour', 'conn/exit', 'conn/report',
  // E. Plans (agentic dates)
  'dates/prefs', 'dates/planning', 'dates/proposals', 'dates/minutes', 'dates/venue', 'dates/seal', 'dates/sealed', 'dates/pass', 'dates/list',
  // F. Date day
  'day/brief', 'day/guardian', 'day/live',
  // G. After
  'after/morning', 'after/learned',
  // H. You
  'you/home', 'you/explorer', 'you/numbers', 'you/noticed', 'you/memory', 'you/preview', 'you/rules', 'you/privacy', 'you/discretion', 'you/settings',
  // I. Membership
  'premium/paywall', 'premium/membership', 'premium/success',
  // J. System
  'sys/notifications', 'sys/lockscreen', 'sys/states',
] as const

export type ScreenId = (typeof SCREEN_IDS)[number]
export type TabName = 'tonight' | 'table' | 'aura' | 'plans' | 'you'
export type Pillar = 'Personality' | 'Latent' | 'Psychometry' | 'Actions' | 'Trust' | 'Business'

export type ScreenProps = { params: Record<string, any> }

export type ScreenDef = {
  id: ScreenId
  title: string // shown in the Flow Navigator
  component: FC<ScreenProps>
  theme?: 'day' | 'night' // default day
  chrome?: 'tabs' | 'bare' // tabs = show the tab bar; default bare
  tab?: TabName // which tab lights up while this screen is on top
  presentation?: 'push' | 'modal' | 'fade' // transition style; default push
  pillars?: Pillar[] // Director's Notes
  note?: string // Director's Notes: what this screen proves, one or two sentences
  real?: string // Director's Notes: what is genuinely computed/live here (e.g. "Live mic level + transcript")
}

export const FLOWS: { key: string; label: string; prefix: string }[] = [
  { key: 'arrival', label: 'A · Arrival & trust', prefix: 'arrival/' },
  { key: 'conv', label: 'B · The First Conversation', prefix: 'conv/' },
  { key: 'tonight', label: 'C · Tonight', prefix: 'tonight/' },
  { key: 'conn', label: 'D · The Table', prefix: 'conn/' },
  { key: 'dates', label: 'E · Plans', prefix: 'dates/' },
  { key: 'day', label: 'F · Date day', prefix: 'day/' },
  { key: 'after', label: 'G · After', prefix: 'after/' },
  { key: 'you', label: 'H · You', prefix: 'you/' },
  { key: 'premium', label: 'I · Membership', prefix: 'premium/' },
  { key: 'sys', label: 'J · System', prefix: 'sys/' },
]
