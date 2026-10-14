// Run: npm run check
import assert from 'node:assert/strict'
import { chart, reduce, resonance, lifePathSteps } from './numerology.ts'
import { fit, type Traits } from './compat.ts'

// Worked examples from the research brief.
const ananya = chart('Ananya Rao', '1997-02-14')
assert.equal(ananya.lifePath, 6)
assert.equal(ananya.expression, 9)
assert.equal(ananya.soulUrge, 1)
assert.equal(ananya.personality, 8)
assert.equal(ananya.birthday, 5)
assert.equal(ananya.maturity, 6)
assert.equal(ananya.personalYear, 8)
assert.ok(ananya.karmic.some(k => k.number === 14 && k.on === 'Birthday'))
assert.equal(chart('Kabir Mehta', '1995-09-03').lifePath, 9)
assert.equal(lifePathSteps('1997-02-14').total, 15)

// The tryout bug: 14.10.1997 is Life Path 5, not 7.
assert.equal(chart('Ananya Rao', '1997-10-14').lifePath, 5)

// Masters kept, Y-as-vowel heuristic.
assert.equal(reduce(29), 11)
assert.equal(reduce(29, false), 2)
assert.equal(chart('Mary', '2000-01-01').soulUrge, 8) // A(1) + Y(7) — Y counts, no vowel neighbour

// Resonance: 6 and 9 share the 3-6-9 triad.
const r = resonance(6, 9)
assert.equal(r.relation, 'Natural')
assert.equal(r.couple, 6)

// LCI bands.
const base: Traits = {
  values: [5, 4, 3, 4, 2, 4, 3, 3, 6, 5], anxiety: 2.5, avoidance: 2.2, extraversion: 0.5, openness: 0.8,
  conflict: 'balanced', replyMins: 30, msgLen: 2, humour: 0.7,
  lifestyle: { kids: 'want', drinks: 'socially', smokes: false, faith: 1, relocate: 'maybe' }, interests: ['ceramics', 'jazz'],
}
const twin = fit(base, { ...base }, 1, { likes: [], avoids: [], interactions: 0 })
assert.equal(twin.band, 'Strong')
assert.equal(twin.reasons.length, 3)
const opposite = fit(base, {
  ...base, values: [2, 2, 5, 6, 6, 4, 5, 5, 2, 1], avoidance: 6, conflict: 'withdraw', extraversion: 0.9, openness: 0.2,
  replyMins: 1440, msgLen: 1, humour: 0.1, lifestyle: { kids: 'dont', drinks: 'never', smokes: true, faith: 3, relocate: 'no' },
}, 1, { likes: [], avoids: [], interactions: 0 })
assert.equal(opposite.band, 'Exploratory')
assert.ok(opposite.efforts.length >= 1)
const lowConfidence = fit(base, { ...base }, 0, { likes: [], avoids: [], interactions: 0 })
assert.notEqual(lowConfidence.band, 'Strong') // great fit, but we don't know you well enough yet

console.log('selfcheck ok')
