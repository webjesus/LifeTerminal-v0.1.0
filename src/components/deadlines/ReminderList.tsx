import type { Reminder } from '../../types'

type ReminderLinkLabel = {
  id: string
  label: string
  type: string | null
}

type ReminderListProps = {
  reminders: Reminder[]
  linkedLabels: Record<string, ReminderLinkLabel | undefined>
  onToggleComplete: (reminder: Reminder) => void
  onReschedule: (reminder: Reminder) => void
  onEdit: (reminder: Reminder) => void
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ReminderList({
  reminders,
  linkedLabels,
  onToggleComplete,
  onReschedule,
  onEdit,
}: ReminderListProps) {
  return (
    <section className="ui-panel space-y-3 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-(--text-primary)">Напоминания</h2>
        <span className="ui-chip text-(--text-muted)">
          {reminders.length}
        </span>
      </div>

      {reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const linked = linkedLabels[reminder.id]

            return (
              <article
                key={reminder.id}
                className={[
                    'rounded-3xl border p-4 transition-all duration-200',
                  reminder.completed
                    ? 'border-(--border-soft) bg-(--panel-elevated) opacity-72'
                      : 'border-(--border-soft) bg-(--panel-elevated) hover:border-(--accent-border)',
                ].join(' ')}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-(--text-primary)">{reminder.title}</p>
                    <p className="mt-1 text-sm text-(--text-muted)">{reminder.description || 'Описание не добавлено.'}</p>
                  </div>
                  <span className="ui-chip">
                    {reminder.completed ? 'Выполнено' : 'Активно'}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <div className="ui-panel-elevated px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Когда</p>
                    <p className="mt-1 text-sm text-(--text-primary)">{formatDateTime(reminder.remindAt)}</p>
                  </div>
                  <div className="ui-panel-elevated px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Связь</p>
                    <p className="mt-1 text-sm text-(--text-primary)">
                      {linked ? `${linked.label}${linked.type ? ` · ${linked.type}` : ''}` : 'Не связана'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(reminder)}
                    className="min-h-11 rounded-2xl border border-(--completed-border) bg-(--completed-bg) px-3 py-2 text-sm font-medium text-(--completed-text) transition-all duration-200 active:scale-[0.98]"
                  >
                    {reminder.completed ? 'Снять выполнение' : 'Отметить выполненным'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onReschedule(reminder)}
                    className="ui-button px-3 py-2"
                  >
                    Перенести
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(reminder)}
                    className="ui-button px-3 py-2"
                  >
                    Редактировать
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="ui-empty py-8 text-left">
          Напоминаний пока нет.
        </div>
      )}
    </section>
  )
}
