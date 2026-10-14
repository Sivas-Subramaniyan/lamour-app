// The golden path (~4 minutes). `phase` moves the demo clock; `id: 'lead'` resolves to tonight's first introduction.
import type { ScreenId } from './screens'
import type { Phase } from '../state/store'

export type Step = { screen: ScreenId; say: string; phase?: Phase; lead?: boolean }

export const TOUR: Step[] = [
  { screen: 'arrival/splash', say: 'No feed. No swiping. At most three people a night.', phase: 'afternoon' },
  { screen: 'arrival/consent', say: 'Consent comes one card at a time. Declining is as easy as accepting.' },
  { screen: 'conv/chamber', say: 'The First Conversation: Aura listens. Your voice scatters the grains; your answers settle them.' },
  { screen: 'conv/heard', say: '“Here’s what I heard.” Confirm, adjust, or strike any inference.' },
  { screen: 'conv/signature', say: 'Your Signature: a figure drawn from your traits. “That’s you, so far.”' },
  { screen: 'conv/numbers', say: 'Numerology as a reflective lens, with the arithmetic shown and correct.' },
  { screen: 'tonight/dusk', say: 'By day the app stays quiet. Introductions arrive at dusk.' },
  { screen: 'tonight/letter', say: 'Dusk. The app turns to ink and your evening letter arrives. Hold to break the seal.', phase: 'dusk' },
  { screen: 'tonight/deck', say: 'Three people, argued like a letter. Person first, never a score above a face.' },
  { screen: 'tonight/dossier', say: 'Their own words and voice pages, Aura’s foreword, the Verified Halo.', lead: true },
  { screen: 'tonight/why', say: 'Why you two: a band, not a percentage. Three sourced reasons and one honest care note.', lead: true },
  { screen: 'tonight/resonance', say: 'The numbers handshake sits apart from the science and never changes the band.', lead: true },
  { screen: 'tonight/decide', say: 'Lean in, Not tonight (that trains Aura), or Hold. They only know if you both lean in.', lead: true },
  { screen: 'tonight/introduced', say: 'Both leaned in. A chair fills and a 72-hour arc begins.', lead: true },
  { screen: 'conn/bridge', say: 'The Bridge Brief: private threads to pull. Aura writes about you two, never as you.', lead: true },
  { screen: 'conn/chat', say: 'Voice-first hellos, labelled assistance, and nothing sent without you.', lead: true },
  { screen: 'dates/prefs', say: '“Shall I set a table?” Your rules, your budget, your days.', lead: true },
  { screen: 'dates/planning', say: 'Aura’s work, shown in plain language.', lead: true },
  { screen: 'dates/proposals', say: 'Three Evenings: fairness in minutes for each of you, never addresses. Live hold timers.', lead: true },
  { screen: 'dates/minutes', say: 'Parley Minutes: what was agreed, gently flagged, and left for you two.', lead: true },
  { screen: 'dates/sealed', say: 'Both people seal. A human commits, every time.', lead: true },
  { screen: 'dates/pass', say: 'The Date Pass: calendar, separate rides, reschedule with consequences shown first.', lead: true },
  { screen: 'day/brief', say: 'Two hours before: the Brief. How to say their name, three things to ask.', phase: 'date-night', lead: true },
  { screen: 'day/live', say: 'Date night: “All well?” at 45 minutes, Call me out, SOS. Running late? Aura calls the venue after you confirm.', lead: true },
  { screen: 'after/morning', say: 'The Morning After, at 10 AM, never at night. Prediction meets reality, privately.', phase: 'morning-after', lead: true },
  { screen: 'after/learned', say: 'What Aura learned, which you confirm or reject. Then a second evening, revealed only if mutual.', lead: true },
  { screen: 'you/memory', say: 'Sunday Almanac: “You said ambitious. You kept choosing kind.”' },
  { screen: 'premium/paywall', say: 'Membership sells depth and time, never safety. Soirée, Maison, and the Date Pass deposit.' },
]
