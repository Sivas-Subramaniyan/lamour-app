// Shared bits for the You flow: persisted extras (under s.me.you), the "recalculating" shimmer, small marks.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useApp, type State, type ConsentKey, type Source, type ChapterId } from '../../state/store'
import { Signature, signatureModes, type Modes } from '../../design/signature'
import { Sheet, Button, Tag, useFeedback } from '../../design/ui'

export type Area = 'values' | 'social' | 'curiosity' | 'closeness' | 'stress' | 'care'
export type AreaState = 'on' | 'off' | 'forgotten'
export type LensKey = 'social' | 'curiosity' | 'stress' | 'care' | 'life' | 'numbers'

export type YouExtra = {
  areas: Partial<Record<Area, AreaState>>
  edits: Partial<Record<Area, string>>
  lens: Record<LensKey, boolean>
  foreword: number
  deleted: string[] // deleted conversations with Aura (chapter ids)
  consentLog: { key: ConsentKey; on: boolean; at: string }[]
  extraRules: string[]
  after: string // weeknight start time
  deletionAt?: string
  wildcardReminder?: boolean
}

const DEFAULTS: YouExtra = {
  areas: {}, edits: {}, lens: { social: true, curiosity: true, stress: true, care: false, life: true, numbers: false },
  foreword: 0, deleted: [], consentLog: [], extraRules: [], after: '7:30 PM',
}

const read = (s: State): YouExtra => ({ ...DEFAULTS, ...(s.me.you as Partial<YouExtra> | undefined) })

export function useYou() {
  const { s, update } = useApp()
  const set = useCallback((patch: Partial<YouExtra> | ((x: YouExtra) => Partial<YouExtra>)) =>
    update(s => {
      const cur = read(s)
      return { ...s, me: { ...s.me, you: { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) } } }
    }), [update])
  return { x: read(s), set }
}

/** The user's Signature modes, nudged by every correction so the figure visibly re-forms. */
export function myModes(s: State): Modes {
  const [n, m] = signatureModes(s.me.traits)
  const x = read(s)
  const shift = Object.values(x.areas).filter(a => a && a !== 'on').length + Object.keys(x.edits).length + s.heard.filter(h => h.status === 'struck').length
  return [n, m + (shift % 3)]
}

/** Canvas can't read CSS variables, so the Signature ink is set per theme. */
export const SIG = { day: '#9a4424', night: '#efb08a' }

/** When each finished chapter was recorded (story-world dates). */
export const CH_DATE: Partial<Record<ChapterId, string>> = {
  story: '2026-09-28', people: '2026-09-30', life: '2026-10-03', love: '2026-10-04', hard: '2026-10-07',
}
export const fmtDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

export const PERSONAL_YEAR: Record<number, { title: string; body: string }> = {
  1: { title: 'A year of beginnings', body: 'Start the thing you’ve been circling. This year rewards the first step more than the perfect one.' },
  2: { title: 'A year of patience', body: 'Things grow slowly and between people. Listen more than you push; partnership comes easier than usual.' },
  3: { title: 'A year of expression', body: 'Say it, make it, share it. Friendships and play carry more meaning than they have in a while.' },
  4: { title: 'A year of foundations', body: 'Routines, repairs, the unglamorous work that holds everything else up. Slow is fine.' },
  5: { title: 'A year of change', body: 'Plans will move. Travel, new rooms and new people come easier than they have in years.' },
  6: { title: 'A year of home and care', body: 'The people you look after ask more of you, and give more back. Let yourself be looked after too.' },
  7: { title: 'A year of reflection', body: 'Quieter and more inward. Good for study, for rest, and for noticing what you actually want.' },
  8: { title: 'A year of building', body: 'Work and the long game come into focus. Choose what deserves your effort, and say no to the rest.' },
  9: { title: 'A year of completion', body: 'Finish things. Let go of what’s done, kindly, and make room for what comes next.' },
}

export function pro(g: State['me']['gender']) {
  return g === 'woman' ? { s: 'she', S: 'She', obj: 'her', pos: 'her', Pos: 'Her', be: 'is' }
    : g === 'man' ? { s: 'he', S: 'He', obj: 'him', pos: 'his', Pos: 'His', be: 'is' }
    : { s: 'they', S: 'They', obj: 'them', pos: 'their', Pos: 'Their', be: 'are' }
}
export const posOf = (pronouns: string) => (pronouns.startsWith('he') ? 'his' : pronouns.startsWith('she') ? 'her' : 'their')

/** Show a "recalculating" moment, then a toast. */
export function useRecalc(ms = 1500) {
  const [busy, setBusy] = useState(false)
  const { toast } = useFeedback()
  const t = useRef(0)
  useEffect(() => () => clearTimeout(t.current), [])
  const run = useCallback((done: string) => {
    setBusy(true)
    clearTimeout(t.current)
    t.current = window.setTimeout(() => { setBusy(false); toast(done) }, ms)
  }, [ms, toast])
  return { busy, run }
}

export function Recalculating({ show, label = 'Recalculating your Signature…' }: { show: boolean; label?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="yu-recalc" role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
          <span className="yu-shimmer">{label}</span>
          <span className="yu-recalc-bar"><i /></span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SourceChip({ source }: { source: Source }) {
  if (source === 'You confirmed') return <Tag tone="sage" icon="check">You confirmed</Tag>
  if (source === 'Aura inferred') return <Tag tone="ember" icon="sparkle">Aura inferred</Tag>
  return <Tag icon="feather">You said</Tag>
}

export const MiniSig = ({ modes, size = 44, color }: { modes: Modes; size?: number; color: string }) =>
  <Signature layers={[{ modes, color }]} size={size} grains={Math.min(1700, Math.round(size * size * 0.22))} />

export function ConfirmSheet({ open, onClose, title, body, confirm, onConfirm, kind = 'commit', disabled, children }: {
  open: boolean; onClose: () => void; title: ReactNode; body: ReactNode; confirm: string; onConfirm: () => void
  kind?: 'commit' | 'primary' | 'ember'; disabled?: boolean; children?: ReactNode
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="stack gap-16" style={{ paddingBottom: 8 }}>
        <p className="t-body muted pretty" style={{ margin: 0 }}>{body}</p>
        {children}
        <Button kind={kind} block disabled={disabled} onClick={() => { onConfirm(); onClose() }}>{confirm}</Button>
        <Button kind="quiet" block onClick={onClose}>Not now</Button>
      </div>
    </Sheet>
  )
}
