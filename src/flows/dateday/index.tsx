import type { ScreenDef } from '../../shell/screens'
import { Brief } from './Brief'
import { Guardian } from './Guardian'
import { Live } from './Live'
import './dateday.css'

export const screens: ScreenDef[] = [
  {
    id: 'day/brief', title: 'The Brief', component: Brief, theme: 'night',
    pillars: ['Actions', 'Trust'],
    note: 'Two hours before, Aura reads a short brief aloud: how to say their name, three threads from their pages, one topic to save, and when to leave. Everything is about the two of you, nothing is written as you.',
    real: 'Brief composed from persona data and the sealed plan; spoken with the device voice, captions follow the speech; pronunciation chip speaks the name.',
  },
  {
    id: 'day/guardian', title: 'Guardian Circle', component: Guardian,
    pillars: ['Trust'],
    note: 'Up to three trusted people get a plain text: first name, venue, time, and live location only during the date window. It works without the app.',
    real: 'Contacts, toggles and check-in time write to state; the preview is built from the plan; sending posts a notification.',
  },
  {
    id: 'day/live', title: 'Live date mode', component: Live, theme: 'night', presentation: 'fade',
    pillars: ['Trust', 'Actions'],
    note: 'Date mode behaves like a Live Activity. A quiet “All well?” at the check-in time, a fake call on cue, a two-second SOS, and Aura calls the venue when you’re late, only after you confirm.',
    real: 'Live elapsed timer; check-in from the Guardian setting; SOS is a real press-and-hold; the late call types live captions, messages your date and offers a 10-second undo; “I’m home” closes the plan.',
  },
]
