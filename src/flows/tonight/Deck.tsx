// tonight/deck: introductions I–III as paged spreads. Person first; the band sits small, below the face.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Screen, IconButton, Eyebrow, Portrait, Halo, BandMark, Tag, Countdown } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, useNow, fitWith, connection, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { PERSONAS, ageOf } from '../../data/personas'
import { ROMAN, LETTER_EXPIRES, editionDate } from './parts'

export function DecisionTag({ s, id }: { s: State; id: string }) {
  const d = s.tonight.decisions[id]
  if (connection(s, id)) return <Tag tone="sage" icon="check">Introduced</Tag>
  if (d === 'lean') return <span className="tag tn-tag-ox"><Icon name="heart" size={13} stroke={2} />You leaned in</span>
  if (d === 'hold') return <Tag icon="hourglass">Held until tomorrow</Tag>
  if (d === 'not') return <Tag>Not tonight</Tag>
  return null
}

export function Deck() {
  const { s } = useApp()
  const nav = useNav()
  const now = useNow()
  const ids = s.tonight.ids.slice(0, 3)
  const member = s.me.tier !== 'invitation'
  const firstOpen = Math.max(0, ids.findIndex((id, i) => !s.tonight.decisions[id] && (member || i === 0)))
  const [active, setActive] = useState(firstOpen)
  const track = useRef<HTMLDivElement>(null)
  const decided = ids.filter(id => s.tonight.decisions[id]).length

  const pageLeft = (i: number) => {
    const el = track.current!.children[i] as HTMLElement
    return el.offsetLeft - 22
  }
  const goTo = (i: number, smooth = true) => track.current?.scrollTo({ left: pageLeft(i), behavior: smooth ? 'smooth' : 'auto' })
  useEffect(() => { if (firstOpen) goTo(firstOpen, false) }, [])
  const onScroll = () => {
    const x = track.current!.scrollLeft
    let best = 0
    ids.forEach((_, i) => { if (Math.abs(pageLeft(i) - x) < Math.abs(pageLeft(best) - x)) best = i })
    setActive(best)
  }

  return (
    <Screen className="tn-ink"
      top={
        <div className="topbar">
          <div className="grow" style={{ paddingLeft: 10 }}><Eyebrow>Edition No. {s.tonight.edition} · {editionDate(now)}</Eyebrow></div>
          <IconButton icon="feather" label="Read the letter again" onClick={() => nav.push('tonight/letter')} />
        </div>
      }>
      <div className="stack gap-20">
        <div className="pad stack gap-4">
          <h1 className="t-title" style={{ margin: 0 }}>Tonight’s <span className="i">three.</span></h1>
          <span className="t-callout muted">{decided === 0 ? 'Take your time. Tap anyone to read their pages.' : `You’ve decided on ${decided} of ${ids.length}. They only know if you both lean in.`}</span>
        </div>

        <div ref={track} className="tn-deck" onScroll={onScroll}>
          {ids.map((id, i) => {
            const p = PERSONAS[id]
            const veiled = !member && i > 0
            if (veiled) return (
              <motion.article key={id} className="tn-page veiled" role="button" tabIndex={0} aria-label={`Introduction ${ROMAN[i]}, for Soirée members`}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => nav.push('premium/paywall', { reason: 'letter' })} onKeyDown={e => e.key === 'Enter' && nav.push('premium/paywall', { reason: 'letter' })}>
                <div className="row between"><span className="tn-numeral big">{ROMAN[i]}</span>{i === 2 && <Tag tone="ember" icon="sparkle">Aura’s wildcard</Tag>}</div>
                <div className="tn-blur-arch">
                  <Portrait photo={p.photos.portrait} name="" shape="arch" w="100%" h={300} style={{ filter: 'blur(22px) saturate(.8)', transform: 'scale(1.15)' }} />
                  <span className="tn-blur-lock"><Icon name="lock" size={22} /></span>
                </div>
                <div className="stack gap-8">
                  <span className="t-head balance">Two more were chosen for you tonight.</span>
                  <span className="t-callout muted">Soirée members see all three.</span>
                </div>
                <span className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}><Icon name="lock" size={16} />See Soirée</span>
              </motion.article>
            )
            const f = fitWith(s, id)
            return (
              <motion.article key={id} className="tn-page" role="button" tabIndex={0} aria-label={`Introduction ${ROMAN[i]}: ${p.first}. Open their pages`}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => nav.push('tonight/dossier', { id })} onKeyDown={e => e.key === 'Enter' && nav.push('tonight/dossier', { id })}>
                <div className="row between" style={{ minHeight: 30 }}>
                  <span className="tn-numeral big">{ROMAN[i]}</span>
                  <DecisionTag s={s} id={id} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Portrait photo={p.photos.portrait} name={p.first} shape="arch" w="100%" h={300} priority={i === 0} />
                  {i === 2 && <span style={{ position: 'absolute', left: 12, bottom: 12 }}><Tag tone="dark" icon="sparkle">Aura’s wildcard</Tag></span>}
                </div>
                <div className="stack gap-4">
                  <div className="row between" style={{ alignItems: 'center' }}>
                    <h2 className="t-title" style={{ margin: 0, fontSize: 32 }}>{p.first}<span className="faint">, {ageOf(p.dob)}</span></h2>
                    <span className="row gap-8 t-small faint">
                      <Halo v={p.halo} size={28}><Icon name="shieldCheck" size={14} /></Halo>
                      {Object.values(p.halo).filter(Boolean).length} of 3
                    </span>
                  </div>
                  <p className="serif pretty" style={{ margin: 0, fontSize: 19, lineHeight: 1.3 }}>{p.headline}</p>
                  <span className="t-small faint">{p.hood} · {p.job}</span>
                </div>
                <hr className="hairline" />
                <div className="row gap-12" style={{ alignItems: 'center' }}>
                  <BandMark band={f.band} compact />
                  <span className="t-small muted grow" style={{ textAlign: 'right' }}>{f.reasons[0]?.title}</span>
                </div>
              </motion.article>
            )
          })}
        </div>

        <div className="row" style={{ justifyContent: 'center', marginTop: -8 }}>
          {ids.map((id, i) => (
            <button key={id} className="tn-dot-btn" aria-label={`Introduction ${ROMAN[i]}`} aria-current={i === active} onClick={() => goTo(i)}>
              <i className={`tn-dot ${i === active ? 'on' : ''}`} />
            </button>
          ))}
        </div>

        <div className="pad row gap-8 t-small faint" style={{ justifyContent: 'center' }}>
          <Icon name="hourglass" size={15} />
          <span>This letter closes at dusk tomorrow · <Countdown to={LETTER_EXPIRES} now={now} done="closed" /></span>
        </div>
      </div>
    </Screen>
  )
}
