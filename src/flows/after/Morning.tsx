// after/morning: 10 AM, never at night. Prediction meets reality, privately; the answers teach Aura.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Chip, Eyebrow, Portrait, BandMark, Section, Waveform, AiBadge } from '../../design/ui'
import { Icon } from '../../design/icons'
import { fitWith, setStage, fmtDay, type NoticedCard } from '../../state/store'
import { useMicLevel, useTranscript } from '../../lib/voice'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { useDate, isReady, NoTable, plus, weekday, useLater, type Ready, type Pron } from '../dateday/shared'

export function Morning({ params }: ScreenProps) {
  const d = useDate(params, true)
  return isReady(d) && d.plan.status !== 'sealed' ? <MorningBody d={d} /> : <NoTable d={d} title="The Morning After" after />
}

type Felt = 'less' | 'as' | 'more'
const FELT: { v: Felt; label: string }[] = [{ v: 'less', label: 'Less than' }, { v: 'as', label: 'As expected' }, { v: 'more', label: 'More than' }]

/** Two or three small, sourced things Aura takes from a debrief. Written about you, never as you. */
export function learnFrom(a: { felt: Felt; stood: string[]; pages: string; first: string; pr: Pron; band: string; from: string; spoke: boolean }): NoticedCard[] {
  const has = (x: string) => a.stood.includes(x)
  const out: Omit<NoticedCard, 'id' | 'from' | 'status'>[] = []
  if (has('Easy laughter')) out.push({ told: 'You said the laughter came easily.', lean: 'Humour that arrives without trying tells you more than shared interests do.', likes: ['humour'] })
  if (has('Felt listened to')) out.push({ told: 'You felt listened to.', lean: 'You open up with people who ask the second question, not just the first.', likes: ['curiosity'] })
  if (a.felt === 'more') out.push({ told: `Aura predicted ${a.band}. You said more than expected.`, lean: 'You warm up in person more than on paper. Quieter pages deserve a longer look from you.' })
  if (a.felt === 'less' || has('Not quite')) out.push({ told: 'You said it was less than you hoped.', lean: 'How someone is in a room matters more to you than how well you match on paper. A Voice Hour first may help.' })
  if (has(a.pages)) out.push({ told: `${a.first} was different from ${a.pr.his} pages.`, lean: 'Voice tells you more than written pages. Voice pages and Voice Hour should carry more weight for you.' })
  if (has('Too much shop talk')) out.push({ told: 'Work came up more than you wanted.', lean: 'Shop talk wears thin for you by the second hour.', avoids: ['shop talk'] })
  if (has('Felt safe')) out.push({ told: 'You felt safe.', lean: 'Calm, well-lit rooms suit your first evenings. They help you relax into it.', likes: ['quiet rooms'] })
  if (has('Real chemistry')) out.push({ told: 'You felt real chemistry.', lean: `Makers and noticers keep landing with you. ${a.first} fits that pattern.` })
  if (has('Good questions')) out.push({ told: 'The questions were good.', lean: 'Curiosity reads as warmth to you.', likes: ['curiosity'] })
  if (a.felt === 'as') out.push({ told: `Aura predicted ${a.band}. You agreed.`, lean: 'Your pages and your evenings tell the same story. Your first impressions can be trusted.' })
  out.push({ lean: 'You give people a full evening before you decide.' })
  const stamp = Date.now().toString(36)
  return out.slice(0, 3).map((c, i) => ({ ...c, id: `dbf-${stamp}-${i}`, from: `${a.spoke ? 'Your voice debrief' : 'Your debrief'} · ${a.from}`, status: 'new' }))
}

function MorningBody({ d }: { d: Ready }) {
  const { s, update, id, p, pr, opt, v } = d
  const nav = useNav()
  const later = useLater()
  const band = fitWith(s, id).band
  const pages = `Different than ${pr.his} pages`
  const STOOD = ['Easy laughter', 'Felt listened to', 'Felt safe', 'Real chemistry', 'Good questions', 'Not quite', 'Too much shop talk', pages]
  const morning = plus(opt.when, 24 * 60)

  const [felt, setFelt] = useState<Felt | null>(null)
  const [stood, setStood] = useState<string[]>([])
  const [unsafe, setUnsafe] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  // Optional 60-second voice debrief: live mic level and transcript, or a typed sample where the browser can't transcribe.
  const [rec, setRec] = useState<'idle' | 'on' | 'done'>('idle')
  const [left, setLeft] = useState(60)
  const [sample, setSample] = useState('')
  const mic = useMicLevel(rec === 'on')
  const tr = useTranscript()
  const SAMPLE = `It was easy. ${pr.He} asked about my glaze and actually listened to the answer. The room got a little loud by nine, but I didn’t want to leave.`
  useEffect(() => {
    if (rec !== 'on') return
    const t = setInterval(() => setLeft(x => Math.max(0, x - 1)), 1000)
    const typer = tr.supported ? 0 : window.setInterval(() => setSample(x => (x.length < SAMPLE.length ? SAMPLE.slice(0, x.length + 2) : x)), 45)
    return () => { clearInterval(t); clearInterval(typer) }
  }, [rec])
  useEffect(() => { if (rec === 'on' && left === 0) stopRec() }, [left, rec])
  const startRec = () => { setLeft(60); setSample(''); setRec('on'); if (tr.supported) tr.start() }
  const stopRec = () => { tr.stop(); setRec('done') }
  const quote = (tr.text + (tr.interim ? ` ${tr.interim}` : '') || sample).trim()

  const toggleStood = (x: string) => setStood(st => (st.includes(x) ? st.filter(y => y !== x) : [...st, x]))
  const submit = () => {
    if (!felt) return
    if (rec === 'on') stopRec()
    setSaving(true)
    const cards = learnFrom({ felt, stood, pages, first: p.first, pr, band, from: fmtDay(morning), spoke: !!quote })
    later(() => {
      update(st => setStage({
        ...st,
        noticed: [...cards, ...st.noticed],
        learned: {
          likes: [...new Set([...st.learned.likes, ...cards.flatMap(c => c.likes ?? [])])],
          avoids: [...new Set([...st.learned.avoids, ...cards.flatMap(c => c.avoids ?? [])])],
          interactions: st.learned.interactions + 1,
        },
      }, id, 'debriefed'))
      nav.replace('after/learned', { id, cards: cards.map(c => c.id).join(','), felt })
    }, 900)
  }

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}
      footer={
        <div className="stack gap-8">
          <div className="row gap-8 t-small faint" style={{ justifyContent: 'center' }}><Icon name="lock" size={14} /> {p.first} will never see this.</div>
          <Button kind="primary" block disabled={!felt || saving} onClick={submit}>{saving ? 'Noting it down…' : felt ? 'Tell Aura' : 'Choose how it compared'}</Button>
        </div>
      }>
      <div className="pad stack gap-32" style={{ paddingTop: 4 }}>
        <motion.div className="stack gap-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <div className="row gap-12">
            <Portrait photo={p.photos.portrait} name={p.first} shape="circle" w={52} h={52} priority />
            <div className="stack" style={{ gap: 2 }}>
              <Eyebrow>{weekday(morning)} · 10 AM</Eyebrow>
              <span className="t-small muted">{v.name} · last night</span>
            </div>
          </div>
          <h1 className="t-title balance" style={{ margin: 0 }}>How was last night with <span className="i">{p.first}</span>?</h1>
          <p className="t-callout muted" style={{ margin: 0 }}>A minute, privately. Your answers teach Aura, not {pr.him}.</p>
        </motion.div>

        <Section label="Prediction and reality">
          <div className="card card-pad stack gap-20">
            <div className="row between">
              <span className="t-small muted">Aura predicted</span>
              <BandMark band={band} compact />
            </div>
            <div className="af-scale" role="radiogroup" aria-label="Compared with what Aura predicted">
              <span className="af-scale-line" />
              {FELT.map(f => (
                <button key={f.v} role="radio" aria-checked={felt === f.v} className={`af-stop ${felt === f.v ? 'on' : ''}`} onClick={() => setFelt(f.v)}>
                  <span className="af-dot">{felt === f.v && <motion.i layoutId="af-pick" transition={{ type: 'spring', damping: 28, stiffness: 320 }} />}</span>
                  <span className="af-stop-label">{f.label}</span>
                </button>
              ))}
            </div>
            <span className="t-small faint center">{felt ? 'Noted. Aura recalibrates after every evening.' : 'Compared with what Aura expected'}</span>
          </div>
        </Section>

        <Section label="What stood out">
          <div className="row gap-8 wrap">{STOOD.map(x => <Chip key={x} on={stood.includes(x)} onClick={() => toggleStood(x)}>{x}</Chip>)}</div>
        </Section>

        <Section label="Only for you">
          <div className="card-flat card-pad stack gap-12" style={{ padding: 18 }}>
            <span style={{ fontWeight: 550, fontSize: 15.5 }}>Did anything make you uncomfortable?</span>
            <div className="row gap-8">
              <Chip on={unsafe === false} onClick={() => setUnsafe(false)}>No</Chip>
              <Chip on={unsafe === true} onClick={() => { setUnsafe(true); nav.push('conn/report', { id }) }}>Yes</Chip>
            </div>
            <span className="t-small faint">Only our safety team reads this, within a day. Never {p.first}.</span>
          </div>
        </Section>

        <Section label="Say it instead · optional">
          <div className="card card-pad stack gap-16">
            <div className="row gap-16">
              <button className={`af-mic ${rec === 'on' ? 'on' : ''}`} onClick={rec === 'on' ? stopRec : startRec} aria-label={rec === 'on' ? 'Stop recording' : 'Record a voice debrief'}>
                <Icon name={rec === 'on' ? 'pause' : 'mic'} size={24} />
              </button>
              <div className="grow stack gap-4">
                {rec === 'on' ? <Waveform level={Math.max(0.2, mic.level)} bars={26} height={28} color="var(--accent)" /> : <span className="t-callout muted">{rec === 'done' ? 'Kept. Record again if you like.' : 'Sixty seconds, in your own words.'}</span>}
              </div>
              <span className="t-num t-small faint">0:{String(left).padStart(2, '0')}</span>
            </div>
            <AnimatePresence>
              {quote && (
                <motion.p className="t-quote" style={{ margin: 0, fontSize: 18, color: 'var(--ink-2)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>“{quote}”</motion.p>
              )}
            </AnimatePresence>
            {!tr.supported && rec !== 'idle' && <span className="t-small faint">This browser can’t transcribe, so here’s a sample of how it reads.</span>}
            {mic.state === 'denied' && <span className="t-small faint">The microphone is off. You can still tap your answers above.</span>}
          </div>
        </Section>
      </div>
    </Screen>
  )
}
