import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ActionMenu } from '../components/ui/ActionMenu'
import { ReminderFormModal, type ReminderFormValues } from '../components/deadlines/ReminderFormModal'
import { ReminderRescheduleModal } from '../components/deadlines/ReminderRescheduleModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { cn } from '../utils/cn'
import { toDateKey, toStartOfDay } from '../utils/date'
import type { Idea, Note, Project, Reminder, Task } from '../types'
import { storageKeys } from '../utils/storage'

type ReminderFilter = 'all' | 'today' | 'active' | 'overdue' | 'completed'
type ReminderGroupKey = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'completed'

type ReminderLinkLabel = {
  id: string
  label: string
  type: string | null
}

const FILTER_LABELS: Record<ReminderFilter, string> = {
  all: 'Все',
  today: 'Сегодня',
  active: 'Активные',
  overdue: 'Просроченные',
  completed: 'Выполненные',
}

const GROUP_LABELS: Record<ReminderGroupKey, string> = {
  overdue: 'Просроченные',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  week: 'На этой неделе',
  later: 'Позже',
  completed: 'Выполненные',
}

const GROUP_ORDER: ReminderGroupKey[] = ['overdue', 'today', 'tomorrow', 'week', 'later', 'completed']

function formatReminderDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function isReminderOverdue(reminder: Reminder, todayStart: Date) {
  return !reminder.completed && new Date(reminder.remindAt).getTime() < todayStart.getTime()
}

function isReminderToday(reminder: Reminder, todayKey: string) {
  return toDateKey(new Date(reminder.remindAt)) === todayKey
}

function getReminderGroupKey(reminder: Reminder, todayStart: Date, todayKey: string): ReminderGroupKey {
  if (reminder.completed) {
    return 'completed'
  }

  if (isReminderOverdue(reminder, todayStart)) {
    return 'overdue'
  }

  if (isReminderToday(reminder, todayKey)) {
    return 'today'
  }

  const tomorrow = new Date(todayStart)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEdge = new Date(todayStart)
  weekEdge.setDate(weekEdge.getDate() + 7)
  const reminderDate = new Date(reminder.remindAt)
  const reminderDateStart = toStartOfDay(reminderDate)

  if (reminderDateStart.getTime() === tomorrow.getTime()) {
    return 'tomorrow'
  }

  if (reminderDateStart.getTime() <= weekEdge.getTime()) {
    return 'week'
  }

  return 'later'
}

function compareReminders(a: Reminder, b: Reminder) {
  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed)
  }

  return new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
}

export function RemindersPage() {
  const todayStart = toStartOfDay(new Date())
  const todayKey = toDateKey(new Date())
  const { value: reminders, setValue: setReminders } = useLocalStorage<Reminder[]>(storageKeys.reminders, [])
  const { value: tasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: notes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const [activeFilter, setActiveFilter] = useState<ReminderFilter>('all')
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [reschedulingReminderId, setReschedulingReminderId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const sortedReminders = useMemo(() => [...reminders].sort(compareReminders), [reminders])

  const linkedLabels = useMemo<Record<string, ReminderLinkLabel | undefined>>(() => {
    return Object.fromEntries(
      reminders.map((reminder) => {
        if (!reminder.linkedItemId || !reminder.linkedItemType) {
          return [reminder.id, undefined]
        }

        const id = reminder.linkedItemId
        switch (reminder.linkedItemType) {
          case 'task': {
            const item = tasks.find((task) => task.id === id)
            return [reminder.id, item ? { id: item.id, label: item.title, type: 'task' as const } : undefined]
          }
          case 'project': {
            const item = projects.find((project) => project.id === id)
            return [reminder.id, item ? { id: item.id, label: item.title, type: 'project' as const } : undefined]
          }
          case 'note': {
            const item = notes.find((note) => note.id === id)
            return [reminder.id, item ? { id: item.id, label: item.title, type: 'note' as const } : undefined]
          }
          case 'idea': {
            const item = ideas.find((idea) => idea.id === id)
            return [reminder.id, item ? { id: item.id, label: item.title, type: 'idea' as const } : undefined]
          }
          default:
            return [reminder.id, undefined]
        }
      }),
    )
  }, [ideas, notes, projects, reminders, tasks])

  const editingReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === editingReminderId) ?? null,
    [editingReminderId, reminders],
  )

  const reschedulingReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === reschedulingReminderId) ?? null,
    [reminders, reschedulingReminderId],
  )

  const filteredReminders = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return sortedReminders.filter((reminder) => !reminder.completed && isReminderToday(reminder, todayKey))
      case 'active':
        return sortedReminders.filter((reminder) => !reminder.completed)
      case 'overdue':
        return sortedReminders.filter((reminder) => isReminderOverdue(reminder, todayStart))
      case 'completed':
        return sortedReminders.filter((reminder) => reminder.completed)
      case 'all':
      default:
        return sortedReminders
    }
  }, [activeFilter, sortedReminders, todayKey, todayStart])

  const groupedReminders = useMemo(() => {
    const groups = new Map<ReminderGroupKey, Reminder[]>()

    filteredReminders.forEach((reminder) => {
      const groupKey = getReminderGroupKey(reminder, todayStart, todayKey)
      const existing = groups.get(groupKey) ?? []
      existing.push(reminder)
      groups.set(groupKey, existing)
    })

    return GROUP_ORDER
      .map((groupKey) => ({ key: groupKey, label: GROUP_LABELS[groupKey], items: groups.get(groupKey) ?? [] }))
      .filter((group) => group.items.length > 0)
  }, [filteredReminders, todayKey, todayStart])

  const stats = useMemo(() => ({
    total: reminders.length,
    today: reminders.filter((reminder) => !reminder.completed && isReminderToday(reminder, todayKey)).length,
    active: reminders.filter((reminder) => !reminder.completed).length,
    completed: reminders.filter((reminder) => reminder.completed).length,
  }), [reminders, todayKey])

  function openCreateModal() {
    setEditingReminderId(null)
    setIsCreateOpen(true)
  }

  function openEditModal(reminder: Reminder) {
    setEditingReminderId(reminder.id)
    setIsCreateOpen(false)
  }

  function closeModal() {
    setEditingReminderId(null)
    setIsCreateOpen(false)
  }

  function openRescheduleModal(reminder: Reminder) {
    setReschedulingReminderId(reminder.id)
  }

  function closeRescheduleModal() {
    setReschedulingReminderId(null)
  }

  function handleSubmit(values: ReminderFormValues) {
    const base = editingReminder
    const timestamp = new Date().toISOString()
    const next: Reminder = {
      id: base?.id ?? crypto.randomUUID(),
      title: values.title,
      description: values.description,
      remindAt: values.remindAt,
      linkedItemId: values.linkedItemId,
      linkedItemType: values.linkedItemType,
      completed: base?.completed ?? false,
      createdAt: base?.createdAt ?? new Date().toISOString(),
      updatedAt: timestamp,
    }

    setReminders((current) => {
      if (base) {
        return current.map((item) => (item.id === base.id ? next : item))
      }
      return [next, ...current]
    })

    closeModal()
  }

  function handleToggleComplete(reminder: Reminder) {
    const timestamp = new Date().toISOString()
    setReminders((current) => current.map((item) => (item.id === reminder.id ? { ...item, completed: !item.completed, updatedAt: timestamp } : item)))
  }

  function handleReschedule(reminder: Reminder, remindAt: string) {
    const timestamp = new Date().toISOString()
    setReminders((current) => current.map((item) => (item.id === reminder.id ? { ...item, remindAt, updatedAt: timestamp } : item)))
    closeRescheduleModal()
  }

  function handleDelete(reminder: Reminder) {
    const shouldDelete = window.confirm(`Удалить напоминание «${reminder.title}»?`)

    if (!shouldDelete) {
      return
    }

    setReminders((current) => current.filter((item) => item.id !== reminder.id))

    if (editingReminderId === reminder.id) {
      closeModal()
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader
        section="reminders"
        title="Напоминания"
        description="Список активных напоминаний и ближайших сигналов."
        actionLabel="Добавить напоминание"
        onAction={openCreateModal}
      />

      <section className="ui-panel p-4 md:p-4.5">
        <div className="flex flex-wrap gap-2 text-sm text-(--text-secondary)">
          <span className="ui-chip">Всего {stats.total}</span>
          <span className="ui-chip">Сегодня {stats.today}</span>
          <span className="ui-chip">Активные {stats.active}</span>
          <span className={cn('ui-chip', stats.completed > 0 && 'border-(--completed-border) bg-(--completed-bg) text-(--completed-text)')}>Выполненные {stats.completed}</span>
        </div>

        <div className="mt-3 ui-filter-scroll">
          {(Object.keys(FILTER_LABELS) as ReminderFilter[]).map((filter) => (
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

      {filteredReminders.length === 0 ? (
        <section className="ui-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-(--text-muted)">Напоминания</p>
          <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">{reminders.length === 0 ? 'Напоминаний пока нет' : 'В этом фильтре ничего нет'}</h2>
          <p className="mt-2 max-w-2xl text-sm text-(--text-muted)">{reminders.length === 0 ? 'Добавьте напоминание, чтобы не пропускать важные действия.' : 'Выберите другой фильтр или добавьте напоминание.'}</p>
          <button type="button" onClick={openCreateModal} className="ui-button-accent mt-4 px-4 py-2.5">Добавить напоминание</button>
        </section>
      ) : (
        <section className="ui-panel p-0 overflow-visible">
          <div className="overflow-hidden rounded-[inherit] border border-(--border) bg-(--panel)">
            <div className="hidden grid-cols-[110px_minmax(0,1.8fr)_160px_minmax(120px,1fr)_110px_48px] items-center gap-3 border-b border-(--border) px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-(--text-muted) md:grid">
              <span>Статус</span>
              <span>Напоминание</span>
              <span>Когда</span>
              <span>Связь</span>
              <span>Действие</span>
              <span className="text-right">Меню</span>
            </div>

            <div>
            {groupedReminders.map((group) => (
              <div key={group.key}>
                <div className="border-b border-(--border) px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-(--text-muted) md:px-4">
                  {group.label}
                </div>

                {group.items.map((reminder) => {
                  const linked = linkedLabels[reminder.id]
                  const isOverdue = isReminderOverdue(reminder, todayStart)
                  const isToday = !reminder.completed && isReminderToday(reminder, todayKey)
                  const statusChip = reminder.completed
                    ? {
                        label: 'Выполнено',
                        className: 'border-(--completed-border) bg-(--completed-bg) text-(--completed-text)',
                      }
                    : isOverdue
                      ? {
                          label: 'Просрочено',
                          className: 'border-(--danger-border) bg-[color-mix(in_srgb,var(--danger-bg)_36%,var(--panel))] text-(--danger-text)',
                        }
                      : {
                          label: 'Активно',
                          className: 'border-(--border-soft) bg-(--panel) text-(--text-secondary)',
                        }
                  const primaryActionLabel = isOverdue && !reminder.completed ? 'Перенести' : reminder.completed ? 'Вернуть' : 'Отметить'

                  return (
                    <article
                      key={reminder.id}
                      onClick={() => openEditModal(reminder)}
                      className={cn(
                        'relative border-b border-(--border) bg-(--panel-elevated) px-3 py-3 transition hover:bg-[color-mix(in_srgb,var(--panel-elevated)_76%,var(--panel))] md:px-4',
                        reminder.completed && 'opacity-[0.58]',
                        isOverdue && !reminder.completed && 'bg-[color-mix(in_srgb,var(--danger-bg)_18%,var(--panel-elevated))]',
                        isToday && !reminder.completed && 'border-(--accent-border) bg-[color-mix(in_srgb,var(--accent-soft)_30%,var(--panel-elevated))]',
                      )}
                    >
                      {isOverdue && !reminder.completed ? <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-(--danger-text)" /> : null}

                      <div className="flex items-start gap-3 md:grid md:grid-cols-[110px_minmax(0,1.8fr)_160px_minmax(120px,1fr)_110px_48px] md:items-center md:gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
                            <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em]', statusChip.className)}>{statusChip.label}</span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className={cn('truncate text-sm font-semibold text-(--text-primary)', reminder.completed && 'line-through text-(--text-muted)')}>{reminder.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-sm text-(--text-muted)">{reminder.description || 'Без описания'}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-(--text-muted) md:hidden">
                            <span>{formatReminderDateTime(reminder.remindAt)}</span>
                            <span>{linked ? `${linked.label}${linked.type ? ` · ${linked.type}` : ''}` : 'Не связана'}</span>
                          </div>
                        </div>

                        <div className={cn('hidden text-sm text-(--text-muted) md:block', isToday && !reminder.completed && 'font-medium text-(--text-secondary)')}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openRescheduleModal(reminder)
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 transition hover:border-(--accent-border) hover:bg-(--panel) hover:text-(--text-primary)"
                          >
                            <CalendarDays size={14} strokeWidth={2} />
                            {formatReminderDateTime(reminder.remindAt)}
                          </button>
                        </div>

                        <div className="hidden min-w-0 md:block text-sm text-(--text-muted)">
                          <span className="block truncate">{linked ? `${linked.label}${linked.type ? ` · ${linked.type}` : ''}` : 'Не связана'}</span>
                        </div>

                        <div className="mt-3 flex items-center gap-3 md:mt-0">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              isOverdue && !reminder.completed ? openRescheduleModal(reminder) : handleToggleComplete(reminder)
                            }}
                            className="ui-button px-3 py-2 text-sm"
                          >
                            {primaryActionLabel}
                          </button>
                        </div>

                        <div className="ml-auto shrink-0 md:ml-0">
                          <ActionMenu
                            closeOnChangeKey={activeFilter}
                            items={[
                              { label: 'Открыть', onSelect: () => openEditModal(reminder) },
                              { label: 'Редактировать', onSelect: () => openEditModal(reminder) },
                              { label: reminder.completed ? 'Вернуть в работу' : 'Отметить выполненным', onSelect: () => handleToggleComplete(reminder), tone: 'accent' },
                              { label: 'Перенести', onSelect: () => openRescheduleModal(reminder), tone: 'warning' },
                              { label: 'Удалить', onSelect: () => handleDelete(reminder), tone: 'danger' },
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

      {(isCreateOpen || editingReminder) ? (
        <ReminderFormModal
          reminder={editingReminder}
          tasks={tasks}
          projects={projects}
          notes={notes}
          ideas={ideas}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onToggleComplete={(reminder) => {
            handleToggleComplete(reminder)
            closeModal()
          }}
          onReschedule={(reminder) => {
            closeModal()
            openRescheduleModal(reminder)
          }}
          onDelete={(reminder) => {
            handleDelete(reminder)
            closeModal()
          }}
        />
      ) : null}

      {reschedulingReminder ? (
        <ReminderRescheduleModal
          reminder={reschedulingReminder}
          onClose={closeRescheduleModal}
          onSubmit={(value) => handleReschedule(reschedulingReminder, value)}
        />
      ) : null}
    </section>
  )
}

