import type { ScreenDef } from '../../shell/screens'
import './you.css'
import { Home } from './Home'
import { Explorer } from './Explorer'
import { Numbers } from './Numbers'
import { Noticed } from './Noticed'
import { Memory } from './Memory'
import { Preview } from './Preview'
import { Rules } from './Rules'
import { Privacy } from './Privacy'
import { Discretion } from './Discretion'
import { Settings } from './Settings'

export const screens: ScreenDef[] = [
  {
    id: 'you/home', title: 'You', component: Home, theme: 'day', chrome: 'tabs', presentation: 'push',
    pillars: ['Personality', 'Trust'],
    note: 'A portrait page, not a settings list. The Signature sits beside the photograph, and Aura says plainly how well she knows you.',
    real: 'Completeness from finished chapters; new-pattern count, tier, Life Path and verification read live from state.',
  },
  {
    id: 'you/explorer', title: 'Signature explorer', component: Explorer, theme: 'night', presentation: 'push',
    pillars: ['Personality', 'Latent', 'Trust'],
    note: 'Every inferred trait is inspectable, sourced and correctable. Editing, pausing or forgetting an area redraws the Signature.',
    real: 'Area readings computed from trait bands; evidence quotes from the conversation; edits and forgets persist and change the figure.',
  },
  {
    id: 'you/numbers', title: 'Your numbers', component: Numbers, theme: 'day', presentation: 'push',
    pillars: ['Psychometry', 'Trust'],
    note: 'The full folio, kept below the science. The user chooses how much numbers count, and they can never change a band.',
    real: 'Pythagorean chart computed from birth name and date; tonight’s reorder count computed from Life Path pairs.',
  },
  {
    id: 'you/noticed', title: 'What Aura’s noticed', component: Noticed, theme: 'day', presentation: 'push',
    pillars: ['Latent', 'Trust'],
    note: 'Revealed preferences shown next to stated ones. The user confirms, sets aside or deletes each pattern.',
    real: 'Confirming or rejecting updates the learned likes and avoids that feed the “who you say yes to” score.',
  },
  {
    id: 'you/memory', title: 'Memory Lane & Almanac', component: Memory, theme: 'day', presentation: 'push',
    pillars: ['Personality', 'Latent'],
    note: 'A weekly almanac and a timeline of what Aura learned, each moment shown with the Signature as it was then.',
    real: 'Timeline built from finished chapters, heard cards and confirmations; forgotten items show as struck.',
  },
  {
    id: 'you/preview', title: 'As others see you', component: Preview, theme: 'day', presentation: 'push',
    pillars: ['Trust', 'Personality'],
    note: 'The user sees their spread as a match would, and chooses which traits a match’s explanation may draw on.',
    real: 'Shared Lens toggles rewrite the preview line live from the user’s own traits; foreword choice persists.',
  },
  {
    id: 'you/rules', title: 'Your rules', component: Rules, theme: 'day', presentation: 'push',
    pillars: ['Actions', 'Trust'],
    note: 'Standing orders and an autonomy dial. Aura acts inside them, and says plainly what it will never do alone.',
    real: 'Orders write to the planning preferences Three Evenings uses; the third autonomy level is gated by tier.',
  },
  {
    id: 'you/privacy', title: 'Privacy & data', component: Privacy, theme: 'day', presentation: 'push',
    pillars: ['Trust'],
    note: 'Six separate consents, retention in plain words, and per-conversation deletion that redraws the Signature.',
    real: 'Consent changes are logged with the demo time; deleting a conversation strikes what Aura learned from it.',
  },
  {
    id: 'you/discretion', title: 'Discretion', component: Discretion, theme: 'day', presentation: 'push',
    pillars: ['Trust'],
    note: 'Tools for people who need to be careful, with the honest limit of each stated beside it.',
    real: 'Every toggle binds to the shared discretion settings used by notifications and the hello flow.',
  },
  {
    id: 'you/settings', title: 'Settings', component: Settings, theme: 'day', presentation: 'push',
    pillars: ['Trust', 'Business'],
    note: 'Aura’s voice, quiet hours and who you’d like to meet. Re-casting rebuilds the whole story around new people.',
    real: 'Voice samples use the browser’s speech engine; re-cast resets the demo for the chosen audience.',
  },
]
