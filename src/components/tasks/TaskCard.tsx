import { Check, CalendarDays, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import type { Task, TaskPriority } from '../../types'
import { ActionMenu } from '../ui/ActionMenu'
import { cn } from '../../utils/cn'
import { formatDateWithYear, toDateKey } from '../../utils/date'
import { NEXT_TASK_TOOLTIP } from '../../utils/tasks'
import { taskPriorityLabels, taskStatusLabels } from './taskMeta'

const TASK_INLINE_EDITOR_OPEN_EVENT = 'lifeos:task-inline-editor-open'

type InlineEditorKind = 'deadline' | 'priority'

type TaskCardProps = {
  task: Task
  isLead?: boolean
  isOverdue: boolean
  projectTitle?: string | null
  closeOnChangeKey?: string | number | null
  onOpen: (task: Task) => void
  onEdit: (task: Task) => void
  onToggleComplete: (task: Task) => void
  onExtendDeadline: (task: Task) => void
  onUpdateDeadline: (task: Task, nextDeadline: string | null) => void
  onUpdatePriority: (task: Task, nextPriority: TaskPriority) => void
  onDelete: (task: Task) => void
}

function toDeadlineInputValue(deadline: string | null) {
  return deadline ? toDateKey(new Date(deadline)) : ''
}

export function TaskCard({
  task,
  isLead = false,
  isOverdue,
  projectTitle,
  closeOnChangeKey,
  onOpen,
  onEdit,
  onToggleComplete,
  onExtendDeadline,
  onUpdateDeadline,
  onUpdatePriority,
  onDelete,
}: TaskCardProps) {
  const instanceId = useId()
  const isCompleted = task.status === 'completed'
  const preview = task.description.trim()
  const priorityLabel = taskPriorityLabels[task.priority]
  const deadlineLabel = task.deadline ? formatDateWithYear(task.deadline) : 'Без дедлайна'
  const showPrimaryComplete = isLead && !isCompleted
  const [openEditor, setOpenEditor] = useState<InlineEditorKind | null>(null)
  const deadlineMobileEditorRef = useRef<HTMLDivElement | null>(null)
  const deadlineDesktopEditorRef = useRef<HTMLDivElement | null>(null)
  const priorityMobileEditorRef = useRef<HTMLDivElement | null>(null)
  const priorityDesktopEditorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setOpenEditor(null)
  }, [closeOnChangeKey, task.updatedAt])

  useEffect(() => {
    if (!openEditor) {
      return
    }

    function getActiveEditorContainers() {
      return openEditor === 'deadline'
        ? [deadlineMobileEditorRef.current, deadlineDesktopEditorRef.current]
        : [priorityMobileEditorRef.current, priorityDesktopEditorRef.current]
    }

    function handlePointerDown(event: PointerEvent) {
      const containers = getActiveEditorContainers().filter((container): container is HTMLDivElement => Boolean(container))

      if (containers.some((container) => container.contains(event.target as Node))) {
        return
      }

      setOpenEditor(null)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenEditor(null)
      }
    }

    function handleEditorOpen(event: Event) {
      const customEvent = event as CustomEvent<{ id: string }>
      if (customEvent.detail.id !== instanceId) {
        setOpenEditor(null)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener(TASK_INLINE_EDITOR_OPEN_EVENT, handleEditorOpen)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener(TASK_INLINE_EDITOR_OPEN_EVENT, handleEditorOpen)
    }
  }, [instanceId, openEditor])

  function toggleEditor(kind: InlineEditorKind, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    setOpenEditor((current) => {
      const next = current === kind ? null : kind

      if (next) {
        window.dispatchEvent(new CustomEvent(TASK_INLINE_EDITOR_OPEN_EVENT, { detail: { id: instanceId } }))
      }

      return next
    })
  }

  function handleDeadlineChange(value: string | null) {
    onUpdateDeadline(task, value)
    setOpenEditor(null)
  }

  function handlePriorityChange(priority: TaskPriority) {
    onUpdatePriority(task, priority)
    setOpenEditor(null)
  }

  const mobileEditorSurfaceClassName = 'fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-(--border) bg-(--panel) p-3 shadow-(--shadow-floating) md:hidden'
  const desktopEditorSurfaceClassName = 'hidden rounded-3xl border border-(--border) bg-(--panel) p-3 shadow-(--shadow-floating) md:absolute md:right-0 md:top-[calc(100%+0.5rem)] md:z-40 md:block md:w-64'

  return (
    <article
      className={cn(
        'relative border-b border-(--border) bg-(--panel-elevated) px-3 py-3 transition hover:bg-[color-mix(in_srgb,var(--panel-elevated)_76%,var(--panel))] md:px-4',
        isLead && 'bg-[color-mix(in_srgb,var(--accent-soft)_52%,var(--panel-elevated))]',
        isOverdue && !isLead && 'bg-[color-mix(in_srgb,var(--danger-bg)_16%,var(--panel-elevated))]',
        isCompleted && 'opacity-[0.55]',
      )}
    >
      {isLead ? <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-(--accent)" /> : null}

      <div className="flex items-start gap-3 md:grid md:grid-cols-[32px_minmax(0,1.8fr)_minmax(130px,0.9fr)_110px_110px_120px_48px] md:items-center md:gap-3">
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          aria-label={isCompleted ? 'Снять выполнение' : 'Отметить задачу выполненной'}
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition',
            isCompleted
              ? 'border-(--completed-border) bg-(--completed-bg) text-(--completed-text)'
              : 'border-(--border) bg-(--panel-elevated) text-transparent hover:border-(--accent-border)',
          )}
        >
          <Check size={14} strokeWidth={2.4} />
        </button>

        <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left md:block">
          <div className="flex flex-wrap items-center gap-2">
            {isLead ? <span title={NEXT_TASK_TOOLTIP} className="rounded-full border border-(--accent-border) bg-(--accent-soft) px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--accent)">Следующая</span> : null}
            {isOverdue && !isCompleted ? <span className="rounded-full border border-(--danger-border) bg-(--danger-bg) px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--danger-text)">Просрочено</span> : null}
          </div>
          <h3 className={cn('mt-1 truncate text-sm font-semibold text-(--text-primary)', isCompleted && 'text-(--text-muted) line-through decoration-(--text-muted)')}>{task.title}</h3>
          {preview ? <p className="mt-0.5 line-clamp-1 text-sm text-(--text-muted)">{preview}</p> : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-(--text-muted) md:hidden">
            {projectTitle ? <span>{projectTitle}</span> : null}
            <div ref={deadlineMobileEditorRef} className="relative md:hidden">
              <button
                type="button"
                onClick={(event) => toggleEditor('deadline', event)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[11px] transition hover:border-(--accent-border) hover:text-(--text-primary)',
                  !task.deadline && 'text-(--text-muted)',
                  isLead && !isCompleted && 'text-(--text-secondary)',
                  isOverdue && !isCompleted && 'text-(--danger-text)',
                )}
              >
                <CalendarDays size={12} strokeWidth={2} />
                {deadlineLabel}
              </button>
              {openEditor === 'deadline' ? (
                <div className={mobileEditorSurfaceClassName} onClick={(event) => event.stopPropagation()}>
                  <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Дедлайн</p>
                  <input
                    type="date"
                    value={toDeadlineInputValue(task.deadline)}
                    onChange={(event) => handleDeadlineChange(event.target.value || null)}
                    className="ui-input mt-3"
                    autoFocus
                  />
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => handleDeadlineChange(toDateKey(new Date()))} className="ui-button px-3 py-2 text-xs">Сегодня</button>
                    <button type="button" onClick={() => handleDeadlineChange(null)} className="ui-button px-3 py-2 text-xs">Очистить</button>
                  </div>
                </div>
              ) : null}
            </div>
            <span>{taskStatusLabels[task.status]}</span>
            <div ref={priorityMobileEditorRef} className="relative md:hidden">
              <button
                type="button"
                onClick={(event) => toggleEditor('priority', event)}
                className="inline-flex items-center gap-1 rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[11px] text-(--text-secondary) transition hover:border-(--accent-border) hover:text-(--text-primary)"
              >
                {priorityLabel}
                <ChevronDown size={12} strokeWidth={2} />
              </button>
              {openEditor === 'priority' ? (
                <div className={mobileEditorSurfaceClassName} onClick={(event) => event.stopPropagation()}>
                  <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Приоритет</p>
                  <div className="mt-3 grid gap-2">
                    {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => handlePriorityChange(priority)}
                        className={cn(
                          'rounded-2xl border px-3 py-2 text-left text-sm transition',
                          task.priority === priority
                            ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                            : 'border-(--border) bg-(--panel-elevated) text-(--text-secondary) hover:border-(--accent-border) hover:text-(--text-primary)',
                        )}
                      >
                        {taskPriorityLabels[priority]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-1.5 hidden flex-wrap items-center gap-2 text-xs text-(--text-muted) md:flex">
            <span>{taskStatusLabels[task.status]}</span>
          </div>
        </button>

        <div className="hidden min-w-0 md:block text-sm text-(--text-muted)">
          {projectTitle ? <span className="block truncate">{projectTitle}</span> : <span>Без проекта</span>}
        </div>

        <div ref={deadlineDesktopEditorRef} className={cn('relative hidden md:block', isLead && !isCompleted && 'font-medium text-(--text-secondary)', isOverdue && !isCompleted && 'font-medium text-(--danger-text)')}>
          <button
            type="button"
            onClick={(event) => toggleEditor('deadline', event)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-sm transition hover:border-(--accent-border) hover:bg-(--panel) hover:text-(--text-primary)',
              !task.deadline && 'text-(--text-muted)',
            )}
          >
            <CalendarDays size={14} strokeWidth={2} />
            {deadlineLabel}
          </button>
          {openEditor === 'deadline' ? (
            <div className={desktopEditorSurfaceClassName} onClick={(event) => event.stopPropagation()}>
              <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Дедлайн</p>
              <input
                type="date"
                value={toDeadlineInputValue(task.deadline)}
                onChange={(event) => handleDeadlineChange(event.target.value || null)}
                className="ui-input mt-3"
                autoFocus
              />
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => handleDeadlineChange(toDateKey(new Date()))} className="ui-button px-3 py-2 text-xs">Сегодня</button>
                <button type="button" onClick={() => handleDeadlineChange(null)} className="ui-button px-3 py-2 text-xs">Очистить</button>
              </div>
            </div>
          ) : null}
        </div>

        <div ref={priorityDesktopEditorRef} className="relative hidden text-sm md:block">
          <button
            type="button"
            onClick={(event) => toggleEditor('priority', event)}
            className="inline-flex items-center gap-1 rounded-full border border-(--border-soft) bg-(--panel) px-2.5 py-1 text-xs text-(--text-secondary) transition hover:border-(--accent-border) hover:text-(--text-primary)"
          >
            {priorityLabel}
            <ChevronDown size={12} strokeWidth={2} />
          </button>
          {openEditor === 'priority' ? (
            <div className={desktopEditorSurfaceClassName} onClick={(event) => event.stopPropagation()}>
              <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Приоритет</p>
              <div className="mt-3 grid gap-2">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handlePriorityChange(priority)}
                    className={cn(
                      'rounded-2xl border px-3 py-2 text-left text-sm transition',
                      task.priority === priority
                        ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                        : 'border-(--border) bg-(--panel-elevated) text-(--text-secondary) hover:border-(--accent-border) hover:text-(--text-primary)',
                    )}
                  >
                    {taskPriorityLabels[priority]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-3 md:mt-0 md:justify-start">
          <button
            type="button"
            onClick={() => onToggleComplete(task)}
            className={cn(showPrimaryComplete ? 'ui-button-accent' : 'ui-button', 'px-3 py-2 text-sm')}
          >
            {isCompleted ? 'Вернуть' : 'Выполнить'}
          </button>
        </div>

        <div className="ml-auto shrink-0 md:ml-0">
          <ActionMenu
            closeOnChangeKey={closeOnChangeKey}
            items={[
              { label: 'Открыть', onSelect: () => onOpen(task) },
              { label: 'Редактировать', onSelect: () => onEdit(task) },
              { label: isCompleted ? 'Вернуть в работу' : 'Выполнить', onSelect: () => onToggleComplete(task), tone: 'accent' },
              { label: 'Продлить дедлайн', onSelect: () => onExtendDeadline(task), tone: 'warning' },
              { label: 'Удалить', onSelect: () => onDelete(task), tone: 'danger' },
            ]}
          />
        </div>
      </div>
    </article>
  )
}
