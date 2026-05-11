import { useState, type FormEvent } from 'react'
import { useAppSettings } from '../../settings/useAppSettings'
import { Modal } from '../Modal'
import type { CalendarEventType, TaskPriority } from '../../types'

export type EventFormMode = 'task' | 'reminder' | 'event'

export type EventFormValues = {
  title: string
  description: string
  date: string
  time: string
  priority: TaskPriority
  eventType: CalendarEventType
}

type EventFormModalProps = {
  mode: EventFormMode
  selectedDate: string
  onClose: () => void
  onSubmit: (values: EventFormValues) => void
}

const modeLabels: Record<EventFormMode, string> = {
  task: 'Новая задача на дату',
  reminder: 'Новое напоминание',
  event: 'Новое календарное событие',
}

export function EventFormModal({ mode, selectedDate, onClose, onSubmit }: EventFormModalProps) {
  const { settings } = useAppSettings()
  const [values, setValues] = useState<EventFormValues>({
    title: '',
    description: '',
    date: selectedDate,
    time: '09:00',
    priority: settings.behavior.defaultTaskPriority,
    eventType: 'custom',
  })

  function handleChange<K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values.title.trim()) {
      return
    }

    onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
    })
  }

  return (
    <Modal
      title={modeLabels[mode]}
      isOpen
      onClose={onClose}
      size="md"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="submit" form="event-form" className="ui-button-accent w-full sm:w-auto">Сохранить</button>
          <button type="button" onClick={onClose} className="ui-button w-full sm:w-auto">Отмена</button>
        </div>
      }
    >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-(--text-muted)">Дата уже выбрана из календаря и будет сохранена в localStorage.</p>

          <div className="space-y-2">
            <label htmlFor="calendar-title" className="text-sm text-(--text-secondary)">Название</label>
            <input id="calendar-title" value={values.title} onChange={(event) => handleChange('title', event.target.value)} className="ui-input" placeholder="Введите название" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="calendar-description" className="text-sm text-(--text-secondary)">Описание</label>
            <textarea id="calendar-description" value={values.description} onChange={(event) => handleChange('description', event.target.value)} rows={5} className="ui-input min-h-[120px] max-h-[240px] resize-y" placeholder="Краткий контекст" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="calendar-date" className="text-sm text-(--text-secondary)">Дата</label>
              <input id="calendar-date" type="date" value={values.date} onChange={(event) => handleChange('date', event.target.value)} className="ui-input" />
            </div>
            <div className="space-y-2">
              <label htmlFor="calendar-time" className="text-sm text-(--text-secondary)">Время</label>
              <input id="calendar-time" type="time" value={values.time} onChange={(event) => handleChange('time', event.target.value)} className="ui-input" />
            </div>
          </div>

          {mode === 'task' ? (
            <div className="space-y-2">
              <label htmlFor="calendar-priority" className="text-sm text-(--text-secondary)">Приоритет</label>
              <select id="calendar-priority" value={values.priority} onChange={(event) => handleChange('priority', event.target.value as TaskPriority)} className="ui-input">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          ) : null}

          {mode === 'event' ? (
            <div className="space-y-2">
              <label htmlFor="calendar-type" className="text-sm text-(--text-secondary)">Тип события</label>
              <select id="calendar-type" value={values.eventType} onChange={(event) => handleChange('eventType', event.target.value as CalendarEventType)} className="ui-input">
                <option value="custom">Другое</option>
                <option value="meeting">Встреча</option>
                <option value="deadline">Дедлайн</option>
                <option value="project">Проект</option>
                <option value="reminder">Напоминание</option>
                <option value="task">Задача</option>
              </select>
            </div>
          ) : null}

        </form>
    </Modal>
  )
}
