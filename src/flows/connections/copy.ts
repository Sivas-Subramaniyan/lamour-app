// Scripted voices for the Table: replies, Aura drafts, bridge fallbacks, Voice Hour prompts.
// Per-person lines first, generic lines after. Names always come from persona data.
import type { Persona } from '../../data/personas'

export const pron = (p: Persona) =>
  p.pronouns.startsWith('she') ? { sub: 'she', obj: 'her', poss: 'her' } : p.pronouns.startsWith('they') ? { sub: 'they', obj: 'them', poss: 'their' } : { sub: 'he', obj: 'him', poss: 'his' }

/** Incoming lines that ask to move off the app get a gentle "Does this bother you?" card. */
export const NUDGE = /\b(number|instagram|insta|whatsapp|snapchat|text me)\b/i

const REPLIES: Record<string, string[]> = {
  tomas: [
    'Ha. I’m telling Marisol you asked. She’ll be unbearable about it for a week.',
    'Honestly, they don’t overthink it. They dip, they hope, they move on. Half my job is not stopping them.',
    'I’d love to see the peach one in person sometime. If that’s not too forward for a Wednesday.',
  ],
  kabir: [
    'You’d be surprised how warm an old rail feels. Like someone only just let go of it.',
    'The basil and I are on a break. I think it needs someone who notices things.',
    'Most people ask what I do. You asked what it felt like. I like that a lot.',
  ],
  marcus: [
    'Savory. Grits, eggs, hot sauce, and I will hear no appeals.',
    'She said rest is part of the work. I said I’d rest after the work. She won.',
    'There’s a tiny room on 135th you’d like. Loud in the right way. Thursdays.',
  ],
  julien: [
    'Jackson Heights, a cart near the 7 train. I won’t say more without supervision.',
    'Bread: the rye from a bakery on Grand Street. I could be talked out of it, but not easily.',
    'This is fun. It would be easier on WhatsApp, though. What’s your number?',
  ],
  daniel: [
    'A book I’m not reading. Very convincing from across a room.',
    'Saturday still good on your side? I’ve already decided what not to over-order.',
    'Wind, mostly. Making it cheaper to store. I’ll explain it better over coffee than over text.',
  ],
  chloe: [
    'The ink gave her away. Schoolteachers in 1902 had beautiful, impatient handwriting.',
    'The oldest one I’ve held was a 1611 psalter. I didn’t breathe for about a minute.',
    'You make things that last. I look after things that lasted. We should compare notes.',
  ],
  amara: [
    'There’s a bench on Washington Avenue I’d defend in court. Perfect shade, perfect people-watching.',
    'Planners notice where people cut across the grass. That’s where the path should have been.',
    'I like talking to you. It feels like a walk with no destination.',
  ],
}
const GENERIC_REPLIES = [
  'That made me smile on the train. Tell me one thing about you that isn’t on your pages.',
  'I’m going to think about that on my walk home and give you a real answer.',
  'This is fun. Easier to text, though. What’s your number?',
  'I like how this is going. Slow and specific. Ask me anything.',
]

/** The next scripted line they haven't said yet in this thread. */
export function nextReply(id: string, said: (string | undefined)[]) {
  const pool = [...(REPLIES[id] ?? []), ...GENERIC_REPLIES]
  return pool.find(l => !said.includes(l)) ?? pool[said.length % pool.length]
}

const DRAFTS: Record<string, string[]> = {
  tomas: ['Okay, I need the full story of “wet parking lot”. Was Marisol proud or horrified?', 'Honest question: what do fifteen-year-olds get right about glazing that the rest of us overthink?'],
  kabir: ['I keep thinking about your staircase rail on Dean Street. What did it feel like the first time you put your hand on it?', 'Fair warning: I have a thriving monstera that could mentor your basil.'],
  marcus: ['Breakfast for dinner: I’m with you, but I need your order before I commit.', 'Your grandmother’s rule about rest. What finally made you listen?'],
  julien: ['Which tamale, and where in Queens? Strictly for research.', 'Strong opinions only: what’s the best bread in the city right now?'],
  daniel: ['Early and pretending not to be. What’s your cover, a book or studying the menu?', 'Tell me what you’re building, the version you’d tell a friend.'],
  chloe: ['I need to know how you knew it was a schoolteacher. Was it the handwriting?'],
  amara: ['If you could redesign one street in Clinton Hill, which would it be?'],
}
export function drafts(p: Persona) {
  const page = p.pages.find(x => x.text !== '…')
  return [...(DRAFTS[p.id] ?? []), ...(page ? [`I liked your page about ${page.label.toLowerCase()}. Can I have the longer version?`] : []), 'What does a good week look like for you right now?']
}
export const KEEP_HERE = 'I’d like to keep talking here a little longer, if that’s all right. I’m enjoying this.'

const BRIDGE: Record<string, string[]> = {
  tomas: ['Marisol’s “wet parking lot” glaze, and how it became the school favorite', 'What fifteen-year-olds get right about glazing that adults overthink', 'Your peach-at-6-PM accident: could the two of you make it again?'],
  daniel: ['Being early and pretending not to be: ask what his cover is', 'What he’s building in climate tech, in plain words', 'Prospect Heights on a Sunday morning'],
  chloe: ['The pressed violet in the 1902 travel guide', 'How she reads a stranger from their handwriting', 'The oldest book she has ever held'],
  amara: ['The street in Clinton Hill she would redesign first', 'What a planner notices on a walk that nobody else does', 'Her favorite public bench in the city'],
}
/** Threads to pull: the persona's own bridge, then a local fallback for people still being written. */
export function bridgeFor(p: Persona) {
  if (p.aura.bridge.length) return p.aura.bridge
  if (BRIDGE[p.id]) return BRIDGE[p.id]
  const { sub, obj, poss } = pron(p)
  return [`What a good day looks like in ${poss} work`, `${p.hood}: the corner ${sub} would show you first`, `The last thing that made ${obj} laugh out loud`]
}
export const THREAD_WHY = [
  'Specific and warm. An easy first question.',
  'Shared ground, so you both have something to say.',
  'Light. Good for a second message.',
  'Playful. Save it for when things feel easy.',
]

const PROMPTS: Record<string, string> = {
  ceramics: 'What’s something you made with your hands that you’re secretly proud of?',
  architecture: 'Which building in the city would you live in, if you could pick any?',
  cooking: 'What do you cook when you want someone to stay a little longer?',
  'long walks': 'Describe your best walk in the city, start to finish.',
  film: 'What film did you see at the wrong age and still think about?',
  jazz: 'What record would you put on to change the mood of a room?',
  music: 'What song do you know every word to and won’t admit it?',
  museums: 'Which room in which museum would you take someone to first?',
  food: 'Best thing you ate this year, and who were you with?',
  design: 'What everyday object do you think is perfectly designed?',
  travel: 'Where did you go on a whim, and was it worth it?',
  writing: 'What’s a sentence you wish you had written?',
  markets: 'What’s the first stall you visit at a market?',
  cycling: 'Where’s the best place in the city to ride with no plan?',
}
const GENERIC_PROMPTS = ['What did you want to be when you were eleven?', 'What small thing reliably makes your week?', 'If tomorrow were free, how would you spend it?']
export function promptsFor(mine: string[], theirs: string[]) {
  const shared = mine.filter(i => theirs.includes(i) && PROMPTS[i])
  return [...shared.map(i => ({ text: PROMPTS[i], why: `You both like ${i}` })), ...GENERIC_PROMPTS.map(text => ({ text, why: 'An easy one' }))]
}

export function closingNotes(first: string) {
  return {
    warm: `${first}, I’ve really enjoyed talking with you, and I wanted to be honest rather than drift. I don’t think we’re the right match, but I hope the next person across the table from you knows how lucky they are.`,
    brief: `${first}, thank you for the conversation. I don’t feel the spark I was hoping for, so I’m closing this kindly. Wishing you a good one.`,
    honest: `${first}, I’ve realized I’m looking for something a little different, and you deserve a clear answer rather than a slow fade. Thank you for being so easy to talk to.`,
  }
}
