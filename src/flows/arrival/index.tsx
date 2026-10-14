import type { ScreenDef } from '../../shell/screens'
import { Splash, Manifesto, Member, MeetAura } from './Night'
import { Invite, Phone, Basics } from './Join'
import { Consent, Photos, Verify } from './Trust'
import './arrival.css'

export const screens: ScreenDef[] = [
  {
    id: 'arrival/splash', title: 'Splash', component: Splash, theme: 'night', presentation: 'fade',
    pillars: ['Business', 'Trust'],
    note: 'The promise before the product: no swiping, no feed, at most three people a night. Blue hour sets the evening ritual from the first frame.',
    real: 'The drifting figure is the member’s own Signature, computed from her traits.',
  },
  {
    id: 'arrival/manifesto', title: 'The etiquette', component: Manifesto, theme: 'night',
    pillars: ['Trust', 'Business'],
    note: 'Five house rules a member agrees to before joining. Scarcity and kindness are the product, so they are stated up front.',
    real: 'Static by design.',
  },
  {
    id: 'arrival/invite', title: 'Request an invitation', component: Invite,
    pillars: ['Business', 'Trust'],
    note: 'A waitlist that feels like a members’ club: city by city, read by a person, a vouch moves you up. The demo code admits you.',
    real: 'Intent and city save to the profile; changing who you’d like to meet re-casts the whole demo.',
  },
  {
    id: 'arrival/phone', title: 'Your number', component: Phone,
    pillars: ['Trust'],
    note: 'Phone-first sign-in with a masked number on every date. Apple and Google are offered as equals.',
    real: 'Working six-box code entry with paste, backspace and a staggered demo fill.',
  },
  {
    id: 'arrival/basics', title: 'The basics', component: Basics,
    pillars: ['Trust', 'Personality'],
    note: 'The birth name for numerology is private and separate from the name people see. Age is shown, never the birthday.',
    real: 'Age and Life Path recompute as you type; everything saves to the profile.',
  },
  {
    id: 'arrival/consent', title: 'Consent', component: Consent,
    pillars: ['Trust'],
    note: 'Six consents, one at a time, with equal-weight answers and the honest cost of saying no. Ends with a receipt.',
    real: 'Each answer writes the member’s consent settings immediately.',
  },
  {
    id: 'arrival/photos', title: 'Photos & pages', component: Photos,
    pillars: ['Personality', 'Trust'],
    note: 'Photos carry voice stories, and the Voice-first Veil lets people hear you before they see you.',
    real: 'Live microphone level while recording a story; photos, pages and the Veil save to the profile.',
  },
  {
    id: 'arrival/verify', title: 'Verified Halo', component: Verify,
    pillars: ['Trust'],
    note: 'Verification as a visible ring rather than a badge: selfie, ID 18+ as a yes/no token, optional work.',
    real: 'The ring fills as each check completes and writes the member’s verification state.',
  },
  {
    id: 'arrival/member', title: 'Member card', component: Member, theme: 'night', presentation: 'fade',
    pillars: ['Business'],
    note: 'Admission as a ceremony: a letterpress card with the member number and her Signature. It never carries the surname.',
    real: 'The card tilts with the pointer; the Signature on it is computed from her traits.',
  },
  {
    id: 'arrival/meet-aura', title: 'Meet Aura', component: MeetAura, theme: 'night',
    pillars: ['Personality', 'Trust'],
    note: 'Aura is introduced plainly as an AI, with a choice of voice and how to talk. Then the First Conversation begins.',
    real: 'Each voice speaks a sample through the browser’s speech engine; the orb moves while she speaks.',
  },
]
