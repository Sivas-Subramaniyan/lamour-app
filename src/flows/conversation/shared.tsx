// Shared pieces for the First Conversation: Aura's spoken word reveal, the chapter runner (voice and text share it), small marks.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, CHAPTERS, type ChapterId } from '../../state/store'
import { useNav } from '../../shell/nav'
import { speak, stopSpeaking, chime } from '../../lib/voice'
import { SCRIPTS, DRAFTS, pickChapter, finishChapter } from './script'

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const words = (text: string) => text.split(/\s+/).filter(Boolean)

/** Timeouts that die with the screen. */
export function useLater() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach(clearTimeout), [])
  return (fn: () => void, ms: number) => { ids.current.push(window.setTimeout(fn, ms)) }
}

/** Aura says `text` aloud and reveals it word by word in step with her voice.
 *  Word boundaries drive the reveal when the voice reports them; otherwise (or when muted) a reading-pace timer does. */
export function useSpokenReveal(text: string, run: boolean, onDone?: () => void) {
  const { s } = useApp()
  const total = useMemo(() => words(text).length, [text])
  const [shown, setShown] = useState(run ? 0 : total)
  const [done, setDone] = useState(!run)
  const cb = useRef(onDone)
  cb.current = onDone
  useEffect(() => {
    if (!run) { setShown(total); setDone(true); return }
    const starts: number[] = []
    let from = 0
    for (const w of words(text)) { const at = text.indexOf(w, from); starts.push(at); from = at + w.length }
    let alive = true, spoke = false, boundary = false, ended = false, n = 0
    const show = (k: number) => { n = Math.max(n, Math.min(total, k)); if (alive) setShown(n) }
    const check = () => {
      if (!alive || ended || !spoke || n < total) return
      ended = true
      clearInterval(tick)
      setDone(true)
      cb.current?.()
    }
    setShown(0)
    setDone(false)
    const tick = window.setInterval(() => { if (!boundary) { show(n + 1); check() } }, 240)
    const safety = window.setTimeout(() => { spoke = true; show(total); check() }, 3000 + total * 480) // some voices never fire onend
    speak(text, { voice: s.me.voice, muted: s.settings.auraMuted, onBoundary: ci => { boundary = true; show(starts.filter(x => x <= ci).length) } })
      .then(() => { spoke = true; if (boundary) show(total); check() })
    return () => { alive = false; clearInterval(tick); clearTimeout(safety); stopSpeaking() }
  }, [text, run])
  return { shown, done }
}

export function WordReveal({ text, shown }: { text: string; shown: number }) {
  return <>{words(text).map((w, i) => <span key={i} className={`cv-w ${i < shown ? 'on' : ''}`}>{w} </span>)}</>
}

export const ThinkingDots = () => <span className="cv-dots" role="status" aria-label="Aura is thinking"><i /><i /><i /></span>

// ---------- the chapter runner (voice and text share it) ----------

export function useChapterRun(params: Record<string, any>) {
  const { s, update } = useApp()
  const nav = useNav()
  const [chapter] = useState(() => pickChapter(s, params))
  const script = SCRIPTS[chapter]
  const meta = CHAPTERS.find(c => c.id === chapter)!
  const answers = (DRAFTS[chapter] ??= {})
  const [turn, setTurn] = useState(() => {
    const t = Math.floor(Number(params.turn ?? s.chapterTurn?.[chapter] ?? 0))
    const start = Number.isFinite(t) ? Math.min(Math.max(0, t), script.length - 1) : 0
    for (const k of Object.keys(answers)) if (Number(k) >= start) delete answers[Number(k)] // stale answers from an abandoned run
    return start
  })
  const record = (i: number, v: string | number) => { answers[i] = v }
  const finish = () => {
    update(st => finishChapter(st, chapter, answers))
    delete DRAFTS[chapter]
    if (!s.settings.auraMuted) chime()
    nav.replace('conv/heard', { chapter })
  }
  const advance = () => (turn + 1 >= script.length ? finish() : setTurn(turn + 1))
  const save = () => update(st => ({ ...st, chapterTurn: { ...st.chapterTurn, [chapter]: turn } }))
  return { chapter: chapter as ChapterId, script, meta, index: CHAPTERS.indexOf(meta), turn, answers, record, advance, finish, save }
}
