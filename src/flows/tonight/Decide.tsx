// tonight/decide: Lean in, Not tonight, or Hold. tonight/introduced: both leaned in; two Signatures meet and a chair fills.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, IconButton, Eyebrow, Portrait, Chip, WaxSeal, Countdown, useFeedback } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { Signature, signatureModes } from '../../design/signature'
import { useNow, decide, introduce, openChairs, connection, PHASE_TIME, type Decision } from '../../state/store'
import { useNav } from '../../shell/nav'
import { PERSONAS } from '../../data/personas'
import { chime, haptic } from '../../lib/voice'
import { ROMAN, ME_COLOR, THEM_COLOR, Chair, usePerson, realPages, useBack, localIso } from './parts'

const EASE = [0.22, 1, 0.36, 1] as const
const REASONS = ['Life plans differ', 'Not drawn to them', 'Too far', 'Timing isn’t right', 'Something else']
const NOTE_MAX = 90

export function Decide({ params }: { params: Record<string, any> }) {
  const { s, update, id, p, idx, age, fit, pr } = usePerson(params)
  const nav = useNav()
  const fb = useFeedback()
  const back = useBack()
  const pre = (['lean', 'not', 'hold'] as Decision[]).includes(params.choice) ? (params.choice as Decision) : undefined
  const conn = connection(s, id)
  const full = openChairs(s) === 0 && !conn
  const holdingOther = s.tonight.ids.find(x => x !== id && s.tonight.decisions[x] === 'hold' && !connection(s, x))
  const [choice, setChoice] = useState<Decision | undefined>(pre === 'lean' && full ? undefined : pre === 'hold' && holdingOther ? undefined : pre)
  const [page, setPage] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [reasons, setReasons] = useState<string[]>(s.tonight.decisions[id] === 'not' ? s.tonight.reasons[id] ?? [] : [])
  const [stage, setStage] = useState<'choose' | 'sealing' | 'waiting'>('choose')
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const pages = realPages(p)

  const leanIn = () => {
    const n = page && note.trim() ? [`Note on “${page}”: ${note.trim()}`] : []
    update(st => decide(st, id, 'lean', n))
    haptic([10, 30, 14])
    setStage('sealing')
    const mutual = id === s.tonight.ids[0] || fit.band !== 'Exploratory'
    timers.current.push(window.setTimeout(() => {
      if (mutual) {
        update(st => introduce(st, id))
        fb.banner({ title: 'You both leaned in', body: `Meet ${p.first}.` })
        nav.replace('tonight/introduced', { id })
      } else {
        setStage('waiting')
        timers.current.push(window.setTimeout(() => nav.reset('tonight/deck'), 3200))
      }
    }, 1800))
  }
  const notTonight = () => {
    update(st => decide(st, id, 'not', reasons))
    fb.toast('Noted. Aura will remember why.')
    back()
  }
  const hold = () => {
    update(st => decide(st, id, 'hold'))
    fb.toast(`Held. ${p.first} stays in your letter until dusk tomorrow.`)
    back()
  }

  if (stage !== 'choose') return (
    <Screen className="tn-ink" top={<TopBar left={<span />} />}>
      <div className="pad stack gap-24" style={{ alignItems: 'center', paddingTop: 60 }}>
        <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
          <div className="tn-glow" style={{ width: 260, height: 260 }} />
          <WaxSeal text={`${s.me.name.charAt(0)}·${p.first.charAt(0)}`} size={132} />
        </div>
        <AnimatePresence mode="wait">
          {stage === 'sealing' ? (
            <motion.div key="seal" className="stack gap-8 center" style={{ alignItems: 'center' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
              <span className="t-title">You leaned in.</span>
              <span className="serif i muted" style={{ fontSize: 20 }}>Sealed. Nothing is sent unless it’s mutual.</span>
              <span className="tn-typing" style={{ marginTop: 8 }} aria-label="Waiting"><i /><i /><i /></span>
            </motion.div>
          ) : (
            <motion.div key="wait" className="stack gap-16 center" style={{ alignItems: 'center' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="t-title balance">We’ll tell you only if it’s mutual.</span>
              <span className="t-callout muted pretty" style={{ maxWidth: 300 }}>{p.first} reads {pr.adj} own letter tonight. If {pr.subj} lean{pr.subj === 'they' ? '' : 's'} in too, you’ll hear from me first.</span>
              <Button kind="ghost" onClick={() => nav.reset('tonight/deck')}>Back to tonight’s letter</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Screen>
  )

  const footer = conn ? (
    <Button kind="commit" block icon="message" onClick={() => nav.replace('conn/chat', { id })}>Write to {p.first}</Button>
  ) : choice === 'lean' ? (
    <Button kind="commit" block icon="heart" onClick={leanIn} disabled={full}>Lean in</Button>
  ) : choice === 'not' ? (
    <Button kind="primary" block onClick={notTonight}>Not tonight</Button>
  ) : choice === 'hold' ? (
    <Button kind="soft" block icon="hourglass" onClick={hold}>Hold until tomorrow</Button>
  ) : (
    <Button kind="soft" block disabled>Choose one</Button>
  )

  return (
    <Screen className="tn-ink" top={<TopBar left={<IconButton icon="close" label="Close" onClick={back} />} title="Your decision" />} footer={footer}>
      <div className="pad stack gap-24">
        <div className="row gap-16">
          <Portrait photo={p.photos.portrait} name={p.first} shape="arch" w={64} h={82} />
          <div className="stack gap-4 grow">
            <Eyebrow>{idx >= 0 ? `Introduction ${ROMAN[idx]}` : 'An introduction'}</Eyebrow>
            <span className="t-head">{p.first}, {age}</span>
            <span className="serif i muted" style={{ fontSize: 18, lineHeight: 1.25 }}>They’ll only know if you both lean in.</span>
          </div>
        </div>

        {conn ? (
          <div className="card-flat card-pad stack gap-8" style={{ padding: 16 }}>
            <span className="t-callout">You and {p.first} are already introduced. Your chair is set.</span>
          </div>
        ) : (
          <div className="stack gap-12" role="radiogroup" aria-label="Your decision">
            <Choice kind="lean" icon="heart" title="Lean in" sub={full ? 'Your three chairs are full tonight.' : `If ${p.first} leans in too, you’re introduced and a chair fills.`}
              on={choice === 'lean'} disabled={full} onPick={() => setChoice('lean')}>
              {full ? (
                <div className="stack gap-12">
                  <span className="t-callout muted pretty">Lean-ins wait for a free chair, so nobody is left hanging. Close a conversation kindly to make room, then come back. {p.first} stays in your letter until dusk tomorrow.</span>
                  <Button kind="ghost" size="sm" onClick={() => nav.goTab('table')} style={{ alignSelf: 'flex-start' }}>Go to your table</Button>
                </div>
              ) : pages.length > 0 && (
                <div className="stack gap-12">
                  <span className="t-label faint">Add a note to one of {pr.adj} pages · optional</span>
                  <div className="row gap-8 wrap">
                    {pages.map(pg => <Chip key={pg.label} size="sm" on={page === pg.label} onClick={() => setPage(x => (x === pg.label ? null : pg.label))}>{pg.label}</Chip>)}
                  </div>
                  <AnimatePresence>
                    {page && (
                      <motion.div className="stack gap-8" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }} style={{ overflow: 'hidden' }}>
                        <span className="serif i muted" style={{ fontSize: 17 }}>“{pages.find(x => x.label === page)?.text}”</span>
                        <input className="input" value={note} maxLength={NOTE_MAX} placeholder="One line, in your words" aria-label={`Your note on ${page}`} onChange={e => setNote(e.target.value)} />
                        <span className="row between t-small faint"><span>Written by you. Aura never adds to it.</span><span className="t-num">{note.length}/{NOTE_MAX}</span></span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </Choice>

            <Choice kind="not" icon="close" title="Not tonight" sub="Quietly, with or without a reason." on={choice === 'not'} onPick={() => setChoice('not')}>
              <div className="stack gap-12">
                <div className="row gap-8 wrap">
                  {REASONS.map(r => <Chip key={r} size="sm" on={reasons.includes(r)} onClick={() => setReasons(x => (x.includes(r) ? x.filter(y => y !== r) : [...x, r]))}>{r}</Chip>)}
                </div>
                <span className="row gap-8 t-small muted"><Icon name="eyeOff" size={15} />This only teaches Aura. They’ll never know.</span>
              </div>
            </Choice>

            <Choice kind="hold" icon="hourglass" title="Hold until tomorrow" sub={holdingOther ? `You’re already holding ${PERSONAS[holdingOther].first}. One hold per letter.` : 'One hold per letter.'}
              on={choice === 'hold'} disabled={!!holdingOther} onPick={() => setChoice('hold')}>
              <span className="t-callout muted pretty">{p.first} stays in your letter until dusk tomorrow. Nothing is sent; you decide with a clear head.</span>
            </Choice>
          </div>
        )}
      </div>
    </Screen>
  )
}

function Choice({ kind, icon, title, sub, on, disabled, onPick, children }: {
  kind: Decision; icon: IconName; title: string; sub: string; on: boolean; disabled?: boolean; onPick: () => void; children?: ReactNode
}) {
  return (
    <div className={`tn-choice ${kind} ${on ? 'on' : ''} ${disabled ? 'off' : ''}`}>
      <button className="tn-choice-head" role="radio" aria-checked={on} aria-disabled={disabled} onClick={disabled ? undefined : onPick}>
        <span className="tn-choice-ico"><Icon name={icon} size={20} /></span>
        <span className="grow stack" style={{ gap: 2 }}>
          <span className="serif" style={{ fontSize: 24, lineHeight: 1.1 }}>{title}</span>
          <span className="t-small muted">{sub}</span>
        </span>
        <span className="tn-radio" />
      </button>
      <AnimatePresence initial={false}>
        {(on || (disabled && kind === 'lean')) && children && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} style={{ overflow: 'hidden' }}>
            <div className="tn-choice-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- tonight/introduced ----------

export function Introduced({ params }: { params: Record<string, any> }) {
  const { s, update, id, p, pr } = usePerson(params)
  const nav = useNav()
  const now = useNow()
  const [locked, setLocked] = useState(false)
  // Arriving here from the presenter path means you both leaned in: make the story true if it isn't yet.
  useEffect(() => {
    update(st => (connection(st, id) || openChairs(st) === 0 ? st : introduce(st.tonight.decisions[id] === 'lean' ? st : decide(st, id, 'lean'), id)))
    const t = setTimeout(() => { setLocked(true); chime(); haptic([12, 30, 18]) }, 1750)
    return () => clearTimeout(t)
  }, [id, update])

  const conn = connection(s, id)
  const until = localIso(new Date(conn?.since ?? PHASE_TIME.dusk).getTime() + 72 * 3600e3)
  const active = s.connections.filter(c => !['closed', 'lapsed', 'debriefed'].includes(c.stage))
  const mine = active.findIndex(c => c.id === id)
  const note = (s.tonight.reasons[id] ?? []).find(r => r.startsWith('Note on'))

  return (
    <Screen className="tn-ink" top={<TopBar left={<IconButton icon="close" label="Back to tonight’s letter" onClick={() => nav.reset('tonight/deck')} />} />}
      footer={
        <motion.div className="stack gap-8" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4, duration: 0.7, ease: EASE }}>
          <Button kind="commit" block icon="mic" onClick={() => nav.push('conn/hello', { id })}>Record a voice hello</Button>
          <Button kind="ghost" block icon="book" onClick={() => nav.push('conn/bridge', { id })}>Read your Bridge Brief</Button>
          <Button kind="quiet" block onClick={() => nav.push('conn/chat', { id })}>Write first</Button>
        </motion.div>
      }>
      <div className="pad stack gap-24" style={{ alignItems: 'center' }}>
        <motion.div className="stack gap-8 center" style={{ alignItems: 'center' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
          <Eyebrow>You both leaned in</Eyebrow>
          <h1 className="t-display balance" style={{ margin: 0 }}>{s.me.name}, <span className="i">meet {p.first}.</span></h1>
        </motion.div>

        <div className="tn-meet" aria-label={`Your Signature and ${p.first}’s, meeting`} role="img">
          <motion.div className="tn-glow" style={{ position: 'absolute', inset: -10, width: 'auto', height: 'auto' }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: locked ? 1 : 0.25, scale: locked ? 1 : 0.8 }} transition={{ duration: 1.2, ease: EASE }} />
          <motion.div className="tn-meet-fig" initial={{ x: -96, opacity: 0 }} animate={{ x: -36, opacity: 1 }} transition={{ duration: 1.7, ease: EASE }}>
            <Signature layers={[{ modes: signatureModes(s.me.traits), color: ME_COLOR }]} size={168} grains={950} />
          </motion.div>
          <motion.div className="tn-meet-fig" initial={{ x: 96, opacity: 0 }} animate={{ x: 36, opacity: 1 }} transition={{ duration: 1.7, ease: EASE }}>
            <Signature layers={[{ modes: signatureModes(p.traits), color: THEM_COLOR }]} size={168} grains={950} />
          </motion.div>
          <svg className="tn-meet-ring" viewBox="0 0 300 260" aria-hidden="true">
            <motion.circle cx="150" cy="130" r="122" fill="none" stroke="var(--ember)" strokeWidth="1.4" strokeLinecap="round" transform="rotate(-90 150 130)"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: locked ? 1 : 0, opacity: locked ? 1 : 0 }} transition={{ duration: 1.1, ease: EASE }} />
            <motion.circle cx="150" cy="130" r="128" fill="none" stroke="var(--ember)" strokeWidth=".6" initial={{ opacity: 0 }} animate={{ opacity: locked ? 0.35 : 0 }} transition={{ delay: 0.6, duration: 1 }} />
          </svg>
          <span className="tn-meet-name l t-small faint">{s.me.name}</span>
          <span className="tn-meet-name r t-small faint">{p.first}</span>
        </div>

        <div className="stack gap-8" style={{ alignItems: 'center' }}>
          <div className="row gap-16">
            {[0, 1, 2].map(i => <Chair key={i} size={30} filled={i < active.length} animate={i === mine} delay={i === mine ? 2.1 : 0} />)}
          </div>
          <span className="t-small muted">{mine >= 0 ? `A chair is set for you two. ${3 - active.length === 0 ? 'Your table is full.' : `${3 - active.length} left open.`}` : 'A chair will be set when one is free.'}</span>
        </div>

        <motion.div className="card card-pad stack gap-8 center" style={{ alignItems: 'center', width: '100%' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 0.8, ease: EASE }}>
          <span className="t-head">Your 72 hours start now</span>
          <span className="tn-dusk-count" style={{ fontSize: 34 }}><Countdown to={until} now={now} /></span>
          <span className="t-small muted pretty" style={{ maxWidth: 280 }}>to say hello. Voice first is warmer, but writing is fine. If neither of you does, the chair opens again, kindly.</span>
          {note && <span className="serif i muted" style={{ fontSize: 17 }}>{note.replace(/^Note on (“[^”]+”):/, `Your note on ${pr.adj} page $1 is waiting for ${pr.obj}:`)}</span>}
        </motion.div>
      </div>
    </Screen>
  )
}
