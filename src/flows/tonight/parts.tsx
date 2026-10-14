// Small pieces shared by the Tonight screens. Everything reads from data; names are never hardcoded.
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Button } from '../../design/ui'
import { useNav } from '../../shell/nav'
import { useApp, leadId, fitWith, PHASE_TIME, type State } from '../../state/store'
import { PERSONAS, ageOf, type Persona } from '../../data/personas'

export const ROMAN = ['I', 'II', 'III'] as const
export const ME_COLOR = '#efb08a' // you, in ember
export const THEM_COLOR = '#d98fa6' // them, in dusty rose

/** A local "YYYY-MM-DDTHH:mm:ss" (the demo clock's format), never shifted to UTC. */
export const localIso = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 6e4).toISOString().slice(0, 19)

/** Tonight's letter closes at tomorrow's dusk. */
export const LETTER_EXPIRES = localIso(new Date(PHASE_TIME.dusk).getTime() + 24 * 3600e3 - 60e3)

/** "Wednesday 14 October" from a date. */
export function editionDate(d: Date | string) {
  const x = new Date(d)
  return `${x.toLocaleDateString('en-US', { weekday: 'long' })} ${x.getDate()} ${x.toLocaleDateString('en-US', { month: 'long' })}`
}

/** The person a screen is about, with everything the screens keep asking for. */
export function usePerson(params: Record<string, any>) {
  const { s, update } = useApp()
  const id = leadId(s, params)
  const p: Persona = PERSONAS[id]
  const idx = s.tonight.ids.indexOf(id)
  return { s, update, id, p, idx, age: ageOf(p.dob), fit: fitWith(s, id), pr: pronouns(p) }
}

export function pronouns(p: Persona) {
  if (p.pronouns.startsWith('she')) return { subj: 'she', obj: 'her', adj: 'her', own: 'hers' }
  if (p.pronouns.startsWith('he')) return { subj: 'he', obj: 'him', adj: 'his', own: 'his' }
  return { subj: 'they', obj: 'them', adj: 'their', own: 'theirs' }
}

/** Their own pages, without empty placeholders. */
export const realPages = (p: Persona) => p.pages.filter(x => x.text.replace(/[.…\s]/g, '').length > 0)

/** Aura's foreword, or an honest line when they haven't approved one yet. */
export const forewordOf = (p: Persona) => p.aura.note || `${p.first} is still finishing ${pronouns(p).adj} conversation with me. I’ll write a foreword once ${pronouns(p).subj} approves it.`

/** Aura's spoken briefing, or one built from the same sourced reasons. */
export function briefingOf(s: State, id: string) {
  const p = PERSONAS[id]
  if (p.aura.briefing) return p.aura.briefing
  const f = fitWith(s, id)
  return [f.reasons[0] && `${f.reasons[0].title}. ${f.reasons[0].line}`, f.reasons[1]?.line, f.efforts[0] && `One thing to know: ${f.efforts[0].line.charAt(0).toLowerCase()}${f.efforts[0].line.slice(1)} ${f.efforts[0].tip}`]
    .filter(Boolean).join(' ')
}

export const secsFor = (text: string) => Math.max(8, Math.round((text.split(/\s+/).length * 60) / 170))

/** Ananya's care styles, as she described them in conversation (care chapter not finished yet). */
export function myCare(s: State): Persona['care'] {
  return { words: 0.8, time: 0.9, acts: 0.55, touch: 0.6, gifts: 0.3, growth: 0.75, ...(s.me.you?.care ?? {}) }
}
export const CARE_LABELS: Record<keyof Persona['care'], string> = {
  words: 'Kind words', time: 'Time together', acts: 'Acts of care', touch: 'Touch', gifts: 'Small gifts', growth: 'Growing together',
}

/** A chair at the table, drawn with the same arch as our portraits. */
export function Chair({ filled, size = 34, delay = 0, animate = false }: { filled: boolean; size?: number; delay?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" aria-hidden="true" style={{ overflow: 'visible' }}>
      <path d="M9 24V12a11 11 0 0 1 22 0v12" fill="none" stroke={filled ? 'var(--accent)' : 'var(--line-2)'} strokeWidth="2" strokeDasharray={filled ? undefined : '3 3'} />
      <motion.path d="M10.5 23.5V12.5a9.5 9.5 0 0 1 19 0v11z" fill="var(--accent)"
        initial={animate ? { opacity: 0, scale: 0.4 } : false} animate={{ opacity: filled ? 0.9 : 0, scale: filled ? 1 : 0.4 }}
        transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: '20px 18px' }} />
      <rect x="6" y="26" width="28" height="5" rx="2.5" fill={filled ? 'var(--accent)' : 'none'} stroke={filled ? 'none' : 'var(--line-2)'} strokeWidth="1.6" strokeDasharray={filled ? undefined : '3 3'} />
      <path d="M10 31v14M30 31v14" stroke={filled ? 'var(--accent)' : 'var(--line-2)'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** A frosted veil over something only Soirée members can open. */
export function Veil({ reason, title, children }: { reason: 'letter' | 'care' | 'depth'; title: string; children: ReactNode }) {
  const nav = useNav()
  return (
    <div className="tn-veil">
      <div className="tn-veil-under" aria-hidden="true">{children}</div>
      <div className="tn-veil-over stack gap-12">
        <span className="t-callout pretty" style={{ maxWidth: 260 }}>{title}</span>
        <Button kind="ghost" size="sm" icon="lock" onClick={() => nav.push('premium/paywall', { reason })}>See Soirée</Button>
      </div>
    </div>
  )
}

/** Back from a decision: pop if there is somewhere to go, otherwise land on the letter. */
export function useBack() {
  const nav = useNav()
  return () => (nav.canGoBack ? nav.pop() : nav.reset('tonight/deck'))
}
