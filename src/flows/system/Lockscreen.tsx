// sys/lockscreen: a week of L'Amour as it reaches your lock screen. Discreet swaps every card for a nameless one.
// Tapping a card moves the demo story to that card's moment, then opens the screen it points to.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, Orb, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, useNow, goToPhase, decide, introduce, startPlan, patchPlan, setStage, planWith, planById, proposalsFor, fmtTime, type State } from '../../state/store'
import { CAST, PERSONAS } from '../../data/personas'
import { venue } from '../../data/venues'
import { TEXTURES } from '../../data/photos'
import { useNav } from '../../shell/nav'
import type { ScreenId } from '../../shell/screens'
import { haptic } from '../../lib/voice'

/** Move the lead's story forward far enough for the target screen to have data. Never moves it back. */
function advance(st: State, id: string, to: 'introduced' | 'planning' | 'sealed'): State {
  let n = st.phase === 'afternoon' ? goToPhase(st, 'dusk') : st
  if (!n.tonight.decisions[id]) n = decide(n, id, 'lean')
  n = introduce(n, id)
  if (to === 'introduced') return n
  let p = planWith(n, id)
  if (!p) { const r = startPlan(n, id, proposalsFor(n, id)); n = r.s; p = planById(n, r.planId)! }
  if (to === 'sealed' && !['sealed', 'live', 'done'].includes(p.status)) n = setStage(patchPlan(n, p.id, { chosen: p.chosen ?? 1, mySeal: true, theirSeal: true, status: 'sealed' }), id, 'sealed')
  return n
}

type Card = { key: string; when: string; title: string; body: string; quiet: [string, string]; go: () => void; check?: boolean }
const SHOWN = 3
const ease = [0.22, 1, 0.36, 1] as const

export function Lockscreen() {
  const { s, update } = useApp()
  const nav = useNav()
  const now = useNow(1000)
  const { toast } = useFeedback()
  const [all, setAll] = useState(false)
  const [good, setGood] = useState(false)
  const [wallOk, setWallOk] = useState(true)
  const hide = s.discreet.hideNames

  const lead = s.tonight.ids[0]
  const L = PERSONAS[lead]
  const turnId = s.connections.find(c => c.stage === 'talking' && c.yourTurnUntil)?.id ?? CAST[s.me.seeking].yourTurn
  const turn = s.connections.find(c => c.id === turnId)
  const hoursLeft = turn?.yourTurnUntil ? Math.max(1, Math.round((new Date(turn.yourTurnUntil).getTime() - now.getTime()) / 3600e3)) : 31
  const plan = planWith(s, lead)
  const opts = plan?.options ?? proposalsFor(s, lead)
  const hold = opts[0], sealed = opts[plan?.chosen ?? 1] ?? opts[0]
  const hv = venue(hold.venueId), sv = venue(sealed.venueId)
  const guardian = s.guardians.find(g => g.on)?.name
  const count = ['No', 'One', 'Two', 'Three'][s.tonight.ids.length] ?? 'Three'

  const jump = (fn: (st: State) => State, id: ScreenId, params?: Record<string, any>) => { haptic(8); update(fn); nav.reset(id, params) }
  const same = (st: State) => st

  const cards: Card[] = [
    { key: 'letter', when: 'Wed 6:17 PM', title: 'Your evening letter is here', body: `${count} introductions, chosen tonight. Yours until tomorrow’s dusk.`, quiet: ['Something arrived for you', 'Open L’Amour to read it.'],
      go: () => jump(st => (st.phase === 'afternoon' ? goToPhase(st, 'dusk') : st), 'tonight/letter') },
    { key: 'leaned', when: 'Wed 6:48 PM', title: 'You both leaned in', body: `Meet ${L.first}. Your Bridge Brief is ready.`, quiet: ['Something arrived for you', 'Good news, waiting inside.'],
      go: () => jump(st => advance(st, lead, 'introduced'), 'tonight/introduced', { id: lead }) },
    { key: 'minutes', when: 'Thu 11:20 AM', title: 'The minutes are in', body: `Three evenings agreed with ${L.first}’s side. Two small things are left for you two.`, quiet: ['An update on your plans', 'Open L’Amour to read it.'],
      go: () => jump(st => advance(st, lead, 'planning'), 'dates/minutes', { id: lead }) },
    { key: 'hold', when: 'Thu 11:35 AM', title: 'Your table hold ends in 5 minutes', body: `${hv.name}, ${new Date(hold.when).toLocaleDateString('en-US', { weekday: 'short' })} ${fmtTime(hold.when)}. Choose it, or Aura lets it go.`, quiet: ['A hold ends soon', 'Five minutes left to choose.'],
      go: () => jump(st => advance(st, lead, 'planning'), 'dates/proposals', { id: lead }) },
    { key: 'sealed', when: 'Thu 11:41 AM', title: `${new Date(sealed.when).toLocaleDateString('en-US', { weekday: 'long' })} is sealed`, body: `${sv.name}, ${fmtTime(sealed.when)}. Your Date Pass is ready.`, quiet: ['Your plans are confirmed', 'Your pass is ready inside.'],
      go: () => jump(st => advance(st, lead, 'sealed'), 'dates/pass', { id: lead }) },
    { key: 'brief', when: 'Sat 5:30 PM', title: 'Your Brief is ready', body: `Two hours until ${sv.name}. Three things worth asking ${L.first}.`, quiet: ['Your evening, in brief', 'Ready when you are.'],
      go: () => jump(st => goToPhase(st, 'date-night'), 'day/brief', { id: lead }) },
    { key: 'allwell', when: 'Sat 8:15 PM', title: 'All well?', body: good ? `Glad. ${hide ? 'Nobody' : guardian ?? 'Your circle'} won’t hear a thing.` : 'Forty-five minutes in. One tap, and Aura goes quiet again.',
      quiet: ['All well?', good ? 'Glad. Nobody will hear a thing.' : 'One tap, and we go quiet again.'], check: !good,
      go: () => jump(st => goToPhase(st, 'date-night'), 'day/live', { id: lead }) },
    { key: 'morning', when: 'Sun 10:00 AM', title: 'Good morning. How was last night?', body: 'Two minutes, whenever you like. Only you will see it.', quiet: ['Good morning', 'Two minutes, whenever you like.'],
      go: () => jump(st => goToPhase(st, 'morning-after'), 'after/morning', { id: lead }) },
    { key: 'almanac', when: 'Sun 6:00 PM', title: 'Your Sunday Almanac', body: 'You said ambitious. You kept choosing kind.', quiet: ['Your week, in a page', 'Ready when you are.'],
      go: () => jump(same, 'you/memory') },
    { key: 'turn', when: 'Wed 5:30 PM', title: `Your turn with ${PERSONAS[turnId].first}`, body: `${hoursLeft} hours left to reply. No pressure, just a nudge.`, quiet: ['It’s your turn', 'Someone is waiting on a reply.'],
      go: () => jump(same, 'conn/chat', { id: turnId }) },
  ]
  const shown = all ? cards : cards.slice(0, SHOWN)
  const rest = cards.length - SHOWN

  const toggleHide = () => {
    update(st => ({ ...st, discreet: { ...st.discreet, hideNames: !st.discreet.hideNames } }))
    toast(hide ? 'Names will show on your lock screen.' : 'Discreet. No names on your lock screen.')
  }

  return (
    <Screen bleed className="sy-lock" top={
      <div className="sy-wall" aria-hidden="true">
        {wallOk && <img src={TEXTURES[3].url} alt="" onError={() => setWallOk(false)} />}
        <i />
      </div>
    }>
      <div className="pad stack" style={{ paddingTop: 'calc(var(--safe-top, 54px) + 6px)', paddingBottom: 8, minHeight: 'calc(100% - var(--safe-bottom, 34px) - 12px)' }}>
        <div className="row between">
          <span className="sy-lock-ico"><Icon name="lock" size={16} /></span>
          <button className={`sy-pill ${hide ? 'on' : ''}`} aria-pressed={hide} onClick={toggleHide}>
            <Icon name={hide ? 'eyeOff' : 'eye'} size={15} /> Discreet {hide ? 'on' : 'off'}
          </button>
        </div>

        <motion.div className="sy-clock-wrap" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
          <div className="sy-date">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div className="sy-clock">{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ [AP]M/, '')}</div>
        </motion.div>

        <div className="stack gap-8">
          <AnimatePresence>
            {shown.map((c, i) => (
              <motion.div key={c.key} layout className="sy-card" role="button" tabIndex={0} onClick={c.go} onKeyDown={e => e.key === 'Enter' && c.go()}
                initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
                transition={{ delay: all && i >= SHOWN ? (i - SHOWN) * 0.06 : 0.3 + i * 0.12, duration: 0.5, ease, layout: { duration: 0.35, ease } }}>
                <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                  <span className="sy-app"><Orb size={18} /></span>
                  <div className="grow stack" style={{ gap: 1 }}>
                    <div className="row between gap-8">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.b key={`${hide}${c.title}`} className="sy-card-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{hide ? c.quiet[0] : c.title}</motion.b>
                      </AnimatePresence>
                      <span className="sy-when">{c.when}</span>
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={`${hide}${c.body}`} className="sy-card-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{hide ? c.quiet[1] : c.body}</motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                {c.check && (
                  <div className="sy-actions">
                    <button onClick={e => { e.stopPropagation(); haptic(10); setGood(true) }}>I’m good</button>
                    <button onClick={e => { e.stopPropagation(); jump(st => goToPhase(st, 'date-night'), 'day/live', { id: lead, callout: 1 }) }}>Call me out</button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {!all ? (
            <motion.button layout className="sy-pile" onClick={() => setAll(true)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
              <span className="sy-pile-a" /><span className="sy-pile-b" />
              <span className="sy-pile-label">{rest} more from L’Amour</span>
            </motion.button>
          ) : (
            <motion.button layout className="sy-less" onClick={() => setAll(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Show less</motion.button>
          )}
        </div>

        <div className="grow" />
        <button className="sy-open" onClick={() => nav.goTab('tonight')}>Open L’Amour</button>
      </div>
    </Screen>
  )
}
