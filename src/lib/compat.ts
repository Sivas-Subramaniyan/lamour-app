// L'Amour Compatibility Index (LCI), v0 priors from the research brief. Shown as bands, never percentages.
// Resonance (numerology) is deliberately outside the LCI; it only nudges the user's own ranking if they opt in.

export const VALUE_NAMES = [
  'Self-direction', 'Stimulation', 'Pleasure', 'Achievement', 'Power',
  'Security', 'Conformity', 'Tradition', 'Kindness', 'Universalism',
] as const

export type Lifestyle = {
  kids: 'want' | 'open' | 'dont' | 'have'
  drinks: 'never' | 'socially' | 'often'
  smokes: boolean
  faith: 0 | 1 | 2 | 3 // how central faith/practice is
  relocate: 'yes' | 'maybe' | 'no'
}

export type Traits = {
  values: number[] // 10 Schwartz values, 1–6
  anxiety: number // attachment anxiety 1–7
  avoidance: number // attachment avoidance 1–7
  extraversion: number // 0–1
  openness: number // 0–1
  conflict: 'pursue' | 'withdraw' | 'balanced'
  replyMins: number // typical reply latency
  msgLen: 1 | 2 | 3 // short / medium / long
  humour: number // 0–1 playful register
  lifestyle: Lifestyle
  interests: string[] // tags used by revealed preferences
}

export type Dimension = 'values' | 'revealed' | 'security' | 'lifestyle' | 'rhythm'
export type Band = 'Strong' | 'Promising' | 'Exploratory'

export const DIMENSION_META: Record<Dimension, { label: string; weight: number; source: string }> = {
  values: { label: 'Values & life design', weight: 0.35, source: 'From your values chapter' },
  revealed: { label: 'Who you say yes to', weight: 0.25, source: 'From your choices on L’Amour' },
  security: { label: 'How you love under stress', weight: 0.2, source: 'From “Love so far”' },
  lifestyle: { label: 'Social energy & curiosity', weight: 0.1, source: 'From your conversation with Aura' },
  rhythm: { label: 'Communication rhythm', weight: 0.1, source: 'From how you both message' },
}

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n))

function centredCosine(a: number[], b: number[]) {
  const ma = a.reduce((s, x) => s + x, 0) / a.length
  const mb = b.reduce((s, x) => s + x, 0) / b.length
  let dot = 0, na = 0, nb = 0
  a.forEach((x, i) => {
    const xa = x - ma, xb = b[i] - mb
    dot += xa * xb; na += xa * xa; nb += xb * xb
  })
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

export function topValues(t: Traits, n = 2) {
  return t.values.map((v, i) => ({ v, name: VALUE_NAMES[i] })).sort((x, y) => y.v - x.v).slice(0, n).map(x => x.name)
}

function lifeDesign(a: Lifestyle, b: Lifestyle) {
  const issues: string[] = []
  let pen = 0
  if ((a.kids === 'want' && b.kids === 'dont') || (a.kids === 'dont' && b.kids === 'want')) { pen += 0.5; issues.push('kids') }
  if (Math.abs(['never', 'socially', 'often'].indexOf(a.drinks) - ['never', 'socially', 'often'].indexOf(b.drinks)) === 2) { pen += 0.2; issues.push('drinking') }
  if (a.smokes !== b.smokes) { pen += 0.15; issues.push('smoking') }
  if (Math.abs(a.faith - b.faith) >= 2) { pen += 0.2; issues.push('faith') }
  if ((a.relocate === 'no' && b.relocate === 'yes') || (a.relocate === 'yes' && b.relocate === 'no')) { pen += 0.1; issues.push('where to live') }
  return { score: clamp(1 - pen), issues }
}

export type Reason = { dimension: Dimension; title: string; line: string; source: string }
export type Effort = { dimension: Dimension; title: string; line: string; tip: string }

export type Fit = {
  lci: number
  band: Band
  confidence: number
  scores: Record<Dimension, number>
  reasons: Reason[]
  efforts: Effort[]
}

export type Learned = { likes: string[]; avoids: string[]; interactions: number }

/** me/them traits, how complete my profile is (0–1), and what Aura has learned from my behaviour. */
export function fit(me: Traits, them: Traits, completeness: number, learned: Learned, names = { them: 'they' }): Fit {
  const ld = lifeDesign(me.lifestyle, them.lifestyle)
  const values = clamp(0.6 * ((centredCosine(me.values, them.values) + 1) / 2) + 0.4 * ld.score)

  const hits = them.interests.filter(i => learned.likes.includes(i)).length
  const misses = them.interests.filter(i => learned.avoids.includes(i)).length
  const revealed = clamp(0.5 + 0.15 * hits - 0.2 * misses)
  const revealedWeight = 0.25 * clamp(learned.interactions / 30)

  const secure = (t: Traits) => t.anxiety < 3.5 && t.avoidance < 3.5
  let security = 1
  ;[me, them].forEach(t => { if (t.avoidance > 4.5) security -= 0.22 * ((t.avoidance - 4.5) / 2.5 + 0.5) })
  const anxAvoid = (x: Traits, y: Traits) => x.anxiety > 4.5 && y.avoidance > 4.5
  if (anxAvoid(me, them) || anxAvoid(them, me)) security -= 0.15
  const pursueWithdraw = (me.conflict === 'pursue' && them.conflict === 'withdraw') || (me.conflict === 'withdraw' && them.conflict === 'pursue')
  if (pursueWithdraw) security -= 0.12
  if (secure(me) || secure(them)) security += 0.08
  security = clamp(security)

  const lifestyle = clamp(1 - (Math.abs(me.extraversion - them.extraversion) + Math.abs(me.openness - them.openness)) / 2)

  const lat = Math.abs(Math.log10(me.replyMins + 1) - Math.log10(them.replyMins + 1)) / 3
  const rhythm = clamp(1 - (lat + Math.abs(me.msgLen - them.msgLen) / 4 + Math.abs(me.humour - them.humour) / 2) / 1.5)

  const scores: Record<Dimension, number> = { values, revealed, security, lifestyle, rhythm }
  const weights: Record<Dimension, number> = {
    values: 0.35, revealed: revealedWeight, security: 0.2, lifestyle: 0.1, rhythm: 0.1,
  }
  const wsum = Object.values(weights).reduce((s, w) => s + w, 0)
  const lci = (Object.keys(scores) as Dimension[]).reduce((s, k) => s + weights[k] * scores[k], 0) / wsum

  const confidence = clamp(0.25 + 0.55 * completeness + 0.2 * clamp(learned.interactions / 30))
  const band: Band = lci >= 0.75 && confidence >= 0.6 ? 'Strong' : lci >= 0.62 ? 'Promising' : 'Exploratory'

  const shared = topValues(me, 3).filter(v => topValues(them, 3).includes(v))
  const commonInterests = me.interests.filter(i => them.interests.includes(i))
  const t = names.them

  const reasonFor: Record<Dimension, () => Reason> = {
    values: () => ({
      dimension: 'values',
      title: shared.length ? `You both put ${shared.slice(0, 2).join(' and ')} first` : 'Your life plans line up',
      line: ld.issues.length
        ? `Most of what you want from a life overlaps. The one open question is ${ld.issues[0]}.`
        : 'Kids, home, faith, drinking: nothing on your non-negotiables list clashes.',
      source: DIMENSION_META.values.source,
    }),
    revealed: () => ({
      dimension: 'revealed',
      title: 'Close to the people you’ve said yes to',
      line: hits ? `${hits} things ${t} loves are things you keep choosing.` : 'A little outside your usual. Aura thinks that is worth a look.',
      source: DIMENSION_META.revealed.source,
    }),
    security: () => ({
      dimension: 'security',
      title: 'You steady each other',
      line: secure(me) || secure(them)
        ? 'At least one of you stays calm when things wobble. That buffers the hard weeks.'
        : 'You both reach for closeness in similar ways under stress.',
      source: DIMENSION_META.security.source,
    }),
    lifestyle: () => ({
      dimension: 'lifestyle',
      title: commonInterests.length ? `${commonInterests[0][0].toUpperCase()}${commonInterests[0].slice(1)}, for a start` : 'Similar social batteries',
      line: me.extraversion > 0.55 && them.extraversion > 0.55
        ? 'You both recharge around people, so plans won’t feel like a negotiation.'
        : 'You both value slow evenings and small rooms over big nights out.',
      source: DIMENSION_META.lifestyle.source,
    }),
    rhythm: () => ({
      dimension: 'rhythm',
      title: 'You text the same way',
      line: me.replyMins < 60 && them.replyMins < 60 ? 'Quick, warm replies on both sides. No one will be left wondering.' : 'Neither of you needs instant replies, so silence won’t read as distance.',
      source: DIMENSION_META.rhythm.source,
    }),
  }

  const effortFor: Record<Dimension, () => Effort> = {
    values: () => ({
      dimension: 'values',
      title: ld.issues.length ? `Talk about ${ld.issues[0]} early` : 'Different priorities in the long run',
      line: ld.issues.length ? `Your answers on ${ld.issues[0]} point in different directions.` : 'What each of you would sacrifice for is not quite the same.',
      tip: 'Raise it by the second date, gently and as a question rather than a test.',
    }),
    revealed: () => ({
      dimension: 'revealed',
      title: 'Not your usual type',
      line: `${t} is different from the people you’ve said yes to lately.`,
      tip: 'Give it one real conversation before you decide.',
    }),
    security: () => ({
      dimension: 'security',
      title: 'Different moves under stress',
      line: pursueWithdraw ? 'When things get tense, one of you moves toward, the other steps back to think.' : 'You need reassurance at different speeds.',
      tip: 'Agree on a pause word: “I need an hour, then I’m back.” Then keep the promise.',
    }),
    lifestyle: () => ({
      dimension: 'lifestyle',
      title: 'Different social batteries',
      line: 'One of you recharges with people, the other alone.',
      tip: 'Protect one slow evening a week. Plan the big nights together.',
    }),
    rhythm: () => ({
      dimension: 'rhythm',
      title: 'Different texting tempos',
      line: 'Reply times and message lengths differ between you.',
      tip: 'Say how you text up front. It saves a week of misreading.',
    }),
  }

  const dims = (Object.keys(scores) as Dimension[]).filter(d => weights[d] > 0)
  const contrib = (d: Dimension) => weights[d] * (scores[d] - 0.6)
  const reasons = [...dims].sort((a, b) => contrib(b) - contrib(a)).slice(0, 3).map(d => reasonFor[d]())
  const efforts = [...dims].sort((a, b) => scores[a] - scores[b]).filter(d => scores[d] < 0.8).slice(0, 2).map(d => effortFor[d]())

  return { lci, band, confidence, scores, reasons, efforts }
}

export const BAND_COPY: Record<Band, string> = {
  Strong: 'A strong fit on the things that last.',
  Promising: 'Promising, with a couple of things to talk about.',
  Exploratory: 'Exploratory. Different in ways that could be good.',
}

export const HONESTY_LINE = 'Chemistry can’t be computed. The date will tell you more than we can.'
