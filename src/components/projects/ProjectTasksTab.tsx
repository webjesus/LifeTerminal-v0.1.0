import { useMemo, useState } from 'react'
import type { ProjectWorkspaceBlock, Task } from '../../types'
import { EmptyState } from './EmptyState'

type TaskFilter = 'all' | 'active' | 'today' | 'overdue' | 'completed'

type ProjectTasksTabProps = {
  tasks: Task[]
  workspaceBlocks: ProjectWorkspaceBlock[]
  onCreateTask: () => void
  onOpenTask: (taskId: string) => void
  onOpenWorkspaceBlock: (blockId: string) => void
}

const FILTER_LABELS: Record<TaskFilter, string> = {
  all: 'Все',
  active: 'Активные',
  today: 'Сегодня',
  completed: 'Выполненные',
  overdue: 'Просроченные',
}

export function ProjectTasksTab({ tasks, workspaceBlocks, onCreateTask, onOpenTask, onOpenWorkspaceBlock }: ProjectTasksTabProps) {
  const [filter, setFilter] = useState<TaskFilter>('all')
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const safeWorkspaceBlocks = Array.isArray(workspaceBlocks) ? workspaceBlocks : []

  const filteredTasks = useMemo(() => {
    if (filter === 'all') {
      return safeTasks
    }

    if (filter === 'overdue') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return safeTasks.filter((task) => task.deadline && task.status !== 'completed' && new Date(task.deadline) < today)
    }

    if (filter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return safeTasks.filter((task) => task.deadline && new Date(task.deadline) >= today && new Date(task.deadline) < tomorrow)
    }

    if (filter === 'active') {
      return safeTasks.filter((task) => task.status !== 'completed')
    }

    return safeTasks.filter((task) => task.status === 'completed')
  }, [filter, safeTasks])

  const linkedBlockMap = useMemo(
    () => new Map(safeWorkspaceBlocks.filter((block) => block.linkedItemType === 'task' && block.linkedItemId).map((block) => [block.linkedItemId as string, block.id])),
    [safeWorkspaceBlocks],
  )

  return (
    <section className="ui-panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Задачи проекта</p>
          <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Задачи проекта</h2>
        </div>
        <button type="button" onClick={onCreateTask} className="ui-button-accent px-4 py-3">Добавить задачу в проект</button>
      </div>

      <div className="mt-4 ui-filter-scroll">
        {(Object.keys(FILTER_LABELS) as TaskFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={['ui-filter-pill', filter === item ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : ''].join(' ')}
          >
            {FILTER_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {filteredTasks.length > 0 ? filteredTasks.map((task) => {
          const linkedBlockId = linkedBlockMap.get(task.id)
          const taskTags = Array.isArray(task.tags) ? task.tags : []

          return (
            <article key={task.id} className="ui-panel-elevated p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <button type="button" onClick={() => onOpenTask(task.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap gap-2"><span className="ui-chip">{task.status}</span><span className="ui-chip">{task.priority}</span>{task.deadline ? <span className="ui-chip">{new Date(task.deadline).toLocaleDateString('ru-RU')}</span> : null}</div>
                  <p className="mt-3 text-base font-semibold text-(--text-primary)">{task.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-(--text-muted)">{task.description || 'Без описания'}</p>
                  {taskTags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{taskTags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>)}</div> : null}
                </button>
                {linkedBlockId ? <button type="button" onClick={() => onOpenWorkspaceBlock(linkedBlockId)} className="ui-button px-3 py-2 text-sm">Связан с рабочей областью</button> : null}
              </div>
            </article>
          )
        }) : <EmptyState title="В проекте пока нет задач" description="Добавьте первое действие, чтобы проект начал двигаться." actionLabel="Добавить задачу" onAction={onCreateTask} />}
      </div>
    </section>
  )
}
