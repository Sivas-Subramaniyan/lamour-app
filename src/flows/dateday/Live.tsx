// day/live: date mode, like a Live Activity. Elapsed time, an "All well?" check-in, Call me out, SOS, running late, I'm home.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, Button, Chip, Tag, Eyebrow, Sheet, Orb, IconButton, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useNow, patchPlan, setStage, send, fmtTime } from '../../state/store'
import { haptic } from '../../lib/voice'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { useDate, isReady, NoTable, myPron, plus, localIso, useLater, WORDS, type Ready } from './shared'

export function Live({ params }: ScreenProps) {
  const d = useDate(params)
  return isReady(d) ? <LiveBody d={d} /> : <NoTable d={d} title="Date mode" />
}

const clock = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`
}

const MOM = ['Hi sweetheart. Sorry, I know you’re out.', 'Can you call me when you get a second? It’s about Sunday.', 'Nothing’s wrong. Come home whenever you’re ready.']

function LiveBody({ d }: { d: Ready }) {
  const { s, update, id, p, plan, opt, v } = d
  const nav = useNav()
  const { toast } = useFeedback()
  const later = useLater()
  const now = useNow()
  const me = myPron(s)
  const guardian = s.guardians.find(g => g.on)?.name
  const when = new Date(opt.when)
  const checkIn = plan.checkInMins ?? 45

  // Elapsed since date mode began. The presenter can skip to the check-in.
  const [start] = useState(() => now.getTime())
  const [skip, setSkip] = useState(0)
  const secs = Math.max(0, Math.floor((now.getTime() - start) / 1000)) + skip
  const due = secs >= checkIn * 60
  useEffect(() => { if (plan.status === 'sealed') update(st => patchPlan(st, plan.id, { status: 'live' })) }, [])

  // All well?
  const [well, setWell] = useState<'ask' | 'good' | 'gone'>('ask')
  useEffect(() => { if (due && well === 'ask') haptic([20, 60, 20]) }, [due])
  const good = () => { update(st => patchPlan(st, plan.id, { checkedIn: true })); setWell('good'); later(() => setWell('gone'), 2800) }

  // Call me out
  const [call, setCall] = useState<null | 'soon' | 'ringing' | 'live'>(null)
  const [callAt, setCallAt] = useState(0)
  const callOut = () => {
    if (call) return
    setCall('soon')
    toast('Mom will call in a moment.')
    later(() => { setCall('ringing'); haptic([400, 200, 400, 200, 400]) }, 2400)
  }
  const callSecs = call === 'live' ? Math.max(0, Math.floor((now.getTime() - callAt) / 1000)) : 0

  // SOS
  const [sos, setSos] = useState(false)
  const [dialing, setDialing] = useState(false)
  const sosOn = () => { haptic([80, 40, 80]); setSos(true); setDialing(false) }
  const safe = () => { setSos(false); setDialing(false); toast(guardian ? `Glad you’re safe. ${guardian} knows too.` : 'Glad you’re safe.') }

  // Running late: confirm, then Aura calls the venue with live captions.
  const [late, setLate] = useState<null | 'pick' | 'calling' | 'done'>(null)
  const [lateMins, setLateMins] = useState(15)
  const [typed, setTyped] = useState(0)
  const [undoUntil, setUndoUntil] = useState(0)
  const held = plus(when, lateMins)
  const lateText = `${s.me.name} is running about ${lateMins} minutes late. Table held till ${fmtTime(held)}.`
  const script = [
    { who: 'Aura', text: `Hi, this is Aura calling for the ${fmtTime(when)} table under ${s.me.name}. ${me.Hes} running about ${WORDS[lateMins]} minutes late. Could you hold it until ${fmtTime(held)}?` },
    { who: v.name, text: `Of course. We’ll keep it for ${me.him} until ${fmtTime(held)}.` },
    { who: 'Aura', text: `Thank you. I’ll let ${p.first} know.` },
  ]
  const total = script.reduce((n, l) => n + l.text.length, 0)
  useEffect(() => {
    if (late !== 'calling') return
    const t = setInterval(() => setTyped(x => x + 1), 26)
    return () => clearInterval(t)
  }, [late])
  useEffect(() => {
    if (late !== 'calling' || typed < total + 40) return
    update(st => patchPlan(send(st, id, { from: 'aura', kind: 'system', text: lateText }, localIso(now)), plan.id, { lateNotice: true }))
    setLate('done')
    setUndoUntil(Date.now() + 10000)
    haptic(15)
  }, [typed, late])
  const undoLeft = Math.max(0, Math.ceil((undoUntil - Date.now()) / 1000))
  const undo = () => {
    update(st => patchPlan({ ...st, messages: { ...st.messages, [id]: (st.messages[id] ?? []).filter(m => m.text !== lateText) } }, plan.id, { lateNotice: false }))
    setLate(null); setUndoUntil(0)
    toast(`Undone. Nothing went to ${p.first}.`)
  }
  const closeLate = () => {
    if (late === 'calling') toast('Call cancelled. Nothing was sent.')
    setLate(null); setTyped(0)
  }

  // I'm home
  const [home, setHome] = useState(false)
  const goHome = () => {
    setHome(true)
    haptic(12)
    later(() => {
      update(st => ({ ...setStage(patchPlan(st, plan.id, { status: 'done', checkedIn: true }), id, 'met'), phase: 'morning-after' }))
      nav.replace('after/morning', { id })
    }, 2600)
  }

  const r = 104, c = 2 * Math.PI * r, frac = Math.min(1, secs / (checkIn * 60))

  return (
    <Screen
      top={
        <div className="topbar">
          <div className="dd-activity"><span className="dd-pulse" /> Date mode · <span className="t-num">{clock(secs)}</span></div>
          <div className="grow" />
          <IconButton icon="shieldCheck" label="Guardian Circle" onClick={() => nav.push('day/guardian', { id })} />
        </div>
      }
      footer={<Button kind="soft" block icon="moon" onClick={goHome}>I’m home</Button>}>
      <div className="pad stack gap-24" style={{ paddingTop: 8 }}>
        <div className="stack gap-12" style={{ alignItems: 'center' }}>
          <div className="dd-dial">
            <svg viewBox="0 0 236 236" width="236" height="236" aria-hidden="true">
              <circle cx="118" cy="118" r={r} fill="none" stroke="var(--line)" strokeWidth="2" />
              <motion.circle cx="118" cy="118" r={r} fill="none" stroke={due ? '#9cc596' : 'var(--accent)'} strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - frac) }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            </svg>
            <div className="stack center" style={{ alignItems: 'center', gap: 4 }}>
              <Eyebrow>Together</Eyebrow>
              <span className="dd-clock">{clock(secs)}</span>
              <span className="t-small faint">since {fmtTime(new Date(start))}</span>
            </div>
          </div>
          <div className="stack center" style={{ alignItems: 'center', gap: 4 }}>
            <span className="t-head">With <span className="i">{p.first}</span></span>
            <span className="t-callout muted">{v.name} · {v.hood} · table at <span className="t-num">{fmtTime(when)}</span></span>
            {plan.lateNotice && <Tag tone="ember" icon="clock">Table held till {fmtTime(held)} · {p.first} knows</Tag>}
          </div>
          {!due && <button className="dd-skip" onClick={() => setSkip(checkIn * 60 - (secs - skip))}>Presenter: skip to {checkIn} min</button>}
        </div>

        <AnimatePresence>
          {due && well !== 'gone' && (
            <motion.div key="well" className="card card-aura card-pad stack gap-16" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: -24 }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} style={{ overflow: 'hidden' }}>
              {well === 'ask' ? (
                <>
                  <div className="stack gap-4">
                    <Eyebrow>{checkIn} minutes in</Eyebrow>
                    <span className="t-head">All well?</span>
                    <span className="t-small muted">Only you see this. {guardian ? `${guardian} hears nothing unless you ask.` : 'No one hears anything unless you ask.'}</span>
                  </div>
                  <div className="row gap-8">
                    <button className="btn btn-md dd-btn-sage" style={{ flex: 1 }} onClick={good}><Icon name="check" size={18} /> I’m good</button>
                    <Button kind="ghost" size="md" style={{ flex: 1 }} onClick={callOut}>Call me out</Button>
                  </div>
                  <HoldSOS compact onDone={sosOn} onTap={() => toast('Hold for two seconds to send SOS.')} />
                </>
              ) : (
                <div className="row gap-12"><span className="dd-check"><Icon name="check" size={18} stroke={2} /></span><span className="t-callout">Glad. {guardian ? `${guardian} won’t hear a thing.` : 'Enjoy the rest of it.'}</span></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="dd-tiles">
          <button className="dd-tile" onClick={() => { setLate('pick'); setTyped(0) }}>
            <Icon name="clock" size={22} /><b>Running late</b><span>Aura calls the venue</span>
          </button>
          <button className="dd-tile" onClick={callOut} disabled={!!call}>
            <Icon name="phone" size={22} /><b>{call === 'soon' ? 'Calling soon…' : 'Call me out'}</b><span>A call from Mom, on cue</span>
          </button>
        </div>

        <button className="dd-share" onClick={() => nav.push('day/guardian', { id })}>
          <span className="dd-pulse" />
          <span className="grow stack" style={{ gap: 2, textAlign: 'left' }}>
            <span style={{ fontWeight: 550 }}>{guardian ? `${guardian} can see where you are` : 'No one in your circle is on'}</span>
            <span className="t-small muted">{guardian ? `Until ${fmtTime(plus(when, 180))}, then it stops on its own` : 'Add someone you trust'}</span>
          </span>
          <Icon name="chevron" size={18} style={{ color: 'var(--ink-3)' }} />
        </button>

        <HoldSOS onDone={sosOn} onTap={() => toast('Hold for two seconds to send SOS.')} guardian={guardian} />
      </div>

      {/* Call me out: a full-screen incoming call */}
      <AnimatePresence>
        {(call === 'ringing' || call === 'live') && (
          <motion.div className="dd-call" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <div className="stack center" style={{ alignItems: 'center', gap: 10 }}>
              <span className="dd-call-sub">{call === 'ringing' ? 'mobile' : clock(callSecs)}</span>
              <div className="dd-call-name">Mom</div>
              <motion.div className="dd-call-avatar" animate={call === 'ringing' ? { scale: [1, 1.04, 1] } : { scale: 1 }} transition={{ duration: 1.4, repeat: call === 'ringing' ? Infinity : 0 }}>M</motion.div>
            </div>
            <div className="grow stack gap-12" style={{ justifyContent: 'center', width: '100%' }}>
              {call === 'live' && MOM.map((line, i) => (
                <motion.p key={i} className="dd-call-line" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 2.2, duration: 0.5 }}>“{line}”</motion.p>
              ))}
            </div>
            {call === 'ringing' ? (
              <div className="dd-call-actions">
                <button className="dd-call-btn no" aria-label="Decline" onClick={() => { setCall(null); toast('Declined. Call me out is here if you need it.') }}><Icon name="phone" size={28} fill style={{ transform: 'rotate(135deg)' }} /></button>
                <button className="dd-call-btn yes" aria-label="Accept" onClick={() => { setCall('live'); setCallAt(now.getTime()) }}><Icon name="phone" size={28} fill /></button>
              </div>
            ) : (
              <div className="dd-call-actions one">
                <button className="dd-call-btn no" aria-label="End call" onClick={() => { setCall(null); toast('Call ended.') }}><Icon name="phone" size={28} fill style={{ transform: 'rotate(135deg)' }} /></button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* I'm home */}
      <AnimatePresence>
        {home && (
          <motion.div className="dd-home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }} className="stack gap-16 center" style={{ alignItems: 'center' }}>
              <Icon name="moon" size={30} style={{ color: 'var(--accent)' }} />
              <span className="t-title i">Glad you’re home.</span>
              <span className="t-callout muted balance">Sleep well. I’ll ask about tonight at 10, not before.</span>
              <Tag tone="sage" icon="check">Location sharing stopped</Tag>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={sos} onClose={() => { setSos(false); setDialing(false) }}>
        <div className="stack gap-20" style={{ paddingTop: 8 }}>
          <div className="row gap-12">
            <span className="dd-pulse big" />
            <div className="stack" style={{ gap: 2 }}>
              <b style={{ fontSize: 17 }}>Sharing your live location{guardian ? ` with ${guardian}` : ''}</b>
              <span className="t-small muted">Updated every 30 seconds until you say you’re safe.</span>
            </div>
          </div>
          <Button kind="danger" block icon="phone" style={{ height: 68, fontSize: 19 }} onClick={() => setDialing(true)}>{dialing ? 'Calling 911…' : 'Call 911'}</Button>
          {dialing && <span className="t-small faint center">Prototype: no call is placed.</span>}
          <Button kind="ghost" block onClick={safe}>I’m safe now</Button>
        </div>
      </Sheet>

      <Sheet open={!!late} onClose={closeLate} title={late === 'pick' ? 'Running late?' : late === 'calling' ? `Aura is calling ${v.name}` : 'Table held'}>
        {late === 'pick' && (
          <div className="stack gap-20">
            <span className="t-callout muted">Aura calls {v.name} to hold the table, then tells {p.first}. Nothing goes out until you tap.</span>
            <div className="row gap-8">{[10, 15, 20].map(m => <Chip key={m} on={lateMins === m} onClick={() => setLateMins(m)}>{m} min</Chip>)}</div>
            <Button kind="ember" block icon="phone" onClick={() => { setTyped(0); setLate('calling') }}>Ask Aura to call</Button>
          </div>
        )}
        {late === 'calling' && (
          <div className="stack gap-16">
            <div className="row gap-12"><Orb size={36} level={0.3 + 0.2 * Math.sin(typed / 6)} /><span className="t-small faint">Live captions</span></div>
            <div className="stack gap-12" aria-live="polite">
              {script.map((l, i) => {
                const off = script.slice(0, i).reduce((n, x) => n + x.text.length, 0)
                const shown = l.text.slice(0, Math.max(0, typed - off))
                if (!shown) return null
                return (
                  <div key={i} className="stack gap-4">
                    <span className="t-label faint">{l.who}</span>
                    <span className={`dd-cap ${l.who === 'Aura' ? 'aura' : ''}`}>{shown}{shown.length < l.text.length && <i className="dd-caret" />}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {late === 'done' && (
          <div className="stack gap-20">
            <div className="row gap-12"><span className="dd-check"><Icon name="check" size={18} stroke={2} /></span><span className="serif" style={{ fontSize: 22 }}>Table held till {fmtTime(held)}. {p.first} knows.</span></div>
            <span className="t-small muted">Aura’s note to {p.first}: “{lateText}”</span>
            <div className="row gap-8">
              {undoLeft > 0 && (
                <Button kind="ghost" style={{ flex: 1 }} onClick={undo}>
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9" fill="none" stroke="var(--line-2)" strokeWidth="2" />
                    <motion.circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={56.5} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: 56.5 }} transition={{ duration: 10, ease: 'linear' }} style={{ rotate: -90, transformOrigin: '50% 50%' }} /></svg>
                  Undo · {undoLeft}
                </Button>
              )}
              <Button kind="primary" style={{ flex: 1 }} onClick={() => setLate(null)}>Done</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}

/** Press and hold for two seconds. A quick tap only shows a hint, so SOS can't fire by accident. */
function HoldSOS({ onDone, onTap, compact, guardian }: { onDone: () => void; onTap: () => void; compact?: boolean; guardian?: string }) {
  const [pr, setPr] = useState(0)
  const raf = useRef(0), cur = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const begin = () => {
    if (raf.current) return
    const t0 = performance.now()
    const loop = () => {
      const x = Math.min(1, (performance.now() - t0) / 2000)
      cur.current = x; setPr(x)
      if (x >= 1) { raf.current = 0; setPr(0); onDone(); return }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }
  const end = () => {
    if (!raf.current) return
    cancelAnimationFrame(raf.current); raf.current = 0
    if (cur.current < 0.15) onTap()
    setPr(0)
  }
  const rr = compact ? 15 : 24, cc = 2 * Math.PI * rr
  return (
    <button className={`dd-sos ${compact ? 'compact' : ''}`} aria-label="SOS. Press and hold for two seconds."
      onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end} onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin() } }} onKeyUp={end}>
      <span className="dd-sos-ring" style={{ width: rr * 2 + 8, height: rr * 2 + 8 }}>
        <svg viewBox={`0 0 ${rr * 2 + 8} ${rr * 2 + 8}`} aria-hidden="true">
          <circle cx={rr + 4} cy={rr + 4} r={rr} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
          <circle cx={rr + 4} cy={rr + 4} r={rr} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray={cc} strokeDashoffset={cc * (1 - pr)} />
        </svg>
        <b>SOS</b>
      </span>
      <span className="grow stack" style={{ gap: 2, textAlign: 'left' }}>
        <b style={{ fontSize: compact ? 14.5 : 16 }}>{pr > 0 ? 'Keep holding…' : 'Hold for SOS'}</b>
        {!compact && <span style={{ fontSize: 13, opacity: 0.85 }}>Shares your location{guardian ? ` with ${guardian}` : ''} and puts 911 one tap away</span>}
      </span>
    </button>
  )
}
