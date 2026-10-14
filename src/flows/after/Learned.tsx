// after/learned: what one evening taught Aura (you confirm or reject each), your Signature shifting a little, then a private "second evening?".
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, Orb, Portrait, AiBadge, Section } from '../../design/ui'
import { Icon } from '../../design/icons'
import { Signature, signatureModes, type Modes } from '../../design/signature'
import { fitWith, planWith, startPlan, proposalsFor, fmtDay, fmtTime, type NoticedCard } from '../../state/store'
import { venue, venuePhoto } from '../../data/venues'
import { chime, haptic } from '../../lib/voice'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { useDate, localIso, weekday, useLater } from '../dateday/shared'

const FELT_COPY: Record<string, string> = { less: 'less than expected', as: 'about what Aura expected', more: 'more than expected' }
const COUNT = ['', 'One small thing', 'Two small things', 'Three small things']

export function Learned({ params }: ScreenProps) {
  const { s, update, id, p, pr } = useDate(params, true)
  const nav = useNav()
  const later = useLater()
  const ids = String(params.cards ?? '').split(',').filter(Boolean)
  const cards = ids.length ? s.noticed.filter(c => ids.includes(c.id)) : s.noticed.filter(c => c.status === 'new').slice(0, 3)
  const band = fitWith(s, id).band
  const setStatus = (cid: string, status: NoticedCard['status']) => update(st => ({ ...st, noticed: st.noticed.map(c => (c.id === cid ? { ...c, status } : c)) }))

  // The Signature nudges by one step and settles.
  const before = signatureModes(s.me.traits)
  const after: Modes = [before[0], before[1] + 1]
  const [agit, setAgit] = useState(0.8)
  useEffect(() => { const t = setInterval(() => setAgit(a => (a <= 0.02 ? 0 : a * 0.86)), 120); return () => clearInterval(t) }, [])

  // A second evening, revealed only if mutual. Aura proposes Thursday of next week first.
  const [second, setSecond] = useState<'ask' | 'wait' | 'mutual' | 'found'>('ask')
  const next = useMemo(() => proposalsFor(s, id, 1).map((o, i) => (i ? o : { ...o, when: localIso(new Date(new Date(o.when).getTime() - 25 * 3600e3)) })), [id])
  const nv = venue(next[0].venueId)
  const yes = () => {
    setSecond('wait')
    later(() => { setSecond('mutual'); haptic([20, 40, 20]); if (!s.settings.auraMuted) chime() }, 2400)
    later(() => setSecond('found'), 4000)
  }
  const book = () => {
    update(st => { const ex = planWith(st, id); return ex && (ex.status === 'negotiating' || ex.status === 'awaiting') ? st : startPlan(st, id, next).s })
    nav.push('dates/proposals', { id })
  }

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}>
      <div className="pad stack gap-32" style={{ paddingTop: 4 }}>
        <div className="stack gap-12">
          <Eyebrow>What Aura learned</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>{COUNT[cards.length] ?? 'A few things'}, <span className="i">from one evening.</span></h1>
          {params.felt && FELT_COPY[params.felt] && <p className="t-callout muted" style={{ margin: 0 }}>Aura predicted {band}. You said {FELT_COPY[params.felt]}. Keep what sounds like you; drop what doesn’t.</p>}
        </div>

        {cards.length ? (
          <div className="stack gap-12">
            {cards.map((c, i) => (
              <motion.div key={c.id} layout className={`card card-pad stack gap-12 af-card ${c.status}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                {c.told && <span className="t-callout muted">{c.told}</span>}
                <span className={`af-lean ${c.status === 'notme' ? 'af-off' : ''}`}>{c.lean}</span>
                <div className="row between gap-8">
                  <span className="t-small faint">{c.from}</span>
                  <AnimatePresence mode="wait" initial={false}>
                    {c.status === 'new' ? (
                      <motion.div key="ask" className="row gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <button className="af-btn" onClick={() => setStatus(c.id, 'notme')}>Not me</button>
                        <button className="af-btn sage" onClick={() => setStatus(c.id, 'confirmed')}><Icon name="check" size={15} stroke={2} /> Confirm</button>
                      </motion.div>
                    ) : (
                      <motion.div key="done" className="row gap-8" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        {c.status === 'confirmed' ? <Tag tone="sage" icon="check">Confirmed</Tag> : <Tag>Set aside</Tag>}
                        <button className="af-btn quiet" onClick={() => setStatus(c.id, 'new')}>Undo</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card-flat card-pad stack gap-12" style={{ padding: 18 }}>
            <span className="t-callout muted">Nothing new to look at. Tell Aura about an evening and it shows up here.</span>
            <Button kind="ghost" size="md" onClick={() => nav.push('after/morning', { id })}>The Morning After</Button>
          </div>
        )}

        <Section label="Your Signature shifted">
          <div className="card card-pad stack gap-16">
            <div className="af-sigs">
              <div className="stack gap-8" style={{ alignItems: 'center' }}>
                <Signature layers={[{ modes: before, color: '#8a7b6e' }]} size={112} grains={900} />
                <span className="t-label faint">Before</span>
              </div>
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.6 }} style={{ color: 'var(--ink-3)' }}><Icon name="chevron" size={22} /></motion.span>
              <motion.div className="stack gap-8" style={{ alignItems: 'center' }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
                <Signature layers={[{ modes: after, color: '#c9532d' }]} size={112} grains={900} agitation={agit} />
                <span className="t-label" style={{ color: 'var(--accent)' }}>After</span>
              </motion.div>
            </div>
            <span className="t-small muted center pretty">A small shift, as it should be after one evening. You can undo any of it in What Aura’s noticed.</span>
            <Button kind="quiet" size="sm" onClick={() => nav.push('you/noticed')}>Everything Aura has noticed</Button>
          </div>
        </Section>

        <Section label="Just between you and Aura">
          <div className="card card-pad stack gap-16 af-second">
            <div className="row gap-12">
              <Portrait photo={p.photos.portrait} name={p.first} shape="circle" w={48} h={48} />
              <span className="t-head grow">A second evening with <span className="i">{p.first}</span>?</span>
            </div>
            <AnimatePresence mode="wait">
              {second === 'ask' && (
                <motion.div key="ask" className="stack gap-12" exit={{ opacity: 0 }}>
                  <span className="t-small muted">Private. {p.first} only hears about it if you both say yes.</span>
                  <div className="row gap-8">
                    <Button kind="ghost" size="md" style={{ flex: 1 }} onClick={() => nav.push('conn/exit', { id })}>Not this time</Button>
                    <Button kind="commit" size="md" style={{ flex: 1 }} onClick={yes}>Yes</Button>
                  </div>
                </motion.div>
              )}
              {second === 'wait' && (
                <motion.div key="wait" className="row gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Orb size={30} level={0.2} />
                  <span className="t-callout muted">Waiting on {p.first}. Only you two will ever know.</span>
                </motion.div>
              )}
              {(second === 'mutual' || second === 'found') && (
                <motion.div key="mutual" className="stack gap-16" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="row gap-12"><span className="af-check"><Icon name="heart" size={18} /></span><span className="serif" style={{ fontSize: 22 }}>{p.first} said yes too.</span></div>
                  <AnimatePresence>
                    {second === 'found' && (
                      <motion.div className="card-aura af-found stack gap-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                        <Portrait photo={venuePhoto(nv)} name={nv.name} shape="rect" w="100%" h={120} />
                        <div className="stack gap-4">
                          <span className="t-quote">Aura found {weekday(next[0].when)}. {nv.name}?</span>
                          <span className="t-small muted"><span className="t-num">{fmtDay(next[0].when)} · {fmtTime(next[0].when)}</span> · {next[0].minsMe} min for you, {next[0].minsThem} for {pr.him}</span>
                        </div>
                        <Button kind="ember" block onClick={book}>See three evenings</Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Section>
      </div>
    </Screen>
  )
}
