import type { DashboardOrder } from '@/types'

export default function EntregaStage(_props: { order: DashboardOrder; active: boolean; done: boolean }) {
  return <p className="text-sm text-neutral-500">Carregando…</p>
}
