// sys/notifications: the in-app notification centre. Today / Earlier by the demo clock; tap opens and marks read.
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Eyebrow, EmptyState, Button, useFeedback } from '../../design/ui'
import { Icon, type IconName } from '../../design/icons'
import { useApp, useNow, type Notice } from '../../state/store'
import { useNav } from '../../shell/nav'

const ICON_FOR: Record<string, IconName> = { tonight: 'moon', conn: 'message', dates: 'ticket', day: 'shield', after: 'sun', you: 'user', premium: 'star', conv: 'sparkle', arrival: 'sparkle', sys: 'bell' }
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

function ago(at: string, now: Date) {
  const d = new Date(at), ms = now.getTime() - d.getTime()
  if (ms < 60e3) return 'now'
  if (ms < 3600e3) return `${Math.floor(ms / 60e3)}m ago`
  if (sameDay(d, now)) return `${Math.floor(ms / 3600e3)}h ago`
  if (ms < 6 * 864e5) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function Notifications() {
  const { s, update } = useApp()
  const nav = useNav()
  const now = useNow(30000)
  const { toast } = useFeedback()
  const list = [...s.notifications].sort((a, b) => b.at.localeCompare(a.at))
  const today = list.filter(n => sameDay(new Date(n.at), now) || new Date(n.at) > now)
  const earlier = list.filter(n => !today.includes(n))
  const unread = list.filter(n => !n.read).length
  const quiet = s.settings.quietHours ?? '10 PM–9 AM'

  const markRead = (id?: string) => update(st => ({ ...st, notifications: st.notifications.map(x => (!id || x.id === id ? { ...x, read: true } : x)) }))
  const open = (n: Notice) => {
    markRead(n.id)
    if (n.screen) nav.push(n.screen, n.params)
    else toast('Marked as read.')
  }
  const readAll = <button className="sy-link" disabled={!unread} onClick={() => { markRead(); toast('All caught up.') }}>Read all</button>

  let i = 0
  const group = (label: string, items: Notice[]) => items.length > 0 && (
    <section className="stack gap-8">
      <Eyebrow>{label}</Eyebrow>
      <div className="card" style={{ padding: '2px 16px' }}>
        {items.map(n => {
          const d = i++
          return (
            <motion.button key={n.id} className={`sy-note ${n.read ? '' : 'unread'}`} onClick={() => open(n)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + d * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <span className="sy-note-ico"><Icon name={ICON_FOR[n.screen?.split('/')[0] ?? 'sys'] ?? 'bell'} size={19} /></span>
              <span className="grow stack" style={{ gap: 2 }}>
                <span className="row between gap-8">
                  <span className="sy-note-title">{n.title}</span>
                  <span className="t-small faint" style={{ flexShrink: 0 }}>{ago(n.at, now)}</span>
                </span>
                <span className="t-callout muted">{n.body}</span>
              </span>
              <AnimatePresence>{!n.read && <motion.i className="sy-dot" exit={{ scale: 0, opacity: 0 }} aria-label="Unread" />}</AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </section>
  )

  return (
    <Screen top={<TopBar back onBack={nav.canGoBack ? nav.pop : () => nav.goTab('you')} right={readAll} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-4">
          <h1 className="t-title" style={{ margin: 0 }}>Notifications</h1>
          <span className="t-callout muted">{unread ? `${unread} unread` : 'All caught up'} · Aura only writes when something needs you.</span>
        </div>

        {list.length === 0
          ? <EmptyState icon="bell" title="All quiet" body="Your letter arrives at dusk. Until then, nothing needs you." action={<Button kind="soft" size="md" onClick={() => nav.goTab('tonight')}>Back to tonight</Button>} />
          : <>{group('Today', today)}{group('Earlier', earlier)}</>}

        <div className="stack gap-12">
          <div className="card-flat card-pad row gap-12" style={{ alignItems: 'flex-start' }}>
            <span className="sy-note-ico"><Icon name="moon" size={18} /></span>
            <span className="grow stack gap-4">
              <b className="t-callout">Quiet hours · <span className="t-num">{quiet}</span></b>
              <span className="t-small muted">Nothing arrives overnight except safety messages. Your Morning After waits until 10.</span>
              <button className="sy-link" style={{ alignSelf: 'flex-start' }} onClick={() => nav.push('you/settings')}>Change quiet hours</button>
            </span>
          </div>
          <div className="card-flat card-pad row gap-12" style={{ alignItems: 'flex-start' }}>
            <span className="sy-note-ico"><Icon name={s.discreet.hideNames ? 'eyeOff' : 'eye'} size={18} /></span>
            <span className="grow stack gap-4">
              <b className="t-callout">Discreet Mode is {s.discreet.hideNames ? 'on' : 'off'}</b>
              <span className="t-small muted">{s.discreet.hideNames ? 'Your lock screen says “Something arrived for you” and never shows a name.' : 'Names show on your lock screen. Discreet Mode keeps them inside the app.'}</span>
              <span className="row gap-16">
                <button className="sy-link" onClick={() => nav.push('you/discretion')}>Discretion settings</button>
                <button className="sy-link" onClick={() => nav.push('sys/lockscreen')}>See your lock screen</button>
              </span>
            </span>
          </div>
        </div>
      </div>
    </Screen>
  )
}
