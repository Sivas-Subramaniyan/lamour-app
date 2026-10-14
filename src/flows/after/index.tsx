import type { ScreenDef } from '../../shell/screens'
import { Morning } from './Morning'
import { Learned } from './Learned'
import './after.css'

export const screens: ScreenDef[] = [
  {
    id: 'after/morning', title: 'The Morning After', component: Morning,
    pillars: ['Psychometry', 'Latent', 'Trust'],
    note: 'At 10 AM, never at night. Aura’s prediction meets your reality, privately, with a separate safety question and an optional voice debrief. The other person never sees any of it.',
    real: 'Band from the live compatibility model; mic level and transcript are live where the browser allows; answers become sourced “noticed” cards, update learned likes and avoids, and move the arc to Debriefed.',
  },
  {
    id: 'after/learned', title: 'What Aura learned', component: Learned,
    pillars: ['Latent', 'Personality', 'Actions'],
    note: 'You confirm or set aside each thing Aura took from the evening, watch your Signature shift a little, then answer a private “second evening?” that is revealed only if mutual.',
    real: 'Cards come from the debrief and write their status back; the Signature re-forms from nudged modes; a mutual yes starts a new plan with next week’s evenings.',
  },
]
