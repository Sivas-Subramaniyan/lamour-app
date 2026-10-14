// Trust before matching: consent one card at a time, photos with stories, the Verified Halo.
import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Screen, Button, Chip, Tag, Toggle, Segmented, Sheet, Portrait, Halo, Waveform, Eyebrow, useFeedback } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useApp, useNow, type ConsentKey } from '../../state/store'
import { useNav } from '../../shell/nav'
import { useMicLevel, haptic } from '../../lib/voice'
import { EASE, Rise, StepBar, useLater, withYou, memberNo, ROLL } from './parts'

// ---------- arrival/consent ----------

const CONSENTS: { key: ConsentKey; icon: IconName; title: string; does: string; off: string }[] = [
  { key: 'voice', icon: 'mic', title: 'Voice processing',
    does: 'Aura listens while you talk with her, so you can speak instead of type. Your words become text, and the raw audio is deleted within 24 hours.',
    off: 'You write to Aura instead. Everything still works; she just gets to know you a little more slowly.' },
  { key: 'profiling', icon: 'sparkle', title: 'Personality profile',
    does: 'Aura builds a picture of your values, temperament and how you love, from what you tell her. You can see and correct all of it.',
    off: 'Introductions use only what you state directly. Expect broader letters and fewer reasons.' },
  { key: 'learning', icon: 'refresh', title: 'Learning from your choices',
    does: 'Who you lean in to, who you pass on, and why. Aura shows you each pattern she notices before she uses it.',
    off: 'Aura goes by what you say, never what you do. Your letters won’t sharpen over time.' },
  { key: 'numerology', icon: 'numbers', title: 'Your numbers',
    does: 'Your birth name and date are used to compute a numerology chart, shown as a separate, reflective lens. It never changes a compatibility band.',
    off: 'No Resonance cards, and your birth name is deleted.' },
  { key: 'agent', icon: 'calendar', title: 'Aura’s actions',
    does: 'Holding tables, reading your calendar’s free and busy times, and using your location as minutes away, never as an address, to plan evenings.',
    off: 'Aura suggests evenings and places. You book them yourself.' },
  { key: 'research', icon: 'book', title: 'Research',
    does: 'Anonymized patterns from your time here help us study what makes an introduction work. Never your words, never your face.',
    off: 'Nothing changes for you. This one is entirely optional.' },
]

export function Consent() {
  const { s, update } = useApp()
  const nav = useNav()
  const now = useNow()
  const { toast } = useFeedback()
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [chosen, setChosen] = useState<Partial<Record<ConsentKey, boolean>>>({})
  const [at, setAt] = useState<Date | null>(null)
  const done = i >= CONSENTS.length
  const answered = Object.keys(chosen).length

  const choose = (on: boolean) => {
    const k = CONSENTS[i].key
    setChosen(c => ({ ...c, [k]: on }))
    update(st => ({ ...st, consents: { ...st.consents, [k]: on } }))
    haptic(8)
    setDir(1)
    setI(i + 1)
    if (i + 1 === CONSENTS.length) setAt(now)
  }
  const go = (j: number) => { setDir(j < i ? -1 : 1); setI(j) }
  const stamp = (at ?? now).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <Screen top={<StepBar n={4} />} footer={done ? <Button block onClick={() => nav.push('arrival/photos')}>Continue</Button> : undefined}>
      <div className="pad stack gap-20" style={{ paddingTop: 8 }}>
        <Rise className="stack gap-12">
          <Eyebrow>Your consent</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Six choices, <span className="i">each one yours.</span></h1>
          <p className="t-body muted pretty" style={{ margin: 0 }}>Nothing is on until you say so. Both answers are fine, and you can change any of them later.</p>
        </Rise>

        <div className="arr-dots" role="tablist" aria-label="Consent progress">
          {CONSENTS.map((c, j) => (
            <button key={c.key} role="tab" aria-selected={j === i} aria-label={`${c.title}${chosen[c.key] === undefined ? '' : chosen[c.key] ? ': accepted' : ': not now'}`}
              disabled={j > answered} onClick={() => go(j)}
              className={j === i ? 'now' : chosen[c.key] === true ? 'yes' : chosen[c.key] === false ? 'no' : ''}><i /></button>
          ))}
        </div>

        <div className="arr-deck">
          {!done && i < CONSENTS.length - 1 && <div className="card arr-deck-back" aria-hidden="true" />}
          <AnimatePresence initial={false} custom={dir}>
            {done ? (
              <motion.div key="receipt" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: EASE }}>
                <div className="arr-receipt stack gap-12">
                  <motion.span className="arr-stamp" initial={{ opacity: 0, scale: 1.6, rotate: -18 }} animate={{ opacity: 1, scale: 1, rotate: -8 }} transition={{ delay: 1, type: 'spring', damping: 26, stiffness: 300 }}>Recorded</motion.span>
                  <Eyebrow>Consent receipt</Eyebrow>
                  <div className="t-head" style={{ paddingRight: 90 }}>Your choices, on the record.</div>
                  <div className="t-small muted t-num">{stamp} · Member {memberNo(s)}</div>
                  <div style={{ marginTop: 4 }}>
                    {CONSENTS.map((c, j) => {
                      const on = chosen[c.key] ?? s.consents[c.key]
                      return (
                        <motion.div key={c.key} className="row between arr-rrow" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + j * 0.08, duration: 0.5, ease: EASE }}>
                          <span>{c.title}</span>
                          {on ? <Tag tone="sage" icon="check">On</Tag> : <Tag>Not now</Tag>}
                        </motion.div>
                      )
                    })}
                  </div>
                  <p className="t-small muted" style={{ margin: 0 }}>Change any of these in You → Privacy.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key={CONSENTS[i].key} className="card card-pad stack gap-16" custom={dir}
                variants={{
                  enter: (d: number) => ({ x: d > 0 ? 70 : -70, opacity: 0, rotate: d > 0 ? 2.5 : -2.5 }),
                  center: { x: 0, opacity: 1, rotate: 0 },
                  exit: (d: number) => ({ x: d > 0 ? -90 : 90, opacity: 0, rotate: d > 0 ? -3 : 3 }),
                }}
                initial="enter" animate="center" exit="exit" transition={{ type: 'spring', damping: 30, stiffness: 260 }}>
                <ConsentCard c={CONSENTS[i]} n={i + 1} value={chosen[CONSENTS[i].key]} onChoose={choose} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {done && (
          <div className="row gap-8" style={{ justifyContent: 'center' }}>
            <Button kind="quiet" size="sm" icon="undo" onClick={() => go(0)}>Review</Button>
            <Button kind="quiet" size="sm" icon="download" onClick={() => toast('A copy is on its way to your inbox')}>Email me a copy</Button>
          </div>
        )}
      </div>
    </Screen>
  )
}

function ConsentCard({ c, n, value, onChoose }: { c: (typeof CONSENTS)[number]; n: number; value?: boolean; onChoose: (on: boolean) => void }) {
  return (
    <>
      <div className="row between">
        <span className="arr-step-ico"><Icon name={c.icon} size={20} /></span>
        <span className="t-label faint t-num">{n} of {CONSENTS.length}</span>
      </div>
      <div className="t-head">{c.title}</div>
      <p className="t-body pretty" style={{ margin: 0 }}>{c.does}</p>
      <div className="card-flat stack gap-4" style={{ padding: 14 }}>
        <span className="t-label faint">If off</span>
        <span className="t-callout muted pretty">{c.off}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Button kind={value === false ? 'primary' : 'soft'} size="md" onClick={() => onChoose(false)}>Not now</Button>
        <Button kind={value === true ? 'primary' : 'soft'} size="md" onClick={() => onChoose(true)}>Accept</Button>
      </div>
    </>
  )
}

// ---------- arrival/photos ----------

const PROMPT_LABELS = ['A Sunday, ideally', 'I’m weirdly proud of', 'Lately I can’t stop thinking about', 'A green flag', 'I’m looking for', 'My most controversial opinion', 'Don’t be surprised if']
const mmss = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`

export function Photos() {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const [adding, setAdding] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const photos = s.me.photos.slice(0, 6)
  const stories: Record<string, number> = s.me.you?.photoStories ?? {}
  const setPhotos = (p: string[]) => update(st => ({ ...st, me: { ...st.me, photos: p } }))
  const veil = s.discreet.veil

  return (
    <Screen top={<StepBar n={5} />}
      footer={<div className="stack gap-8">
        <Button block disabled={!photos.length} onClick={() => nav.push('arrival/verify')}>Continue</Button>
        {!photos.length && <span className="t-small faint center">Add at least one photo to continue.</span>}
      </div>}>
      <div className="pad stack gap-32" style={{ paddingTop: 8 }}>
        <Rise className="stack gap-12">
          <Eyebrow>Photos and pages</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Your photos, <span className="i">and the stories behind them.</span></h1>
          <p className="t-body muted pretty" style={{ margin: 0 }}>Up to six. The first is your lead. Tap any photo to tell its story in your own voice.</p>
        </Rise>

        <div className="arr-grid">
          {Array.from({ length: 6 }, (_, i) => {
            const url = photos[i]
            const lead = i === 0
            if (!url) return (
              <button key={`empty-${i}`} className={`arr-slot empty ${lead ? 'lead' : ''}`} onClick={() => setAdding(true)} aria-label="Add a photo">
                <span className="stack gap-4" style={{ alignItems: 'center' }}><Icon name="plus" size={lead ? 28 : 22} />{lead && <span className="t-small">Your lead photo</span>}</span>
              </button>
            )
            const secs = stories[url]
            return (
              <motion.button layout key={url} className={`arr-slot ${lead ? 'lead' : ''}`} onClick={() => setSel(url)} aria-label={`Photo ${i + 1}${secs ? ', story added' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
                <Portrait photo={url} name={s.me.name} shape="rect" w="100%" h="100%" />
                <span className={`arr-slot-badge ${secs ? 'has' : ''}`}>
                  <Icon name={secs ? 'check' : 'mic'} size={13} stroke={2} />
                  {secs ? <span className="t-num">{mmss(secs)}</span> : lead ? 'Tell its story' : 'Story'}
                </span>
              </motion.button>
            )
          })}
        </div>

        <section className="stack gap-4">
          <div className="row between">
            <Eyebrow>Your pages</Eyebrow>
            <Button kind="quiet" size="sm" icon="edit" onClick={() => setEditing(true)}>Edit</Button>
          </div>
          {s.me.prompts.map(p => (
            <div key={p.label} className="arr-prompt stack gap-4">
              <span className="t-label faint">{p.label}</span>
              {p.answer ? <span className="serif pretty" style={{ fontSize: 21, lineHeight: 1.25 }}>{p.answer}</span> : <span className="t-callout faint">Not answered yet</span>}
            </div>
          ))}
          {!s.me.prompts.length && <button className="arr-prompt t-callout muted" style={{ textAlign: 'left' }} onClick={() => setEditing(true)}>Add a page so people hear you before they see you.</button>}
        </section>

        <div className="card card-pad stack gap-16">
          <div className="row gap-12">
            <div className="grow stack gap-4">
              <span style={{ fontWeight: 600 }}>Voice-first Veil</span>
              <span className="t-small muted pretty">Your photos come into focus as you both talk. People meet your voice first.</span>
            </div>
            <Toggle label="Voice-first Veil" on={veil} onChange={on => { update(st => ({ ...st, discreet: { ...st.discreet, veil: on } })); toast(on ? 'Veil on. Your voice goes first.' : 'Veil off. Photos show from the start.') }} />
          </div>
          <AnimatePresence initial={false}>
            {veil && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease: EASE }} style={{ overflow: 'hidden' }}>
                <div className="arr-veil">
                  {[{ b: 16, l: 'First hello' }, { b: 7, l: 'A few replies' }, { b: 0, l: 'Voice Hour' }].map((x, k) => (
                    <motion.div key={x.l} className="stack gap-8" style={{ alignItems: 'center' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.12 }}>
                      <div className="portrait arch" style={{ width: '100%', height: 116 }}>
                        {photos[0] ? <img src={photos[0]} alt="" style={{ filter: `blur(${x.b}px)`, transform: 'scale(1.12)' }} /> : <div className="portrait-fallback">{s.me.name.slice(0, 1)}</div>}
                      </div>
                      <span className="t-small muted">{x.l}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a photo">
        <div className="stack gap-16">
          <div className="row between"><Eyebrow>Camera roll · Recents</Eyebrow><span className="t-small faint t-num">{photos.length} of 6</span></div>
          <div className="arr-roll">
            {ROLL.map(r => {
              const used = photos.includes(r.url)
              return (
                <button key={r.label} disabled={used || photos.length >= 6} aria-label={r.label}
                  onClick={() => { setPhotos([...photos, r.url]); setAdding(false); toast('Added. Tap it to tell the story behind it.') }}>
                  <img src={r.url} alt={r.label} />
                  <span className="lbl">{used ? 'Added' : r.label}</span>
                </button>
              )
            })}
          </div>
          <p className="t-small muted pretty" style={{ margin: 0 }}>What works: natural light, your face in the lead, and one of you doing something you love.</p>
        </div>
      </Sheet>

      <Sheet open={!!sel} onClose={() => setSel(null)} title="This photo">
        {sel && <PhotoDetail key={sel} url={sel} lead={photos[0] === sel}
          onLead={() => { setPhotos([sel, ...photos.filter(p => p !== sel)]); setSel(null); toast('Now your lead photo') }}
          onRemove={() => { setPhotos(photos.filter(p => p !== sel)); setSel(null); toast('Photo removed') }} />}
      </Sheet>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Your pages">
        {editing && <PromptEditor onDone={() => setEditing(false)} />}
      </Sheet>
    </Screen>
  )
}

function PhotoDetail({ url, lead, onLead, onRemove }: { url: string; lead: boolean; onLead: () => void; onRemove: () => void }) {
  const { s, update } = useApp()
  const [rec, setRec] = useState(false)
  const [secs, setSecs] = useState(0)
  const { level, state } = useMicLevel(rec)
  const saved: number | undefined = s.me.you?.photoStories?.[url]
  const finish = (n: number) => {
    setRec(false)
    update(st => withYou(st, { photoStories: { ...st.me.you?.photoStories, [url]: Math.max(3, n) } }))
    haptic(10)
  }
  useEffect(() => {
    if (!rec) return
    const t0 = Date.now()
    const iv = setInterval(() => {
      const k = Math.floor((Date.now() - t0) / 1000)
      setSecs(k)
      if (k >= 30) finish(30)
    }, 250)
    return () => clearInterval(iv)
  }, [rec])

  return (
    <div className="stack gap-16">
      <Portrait photo={url} name={s.me.name} shape={lead ? 'arch' : 'rect'} w="100%" h={260} />
      <div className="card-flat stack gap-12" style={{ padding: 16 }}>
        {rec ? (
          <>
            <div className="row between"><span className="t-label" style={{ color: 'var(--accent)' }}>Recording</span><span className="t-num t-small">{mmss(secs)} / 0:30</span></div>
            <Waveform level={level} bars={36} color="var(--accent)" />
            {state === 'denied' && <span className="t-small faint">Microphone is off, so this is a stand-in recording.</span>}
            <Button kind="commit" block icon="check" onClick={() => finish(secs)}>Done</Button>
          </>
        ) : saved ? (
          <>
            <div className="row between"><span className="row gap-8"><Tag tone="sage" icon="check">Story added</Tag></span><span className="t-num t-small muted">{mmss(saved)}</span></div>
            <Waveform seed={saved} bars={36} color="var(--ink-2)" />
            <Button kind="quiet" block icon="refresh" onClick={() => { setSecs(0); setRec(true) }}>Record it again</Button>
          </>
        ) : (
          <>
            <span className="t-callout muted pretty">Where were you, and why this one? Thirty seconds at most. People hear it when they tap the photo.</span>
            <Button kind="commit" block icon="mic" onClick={() => { setSecs(0); setRec(true) }}>Tell the story behind this one</Button>
          </>
        )}
      </div>
      <div className="row gap-8">
        {!lead && <Button kind="soft" size="md" icon="star" onClick={onLead} style={{ flex: 1 }}>Make this my lead</Button>}
        <Button kind="ghost" size="md" icon="trash" onClick={onRemove} style={{ flex: 1 }}>Remove</Button>
      </div>
    </div>
  )
}

function PromptEditor({ onDone }: { onDone: () => void }) {
  const { s, update } = useApp()
  const { toast } = useFeedback()
  const [draft, setDraft] = useState(s.me.prompts.map(p => ({ ...p })))
  const unused = PROMPT_LABELS.filter(l => !draft.some(p => p.label === l))
  const save = () => {
    update(st => ({ ...st, me: { ...st.me, prompts: draft.map(p => ({ ...p, answer: p.answer.trim() })) } }))
    toast('Pages saved')
    onDone()
  }
  return (
    <div className="stack gap-20">
      {draft.map((p, k) => (
        <div key={p.label} className="stack gap-8">
          <div className="row between">
            <span className="t-label faint">{p.label}</span>
            <button className="t-small faint" style={{ height: 40 }} onClick={() => setDraft(d => d.filter((_, j) => j !== k))}>Remove</button>
          </div>
          <textarea className="input" rows={3} value={p.answer} maxLength={160} onChange={e => setDraft(d => d.map((x, j) => (j === k ? { ...x, answer: e.target.value } : x)))} aria-label={p.label} />
          <span className="t-small faint t-num" style={{ alignSelf: 'flex-end' }}>{p.answer.length}/160</span>
        </div>
      ))}
      {draft.length < 3 && (
        <div className="stack gap-8">
          <Eyebrow>Add a page</Eyebrow>
          <div className="row gap-8 wrap">{unused.map(l => <Chip key={l} icon="plus" onClick={() => setDraft(d => [...d, { label: l, answer: '' }])}>{l}</Chip>)}</div>
        </div>
      )}
      <Button block onClick={save}>Save pages</Button>
    </div>
  )
}

// ---------- arrival/verify ----------

type Checks = { selfie: boolean; id: boolean; work: boolean }
const DOCS = [{ label: 'Passport', noun: 'passport' }, { label: 'Driver’s license', noun: 'license' }, { label: 'State ID', noun: 'state ID' }]

export function Verify() {
  const { s, update } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const later = useLater()
  const [v, setV] = useState<Checks>({ selfie: false, id: false, work: false })
  const [pulse, setPulse] = useState(0)
  const [cam, setCam] = useState(false)
  const [doc, setDoc] = useState<string | null>(null)
  const [idState, setIdState] = useState<'choose' | 'scan' | 'done'>('choose')
  const [workKind, setWorkKind] = useState<'email' | 'linkedin'>('email')
  const [work, setWork] = useState('')
  const [workState, setWorkState] = useState<'idle' | 'checking' | 'done'>('idle')
  const count = Object.values(v).filter(Boolean).length
  const ready = v.selfie && v.id
  const slug = (s.me.name || 'you').toLowerCase().replace(/[^a-z]/g, '') || 'you'

  const complete = (k: keyof Checks) => {
    setV(x => ({ ...x, [k]: true }))
    setPulse(p => p + 1)
    haptic(12)
    update(st => ({ ...st, me: { ...st.me, verified: { ...st.me.verified, [k]: true } } }))
  }
  const scanId = () => { setIdState('scan'); later(() => { setIdState('done'); complete('id') }, 2600) }
  const verifyWork = () => {
    if (!work.trim()) setWork(workKind === 'email' ? `${slug}@claystudio.co` : `linkedin.com/in/${slug}`)
    setWorkState('checking')
    later(() => { setWorkState('done'); complete('work') }, 1500)
  }

  return (
    <Screen top={<StepBar n={6} />}
      footer={<div className="stack gap-8">
        <Button block disabled={!ready} onClick={() => nav.push('arrival/member')}>Continue</Button>
        {!ready && <Button kind="quiet" block onClick={() => { toast('You can finish this any time from You'); nav.push('arrival/member') }}>Finish later</Button>}
      </div>}>
      <div className="pad stack gap-24" style={{ paddingTop: 8 }}>
        <Rise className="stack gap-12">
          <Eyebrow>The Verified Halo</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Three quiet checks, <span className="i">one ring of light.</span></h1>
          <p className="t-body muted pretty" style={{ margin: 0 }}>Each check fills a third of the ring people see around you. Nothing here is ever shown, only the ring.</p>
        </Rise>

        <div className="arr-halo-stage">
          <div style={{ position: 'relative' }}>
            <AnimatePresence>
              {pulse > 0 && <motion.div key={pulse} className="arr-pulse" initial={{ scale: 0.9, opacity: 0.9 }} animate={{ scale: 1.4, opacity: 0 }} transition={{ duration: 1.3, ease: EASE }} />}
            </AnimatePresence>
            <Halo v={v} size={176}><Portrait photo={s.me.photos[0]} name={s.me.name} shape="circle" w={162} h={162} priority /></Halo>
          </div>
          <span className="t-small muted t-num" style={{ marginTop: 14 }}>{count} of 3 {count === 3 ? '· fully verified' : ''}</span>
        </div>

        <StepCard icon="camera" done={v.selfie} title="Liveness selfie" line="A few seconds of video, so people know you’re you. Compared with your photos, then deleted.">
          {!v.selfie && <Button size="md" icon="camera" onClick={() => setCam(true)}>Start</Button>}
        </StepCard>

        <StepCard icon="id" done={v.id} title="ID, 18 and over" line="We confirm you’re over 18 and your name matches. We never store your ID number.">
          <AnimatePresence mode="wait" initial={false}>
            {idState === 'choose' ? (
              <motion.div key="choose" className="stack gap-12" exit={{ opacity: 0 }}>
                <div className="row gap-8 wrap">{DOCS.map(d => <Chip key={d.label} on={doc === d.label} onClick={() => setDoc(d.label)}>{d.label}</Chip>)}</div>
                <Button size="md" disabled={!doc} onClick={scanId}>Scan my {DOCS.find(d => d.label === doc)?.noun ?? 'ID'}</Button>
              </motion.div>
            ) : idState === 'scan' ? (
              <motion.div key="scan" className="arr-idframe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="arr-scanline" initial={{ top: '-25%' }} animate={{ top: ['-25%', '100%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
                <span className="stack gap-8" style={{ alignItems: 'center' }}><Icon name="id" size={40} /><span className="t-small">Hold your {DOCS.find(d => d.label === doc)?.noun} inside the frame</span></span>
              </motion.div>
            ) : (
              <motion.div key="done" className="stack gap-8" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="row gap-8 wrap"><Tag tone="sage" icon="check">Over 18</Tag><Tag tone="sage" icon="check">Name matches</Tag></div>
                <span className="t-small muted">We kept a yes, not your ID.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </StepCard>

        <StepCard icon="link" done={v.work} title="Work" optional line="Confirms what you do. We show your title, never your employer, unless you choose.">
          {workState === 'done' ? (
            <Tag tone="sage" icon="check">Work confirmed</Tag>
          ) : (
            <div className="stack gap-12">
              <Segmented value={workKind} options={[{ value: 'email', label: 'Work email' }, { value: 'linkedin', label: 'LinkedIn' }]} onChange={k => { setWorkKind(k); setWork('') }} />
              <div className="row gap-8">
                <input className="input grow" style={{ minWidth: 0 }} value={work} onChange={e => setWork(e.target.value)} aria-label={workKind === 'email' ? 'Work email' : 'LinkedIn profile'}
                  type={workKind === 'email' ? 'email' : 'url'} placeholder={workKind === 'email' ? 'you@work.com' : 'linkedin.com/in/you'} />
                <Button size="md" disabled={workState === 'checking'} onClick={verifyWork} style={{ height: 54 }}>{workState === 'checking' ? 'Checking' : 'Verify'}</Button>
              </div>
            </div>
          )}
        </StepCard>

        <div className="card-flat row gap-12" style={{ padding: 16 }}>
          <div className="grow stack gap-4">
            <span style={{ fontWeight: 600 }}>Only introduce me to verified people</span>
            <span className="t-small muted pretty">Selfie and ID confirmed. Fewer introductions, every one of them checked.</span>
          </div>
          <Toggle label="Only introduce me to verified people" on={!!s.me.you?.verifiedOnly} onChange={on => update(st => withYou(st, { verifiedOnly: on }))} />
        </div>
      </div>

      <Sheet open={cam} onClose={() => setCam(false)} title="Liveness selfie">
        {cam && <SelfieCam photo={s.me.photos[0]} onDone={() => { complete('selfie'); later(() => setCam(false), 1300) }} />}
      </Sheet>
    </Screen>
  )
}

function StepCard({ icon, done, title, line, optional, children }: { icon: IconName; done: boolean; title: string; line: string; optional?: boolean; children?: ReactNode }) {
  return (
    <div className="card card-pad arr-step">
      <motion.span className={`arr-step-ico ${done ? 'done' : ''}`} animate={done ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.5 }}>
        <Icon name={done ? 'check' : icon} size={20} stroke={done ? 2.2 : 1.5} />
      </motion.span>
      <div className="stack gap-12" style={{ minWidth: 0 }}>
        <div className="stack gap-4">
          <div className="row gap-8"><span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>{optional && !done && <Tag>Optional</Tag>}{done && <Tag tone="sage">Done</Tag>}</div>
          <span className="t-small muted pretty">{line}</span>
        </div>
        {children}
      </div>
    </div>
  )
}

const CAM_SAY = ['Look straight ahead', 'Turn your head slowly', 'Now the other way', 'Hold still']

function SelfieCam({ photo, onDone }: { photo?: string; onDone: () => void }) {
  const later = useLater()
  const [phase, setPhase] = useState<'ready' | 'scan' | 'done'>('ready')
  const [say, setSay] = useState(0)
  const start = () => {
    setPhase('scan')
    CAM_SAY.forEach((_, k) => later(() => setSay(k), k * 1000))
    later(() => { setPhase('done'); haptic([10, 40, 10]); onDone() }, 4000)
  }
  return (
    <div className="stack gap-16">
      <div className="arr-cam">
        <motion.div className="arr-cam-feed" animate={phase === 'scan' ? { x: [0, 0, -12, 12, 0], rotateY: [0, 0, -16, 16, 0] } : { x: 0, rotateY: 0 }} transition={{ duration: 4, times: [0, 0.25, 0.5, 0.75, 1] }}>
          {photo && <img src={photo} alt="" />}
        </motion.div>
        <svg viewBox="0 0 300 380" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <mask id="arr-oval"><rect width="300" height="380" fill="white" /><ellipse cx="150" cy="190" rx="105" ry="140" fill="black" /></mask>
          </defs>
          <rect width="300" height="380" fill="rgba(11, 9, 11, 0.78)" mask="url(#arr-oval)" />
          <ellipse cx="150" cy="190" rx="113" ry="148" fill="none" stroke="rgba(243, 235, 224, 0.18)" strokeWidth="3" />
          <motion.ellipse cx="150" cy="190" rx="113" ry="148" fill="none" stroke={phase === 'done' ? '#8fb987' : '#e8814f'} strokeWidth="3.5" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: phase === 'ready' ? 0 : 1 }} transition={{ duration: phase === 'scan' ? 4 : 0.3, ease: 'linear' }} />
        </svg>
        <AnimatePresence>
          {phase === 'done' && (
            <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              style={{ position: 'absolute', width: 64, height: 64, borderRadius: '50%', background: 'var(--sage)', color: '#fbf3ea', display: 'grid', placeItems: 'center' }}>
              <Icon name="check" size={32} stroke={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
        <div className="arr-cam-say" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.span key={phase === 'scan' ? say : phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {phase === 'ready' ? 'Fit your face in the oval' : phase === 'scan' ? CAM_SAY[say] : 'That’s you.'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      {phase === 'ready' && <Button block onClick={start}>I’m ready</Button>}
      <span className="t-small faint center">Compared with your photos, then deleted. Never shown to anyone.</span>
    </div>
  )
}
