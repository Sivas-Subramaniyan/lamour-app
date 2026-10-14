// npx tsx src/flows/conversation/conv.test.ts — checks Aura's intent routing and chapter finishing.
import assert from 'node:assert/strict'
import { initialState, goToPhase, PHASE_TIME } from '../../state/store'
import { answerFor, finishChapter, pickChapter, SCRIPTS } from './script'

const s = initialState()
const now = new Date(PHASE_TIME.afternoon)
const to = (q: string, st = s) => answerFor(st, q, now).actions.map(a => a.to ?? a.tab)

// every chapter: five turns, three open (so 2–3 heard cards), the rest scored
for (const [id, turns] of Object.entries(SCRIPTS)) {
  assert.equal(turns.length, 5, id)
  assert.equal(turns.filter(t => t.kind === 'open').length, 3, id)
}

assert.deepEqual(to('why kabir'), ['tonight'], 'before dusk the letter comes first')
const dusk = { ...goToPhase(s, 'dusk'), tonight: { ...s.tonight, letterOpened: true } }
assert.deepEqual(to('Why Marcus?', dusk), ['tonight/why'])
assert.match(answerFor(dusk, 'why marcus', now).text, /^Marcus is a /)
assert.deepEqual(to('Plan Friday'), ['dates/prefs'])
assert.match(answerFor(s, 'plan friday', now).text, /Tomás/)
assert.deepEqual(to('what have you learned about me'), ['you/noticed', 'conv/heard'])
assert.deepEqual(to('continue my chapter')[0], 'conv/chamber')
assert.deepEqual(to('when is saturday'), ['dates/pass'])
assert.deepEqual(to('my turn?'), ['conn/chat', 'conn/bridge'])
assert.deepEqual(to('tell me a joke'), [])
assert.ok(answerFor(s, 'tell me a joke', now).tries?.length)

assert.equal(pickChapter(s, {}), 'care')
const done = finishChapter(s, 'care', { 0: 'My sister brought soup.', 1: 7, 2: '', 3: 1 })
assert.equal(done.chapters.care, 'done')
const cards = done.heard.filter(h => h.chapter === 'care')
assert.equal(cards.length, 2, 'skipped answers make no card; unanswered ones use the sample')
assert.ok(cards.every(c => c.status === 'pending'))
assert.ok(done.me.traits.avoidance > s.me.traits.avoidance, 'avoidant answers nudge the estimate up')

console.log('conversation checks passed')
