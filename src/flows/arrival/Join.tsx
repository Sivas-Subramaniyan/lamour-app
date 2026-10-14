// Getting in: request an invitation, your number, the basics.
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Screen, Button, Chip, Tag, Toggle, Field, Eyebrow, Hairline, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { ageOf, type Intent } from '../../data/personas'
import { chart, ARCHETYPE } from '../../lib/numerology'
import { haptic } from '../../lib/voice'
import { EASE, Rise, StepBar, useLater, useCountTo } from './parts'

// ---------- arrival/invite ----------

const CITIES = [{ name: 'New York', open: true }, { name: 'London' }, { name: 'Paris' }, { name: 'Mumbai' }, { name: 'Toronto' }]
const INTENTS: { v: Intent; title: string; line: string }[] = [
  { v: 'exploring', title: 'Exploring', line: 'Open and curious, with no timeline.' },
  { v: 'long-term', title: 'Long-term', line: 'Looking for a partner, at a human pace.' },
  { v: 'marriage-minded', title: 'Marriage-minded', line: 'Ready to build a life, and happy to say so.' },
]
const SEEKING: { v: State['me']['seeking']; label: string }[] = [{ v: 'men', label: 'Men' }, { v: 'women', label: 'Women' }, { v: 'everyone', label: 'Everyone' }]
const DEMO_CODE = 'AURA-NYC'

export function Invite({ params }: ScreenProps) {
  const { s, update, reset } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const later = useLater()
  const [stage, setStage] = useState<'form' | 'sending' | 'queue' | 'code'>(params.have ? 'code' : 'form')
  const [vouch, setVouch] = useState('')

  const recast = (v: State['me']['seeking']) => {
    if (v === s.me.seeking) return
    const keep = { intent: s.me.intent, city: s.me.city }
    reset(v)
    update(st => ({ ...st, me: { ...st.me, ...keep } }))
    toast(`Demo re-cast: tonight’s letter now introduces ${v === 'everyone' ? 'everyone' : v}`)
  }
  const request = () => { setStage('sending'); later(() => setStage('queue'), 1100) }
  const admit = () => later(() => nav.push('arrival/phone'), 1200)

  return (
    <Screen top={<StepBar n={1} />}
      footer={stage === 'form' || stage === 'sending'
        ? <Button kind="commit" block disabled={stage === 'sending'} onClick={request}>{stage === 'sending' ? 'Sending your request…' : 'Request my invitation'}</Button>
        : undefined}>
      <AnimatePresence mode="wait" initial={false}>
        {stage === 'queue' ? (
          <motion.div key="queue" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <Queue vouched={!!vouch.trim()} onAdmit={admit} onEdit={() => setStage('form')} />
          </motion.div>
        ) : stage === 'code' ? (
          <motion.div key="code" className="pad stack gap-24" style={{ paddingTop: 8 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <div className="stack gap-12">
              <Eyebrow>Welcome</Eyebrow>
              <h1 className="t-title balance" style={{ margin: 0 }}>Someone kept <span className="i">a chair for you.</span></h1>
              <p className="t-body muted" style={{ margin: 0 }}>Enter the code from your invitation. It’s on the card or in the message a member sent you.</p>
            </div>
            <CodeCard onAdmit={admit} />
            <Button kind="quiet" block onClick={() => setStage('form')}>I don’t have one yet</Button>
          </motion.div>
        ) : (
          <motion.div key="form" className="pad stack gap-32" style={{ paddingTop: 8 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <div className="stack gap-12">
              <Eyebrow>Request an invitation</Eyebrow>
              <h1 className="t-title balance" style={{ margin: 0 }}>Tell us <span className="i">a little</span> first.</h1>
              <p className="t-body muted pretty" style={{ margin: 0 }}>L’Amour opens one city at a time, and admits a few hundred people a week.</p>
            </div>

            <section className="stack gap-12">
              <Eyebrow>Your city</Eyebrow>
              <div className="row gap-8 wrap">
                {CITIES.map(c => c.open
                  ? <Chip key={c.name} on={s.me.city === c.name} icon="pin" onClick={() => update(st => ({ ...st, me: { ...st.me, city: c.name } }))}>{c.name}</Chip>
                  : <Chip key={c.name} onClick={() => toast(`We’ll write the week ${c.name} opens`)}>{c.name}<span className="faint" style={{ fontSize: 12 }}>coming</span></Chip>)}
              </div>
            </section>

            <section className="stack gap-12">
              <Eyebrow>What you’re looking for</Eyebrow>
              <div className="stack gap-8" role="radiogroup">
                {INTENTS.map(o => {
                  const on = s.me.intent === o.v
                  return (
                    <button key={o.v} role="radio" aria-checked={on} className={`arr-option ${on ? 'on' : ''}`} onClick={() => update(st => ({ ...st, me: { ...st.me, intent: o.v } }))}>
                      <span className="arr-radio"><i /></span>
                      <span className="stack gap-4"><span className="serif" style={{ fontSize: 21, lineHeight: 1.1 }}>{o.title}</span><span className="t-small muted">{o.line}</span></span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="stack gap-12">
              <Eyebrow>Who you’d like to meet</Eyebrow>
              <div className="row gap-8 wrap">
                {SEEKING.map(o => <Chip key={o.v} on={s.me.seeking === o.v} onClick={() => recast(o.v)}>{o.label}</Chip>)}
              </div>
              <span className="t-small faint pretty">In this prototype, changing this re-casts the whole demo: tonight’s letter, your table and your plans.</span>
            </section>

            <Field label="Vouch code · optional" hint="A member can vouch for you. Vouched requests are read first.">
              <input className="input arr-code-input" value={vouch} onChange={e => setVouch(e.target.value)} placeholder="From a member" maxLength={12} autoCapitalize="characters" />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  )
}

function Queue({ vouched, onAdmit, onEdit }: { vouched: boolean; onAdmit: () => void; onEdit: () => void }) {
  const n = useCountTo(1204, 1291, 1800)
  return (
    <div className="pad stack gap-24" style={{ paddingTop: 12 }}>
      <div className="stack gap-12 center" style={{ alignItems: 'center' }}>
        <Tag tone="sage" icon="check">Request received</Tag>
        <div className="arr-queue-num" aria-label="1,204">{n.toLocaleString('en-US')}</div>
        <div className="t-head">ahead of you in New York</div>
        <div className="t-small muted t-num">Invitations go out Thursdays · next on Oct 15</div>
        {vouched && <Tag tone="ember" icon="sparkle">Vouched · read first</Tag>}
      </div>
      <Hairline />
      <p className="t-callout muted center pretty" style={{ margin: 0 }}>A person reads every request. We’ll write when your invitation is ready, never before.</p>
      <CodeCard onAdmit={onAdmit} />
      <Button kind="quiet" block onClick={onEdit}>Edit my request</Button>
    </div>
  )
}

function CodeCard({ onAdmit }: { onAdmit: () => void }) {
  const later = useLater()
  const [code, setCode] = useState('')
  const [state, setState] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle')
  const check = (c: string) => {
    setCode(c)
    setState('checking')
    later(() => {
      if (c.trim().toUpperCase() === DEMO_CODE) { setState('ok'); haptic([8, 30, 8]); onAdmit() }
      else setState('bad')
    }, 800)
  }
  return (
    <div className="card card-pad stack gap-16">
      <div className="row between"><Eyebrow>Have an invitation code?</Eyebrow><Icon name="ticket" size={20} style={{ color: 'var(--ink-3)' }} /></div>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'ok' ? (
          <motion.div key="ok" className="arr-admitted" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }}>
            <motion.span className="arr-tick" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}><Icon name="check" size={18} stroke={2.2} /></motion.span>
            <span className="stack"><span>Admitted</span><span className="t-small muted" style={{ fontWeight: 400 }}>Welcome to L’Amour. One more minute of basics.</span></span>
          </motion.div>
        ) : (
          <motion.div key="form" className="stack gap-12" exit={{ opacity: 0 }}>
            <div className="row gap-8">
              <input className="input arr-code-input grow" value={code} onChange={e => { setCode(e.target.value); setState('idle') }} placeholder="Your code" aria-label="Invitation code" maxLength={12} autoCapitalize="characters" />
              <Button kind="primary" size="md" disabled={!code.trim() || state === 'checking'} onClick={() => check(code)} style={{ height: 54 }}>{state === 'checking' ? 'Checking' : 'Enter'}</Button>
            </div>
            {state === 'bad' && <span className="t-small" style={{ color: 'var(--accent)' }}>That code isn’t one we recognize. Check with the member who sent it.</span>}
            <div className="row gap-8 wrap">
              <span className="t-small faint">For this demo</span>
              <button className="arr-code" onClick={() => check(DEMO_CODE)}><Icon name="ticket" size={16} />{DEMO_CODE}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- arrival/phone ----------

const DEMO_OTP = '417209'
const DEMO_NUMBER = '(917) 555-0142'
const fmtPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export function Phone() {
  const nav = useNav()
  const { toast } = useFeedback()
  const later = useLater()
  const [num, setNum] = useState('')
  const [sent, setSent] = useState(false)
  const [resend, setResend] = useState(0)
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [state, setState] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle')
  const [busy, setBusy] = useState<'' | 'Apple' | 'Google'>('')
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const ready = num.replace(/\D/g, '').length === 10

  useEffect(() => {
    if (resend <= 0) return
    const t = setTimeout(() => setResend(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resend])

  const send = () => { setSent(true); setResend(30); toast(`Code sent to ${num || DEMO_NUMBER}`); refs.current[0]?.focus() }
  const check = (ds: string[]) => {
    setState('checking')
    later(() => {
      if (ds.join('') === DEMO_OTP) { setState('ok'); haptic(14); later(() => nav.push('arrival/basics'), 900) }
      else { setState('bad'); haptic([20, 40, 20]) }
    }, 650)
  }
  const type = (i: number, raw: string) => {
    const c = raw.replace(/\D/g, '')
    const next = [...digits]
    const single = c.length === 1 || (c.length === 2 && !!digits[i]) // typing over a filled box
    if (!c) next[i] = ''
    else if (single) next[i] = c.slice(-1)
    else c.slice(0, 6 - i).split('').forEach((d, k) => { next[i + k] = d }) // paste or autofill
    setDigits(next)
    setState('idle')
    if (c) refs.current[Math.min(5, i + (single ? 1 : c.length))]?.focus()
    if (next.every(Boolean)) check(next)
  }
  const demo = () => {
    if (!ready) setNum(DEMO_NUMBER)
    if (!sent) { setSent(true); setResend(30) }
    setState('idle')
    setDigits(Array(6).fill(''))
    DEMO_OTP.split('').forEach((d, i) => later(() => setDigits(p => p.map((x, k) => (k === i ? d : x))), 170 * (i + 1)))
    later(() => check(DEMO_OTP.split('')), 170 * 6 + 220)
  }
  const sso = (who: 'Apple' | 'Google') => { setBusy(who); later(() => nav.push('arrival/basics'), 1200) }

  return (
    <Screen top={<StepBar n={2} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 8 }}>
        <Rise className="stack gap-12">
          <Eyebrow>Your number</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Where can we <span className="i">reach you?</span></h1>
          <p className="t-body muted pretty" style={{ margin: 0 }}>We text a six-digit code. Your number is never shown to anyone, and it’s masked on every date.</p>
        </Rise>

        <div className="stack gap-12">
          <div className="arr-phone">
            <span className="arr-cc">+1</span>
            <input className="input grow t-num" type="tel" inputMode="tel" autoComplete="tel-national" placeholder={DEMO_NUMBER} aria-label="Phone number"
              value={num} onChange={e => setNum(fmtPhone(e.target.value))} style={{ minWidth: 0 }} />
          </div>
          <Button kind={sent ? 'soft' : 'primary'} block disabled={!ready || resend > 0} onClick={send}>
            {resend > 0 ? <span className="t-num">Resend in 0:{String(resend).padStart(2, '0')}</span> : sent ? 'Resend code' : 'Text me a code'}
          </Button>
        </div>

        <div className="stack gap-12">
          <div className="row between">
            <Eyebrow>The code</Eyebrow>
            <AnimatePresence mode="wait">
              {state === 'ok' ? <motion.span key="ok" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}><Tag tone="sage" icon="check">Verified</Tag></motion.span>
                : state === 'checking' ? <motion.span key="c" className="t-small faint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Checking…</motion.span>
                : state === 'bad' ? <motion.span key="b" className="t-small" style={{ color: 'var(--accent)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>That code doesn’t match</motion.span>
                : null}
            </AnimatePresence>
          </div>
          <motion.div className={`arr-otp ${state}`} animate={state === 'bad' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
            {digits.map((d, i) => (
              <div key={i} className="arr-otp-box">
                <input ref={el => { refs.current[i] = el }} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={6} value={d} aria-label={`Digit ${i + 1}`}
                  onChange={e => type(i, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus() }} />
                <AnimatePresence>
                  {d && <motion.span key={d} initial={{ opacity: 0, y: -10, scale: 1.4 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 380 }}>{d}</motion.span>}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
          <div className="row gap-8"><span className="t-small faint">For this demo</span><Chip icon="sparkle" onClick={demo}>Use demo code</Chip></div>
        </div>

        <div className="arr-or">or</div>
        <div className="stack gap-8">
          <Button kind="soft" block disabled={!!busy} onClick={() => sso('Apple')}>{busy === 'Apple' ? 'Connecting…' : 'Continue with Apple'}</Button>
          <Button kind="soft" block disabled={!!busy} onClick={() => sso('Google')}>{busy === 'Google' ? 'Connecting…' : 'Continue with Google'}</Button>
          <span className="t-small faint center">We take your name and a verified email. We never post anything.</span>
        </div>
      </div>
    </Screen>
  )
}

// ---------- arrival/basics ----------

const GENDERS: { v: State['me']['gender']; label: string }[] = [{ v: 'woman', label: 'Woman' }, { v: 'man', label: 'Man' }, { v: 'nonbinary', label: 'Non-binary' }, { v: 'self', label: 'Self-describe' }]
const LANGS = ['English', 'Hindi', 'Kannada', 'Tamil', 'Spanish', 'French', 'Mandarin', 'Arabic', 'Portuguese', 'Italian', 'Japanese', 'Korean']

export function Basics() {
  const { s, update } = useApp()
  const nav = useNav()
  const [name, setName] = useState(s.me.name)
  const [same, setSame] = useState(s.me.birthName === s.me.name)
  const [birth, setBirth] = useState(s.me.birthName)
  const [dob, setDob] = useState(s.me.dob)
  const [gender, setGender] = useState(s.me.gender)
  const [self, setSelf] = useState(s.me.genderSelf ?? '')
  const [langs, setLangs] = useState<string[]>(s.me.languages ?? ['English', 'Hindi'])
  const [city, setCity] = useState(s.me.city)

  const numbersName = (same ? name : birth).trim()
  const validDob = /^\d{4}-\d{2}-\d{2}$/.test(dob)
  const age = validDob ? ageOf(dob) : null
  const adult = age !== null && age >= 18 && age < 100
  const lp = validDob && numbersName ? chart(numbersName, dob).lifePath : null
  const ok = !!name.trim() && adult && (gender !== 'self' || !!self.trim()) && langs.length > 0

  const save = () => {
    update(st => ({ ...st, me: { ...st.me, name: name.trim(), birthName: numbersName, dob, gender, genderSelf: gender === 'self' ? self.trim() : undefined, languages: langs, city: city.trim() || 'New York' } }))
    nav.push('arrival/consent')
  }

  return (
    <Screen top={<StepBar n={3} />} footer={<Button block disabled={!ok} onClick={save}>Continue</Button>}>
      <div className="pad stack gap-32" style={{ paddingTop: 8 }}>
        <Rise className="stack gap-12">
          <Eyebrow>The basics</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>A few facts, <span className="i">then the good part.</span></h1>
        </Rise>

        <Field label="The name you go by" hint="This is what people see.">
          <input className="input" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" />
        </Field>

        <div className="arr-private stack gap-12">
          <div className="row gap-8"><Icon name="lock" size={17} style={{ color: 'var(--ink-2)' }} /><span className="t-label muted">Name for your numbers</span></div>
          <input className="input" value={same ? name : birth} disabled={same} onChange={e => setBirth(e.target.value)} aria-label="Full birth name" placeholder="Your full name at birth" style={same ? { opacity: 0.6 } : undefined} />
          <span className="t-small muted">Never shown to anyone. Only used to compute your numbers.</span>
          <div className="row between"><span className="t-callout">Use the name I go by</span><Toggle label="Use the name I go by" on={same} onChange={setSame} /></div>
          <AnimatePresence initial={false}>
            {lp && (
              <motion.div key={lp} className="t-small faint" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                Only you see this: Life Path <span className="t-num">{lp}</span>, {ARCHETYPE[lp].name}.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Field label="Date of birth" hint={validDob && !adult ? 'L’Amour is for adults. You need to be 18 or over to join.' : 'We show your age, never your birthday.'}>
          <div className="row gap-8">
            <input className="input grow" type="date" value={dob} min="1930-01-01" max="2008-10-14" onChange={e => setDob(e.target.value)} style={{ minWidth: 0 }} />
            <div className="arr-age" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.b key={age ?? 'x'} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}
                  style={{ color: validDob && !adult ? 'var(--accent)' : undefined }}>{age ?? '–'}</motion.b>
              </AnimatePresence>
            </div>
          </div>
        </Field>

        <section className="stack gap-12">
          <Eyebrow>Gender</Eyebrow>
          <div className="row gap-8 wrap">{GENDERS.map(g => <Chip key={g.v} on={gender === g.v} onClick={() => setGender(g.v)}>{g.label}</Chip>)}</div>
          <AnimatePresence initial={false}>
            {gender === 'self' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <input className="input" style={{ width: '100%' }} value={self} onChange={e => setSelf(e.target.value)} placeholder="In your words" aria-label="Gender, in your words" autoFocus />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="stack gap-12">
          <div className="row between"><Eyebrow>Languages you speak</Eyebrow><span className="t-small faint t-num">{langs.length}</span></div>
          <div className="row gap-8 wrap">
            {LANGS.map(l => <Chip key={l} on={langs.includes(l)} onClick={() => setLangs(x => (x.includes(l) ? x.filter(y => y !== l) : [...x, l]))}>{l}</Chip>)}
          </div>
        </section>

        <Field label="City" hint="Used to find people within a short trip of you. Never your address.">
          <input className="input" value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
        </Field>
      </div>
    </Screen>
  )
}
