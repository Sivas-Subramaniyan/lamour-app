// Words for the First Conversation: the chapter scripts Aura reads, and the few things Aura's home understands.
// Validated items are quoted verbatim from a published attachment scale (ECR-R) so they can be scored; house items are ours.
import { CHAPTERS, SUNSET, connection, fitWith, fmtLeft, fmtTime, isDusk, leadId, planWith, type ChapterId, type HeardCard, type State } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { venue } from '../../data/venues'
import type { ScreenId, TabName } from '../../shell/screens'

export type OpenTurn = { kind: 'open'; ask: string; sample: string; infer: string; said?: boolean }
export type ScaleTurn = { kind: 'scale'; ask: string; item: string; validated?: boolean; trait?: 'anxiety' | 'avoidance'; reverse?: boolean }
export type Turn = OpenTurn | ScaleTurn
export type TalkChapter = Exclude<ChapterId, 'numbers'>

export const SCALE_LABELS = ['Disagree strongly', 'Disagree', 'Disagree a little', 'Neither', 'Agree a little', 'Agree', 'Agree strongly']

const RATE = 'One to rate. I’ll read it exactly as written.'
const RATE2 = 'And another, word for word.'
const HOUSE = 'A quick one. Answer on instinct.'
const open = (ask: string, sample: string, infer: string, said = false): OpenTurn => ({ kind: 'open', ask, sample, infer, said })
const house = (item: string, ask = HOUSE): ScaleTurn => ({ kind: 'scale', ask, item })
const ecr = (item: string, trait: 'anxiety' | 'avoidance', reverse = false, ask = RATE): ScaleTurn => ({ kind: 'scale', ask, item, validated: true, trait, reverse })

export const SCRIPTS: Record<TalkChapter, Turn[]> = {
  story: [
    open('Let’s start wherever you like. Where did you grow up, and what did it smell like?', 'Edison, New Jersey. Cardamom, cut grass, and my dad’s car air freshener.', 'Home, for you, lives in small and specific details.'),
    house('I’d rather do one thing well than many things quickly.'),
    open('What do you make, and why that?', 'Bowls, mostly. I like that clay remembers every mistake and forgives most of them.', 'You value craft and patience over speed.', true),
    house('I’m more at home in a project than at a party.', 'One more, on instinct.'),
    open('What are you quietly proud of?', 'A glaze I found by accident. It’s the color of a peach at 6 PM.', 'You’re proudest of what you found by paying attention.'),
  ],
  people: [
    open('Who are your people? Tell me about one of them.', 'My sister. She’s three years older and still checks whether I’ve eaten.', 'Family is close, and care runs both ways.', true),
    house('After a big party, I need a quiet day to recover.'),
    open('Describe a perfect Friday night with friends.', 'Four friends, one long table, too much food. Someone always stays late to do the dishes.', 'Small gatherings recharge you; big parties drain you.'),
    house('Among my friends, I’m usually the one who makes the plan.', 'One more, on instinct.'),
    open('How would a partner fit in with your people?', 'Come to one dinner, ask my sister one real question, and you’re in.', 'With your people, the bar is warmth, not polish.'),
  ],
  life: [
    open('Picture an ordinary Tuesday five years from now. Where are you?', 'A small house with a studio out back, close enough to get into the city in an hour.', 'You want room to make things, within reach of the city.'),
    house('I’d move cities for the right person.'),
    open('How do you feel about children?', 'I want them. Not tomorrow, but I want them.', 'You want children, without a rush.', true),
    house('Faith or practice is a central part of my life.', 'One more, on instinct.'),
    open('What would you never compromise on?', 'Kindness to waiters. And time to make things.', 'Everyday kindness and time for your craft are non-negotiable.'),
  ],
  love: [
    open('What’s one thing your last relationship taught you?', 'That I can’t be the only one who notices the small things. I need someone who notices too.', 'Being noticed in small ways matters to you as much as grand gestures.'),
    ecr('I’m afraid that I will lose my partner’s love.', 'anxiety'),
    open('When did you feel most like yourself with someone?', 'A long drive upstate, talking about nothing for four hours. I wasn’t performing at all.', 'You feel closest when there’s no audience and no agenda.'),
    ecr('I rarely worry about my partner leaving me.', 'anxiety', true, RATE2),
    open('What would you do differently next time?', 'Say what I need sooner, instead of hoping they’ll guess.', 'You’re learning to ask for what you need out loud.', true),
  ],
  hard: [
    open('Think of your last real disagreement. What happened in the first hour?', 'I wanted to talk it through right away. They went for a walk. I took it personally, and then they came back with tea.', 'In conflict you move toward; space can feel like distance to you.'),
    ecr('I talk things over with my partner.', 'avoidance', true),
    open('What helps you come back after a hard conversation?', 'Something small. A text that says we’re fine, or a hand on my back.', 'Small signs of repair settle you faster than long talks.'),
    ecr('I worry a lot about my relationships.', 'anxiety', false, RATE2),
    open('Is there anything you’d want a partner never to do in an argument?', 'Go silent for days. An hour is fine. Days is not.', 'Short pauses are fine with you; long silences are not.', true),
  ],
  care: [
    open('Tell me about the last time someone looked after you well.', 'When I had the flu last winter, my sister turned up with soup and didn’t ask what I needed. She just read on the couch while I slept.', 'Care, for you, is someone turning up without being asked.'),
    ecr('I prefer not to show a partner how I feel deep down.', 'avoidance'),
    open('And how do you look after someone you love? What do you actually do?', 'I cook. If I’m worried about you, there’s a pot of dal on your stove by Thursday.', 'You show love through what you do: often food, often unannounced.'),
    ecr('It helps to turn to my romantic partner in times of need.', 'avoidance', true, RATE2),
    open('Is there a small ritual you’d want to keep with someone?', 'Sunday mornings. Coffee, the paper, no phones until noon.', 'A protected slow morning matters more to you than a big night out.', true),
  ],
}

// ---------- finishing a chapter ----------

export type Answers = Record<number, string | number>
// ponytail: answers in progress live in memory so voice and text can hand a chapter back and forth; a reload keeps only the question number.
export const DRAFTS: Partial<Record<TalkChapter, Answers>> = {}

export function pickChapter(s: State, params: Record<string, any>): TalkChapter {
  if (params.chapter && params.chapter in SCRIPTS) return params.chapter
  return (CHAPTERS.find(c => c.id !== 'numbers' && s.chapters[c.id] === 'todo')?.id ?? 'care') as TalkChapter
}

const clip = (x: string) => (x.length <= 150 ? x : `${x.slice(0, x.lastIndexOf(' ', 146))}…`)
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Finishing a chapter: mark it done, hand back what Aura heard (pending your say), and let the validated items gently move the estimates. */
export function finishChapter(s: State, ch: TalkChapter, answers: Answers): State {
  const script = SCRIPTS[ch]
  const cards: HeardCard[] = []
  script.forEach((t, i) => {
    if (t.kind !== 'open' || answers[i] === '') return // skipped: nothing to hear
    const said = typeof answers[i] === 'string' ? (answers[i] as string) : t.sample
    cards.push({ id: `${ch}-${i}`, chapter: ch, quote: `“${clip(said)}”`, inference: t.infer, source: t.said ? 'You said' : 'Aura inferred', status: 'pending' })
  })
  const traits = { ...s.me.traits }
  for (const k of ['anxiety', 'avoidance'] as const) {
    const vals = script.flatMap((t, i) => (t.kind === 'scale' && t.trait === k && typeof answers[i] === 'number' ? [t.reverse ? 8 - (answers[i] as number) : (answers[i] as number)] : []))
    if (vals.length) traits[k] = Math.round((traits[k] * 0.7 + avg(vals) * 0.3) * 10) / 10
  }
  const ids = new Set(cards.map(c => c.id))
  const chapterTurn = { ...s.chapterTurn }
  delete chapterTurn[ch]
  return {
    ...s,
    me: { ...s.me, traits },
    chapters: { ...s.chapters, [ch]: 'done' },
    chapterTurn,
    heard: [...s.heard.filter(h => !ids.has(h.id)), ...cards.slice(0, 3)],
  }
}

// ---------- Aura's home: a handful of intents, answered from live state ----------

export type AuraAction = { label: string; to?: ScreenId; params?: Record<string, any>; tab?: TabName; ember?: boolean; preview?: { title: string; points: string[] } }
export type AuraAnswer = { text: string; points?: { title: string; line: string }[]; note?: string; sources: string[]; actions: AuraAction[]; tries?: string[] }

const norm = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const says = (q: string, ...w: string[]) => w.some(x => new RegExp(`\\b${x}`).test(q))
const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1)
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`)
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six']
const DAY: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }

export const yourTurnId = (s: State) => s.connections.find(c => c.yourTurnUntil && (c.stage === 'talking' || c.stage === 'introduced'))?.id
export const activePlan = (s: State) => s.plans.find(p => p.status === 'sealed' || p.status === 'live')
export const nextChapter = (s: State) => CHAPTERS.find(c => c.id !== 'numbers' && s.chapters[c.id] === 'todo')
export const weekday = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long' })

export function tries(s: State) {
  const lead = PERSONAS[leadId(s)].first
  return [isDusk(s) && s.tonight.letterOpened ? `Why ${lead}?` : 'When does my letter arrive?', 'Plan Friday', 'What have you learned about me?']
}

export function answerFor(s: State, raw: string, now: Date): AuraAnswer {
  const q = norm(raw)
  const ids = [...new Set([...s.tonight.ids, ...s.connections.map(c => c.id), ...Object.keys(PERSONAS)])]
  const who = ids.find(id => new RegExp(`\\b${norm(PERSONAS[id].first)}\\b`).test(q))
  const lead = leadId(s)
  const first = (id: string) => PERSONAS[id].first

  if (says(q, 'why')) {
    const id = who ?? lead
    if (s.tonight.ids.includes(id) && !isDusk(s))
      return { text: `Tonight’s letter arrives at dusk, ${SUNSET}. I’d rather you meet them on the page first, then ask me why.`, sources: [], actions: [{ label: 'Open Tonight', tab: 'tonight' }] }
    const f = fitWith(s, id)
    const top = f.reasons.slice(0, 2)
    return {
      text: `${first(id)} is ${f.band === 'Exploratory' ? 'an exploratory' : `a ${f.band.toLowerCase()}`} fit for you. Here is why, in brief.`,
      points: top.map(r => ({ title: r.title, line: r.line })),
      note: f.efforts[0] && `One thing to know: ${lowerFirst(f.efforts[0].line)}`,
      sources: [...new Set(top.map(r => r.source))],
      actions: [{ label: 'Open Why you two', to: 'tonight/why', params: { id } }],
    }
  }

  if (says(q, 'continue', 'chapter', 'conversation', 'question')) {
    const c = nextChapter(s)
    const done = CHAPTERS.filter(x => s.chapters[x.id] === 'done').length
    if (!c && s.chapters.numbers === 'todo')
      return { text: 'Every conversation is done. One optional chapter is left: your numbers, a reflective lens that never changes your band.', sources: [`${done} of 7 chapters`], actions: [{ label: 'See your numbers', to: 'conv/numbers' }] }
    if (!c) return { text: 'You’ve finished every chapter. I know you well, and you can still correct anything I heard.', sources: [], actions: [{ label: 'See your Signature', to: 'conv/signature' }] }
    return {
      text: `Let’s pick up with “${c.title}”. About ${c.mins} minutes, and you can skip anything.`,
      sources: [`${done} of 7 chapters`],
      actions: [
        { label: 'Begin the chapter', to: 'conv/chamber', params: { chapter: c.id }, ember: true, preview: { title: c.title, points: [
          'I’ll listen only while you answer, and the microphone stays off otherwise.',
          'Five questions. A few are read exactly as written so they can be scored.',
          'Hold Off the record at any time. Nothing said while you hold it is kept.',
        ] } },
        { label: 'Write instead', to: 'conv/text', params: { chapter: c.id } },
      ],
    }
  }

  if (says(q, 'learn', 'notice') || q.includes('know about me')) {
    const fresh = s.noticed.filter(n => n.status === 'new')
    const top = fresh[0] ?? s.noticed.find(n => n.status === 'confirmed')
    const confirmed = s.heard.filter(h => h.status === 'confirmed').length
    return {
      text: fresh.length
        ? `I’ve noticed ${NUM[fresh.length] ?? fresh.length} new ${fresh.length === 1 ? 'thing' : 'things'} lately. The clearest: ${lowerFirst(fresh[0].lean)}`
        : top ? `Here’s what I’m surest of: ${lowerFirst(top.lean)}` : 'Nothing new yet. I learn from your choices, and only with your say-so.',
      sources: [top?.from, `${confirmed} things you confirmed`].filter(Boolean) as string[],
      actions: [{ label: 'See what I’ve noticed', to: 'you/noticed' }, { label: 'Here’s what I heard', to: 'conv/heard' }],
    }
  }

  const sealed = (id?: string) => {
    const p = id ? planWith(s, id) : activePlan(s)
    return p && (p.status === 'sealed' || p.status === 'live') ? p : undefined
  }
  const sp = (who ? sealed(who) : undefined) ?? (says(q, 'saturday', 'sealed', 'pass') || q.includes('my date') ? sealed() : undefined)
  if (sp) {
    const o = sp.options[sp.chosen ?? 0]
    const v = venue(o.venueId)
    return {
      text: `${weekday(o.when)} is sealed with ${first(sp.with)}: ${v.name} in ${v.hood}, ${fmtTime(o.when)}. About ${o.minsMe} minutes from you.`,
      sources: ['Sealed by you both'],
      actions: [{ label: 'Open your Date Pass', to: 'dates/pass', params: { id: sp.with } }],
    }
  }

  if (says(q, 'plan', 'date', 'table', 'dinner', 'drinks', 'evening', ...Object.values(DAY).map(d => d.toLowerCase()))) {
    const id = (who && connection(s, who) ? who : undefined) ?? yourTurnId(s) ?? s.connections.find(c => !planWith(s, c.id))?.id ?? lead
    const p = planWith(s, id)
    if (p?.status === 'negotiating')
      return { text: `I’m already working on evenings with ${first(id)}. Three are waiting for you.`, sources: ['From your rules'], actions: [{ label: 'See three evenings', to: 'dates/proposals', params: { id } }] }
    const day = Object.values(DAY).find(d => q.includes(d.toLowerCase()))
    const days = day ?? list(s.prefs.days.map(d => DAY[d] ?? d))
    return {
      text: `${day ? `${day} it is, if it works for you both. ` : ''}Shall I set a table for you and ${first(id)}? I’ll look at ${days} evenings, within your budget and ${s.prefs.travelCap} minutes of each of you.`,
      sources: ['From your rules', `From ${first(id)}’s rules`],
      actions: [{ label: 'Set a table', to: 'dates/prefs', params: { id }, ember: true, preview: { title: `A table with ${first(id)}`, points: [
        `I’ll check ${days} evenings against both your rules.`,
        'I’ll come back with three evenings. Nothing is booked until you both seal.',
        'Venues get first names only, and you’ll see minutes, never addresses.',
      ] } }],
    }
  }

  if (says(q, 'letter', 'tonight', 'dusk', 'introduction', 'when')) {
    if (!isDusk(s)) return { text: `Tonight’s letter arrives at dusk, ${SUNSET}. Until then, there’s nothing you need to do.`, sources: [`Letter No. ${s.tonight.edition}`], actions: [{ label: 'Open Tonight', tab: 'tonight' }] }
    if (!s.tonight.letterOpened) return { text: 'Your letter is here. Break the seal when you’re ready. There’s no rush tonight.', sources: [`Letter No. ${s.tonight.edition}`], actions: [{ label: 'Open your letter', tab: 'tonight' }] }
    return {
      text: `Tonight’s letter holds ${NUM[s.tonight.ids.length] ?? s.tonight.ids.length} introductions. I’d start with ${first(lead)}.`,
      sources: [`Letter No. ${s.tonight.edition}`], actions: [{ label: 'Read the letter', tab: 'tonight' }], tries: [`Why ${first(lead)}?`],
    }
  }

  const tid = (who && connection(s, who)?.yourTurnUntil ? who : undefined) ?? (says(q, 'turn', 'reply', 'message', 'chat', 'text') ? yourTurnId(s) : undefined)
  if (tid) {
    const left = new Date(connection(s, tid)!.yourTurnUntil!).getTime() - now.getTime()
    return {
      text: `It’s your turn with ${first(tid)}. ${fmtLeft(left)} left, and no pressure.`,
      sources: ['Your Turn · 48 hours'],
      actions: [{ label: `Open your chat with ${first(tid)}`, to: 'conn/chat', params: { id: tid } }, { label: 'Your Bridge Brief', to: 'conn/bridge', params: { id: tid } }],
    }
  }

  return { text: 'I can help with introductions, plans, and what I’ve learned. Try one of these.', sources: [], actions: [], tries: tries(s) }
}
