import type { IdeaStatus } from '../../types'

type StatusBadgeProps = {
  status: IdeaStatus
}

const statusLabels: Record<IdeaStatus, string> = {
  new: 'Новая',
  thinking: 'Обдумывается',
  in_progress: 'В работе',
  implemented: 'Реализована',
  postponed: 'Отложена',
}

const statusClasses: Record<IdeaStatus, string> = {
  new: 'border-[#d9dfec] bg-[#f6f8fc] text-[#667085]',
  thinking: 'border-[#dadfff] bg-[#eef0ff] text-[#4c46c7]',
  in_progress: 'border-[#dbe5ff] bg-[#f2f5ff] text-[#4160c5]',
  implemented: 'border-[#d7e8dc] bg-[#ebf7ef] text-[#37734f]',
  postponed: 'border-[#ececec] bg-[#f7f7f8] text-[#6b7280]',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`ui-badge tracking-[0.12em] uppercase ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  )
}
