import type { ScreenDef } from '../../shell/screens'
import { SignatureReveal } from './Signature'
import { AuraHome } from './Aura'
import { Chapters } from './Chapters'
import { Chamber } from './Chamber'
import { Heard } from './Heard'
import { LifeDesign } from './LifeDesign'
import { TextChapter } from './TextChapter'
import { Numbers } from './Numbers'
import './conv.css'

export const screens: ScreenDef[] = [
  {
    id: 'conv/aura', title: 'Aura', component: AuraHome, theme: 'night', chrome: 'tabs',
    pillars: ['Actions', 'Personality', 'Trust'],
    note: 'Aura’s home: hold the orb and ask. She answers from what she actually knows, names her sources, and previews anything she would do before you confirm it.',
    real: 'Live mic level swells the orb; Web Speech transcript; spoken replies with word-synced text; answers computed from the compatibility engine, plans and the Your Turn clock.',
  },
  {
    id: 'conv/chapters', title: 'Chapter book', component: Chapters, theme: 'day',
    pillars: ['Psychometry', 'Personality'],
    note: 'Seven short chapters instead of a form. Progress, minutes left and when the first letter arrives are always visible, and anything can be revisited.',
    real: 'Chapter status, minutes and pending “heard” lines read from state.',
  },
  {
    id: 'conv/chamber', title: 'Voice chamber', component: Chamber, theme: 'night', presentation: 'fade',
    pillars: ['Psychometry', 'Personality', 'Trust'],
    note: 'The hero of the First Conversation. Open story prompts mixed with validated attachment items read verbatim, with an off-the-record hold that pauses everything.',
    real: 'Signature grains scatter with the live mic level; Web Speech transcript; Aura’s question revealed in sync with her voice; 7-point items move the attachment estimates; finishing writes the chapter and new “heard” cards.',
  },
  {
    id: 'conv/heard', title: 'Here’s what I heard', component: Heard, theme: 'day',
    pillars: ['Trust', 'Personality'],
    note: 'Every inference is shown with its source and stays pending until you confirm, adjust or strike it. Nothing shapes introductions without your say.',
    real: 'Confirm, adjust and strike write to the heard cards in state.',
  },
  {
    id: 'conv/life-design', title: 'Life design', component: LifeDesign, theme: 'day',
    pillars: ['Personality', 'Trust'],
    note: 'Non-negotiables with a firmness each. Hard lines filter; flexible ones are flagged to you first.',
    real: 'Saves life design and updates the lifestyle traits the compatibility engine reads.',
  },
  {
    id: 'conv/text', title: 'Write instead', component: TextChapter, theme: 'day',
    pillars: ['Psychometry', 'Trust'],
    note: 'The same chapter as a quiet chat, for anyone who would rather not talk. Voice and text hand off mid-chapter.',
    real: 'Shares the chapter script and answers with the voice chamber; finishing writes the chapter and new “heard” cards.',
  },
  {
    id: 'conv/signature', title: 'Signature reveal', component: SignatureReveal, theme: 'night', presentation: 'fade',
    pillars: ['Personality'],
    note: 'The knowledge graph made visible. The figure is deterministic from the user’s traits, so two people never share a Signature.',
    real: 'Chladni figure computed from trait bands; grains settle on nodal lines in real time.',
  },
  {
    id: 'conv/numbers', title: 'The Working', component: Numbers, theme: 'night', presentation: 'fade',
    pillars: ['Latent', 'Trust'],
    note: 'Numerology, opt-in and shown with its arithmetic. It can only reorder introductions, is capped, and never touches the compatibility band.',
    real: 'Life Path, Expression, Soul Urge, Personality, Birthday, Maturity and Personal Year computed live from the birth name and date.',
  },
]
