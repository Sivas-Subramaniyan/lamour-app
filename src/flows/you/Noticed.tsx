// you/noticed: revealed preferences next to stated ones. The user confirms, sets aside or forgets each pattern.
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, EmptyState, Toggle } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, type NoticedCard, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { useRecalc, Recalculating } from './shared'

const uniq = (a: string[]) => [...new Set(a)]
const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)
/** "You told me you want someone ambitious." → "You want someone ambitious." */
const told = (t: string) => { const r = t.replace(/^You (told me|said) /, ''); return r.charAt(0).toUpperCase() + r.slice(1) }

function withStatus(s: State, n: NoticedCard, status: NoticedCard['status']): State {
  const use = status === 'confirmed' || status === 'new'
  const likes = use ? uniq([...s.learned.likes, ...(n.likes ?? [])]) : s.learned.likes.filter(l => !n.likes?.includes(l))
  const avoids = use ? uniq([...s.learned.avoids, ...(n.avoids ?? [])]) : s.learned.avoids.filter(l => !n.avoids?.includes(l))
  return { ...s, learned: { ...s.learned, likes, avoids }, noticed: s.noticed.map(c => (c.id === n.id ? { ...c, status } : c)) }
}

export function Noticed() {
  const { s, update } = useApp()
  const nav = useNav()
  const { busy, run } = useRecalc()
  const cards = s.noticed.filter(n => n.status !== 'forgotten')
  const fresh = cards.filter(n => n.status === 'new').length
  const learning = s.consents.learning

  const act = (n: NoticedCard, status: NoticedCard['status'], done: string) => { update(s => withStatus(s, n, status)); run(done) }

  return (
    <Screen top={<TopBar title="What Aura’s noticed" />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-12">
          <Eyebrow>Revealed preferences</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>What you say, <span className="i">and what you choose.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>
            I compare what you told me with who you actually lean in to. Nothing here changes your matches until you confirm it.
          </p>
          {fresh > 0 && <div><Tag tone="ember">{fresh} new since Sunday</Tag></div>}
        </div>

        <Recalculating show={busy} />

        <div className="stack gap-16">
          <AnimatePresence initial={false}>
            {cards.map(n => (
              <motion.article key={n.id} layout className={`card card-pad stack gap-16 ${n.status === 'notme' ? 'yu-dim' : ''}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: -16, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
                style={{ overflow: 'hidden' }}>
                <div className="row between gap-8">
                  {n.status === 'new' ? <Tag tone="ember">New</Tag> : n.status === 'confirmed' ? <Tag tone="sage" icon="check">Confirmed</Tag> : <Tag>Set aside</Tag>}
                  <span className="t-small faint row gap-4" style={{ textAlign: 'right' }}><Icon name="filter" size={14} />From {lowerFirst(n.from)}</span>
                </div>
                {n.told && (
                  <>
                    <div className="stack gap-4">
                      <Eyebrow>You told me…</Eyebrow>
                      <p className="t-body" style={{ margin: 0 }}>{told(n.told)}</p>
                    </div>
                    <div className="yu-versus"><span>and yet</span></div>
                  </>
                )}
                <div className="stack gap-4">
                  <Eyebrow>You lean toward…</Eyebrow>
                  <p className="t-quote balance" style={{ margin: 0 }}>{n.lean}</p>
                </div>
                <div className="row gap-8 wrap">
                  {n.status !== 'confirmed' && n.status !== 'notme' && <Button kind="commit" size="sm" icon="check" onClick={() => act(n, 'confirmed', 'Confirmed. I’ll lean on this in your letter.')}>Confirm</Button>}
                  {n.status === 'notme'
                    ? <Button kind="soft" size="sm" icon="undo" onClick={() => act(n, 'new', 'Back on the table. Confirm it when you’re sure.')}>Bring it back</Button>
                    : <Button kind="ghost" size="sm" onClick={() => act(n, 'notme', 'Set aside. I won’t use it.')}>Not me</Button>}
                  <Button kind="quiet" size="sm" icon="trash" onClick={() => act(n, 'forgotten', 'Forgotten. It’s gone from your Signature.')}>Forget</Button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
          {!cards.length && <EmptyState icon="sparkle" title="Nothing new to show" body="When your choices start to say something your words haven’t, it will appear here first." />}
        </div>

        <div className="card-flat stack gap-12" style={{ padding: 16 }}>
          <div className="row gap-12">
            <span className="grow t-callout" style={{ fontWeight: 550 }}>Learn from my choices</span>
            <Toggle on={learning} label="Learn from my choices" onChange={on => update(s => ({ ...s, consents: { ...s.consents, learning: on } }))} />
          </div>
          <span className="t-small muted pretty">
            {learning
              ? 'This is how I notice patterns like these. You can switch it off here or in Privacy, and I’ll only use what you tell me.'
              : 'Off. I won’t notice anything new, and I’ll only use what you tell me.'}
          </span>
          <Button kind="quiet" size="sm" iconRight="chevron" onClick={() => nav.push('you/privacy')} style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>Privacy & data</Button>
        </div>
      </div>
    </Screen>
  )
}
