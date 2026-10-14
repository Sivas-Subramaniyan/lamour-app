// Western (Pythagorean) numerology. House conventions, documented in-app under "How Resonance works":
// - Life Path uses the component method: reduce month, day, year separately (keeping 11/22/33), sum, reduce.
// - Y counts as a vowel only when no vowel sits next to it (Mary, Lynn) and as a consonant otherwise (Ananya).
// - Master numbers 11/22/33 are kept; for pair lookups they map to 2/4/6 with an "intensity" flag.
// - Karmic debt = 13/14/16/19 appearing as a compound total on the way to a core number.

export type Num = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33

const MASTERS = new Set([11, 22, 33])
const KARMIC = new Set([13, 14, 16, 19])
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

const digitSum = (n: number) => String(n).split('').reduce((s, d) => s + Number(d), 0)

/** Reduce to a single digit, optionally stopping at 11/22/33. Returns the chain of totals for karmic-debt checks. */
export function reduceChain(n: number, keepMaster = true): number[] {
  const chain = [n]
  while (n > 9 && !(keepMaster && MASTERS.has(n))) {
    n = digitSum(n)
    chain.push(n)
  }
  return chain
}
export const reduce = (n: number, keepMaster = true) => reduceChain(n, keepMaster).at(-1) as Num

export const letterValue = (c: string) => ((c.toUpperCase().charCodeAt(0) - 65) % 9) + 1

function letters(name: string) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, '').split(/\s+/).filter(Boolean)
}

function isVowelAt(word: string, i: number) {
  const c = word[i]
  if (VOWELS.has(c)) return true
  if (c !== 'Y') return false
  return !VOWELS.has(word[i - 1] ?? '') && !VOWELS.has(word[i + 1] ?? '')
}

function nameTotal(name: string, pick: 'all' | 'vowels' | 'consonants') {
  let total = 0
  for (const w of letters(name))
    for (let i = 0; i < w.length; i++) {
      const v = isVowelAt(w, i)
      if (pick === 'all' || (pick === 'vowels') === v) total += letterValue(w[i])
    }
  return total
}

export function parseDob(dob: string) {
  const [y, m, d] = dob.split('-').map(Number)
  return { y, m, d }
}

export type Chart = {
  lifePath: Num
  expression: Num
  soulUrge: Num
  personality: Num
  birthday: Num
  maturity: Num
  personalYear: Num
  karmic: { number: number; on: string }[]
}

export function chart(birthName: string, dob: string, year = 2026): Chart {
  const { y, m, d } = parseDob(dob)
  const karmic: Chart['karmic'] = []
  const track = (on: string, chain: number[]) => chain.forEach(n => KARMIC.has(n) && karmic.push({ number: n, on }))

  const lpTotal = reduce(m) + reduce(d) + reduce(y)
  const lpChain = reduceChain(lpTotal)
  track('Life Path', lpChain)
  const exChain = reduceChain(nameTotal(birthName, 'all'))
  track('Expression', exChain)
  const suChain = reduceChain(nameTotal(birthName, 'vowels'))
  track('Soul Urge', suChain)
  const peChain = reduceChain(nameTotal(birthName, 'consonants'))
  track('Personality', peChain)
  const bdChain = reduceChain(d)
  track('Birthday', bdChain)

  const lifePath = lpChain.at(-1) as Num
  const expression = exChain.at(-1) as Num
  return {
    lifePath,
    expression,
    soulUrge: suChain.at(-1) as Num,
    personality: peChain.at(-1) as Num,
    birthday: bdChain.at(-1) as Num,
    maturity: reduce(lifePath + expression),
    personalYear: reduce(reduce(m, false) + reduce(d, false) + reduce(year, false), false),
    karmic,
  }
}

/** The worked steps, for the "watch it add up" reveal. */
export function lifePathSteps(dob: string) {
  const { y, m, d } = parseDob(dob)
  const rm = reduce(m), rd = reduce(d), ry = reduce(y)
  const total = rm + rd + ry
  return { m, d, y, rm, rd, ry, total, chain: reduceChain(total) }
}

export const ARCHETYPE: Record<Num, { name: string; line: string; inLove: string }> = {
  1: { name: 'The Pioneer', line: 'Self-starting, direct, happiest when building something that is theirs.', inLove: 'Loves with initiative. Needs a partner who doesn’t need them to slow down.' },
  2: { name: 'The Diplomat', line: 'Tuned to other people, patient, quietly perceptive.', inLove: 'Loves through attunement. Needs gentleness to be returned, not assumed.' },
  3: { name: 'The Creator', line: 'Expressive, social, restless when life gets too scripted.', inLove: 'Loves out loud. Needs room to play and someone who laughs easily.' },
  4: { name: 'The Builder', line: 'Steady, practical, trusts what can be relied on.', inLove: 'Loves through consistency. Needs plans kept and promises small enough to keep.' },
  5: { name: 'The Adventurer', line: 'Curious, mobile, allergic to routine for its own sake.', inLove: 'Loves through shared discovery. Needs freedom that isn’t read as distance.' },
  6: { name: 'The Nurturer', line: 'Warm, responsible, makes a home wherever they are.', inLove: 'Loves through care. Needs to be cared for back, not only relied on.' },
  7: { name: 'The Seeker', line: 'Thoughtful, private, drawn to what is underneath things.', inLove: 'Loves slowly and deeply. Needs quiet that isn’t mistaken for coldness.' },
  8: { name: 'The Executive', line: 'Ambitious, capable, at ease with responsibility and scale.', inLove: 'Loves through providing and protecting. Needs an equal, not an audience.' },
  9: { name: 'The Humanitarian', line: 'Generous, idealistic, thinks in terms of the bigger picture.', inLove: 'Loves with open hands. Needs a partner who shares a sense of purpose.' },
  11: { name: 'The Intuitive', line: 'A heightened 2: perceptive, inspired, sometimes overwhelmed by feeling.', inLove: 'Loves with unusual sensitivity. Needs calm, and someone who takes intuition seriously.' },
  22: { name: 'The Master Builder', line: 'A heightened 4: visionary plans with the patience to finish them.', inLove: 'Loves through building a shared life. Needs a partner who believes in the long game.' },
  33: { name: 'The Master Teacher', line: 'A heightened 6: devoted, nurturing, generous to a fault.', inLove: 'Loves through devotion. Needs to be allowed to receive.' },
}

export const COUPLE_NUMBER: Record<Num, string> = {
  1: 'A couple that starts things. Shared projects keep you close.',
  2: 'A couple of partnership itself. Your strength is the quiet back-and-forth.',
  3: 'A couple that plays. Keep the jokes, the dinners, the long talks going.',
  4: 'A couple that builds. Routines become rituals between you.',
  5: 'A couple that moves. Travel and novelty are your glue.',
  6: 'A couple that makes home. Care is your shared language.',
  7: 'A couple that goes deep. Protect your slow, private time.',
  8: 'A couple with ambition. You push each other further.',
  9: 'A couple with a cause. You are at your best giving outward.',
  11: 'A high-voltage pairing. Intuition runs strong between you.',
  22: 'A high-voltage pairing. Big plans, if you build them together.',
  33: 'A high-voltage pairing. Generous, devoted, a lot to hold.',
}

// House Life Path table (Western triads {1,5,7} {2,4,8} {3,6,9} + common cross-pairs). Symmetric.
type Rel = 'N' | 'C' | '~' | 'X' | 'M'
const LP_TABLE: Rel[][] = [
  ['M', '~', 'C', 'X', 'N', 'X', 'N', 'X', 'C'],
  ['~', 'M', 'C', 'N', 'X', 'C', 'X', 'N', 'C'],
  ['C', 'C', 'M', 'X', 'C', 'N', 'X', '~', 'N'],
  ['X', 'N', 'X', 'M', 'X', 'C', 'C', 'N', 'X'],
  ['N', 'X', 'C', 'X', 'M', 'X', 'N', '~', 'C'],
  ['X', 'C', 'N', 'C', 'X', 'M', 'X', 'C', 'N'],
  ['N', 'X', 'X', 'C', 'N', 'X', 'M', 'X', '~'],
  ['X', 'N', '~', 'N', '~', 'C', 'X', 'M', '~'],
  ['C', 'C', 'N', 'X', 'C', 'N', '~', '~', 'M'],
]
const REL_META: Record<Rel, { label: string; score: number }> = {
  N: { label: 'Natural', score: 85 },
  C: { label: 'Compatible', score: 72 },
  M: { label: 'Mirror', score: 70 },
  '~': { label: 'Neutral', score: 60 },
  X: { label: 'Challenging', score: 45 },
}
const base = (n: Num) => (n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n) as number

export function resonance(a: Num, b: Num) {
  const rel = LP_TABLE[base(a) - 1][base(b) - 1]
  const couple = reduce(a + b)
  return {
    relation: REL_META[rel].label,
    score: REL_META[rel].score,
    highVoltage: MASTERS.has(a) && MASTERS.has(b),
    couple,
    coupleLine: COUPLE_NUMBER[couple],
  }
}
