import type { ScreenDef } from '../../shell/screens'
import { Dusk } from './Dusk'
import { Letter } from './Letter'
import { Deck } from './Deck'
import { Dossier, Briefing } from './Dossier'
import { Why, Blueprint, Resonance } from './Why'
import { Decide, Introduced } from './Decide'
import './tonight.css'

export const screens: ScreenDef[] = [
  {
    id: 'tonight/dusk', title: 'Before dusk', component: Dusk, theme: 'day', chrome: 'tabs',
    pillars: ['Personality', 'Business'],
    note: 'By day the app stays quiet. A sky clock walks the sun to the horizon, and the letter arrives at sunset, not on a feed.',
    real: 'Sun position and countdown from the demo clock; open chairs from your live connections; the tuning answer is saved.',
  },
  {
    id: 'tonight/letter', title: 'The sealed letter', component: Letter, theme: 'night', chrome: 'tabs', presentation: 'fade',
    pillars: ['Personality', 'Trust'],
    note: 'The ritual that replaces the swipe. You hold to break the seal, the letter unfolds, and Aura reads her preface.',
    real: 'Press-and-hold with a progress ring, haptics, a synthesized chime and spoken preface; opening is saved.',
  },
  {
    id: 'tonight/deck', title: 'Tonight’s three', component: Deck, theme: 'night', chrome: 'tabs',
    pillars: ['Personality', 'Psychometry', 'Business'],
    note: 'Three people, person first. The band sits small and below the face, never a score above it. Invitation members see one; Soirée sees all three.',
    real: 'Bands and top reasons computed live from both people’s traits; decisions and membership tier from state; letter closes on a live countdown.',
  },
  {
    id: 'tonight/dossier', title: 'Introduction', component: Dossier, theme: 'night',
    pillars: ['Personality', 'Trust', 'Latent'],
    note: 'Their own words and voice pages come first; Aura’s foreword is labelled and approved. Numbers sit below and apart from the science.',
    real: 'Voice pages read aloud with a progress waveform; Ask Aura answers only from what they shared; resonance computed from both charts.',
  },
  {
    id: 'tonight/briefing', title: 'Aura’s briefing', component: Briefing, theme: 'night', presentation: 'modal',
    pillars: ['Personality', 'Latent'],
    note: 'Twenty seconds on why you two, in Aura’s voice, with every reason traced to where it came from.',
    real: 'Spoken with word-synced captions (speech boundary events, timer fallback at 170 wpm); scrub, pause and resume.',
  },
  {
    id: 'tonight/why', title: 'Why you two', component: Why, theme: 'day',
    pillars: ['Psychometry', 'Trust', 'Business'],
    note: 'A band, a confidence level, three sourced reasons and one honest care note. Explainable, dyadic, never diagnostic.',
    real: 'All five dimensions scored live from both trait profiles; care notes beyond the first are a Soirée benefit.',
  },
  {
    id: 'tonight/blueprint', title: 'Where you meet', component: Blueprint, theme: 'night',
    pillars: ['Personality', 'Psychometry'],
    note: 'Two Signatures interfere where you overlap. Side-by-side traits and care styles, in words, with a plain list view.',
    real: 'Both Chladni figures drawn from trait bands; mirrored bars and care styles from each profile.',
  },
  {
    id: 'tonight/resonance', title: 'Resonance', component: Resonance, theme: 'night',
    pillars: ['Personality', 'Trust'],
    note: 'The numbers handshake, kept apart. When the numbers disagree with the evidence, Aura says so and goes with the evidence.',
    real: 'Life Paths, couple number and relation computed from both birth dates; respects your numbers setting.',
  },
  {
    id: 'tonight/decide', title: 'Your decision', component: Decide, theme: 'night', presentation: 'modal',
    pillars: ['Actions', 'Trust', 'Latent'],
    note: 'Lean in, Not tonight, or Hold. They only know if you both lean in, and a “Not tonight” reason only teaches Aura.',
    real: 'Decisions, reasons and an optional note are saved; Three Chairs blocks a fourth; mutual lean-ins introduce you.',
  },
  {
    id: 'tonight/introduced', title: 'Introduced', component: Introduced, theme: 'night', presentation: 'fade',
    pillars: ['Actions', 'Personality'],
    note: 'Both leaned in. Two Signatures meet, a chair fills, and a 72-hour window to say hello begins.',
    real: 'Connection created in state with a live countdown; chairs reflect your table.',
  },
]
