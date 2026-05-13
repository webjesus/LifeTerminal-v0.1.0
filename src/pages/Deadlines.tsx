import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ReminderFormModal, type ReminderFormValues } from '../components/deadlines/ReminderFormModal'
import { ReminderRescheduleModal } from '../components/deadlines/ReminderRescheduleModal'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { ActionMenu } from '../components/ui/ActionMenu'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { projectPriorityLabels, projectStatusLabels } from '../components/projects/projectMeta'
import { taskPriorityLabels, taskStatusLabels } from '../components/tasks/taskMeta'
import { cn } from '../utils/cn'
import { formatDateWithYear, toDateKey, toStartOfDay } from '../utils/date'
import type { Idea, Note, Project, Reminder, Task } from '../types'
import { storageKeys } from '../utils/storage'
import type { TaskPriority } from '../types'

type TimelineFilter = 'all' | 'today' | 'overdue' | 'upcoming' | 'reminders' | 'completed'
type TimelineGroupKey = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'completed' | 'no-date'
type TimelineItemType = 'task' | 'project' | 'reminder'

type TimelineItem = {
  id: string
  type: TimelineItemType
  title: string
  description: string
  linkLabel: string
  dateValue: string | null
  dateLabel: string
  statusLabel: string
  priorityLabel: string | null
  isOverdue: boolean
  isCompleted: boolean
  groupKey: TimelineGroupKey
}

const FILTER_LABELS: Record<TimelineFilter, string> = {
  all: 'Все',
  today: 'Сегодня',
  overdue: 'Просроченные',
  upcoming: 'Ближайшие',
  reminders: 'Напоминания',
  completed: 'Выполненные',
}

const GROUP_LABELS: Record<TimelineGroupKey, string> = {
  overdue: 'Просрочено',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  week: 'На этой неделе',
  later: 'Позже',
  completed: 'Выполненные',
  'no-date': 'Без срока',
}

const GROUP_ORDER: TimelineGroupKey[] = ['overdue', 'today', 'tomorrow', 'week', 'later', 'no-date', 'completed']

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function formatReminderDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getTimelineGroupKey(value: string | null, isCompleted: boolean, todayStart: Date) {
  if (isCompleted) {
    return 'completed'
  }

  if (!value) {
    return 'no-date'
  }

  const date = new Date(value)
  const dateStart = toStartOfDay(date)
  const tomorrow = new Date(todayStart)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEdge = new Date(todayStart)
  weekEdge.setDate(weekEdge.getDate() + 7)

  if (dateStart.getTime() < todayStart.getTime()) {
    return 'overdue'
  }

  if (dateStart.getTime() === todayStart.getTime()) {
    return 'today'
  }

  if (dateStart.getTime() === tomorrow.getTime()) {
    return 'tomorrow'
  }

  if (dateStart.getTime() <= weekEdge.getTime()) {
    return 'week'
  }

  return 'later'
}

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function compareTimelineItems(a: TimelineItem, b: TimelineItem) {
  if (a.isCompleted !== b.isCompleted) {
    return Number(a.isCompleted) - Number(b.isCompleted)
  }

  if (a.isOverdue !== b.isOverdue) {
    return Number(b.isOverdue) - Number(a.isOverdue)
  }

  if (a.dateValue && b.dateValue) {
    const dateDifference = new Date(a.dateValue).getTime() - new Date(b.dateValue).getTime()

    if (dateDifference !== 0) {
      return dateDifference
    }
  }

  if (a.dateValue && !b.dateValue) {
    return -1
  }

  if (!a.dateValue && b.dateValue) {
    return 1
  }

  if (a.type === 'task' && b.type === 'task' && a.priorityLabel && b.priorityLabel) {
    return PRIORITY_ORDER[(Object.keys(taskPriorityLabels) as TaskPriority[]).find((priority) => taskPriorityLabels[priority] === a.priorityLabel) ?? 'low']
      - PRIORITY_ORDER[(Object.keys(taskPriorityLabels) as TaskPriority[]).find((priority) => taskPriorityLabels[priority] === b.priorityLabel) ?? 'low']
  }

  return a.title.localeCompare(b.title, 'ru')
}

export function DeadlinesPage() {
  const navigate = useNavigate()
  const todayKey = toDateKey(new Date())
  const todayStart = toStartOfDay(new Date())
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: reminders, setValue: setReminders } = useLocalStorage<Reminder[]>(storageKeys.reminders, [])
  const { value: notes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all')
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [reschedulingReminderId, setReschedulingReminderId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const projectTitleById = useMemo(() => new Map(projects.map((project) => [project.id, project.title])), [projects])

  const allTimelineItems = useMemo<TimelineItem[]>(() => {
    const taskItems: TimelineItem[] = tasks
      .filter((task) => task.deadline)
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        linkLabel: task.projectId ? projectTitleById.get(task.projectId) ?? 'Не связано' : 'Не связано',
        dateValue: task.deadline,
        dateLabel: formatDateWithYear(task.deadline),
        statusLabel: taskStatusLabels[task.status],
        priorityLabel: task.priority === 'low' ? null : taskPriorityLabels[task.priority],
        type: 'task' as const,
        isOverdue: task.status !== 'completed' && toDateKey(new Date(task.deadline!)) < todayKey,
        isCompleted: task.status === 'completed',
        groupKey: getTimelineGroupKey(task.deadline, task.status === 'completed', todayStart),
      }))

    const projectItems: TimelineItem[] = projects
      .filter((project) => project.deadline && project.status !== 'archived')
      .map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        linkLabel: 'Проект',
        dateValue: project.deadline,
        dateLabel: formatDateWithYear(project.deadline),
        statusLabel: projectStatusLabels[project.status],
        priorityLabel: project.priority ? projectPriorityLabels[project.priority] : null,
        type: 'project' as const,
        isOverdue: project.status !== 'completed' && project.status !== 'archived' && toDateKey(new Date(project.deadline!)) < todayKey,
        isCompleted: project.status === 'completed',
        groupKey: getTimelineGroupKey(project.deadline, project.status === 'completed', todayStart),
      }))

    const reminderItems: TimelineItem[] = reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      linkLabel: 'Не связано',
      dateValue: reminder.remindAt,
      dateLabel: formatReminderDate(reminder.remindAt),
      statusLabel: reminder.completed ? 'Выполнено' : 'Активно',
      priorityLabel: null,
      type: 'reminder' as const,
      isOverdue: !reminder.completed && new Date(reminder.remindAt).getTime() < todayStart.getTime(),
      isCompleted: reminder.completed,
      groupKey: getTimelineGroupKey(reminder.remindAt, reminder.completed, todayStart),
      }))

    return [...taskItems, ...projectItems, ...reminderItems].sort(compareTimelineItems)
  }, [projectTitleById, projects, reminders, tasks, todayKey, todayStart])

  const linkedLabels = useMemo(() => {
    return Object.fromEntries(
      reminders.map((reminder) => {
        if (!reminder.linkedItemId || !reminder.linkedItemType) {
          return [reminder.id, undefined]
        }

        let matchedItem:
          | Task
          | Project
          | Note
          | Idea
          | undefined

        switch (reminder.linkedItemType) {
          case 'task':
            matchedItem = tasks.find((item) => item.id === reminder.linkedItemId)
            break
          case 'project':
            matchedItem = projects.find((item) => item.id === reminder.linkedItemId)
            break
          case 'note':
            matchedItem = notes.find((item) => item.id === reminder.linkedItemId)
            break
          case 'idea':
            matchedItem = ideas.find((item) => item.id === reminder.linkedItemId)
            break
          default:
            matchedItem = undefined
        }

        return [
          reminder.id,
          matchedItem
            ? {
                id: matchedItem.id,
                label: matchedItem.title,
                type: reminder.linkedItemType,
              }
            : undefined,
        ]
      }),
    )
  }, [ideas, notes, projects, reminders, tasks])

  const timelineItems = useMemo(() => allTimelineItems.map((item) => {
    if (item.type !== 'reminder') {
      return item
    }

    const linked = linkedLabels[item.id]

    return {
      ...item,
      linkLabel: linked ? `${linked.label}${linked.type ? ` · ${linked.type}` : ''}` : 'Не связано',
    }
  }), [allTimelineItems, linkedLabels])

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return timelineItems.filter((item) => item.groupKey === 'today')
      case 'overdue':
        return timelineItems.filter((item) => item.groupKey === 'overdue')
      case 'upcoming':
        return timelineItems.filter((item) => item.groupKey === 'tomorrow' || item.groupKey === 'week')
      case 'reminders':
        return timelineItems.filter((item) => item.type === 'reminder')
      case 'completed':
        return timelineItems.filter((item) => item.isCompleted)
      case 'all':
      default:
        return timelineItems
    }
  }, [activeFilter, timelineItems])

  const groupedItems = useMemo(() => {
    const groups = new Map<TimelineGroupKey, TimelineItem[]>()

    filteredItems.forEach((item) => {
      const existing = groups.get(item.groupKey) ?? []
      existing.push(item)
      groups.set(item.groupKey, existing)
    })

    return GROUP_ORDER
      .map((key) => ({ key, label: GROUP_LABELS[key], items: groups.get(key) ?? [] }))
      .filter((group) => group.items.length > 0)
  }, [filteredItems])

  const stats = useMemo(() => ({
    today: timelineItems.filter((item) => !item.isCompleted && item.groupKey === 'today').length,
    overdue: timelineItems.filter((item) => !item.isCompleted && item.groupKey === 'overdue').length,
    upcoming: timelineItems.filter((item) => !item.isCompleted && (item.groupKey === 'tomorrow' || item.groupKey === 'week')).length,
    reminders: reminders.filter((reminder) => !reminder.completed).length,
  }), [reminders, timelineItems])

  const editingReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === editingReminderId) ?? null,
    [editingReminderId, reminders],
  )

  const reschedulingReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === reschedulingReminderId) ?? null,
    [reminders, reschedulingReminderId],
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  )

  function handleExtendDeadline(item: TimelineItem) {
    const timestamp = new Date().toISOString()

    if (item.type === 'task') {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === item.id && task.deadline
            ? {
                ...task,
                deadline: addDays(task.deadline, 1),
                updatedAt: timestamp,
              }
            : task,
        ),
      )
      return
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === item.id && project.deadline
          ? {
              ...project,
              deadline: addDays(project.deadline, 1),
              updatedAt: timestamp,
            }
          : project,
      ),
    )
  }

  function handleOpenItem(item: TimelineItem) {
    if (item.type === 'task') {
      setSelectedTaskId(item.id)
      return
    }

    if (item.type === 'project') {
      navigate(`/projects/${item.id}`)
      return
    }

    openEditReminderModal(reminders.find((reminder) => reminder.id === item.id) ?? null)
  }

  function handleToggleTaskComplete(taskId: string) {
    const timestamp = new Date().toISOString()

    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === taskId
        ? {
            ...task,
            status: task.status === 'completed' ? 'in_progress' : 'completed',
            completedAt: task.status === 'completed' ? null : timestamp,
            updatedAt: timestamp,
          }
        : task
    )))
  }

  function handleToggleReminder(reminder: Reminder) {
    const timestamp = new Date().toISOString()
    setReminders((currentReminders) =>
      currentReminders.map((item) =>
        item.id === reminder.id ? { ...item, completed: !item.completed, updatedAt: timestamp } : item,
      ),
    )
  }

  function handleRescheduleReminder(reminder: Reminder, remindAt: string) {
    const timestamp = new Date().toISOString()
    setReminders((currentReminders) =>
      currentReminders.map((item) =>
        item.id === reminder.id
          ? {
              ...item,
              remindAt,
              updatedAt: timestamp,
            }
          : item,
      ),
    )

    setReschedulingReminderId(null)
  }

  function openRescheduleReminderModal(reminder: Reminder) {
    setReschedulingReminderId(reminder.id)
  }

  function closeRescheduleReminderModal() {
    setReschedulingReminderId(null)
  }

  function openCreateReminderModal() {
    setEditingReminderId(null)
    setIsCreateModalOpen(true)
  }

  function openEditReminderModal(reminder: Reminder | null) {
    if (!reminder) {
      return
    }

    setEditingReminderId(reminder.id)
    setIsCreateModalOpen(false)
  }

  function closeReminderModal() {
    setEditingReminderId(null)
    setIsCreateModalOpen(false)
  }

  function closeTaskModal() {
    setSelectedTaskId(null)
  }

  function handleReminderSubmit(values: ReminderFormValues) {
    const baseReminder = editingReminder
    const timestamp = new Date().toISOString()
    const nextReminder: Reminder = {
      id: baseReminder?.id ?? crypto.randomUUID(),
      title: values.title,
      description: values.description,
      remindAt: values.remindAt,
      linkedItemId: values.linkedItemId,
      linkedItemType: values.linkedItemType,
      completed: baseReminder?.completed ?? false,
      createdAt: baseReminder?.createdAt ?? new Date().toISOString(),
      updatedAt: timestamp,
    }

    setReminders((currentReminders) => {
      if (baseReminder) {
        return currentReminders.map((item) => (item.id === baseReminder.id ? nextReminder : item))
      }

      return [nextReminder, ...currentReminders]
    })

    closeReminderModal()
  }

  return (
    <section className="space-y-4">
      <PageHeader
        section="deadlines"
        title="Дедлайны"
        description="Сроки, напоминания и ближайшие действия."
        actionLabel="Добавить напоминание"
        onAction={openCreateReminderModal}
      />

      <section className="ui-panel p-4 md:p-4.5">
        <div className="flex flex-wrap gap-2 text-sm text-(--text-secondary)">
          <span className="ui-chip">Сегодня {stats.today}</span>
          <span className={cn('ui-chip', stats.overdue > 0 && 'border-(--danger-border) bg-(--danger-bg) text-(--danger-text)')}>Просрочено {stats.overdue}</span>
          <span className="ui-chip">Ближайшие {stats.upcoming}</span>
          <span className="ui-chip">Напоминания {stats.reminders}</span>
        </div>

        <div className="mt-3 ui-filter-scroll">
          {(Object.keys(FILTER_LABELS) as TimelineFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'ui-filter-pill',
                activeFilter === filter
                  ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                  : 'hover:border-(--accent-border) hover:text-(--text-primary)',
              )}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>
      </section>

      {filteredItems.length === 0 ? (
        <section className="ui-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-(--text-muted)">Дедлайны</p>
          <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">{timelineItems.length === 0 ? 'Сроков и напоминаний пока нет' : 'В этом фильтре ничего нет'}</h2>
          <p className="mt-2 max-w-2xl text-sm text-(--text-muted)">{timelineItems.length === 0 ? 'Добавьте напоминание или дедлайн к задаче.' : 'Выберите другой период или добавьте напоминание.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={openCreateReminderModal} className="ui-button-accent px-4 py-2.5">Добавить напоминание</button>
            <button type="button" onClick={() => navigate('/tasks')} className="ui-button px-4 py-2.5">Открыть задачи</button>
          </div>
        </section>
      ) : (
        <section className="ui-panel p-0 overflow-visible">
          <div className="overflow-hidden rounded-[inherit] border border-(--border) bg-(--panel)">
            <div className="hidden grid-cols-[120px_minmax(0,1.8fr)_minmax(120px,1fr)_150px_110px_110px_48px] items-center gap-3 border-b border-(--border) px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-(--text-muted) md:grid">
              <span>Тип / статус</span>
              <span>Название</span>
              <span>Связь</span>
              <span>Срок / когда</span>
              <span>Приоритет</span>
              <span>Действие</span>
              <span className="text-right">Меню</span>
            </div>

            <div>
            {groupedItems.map((group) => (
              <div key={group.key}>
                <div className="border-b border-(--border) px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-(--text-muted) md:px-4">
                  {group.label}
                </div>

                {group.items.map((item) => {
                  const isReminder = item.type === 'reminder'
                  const isTask = item.type === 'task'
                  const primaryActionLabel = item.isOverdue && !item.isCompleted
                    ? 'Перенести'
                    : isTask
                      ? item.isCompleted ? 'Вернуть' : 'Выполнить'
                      : item.type === 'project'
                        ? 'Продлить'
                        : item.isCompleted ? 'Вернуть' : 'Отметить'
                  const statusChip = item.isCompleted
                    ? {
                        label: 'Выполнено',
                        className: 'border-(--completed-border) bg-(--completed-bg) text-(--completed-text)',
                      }
                    : item.isOverdue
                      ? {
                          label: 'Просрочено',
                          className: 'border-(--danger-border) bg-[color-mix(in_srgb,var(--danger-bg)_36%,var(--panel))] text-(--danger-text)',
                        }
                      : {
                          label: item.statusLabel,
                          className: 'border-(--border-soft) bg-(--panel) text-(--text-secondary)',
                        }
                  const rowTone = item.isCompleted
                    ? 'opacity-[0.58]'
                    : item.isOverdue
                      ? 'bg-[color-mix(in_srgb,var(--danger-bg)_18%,var(--panel-elevated))]'
                      : item.groupKey === 'today'
                        ? 'border-(--accent-border) bg-[color-mix(in_srgb,var(--accent-soft)_30%,var(--panel-elevated))]'
                        : ''

                  return (
                    <article
                      key={`${item.type}-${item.id}`}
                      className={cn('relative border-b border-(--border) bg-(--panel-elevated) px-3 py-3 transition hover:bg-[color-mix(in_srgb,var(--panel-elevated)_76%,var(--panel))] md:px-4', rowTone)}
                      onClick={() => handleOpenItem(item)}
                    >
                      {item.isOverdue && !item.isCompleted ? <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-(--danger-text)" /> : null}

                      <div className="flex items-start gap-3 md:grid md:grid-cols-[120px_minmax(0,1.8fr)_minmax(120px,1fr)_150px_110px_110px_48px] md:items-center md:gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
                            <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em]">{item.type === 'task' ? 'Задача' : item.type === 'project' ? 'Проект' : 'Напоминание'}</span>
                            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]', statusChip.className)}>{statusChip.label}</span>
                          </div>
                          {!item.isOverdue && !item.isCompleted && item.type !== 'reminder' ? <p className="mt-1 text-sm text-(--text-secondary)">{item.statusLabel}</p> : null}
                        </div>

                        <div className="min-w-0">
                          <p className={cn('truncate text-sm font-semibold text-(--text-primary)', item.isCompleted && 'line-through text-(--text-muted)')}>{item.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-sm text-(--text-muted)">{item.description || 'Без описания'}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-(--text-muted) md:hidden">
                            <span>{item.linkLabel}</span>
                            <span>{item.dateLabel}</span>
                            {!item.isOverdue && item.priorityLabel ? <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[11px] text-(--text-secondary)">{item.priorityLabel}</span> : null}
                          </div>
                        </div>

                        <div className="hidden min-w-0 md:block text-sm text-(--text-muted)">
                          <span className="block truncate">{item.linkLabel}</span>
                        </div>

                        <div className={cn('hidden text-sm text-(--text-muted) md:block', item.groupKey === 'today' && !item.isCompleted && 'font-medium text-(--text-secondary)')}>
                          {isReminder ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                const reminder = reminders.find((entry) => entry.id === item.id)
                                if (reminder) {
                                  openRescheduleReminderModal(reminder)
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 transition hover:border-(--accent-border) hover:bg-(--panel) hover:text-(--text-primary)"
                            >
                              <CalendarDays size={14} strokeWidth={2} />
                              {item.dateLabel}
                            </button>
                          ) : item.dateLabel}
                        </div>

                        <div className="hidden text-sm md:block">
                          {!item.isOverdue && item.priorityLabel ? <span className="inline-flex rounded-full border border-(--border-soft) bg-(--panel) px-2.5 py-1 text-xs text-(--text-secondary)">{item.priorityLabel}</span> : <span className="text-(--text-muted)">—</span>}
                        </div>

                        <div className="mt-3 flex items-center gap-3 md:mt-0">
                          {isTask ? (
                            <button type="button" onClick={(event) => { event.stopPropagation(); item.isOverdue && !item.isCompleted ? handleExtendDeadline(item) : handleToggleTaskComplete(item.id) }} className="ui-button px-3 py-2 text-sm">
                              {primaryActionLabel}
                            </button>
                          ) : item.type === 'project' ? (
                            <button type="button" onClick={(event) => { event.stopPropagation(); handleExtendDeadline(item) }} className="ui-button px-3 py-2 text-sm">
                              {primaryActionLabel}
                            </button>
                          ) : (
                            <button type="button" onClick={(event) => { event.stopPropagation(); const reminder = reminders.find((entry) => entry.id === item.id); if (!reminder) { return } item.isOverdue && !item.isCompleted ? openRescheduleReminderModal(reminder) : handleToggleReminder(reminder) }} className="ui-button px-3 py-2 text-sm">
                              {primaryActionLabel}
                            </button>
                          )}
                        </div>

                        <div className="ml-auto shrink-0 md:ml-0">
                          <ActionMenu
                            closeOnChangeKey={activeFilter}
                            items={[
                              { label: 'Открыть', onSelect: () => handleOpenItem(item) },
                              ...(item.type !== 'project'
                                ? [{
                                    label: item.isCompleted ? 'Вернуть в работу' : 'Отметить выполненным',
                                    onSelect: () => {
                                      if (item.type === 'task') {
                                        handleToggleTaskComplete(item.id)
                                        return
                                      }

                                      const reminder = reminders.find((entry) => entry.id === item.id)
                                      if (reminder) {
                                        handleToggleReminder(reminder)
                                      }
                                    },
                                    tone: 'accent' as const,
                                  }]
                                : []),
                              ...(item.type !== 'project'
                                ? [{
                                    label: 'Перенести',
                                    onSelect: () => {
                                      if (item.type === 'task') {
                                        handleExtendDeadline(item)
                                        return
                                      }

                                      const reminder = reminders.find((entry) => entry.id === item.id)
                                      if (reminder) {
                                        openRescheduleReminderModal(reminder)
                                      }
                                    },
                                    tone: 'warning' as const,
                                  }]
                                : [{ label: 'Продлить дедлайн', onSelect: () => handleExtendDeadline(item), tone: 'warning' as const }]),
                              ...(isReminder
                                ? [{
                                    label: 'Редактировать',
                                    onSelect: () => {
                                      const reminder = reminders.find((entry) => entry.id === item.id)
                                      if (reminder) {
                                        openEditReminderModal(reminder)
                                      }
                                    },
                                  }]
                                : []),
                            ]}
                          />
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ))}
            </div>
          </div>
        </section>
      )}

      {(isCreateModalOpen || editingReminder) ? (
        <ReminderFormModal
          reminder={editingReminder}
          tasks={tasks}
          projects={projects}
          notes={notes}
          ideas={ideas}
          onClose={closeReminderModal}
          onSubmit={handleReminderSubmit}
          onToggleComplete={(reminder) => {
            handleToggleReminder(reminder)
            closeReminderModal()
          }}
          onReschedule={(reminder) => {
            closeReminderModal()
            openRescheduleReminderModal(reminder)
          }}
          onDelete={() => undefined}
        />
      ) : null}

      {reschedulingReminder ? (
        <ReminderRescheduleModal
          reminder={reschedulingReminder}
          onClose={closeRescheduleReminderModal}
          onSubmit={(value) => handleRescheduleReminder(reschedulingReminder, value)}
        />
      ) : null}

      {selectedTask ? (
        <TaskFormModal
          mode="view"
          task={selectedTask}
          relatedItems={[]}
          availableRelationItems={[]}
          onOpenRelatedItem={() => undefined}
          onClose={closeTaskModal}
          onSubmit={() => undefined}
        />
      ) : null}
    </section>
  )
}
