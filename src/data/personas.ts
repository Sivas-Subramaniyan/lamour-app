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
      lifestyle: { kids: 'open', drinks: 'socially', smokes: false, faith: 3, relocate: 'no' },
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
  tomas: {
    id: 'tomas', first: 'Tomás', last: 'Rivera', birthName: 'Tomás Rivera', dob: '1997-05-19', gender: 'man', pronouns: 'he/him',
    job: 'Ceramicist & high-school art teacher', hood: 'Bushwick', from: 'San Antonio → Bushwick', languages: ['English', 'Spanish'], intent: 'long-term',
    headline: 'Teaches fifteen-year-olds to glaze. Keeps every one of their accidents on a shelf.',
    pages: [
      { label: 'A Sunday, ideally', text: 'Opening the kiln at nine, which never stops feeling like Christmas morning. Tacos on Knickerbocker after, then an afternoon of throwing nothing in particular.', voiceSecs: 15 },
      { label: 'My students would tell you', text: 'That I say “slow down, it’s just mud” about forty times a day. I mean it every time.', voiceSecs: 12 },
      { label: 'I’m looking for', text: 'Someone who finishes things, or at least loves starting them. I have a shelf of half-trimmed bowls that says I’m the second kind.' },
      { label: 'A green flag', text: 'You keep the lopsided mug because someone you love made it.' },
    ],
    aura: {
      note: 'Tomás spends his days making teenagers less afraid of getting it wrong. His studio shelf holds every glaze accident his students have made, labeled like museum pieces.',
      briefing: 'You two share a language most people don’t: clay, kilns, and the patience of things that take a long time. You both put kindness and doing things your own way first, and you both want a family one day. He writes back in the afternoons, once the last class has gone. Ask to see the shelf.',
      bridge: ['Marisol’s “wet parking lot” glaze, and what makes an accident a happy one', 'Trade test tiles: your peach at 6 PM for one of his', 'The shared kiln in Bushwick he fires on Fridays, ask if there’s room on a shelf', 'What he tells a student who wants to quit after one collapsed pot'],
      careNote: 'He teaches until 3:30 and answers after the last bell. A quiet morning is a school day, not distance.',
    },
    care: { words: 0.7, time: 0.8, acts: 0.85, touch: 0.6, gifts: 0.75, growth: 0.7 },
    halo: { selfie: true, id: true, work: true },
    traits: {
      values: [5.4, 4.0, 3.6, 4.0, 2.0, 4.2, 2.8, 3.4, 5.6, 5.2], anxiety: 2.8, avoidance: 2.4, extraversion: 0.55, openness: 0.8,
      conflict: 'balanced', replyMins: 150, msgLen: 2, humour: 0.8,
      lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' },
      interests: ['ceramics', 'teaching', 'cooking', 'long walks', 'baseball', 'museums'],
    },
    photos: p('tomas'),
  },
  daniel: {
    id: 'daniel', first: 'Daniel', last: 'Okafor', birthName: 'Daniel Chukwuemeka Okafor', dob: '1994-08-27', gender: 'man', pronouns: 'he/him',
    job: 'Climate-tech engineer', hood: 'Prospect Heights', from: 'Lagos → London → Prospect Heights', languages: ['English', 'Igbo'], intent: 'long-term',
    headline: 'Builds batteries the size of shipping containers. Grows tomatoes the size of marbles.',
    pages: [
      { label: 'Where you’ll find me at 6 AM', text: 'Prospect Park, second loop, the stretch past the boathouse where the geese have opinions.', voiceSecs: 12 },
      { label: 'What I actually do all day', text: 'Help the grid hold on to sunshine until after dark. Less heroic than it sounds, more spreadsheets.' },
      { label: 'Lately I can’t stop thinking about', text: 'My fire-escape tomatoes. Eleven this season. I haven’t named any of them, which I think shows restraint.', voiceSecs: 15 },
      { label: 'I’m looking for', text: 'Someone who’ll come to the farmers market with no list and stay for the whole thing.' },
    ],
    aura: {
      note: 'Daniel grew up between Lagos and London and still says “cheers” when he means thank you. He’s early to everything, steady under pressure, and quietly funny once he’s warmed up.',
      briefing: 'You both care more about kindness than status, and you both want a family one day. He spends his days helping the city keep its lights on with sunshine, and his mornings running the park. A garden in daylight suits him. One thing to know: when things get tense he goes for a run to think, and you move toward. Ask for the loop, not the silence.',
      bridge: ['The eleven tomatoes on his fire escape, and whether any survived the cold snap', 'The geese at the boathouse, and his second loop', 'Lagos, London, then Brooklyn: what he kept from each', 'A farmers market with no list, and what you’d cook from it'],
      careNote: 'When things get tense he runs to think, and you move toward. Ask for the loop, not the silence. He’s back in forty minutes.',
    },
    care: { words: 0.5, time: 0.85, acts: 0.9, touch: 0.6, gifts: 0.35, growth: 0.75 },
    halo: { selfie: true, id: true, work: true },
    traits: {
      values: [5.0, 3.6, 3.4, 5.0, 2.8, 4.6, 3.0, 3.4, 5.4, 5.2], anxiety: 2.4, avoidance: 3.0, extraversion: 0.4, openness: 0.7,
      conflict: 'withdraw', replyMins: 45, msgLen: 2, humour: 0.6,
      lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' },
      interests: ['running', 'gardening', 'cooking', 'long walks', 'football', 'music'],
    },
    photos: p('daniel'),
  },
  priya: {
    id: 'priya', first: 'Priya', last: 'Nair', birthName: 'Priya Nair', dob: '1997-09-01', gender: 'woman', pronouns: 'she/her',
    job: 'Machine-learning researcher', hood: 'Upper West Side', from: 'Kochi → Edison → Upper West Side', languages: ['English', 'Malayalam', 'Tamil'], intent: 'long-term',
    headline: 'Teaches computers to listen. Practices ragas in Riverside Park, where only the joggers can hear.',
    pages: [
      { label: 'A Sunday, ideally', text: 'Practice at seven while the park is still empty, dosa with my sister at noon, then a museum I’ve been to twenty times and a room I’ve somehow never seen.', voiceSecs: 17 },
      { label: 'What my work is really about', text: 'Getting a computer to understand a grandmother who switches languages mid-sentence. Mine does it on every call.' },
      { label: 'I’m looking for', text: 'Someone who’s kind first and clever second, and lets me sing in the kitchen without comment.', voiceSecs: 11 },
      { label: 'A green flag', text: 'You make tea for everyone in the room, not just yourself.' },
    ],
    aura: {
      note: 'Priya sang before she could read, and she still practices most mornings. She’s exact at work and unhurried everywhere else.',
      briefing: 'You two are close on the things that last. You both put kindness and making your own way first, you both want a family one day, and you both make something slowly by hand: her ragas, your bowls. She’s a little quieter in a room than you, and just as quick on a text. Ask about the song her grandmother taught her.',
      bridge: ['The raga she practices in Riverside Park before the joggers arrive', 'Her grandmother, who switches languages mid-sentence', 'The museum you’ve each visited twenty times, and the room you’ve never seen', 'What you each make slowly: her songs, your glazes'],
      careNote: 'You both reach for each other quickly, which is lovely until you’re both tired. Say it out loud when you need a quiet evening.',
    },
    care: { words: 0.8, time: 0.85, acts: 0.7, touch: 0.55, gifts: 0.4, growth: 0.85 },
    halo: { selfie: true, id: true, work: true },
    traits: {
      values: [5.6, 4.0, 3.6, 4.6, 2.0, 4.2, 2.8, 3.2, 5.8, 5.2], anxiety: 2.8, avoidance: 2.2, extraversion: 0.4, openness: 0.85,
      conflict: 'balanced', replyMins: 20, msgLen: 3, humour: 0.65,
      lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' },
      interests: ['music', 'museums', 'cooking', 'long walks', 'reading', 'film'],
    },
    photos: p('priya'),
  },
  hana: {
    id: 'hana', first: 'Hana', last: 'Sato', birthName: 'Hana Sato', dob: '1998-02-03', gender: 'woman', pronouns: 'she/her',
    job: 'Pediatric nurse', hood: 'Astoria', from: 'Seattle → Astoria', languages: ['English', 'Japanese'], intent: 'long-term',
    headline: 'Night shifts on a children’s ward. Days on a climbing wall, mostly upside down.',
    pages: [
      { label: 'Where you’ll find me after a night shift', text: 'Hanging off the overhang at the gym in Long Island City, then breakfast at four in the afternoon.', voiceSecs: 14 },
      { label: 'What the kids taught me', text: 'That you can be terrified and brave in the same minute. Most of them manage it before lunch.' },
      { label: 'My most controversial opinion', text: 'Karaoke is a team sport, and the worst singer should go first.', voiceSecs: 10 },
      { label: 'I’d love to meet someone who', text: 'Texts back like it’s a conversation, not homework.' },
    ],
    aura: {
      note: 'Hana works nights on a children’s ward and spends her days climbing. She’s quick, funny, and the first to volunteer for the hard thing.',
      briefing: 'Hana is more social than you, and she texts fast and short, usually between rounds. You share kindness first and a real love of food. She recharges at a busy climbing gym, you at a quiet wheel. That’s a difference to plan around, not a problem. Give it one real conversation.',
      bridge: ['What the kids on her ward taught her about being brave', 'Breakfast at four in the afternoon, and her favorite spot for it in Astoria', 'Karaoke strategy: who goes first, and why', 'Your wheel and her wall, two places you each go to stop thinking'],
      careNote: 'She recharges with people and texts in quick bursts; you recharge alone and write long. Say how you text, and protect one slow evening.',
    },
    care: { words: 0.75, time: 0.6, acts: 0.85, touch: 0.8, gifts: 0.5, growth: 0.6 },
    halo: { selfie: true, id: true, work: true },
    traits: {
      values: [4.4, 5.4, 4.8, 4.2, 2.8, 3.8, 3.0, 3.0, 5.2, 4.4], anxiety: 3.0, avoidance: 2.6, extraversion: 0.8, openness: 0.62,
      conflict: 'balanced', replyMins: 5, msgLen: 1, humour: 0.95,
      lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 0, relocate: 'maybe' },
      interests: ['climbing', 'karaoke', 'food', 'cooking', 'travel', 'long walks'],
    },
    photos: p('hana'),
  },
  leila: {
    id: 'leila', first: 'Leila', last: 'Haddad', birthName: 'Leila Haddad', dob: '1993-03-04', gender: 'woman', pronouns: 'she/her',
    job: 'Documentary film editor', hood: 'Greenpoint', from: 'Beirut → Dearborn → Greenpoint', languages: ['Arabic', 'French', 'English'], intent: 'long-term',
    headline: 'Cuts forty hours of footage into ninety minutes. Keeps every outtake.',
    pages: [
      { label: 'Lately I can’t stop thinking about', text: 'The first eight seconds of a shot, before anyone remembers the camera is on. That’s where people tell the truth.', voiceSecs: 16 },
      { label: 'Don’t be surprised if', text: 'I disappear into an edit for a week and come out with strong feelings about a stranger’s kitchen table.' },
      { label: 'A Sunday, ideally', text: 'Man’oushe from the bakery on Manhattan Avenue, the paper in print, and a film with subtitles I pretend I don’t need.', voiceSecs: 13 },
      { label: 'I’m looking for', text: 'Someone who can sit in a long silence and not reach for their phone.' },
    ],
    aura: {
      note: 'Leila is my wildcard for you this week. She’s slower to open than you and goes quiet when she’s deep in a film, but she notices everything and forgets nothing.',
      briefing: 'Leila isn’t the obvious choice, which is why she’s here. You share a love of film and the patience of making something slowly. Where you differ is tempo: when she’s cutting a film she disappears for days, and you like to hear early that things are fine. Go in curious, and ask about the outtakes.',
      bridge: ['The outtakes she keeps, and the one she wishes had made the cut', 'The first eight seconds of a shot, and your first minute at the wheel', 'Man’oushe on Manhattan Avenue against your slow Sunday cooking', 'A film you each think nobody saw enough'],
      careNote: 'During an edit she goes quiet for days; you like reassurance early. Agree on a check-in before the cut starts.',
    },
    care: { words: 0.55, time: 0.8, acts: 0.6, touch: 0.5, gifts: 0.45, growth: 0.8 },
    halo: { selfie: true, id: true, work: false },
    traits: {
      values: [5.0, 4.8, 3.0, 5.4, 3.4, 2.6, 2.0, 4.0, 3.9, 5.0], anxiety: 3.2, avoidance: 4.6, extraversion: 0.22, openness: 0.92,
      conflict: 'withdraw', replyMins: 720, msgLen: 3, humour: 0.35,
      lifestyle: { kids: 'open', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' },
      interests: ['film', 'documentary', 'reading', 'museums', 'travel', 'food'],
    },
    photos: p('leila'),
  },
  chloe: {
    id: 'chloe', first: 'Chloe', last: 'Brennan', birthName: 'Chloe Brennan', dob: '1995-12-08', gender: 'woman', pronouns: 'she/her',
    job: 'Rare-books dealer', hood: 'West Village', from: 'Boston → West Village', languages: ['English', 'French (reading)'], intent: 'long-term',
    headline: 'Sells first editions. Collects what people left inside them.',
    pages: [
      { label: 'The best thing I’ve found in a book', text: 'A pressed violet in a 1902 travel guide, and a note in the margin that just said “here, with you”.', voiceSecs: 15 },
      { label: 'Where you’ll find me on a Thursday', text: 'An auction preview on the Upper East Side, gloves on, pretending I’m not going to bid.' },
      { label: 'What I’m learning', text: 'To let a good book go to the right person, even when the right person isn’t me.', voiceSecs: 12 },
      { label: 'A green flag', text: 'You write in the margins and you’re not sorry about it.' },
    ],
    aura: {
      note: 'Chloe can date a binding by its smell, and she’ll tell you the story of every object in her shop if you let her. She grew up in a big Boston family, and Sunday dinner is still not optional.',
      briefing: 'Chloe is warm, exact, and very funny about old things. You share kindness first and a love of objects with a history: her books, your pots. Where you differ is the long run. Family tradition sits closer to the center of her life than yours. Nothing clashes, but it’s worth a gentle conversation by the second date.',
      bridge: ['The pressed violet, and the schoolteacher from Ohio who left it there', 'What her shop and your studio smell like at closing time', 'Sunday dinner with a big Boston family, and your Sunday table for friends', 'Margins: does she forgive people who write in them'],
      careNote: 'Tradition and family rituals sit closer to the center for her. Ask about her Sundays early, and tell her about yours.',
    },
    care: { words: 0.85, time: 0.75, acts: 0.55, touch: 0.5, gifts: 0.8, growth: 0.55 },
    halo: { selfie: true, id: true, work: true },
    traits: {
      values: [4.2, 3.4, 3.6, 4.2, 2.4, 5.0, 4.0, 5.0, 5.6, 4.4], anxiety: 3.0, avoidance: 2.6, extraversion: 0.6, openness: 0.62,
      conflict: 'balanced', replyMins: 60, msgLen: 3, humour: 0.8,
      lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 2, relocate: 'no' },
      interests: ['books', 'antiques', 'museums', 'long walks', 'cooking', 'film'],
    },
    photos: p('chloe'),
  },
  amara: {
    id: 'amara', first: 'Amara', last: 'Diallo', birthName: 'Amara Diallo', dob: '1994-04-22', gender: 'woman', pronouns: 'she/her',
    job: 'Urban planner', hood: 'Clinton Hill', from: 'Dakar → Lyon → Clinton Hill', languages: ['Wolof', 'French', 'English'], intent: 'long-term',
    headline: 'Plans streets for people who walk. Knows every bench in Fort Greene Park.',
    pages: [
      { label: 'A Sunday, ideally', text: 'A long walk with no map, a bench I haven’t sat on yet, and thieboudienne for whoever turns up at six.', voiceSecs: 16 },
      { label: 'What I actually do all day', text: 'Argue for wider sidewalks and more shade. Small things, until you’re eighty and they’re everything.' },
      { label: 'Lately I can’t stop thinking about', text: 'Why some corners make strangers talk to each other. I’ve been counting, and it’s mostly the benches.', voiceSecs: 13 },
      { label: 'I’m looking for', text: 'Someone who likes to wander and still gets home at a reasonable hour.' },
    ],
    aura: {
      note: 'Amara grew up between Dakar and Lyon and now redesigns Brooklyn one corner at a time. She’s calm, generous with her table, and very hard to rush.',
      briefing: 'You two are close on what matters: kindness, making your own way, a family one day. You both love to wander. She notices how a city is built, you notice what it’s made of. She cooks for a crowd, you cook slowly for friends. One small thing: she answers in the evening, in long paragraphs, and rarely before.',
      bridge: ['Her bench count in Fort Greene Park, and which one is hers', 'Thieboudienne for whoever turns up, and your slow Sunday cooking', 'The hidden passages through old buildings in Lyon', 'The corners in your neighborhood that make strangers talk'],
      careNote: 'She answers in the evening, in long paragraphs; you answer in minutes. Say how you text up front and neither of you will wonder.',
    },
    care: { words: 0.7, time: 0.9, acts: 0.75, touch: 0.6, gifts: 0.45, growth: 0.8 },
    halo: { selfie: true, id: true, work: true },
    traits: {
      values: [5.4, 4.0, 3.8, 4.4, 2.4, 4.2, 2.8, 3.2, 5.6, 5.4], anxiety: 2.6, avoidance: 2.4, extraversion: 0.5, openness: 0.85,
      conflict: 'balanced', replyMins: 180, msgLen: 3, humour: 0.6,
      lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 2, relocate: 'maybe' },
      interests: ['architecture', 'long walks', 'cooking', 'cycling', 'jazz', 'design'],
    },
    photos: p('amara'),
  },
  rowan: {
    id: 'rowan', first: 'Rowan', last: 'Ellis', birthName: 'Rowan Ellis', dob: '1996-07-15', gender: 'nonbinary', pronouns: 'they/them',
    job: 'Sound designer', hood: 'Ridgewood', from: 'Portland → Ridgewood', languages: ['English'], intent: 'exploring',
    headline: 'Records the city at 4 AM. Makes films sound like rooms you’ve stood in.',
    pages: [
      { label: 'Lately I can’t stop thinking about', text: 'The M train crossing Myrtle Avenue. I’ve recorded it in every season, and I swear winter sounds lower.', voiceSecs: 18 },
      { label: 'Where you’ll find me at 4 AM', text: 'On a fire escape with a microphone, waiting for the city to go quiet for nine whole seconds.' },
      { label: 'Don’t be surprised if', text: 'I stop mid-sentence because a door somewhere has a good creak.', voiceSecs: 9 },
      { label: 'I’d love to meet someone who', text: 'Will stay for a warehouse set at midnight and still meet me at a silent museum at ten.' },
    ],
    aura: {
      note: 'Rowan is my wildcard for you this week. They live at night and listen for a living, and they’re honest that they’re still working out what they want.',
      briefing: 'Rowan isn’t your usual. They keep late hours, love a loud room at midnight, and text in short bursts. What you share runs deeper: you both make things that take a long time, and you both notice what other people walk past. They’re exploring rather than settled, so go in curious, not invested.',
      bridge: ['The M train in winter, and why it sounds lower', 'What a kiln sounds like as it cools: ask if they’ve ever recorded one', 'Their nine seconds of quiet at 4 AM, and your first hour at the wheel', 'A film that sounds better than it looks'],
      careNote: 'They come alive after midnight; your evenings end at a quiet table. Agree early on how late is late.',
    },
    care: { words: 0.6, time: 0.75, acts: 0.65, touch: 0.7, gifts: 0.55, growth: 0.6 },
    halo: { selfie: true, id: true, work: false },
    traits: {
      values: [5.4, 5.6, 5.2, 3.4, 2.6, 2.2, 1.6, 1.8, 4.4, 5.0], anxiety: 3.4, avoidance: 3.8, extraversion: 0.78, openness: 0.95,
      conflict: 'withdraw', replyMins: 300, msgLen: 1, humour: 0.75,
      lifestyle: { kids: 'open', drinks: 'often', smokes: false, faith: 0, relocate: 'yes' },
      interests: ['nightlife', 'music', 'film', 'field recording', 'synthesizers', 'museums'],
    },
    photos: p('rowan'),
  },
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
