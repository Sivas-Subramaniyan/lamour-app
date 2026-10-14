// tonight/dossier: one introduction as an editorial spread. tonight/briefing: Aura's spoken "why you two", with live captions.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, IconButton, Eyebrow, Section, Portrait, Halo, ArcRail, BandMark, Tag, Waveform, Orb, AiBadge, Sheet } from '../../design/ui'
import { Icon } from '../../design/icons'
import { Signature, signatureModes, Lissajous } from '../../design/signature'
import { myChart, connection } from '../../state/store'
import { useNav } from '../../shell/nav'
import { chart, resonance } from '../../lib/numerology'
import { speak, stopSpeaking } from '../../lib/voice'
import { ROMAN, ME_COLOR, THEM_COLOR, usePerson, realPages, forewordOf, briefingOf, secsFor, useBack } from './parts'
import { DecisionTag } from './Deck'

const EASE = [0.22, 1, 0.36, 1] as const
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

export function Dossier({ params }: { params: Record<string, any> }) {
  const { s, id, p, idx, age, fit, pr } = usePerson(params)
  const nav = useNav()
  const back = useBack()
  const [ask, setAsk] = useState(false)
  const [playing, setPlaying] = useState<number | null>(null)
  const pages = realPages(p)
  const decision = s.tonight.decisions[id]
  const conn = connection(s, id)
  const member = s.me.tier !== 'invitation'
  const res = resonance(myChart(s).lifePath, chart(p.birthName, p.dob).lifePath)
  const briefSecs = secsFor(briefingOf(s, id))
  const theirVoice = p.gender === 'woman' ? 'Bright' : p.gender === 'man' ? 'Low' : 'Warm'
  const verified = [p.halo.selfie && 'selfie', p.halo.id && 'ID 18+', p.halo.work && 'work'].filter(Boolean) as string[]

  if (!member && idx > 0) return (
    <Screen top={<TopBar back onBack={back} />}>
      <div className="pad stack gap-24" style={{ alignItems: 'center', paddingTop: 12 }}>
        <div className="tn-blur-arch" style={{ width: 240 }}>
          <Portrait photo={p.photos.portrait} name="" shape="arch" w={240} h={310} style={{ filter: 'blur(24px) saturate(.8)', transform: 'scale(1.15)' }} />
          <span className="tn-blur-lock"><Icon name="lock" size={22} /></span>
        </div>
        <span className="tn-numeral big">{ROMAN[idx]}</span>
        <div className="stack gap-8 center"><span className="t-title balance">Two more were chosen for you tonight.</span><span className="t-callout muted">Soirée members see all three.</span></div>
        <Button kind="ember" icon="lock" onClick={() => nav.push('premium/paywall', { reason: 'letter' })}>See Soirée</Button>
      </div>
    </Screen>
  )

  const footer = conn ? (
    <Button kind="commit" block icon="message" onClick={() => nav.push('conn/chat', { id })}>You’re introduced · write to {p.first}</Button>
  ) : decision ? (
    <div className="row gap-12">
      <span className="grow row gap-8"><DecisionTag s={s} id={id} /></span>
      <Button kind="ghost" size="md" onClick={() => nav.push('tonight/decide', { id, choice: decision })}>Change your mind</Button>
    </div>
  ) : (
    <div className="row gap-8">
      <Button kind="ghost" size="md" onClick={() => nav.push('tonight/decide', { id, choice: 'not' })}>Not tonight</Button>
      <Button kind="soft" size="md" onClick={() => nav.push('tonight/decide', { id, choice: 'hold' })}>Hold</Button>
      <Button kind="commit" size="md" icon="heart" style={{ flex: 1 }} onClick={() => nav.push('tonight/decide', { id, choice: 'lean' })}>Lean in</Button>
    </div>
  )

  return (
    <Screen className="tn-ink" top={<TopBar back onBack={back} right={<IconButton icon="sparkle" label={`Ask Aura about ${p.first}`} onClick={() => setAsk(true)} />} />} footer={footer}>
      <div className="stack gap-32">
        <div className="pad stack gap-20" style={{ alignItems: 'center' }}>
          <motion.div className="tn-hero" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: EASE }}>
            <div className="tn-hero-glow" />
            <Portrait photo={p.photos.portrait} name={p.first} shape="arch" w={264} h={344} priority />
          </motion.div>
          <div className="stack gap-8 center" style={{ alignItems: 'center' }}>
            <Eyebrow>{idx >= 0 ? `Introduction ${ROMAN[idx]} · Edition No. ${s.tonight.edition}` : 'An introduction'}</Eyebrow>
            <h1 className="t-display" style={{ margin: 0 }}>{p.first} <span className="faint" style={{ fontSize: 30 }}>{age}</span></h1>
            <p className="serif balance" style={{ margin: 0, fontSize: 21, lineHeight: 1.3, maxWidth: 320 }}>{p.headline}</p>
            <span className="t-small faint">{p.hood} · {p.job} · {p.pronouns}</span>
          </div>
        </div>

        <div className="pad stack gap-20">
          <div className="row gap-16">
            <Halo v={p.halo} size={46}><Portrait photo={p.photos.portrait2 ?? p.photos.portrait} name={p.first} shape="circle" w={46} h={46} /></Halo>
            <div className="stack gap-4 grow">
              <span className="t-callout" style={{ fontWeight: 550 }}>Verified · {verified.join(' · ')}</span>
              <span className="t-small faint">Speaks {p.languages.join(', ')} · {verified.length === 3 ? 'every check complete' : `${3 - verified.length} check${verified.length === 2 ? '' : 's'} still open`}</span>
            </div>
          </div>
          <div className="stack gap-8">
            <Eyebrow>Where this could go</Eyebrow>
            <ArcRail at={0} labels />
          </div>
        </div>

        {pages.length > 0 && (
          <Section label={`${p.first}’s pages`} style={{ padding: '0 22px' }}>
            <div className="stack gap-24">
              {pages.map((pg, i) => (
                <motion.figure key={pg.label} className="tn-pull" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7, ease: EASE }}>
                  <figcaption className="t-label faint">{pg.label}</figcaption>
                  <blockquote className="tn-pull-text">“{pg.text}”</blockquote>
                  {pg.voiceSecs && (
                    <VoicePage text={pg.text} secs={pg.voiceSecs} seed={i * 3 + idx + 2} active={playing === i} voice={theirVoice} muted={s.settings.auraMuted}
                      onToggle={() => setPlaying(x => (x === i ? null : i))} onEnd={() => setPlaying(x => (x === i ? null : x))} />
                  )}
                </motion.figure>
              ))}
            </div>
          </Section>
        )}

        {p.photos.world.length > 0 && (
          <div className="stack gap-12">
            <div className="pad"><Eyebrow>{p.first}’s world</Eyebrow></div>
            <div className="tn-world">
              {p.photos.world.map((ph, i) => <Portrait key={i} photo={ph} name={p.first} shape="rect" w={150} h={196} />)}
            </div>
          </div>
        )}

        <div className="pad">
          <div className="card card-aura card-pad stack gap-12">
            <div className="row between"><AiBadge text="Aura’s foreword" />{p.aura.note && <span className="row gap-4 t-small faint"><Icon name="check" size={14} /> {p.first} approved it</span>}</div>
            <p className="t-quote pretty" style={{ margin: 0 }}>{forewordOf(p)}</p>
          </div>
        </div>

        <Section label="You two" style={{ padding: '0 22px' }}>
          <div className="stack gap-12">
            <button className="tn-teaser" onClick={() => nav.push('tonight/why', { id })}>
              <span className="grow stack gap-8">
                <span className="t-label faint">Why you two</span>
                <BandMark band={fit.band} compact />
                <span className="t-callout muted">{fit.reasons[0]?.title}</span>
              </span>
              <Icon name="chevron" size={18} />
            </button>
            <button className="tn-teaser" onClick={() => nav.push('tonight/briefing', { id })}>
              <Orb size={40} />
              <span className="grow stack gap-4">
                <span className="t-callout" style={{ fontWeight: 550 }}>Aura’s briefing · {briefSecs} sec</span>
                <span className="t-small muted">Why you two, in her words</span>
              </span>
              <Icon name="play" size={18} />
            </button>
            <button className="tn-teaser" onClick={() => nav.push('tonight/blueprint', { id })}>
              <span className="tn-teaser-mark"><Signature layers={[{ modes: signatureModes(s.me.traits), color: ME_COLOR }, { modes: signatureModes(p.traits), color: THEM_COLOR }]} size={52} grains={520} /></span>
              <span className="grow stack gap-4">
                <span className="t-callout" style={{ fontWeight: 550 }}>Where you meet</span>
                <span className="t-small muted">Your two Signatures, overlaid</span>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          </div>
        </Section>

        <div className="pad">
          <Button kind="ghost" block icon="sparkle" onClick={() => setAsk(true)}>Ask Aura about {p.first}</Button>
        </div>

        <Section label="Apart from the science" style={{ padding: '0 22px' }}>
          <button className="tn-teaser quiet" onClick={() => nav.push('tonight/resonance', { id })}>
            <span className="tn-teaser-mark"><Lissajous a={myChart(s).lifePath} b={chart(p.birthName, p.dob).lifePath} size={52} stroke={1.4} delay={0.4} /></span>
            <span className="grow stack gap-4">
              <span className="t-callout" style={{ fontWeight: 550 }}>{s.me.resonance === 'off' ? 'Resonance is off' : `Resonance · couple number ${res.couple}`}</span>
              <span className="t-small muted">{s.me.resonance === 'off' ? 'An optional lens from numerology' : `${res.relation} · it doesn’t change your band`}</span>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        </Section>
        <div style={{ height: 8 }} />
      </div>

      <AskAura open={ask} onClose={() => setAsk(false)} params={{ id }} />
    </Screen>
  )
}

/** One of their voice pages: play reads it aloud, the waveform fills as it goes. */
function VoicePage({ text, secs, seed, active, voice, muted, onToggle, onEnd }: {
  text: string; secs: number; seed: number; active: boolean; voice: 'Warm' | 'Bright' | 'Low'; muted: boolean; onToggle: () => void; onEnd: () => void
}) {
  const [prog, setProg] = useState(0)
  const end = useRef(onEnd)
  end.current = onEnd
  useEffect(() => {
    if (!active) { setProg(0); return }
    let gone = false
    const t0 = performance.now()
    const iv = setInterval(() => {
      const x = (performance.now() - t0) / (secs * 1000)
      setProg(Math.min(1, x))
      if (x >= 1) { clearInterval(iv); end.current() }
    }, 80)
    speak(text, { voice, muted }).then(() => {
      if (gone || muted || performance.now() - t0 < 700) return
      clearInterval(iv); setProg(1); setTimeout(() => !gone && end.current(), 300)
    })
    return () => { gone = true; clearInterval(iv); stopSpeaking() }
  }, [active, text, secs, voice, muted])
  const left = Math.round(secs * (1 - prog))
  return (
    <div className="tn-voicepage">
      <button className="tn-play" onClick={onToggle} aria-label={active ? 'Pause their voice page' : 'Play their voice page'}><Icon name={active ? 'pause' : 'play'} size={18} fill={!active} /></button>
      <div className="grow stack gap-4">
        <Waveform seed={seed} bars={34} height={28} progress={active ? prog : undefined} color="var(--accent)" />
        <div className="row between t-small faint"><span>Their voice page</span><span className="t-num">0:{String(active ? left : secs).padStart(2, '0')}</span></div>
      </div>
    </div>
  )
}

/** Ask Aura: answers come only from what they chose to share. */
function AskAura({ open, onClose, params }: { open: boolean; onClose: () => void; params: Record<string, any> }) {
  const { s, p, pr } = usePerson(params)
  const [q, setQ] = useState<number | null>(null)
  const [typing, setTyping] = useState(false)
  const tm = useRef(0)
  useEffect(() => { if (!open) { clearTimeout(tm.current); setQ(null); stopSpeaking() } }, [open])
  const pages = realPages(p)
  const sunday = pages.find(x => /sunday|weekend|thursday|evening/i.test(x.label)) ?? pages[0]
  const door = pages.find(x => x !== sunday) ?? sunday
  const qa = [
    { q: `What would ${p.first} enjoy on a first evening?`, src: `From ${p.first}’s pages`, a: sunday
      ? `From ${pr.adj} own pages: “${sunday.text}” I’d start somewhere with room to talk, and somewhere easy to leave.`
      : `${p.first} hasn’t written about that yet. Ask in your own words; it usually lands better anyway.` },
    { q: `Does ${p.first} want children?`, src: `Kept for ${p.first} to share`, a: `That’s ${pr.own} to tell you. Here’s a gentle way to ask: “What does family look like for you, someday?”` },
    { q: 'What’s a good first question?', src: `From ${p.first}’s pages`, a: door
      ? `${cap(pr.adj)} page “${door.label}” is a good door: “${door.text}” Ask what’s behind it.`
      : `Ask what ${pr.subj} ${pr.subj === 'they' ? 'are' : 'is'} looking forward to this month. People light up on that one.` },
  ]
  const pick = (i: number) => {
    setQ(i); setTyping(true)
    clearTimeout(tm.current)
    tm.current = window.setTimeout(() => { setTyping(false); speak(qa[i].a, { voice: s.me.voice, muted: s.settings.auraMuted }) }, 900)
  }
  return (
    <Sheet open={open} onClose={onClose} title={`Ask Aura about ${p.first}`}>
      <div className="stack gap-16" style={{ paddingBottom: 8 }}>
        <span className="t-small muted">I only answer from what {p.first} chose to share. Anything else is {pr.own} to tell you.</span>
        <div className="stack gap-8">
          {qa.map((x, i) => (
            <button key={i} className={`tn-ask ${q === i ? 'on' : ''}`} onClick={() => pick(i)}>
              <span className="grow">{x.q}</span><Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {q !== null && (
            <motion.div key={`${q}-${typing}`} className="card card-aura card-pad stack gap-12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <AiBadge text="Aura" />
              {typing ? <span className="tn-typing" aria-label="Aura is thinking"><i /><i /><i /></span> : (
                <>
                  <p className="t-quote pretty" style={{ margin: 0, fontSize: 20 }}>{qa[q].a}</p>
                  <span style={{ alignSelf: 'flex-start' }}><Tag icon={q === 1 ? 'lock' : 'book'}>{qa[q].src}</Tag></span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

// ---------- tonight/briefing ----------

const WPM_MS = 60000 / 170

export function Briefing({ params }: { params: Record<string, any> }) {
  const { s, id, p, fit } = usePerson(params)
  const nav = useNav()
  const text = briefingOf(s, id)
  const words = useMemo(() => { const out: { w: string; start: number }[] = []; const re = /\S+/g; let m; while ((m = re.exec(text))) out.push({ w: m[0], start: m.index }); return out }, [text])
  const dur = words.length * WPM_MS
  const [elapsed, setElapsed] = useState(0)
  const [wordIdx, setWordIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const run = useRef(0)
  const raf = useRef(0)
  const clock = useRef({ t0: 0, base: 0, voiced: false, spoken: false })

  const stop = () => { run.current++; cancelAnimationFrame(raf.current); stopSpeaking() }
  const finish = () => { stop(); setPlaying(false); setElapsed(dur); setWordIdx(words.length) }

  const play = (from: number) => {
    stop()
    const me = run.current
    const start = Math.min(words.length - 1, Math.floor(from / WPM_MS))
    clock.current = { t0: performance.now(), base: start * WPM_MS, voiced: !s.settings.auraMuted && 'speechSynthesis' in window, spoken: false }
    setPlaying(true)
    const tick = () => {
      if (run.current !== me) return
      const c = clock.current
      const e = c.base + performance.now() - c.t0
      if (!c.spoken) setWordIdx(Math.min(words.length - 1, Math.floor(e / WPM_MS)))
      if (e >= dur && !c.voiced) { finish(); return }
      setElapsed(Math.min(e, dur - 1))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    const t0 = performance.now()
    speak(text.slice(words[start].start), {
      voice: s.me.voice, muted: s.settings.auraMuted,
      onBoundary: ci => {
        if (run.current !== me) return
        const abs = words[start].start + ci
        let k = start
        while (k + 1 < words.length && words[k + 1].start <= abs) k++
        clock.current.spoken = true
        clock.current.base = k * WPM_MS; clock.current.t0 = performance.now()
        setWordIdx(k)
      },
    }).then(() => {
      if (run.current !== me) return
      if (performance.now() - t0 < 700) { clock.current.voiced = false; return } // speech unavailable: the timer carries the captions
      finish()
    })
  }
  const pause = () => { stop(); setPlaying(false) }
  const seek = (v: number) => { setElapsed(v); setWordIdx(Math.floor(v / WPM_MS)); if (playing) play(v) }
  useEffect(() => { const t = setTimeout(() => play(0), 650); return () => { clearTimeout(t); stop() } }, [])

  const done = wordIdx >= words.length
  const level = playing ? 0.35 + 0.3 * Math.abs(Math.sin(elapsed / 150)) : 0
  const mmss = (ms: number) => { const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }

  return (
    <Screen className="tn-ink"
      top={<TopBar left={<IconButton icon="close" label="Close" onClick={() => (nav.canGoBack ? nav.pop() : nav.reset('tonight/dossier', { id }))} />} title="Aura’s briefing" right={<AiBadge text="Aura" />} />}
      footer={<Button kind="ghost" block iconRight="chevron" onClick={() => nav.replace('tonight/why', { id })}>Why you two, in full</Button>}>
      <div className="pad stack gap-24">
        <div className="stack gap-12" style={{ alignItems: 'center', paddingTop: 8 }}>
          <Orb size={104} level={level} />
          <span className="t-small faint">About {p.first}, for you</span>
        </div>

        <p className="tn-caption" aria-live="polite">
          {words.map((w, i) => <span key={i} className={i < wordIdx ? 'said' : i === wordIdx ? 'now' : ''}>{w.w} </span>)}
        </p>

        <div className="stack gap-8">
          <input type="range" className="tn-scrub" min={0} max={Math.round(dur)} step={50} value={Math.round(elapsed)} aria-label="Briefing position"
            onChange={e => seek(Number(e.target.value))} style={{ ['--p' as any]: `${(elapsed / dur) * 100}%` }} />
          <div className="row between">
            <span className="t-num t-small faint">{mmss(elapsed)}</span>
            <button className="tn-play big" onClick={() => (playing ? pause() : play(done ? 0 : elapsed))} aria-label={playing ? 'Pause' : done ? 'Play again' : 'Play'}>
              <Icon name={playing ? 'pause' : done ? 'refresh' : 'play'} size={22} fill={!playing && !done} />
            </button>
            <span className="t-num t-small faint">{mmss(dur)}</span>
          </div>
        </div>

        <Section label="What this rests on">
          <div className="stack gap-12">
            {fit.reasons.map(r => (
              <div key={r.title} className="stack gap-4">
                <span className="t-callout">{r.title}</span>
                <span style={{ alignSelf: 'flex-start' }}><Tag icon="book">{r.source}</Tag></span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </Screen>
  )
}
