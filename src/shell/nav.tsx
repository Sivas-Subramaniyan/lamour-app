// A tiny stack navigator. push/pop/replace/reset + tabs. The top screen id is mirrored to the URL hash so any screen is deep-linkable.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SCREEN_IDS, type ScreenId, type TabName } from './screens'
import { useApp, isDusk, type State } from '../state/store'

export type Entry = { id: ScreenId; params: Record<string, any>; key: number }
type Nav = {
  stack: Entry[]
  top: Entry
  dir: 1 | -1 | 0
  canGoBack: boolean
  push: (id: ScreenId, params?: Record<string, any>) => void
  pop: () => void
  replace: (id: ScreenId, params?: Record<string, any>) => void
  reset: (id: ScreenId, params?: Record<string, any>) => void
  goTab: (tab: TabName) => void
}

export function tabRoot(tab: TabName, s: State): ScreenId {
  switch (tab) {
    case 'tonight': return !isDusk(s) ? 'tonight/dusk' : s.tonight.letterOpened ? 'tonight/deck' : 'tonight/letter'
    case 'table': return 'conn/table'
    case 'aura': return 'conv/aura'
    case 'plans': return 'dates/list'
    case 'you': return 'you/home'
  }
}

const NavCtx = createContext<Nav>(null!)
let k = 0
const entry = (id: ScreenId, params: Record<string, any> = {}): Entry => ({ id, params, key: ++k })

function fromHash(): Entry | null {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  const [id, q] = raw.split('?')
  if (!(SCREEN_IDS as readonly string[]).includes(id)) return null
  const params = Object.fromEntries(new URLSearchParams(q ?? ''))
  return entry(id as ScreenId, params)
}

export function NavProvider({ children }: { children: ReactNode }) {
  const { s } = useApp()
  const [stack, setStack] = useState<Entry[]>(() => [fromHash() ?? entry('arrival/splash')])
  const [dir, setDir] = useState<1 | -1 | 0>(0)
  const sRef = useRef(s)
  sRef.current = s

  const push = useCallback((id: ScreenId, params?: Record<string, any>) => { setDir(1); setStack(st => [...st, entry(id, params)]) }, [])
  const pop = useCallback(() => { setDir(-1); setStack(st => (st.length > 1 ? st.slice(0, -1) : st)) }, [])
  const replace = useCallback((id: ScreenId, params?: Record<string, any>) => { setDir(1); setStack(st => [...st.slice(0, -1), entry(id, params)]) }, [])
  const reset = useCallback((id: ScreenId, params?: Record<string, any>) => { setDir(0); setStack([entry(id, params)]) }, [])
  const goTab = useCallback((tab: TabName) => { setDir(0); setStack([entry(tabRoot(tab, sRef.current))]) }, [])

  const top = stack[stack.length - 1]
  useEffect(() => {
    const q = new URLSearchParams(Object.entries(top.params).filter(([, v]) => typeof v === 'string' || typeof v === 'number').map(([a, b]) => [a, String(b)])).toString()
    history.replaceState(null, '', `#/${top.id}${q ? `?${q}` : ''}`)
  }, [top])
  useEffect(() => {
    const on = () => { const e = fromHash(); if (e && e.id !== top.id) { setDir(0); setStack([e]) } }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [top.id])

  const value = useMemo<Nav>(() => ({ stack, top, dir, canGoBack: stack.length > 1, push, pop, replace, reset, goTab }), [stack, top, dir, push, pop, replace, reset, goTab])
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>
}

export const useNav = () => useContext(NavCtx)
