// conv/signature: the reference screen for quality and patterns (night theme, generative mark, editorial type, sourced traits).
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, AiBadge, Meter } from '../../design/ui'
import { Signature, signatureModes } from '../../design/signature'
import { useApp, completeness, CHAPTERS } from '../../state/store'
import { useNav } from '../../shell/nav'
import { topValues } from '../../lib/compat'

export function SignatureReveal() {
  const { s } = useApp()
  const nav = useNav()
  const [settled, setSettled] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSettled(true), 2600); return () => clearTimeout(t) }, [])
  const t = s.me.traits
  const known = Math.round(completeness(s) * 6)
  const traits = [
    { label: 'Social energy', value: t.extraversion, words: t.extraversion < 0.5 ? 'Small rooms, long talks' : 'Lights up around people' },
    { label: 'Curiosity', value: t.openness, words: t.openness > 0.7 ? 'Restless for the new' : 'Loves the familiar' },
    { label: 'Under stress', value: t.conflict === 'pursue' ? 0.75 : 0.35, words: t.conflict === 'pursue' ? 'Moves toward' : 'Steps back to think' },
  ]

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}
      footer={<div className="stack gap-8"><Button kind="ember" block onClick={() => nav.push('conv/numbers')}>See your numbers</Button><Button kind="quiet" block onClick={() => nav.push('you/explorer')}>Explore every trait</Button></div>}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-8 center" style={{ alignItems: 'center' }}>
          <Eyebrow>Your Signature</Eyebrow>
          <motion.h1 className="t-title balance" style={{ margin: 0 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: settled ? 1 : 0, y: settled ? 0 : 8 }} transition={{ duration: 0.8 }}>
            <span className="i">That’s you,</span> so far.
          </motion.h1>
        </div>

        <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, var(--glow), transparent 65%)' }} />
          <Signature layers={[{ modes: signatureModes(t), color: '#efb08a' }]} size={280} agitation={settled ? 0 : 0.6} />
        </div>

        <p className="t-callout muted center pretty" style={{ margin: 0 }}>
          Drawn from what you told me across {Object.values(s.chapters).filter(c => c === 'done').length} chapters. It shifts as I learn, and you can correct anything.
        </p>

        <div className="card card-pad stack gap-16">
          <div className="row between"><Eyebrow>What I know well</Eyebrow><Tag tone="ember">{known} of 6 areas</Tag></div>
          {traits.map(x => (
            <div key={x.label} className="stack gap-8">
              <div className="row between"><span className="t-callout" style={{ fontWeight: 550 }}>{x.label}</span><span className="t-small muted">{x.words}</span></div>
              <Meter value={x.value} color="var(--accent)" />
            </div>
          ))}
          <div className="row gap-8 wrap">{topValues(t, 3).map(v => <Tag key={v}>{v}</Tag>)}</div>
        </div>

        <div className="card-flat card-pad stack gap-8" style={{ padding: 16 }}>
          <Eyebrow>Still learning</Eyebrow>
          <span className="t-callout muted">{CHAPTERS.filter(c => s.chapters[c.id] === 'todo').map(c => c.title).join(' · ') || 'Nothing. I know you well.'}</span>
        </div>
      </div>
    </Screen>
  )
}
