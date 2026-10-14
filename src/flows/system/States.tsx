// sys/states: honest empty and error states. Each says plainly what happened and offers a real way forward.
import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Chip, Tag, Eyebrow, Sheet, useFeedback } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useApp, proposalsFor, planWith, type State } from '../../state/store'
import { CAST, PERSONAS } from '../../data/personas'
import { venue } from '../../data/venues'
import { useNav } from '../../shell/nav'
import { TIER_NAME } from '../premium/kit'

type Key = 'none' | 'mic' | 'voice' | 'pay' | 'venue' | 'evening' | 'full' | 'offline'
const STATES: { key: Key; icon: IconName; title: string; line: string }[] = [
  { key: 'none', icon: 'moon', title: 'Better none than nearly', line: 'No one tonight, and exactly why.' },
  { key: 'mic', icon: 'micOff', title: 'Microphone blocked', line: 'How to turn it on, or write instead.' },
  { key: 'voice', icon: 'wave', title: 'Voice didn’t connect', line: 'Try once more, or switch to text.' },
  { key: 'pay', icon: 'wallet', title: 'Payment didn’t go through', line: 'Nothing you rely on switches off.' },
  { key: 'venue', icon: 'phone', title: 'Venue system down', line: 'A person from our concierge team takes over.' },
  { key: 'evening', icon: 'calendar', title: 'No evening in common', line: 'Name three evenings instead.' },
  { key: 'full', icon: 'ticket', title: 'Table full', line: 'A later time, another room, or the waitlist.' },
  { key: 'offline', icon: 'globe', title: 'You’re offline', line: 'What still works without a signal.' },
]
const ease = [0.22, 1, 0.36, 1] as const
const leadOf = (s: State) => s.tonight.ids[0]
const turnOf = (s: State) => s.connections.find(c => c.stage === 'talking')?.id ?? CAST[s.me.seeking].yourTurn
const sealedOf = (s: State) => s.plans.find(p => p.status === 'sealed' || p.status === 'live')?.with ?? CAST[s.me.seeking].sealed
const optsOf = (s: State, id: string) => planWith(s, id)?.options ?? proposalsFor(s, id)

export function States() {
  const nav = useNav()
  const [open, setOpen] = useState<Key | null>(null)
  const [first, ...rest] = STATES
  const close = () => setOpen(null)
  const BODY: Record<Key, ReactNode> = {
    none: <NoneSheet close={close} />, mic: <MicSheet close={close} />, voice: <VoiceSheet close={close} />, pay: <PaySheet close={close} />,
    venue: <VenueSheet close={close} />, evening: <EveningSheet close={close} />, full: <FullSheet />, offline: <OfflineSheet close={close} />,
  }

  return (
    <Screen top={<TopBar back onBack={nav.canGoBack ? nav.pop : () => nav.goTab('you')} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-8">
          <Eyebrow>When things don’t go to plan</Eyebrow>
          <h1 className="t-title" style={{ margin: 0 }}>Honest <span className="i">states</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Every empty or broken moment, said plainly, with a way forward. Tap any card to see it in full.</p>
        </div>

        <motion.button className="sy-feature" onClick={() => setOpen(first.key)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="sy-empty-arch" aria-hidden="true"><Icon name="moon" size={22} /></span>
          <span className="stack gap-4" style={{ textAlign: 'left' }}>
            <span className="t-label faint">Tonight</span>
            <span className="t-head">{first.title}</span>
            <span className="t-small muted">{first.line}</span>
          </span>
        </motion.button>

        <div className="sy-grid">
          {rest.map((x, i) => (
            <motion.button key={x.key} className="sy-tile" onClick={() => setOpen(x.key)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease }}>
              <span className="sy-tile-ico"><Icon name={x.icon} size={20} /></span>
              <span className="sy-tile-title">{x.title}</span>
              <span className="t-small muted">{x.line}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <Sheet open={!!open} onClose={close} title={open ? STATES.find(x => x.key === open)!.title : undefined}>
        {open && <div key={open}>{BODY[open]}</div>}
      </Sheet>
    </Screen>
  )
}

// ---------- the eight states ----------

function Waiting({ children }: { children: ReactNode }) {
  return <div className="sy-waiting"><span className="sy-spin" />{children}</div>
}

function NoneSheet({ close }: { close: () => void }) {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const [loosened, setLoosened] = useState<string[]>([])
  const cap = s.prefs.travelCap
  const rules = [
    { k: 'travel', n: 61, label: `Farther than ${cap} minutes from you`, from: 'Your rules',
      loosen: () => { update(st => ({ ...st, prefs: { ...st.prefs, travelCap: st.prefs.travelCap + 10 } })); toast(`Up to ${cap + 10} minutes now. I’ll look again at dusk tomorrow.`) } },
    { k: 'days', n: 29, label: `No free evening on ${s.prefs.days.join(', ') || 'your days'}`, from: 'Your rules',
      loosen: s.prefs.days.includes('Sun') ? undefined : () => { update(st => ({ ...st, prefs: { ...st.prefs, days: [...st.prefs.days, 'Sun'] } })); toast('Sundays added. I’ll look again at dusk tomorrow.') } },
    { k: 'kids', n: 38, label: 'Don’t want children', from: 'Your life design', firm: 'You marked this firm' },
    { k: 'verified', n: 17, label: 'Not yet verified', from: 'Your rules', firm: 'Verified people only, as you asked' },
    { k: 'values', n: 52, label: 'Too far apart on what matters most', from: 'Your values chapter', firm: 'I don’t loosen this one' },
  ]
  return (
    <div className="stack gap-20">
      <div className="stack gap-12" style={{ alignItems: 'center' }}>
        <span className="sy-empty-arch big" aria-hidden="true"><Icon name="moon" size={26} /></span>
        <p className="t-quote center balance" style={{ margin: 0 }}>No letter tonight. I’d rather send none than a nearly.</p>
        <p className="t-callout muted center pretty" style={{ margin: 0 }}>I read <span className="t-num">212</span> people. <span className="t-num">197</span> fell outside your rules, and none of the other <span className="t-num">15</span> were a fit I’d stand behind.</p>
      </div>
      <div className="stack">
        <Eyebrow style={{ marginBottom: 4 }}>What I ruled out, and why</Eyebrow>
        {rules.map(r => (
          <div key={r.k} className="sy-rule">
            <span className="t-num sy-rule-n">{r.n}</span>
            <span className="grow stack" style={{ gap: 2 }}><span className="t-callout">{r.label}</span><span className="t-small faint">{r.from}</span></span>
            {loosened.includes(r.k)
              ? <Tag tone="sage" icon="check">Loosened</Tag>
              : r.loosen
                ? <Button kind="ghost" size="sm" onClick={() => { r.loosen!(); setLoosened(x => [...x, r.k]) }}>Loosen this rule?</Button>
                : <span className="t-small faint" style={{ maxWidth: 110, textAlign: 'right' }}>{r.firm ?? 'Already loose'}</span>}
          </div>
        ))}
      </div>
      <div className="card-aura card-pad t-callout" style={{ padding: 16 }}>Your chair stays warm. Tomorrow’s letter arrives at dusk.</div>
      <Button kind="soft" block onClick={() => { close(); nav.push('you/rules') }}>Review all your rules</Button>
    </div>
  )
}

function MicSheet({ close }: { close: () => void }) {
  const { update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const [st, setSt] = useState<'idle' | 'asking' | 'ok' | 'blocked'>('idle')
  const retry = async () => {
    setSt('asking')
    try {
      const m = await navigator.mediaDevices.getUserMedia({ audio: true })
      m.getTracks().forEach(t => t.stop())
      setSt('ok'); toast('I can hear you now.')
    } catch { setSt('blocked'); toast('Still blocked. Writing works just as well.') }
  }
  return (
    <div className="stack gap-20">
      <p className="t-body pretty" style={{ margin: 0 }}>Your phone isn’t letting L’Amour use the microphone, so I can’t hear you yet. Nothing is recorded until you say so.</p>
      <ol className="sy-steps">
        <li>Open <b>Settings</b> on your phone</li>
        <li>Scroll to <b>L’Amour</b></li>
        <li>Turn on <b>Microphone</b>, then come back</li>
      </ol>
      <AnimatePresence mode="wait">
        {st === 'asking' && <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Waiting>Asking your phone</Waiting></motion.div>}
        {st === 'ok' && <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Tag tone="sage" icon="check">Microphone on</Tag></motion.div>}
        {st === 'blocked' && <motion.p key="b" className="t-small faint" style={{ margin: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Still blocked. That’s fine: everything works in writing too.</motion.p>}
      </AnimatePresence>
      <div className="stack gap-8">
        <Button block onClick={retry} disabled={st === 'asking'}>Try again</Button>
        <Button kind="ghost" block onClick={() => { update(s => ({ ...s, me: { ...s.me, mode: 'text' } })); close(); nav.push('conv/text') }}>Write instead</Button>
      </div>
    </div>
  )
}

function VoiceSheet({ close }: { close: () => void }) {
  const { s } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const id = turnOf(s)
  const [st, setSt] = useState<'idle' | 'trying' | 'failed'>('idle')
  useEffect(() => { if (st !== 'trying') return; const t = setTimeout(() => setSt('failed'), 1800); return () => clearTimeout(t) }, [st])
  return (
    <div className="stack gap-20">
      <p className="t-body pretty" style={{ margin: 0 }}>The line dropped before {PERSONAS[id].first} could hear you. Your Voice Hour is paused, not lost.</p>
      <AnimatePresence mode="wait">
        {st === 'trying' && <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Waiting>Reconnecting</Waiting></motion.div>}
        {st === 'failed' && <motion.p key="f" className="t-callout muted" style={{ margin: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Still not getting through. The signal on your side looks weak.</motion.p>}
      </AnimatePresence>
      <div className="stack gap-8">
        <Button kind={st === 'failed' ? 'ghost' : 'primary'} block disabled={st === 'trying'} onClick={() => setSt('trying')}>Try again</Button>
        <Button kind={st === 'failed' ? 'primary' : 'ghost'} block onClick={() => { close(); toast('Voice Hour paused. Pick it up any time.'); nav.push('conn/chat', { id }) }}>Switch to text</Button>
      </div>
    </div>
  )
}

function PaySheet({ close }: { close: () => void }) {
  const { s } = useApp()
  const { toast } = useFeedback()
  const cards = ['Visa ·· 4242', 'Mastercard ·· 8810']
  const [card, setCard] = useState(0)
  const [st, setSt] = useState<'idle' | 'paying' | 'done'>('idle')
  useEffect(() => { if (st !== 'paying') return; const t = setTimeout(() => setSt('done'), 1400); return () => clearTimeout(t) }, [st])
  return (
    <div className="stack gap-20">
      <p className="t-body pretty" style={{ margin: 0 }}>Your bank declined the charge, so nothing changed: you’re still on {TIER_NAME[s.me.tier]}.</p>
      <div className="card-flat card-pad stack gap-8">
        <Eyebrow>Never depends on a payment</Eyebrow>
        {['Any evening already sealed', 'Safety on every date', 'Your data, and your chairs'].map(x => <div key={x} className="row gap-8 t-callout"><Icon name="check" size={16} stroke={2} style={{ color: 'var(--sage)' }} />{x}</div>)}
      </div>
      <div className="row between t-callout"><span className="faint">Paying with</span><span className="t-num">{cards[card]}</span></div>
      <AnimatePresence mode="wait">
        {st === 'paying' && <motion.div key="p" exit={{ opacity: 0 }}><Waiting>Trying again</Waiting></motion.div>}
        {st === 'done' && <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Tag tone="sage" icon="check">Paid. You’re all set.</Tag></motion.div>}
      </AnimatePresence>
      <div className="stack gap-8">
        {st === 'done'
          ? <Button block onClick={close}>Done</Button>
          : <Button kind="commit" block disabled={st === 'paying'} onClick={() => setSt('paying')}>Try again</Button>}
        {st !== 'done' && <Button kind="ghost" block onClick={() => { const n = (card + 1) % cards.length; setCard(n); toast(`Switched to ${cards[n]}.`) }}>Use another card</Button>}
      </div>
    </div>
  )
}

function VenueSheet({ close }: { close: () => void }) {
  const { s } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const id = leadOf(s)
  const opt = optsOf(s, id)[0]
  const v = venue(opt.venueId)
  const [st, setSt] = useState<'handing' | 'person'>('handing')
  useEffect(() => { const t = setTimeout(() => setSt('person'), 2200); return () => clearTimeout(t) }, [])
  const when = `${new Date(opt.when).toLocaleDateString('en-US', { weekday: 'long' })} at ${new Date(opt.when).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  return (
    <div className="stack gap-20">
      <p className="t-body pretty" style={{ margin: 0 }}>{v.name}’s booking system isn’t answering, so I can’t confirm your table myself.</p>
      <AnimatePresence mode="wait">
        {st === 'handing'
          ? <motion.div key="h" exit={{ opacity: 0 }}><Waiting>Handing this to our concierge team</Waiting></motion.div>
          : (
            <motion.div key="p" className="card card-pad stack gap-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
              <div className="row gap-12">
                <span className="sy-person">N</span>
                <span className="grow stack" style={{ gap: 1 }}><b className="t-callout">Noor</b><span className="t-small faint">Concierge team · a person, not Aura</span></span>
                <Tag tone="sage">On it</Tag>
              </div>
              <p className="t-callout" style={{ margin: 0 }}>Hi {s.me.name}, I’m calling {v.name} now. I’ll hold {when} for you and {PERSONAS[id].first}, and write back within 15 minutes.</p>
            </motion.div>
          )}
      </AnimatePresence>
      <div className="stack gap-8">
        <Button block disabled={st === 'handing'} onClick={() => { close(); toast('Noor will write within 15 minutes.') }}>Thank you, Noor</Button>
        <Button kind="ghost" block onClick={() => { close(); nav.push('dates/proposals', { id }) }}>Choose another evening</Button>
      </div>
    </div>
  )
}

function EveningSheet({ close }: { close: () => void }) {
  const { s, update } = useApp()
  const { toast } = useFeedback()
  const id = leadOf(s)
  const first = PERSONAS[id].first
  const days = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 15 + i))
  const [picked, setPicked] = useState<number[]>([])
  const tap = (i: number) => {
    if (!picked.includes(i) && picked.length >= 3) return toast('Three is plenty. Tap one to swap it.')
    setPicked(p => (p.includes(i) ? p.filter(x => x !== i) : [...p, i]))
  }
  const send = () => {
    const names = [...new Set(picked.map(i => days[i].toLocaleDateString('en-US', { weekday: 'short' })))]
    update(st => ({ ...st, prefs: { ...st.prefs, days: names } }))
    close()
    toast(`Sent. I’ll match one with ${first}’s side.`)
  }
  return (
    <div className="stack gap-20">
      <p className="t-body pretty" style={{ margin: 0 }}>{first}’s week and yours don’t overlap yet. Rather than guess, name three evenings that could work.</p>
      <div className="sy-days">
        {days.map((d, i) => (
          <button key={i} className={`sy-day ${picked.includes(i) ? 'on' : ''}`} aria-pressed={picked.includes(i)} onClick={() => tap(i)}>
            <span className="t-label">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span className="serif" style={{ fontSize: 24, lineHeight: 1 }}>{d.getDate()}</span>
          </button>
        ))}
      </div>
      <p className="t-small faint" style={{ margin: 0 }}>{first} only sees that you’re free, never what else is on your calendar.</p>
      <Button kind="commit" block disabled={picked.length !== 3} onClick={send}>{picked.length === 3 ? 'Send these three' : `Name ${3 - picked.length} more`}</Button>
    </div>
  )
}

function FullSheet() {
  const { s } = useApp()
  const { toast } = useFeedback()
  const id = leadOf(s)
  const opts = optsOf(s, id)
  const v = venue(opts[0].venueId), alt = venue(opts[1]?.venueId ?? 'oriole')
  const day = new Date(opts[0].when).toLocaleDateString('en-US', { weekday: 'long' })
  const time = new Date(opts[0].when).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const [pick, setPick] = useState<number | null>(null)
  const choices = [
    { t: 'Hold 9:15 instead', d: 'Same room, later table. Held for ten minutes.', done: 'Held 9:15 PM. Ten minutes to confirm.' },
    { t: `Try ${alt.name}`, d: `${alt.kind}, ${alt.hood}. Same evening.`, done: `Asking ${alt.name} for ${time}.` },
    { t: 'Join the waitlist', d: 'I’ll tell you the moment a table opens.', done: 'On the waitlist. I’ll tell you if a table opens.' },
  ]
  return (
    <div className="stack gap-20">
      <p className="t-body pretty" style={{ margin: 0 }}>{v.name} is full at {time} on {day}. Here’s what I can do instead.</p>
      <div className="stack gap-8">
        {choices.map((c, i) => (
          <button key={c.t} className={`sy-choice ${pick === i ? 'on' : ''}`} onClick={() => { setPick(i); toast(c.done) }}>
            <span className="grow stack" style={{ gap: 2, textAlign: 'left' }}><b className="t-callout">{c.t}</b><span className="t-small muted">{c.d}</span></span>
            <span className="sy-radio">{pick === i && <Icon name="check" size={14} stroke={2.4} />}</span>
          </button>
        ))}
      </div>
      <p className="t-small faint" style={{ margin: 0 }}>Nothing is sealed until you both say yes.</p>
    </div>
  )
}

function OfflineSheet({ close }: { close: () => void }) {
  const { s } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const [st, setSt] = useState<'idle' | 'trying'>('idle')
  useEffect(() => { if (st !== 'trying') return; const t = setTimeout(() => { setSt('idle'); close(); toast('Connected again.') }, 1400); return () => clearTimeout(t) }, [st])
  const works: [IconName, string][] = [['ticket', 'Your Date Pass, saved on this phone'], ['book', 'Your Brief, once it has arrived'], ['sos', 'SOS, by text message'], ['shield', 'Guardian check-ins, by SMS']]
  return (
    <div className="stack gap-20">
      <p className="t-body pretty" style={{ margin: 0 }}>No signal right now. The things that keep you safe still work.</p>
      <div className="stack gap-12">
        <Eyebrow>Still works</Eyebrow>
        {works.map(([icon, t]) => <div key={t} className="row gap-12 t-callout"><span className="sy-ok"><Icon name={icon} size={16} /></span>{t}</div>)}
      </div>
      <div className="card-flat card-pad stack gap-4" style={{ padding: 16 }}>
        <Eyebrow>Waits for a signal</Eyebrow>
        <span className="t-callout muted">New letters and replies. Anything you write sends when you’re back.</span>
      </div>
      <div className="stack gap-8">
        {st === 'trying' ? <Waiting>Looking for a signal</Waiting> : <Button block onClick={() => setSt('trying')}>Try again</Button>}
        <Button kind="ghost" block onClick={() => { close(); nav.push('dates/pass', { id: sealedOf(s) }) }}>Open your Date Pass</Button>
      </div>
    </div>
  )
}
