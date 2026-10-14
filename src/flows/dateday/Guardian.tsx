// day/guardian: up to three trusted people, a preview of exactly what they receive, and a check-in time.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Chip, Tag, Toggle, Eyebrow, Section, Sheet, Field, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useNow, patchPlan, addNotice, fmtTime } from '../../state/store'
import type { ScreenProps } from '../../shell/screens'
import { useDate, isReady, NoTable, myPron, joinNames, plus, localIso, WORDS, type Ready } from './shared'

export function Guardian({ params }: ScreenProps) {
  const d = useDate(params)
  return isReady(d) ? <GuardianBody d={d} /> : <NoTable d={d} title="Guardian Circle" />
}

const RELATIONS = ['Sister', 'Brother', 'Best friend', 'Friend', 'Parent', 'Roommate']

function GuardianBody({ d }: { d: Ready }) {
  const { s, update, id, p, plan, opt, v } = d
  const { toast } = useFeedback()
  const now = useNow(30000)
  const me = myPron(s)
  const on = s.guardians.filter(g => g.on).map(g => g.name)
  const who = joinNames(on)
  const when = new Date(opt.when)
  const mins = plan.checkInMins ?? 45
  const checkAt = plus(when, mins)
  const [sent, setSent] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [rel, setRel] = useState('Friend')

  const toggle = (i: number, val: boolean) => { setSent(false); update(st => ({ ...st, guardians: st.guardians.map((g, j) => (j === i ? { ...g, on: val } : g)) })) }
  const add = () => {
    const n = name.trim()
    update(st => ({ ...st, guardians: [...st.guardians, { name: n, relation: rel, on: true }].slice(0, 3) }))
    toast(`${n} is in your circle`)
    setAdding(false); setName(''); setSent(false)
  }
  const send = () => {
    update(st => addNotice(st, { title: `${who} ${on.length > 1 ? 'have' : 'has'} your evening`, body: `${p.first} · ${v.name} · ${fmtTime(when)}. Live location from ${fmtTime(plus(when, -15))}.`, at: localIso(now), screen: 'day/guardian', params: { id } }))
    setSent(true)
    toast(`Sent. ${who} ${on.length > 1 ? 'have' : 'has'} your evening.`)
  }

  return (
    <Screen top={<TopBar title="Guardian Circle" />}
      footer={
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.div key="sent" className="dd-sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Icon name="shieldCheck" size={20} /> {who} {on.length > 1 ? 'have' : 'has'} it. Nothing else to do.
            </motion.div>
          ) : (
            <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button kind="commit" block icon="send" disabled={!on.length} onClick={send}>{on.length ? `Send to ${who}` : 'Turn someone on to send'}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      }>
      <div className="pad stack gap-32" style={{ paddingTop: 8 }}>
        <div className="stack gap-12">
          <h1 className="t-title balance" style={{ margin: 0 }}>Someone who knows <span className="i">where you are.</span></h1>
          <p className="t-callout muted" style={{ margin: 0 }}>Up to three people you trust. They hear about your evening only while it’s happening, and only what you see below.</p>
        </div>

        <Section label="Your circle" action={<span className="t-small faint t-num">{on.length} of 3 on</span>}>
          <div className="card card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {s.guardians.map((g, i) => (
              <div key={g.name + i} className="list-row">
                <span className="dd-mono">{g.name.slice(0, 1)}</span>
                <span className="grow stack" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 550, fontSize: 15.5 }}>{g.name}</span>
                  <span className="t-small muted">{g.relation}{g.on ? ' · will receive tonight’s card' : ''}</span>
                </span>
                <Toggle on={g.on} label={`${g.name} receives tonight’s card`} onChange={val => toggle(i, val)} />
              </div>
            ))}
            {s.guardians.length < 3 && (
              <button className="list-row" onClick={() => setAdding(true)}>
                <span className="dd-mono add"><Icon name="plus" size={18} /></span>
                <span className="grow" style={{ fontWeight: 550, fontSize: 15.5 }}>Add someone</span>
              </button>
            )}
          </div>
        </Section>

        <Section label={`Exactly what ${who || 'they'} will receive`}>
          <div className="dd-sms">
            <div className="row between t-small faint"><span className="row gap-8"><Icon name="message" size={15} /> Text message · L’Amour</span><span className="t-num">{fmtTime(plus(when, -120))}</span></div>
            <motion.div className="dd-bubble" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
              {s.me.name} is on a date tonight with {p.first} at {v.name}, {v.hood}, {fmtTime(when)}. You’ll get {me.his} live location from {fmtTime(plus(when, -15))} to {fmtTime(plus(when, 180))}, then it stops on its own. If {me.he} {me.is === 'are' ? 'miss' : 'misses'} {me.his} {fmtTime(checkAt)} check-in, we’ll text you first.
            </motion.div>
            <motion.div className="dd-bubble link" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}>
              <Icon name="pin" size={16} /> Live location · opens {fmtTime(plus(when, -15))}
            </motion.div>
            <div className="row gap-8 wrap"><Tag tone="sage" icon="check">Works without the app</Tag><Tag icon="lock">Only during the date</Tag></div>
          </div>
          <span className="t-small faint">Never shared: {p.first}’s last name or photos, your messages, or where either of you lives.</span>
        </Section>

        <Section label="Check in after">
          <div className="row gap-8">
            {[30, 45, 60].map(m => <Chip key={m} on={mins === m} onClick={() => update(st => patchPlan(st, plan.id, { checkInMins: m }))}>{m} min</Chip>)}
          </div>
          <p className="t-callout muted" style={{ margin: 0 }}>
            At <span className="t-num">{fmtTime(checkAt)}</span>, {WORDS[mins] ?? mins} minutes in, Aura quietly asks if all is well. If you don’t answer within ten minutes, {on[0] ?? 'your circle'} hears from us.
          </p>
        </Section>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add to your circle">
        <div className="stack gap-20">
          <Field label="Their name"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="First name" autoFocus /></Field>
          <div className="stack gap-8">
            <Eyebrow>Who they are to you</Eyebrow>
            <div className="row gap-8 wrap">{RELATIONS.map(r => <Chip key={r} on={rel === r} onClick={() => setRel(r)}>{r}</Chip>)}</div>
          </div>
          <span className="t-small muted">They get a text from L’Amour only on nights you choose. No app, no account.</span>
          <Button kind="commit" block disabled={!name.trim()} onClick={add}>Add {name.trim() || 'to circle'}</Button>
        </div>
      </Sheet>
    </Screen>
  )
}
