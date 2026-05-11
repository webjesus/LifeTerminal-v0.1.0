import type { CalendarEvent, Project, Reminder, Task } from '../../types'

type CalendarDayPanelProps = {
  selectedDateLabel: string
  tasks: Task[]
  reminders: Reminder[]
  projects: Project[]
  events: CalendarEvent[]
  onAddTask: () => void
  onAddReminder: () => void
  onAddEvent: () => void
  onRescheduleTask: (task: Task) => void
  onExtendDeadline: (task: Task) => void
}

export function CalendarDayPanel({
  selectedDateLabel,
  tasks,
  reminders,
  projects,
  events,
  onAddTask,
  onAddReminder,
  onAddEvent,
  onRescheduleTask,
  onExtendDeadline,
}: CalendarDayPanelProps) {
  return (
    <aside className="ui-panel p-5">
      <div className="border-b border-(--border-soft) pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Selected Day</p>
        <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">{selectedDateLabel}</h2>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={onAddTask} className="ui-button-accent px-3 py-2">Добавить задачу</button>
        <button type="button" onClick={onAddReminder} className="min-h-11 rounded-2xl border border-[#d9e6ff] bg-[#eef5ff] px-3 py-2 text-sm font-medium text-[#4365c2] transition-all duration-200 active:scale-[0.98]">Добавить напоминание</button>
        <button type="button" onClick={onAddEvent} className="min-h-11 rounded-2xl border border-[#e0d8ff] bg-[#f6f2ff] px-3 py-2 text-sm font-medium text-[#6a4fd4] transition-all duration-200 active:scale-[0.98]">Добавить событие</button>
      </div>

      <div className="mt-6 space-y-5">
        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-(--text-muted)">Задачи с дедлайном</h3>
          <div className="space-y-3">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task.id} className="ui-panel-elevated p-4 transition-all duration-200 hover:border-(--accent-border)">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-(--text-primary)">{task.title}</p>
                    <p className="mt-1 text-sm text-(--text-muted)">{task.description || 'Без описания'}</p>
                  </div>
                  <span className="ui-chip">{task.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onRescheduleTask(task)} className="ui-button px-3 py-2 text-xs">Перенести</button>
                  <button type="button" onClick={() => onExtendDeadline(task)} className="rounded-2xl border border-[#f2dcc4] bg-[#fff4e8] px-3 py-2 text-xs font-medium text-[#b26a26] transition-all duration-200 active:scale-[0.98]">Продлить +1 день</button>
                </div>
              </div>
            )) : <p className="ui-empty text-left">Нет задач на эту дату.</p>}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-(--text-muted)">Напоминания</h3>
          <div className="space-y-3">
            {reminders.length > 0 ? reminders.map((reminder) => (
              <div key={reminder.id} className="ui-panel-elevated border-[#d9e6ff] bg-[#eef5ff] p-4">
                <p className="font-medium text-(--text-primary)">{reminder.title}</p>
                <p className="mt-1 text-sm text-(--text-muted)">{reminder.description || 'Без описания'}</p>
              </div>
            )) : <p className="ui-empty text-left">Нет напоминаний на эту дату.</p>}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-(--text-muted)">События проекта</h3>
          <div className="space-y-3">
            {projects.length > 0 ? projects.map((project) => (
              <div key={project.id} className="ui-panel-elevated border-[#d7e8dc] bg-[#ebf7ef] p-4">
                <p className="font-medium text-(--text-primary)">{project.title}</p>
                <p className="mt-1 text-sm text-(--text-muted)">{project.description || 'Описание проекта не добавлено.'}</p>
              </div>
            )) : <p className="ui-empty text-left">Нет проектных событий на эту дату.</p>}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-(--text-muted)">Календарные события</h3>
          <div className="space-y-3">
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="ui-panel-elevated border-[#e0d8ff] bg-[#f6f2ff] p-4">
                <p className="font-medium text-(--text-primary)">{event.title}</p>
                <p className="mt-1 text-sm text-(--text-muted)">{event.description || 'Без описания'}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-(--text-muted)">{event.type}</p>
              </div>
            )) : <p className="ui-empty text-left">Нет календарных событий на эту дату.</p>}
          </div>
        </section>
      </div>
    </aside>
  )
}
