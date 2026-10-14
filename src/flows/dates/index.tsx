import type { ScreenDef } from '../../shell/screens'
import './dates.css'
import { PlansList } from './List'
import { PrefsScreen } from './Prefs'
import { Planning } from './Planning'
import { Proposals, VenueScreen } from './Proposals'
import { Minutes } from './Minutes'
import { SealScreen, Sealed } from './Seal'
import { DatePass } from './Pass'

export const screens: ScreenDef[] = [
  {
    id: 'dates/list', title: 'Plans', component: PlansList, theme: 'day', chrome: 'tabs',
    pillars: ['Actions', 'Business'],
    note: 'Every evening Aura has arranged, in one place. Sealed plans become Date Passes; negotiations stay visible until both people seal.',
    real: 'Plans grouped live from app state by status; relative days from the demo clock; people you’re talking to without a plan are offered a table.',
  },
  {
    id: 'dates/prefs', title: 'Shall I set a table?', component: PrefsScreen, theme: 'day', presentation: 'modal',
    pillars: ['Actions', 'Trust'],
    note: 'Aura asks before she acts. Every choice here becomes a standing rule she negotiates with, and her autonomy is stated in plain words.',
    real: 'Budget, food, drinks, room, days and travel cap write to state; the plan is created here (a second evening goes to the following week).',
  },
  {
    id: 'dates/planning', title: 'Aura at work', component: Planning, theme: 'night', presentation: 'fade',
    pillars: ['Actions'],
    note: 'Agentic work described in plain words: what she checked and what she held. No logs, no jargon.',
    real: 'Lines are built from your rules and the other person’s name; the 10-minute table holds start when the last line checks off.',
  },
  {
    id: 'dates/proposals', title: 'Three evenings', component: Proposals, theme: 'day',
    pillars: ['Actions', 'Trust'],
    note: 'Three fair options with travel shown for both people, on a map that never shows a home.',
    real: 'Proposals ranked from both people’s interests; pins and the fair-middle halo placed from venue coordinates; hold rings count down in real time.',
  },
  {
    id: 'dates/minutes', title: 'Parley Minutes', component: Minutes, theme: 'day',
    pillars: ['Trust', 'Actions'],
    note: 'The negotiation, made legible. Every line is sourced, and nothing is said in either person’s voice.',
    real: 'Lines computed from your rules, the plan’s evenings, the widest travel gap and both people’s pages.',
  },
  {
    id: 'dates/venue', title: 'Venue', component: VenueScreen, theme: 'day', presentation: 'modal',
    pillars: ['Actions', 'Trust'],
    note: 'Why this room, in Aura’s words, with safety-minded facts and two equally fair swaps.',
    real: 'Alternatives ranked by your room and budget rules; a swap rewrites that evening in the plan.',
  },
  {
    id: 'dates/seal', title: 'Seal the evening', component: SealScreen, theme: 'day', presentation: 'modal',
    pillars: ['Trust', 'Business', 'Actions'],
    note: 'A two-sided commitment. Privacy defaults are on, and the $15 deposit is explained before anything is taken.',
    real: 'Press and hold for one second; the other side seals 2.2s later; a Date Pass credit is spent from state; Guardian toggle writes to state.',
  },
  {
    id: 'dates/sealed', title: 'Sealed', component: Sealed, theme: 'night', presentation: 'fade',
    pillars: ['Actions', 'Trust'],
    note: 'The ceremony. The wax presses in, then everything already taken care of, so the only thing left is the evening.',
    real: 'Chime and haptic on the press (respects Aura muted); initials and day read from the sealed plan.',
  },
  {
    id: 'dates/pass', title: 'Date Pass', component: DatePass, theme: 'night',
    pillars: ['Trust', 'Business'],
    note: 'A letterpress pass under first names only. Rides are booked separately, and the cost of changing plans is shown before you choose.',
    real: 'Surprise mode hides the room until 10 AM on the day by the demo clock; reschedule and cancel rewrite the plan, connection and Date Pass credit.',
  },
]
