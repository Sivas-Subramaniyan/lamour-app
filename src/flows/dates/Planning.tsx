// dates/planning: Aura at work, in plain words. Each line checks off in turn, then the three evenings open.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Orb, Eyebrow, AiBadge } from '../../design/ui'
import { planWith, patchPlan } from '../../state/store'
import { useNav } from '../../shell/nav'
import type { ScreenProps } from '../../shell/screens'
import { usePlan, session, nums, freshHold, DrawCheck } from './kit'

export function Planning({ params }: ScreenProps) {
  const { s, update, id, first } = usePlan(params)
  const nav = useNav()
  const [n, setN] = useState(0) // lines finished
  const [level, setLevel] = useState(0.3)
  const left = useRef(false)

  const lines = [
    session.named.length ? `Took your three evenings · ${session.named.map(x => x.split(',')[0]).join(', ')}` : `Checked your ${session.calendar ? `${session.calendar} ` : ''}calendar · 9 free evenings`,
    `${first} shared 4 evenings`,
    'Found 3 evenings you’re both free',
    'Looked at 6 tables between you',
    `Kept travel under ${s.prefs.travelCap} minutes each`,
    'Held 3 tables for 10 minutes',
  ]
  const done = n >= lines.length

  const finish = () => {
    if (left.current) return
    left.current = true
    update(st => { const pl = planWith(st, id); return pl && pl.status === 'negotiating' ? patchPlan(st, pl.id, { holdUntil: freshHold() }) : st })
    nav.replace('dates/proposals', { id })
  }

  // The orb breathes while Aura works, and settles once she's done.
  useEffect(() => {
    if (done) { setLevel(0); return }
    let t = 0
    const iv = setInterval(() => { t += 1; setLevel(0.32 + 0.28 * Math.sin(t / 2.4) + Math.random() * 0.18) }, 120)
    return () => clearInterval(iv)
  }, [done])

  useEffect(() => {
    const t = setTimeout(done ? finish : () => setN(x => x + 1), done ? 1200 : n === 0 ? 800 : 600)
    return () => clearTimeout(t)
  }, [n])

  return (
    <Screen top={<TopBar right={<AiBadge text="Aura" />} />}
      footer={<Button kind="quiet" block onClick={finish}>{done ? 'Opening your three evenings' : 'Show me now'}</Button>}>
      <div className="pad stack gap-24" style={{ paddingTop: 4, alignItems: 'center' }}>
        <div className="dt-orbwrap">
          <motion.div className="dt-orbglow" animate={{ opacity: done ? 0.55 : [0.6, 1, 0.6] }} transition={done ? { duration: 0.6 } : { duration: 2.4, repeat: Infinity }} />
          <Orb size={104} level={level} />
        </div>

        <div className="stack gap-8 center" style={{ alignItems: 'center' }}>
          <Eyebrow>Aura at work</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}><span className="i">Setting a table</span> for you and {first}.</h1>
        </div>

        <div className="dt-log" aria-live="polite">
          {lines.map((l, i) => i <= n && (
            <motion.div key={i} className="dt-log-row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <span className={`dt-check ${i < n ? 'on' : ''}`}>{i < n ? <DrawCheck /> : <span className="dt-dots" aria-label="Working"><i /><i /><i /></span>}</span>
              <span className={i < n ? '' : 'muted'}>{nums(l)}</span>
            </motion.div>
          ))}
        </div>

        <motion.p className="t-quote center" style={{ margin: 0, fontSize: 19 }} initial={{ opacity: 0 }} animate={{ opacity: done ? 1 : 0 }} transition={{ duration: 0.6 }}>
          Three evenings, ready for you.
        </motion.p>
      </div>
    </Screen>
  )
}
