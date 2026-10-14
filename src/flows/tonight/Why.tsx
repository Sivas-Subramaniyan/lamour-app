// tonight/why, tonight/blueprint, tonight/resonance: the reasoning, the overlap, and the numbers (kept apart).
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Eyebrow, Section, Portrait, BandMark, Meter, Tag, Sheet, AiBadge, Segmented, ListRow, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { Signature, signatureModes, Lissajous, handshakeRatio } from '../../design/signature'
import { myChart } from '../../state/store'
import { useNav } from '../../shell/nav'
import { BAND_COPY, HONESTY_LINE, DIMENSION_META, topValues, type Dimension, type Traits } from '../../lib/compat'
import { chart, resonance, ARCHETYPE } from '../../lib/numerology'
import { speak, stopSpeaking } from '../../lib/voice'
import { ME_COLOR, THEM_COLOR, CARE_LABELS, usePerson, myCare, Veil, useBack } from './parts'
import type { Persona } from '../../data/personas'

const EASE = [0.22, 1, 0.36, 1] as const
const DIMS = Object.keys(DIMENSION_META) as Dimension[]
const closeness = (v: number) => (v >= 0.9 ? 'Very close' : v >= 0.78 ? 'Close' : v >= 0.62 ? 'Some difference' : 'Worth a talk')
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`)

// Plain words for traits. Bands of words, never numbers.
const social = (e: number) => (e < 0.4 ? 'Small rooms' : e < 0.65 ? 'In between' : 'Full tables')
const curious = (o: number) => (o > 0.82 ? 'Restless for the new' : o > 0.6 ? 'Curious' : 'Fond of the familiar')
const socialPhrase = (e: number) => (e < 0.4 ? 'small rooms' : e < 0.65 ? 'a mix of both' : 'full tables')
const tempo = (m: number) => (m < 20 ? 'Within minutes' : m < 60 ? 'Within the hour' : m < 240 ? 'Within a few hours' : 'Within the day')
const tempoVal = (m: number) => Math.max(0.08, 1 - Math.log10(m + 1) / 3)
const lengthWord = (l: number) => ['Short', 'Medium', 'Long'][l - 1] ?? 'Medium'
const humourWord = (h: number) => (h > 0.75 ? 'Playful' : h > 0.5 ? 'Wry' : 'Earnest')
const STRESS: Record<Traits['conflict'], string> = { pursue: 'move toward', withdraw: 'step back to think', balanced: 'stay level' }

const TIPS: Record<Dimension, string> = {
  values: 'Ask about the life they’re building, not the résumé.',
  revealed: 'Notice what surprises you. That’s usually the interesting part.',
  security: 'Agree early on how you’ll handle a quiet day.',
  lifestyle: 'Plan one evening their way and one yours.',
  rhythm: 'Say how you text up front. It saves a week of misreading.',
}

function explain(d: Dimension, me: Traits, p: Persona, likes: string[], line?: string) {
  const t = p.first, them = p.traits
  switch (d) {
    case 'values': return `Your top three: ${list(topValues(me, 3))}. ${t}’s: ${list(topValues(them, 3))}. ${line ?? ''}`.trim()
    case 'revealed': {
      const hits = them.interests.filter(i => likes.includes(i))
      return hits.length ? `${t} loves ${list(hits)}: things you keep saying yes to.` : `${t} is a little outside the people you’ve said yes to lately. That isn’t a warning, just new ground.`
    }
    case 'security': {
      const steady = [me, them].some(x => x.anxiety < 3.5 && x.avoidance < 3.5)
      const moves = me.conflict === them.conflict ? `Under stress you both ${STRESS[me.conflict]}.` : 'When things get tense, one of you moves toward and the other steps back to think. Neither is wrong; it helps to name it early.'
      return `${moves}${steady ? ' At least one of you stays steady when things wobble, which buffers the hard weeks.' : ''}`
    }
    case 'lifestyle': {
      const [a, b] = [curious(me.openness).toLowerCase(), curious(them.openness).toLowerCase()]
      const energy = socialPhrase(me.extraversion) === socialPhrase(them.extraversion) ? `you both lean toward ${socialPhrase(me.extraversion)}` : `you lean toward ${socialPhrase(me.extraversion)}, ${t} toward ${socialPhrase(them.extraversion)}`
      return `Social energy: ${energy}. Curiosity: ${a === b ? `you’re both ${a}` : `you’re ${a}; ${t} is ${b}`}.`
    }
    case 'rhythm': return `You usually reply ${tempo(me.replyMins).toLowerCase()}; ${t}, ${tempo(them.replyMins).toLowerCase()}. Your messages run ${lengthWord(me.msgLen).toLowerCase()}, ${pronounAdj(p)} run ${lengthWord(them.msgLen).toLowerCase()}.`
  }
}
const pronounAdj = (p: Persona) => (p.pronouns.startsWith('she') ? 'her' : p.pronouns.startsWith('he') ? 'his' : 'their')

const ASK: Record<Dimension, (t: string, likes: string[]) => string> = {
  values: t => `Ask ${t} what an ordinary Tuesday looks like five years from now. Values show up in the ordinary.`,
  revealed: (t, likes) => `You tend to say yes to people into ${list(likes.slice(0, 3))}. ${t} fits some of that, and not all. Give it one real conversation before you decide.`,
  security: t => `Agree on a pause word with ${t} early: “I need an hour, then I’m back.” The promise matters more than the hour.`,
  lifestyle: t => `Protect one slow evening a week. Plan the big nights together, and let ${t} pick one of them.`,
  rhythm: t => `Tell ${t} how you text in the first week. A line like “I reply fast, no pressure to match” saves a lot of guessing.`,
}

// ---------- tonight/why ----------

export function Why({ params }: { params: Record<string, any> }) {
  const { s, id, p, fit } = usePerson(params)
  const nav = useNav()
  const back = useBack()
  const [dim, setDim] = useState<Dimension | null>(null)
  const member = s.me.tier !== 'invitation'
  const cares = [
    ...(p.aura.careNote ? [{ title: 'The honest note', line: p.aura.careNote, tip: '' }] : []),
    ...fit.efforts.map(e => ({ title: e.title, line: e.line, tip: e.tip })),
  ]
  const careView = (c: (typeof cares)[number], i: number) => (
    <div key={i} className="stack gap-4 tn-care">
      <span className="t-callout" style={{ fontWeight: 550 }}>{c.title}</span>
      <span className="t-callout muted pretty">{c.line}</span>
      {c.tip && <span className="row gap-8 t-small" style={{ alignItems: 'flex-start' }}><Icon name="feather" size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span><b style={{ fontWeight: 600 }}>Try:</b> {c.tip}</span></span>}
    </div>
  )

  return (
    <Screen top={<TopBar back onBack={back} />}
      footer={
        <div className="row gap-8">
          <Button kind="soft" size="md" icon="play" onClick={() => nav.push('tonight/briefing', { id })}>Briefing</Button>
          <Button kind="commit" size="md" style={{ flex: 1 }} onClick={() => nav.push('tonight/decide', { id })}>Decide on {p.first}</Button>
        </div>
      }>
      <div style={{ position: 'relative' }}>
        <div className="tn-why-bg" aria-hidden="true"><Portrait photo={p.photos.portrait2 ?? p.photos.portrait} name={p.first} shape="rect" w="100%" h="100%" /></div>
        <div className="pad stack gap-24" style={{ position: 'relative', paddingTop: 96 }}>
          <motion.div className="tn-folio vellum stack gap-20" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <div className="row gap-12">
              <Portrait photo={p.photos.portrait} name={p.first} shape="circle" w={48} h={48} />
              <div className="stack" style={{ gap: 2 }}>
                <Eyebrow>Why you two</Eyebrow>
                <span className="t-head">{s.me.name} and {p.first}</span>
              </div>
            </div>
            <BandMark band={fit.band} confidence={fit.confidence} />
            <p className="t-quote" style={{ margin: 0, fontSize: 20 }}>{BAND_COPY[fit.band]}</p>
            <hr className="hairline" />
            <ol className="tn-reasons">
              {fit.reasons.map((r, i) => (
                <motion.li key={r.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.12, duration: 0.6, ease: EASE }}>
                  <span className="t-num faint" style={{ fontSize: 12 }}>0{i + 1}</span>
                  <div className="stack gap-4 grow">
                    <span className="serif" style={{ fontSize: 21, lineHeight: 1.2 }}>{r.title}</span>
                    <span className="t-callout muted pretty">{r.line}</span>
                    <span style={{ alignSelf: 'flex-start', marginTop: 4 }}><Tag icon="book">{r.source}</Tag></span>
                  </div>
                </motion.li>
              ))}
            </ol>
            <hr className="hairline" />
            <div className="stack gap-16">
              <Eyebrow>Where you’ll need care</Eyebrow>
              {cares.length === 0 && <span className="t-callout muted">Nothing stood out. That’s rare, and it still isn’t a promise.</span>}
              {cares.slice(0, member ? cares.length : 1).map(careView)}
              {!member && cares.length > 1 && (
                <Veil reason="care" title={`${cares.length - 1} more honest note${cares.length > 2 ? 's' : ''} about you and ${p.first}. Soirée members read every one.`}>
                  <div className="stack gap-16">{cares.slice(1).map(careView)}</div>
                </Veil>
              )}
            </div>
            <p className="serif i center muted balance" style={{ margin: 0, fontSize: 18 }}>{HONESTY_LINE}</p>
          </motion.div>

          <Section label="All five, in detail">
            <div className="card card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {DIMS.map(d => (
                <button key={d} className="tn-dim" onClick={() => setDim(d)}>
                  <span className="row between"><span className="t-callout" style={{ fontWeight: 550 }}>{DIMENSION_META[d].label}</span><span className="row gap-4 t-small muted">{closeness(fit.scores[d])}<Icon name="chevron" size={15} /></span></span>
                  <Meter value={fit.scores[d]} color="var(--accent)" />
                </button>
              ))}
            </div>
            <span className="t-small faint">Tap any row to see what it rests on.</span>
          </Section>
        </div>
      </div>

      <DimSheet dim={dim} onClose={() => setDim(null)} params={{ id }} />
    </Screen>
  )
}

function DimSheet({ dim, onClose, params }: { dim: Dimension | null; onClose: () => void; params: Record<string, any> }) {
  const { s, p, fit } = usePerson(params)
  const [asked, setAsked] = useState<'no' | 'typing' | 'yes'>('no')
  const tm = useRef(0)
  useEffect(() => { setAsked('no'); clearTimeout(tm.current); stopSpeaking() }, [dim])
  const d = dim ?? 'values'
  const effort = fit.efforts.find(e => e.dimension === d)
  const reason = fit.reasons.find(r => r.dimension === d)
  const ask = () => {
    setAsked('typing')
    tm.current = window.setTimeout(() => { setAsked('yes'); speak(ASK[d](p.first, s.learned.likes), { voice: s.me.voice, muted: s.settings.auraMuted }) }, 900)
  }
  return (
    <Sheet open={!!dim} onClose={onClose} title={DIMENSION_META[d].label}>
      <div className="stack gap-16" style={{ paddingBottom: 8 }}>
        <div className="stack gap-8">
          <div className="row between t-small"><span className="muted">You and {p.first}</span><span style={{ fontWeight: 600 }}>{closeness(fit.scores[d])}</span></div>
          <Meter value={fit.scores[d]} color="var(--accent)" />
        </div>
        <p className="t-body pretty" style={{ margin: 0 }}>{explain(d, s.me.traits, p, s.learned.likes, reason?.line ?? effort?.line)}</p>
        <div className="card-flat card-pad row gap-12" style={{ padding: 14, alignItems: 'flex-start' }}>
          <Icon name="feather" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span className="t-callout"><b style={{ fontWeight: 600 }}>Try:</b> {effort?.tip ?? TIPS[d]}</span>
        </div>
        <span style={{ alignSelf: 'flex-start' }}><Tag icon="book">{DIMENSION_META[d].source}</Tag></span>
        <AnimatePresence mode="wait">
          {asked === 'no' ? (
            <motion.div key="btn" exit={{ opacity: 0 }}><Button kind="ember" block icon="sparkle" onClick={ask}>Ask Aura</Button></motion.div>
          ) : (
            <motion.div key="ans" className="card card-aura card-pad stack gap-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <AiBadge text="Aura" />
              {asked === 'typing' ? <span className="tn-typing" aria-label="Aura is thinking"><i /><i /><i /></span> : <p className="t-quote pretty" style={{ margin: 0, fontSize: 20 }}>{ASK[d](p.first, s.learned.likes)}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

// ---------- tonight/blueprint ----------

export function Blueprint({ params }: { params: Record<string, any> }) {
  const { s, p } = usePerson(params)
  const back = useBack()
  const [view, setView] = useState<'figure' | 'list'>('figure')
  const me = s.me.traits, them = p.traits
  const care = myCare(s)
  const rows = [
    { label: 'Social energy', a: me.extraversion, b: them.extraversion, wa: social(me.extraversion), wb: social(them.extraversion) },
    { label: 'Curiosity', a: me.openness, b: them.openness, wa: curious(me.openness), wb: curious(them.openness) },
    { label: 'Reply tempo', a: tempoVal(me.replyMins), b: tempoVal(them.replyMins), wa: tempo(me.replyMins), wb: tempo(them.replyMins) },
    { label: 'Message length', a: me.msgLen / 3, b: them.msgLen / 3, wa: lengthWord(me.msgLen), wb: lengthWord(them.msgLen) },
    { label: 'Humour', a: me.humour, b: them.humour, wa: humourWord(me.humour), wb: humourWord(them.humour) },
  ]
  const keys = Object.keys(CARE_LABELS) as (keyof Persona['care'])[]
  const shared = [...keys].sort((x, y) => Math.min(care[y], p.care[y]) - Math.min(care[x], p.care[x]))[0]
  const gap = [...keys].sort((x, y) => Math.abs(care[y] - p.care[y]) - Math.abs(care[x] - p.care[x]))[0]
  const common = me.interests.filter(i => them.interests.includes(i))
  const careWord = (v: number) => (v >= 0.75 ? 'A lot' : v >= 0.5 ? 'Some' : 'A little')

  return (
    <Screen className="tn-ink" top={<TopBar back onBack={back} title="Where you meet" />}>
      <div className="pad stack gap-24">
        <div className="stack gap-8">
          <Eyebrow>Your Signatures, overlaid</Eyebrow>
          <h1 className="t-title" style={{ margin: 0 }}>Where you <span className="i">meet.</span></h1>
        </div>
        <Segmented value={view} onChange={setView} options={[{ value: 'figure', label: 'Figure' }, { value: 'list', label: 'List view' }]} />

        {view === 'figure' ? (
          <motion.div key="fig" className="stack gap-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="stack gap-12" style={{ alignItems: 'center' }}>
              <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
                <div className="tn-glow" style={{ width: 320, height: 320 }} />
                <Signature layers={[{ modes: signatureModes(me), color: ME_COLOR }, { modes: signatureModes(them), color: THEM_COLOR }]} size={280} grains={2200} />
              </div>
              <div className="row gap-20 t-small">
                <span className="row gap-8"><i className="tn-key" style={{ background: ME_COLOR }} />You</span>
                <span className="row gap-8"><i className="tn-key" style={{ background: THEM_COLOR }} />{p.first}</span>
              </div>
              <span className="serif i center muted balance" style={{ fontSize: 18 }}>Where the lines cross, conversation comes easily. Where they don’t, it gets interesting.</span>
            </div>

            <Section label="Side by side">
              <div className="stack gap-20">
                <div className="row between t-label faint"><span>You</span><span>{p.first}</span></div>
                {rows.map((r, i) => (
                  <div key={r.label} className="stack gap-8">
                    <div className="tn-mirror-head t-small"><span className="faint">{r.wa}</span><span style={{ fontWeight: 600 }}>{r.label}</span><span className="faint">{r.wb}</span></div>
                    <div className="tn-mirror">
                      <div className="side l"><motion.i style={{ background: ME_COLOR }} initial={{ width: 0 }} animate={{ width: `${r.a * 100}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: EASE }} /></div>
                      <span className="axis" />
                      <div className="side r"><motion.i style={{ background: THEM_COLOR }} initial={{ width: 0 }} animate={{ width: `${r.b * 100}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: EASE }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section label="How you each feel cared for">
              <div className="stack gap-16">
                {keys.map((k, i) => {
                  const a = care[k] * 100, b = p.care[k] * 100
                  return (
                    <div key={k} className="tn-dumbbell">
                      <span className="t-small" style={{ width: 118, flexShrink: 0 }}>{CARE_LABELS[k]}</span>
                      <div className="track">
                        <motion.i className="seg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.06 }} style={{ left: `${Math.min(a, b)}%`, width: `${Math.abs(a - b)}%` }} />
                        <motion.b style={{ background: ME_COLOR }} initial={{ left: '50%', opacity: 0 }} animate={{ left: `${a}%`, opacity: 1 }} transition={{ delay: 0.3 + i * 0.06, duration: 0.8, ease: EASE }} />
                        <motion.b style={{ background: THEM_COLOR }} initial={{ left: '50%', opacity: 0 }} animate={{ left: `${b}%`, opacity: 1 }} transition={{ delay: 0.3 + i * 0.06, duration: 0.8, ease: EASE }} />
                      </div>
                    </div>
                  )
                })}
                <span className="t-callout muted pretty">You both feel most cared for through {CARE_LABELS[shared].toLowerCase()}. The widest gap is {CARE_LABELS[gap].toLowerCase()}: worth a word early.</span>
              </div>
            </Section>
          </motion.div>
        ) : (
          <motion.div key="list" className="stack gap-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Section label="Side by side">
              <div className="tn-table" role="table" aria-label={`You and ${p.first}, side by side`}>
                <div className="tr th" role="row"><span role="columnheader" /><span role="columnheader">You</span><span role="columnheader">{p.first}</span></div>
                {rows.map(r => <div key={r.label} className="tr" role="row"><span role="rowheader">{r.label}</span><span role="cell">{r.wa}</span><span role="cell">{r.wb}</span></div>)}
              </div>
            </Section>
            <Section label="How you each feel cared for">
              <div className="tn-table" role="table" aria-label="Care styles">
                <div className="tr th" role="row"><span role="columnheader" /><span role="columnheader">You</span><span role="columnheader">{p.first}</span></div>
                {keys.map(k => <div key={k} className="tr" role="row"><span role="rowheader">{CARE_LABELS[k]}</span><span role="cell">{careWord(care[k])}</span><span role="cell">{careWord(p.care[k])}</span></div>)}
              </div>
            </Section>
          </motion.div>
        )}

        <div className="card card-aura card-pad stack gap-8">
          <AiBadge text="Aura" />
          <p className="t-quote pretty" style={{ margin: 0, fontSize: 20 }}>
            {common.length ? `You share ${list(common.slice(0, 3))}. ` : ''}You both lead with {CARE_LABELS[shared].toLowerCase()}; start there.
          </p>
        </div>
      </div>
    </Screen>
  )
}

// ---------- tonight/resonance ----------

export function Resonance({ params }: { params: Record<string, any> }) {
  const { s, update, p, fit } = usePerson(params)
  const nav = useNav()
  const back = useBack()
  const fb = useFeedback()
  const lpMe = myChart(s).lifePath
  const lpThem = chart(p.birthName, p.dob).lifePath
  const r = resonance(lpMe, lpThem)
  const arch = ARCHETYPE[lpThem]
  const weight = s.me.resonance

  if (weight === 'off') return (
    <Screen className="tn-ink" top={<TopBar back onBack={back} title="Resonance" />}>
      <div className="pad stack gap-24" style={{ alignItems: 'center', paddingTop: 24 }}>
        <div style={{ opacity: 0.4 }}><Lissajous a={lpMe} b={lpThem} size={200} color="var(--ink-3)" /></div>
        <div className="stack gap-8 center" style={{ alignItems: 'center' }}>
          <h1 className="t-title" style={{ margin: 0 }}>Numbers are <span className="i">off.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0, maxWidth: 300 }}>Resonance is an optional lens from numerology. It sits apart from the science and never changes your band.</p>
        </div>
        <div className="stack gap-8" style={{ width: '100%' }}>
          <Button kind="ember" block onClick={() => { update(st => ({ ...st, me: { ...st.me, resonance: 'light' } })); fb.toast('Resonance is on, lightly.') }}>Turn on, lightly</Button>
          <Button kind="quiet" block onClick={back}>Keep it off</Button>
        </div>
      </div>
    </Screen>
  )

  const challenged = r.relation === 'Challenging' && fit.band !== 'Exploratory'
  return (
    <Screen className="tn-ink" top={<TopBar back onBack={back} title="Resonance" />}>
      <div className="pad stack gap-24">
        <div className="stack gap-4 center" style={{ alignItems: 'center' }}>
          <Eyebrow>Resonance · a reflective lens</Eyebrow>
          <div style={{ display: 'grid', placeItems: 'center', position: 'relative', margin: '8px 0' }}>
            <div className="tn-glow" style={{ width: 280, height: 280 }} />
            <Lissajous a={lpMe} b={lpThem} size={232} stroke={1.5} delay={0.3} />
          </div>
          <span className="t-small faint">Your numbers meet at <span className="t-num">{handshakeRatio(lpMe, lpThem)}</span></span>
          <motion.h1 className="t-title" style={{ margin: '6px 0 0' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 0.8 }}><span className="i">{r.relation}.</span></motion.h1>
          {r.highVoltage && <Tag tone="ember">High voltage</Tag>}
        </div>

        <div className="tn-lp-pair">
          <div className="stack gap-4"><span className="t-label faint">You</span><span className="t-num" style={{ fontSize: 30 }}>{lpMe}</span><span className="t-small muted">{ARCHETYPE[lpMe].name}</span></div>
          <span className="tn-lp-amp serif i">and</span>
          <div className="stack gap-4" style={{ textAlign: 'right' }}><span className="t-label faint">{p.first}</span><span className="t-num" style={{ fontSize: 30 }}>{lpThem}</span><span className="t-small muted">{arch.name}</span></div>
        </div>

        <div className="card card-pad stack gap-12">
          <div className="row between"><Eyebrow>Your couple number</Eyebrow><span className="t-num" style={{ fontSize: 34, lineHeight: 1 }}>{r.couple}</span></div>
          <p className="t-quote pretty" style={{ margin: 0, fontSize: 21 }}>{r.coupleLine}</p>
        </div>

        <div className="stack gap-8">
          <Eyebrow>{p.first}’s Life Path · {arch.name}</Eyebrow>
          <span className="t-callout pretty">{arch.line}</span>
          <span className="serif i muted pretty" style={{ fontSize: 19 }}>{arch.inLove}</span>
        </div>

        {challenged && (
          <motion.div className="tn-evidence stack gap-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7, ease: EASE }}>
            <span className="t-label" style={{ color: 'var(--accent)' }}>The numbers never override the science</span>
            <span className="t-body pretty">Your numbers call this challenging. Everything else we know says {fit.band.toLowerCase()}. We go with the evidence.</span>
          </motion.div>
        )}

        <div className="card-flat card-pad stack gap-12" style={{ padding: 16 }}>
          <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
            <Icon name="info" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span className="t-callout pretty">This is a reflective lens. It doesn’t change your band.</span>
          </div>
          <div className="row between"><span className="t-small muted">Your band with {p.first}</span><BandMark band={fit.band} compact /></div>
        </div>

        <ListRow icon="numbers" title="How much numbers count for you" sub={`${weight === 'meaningful' ? 'Meaningful: can gently reorder your letter' : 'Light: a quiet note beside each introduction'} · never a band`}
          onClick={() => nav.push('you/numbers')} />
      </div>
    </Screen>
  )
}
