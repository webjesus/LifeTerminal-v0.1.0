import type { TaskStatus } from '../../types'
import { cn } from '../../utils/cn'
import { taskStatusLabels } from './taskMeta'

type StatusBadgeProps = {
  status: TaskStatus
}

const statusClasses: Record<TaskStatus, string> = {
  new: 'border-[#d9dfec] bg-[#f6f8fc] text-[#667085]',
  in_progress: 'border-[#dadfff] bg-[#eef0ff] text-[#4c46c7]',
  waiting: 'border-[#e2e4ea] bg-[#f6f7f9] text-[#6b7280]',
  completed: 'border-[#d7e8dc] bg-[#ebf7ef] text-[#37734f]',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'ui-badge tracking-[0.12em] uppercase',
        statusClasses[status],
      )}
    >
      {taskStatusLabels[status]}
    </span>
  )
}
