// day/brief: two hours before. Aura reads a short brief aloud, says their name, and hands you three threads to pull.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Chip, Eyebrow, Portrait, Orb, Waveform, AiBadge, Section, ListRow, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { fmtTime } from '../../state/store'
import { speak, stopSpeaking } from '../../lib/voice'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { useDate, isReady, NoTable, nameGuide, asksFor, laterFor, firstOn, joinNames, plus, weekday, ROMAN, type Ready } from './shared'

export function Brief({ params }: ScreenProps) {
  const d = useDate(params)
  return isReady(d) ? <BriefBody d={d} /> : <NoTable d={d} title="The Brief" />
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

function BriefBody({ d }: { d: Ready }) {
  const { s, id, p, pr, opt, v } = d
  const nav = useNav()
  const { toast } = useFeedback()
  const when = new Date(opt.when)
  const guide = nameGuide(id, p.first)
  const asks = asksFor(p)
  const later = laterFor(s.me.traits, p)
  const circle = firstOn(s)
  const leave = plus(when, -(opt.minsMe + 5))
  leave.setMinutes(Math.floor(leave.getMinutes() / 5) * 5)
  const late = `${p.first} may be five minutes late. ${pr.Hes} coming from ${guide.from}.`

  // The spoken brief, built from their data. About ninety seconds at Aura's pace.
  const text = useMemo(() => [
    `Here’s your brief for tonight with ${p.first}.`,
    `You’re meeting at ${v.name} in ${v.hood} at ${fmtTime(when)}. It’s ${opt.minsMe} minutes for you, so leave by ${fmtTime(leave)}.`,
    p.aura.briefing || `${p.first} is a ${p.job.toLowerCase()} in ${p.hood}.`,
    `Three things you could ask about. ${asks.map((a, i) => `${['One', 'Two', 'Three'][i]}: ${a}.`).join(' ')}`,
    p.aura.careNote && `One thing to hold gently. ${p.aura.careNote}`,
    late,
    circle.length ? `${joinNames(circle)} will know where you are. Enjoy your evening.` : 'Enjoy your evening.',
  ].filter(Boolean).join(' '), [id, v.id, opt.when])
  const starts = useMemo(() => { const out: number[] = []; const re = /[^.?]+[.?]+\s*/g; let m; while ((m = re.exec(text))) out.push(m.index); return out.length ? out : [0] }, [text])
  const est = Math.max(40, text.split(/\s+/).length / 2.4)

  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)
  const run = useRef(0)
  useEffect(() => () => { run.current++; stopSpeaking() }, [])
  const at = Math.floor(prog * text.length)
  const si = Math.max(0, starts.filter(x => x <= at).length - 1)
  const sentence = text.slice(starts[si], starts[si + 1] ?? text.length).trim()

  const toggle = () => {
    if (playing) { run.current++; stopSpeaking(); setPlaying(false); return }
    const token = ++run.current
    const from = prog >= 0.995 ? 0 : starts[si]
    const p0 = from / text.length
    setProg(p0)
    setPlaying(true)
    let speaking = true, boundary = false
    const t0 = performance.now()
    const tick = window.setInterval(() => {
      if (run.current !== token) return clearInterval(tick)
      if (boundary) return
      const x = p0 + (performance.now() - t0) / 1000 / est
      if (x >= 1 && !speaking) { clearInterval(tick); setProg(1); setPlaying(false); return }
      setProg(Math.min(speaking ? 0.985 : 1, x))
    }, 120)
    speak(text.slice(from), { voice: s.me.voice, muted: s.settings.auraMuted, onBoundary: i => { boundary = true; if (run.current === token) setProg((from + i) / text.length) } })
      .then(() => {
        if (run.current !== token) return
        if (performance.now() - t0 < 600) { speaking = false; return } // muted or no voice: the captions carry it
        clearInterval(tick); setProg(1); setPlaying(false)
      })
  }

  const sayIt = () => {
    if (s.settings.auraMuted) { toast(`Aura is muted. It’s ${guide.say}.`); return }
    speak(`${guide.say.replace(/-/g, ' ').toLowerCase()}. ${p.first}.`, { voice: s.me.voice })
  }

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}
      footer={
        <div className="stack gap-8">
          <div className="row gap-8">
            <Button kind="ghost" icon="ticket" style={{ flex: 1 }} onClick={() => nav.push('dates/pass', { id })}>Date Pass</Button>
            <Button kind="primary" icon="shield" style={{ flex: 1 }} onClick={() => nav.push('day/guardian', { id })}>Guardian Circle</Button>
          </div>
          <Button kind="quiet" block size="sm" onClick={() => nav.push('day/live', { id })}>I’m here · start date mode</Button>
        </div>
      }>
      <div className="pad stack gap-32" style={{ paddingTop: 4 }}>
        <motion.div className="dd-head" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <Portrait photo={p.photos.portrait} name={p.first} w={104} h={136} priority />
          <div className="stack gap-8 grow">
            <Eyebrow>{weekday(when)} · {fmtTime(plus(when, -120))} · the Brief</Eyebrow>
            <h1 className="t-title" style={{ margin: 0 }}>{p.first}, <span className="i">at {fmtTime(when).replace(':00', '')}</span></h1>
            <span className="t-callout muted">{v.name} · {v.hood}</span>
            <div><Chip size="sm" icon="speaker" onClick={sayIt}>Say it · {guide.say}</Chip></div>
          </div>
        </motion.div>

        <div className="card card-aura card-pad stack gap-16">
          <div className="row gap-12">
            <Orb size={44} level={playing ? 0.35 + 0.25 * Math.sin(prog * 90) : 0} />
            <div className="stack grow" style={{ gap: 2 }}>
              <Eyebrow>Read by Aura</Eyebrow>
              <span className="serif" style={{ fontSize: 21 }}>Your evening, in a minute and a half</span>
            </div>
          </div>
          <div className="dd-caption" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p key={playing || prog > 0 ? si : 'idle'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }} style={{ margin: 0 }}>
                {playing || prog > 0 ? sentence : `What to know about ${p.first}, how long it takes to get there, and one thing to hold gently.`}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="row gap-12">
            <button className="dd-play" onClick={toggle} aria-label={playing ? 'Pause the brief' : 'Play the brief'}><Icon name={playing ? 'pause' : 'play'} size={20} fill={!playing} /></button>
            <div className="grow" style={{ color: 'var(--accent)' }}><Waveform seed={7} bars={34} height={30} progress={prog} /></div>
            <span className="t-num t-small faint">{mmss(prog * est)} / {mmss(est)}</span>
          </div>
        </div>

        <Section label="Three things to ask">
          <ol className="dd-asks">
            {asks.map((a, i) => (
              <motion.li key={a} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}>
                <span className="dd-roman">{ROMAN[i]}</span><span className="serif" style={{ fontSize: 19, lineHeight: 1.3 }}>{a}</span>
              </motion.li>
            ))}
          </ol>
          <span className="t-small faint">From {pr.his} pages and your chapters. Only you can see this.</span>
        </Section>

        <div className="card-flat card-pad stack gap-8" style={{ padding: 18 }}>
          <Eyebrow>Save for later · {later.topic}</Eyebrow>
          <span className="t-quote" style={{ fontSize: 19 }}>{later.line}</span>
        </div>

        <Section label="Before you go">
          <div>
            <ListRow icon="moon" title={`${weekday(when)} evening · 58°F · clear`} sub="A light layer for the walk after." />
            <ListRow icon="car" title={`${opt.minsMe} minutes for you · leave by ${fmtTime(leave)}`} sub={`Your ride and ${p.first}’s are booked separately. Never a shared pickup.`} />
            <ListRow icon="clock" title={late} sub="Nothing to read into. Order something you like." />
          </div>
        </Section>
      </div>
    </Screen>
  )
}
