import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import type { Idea, LinkedItemType, Note, Project, Reminder, Task } from '../../types'

export type ReminderFormValues = {
  title: string
  description: string
  remindAt: string
  linkedItemId: string | null
  linkedItemType: LinkedItemType | null
}

type ReminderFormModalProps = {
  reminder?: Reminder | null
  tasks: Task[]
  projects: Project[]
  notes: Note[]
  ideas: Idea[]
  onClose: () => void
  onSubmit: (values: ReminderFormValues) => void
  onToggleComplete?: (reminder: Reminder) => void
  onReschedule?: (reminder: Reminder) => void
  onDelete?: (reminder: Reminder) => void
}

type LinkOption = {
  id: string
  label: string
  type: LinkedItemType
}

function toLocalDateTimeValue(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function ReminderFormModal({
  reminder,
  tasks,
  projects,
  notes,
  ideas,
  onClose,
  onSubmit,
  onToggleComplete,
  onReschedule,
  onDelete,
}: ReminderFormModalProps) {
  const linkOptions: LinkOption[] = [
    ...tasks.map((task) => ({ id: task.id, label: task.title, type: 'task' as const })),
    ...projects.map((project) => ({ id: project.id, label: project.title, type: 'project' as const })),
    ...notes.map((note) => ({ id: note.id, label: note.title, type: 'note' as const })),
    ...ideas.map((idea) => ({ id: idea.id, label: idea.title, type: 'idea' as const })),
  ]

  const [values, setValues] = useState({
    title: reminder?.title ?? '',
    description: reminder?.description ?? '',
    remindAt: toLocalDateTimeValue(reminder?.remindAt ?? null),
    linkKey: reminder?.linkedItemId && reminder.linkedItemType ? `${reminder.linkedItemType}:${reminder.linkedItemId}` : '',
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values.title.trim() || !values.remindAt) {
      return
    }

    const [linkedItemType, linkedItemId] = values.linkKey.split(':')

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      remindAt: new Date(values.remindAt).toISOString(),
      linkedItemId: linkedItemId || null,
      linkedItemType: (linkedItemType as LinkedItemType | undefined) ?? null,
    })
  }

  return (
    <Modal
      title={reminder ? 'Редактирование напоминания' : 'Новое напоминание'}
      isOpen
      onClose={onClose}
      size="md"
      variant="side"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {reminder && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(reminder)}
              className="ui-button-danger w-full sm:w-auto"
            >
              Удалить
            </button>
          ) : null}
          {reminder && onReschedule ? (
            <button
              type="button"
              onClick={() => onReschedule(reminder)}
              className="ui-button w-full sm:w-auto"
            >
              Перенести
            </button>
          ) : null}
          {reminder && onToggleComplete ? (
            <button
              type="button"
              onClick={() => onToggleComplete(reminder)}
              className="ui-button w-full sm:w-auto"
            >
              {reminder.completed ? 'Вернуть' : 'Отметить выполненным'}
            </button>
          ) : null}
          <button
            type="submit"
            form="reminder-form"
            className="ui-button-accent w-full sm:w-auto"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ui-button w-full sm:w-auto"
          >
            Отмена
          </button>
        </div>
      }
    >
        <form id="reminder-form" onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-(--text-muted)">Напоминание сохраняется локально и может быть связано с сущностями Life OS.</p>

          <div className="space-y-2">
            <label htmlFor="reminder-title" className="text-sm text-(--text-secondary)">Название</label>
            <input
              id="reminder-title"
              value={values.title}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              className="ui-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reminder-description" className="text-sm text-(--text-secondary)">Описание</label>
            <textarea
              id="reminder-description"
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="ui-input min-h-28 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <label htmlFor="reminder-date" className="text-sm text-(--text-secondary)">Дата и время напоминания</label>
              <input
                id="reminder-date"
                type="datetime-local"
                value={values.remindAt}
                onChange={(event) => setValues((current) => ({ ...current, remindAt: event.target.value }))}
                className="ui-input"
                required
              />
              <p className="text-xs text-(--text-muted)">Это момент, когда система должна напомнить о действии, а не дедлайн выполнения.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="reminder-link" className="text-sm text-(--text-secondary)">Связь</label>
              <select
                id="reminder-link"
                value={values.linkKey}
                onChange={(event) => setValues((current) => ({ ...current, linkKey: event.target.value }))}
                className="ui-input"
              >
                <option value="">Без связи</option>
                {linkOptions.map((option) => (
                  <option key={`${option.type}:${option.id}`} value={`${option.type}:${option.id}`}>
                    {option.label} · {option.type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
    </Modal>
  )
}
