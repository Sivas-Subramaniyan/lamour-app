// The cast. New York, autumn 2026. Fictional people; photos are Unsplash stand-ins (see photos.ts).
// Numbers are never stored here: they are computed live from birthName + dob (lib/numerology.ts).
import type { Traits } from '../lib/compat'
import { PHOTOS, type Photo } from './photos'

export type Gender = 'woman' | 'man' | 'nonbinary'
export type Intent = 'exploring' | 'long-term' | 'marriage-minded'

export type Persona = {
  id: string
  first: string
  last: string
  birthName: string // private; only used for numbers
  dob: string // YYYY-MM-DD
  gender: Gender
  pronouns: string
  job: string
  hood: string // neighbourhood only, never an address
  from: string
  languages: string[]
  intent: Intent
  headline: string // one editorial line, name-first spreads use it under the name
  pages: { label: string; text: string; voiceSecs?: number }[] // their own story "pages"; voiceSecs = has a voice page
  aura: {
    note: string // Aura's foreword about them (written about them, approved by them)
    briefing: string // Aura's ~20s spoken "why you two", tailored to the demo user
    bridge: string[] // private threads to pull for the demo user
    careNote: string // the one honest "where you'll need care" line
  }
  care: { words: number; time: number; acts: number; touch: number; gifts: number; growth: number } // care styles 0–1
  halo: { selfie: boolean; id: boolean; work: boolean }
  traits: Traits
  photos: { portrait: Photo; portrait2?: Photo; world: Photo[] }
}

const p = (id: string) => PHOTOS[id] ?? { portrait: { url: '', alt: id }, world: [] }

function stub(id: string, first: string, last: string, birthName: string, dob: string, gender: Gender, pronouns: string, job: string, hood: string): Persona {
  return {
    id, first, last, birthName, dob, gender, pronouns, job, hood, from: 'New York', languages: ['English'], intent: 'long-term',
    headline: job, pages: [{ label: 'A Sunday, ideally', text: '…' }],
    aura: { note: '', briefing: '', bridge: [], careNote: '' },
    care: { words: 0.5, time: 0.5, acts: 0.5, touch: 0.5, gifts: 0.5, growth: 0.5 },
    halo: { selfie: true, id: true, work: false },
    traits: {
      values: [4.5, 4, 4, 4, 3, 4, 3, 3, 5, 4.5], anxiety: 3, avoidance: 3, extraversion: 0.5, openness: 0.6, conflict: 'balanced',
      replyMins: 60, msgLen: 2, humour: 0.5, lifestyle: { kids: 'open', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' }, interests: [],
    },
    photos: p(id),
  }
}

export const PERSONAS: Record<string, Persona> = {
  kabir: {
    id: 'kabir', first: 'Kabir', last: 'Mehta', birthName: 'Kabir Mehta', dob: '1995-09-03', gender: 'man', pronouns: 'he/him',
    job: 'Architect, adaptive reuse', hood: 'Fort Greene', from: 'Pune → Brooklyn', languages: ['English', 'Hindi', 'Marathi'], intent: 'long-term',
    headline: 'Turns old warehouses into homes. Still can’t keep a basil plant alive.',
    pages: [
      { label: 'A Sunday, ideally', text: 'Flea market in the morning, a long lunch I cook too much for, then a walk with no destination until the light goes gold on the bridges.', voiceSecs: 16 },
      { label: 'Lately I can’t stop thinking about', text: 'How a building remembers. You can feel a hundred years of hands on an old staircase rail.' },
      { label: 'I’m looking for', text: 'Someone who notices small things and says them out loud. I’m better at noticing than saying, I’m working on it.', voiceSecs: 12 },
      { label: 'A green flag', text: 'You ask the waiter’s name and remember it next time.' },
    ],
    aura: {
      note: 'Kabir is quiet in a room and generous one-on-one. He told me he’s “better at noticing than saying”. He’s been working on the second part.',
      briefing: 'You both put kindness and freedom at the top of your lists, and you both want a family one day, without a rush. He thinks with his hands, like you do at the wheel. One thing to know: under stress you reach out and he goes quiet to think. It isn’t distance. Ask him for an hour, not a week.',
      bridge: ['The staircase rail he restored on Dean Street, ask what it felt like', 'Your glaze experiments: he’s curious about kilns', 'Pune winters vs your Jersey summers', 'His failed basil, your thriving monstera'],
      careNote: 'Under stress you move toward; Kabir steps back to think. Agree on “give me an hour” and he’ll keep it.',
    },
    care: { words: 0.45, time: 0.9, acts: 0.8, touch: 0.6, gifts: 0.3, growth: 0.7 },
    halo: { selfie: true, id: true, work: true },
    traits: {
      values: [5.2, 4.0, 3.5, 4.8, 2.6, 4.2, 2.6, 3.2, 5.4, 5.1], anxiety: 2.6, avoidance: 3.0, extraversion: 0.5, openness: 0.78,
      conflict: 'withdraw', replyMins: 90, msgLen: 2, humour: 0.6,
      lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' },
      interests: ['architecture', 'ceramics', 'cooking', 'long walks', 'film', 'cycling'],
    },
    photos: p('kabir'),
  },
  marcus: {
    id: 'marcus', first: 'Marcus', last: 'Bell', birthName: 'Marcus Anthony Bell', dob: '1996-03-04', gender: 'man', pronouns: 'he/him',
    job: 'Public defender', hood: 'Harlem', from: 'Baltimore → Harlem', languages: ['English', 'Spanish'], intent: 'long-term',
    headline: 'Argues for a living, plays piano to stop arguing.',
    pages: [
      { label: 'Where you’ll find me on a Thursday', text: 'Third row at a late set somewhere with sticky tables, pretending I don’t know the changes.', voiceSecs: 14 },
      { label: 'My most controversial opinion', text: 'Breakfast for dinner is the correct dinner.' },
      { label: 'What I’m learning', text: 'That rest is part of the work. My grandmother said it first; I’m slow.', voiceSecs: 11 },
    ],
    aura: {
      note: 'Marcus laughs before he finishes his own jokes. He spends his days in court for people who can’t afford one, and his nights at the piano.',
      briefing: 'Marcus is more social than you, and he texts fast and short. You share kindness and a sense of fairness, and both of you would rather go to a small jazz room than a club. Your numbers don’t line up, but the things that last do. Give it one real conversation.',
      bridge: ['His grandmother’s rule about rest', 'The jazz rooms you both keep going back to', 'Breakfast-for-dinner: defend your position'],
      careNote: 'He recharges with people, you recharge with a wheel and a quiet studio. Plan the big nights together and protect one slow evening.',
    },
    care: { words: 0.85, time: 0.7, acts: 0.6, touch: 0.7, gifts: 0.4, growth: 0.6 },
    halo: { selfie: true, id: true, work: false },
    traits: {
      values: [4.5, 4.8, 4.4, 4.6, 3.0, 3.5, 2.5, 2.6, 5.0, 4.6], anxiety: 3.0, avoidance: 2.8, extraversion: 0.78, openness: 0.7,
      conflict: 'balanced', replyMins: 15, msgLen: 1, humour: 0.9,
      lifestyle: { kids: 'open', drinks: 'socially', smokes: false, faith: 2, relocate: 'no' },
      interests: ['jazz', 'music', 'cooking', 'basketball', 'museums', 'long walks'],
    },
    photos: p('marcus'),
  },
  julien: {
    id: 'julien', first: 'Julien', last: 'Moreau', birthName: 'Julien Moreau', dob: '1993-01-06', gender: 'man', pronouns: 'he/him',
    job: 'Food writer, ex-chef', hood: 'Lower East Side', from: 'Lyon → New York', languages: ['French', 'English', 'Italian'], intent: 'exploring',
    headline: 'Left the kitchen to write about it. Still cooks like he’s feeding forty.',
    pages: [
      { label: 'The last thing that surprised me', text: 'A tamale in Queens that rearranged my top ten.', voiceSecs: 18 },
      { label: 'Don’t be surprised if', text: 'I book a flight on a Tuesday for that weekend.' },
      { label: 'I’d love to meet someone who', text: 'Has strong opinions about bread and soft ones about people.' },
    ],
    aura: {
      note: 'Julien is my wildcard for you this week. He’s spontaneous where you plan, and he’s honest that he isn’t sure what he wants yet.',
      briefing: 'Julien isn’t your usual. He’s spontaneous, very curious, and he travels on a whim. You share a love of food and film, and you’d never be bored. He’s exploring rather than looking for something long-term yet, so go in curious, not invested.',
      bridge: ['The Queens tamale that changed his rankings', 'Bread: strong opinions only', 'The last city you each booked on impulse'],
      careNote: 'Different tempos: he replies in a day, you in minutes. Say how you text up front.',
    },
    care: { words: 0.7, time: 0.5, acts: 0.9, touch: 0.8, gifts: 0.6, growth: 0.4 },
    halo: { selfie: true, id: false, work: true },
    traits: {
      values: [5.0, 5.5, 5.2, 3.5, 3.2, 2.5, 2.0, 2.5, 4.0, 4.2], anxiety: 4.2, avoidance: 4.6, extraversion: 0.8, openness: 0.9,
      conflict: 'withdraw', replyMins: 600, msgLen: 3, humour: 0.8,
      lifestyle: { kids: 'open', drinks: 'often', smokes: false, faith: 0, relocate: 'yes' },
      interests: ['food', 'travel', 'wine', 'writing', 'markets', 'film'],
    },
    photos: p('julien'),
  },
  // --- stubs: the content pass replaces each with a full persona like kabir ---
  tomas: stub('tomas', 'Tomás', 'Rivera', 'Tomás Rivera', '1997-05-19', 'man', 'he/him', 'Ceramicist & high-school art teacher', 'Bushwick'),
  daniel: stub('daniel', 'Daniel', 'Okafor', 'Daniel Chukwuemeka Okafor', '1994-08-27', 'man', 'he/him', 'Climate-tech engineer', 'Prospect Heights'),
  priya: stub('priya', 'Priya', 'Nair', 'Priya Nair', '1997-09-01', 'woman', 'she/her', 'Machine-learning researcher', 'Upper West Side'),
  hana: stub('hana', 'Hana', 'Sato', 'Hana Sato', '1998-02-03', 'woman', 'she/her', 'Pediatric nurse', 'Astoria'),
  leila: stub('leila', 'Leila', 'Haddad', 'Leila Haddad', '1993-03-04', 'woman', 'she/her', 'Documentary film editor', 'Greenpoint'),
  chloe: stub('chloe', 'Chloe', 'Brennan', 'Chloe Brennan', '1995-12-08', 'woman', 'she/her', 'Rare-books dealer', 'West Village'),
  amara: stub('amara', 'Amara', 'Diallo', 'Amara Diallo', '1994-04-22', 'woman', 'she/her', 'Urban planner', 'Clinton Hill'),
  rowan: stub('rowan', 'Rowan', 'Ellis', 'Rowan Ellis', '1996-07-15', 'nonbinary', 'they/them', 'Sound designer', 'Ridgewood'),
}

/** Who appears where, by who the user wants to meet. Tonight = I, II, III. */
export const CAST: Record<'men' | 'women' | 'everyone', { tonight: string[]; yourTurn: string; sealed: string }> = {
  men: { tonight: ['kabir', 'marcus', 'julien'], yourTurn: 'tomas', sealed: 'daniel' },
  women: { tonight: ['priya', 'hana', 'leila'], yourTurn: 'chloe', sealed: 'amara' },
  everyone: { tonight: ['kabir', 'priya', 'rowan'], yourTurn: 'tomas', sealed: 'amara' },
}

export const persona = (id: string) => PERSONAS[id]
export const ageOf = (dob: string, today = '2026-10-14') => {
  const [y, m, d] = dob.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0)
}
