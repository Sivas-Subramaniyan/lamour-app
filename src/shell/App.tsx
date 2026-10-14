// Prototype shell. Desktop: Flow Navigator · phone · Director's panel. Phone-sized screens: the app full-screen, with a tiny prototype menu.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AppProvider, useApp, useNow, goToPhase, PHASE_TIME, type Phase, leadId } from '../state/store'
import { NavProvider, useNav, tabRoot } from './nav'
import { REGISTRY, tabOf } from './registry'
import { FLOWS, SCREEN_IDS, type ScreenId, type TabName } from './screens'
import { TOUR } from './tour'
import { FeedbackProvider, Orb, Sheet, Segmented, Toggle } from '../design/ui'
import { Icon, type IconName } from '../design/icons'
import { stopSpeaking } from '../lib/voice'
import './shell.css'

export default function App() {
  return (
    <AppProvider>
      <NavProvider>
        <Prototype />
      </NavProvider>
    </AppProvider>
  )
}

function useIsPhone() {
  const q = '(max-width: 760px)'
  const [m, setM] = useState(() => matchMedia(q).matches)
  useEffect(() => { const mq = matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on) }, [])
  return m
}

function Prototype() {
  const phone = useIsPhone()
  if (phone) return <div className="proto-phone"><Viewport fullscreen /></div>
  return (
    <div className="proto">
      <header className="proto-head">
        <div className="row gap-12"><span className="proto-mark">L’Amour</span><span className="proto-sub">Clickable prototype · v0.1</span></div>
        <TourBar />
      </header>
      <aside className="proto-left"><FlowNavigator /></aside>
      <main className="proto-stage"><Device><Viewport /></Device></main>
      <aside className="proto-right"><Director /></aside>
    </div>
  )
}

function Device({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current!.parentElement!
    const fit = () => setScale(Math.min(1, (el.clientHeight - 40) / 868, (el.clientWidth - 24) / 414))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="device" style={{ transform: `scale(${scale})` }}>
      <div className="device-screen">{children}</div>
      <div className="device-island" />
    </div>
  )
}

// ---------- the app viewport ----------

function Viewport({ fullscreen }: { fullscreen?: boolean }) {
  const nav = useNav()
  const def = REGISTRY[nav.top.id]
  const theme = def.theme ?? 'day'
  const showTabs = def.chrome === 'tabs'
  useEffect(() => () => stopSpeaking(), [nav.top.key])
  return (
    <div className={`viewport theme-${theme} ${fullscreen ? 'fullscreen' : ''}`} style={{ ['--tabbar-h' as any]: showTabs ? '64px' : '0px' }}>
      <FeedbackProvider>
        <ScreenStack />
        <StatusBar theme={theme} fullscreen={fullscreen} />
        <AnimatePresence>{showTabs && <TabBar key="tabs" />}</AnimatePresence>
        {!fullscreen && <div className="home-indicator" />}
      </FeedbackProvider>
    </div>
  )
}

const variants = {
  push: {
    initial: (d: number) => (d === 0 ? { opacity: 0 } : { x: d > 0 ? '100%' : '-28%', opacity: d > 0 ? 1 : 0.6 }),
    animate: { x: 0, opacity: 1 },
    exit: (d: number) => (d === 0 ? { opacity: 0 } : { x: d > 0 ? '-28%' : '100%', opacity: d > 0 ? 0.6 : 1 }),
  },
  modal: {
    initial: (d: number) => (d >= 0 ? { y: '100%' } : { opacity: 0.6 }),
    animate: { y: 0, opacity: 1 },
    exit: (d: number) => (d < 0 ? { y: '100%' } : { opacity: 0.6 }),
  },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
}

function ScreenStack() {
  const nav = useNav()
  const top = nav.top
  const def = REGISTRY[top.id]
  const v = variants[def.presentation ?? 'push']
  const C = def.component
  return (
    <AnimatePresence initial={false} custom={nav.dir}>
      <motion.div key={top.key} className={`layer theme-${def.theme ?? 'day'}`} custom={nav.dir} variants={v as any} initial="initial" animate="animate" exit="exit"
        transition={def.presentation === 'fade' ? { duration: 0.9, ease: [0.22, 1, 0.36, 1] } : { type: 'spring', damping: 34, stiffness: 330, mass: 0.9 }}
        style={{ zIndex: nav.dir < 0 ? 1 : 2 }}>
        <C params={top.params} />
      </motion.div>
    </AnimatePresence>
  )
}

function StatusBar({ theme, fullscreen }: { theme: string; fullscreen?: boolean }) {
  const now = useNow(15000)
  const [menu, setMenu] = useState(false)
  if (fullscreen) return (
    <>
      <button className={`proto-fab theme-${theme}`} aria-label="Prototype menu" onClick={() => setMenu(true)}><Icon name="compass" size={18} /></button>
      <Sheet open={menu} onClose={() => setMenu(false)} title="Prototype"><div className="stack gap-24"><TimeControls onDone={() => setMenu(false)} /><FlowNavigator onPick={() => setMenu(false)} /></div></Sheet>
    </>
  )
  return (
    <div className={`statusbar theme-${theme}`}>
      <span className="t-num" style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 15.5 }}>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ [AP]M/, '')}</span>
      <span className="row gap-4">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx=".8" /><rect x="5" y="5" width="3" height="6" rx=".8" /><rect x="10" y="2.5" width="3" height="8.5" rx=".8" /><rect x="15" y="0" width="3" height="11" rx=".8" /></svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .6 10.2 10.2 0 0 0 .9 3.4L2 4.6a8.6 8.6 0 0 1 6-2.4zm0 3.3c1.4 0 2.6.5 3.6 1.4l1.1-1.2A6.8 6.8 0 0 0 8 3.9a6.8 6.8 0 0 0-4.7 1.8l1.1 1.2c1-.9 2.2-1.4 3.6-1.4zM8 8.8l2.1-2.2A3.2 3.2 0 0 0 8 5.9c-.8 0-1.6.3-2.1.7z" /></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x=".5" y=".5" width="22" height="11" rx="3.5" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4z" fill="currentColor" opacity=".4" /></svg>
      </span>
    </div>
  )
}

const TABS: { tab: TabName; label: string; icon: IconName }[] = [
  { tab: 'tonight', label: 'Tonight', icon: 'moon' },
  { tab: 'table', label: 'Table', icon: 'rings' },
  { tab: 'aura', label: 'Aura', icon: 'sparkle' },
  { tab: 'plans', label: 'Plans', icon: 'ticket' },
  { tab: 'you', label: 'You', icon: 'user' },
]

function TabBar() {
  const nav = useNav()
  const { s } = useApp()
  const active = tabOf(nav.top.id)
  const yourTurn = s.connections.some(c => c.yourTurnUntil && c.stage === 'talking')
  return (
    <motion.nav className="tabbar" initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} aria-label="Main">
      {TABS.map(t => t.tab === 'aura' ? (
        <button key={t.tab} className={`tab tab-aura ${active === t.tab ? 'on' : ''}`} onClick={() => nav.goTab('aura')} aria-label="Aura">
          <Orb size={40} />
        </button>
      ) : (
        <button key={t.tab} className={`tab ${active === t.tab ? 'on' : ''}`} onClick={() => nav.goTab(t.tab)} aria-current={active === t.tab ? 'page' : undefined}>
          <span style={{ position: 'relative' }}>
            <Icon name={t.icon} size={23} stroke={active === t.tab ? 1.9 : 1.5} />
            {t.tab === 'table' && yourTurn && <i className="tab-dot" />}
          </span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </motion.nav>
  )
}

// ---------- prototype chrome (outside the phone) ----------

function FlowNavigator({ onPick }: { onPick?: () => void }) {
  const nav = useNav()
  const { s } = useApp()
  const cur = useRef<HTMLButtonElement>(null)
  useEffect(() => { cur.current?.scrollIntoView({ block: 'nearest' }) }, [nav.top.id])
  return (
    <div className="flownav">
      {FLOWS.map(f => (
        <div key={f.key} className="flownav-group">
          <div className="flownav-label">{f.label}</div>
          {SCREEN_IDS.filter(id => id.startsWith(f.prefix)).map(id => (
            <button key={id} ref={id === nav.top.id ? cur : undefined} className={`flownav-item ${id === nav.top.id ? 'on' : ''}`}
              onClick={() => { nav.reset(id as ScreenId, { id: leadId(s, nav.top.params) }); onPick?.() }}>
              {REGISTRY[id].title}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

const PHASES: { value: Phase; label: string; to: (s: any) => ScreenId }[] = [
  { value: 'afternoon', label: 'Afternoon', to: () => 'tonight/dusk' },
  { value: 'dusk', label: 'Dusk', to: () => 'tonight/letter' },
  { value: 'date-night', label: 'Date night', to: () => 'day/live' },
  { value: 'morning-after', label: 'Morning', to: () => 'after/morning' },
]

function TimeControls({ onDone }: { onDone?: () => void }) {
  const { s, update, reset } = useApp()
  const nav = useNav()
  return (
    <div className="stack gap-16">
      <div className="stack gap-8">
        <div className="proto-label">Story time · {new Date(PHASE_TIME[s.phase]).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</div>
        <Segmented value={s.phase} options={PHASES.map(p => ({ value: p.value, label: p.label }))}
          onChange={v => { update(st => goToPhase(st, v)); nav.reset(PHASES.find(p => p.value === v)!.to(s), { id: s.tonight.ids[0] }); onDone?.() }} />
      </div>
      <div className="stack gap-8">
        <div className="proto-label">Point of view · who you’d like to meet</div>
        <Segmented value={s.me.seeking} options={[{ value: 'men', label: 'Men' }, { value: 'women', label: 'Women' }, { value: 'everyone', label: 'Everyone' }]}
          onChange={v => { reset(v); nav.reset('tonight/dusk'); onDone?.() }} />
      </div>
      <div className="row between">
        <span className="t-callout">Aura speaks aloud</span>
        <Toggle label="Aura speaks aloud" on={!s.settings.auraMuted} onChange={on => update(st => ({ ...st, settings: { ...st.settings, auraMuted: !on } }))} />
      </div>
      <button className="proto-reset" onClick={() => { reset(s.me.seeking); nav.reset('arrival/splash'); onDone?.() }}><Icon name="refresh" size={16} /> Reset demo</button>
    </div>
  )
}

function Director() {
  const nav = useNav()
  const def = REGISTRY[nav.top.id]
  return (
    <div className="director">
      <div className="stack gap-8">
        <div className="proto-label">On screen</div>
        <div className="director-title">{def.title}</div>
        <code className="director-id">#/{def.id}</code>
        {def.pillars && <div className="row gap-4 wrap">{def.pillars.map(p => <span key={p} className="pillar">{p}</span>)}</div>}
        {def.note && <p className="director-note">{def.note}</p>}
        {def.real && <p className="director-real"><b>Live here:</b> {def.real}</p>}
      </div>
      <hr className="proto-rule" />
      <TimeControls />
      <hr className="proto-rule" />
      <div className="stack gap-8 director-key">
        <div className="proto-label">Colour grammar</div>
        <div className="row gap-8"><i className="key-dot" style={{ background: '#d9663a' }} /> Ember: Aura did this</div>
        <div className="row gap-8"><i className="key-dot" style={{ background: '#8e2a2a' }} /> Oxblood: a person committed</div>
        <div className="row gap-8"><i className="key-dot" style={{ background: '#4f6b4a' }} /> Sage: confirmed, verified, safe</div>
      </div>
    </div>
  )
}

function TourBar() {
  const nav = useNav()
  const { s, update } = useApp()
  const i = TOUR.findIndex(t => t.screen === nav.top.id)
  const go = (n: number) => {
    const step = TOUR[Math.max(0, Math.min(TOUR.length - 1, n))]
    if (step.phase && step.phase !== s.phase) update(st => goToPhase(st, step.phase!))
    nav.reset(step.screen, step.lead ? { id: s.tonight.ids[0] } : {})
  }
  return (
    <div className="tourbar">
      <button className="tour-btn" onClick={() => go(i - 1)} disabled={i <= 0} aria-label="Previous step"><Icon name="back" size={16} /></button>
      <div className="tour-say">{i >= 0 ? <><b>{i + 1}/{TOUR.length}</b> {TOUR[i].say}</> : <span>Golden path · <button className="tour-link" onClick={() => go(0)}>start the tour</button></span>}</div>
      <button className="tour-btn" onClick={() => go(i + 1)} disabled={i === TOUR.length - 1} aria-label="Next step"><Icon name="chevron" size={16} /></button>
    </div>
  )
}

export { tabRoot }
