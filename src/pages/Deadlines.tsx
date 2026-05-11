import { useMemo, useState } from 'react'
import { DeadlineList, type DeadlineItem } from '../components/deadlines/DeadlineList'
import { ReminderFormModal, type ReminderFormValues } from '../components/deadlines/ReminderFormModal'
import { ReminderList } from '../components/deadlines/ReminderList'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Idea, Note, Project, Reminder, Task } from '../types'
import { storageKeys } from '../utils/storage'

function toDateKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function compareDeadlines(a: DeadlineItem, b: DeadlineItem) {
  return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
}

function compareReminders(a: Reminder, b: Reminder) {
  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed)
  }

  return new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
}

export function DeadlinesPage() {
  const todayKey = toDateKey(new Date().toISOString())
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: reminders, setValue: setReminders } = useLocalStorage<Reminder[]>(storageKeys.reminders, [])
  const { value: notes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const allDeadlines = useMemo<DeadlineItem[]>(() => {
    const taskDeadlines = tasks
      .filter((task) => task.deadline)
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dateLabel: formatDate(task.deadline!),
        type: 'task' as const,
        isOverdue: task.status !== 'completed' && toDateKey(task.deadline!) < todayKey,
        rawDate: task.deadline!,
      }))

    const projectDeadlines = projects
      .filter((project) => project.deadline)
      .map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        dateLabel: formatDate(project.deadline!),
        type: 'project' as const,
        isOverdue: project.status !== 'completed' && project.status !== 'archived' && toDateKey(project.deadline!) < todayKey,
        rawDate: project.deadline!,
      }))

    return [...taskDeadlines, ...projectDeadlines].sort(compareDeadlines)
  }, [projects, tasks, todayKey])

  const overdueDeadlines = useMemo(
    () => allDeadlines.filter((item) => item.isOverdue),
    [allDeadlines],
  )

  const upcomingDeadlines = useMemo(
    () => allDeadlines.filter((item) => !item.isOverdue).slice(0, 6),
    [allDeadlines],
  )

  const sortedReminders = useMemo(() => [...reminders].sort(compareReminders), [reminders])

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

  const editingReminder = useMemo(
    () => reminders.find((reminder) => reminder.id === editingReminderId) ?? null,
    [editingReminderId, reminders],
  )

  function handleExtendDeadline(item: DeadlineItem) {
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

  function handleToggleReminder(reminder: Reminder) {
    setReminders((currentReminders) =>
      currentReminders.map((item) =>
        item.id === reminder.id ? { ...item, completed: !item.completed } : item,
      ),
    )
  }

  function handleRescheduleReminder(reminder: Reminder) {
    const nextValue = window.prompt(
      'Введите новую дату и время в формате YYYY-MM-DDTHH:mm',
      reminder.remindAt ? new Date(reminder.remindAt).toISOString().slice(0, 16) : '',
    )

    if (!nextValue || Number.isNaN(Date.parse(nextValue))) {
      return
    }

    setReminders((currentReminders) =>
      currentReminders.map((item) =>
        item.id === reminder.id
          ? {
              ...item,
              remindAt: new Date(nextValue).toISOString(),
            }
          : item,
      ),
    )
  }

  function openCreateReminderModal() {
    setEditingReminderId(null)
    setIsCreateModalOpen(true)
  }

  function openEditReminderModal(reminder: Reminder) {
    setEditingReminderId(reminder.id)
    setIsCreateModalOpen(false)
  }

  function closeReminderModal() {
    setEditingReminderId(null)
    setIsCreateModalOpen(false)
  }

  function handleReminderSubmit(values: ReminderFormValues) {
    const baseReminder = editingReminder
    const nextReminder: Reminder = {
      id: baseReminder?.id ?? crypto.randomUUID(),
      title: values.title,
      description: values.description,
      remindAt: values.remindAt,
      linkedItemId: values.linkedItemId,
      linkedItemType: values.linkedItemType,
      completed: baseReminder?.completed ?? false,
      createdAt: baseReminder?.createdAt ?? new Date().toISOString(),
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
    <section className="space-y-6">
      <header className="ui-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Time Control</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-(--text-primary) md:text-4xl">Дедлайны и напоминания</h1>
            <p className="page-description mt-2 max-w-3xl text-sm text-(--text-muted) md:text-base">
              Централизованный обзор сроков по задачам и проектам, а также список активных напоминаний со связями на сущности Life OS.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateReminderModal}
            className="ui-button-accent px-4 py-3"
          >
            Добавить напоминание
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <DeadlineList
            title="Ближайшие дедлайны"
            items={upcomingDeadlines}
            emptyText="Ближайших дедлайнов пока нет."
            onExtend={handleExtendDeadline}
          />

          <DeadlineList
            title="Просроченные дедлайны"
            items={overdueDeadlines}
            emptyText="Просроченных дедлайнов нет."
            onExtend={handleExtendDeadline}
          />
        </div>

        <div className="xl:sticky xl:top-6">
          <ReminderList
            reminders={sortedReminders}
            linkedLabels={linkedLabels}
            onToggleComplete={handleToggleReminder}
            onReschedule={handleRescheduleReminder}
            onEdit={openEditReminderModal}
          />
        </div>
      </div>

      <DeadlineList
        title="Все дедлайны"
        items={allDeadlines}
        emptyText="Дедлайны пока отсутствуют."
        onExtend={handleExtendDeadline}
      />

      {(isCreateModalOpen || editingReminder) ? (
        <ReminderFormModal
          reminder={editingReminder}
          tasks={tasks}
          projects={projects}
          notes={notes}
          ideas={ideas}
          onClose={closeReminderModal}
          onSubmit={handleReminderSubmit}
        />
      ) : null}
    </section>
  )
}
