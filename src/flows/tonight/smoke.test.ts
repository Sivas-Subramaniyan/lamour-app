// Temporary SSR smoke test: renders every Tonight screen across states to catch runtime errors. Run: npx tsx src/flows/tonight/smoke.test.ts
const g = globalThis as any
g.window = g
g.localStorage = { getItem: () => null, setItem: () => {} }
g.location = { hash: '' }
g.history = { replaceState: () => {} }
g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
g.addEventListener = () => {}
g.removeEventListener = () => {}

const { createElement: h } = await import('react')
const { renderToString } = await import('react-dom/server')
const store = await import('../../state/store')
const ui = await import('../../design/ui')
const navMod = await import('../../shell/nav')
const { Dusk } = await import('./Dusk')
const { Letter } = await import('./Letter')
const { Deck } = await import('./Deck')
const { Dossier, Briefing } = await import('./Dossier')
const { Why, Blueprint, Resonance } = await import('./Why')
const { Decide, Introduced } = await import('./Decide')

const screens: [string, any][] = [['dusk', Dusk], ['letter', Letter], ['deck', Deck], ['dossier', Dossier], ['briefing', Briefing], ['why', Why], ['blueprint', Blueprint], ['resonance', Resonance], ['decide', Decide], ['introduced', Introduced]]

type S = ReturnType<typeof store.initialState>
const variants: [string, (s: S) => S][] = [
  ['default', s => s],
  ['dusk+opened', s => ({ ...store.goToPhase(s, 'dusk'), tonight: { ...s.tonight, letterOpened: true } })],
  ['soiree', s => ({ ...s, me: { ...s.me, tier: 'soiree' } })],
  ['numbers off', s => ({ ...s, me: { ...s.me, resonance: 'off' } })],
  ['decided+introduced', s => store.introduce(store.decide(store.decide(s, s.tonight.ids[0], 'lean', ['Note on “A Sunday, ideally”: Same.']), s.tonight.ids[1], 'hold'), s.tonight.ids[0])],
  ['table full', s => store.introduce(s, s.tonight.ids[1])],
  ['date-night', s => store.goToPhase(s, 'date-night')],
]

let fails = 0
for (const seeking of ['men', 'women', 'everyone'] as const) {
  for (const [vname, fn] of variants) {
    const st = fn(store.initialState(seeking))
    g.localStorage.getItem = () => JSON.stringify(st)
    for (const [name, C] of screens) {
      for (const params of [{}, { id: st.tonight.ids[1] }, { id: st.tonight.ids[2], choice: 'lean' }]) {
        try {
          const html = renderToString(h(store.AppProvider, null, h(navMod.NavProvider, null, h(ui.FeedbackProvider, null, h(C, { params })))))
          if (/undefined|NaN|\[object Object\]/.test(html.replace(/<[^>]+>/g, ' '))) { console.log('SUSPECT', seeking, vname, name, JSON.stringify(params), html.replace(/<[^>]+>/g, ' ').match(/.{0,60}(undefined|NaN|\[object Object\]).{0,60}/)?.[0]); fails++ }
        } catch (e: any) { fails++; console.log('FAIL', seeking, vname, name, JSON.stringify(params), e.message) }
      }
    }
  }
}
console.log(fails ? `${fails} problems` : 'all screens rendered')
