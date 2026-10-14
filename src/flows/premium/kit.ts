// Membership facts shared by the three premium screens. Prices and promises live here once.
import type { State } from '../../state/store'
import type { IconName } from '../../design/icons'
import { CAST } from '../../data/personas'

export type Billing = 'week' | 'month' | 'year'
export const BILLING: Record<Billing, { label: string; adj: string; price: string; per: string; note: string; days: number }> = {
  week: { label: 'Week', adj: 'Weekly', price: '$12.99', per: 'week', note: 'Billed weekly', days: 7 },
  month: { label: 'Month', adj: 'Monthly', price: '$29.99', per: 'month', note: 'About $6.92 a week', days: 30 },
  year: { label: 'Year', adj: 'Yearly', price: '$199', per: 'year', note: 'About $3.83 a week', days: 365 },
}
export const DEPOSIT = '$15'
export const TIER_NAME = { invitation: 'Invitation', soiree: 'Soirée', maison: 'Maison' } as const

export const INVITATION_PERKS = ['One introduction each evening', 'The first care note', 'Ask Aura three times a day']
export const SOIREE_PERKS = [
  'Your evening letter, up to three introductions',
  'Every care note, in full',
  'Where You Meet, in full',
  'Ask Aura as often as you like',
  'Aura holds tables while you decide',
  'Two Date Passes a month',
  'Your first Monograph of Two',
]
export const MAISON_PERKS = ['A human matchmaker alongside Aura', 'Curated venues and priority tables', 'Salons: dinner for six', 'A concierge on call']

export const NEVER_PAYWALLED: { icon: IconName; t: string; d: string }[] = [
  { icon: 'shield', t: 'Safety', d: 'Guardian Circle, All well?, Call me out, SOS' },
  { icon: 'shieldCheck', t: 'Verification', d: 'The Verified Halo, for everyone' },
  { icon: 'lock', t: 'Your data rights', d: 'See it, export it, delete it' },
  { icon: 'sun', t: 'The debrief', d: 'Your Morning After, always' },
  { icon: 'feather', t: 'Closing kindly', d: 'A gracious goodbye, drafted' },
  { icon: 'ticket', t: 'Any active date', d: 'Plans you sealed stay sealed' },
]

export const MONOGRAPH_CHAPTERS = ['How you met, in both your words', 'Where you meet', 'Where you’ll need care', 'Your rhythms: texting, weekends, rest', 'The numbers, kept apart', 'Questions for the year ahead']

/** Premium extras ride in s.me.you under one namespaced key so they persist without a schema change. */
export type PmExtra = { billing?: Billing; salon?: boolean; monograph?: boolean; applied?: boolean }
export const pmOf = (s: State): PmExtra => (s.me.you?.pm ?? {}) as PmExtra
export const withPm = (s: State, patch: PmExtra): State => ({ ...s, me: { ...s.me, you: { ...s.me.you, pm: { ...pmOf(s), ...patch } } } })

/** Couple-level features (Monograph of Two) use the person you're sealed with, else the cast default. */
export const partnerId = (s: State) => s.connections.find(c => c.stage === 'sealed' || c.stage === 'met')?.id ?? CAST[s.me.seeking].sealed
export const renewOn = (now: Date, b: Billing) => new Date(now.getTime() + BILLING[b].days * 864e5)
export const memberNo = (s: State) => String(s.me.memberNo).padStart(5, '0')
