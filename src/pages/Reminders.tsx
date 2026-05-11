import { useMemo, useState } from 'react'
import { ReminderFormModal, type ReminderFormValues } from '../components/deadlines/ReminderFormModal'
import { ReminderList } from '../components/deadlines/ReminderList'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Idea, Note, Project, Reminder, Task } from '../types'
import { storageKeys } from '../utils/storage'

function compareReminders(a: Reminder, b: Reminder) {
  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed)
  }

  return new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
}

export function RemindersPage() {
  const { value: reminders, setValue: setReminders } = useLocalStorage<Reminder[]>(storageKeys.reminders, [])
  const { value: tasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: notes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const sortedReminders = useMemo(() => [...reminders].sort(compareReminders), [reminders])

  const linkedLabels = useMemo(() => {
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

  function handleSubmit(values: ReminderFormValues) {
    const base = editingReminder
    const next: Reminder = {
      id: base?.id ?? crypto.randomUUID(),
      title: values.title,
      description: values.description,
      remindAt: values.remindAt,
      linkedItemId: values.linkedItemId,
      linkedItemType: values.linkedItemType,
      completed: base?.completed ?? false,
      createdAt: base?.createdAt ?? new Date().toISOString(),
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
    setReminders((current) => current.map((item) => (item.id === reminder.id ? { ...item, completed: !item.completed } : item)))
  }

  function handleReschedule(reminder: Reminder) {
    const nextValue = window.prompt(
      'Введите новую дату и время в формате YYYY-MM-DDTHH:mm',
      reminder.remindAt ? new Date(reminder.remindAt).toISOString().slice(0, 16) : '',
    )

    if (!nextValue || Number.isNaN(Date.parse(nextValue))) {
      return
    }

    setReminders((current) => current.map((item) => (item.id === reminder.id ? { ...item, remindAt: new Date(nextValue).toISOString() } : item)))
  }

  return (
    <section className="space-y-6">
      <header className="ui-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Time Control</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-(--text-primary) md:text-4xl">Напоминания</h1>
            <p className="page-description mt-2 max-w-3xl text-sm text-(--text-muted) md:text-base">
              Список напоминаний со связями на задачи, проекты, заметки и идеи. Перенос и отметка выполнения доступны прямо из списка.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="ui-button-accent px-4 py-3"
          >
            Добавить напоминание
          </button>
        </div>
      </header>

      <ReminderList
        reminders={sortedReminders}
        linkedLabels={linkedLabels}
        onToggleComplete={handleToggleComplete}
        onReschedule={handleReschedule}
        onEdit={openEditModal}
      />

      {(isCreateOpen || editingReminder) ? (
        <ReminderFormModal
          reminder={editingReminder}
          tasks={tasks}
          projects={projects}
          notes={notes}
          ideas={ideas}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  )
}

