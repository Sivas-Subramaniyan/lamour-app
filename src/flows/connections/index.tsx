import type { ScreenDef } from '../../shell/screens'
import './conn.css'
import { Table } from './Table'
import { Hello } from './Hello'
import { Bridge } from './Bridge'
import { Chat } from './Chat'
import { VoiceHour } from './VoiceHour'
import { Exit, Report } from './Close'

export const screens: ScreenDef[] = [
  {
    id: 'conn/table', title: 'The Table', component: Table, theme: 'day', chrome: 'tabs', tab: 'table',
    pillars: ['Actions', 'Trust'],
    note: 'Three Chairs made physical: a round table seen from above. Each chair shows whose turn it is and how long is left; an empty chair leads to tonight’s letter.',
    real: 'Chairs, rings and countdowns computed from connections, plans and the demo clock. Grace reflects whether any reply is overdue.',
  },
  {
    id: 'conn/hello', title: 'Voice hello', component: Hello, theme: 'night', presentation: 'modal',
    pillars: ['Actions', 'Personality'],
    note: 'The first contact is a twenty-second voice hello, not an opener line. Hold to record, listen back, send.',
    real: 'Live mic level and Web Speech captions while recording; a 20-second ring timer; playback reads the caption aloud. Sending hands the turn over and a reply arrives a little later.',
  },
  {
    id: 'conn/bridge', title: 'Bridge Brief', component: Bridge, theme: 'day',
    pillars: ['Personality', 'Trust'],
    note: 'Private threads to pull. Aura writes about the two of you, never as you, and a thread becomes a tip above the composer, never inserted text.',
    real: 'Threads and care note from the persona data and the live fit; voice pages play with a progress sweep.',
  },
  {
    id: 'conn/chat', title: 'Conversation', component: Chat, theme: 'day',
    pillars: ['Actions', 'Trust'],
    note: 'Your Turn, labelled assistance, and nothing sent without a tap. After a couple of exchanges Aura offers to set a table.',
    real: 'Messages persist; sending passes the turn, a scripted reply arrives after a typing pause and restarts your 48 hours. Drafts carry a “Drafted with Aura” label onto the sent message.',
  },
  {
    id: 'conn/voice-hour', title: 'Voice Hour', component: VoiceHour, theme: 'night', presentation: 'modal',
    pillars: ['Personality', 'Actions'],
    note: 'Ten minutes, audio only. Two Signatures stand in for faces, each moving with that person’s voice.',
    real: 'Real 10-minute countdown; your Signature scatters with your live mic level; prompts drawn from interests you share. Ending logs the call on the arc.',
  },
  {
    id: 'conn/exit', title: 'Close kindly', component: Exit, theme: 'day', presentation: 'modal',
    pillars: ['Trust'],
    note: 'No ghosting. Three drafted notes, clearly labelled, fully editable. Closing frees the chair for both people.',
    real: 'Sends the note, closes the connection, releases any open plan and frees a chair on the Table.',
  },
  {
    id: 'conn/report', title: 'Report or block', component: Report, theme: 'day', presentation: 'modal',
    pillars: ['Trust'],
    note: 'Safety is never behind a paywall. A person reviews every report within a day, and the other person never learns who reported.',
    real: 'Closes the connection, adds to your blocked count, and moves the person to Past.',
  },
]
