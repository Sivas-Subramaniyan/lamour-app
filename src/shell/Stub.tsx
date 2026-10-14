import { Screen, TopBar, EmptyState, Button } from '../design/ui'
import { useNav } from './nav'
import { SCREEN_IDS, type ScreenId } from './screens'

export function Stub({ id }: { id: ScreenId }) {
  const nav = useNav()
  const i = SCREEN_IDS.indexOf(id)
  const next = SCREEN_IDS[i + 1]
  return (
    <Screen top={<TopBar title={id} />}
      footer={next && <Button block onClick={() => nav.push(next)} iconRight="chevron">Next screen</Button>}>
      <EmptyState icon="feather" title="Being drawn" body={`The ${id} screen is being built. Keep moving with Next screen, the tour arrows, or the Flow Navigator.`} />
    </Screen>
  )
}
