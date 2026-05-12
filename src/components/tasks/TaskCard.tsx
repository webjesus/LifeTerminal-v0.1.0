import type { Task } from '../../types'
import { cn } from '../../utils/cn'
import { formatDateWithYear } from '../../utils/date'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'

type TaskCardProps = {
  task: Task
  isOverdue: boolean
  projectTitle?: string | null
  onOpen: (task: Task) => void
  onEdit: (task: Task) => void
  onToggleComplete: (task: Task) => void
  onExtendDeadline: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskCard({
  task,
  isOverdue,
  projectTitle,
  onOpen,
  onEdit,
  onToggleComplete,
  onExtendDeadline,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'completed'

  return (
    <article
      className={cn(
        'ui-panel ui-card-hover p-5 md:p-6',
        isOverdue && 'border-(--danger-border) bg-(--danger-bg)',
        isCompleted && 'opacity-72',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-(--text-primary)">{task.title}</h3>
            {projectTitle ? <span className="ui-chip">{projectTitle}</span> : null}
            {isOverdue ? <span className="ui-chip border-(--danger-border) bg-(--danger-bg) text-(--danger-text)">Просрочено</span> : null}
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-(--text-muted)">{task.description || 'Описание не добавлено.'}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="ui-panel-elevated px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Дедлайн</dt>
          <dd className="mt-1 text-(--text-primary)">{formatDateWithYear(task.deadline)}</dd>
        </div>
        <div className="ui-panel-elevated px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Создана</dt>
          <dd className="mt-1 text-(--text-primary)">{formatDateWithYear(task.createdAt)}</dd>
        </div>
        <div className="ui-panel-elevated px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Обновлена</dt>
          <dd className="mt-1 text-(--text-primary)">{formatDateWithYear(task.updatedAt)}</dd>
        </div>
        <div className="ui-panel-elevated px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Отметка</dt>
          <dd className="mt-1 text-(--text-primary)">{task.completedAt ? formatDateWithYear(task.completedAt) : 'Не завершена'}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="ui-button px-3 py-2"
        >
          Открыть
        </button>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="ui-button px-3 py-2"
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className="min-h-11 rounded-2xl border border-(--completed-border) bg-(--completed-bg) px-3 py-2 text-sm font-medium text-(--completed-text) transition-all duration-200 active:scale-[0.98]"
        >
          {isCompleted ? 'Снять выполнение' : 'Выполнить'}
        </button>
        <button
          type="button"
          onClick={() => onExtendDeadline(task)}
          className="min-h-11 rounded-2xl border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-sm font-medium text-(--warning-text) transition-all duration-200 active:scale-[0.98]"
        >
          Продлить дедлайн
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="ui-button-danger px-3 py-2"
        >
          Удалить
        </button>
      </div>
    </article>
  )
}
