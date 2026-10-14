import { createElement } from 'react'
import { SCREEN_IDS, type ScreenDef, type ScreenId, type TabName } from './screens'
import { Stub } from './Stub'
import { screens as arrival } from '../flows/arrival'
import { screens as conversation } from '../flows/conversation'
import { screens as tonight } from '../flows/tonight'
import { screens as connections } from '../flows/connections'
import { screens as dates } from '../flows/dates'
import { screens as dateday } from '../flows/dateday'
import { screens as after } from '../flows/after'
import { screens as you } from '../flows/you'
import { screens as premium } from '../flows/premium'
import { screens as system } from '../flows/system'

const all = [...arrival, ...conversation, ...tonight, ...connections, ...dates, ...dateday, ...after, ...you, ...premium, ...system]
const byId = new Map(all.map(d => [d.id, d]))

export const REGISTRY = Object.fromEntries(
  SCREEN_IDS.map(id => [id, byId.get(id) ?? { id, title: id.split('/')[1], component: (p: any) => createElement(Stub, { id, ...p }) }]),
) as Record<ScreenId, ScreenDef>

const TAB_BY_PREFIX: Record<string, TabName> = { tonight: 'tonight', conn: 'table', conv: 'aura', dates: 'plans', day: 'plans', after: 'plans', you: 'you', premium: 'you', sys: 'you' }
export const tabOf = (id: ScreenId): TabName | undefined => REGISTRY[id].tab ?? TAB_BY_PREFIX[id.split('/')[0]]
