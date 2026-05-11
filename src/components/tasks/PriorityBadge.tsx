import type { TaskPriority } from '../../types'
import { cn } from '../../utils/cn'
import { taskPriorityLabels } from './taskMeta'

type PriorityBadgeProps = {
  priority: TaskPriority
}

const priorityClasses: Record<TaskPriority, string> = {
  low: 'border-[#d9e1f2] bg-[#f3f6fd] text-[#5f6f93]',
  medium: 'border-[#f2dcc4] bg-[#fff4e8] text-[#b26a26]',
  high: 'border-[#f3d2c7] bg-[#fff0eb] text-[#c35a3d]',
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'ui-badge tracking-[0.12em] uppercase',
        priorityClasses[priority],
      )}
    >
      {taskPriorityLabels[priority]}
    </span>
  )
}
