// you/home: the portrait page. Photograph beside Signature, how well Aura knows you, then the editorial index.
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, IconButton, ListRow, Tag, Halo, Portrait, Button, Eyebrow, Section } from '../../design/ui'
import { Icon } from '../../design/icons'
import { Signature } from '../../design/signature'
import { useApp, completeness, CHAPTERS, myChart } from '../../state/store'
import { useNav } from '../../shell/nav'
import { ARCHETYPE } from '../../lib/numerology'
import { myModes, SIG } from './shared'

const TIER = { invitation: 'Invitation', soiree: 'Soirée', maison: 'Maison' } as const
const AUTONOMY = { ask: 'Aura asks before anything', negotiate: 'Aura negotiates · you seal', hold: 'Aura negotiates and holds tables' } as const
const ease = [0.22, 1, 0.36, 1] as const

export function Home() {
  const { s } = useApp()
  const nav = useNav()
  const [settled, setSettled] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSettled(true), 1600); return () => clearTimeout(t) }, [])

  const known = Math.round(completeness(s) * 6)
  const next = CHAPTERS.find(c => s.chapters[c.id] === 'todo')
  const fresh = s.noticed.filter(n => n.status === 'new').length
  const lp = myChart(s).lifePath
  const v = s.me.verified
  const proofs = [v.selfie && 'selfie', v.id && 'ID', v.work && 'work'].filter(Boolean) as string[]
  const proofWords = proofs.length ? proofs.length === 1 ? proofs[0] : `${proofs.slice(0, -1).join(', ')} and ${proofs.at(-1)}` : 'not yet'

  return (
    <Screen top={<TopBar right={<IconButton icon="gear" label="Settings" onClick={() => nav.push('you/settings')} />} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 0 }}>
        <motion.div className="yu-diptych" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <Portrait photo={s.me.photos[0]} name={s.me.name} shape="arch" w={156} h={210} priority />
          <button className="yu-sigdisc" aria-label="Open your Signature" onClick={() => nav.push('you/explorer')}>
            <Signature layers={[{ modes: myModes(s), color: SIG.day }]} size={148} agitation={settled ? 0 : 0.5} grains={1300} />
          </button>
        </motion.div>

        <motion.div className="stack gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.7 }}>
          <h1 className="t-display" style={{ margin: 0 }}>{s.me.name}</h1>
          <div className="t-num t-small faint">Member No. {String(s.me.memberNo).padStart(5, '0')} · {s.me.city}</div>
        </motion.div>

        <div className="row gap-12">
          <Halo v={v} size={40}><span className="yu-halo-ico"><Icon name="shieldCheck" size={18} /></span></Halo>
          <div className="grow stack" style={{ gap: 2 }}>
            <span className="t-callout" style={{ fontWeight: 550 }}>Verified · {proofWords}</span>
            <span className="t-small faint">{proofs.length} of 3{!v.work ? ' · work is optional' : ''}</span>
          </div>
          {!v.work && <Button kind="ghost" size="sm" onClick={() => nav.push('arrival/verify')}>Add work</Button>}
        </div>

        <div className="card card-aura card-pad stack gap-16">
          <div className="row between"><Eyebrow>How well Aura knows you</Eyebrow><span className="t-num t-small faint">{known}/6</span></div>
          <div className="t-head balance">Aura knows you well in <span className="i">{known} of 6</span> areas.</div>
          <div className="yu-segs" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.i key={i} className={i < known ? 'on' : ''} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.6, ease }} />
            ))}
          </div>
          {next
            ? <div className="t-small muted">Next: <b style={{ fontWeight: 600 }}>{next.title}</b> · {next.mins} min. {next.blurb}</div>
            : <div className="t-small muted">Every chapter is done. Aura keeps learning from your choices.</div>}
          <Button kind="ember" block icon="sparkle" onClick={() => nav.push('conv/chapters')}>Continue your conversation</Button>
        </div>

        <Section label="Who you are">
          <div>
            <ListRow icon="constellation" title="Your Signature" sub="Six areas, each one yours to correct" onClick={() => nav.push('you/explorer')} />
            <ListRow icon="numbers" title="Your numbers" sub={`Life Path ${lp} · ${ARCHETYPE[lp].name}`} onClick={() => nav.push('you/numbers')} />
            <ListRow icon="sparkle" title="What Aura’s noticed" sub="What you say, and what you choose" right={fresh ? <Tag tone="ember">{fresh} new</Tag> : undefined} onClick={() => nav.push('you/noticed')} />
            <ListRow icon="book" title="Memory Lane & Almanac" sub="Almanac No. 6 · Sunday 11 October" onClick={() => nav.push('you/memory')} />
            <ListRow icon="eye" title="As others see you" sub="Your spread, and what a match may read" onClick={() => nav.push('you/preview')} />
          </div>
        </Section>

        <Section label="How Aura works for you">
          <div>
            <ListRow icon="compass" title="Your rules" sub={AUTONOMY[s.prefs.autonomy]} onClick={() => nav.push('you/rules')} />
            <ListRow icon="star" title="Membership" sub={`${s.me.datePasses} Date Pass${s.me.datePasses === 1 ? '' : 'es'} · Salons`} right={<Tag>{TIER[s.me.tier]}</Tag>} onClick={() => nav.push('premium/membership')} />
          </div>
        </Section>

        <Section label="Privacy and quiet">
          <div>
            <ListRow icon="shield" title="Privacy & data" sub="Six consents · raw audio gone within 24 hours" onClick={() => nav.push('you/privacy')} />
            <ListRow icon="eyeOff" title="Discretion" sub={`${s.discreet.blocked} people hidden${s.discreet.sabbatical ? ' · introductions paused' : ''}`} onClick={() => nav.push('you/discretion')} />
            <ListRow icon="bell" title="Notifications" sub={`Quiet hours ${s.settings.quietHours ?? '10 PM–9 AM'}`} onClick={() => nav.push('sys/notifications')} />
            <ListRow icon="gear" title="Settings" sub={`Aura’s voice: ${s.me.voice}${s.settings.auraMuted ? ' · muted' : ''}`} onClick={() => nav.push('you/settings')} />
          </div>
        </Section>

        <div className="t-label faint center" style={{ paddingTop: 4 }}>L’Amour · New York · Autumn 2026</div>
      </div>
    </Screen>
  )
}
