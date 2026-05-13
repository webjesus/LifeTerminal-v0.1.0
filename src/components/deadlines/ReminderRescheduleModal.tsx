import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import type { Reminder } from '../../types'

type ReminderRescheduleModalProps = {
  reminder: Reminder
  onClose: () => void
  onSubmit: (value: string) => void
}

function toLocalDateTimeValue(value: string) {
  const date = new Date(value)
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function ReminderRescheduleModal({ reminder, onClose, onSubmit }: ReminderRescheduleModalProps) {
  const [value, setValue] = useState(toLocalDateTimeValue(reminder.remindAt))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!value) {
      return
    }

    onSubmit(new Date(value).toISOString())
  }

  return (
    <Modal
      title="Изменить время напоминания"
      isOpen
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="submit" form="reminder-reschedule-form" className="ui-button-accent w-full sm:w-auto">Сохранить</button>
          <button type="button" onClick={onClose} className="ui-button w-full sm:w-auto">Отмена</button>
        </div>
      }
    >
      <form id="reminder-reschedule-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-(--text-primary)">{reminder.title}</p>
          <p className="mt-1 text-sm text-(--text-muted)">Выберите новую дату и время напоминания.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="reminder-reschedule-value" className="text-sm text-(--text-secondary)">Дата и время напоминания</label>
          <input
            id="reminder-reschedule-value"
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="ui-input"
            required
            autoFocus
          />
        </div>
      </form>
    </Modal>
  )
}