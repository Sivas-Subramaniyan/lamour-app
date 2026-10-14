import { Screen, TopBar, EmptyState } from '../design/ui'
import type { ScreenId } from './screens'

export function Stub({ id }: { id: ScreenId }) {
  return (
    <Screen top={<TopBar title={id} />}>
      <EmptyState icon="feather" title="Being drawn" body={`The ${id} screen is being built.`} />
    </Screen>
  )
}
