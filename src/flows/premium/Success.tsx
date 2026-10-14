// premium/success: a quiet ceremony. Ember bloom, the seal presses in, and tonight's veiled introductions come into focus.
import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Eyebrow, AiBadge, Portrait, WaxSeal } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useApp } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { useNav } from '../../shell/nav'
import { chime, haptic } from '../../lib/voice'
import { DEPOSIT, memberNo } from './kit'

const ROMAN = ['I', 'II', 'III']
const ease = [0.22, 1, 0.36, 1] as const

export function Success() {
  const { s } = useApp()
  const nav = useNav()
  useEffect(() => {
    const t = setTimeout(() => { if (!s.settings.auraMuted) chime(); haptic([10, 60, 10]) }, 450)
    return () => clearTimeout(t)
  }, [])
  const ids = s.tonight.ids
  const more = ids.slice(1).map(id => PERSONAS[id].first)
  const changed: { icon: IconName; t: string; d: string }[] = [
    { icon: 'moon', t: `All ${ids.length === 3 ? 'three' : ids.length} introductions are open`, d: more.length ? `${more.join(' and ')} ${more.length > 1 ? 'are' : 'is'} waiting in tonight’s letter.` : 'Your whole letter, every evening.' },
    { icon: 'heart', t: 'Every care note, in full', d: 'For everyone in your letter, tonight and after.' },
    { icon: 'clock', t: 'Aura can hold tables', d: 'Up to ten minutes, inside your rules. You still seal.' },
    { icon: 'ticket', t: 'Two Date Passes a month', d: `Each one covers your ${DEPOSIT} deposit.` },
    { icon: 'book', t: 'Your first Monograph of Two', d: 'When you and someone are ready, and both say yes.' },
  ]

  return (
    <Screen top={<TopBar left={<span />} right={<AiBadge text="Aura" />} />}
      footer={<div className="stack gap-8"><Button kind="ember" block onClick={() => nav.goTab('tonight')}>Back to tonight</Button><Button kind="quiet" block onClick={() => nav.push('premium/membership')}>See your membership</Button></div>}>
      <div style={{ position: 'relative' }}>
        <motion.div className="pm-bloom" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease }} />
        <div className="pad stack gap-24" style={{ alignItems: 'center', position: 'relative', paddingTop: 8 }}>
          <WaxSeal text="S" size={108} />
          <motion.div className="stack gap-12 center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8, ease }}>
            <Eyebrow>Soirée · Member No. <span className="t-num">{memberNo(s)}</span></Eyebrow>
            <h1 className="t-display balance" style={{ margin: 0 }}>Welcome to <span className="i">Soirée.</span></h1>
            <p className="t-quote muted pretty" style={{ margin: 0, fontSize: 20 }}>Tonight’s letter is yours in full. I’ll keep everything else quiet until you need it.</p>
          </motion.div>

          <div className="row gap-12" style={{ justifyContent: 'center' }}>
            {ids.map((id, i) => (
              <div key={id} className="stack gap-8" style={{ alignItems: 'center' }}>
                <motion.div style={{ borderRadius: '999px 999px 14px 14px', overflow: 'hidden' }}
                  initial={{ filter: i ? 'blur(12px)' : 'blur(0px)', opacity: i ? 0.7 : 1 }} animate={{ filter: 'blur(0px)', opacity: 1 }} transition={{ delay: 1.3 + i * 0.35, duration: 1.2, ease }}>
                  <Portrait photo={PERSONAS[id].photos.portrait} name={PERSONAS[id].first} w={74} h={98} />
                </motion.div>
                <span className="serif i faint" style={{ fontSize: 17 }}>{ROMAN[i]}</span>
              </div>
            ))}
          </div>

          <section className="stack gap-12" style={{ alignSelf: 'stretch' }}>
            <Eyebrow>What changed tonight</Eyebrow>
            <div className="card card-pad stack" style={{ padding: '6px 18px' }}>
              {changed.map((c, i) => (
                <motion.div key={c.t} className="pm-changed" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 + i * 0.12, duration: 0.5, ease }}>
                  <span className="pm-changed-ico"><Icon name={c.icon} size={18} /></span>
                  <span className="stack" style={{ gap: 2 }}><b className="t-callout">{c.t}</b><span className="t-small muted">{c.d}</span></span>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Screen>
  )
}
