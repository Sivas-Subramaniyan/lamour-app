// Native voice: mic level (getUserMedia + AnalyserNode), live transcript (Web Speech), Aura's voice (speechSynthesis).
// Everything degrades gracefully: no mic -> simulated breathing level; no recognition -> typed/sample answers.
import { useCallback, useEffect, useRef, useState } from 'react'

/** Live 0–1 mic level while `active`. `denied` if permission refused; `simulated` when we fall back. */
export function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0)
  const [state, setState] = useState<'idle' | 'live' | 'denied' | 'simulated'>('idle')
  useEffect(() => {
    if (!active) { setLevel(0); setState('idle'); return }
    let raf = 0, stream: MediaStream | null = null, ctx: AudioContext | null = null, dead = false
    const simulate = (why: 'denied' | 'simulated') => {
      setState(why)
      const t0 = performance.now()
      const loop = () => { const t = (performance.now() - t0) / 1000; setLevel(0.12 + 0.1 * Math.sin(t * 2.2) + 0.08 * Math.max(0, Math.sin(t * 5.3))); raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }
    if (!navigator.mediaDevices?.getUserMedia) { simulate('simulated'); return }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(s => {
      if (dead) { s.getTracks().forEach(t => t.stop()); return }
      stream = s
      ctx = new AudioContext()
      const an = ctx.createAnalyser()
      an.fftSize = 512
      ctx.createMediaStreamSource(s).connect(an)
      const buf = new Uint8Array(an.fftSize)
      setState('live')
      let smooth = 0
      const loop = () => {
        an.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += ((v - 128) / 128) ** 2
        const rms = Math.sqrt(sum / buf.length)
        smooth = smooth * 0.7 + Math.min(1, rms * 5) * 0.3
        setLevel(smooth)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }).catch(() => simulate('denied'))
    return () => { dead = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); ctx?.close() }
  }, [active])
  return { level, state }
}

type SR = { start: () => void; stop: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: any) => void) | null; onend: (() => void) | null; onerror: ((e: any) => void) | null }
const SRClass: (new () => SR) | undefined = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

/** Live transcript. `supported` is false in browsers without Web Speech recognition (e.g. Firefox). */
export function useTranscript() {
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const rec = useRef<SR | null>(null)
  const start = useCallback(() => {
    if (!SRClass) return
    rec.current?.abort()
    const r = new SRClass()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'
    r.onresult = (e: any) => {
      let fin = '', mid = ''
      for (let i = 0; i < e.results.length; i++) (e.results[i].isFinal ? (fin += e.results[i][0].transcript) : (mid += e.results[i][0].transcript))
      setText(fin.trim())
      setInterim(mid.trim())
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    setText(''); setInterim('')
    try { r.start(); setListening(true); rec.current = r } catch { setListening(false) }
  }, [])
  const stop = useCallback(() => { rec.current?.stop(); setListening(false) }, [])
  useEffect(() => () => rec.current?.abort(), [])
  return { supported: !!SRClass, text, interim, listening, start, stop, setText }
}

/** Aura speaks. Resolves when done (or immediately if speech is unavailable / muted). */
export function speak(text: string, opts: { voice?: 'Warm' | 'Bright' | 'Low'; muted?: boolean; onBoundary?: (charIndex: number) => void } = {}): Promise<void> {
  return new Promise(resolve => {
    const synth = window.speechSynthesis
    if (!synth || opts.muted) return resolve()
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voices = synth.getVoices().filter(v => v.lang.startsWith('en'))
    const prefer = opts.voice === 'Low' ? /(Daniel|Arthur|Google UK English Male|Aaron)/ : /(Samantha|Serena|Google UK English Female|Karen|Moira|Martha|Libby|Sonia|Aria|Jenny)/
    u.voice = voices.find(v => prefer.test(v.name)) ?? voices[0] ?? null
    u.rate = opts.voice === 'Bright' ? 1.04 : 0.96
    u.pitch = opts.voice === 'Low' ? 0.9 : opts.voice === 'Bright' ? 1.1 : 1
    u.onboundary = e => opts.onBoundary?.(e.charIndex)
    u.onend = () => resolve()
    u.onerror = () => resolve()
    synth.speak(u)
  })
}
export const stopSpeaking = () => window.speechSynthesis?.cancel()

/** A gentle two-note chime (a perfect fifth) for the letter and the seal. */
export function chime() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.16].forEach((at, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = i ? 784 : 523.25
      g.gain.setValueAtTime(0, ctx.currentTime + at)
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 1.4)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + at)
      o.stop(ctx.currentTime + at + 1.5)
    })
    setTimeout(() => ctx.close(), 2000)
  } catch {}
}

export const haptic = (pattern: number | number[] = 12) => (navigator as any).userActivation?.hasBeenActive && navigator.vibrate?.(pattern)
