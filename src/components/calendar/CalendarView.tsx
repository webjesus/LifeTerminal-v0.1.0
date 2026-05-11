type DaySummary = {
  taskCount: number
  reminderCount: number
  eventCount: number
  projectCount: number
  overdueCount: number
}

type CalendarViewProps = {
  monthLabel: string
  weekDays: string[]
  days: Date[]
  currentMonth: Date
  selectedDateKey: string
  todayKey: string
  summaries: Record<string, DaySummary>
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDate: (date: Date) => void
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function CalendarView({
  monthLabel,
  weekDays,
  days,
  currentMonth,
  selectedDateKey,
  todayKey,
  summaries,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: CalendarViewProps) {
  return (
    <section className="ui-panel p-5">
      <div className="flex items-center justify-between gap-4 border-b border-(--border-soft) pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Month View</p>
          <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">{monthLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="ui-button px-3 py-2"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="ui-button px-3 py-2"
          >
            Вперёд
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((weekDay) => (
          <div key={weekDay} className="px-2 py-1 text-center text-xs uppercase tracking-[0.16em] text-(--text-muted)">
            {weekDay}
          </div>
        ))}

        {days.map((date) => {
          const dateKey = toDateKey(date)
          const summary = summaries[dateKey] ?? {
            taskCount: 0,
            reminderCount: 0,
            eventCount: 0,
            projectCount: 0,
            overdueCount: 0,
          }
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()
          const isSelected = selectedDateKey === dateKey
          const isToday = todayKey === dateKey
          const hasAnyItems = summary.taskCount + summary.reminderCount + summary.eventCount + summary.projectCount > 0
          const hasOverdue = summary.overdueCount > 0

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(date)}
              className={[
                'min-h-16 rounded-2xl border p-2 text-left transition-all duration-200 sm:min-h-24 sm:p-3',
                isSelected ? 'border-(--accent-border) bg-(--accent-soft)' : 'border-(--border-soft) bg-(--panel-elevated) hover:border-(--accent-border)',
                isToday ? 'ring-1 ring-(--accent)' : '',
                !isCurrentMonth ? 'opacity-45' : '',
                hasOverdue ? 'border-(--danger-text) bg-(--danger-bg)' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-(--text-primary)">{date.getDate()}</span>
                {hasOverdue ? <span className="text-[10px] uppercase tracking-[0.16em] text-(--danger-text)">over</span> : null}
              </div>

              <div className="mt-3 space-y-2">
                {hasAnyItems ? (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {summary.taskCount > 0 ? <span className="h-2 w-2 rounded-full bg-(--accent)" /> : null}
                      {summary.reminderCount > 0 ? <span className="h-2 w-2 rounded-full bg-[#5f8cff]" /> : null}
                      {summary.eventCount > 0 ? <span className="h-2 w-2 rounded-full bg-[#7c6cff]" /> : null}
                      {summary.projectCount > 0 ? <span className="h-2 w-2 rounded-full bg-[#49a86d]" /> : null}
                    </div>
                    <div className="hidden space-y-1 text-xs text-(--text-muted) sm:block">
                      {summary.taskCount > 0 ? <p>Задачи: {summary.taskCount}</p> : null}
                      {summary.reminderCount > 0 ? <p>Напоминания: {summary.reminderCount}</p> : null}
                      {summary.eventCount > 0 ? <p>События: {summary.eventCount}</p> : null}
                      {summary.projectCount > 0 ? <p>Проекты: {summary.projectCount}</p> : null}
                    </div>
                  </>
                ) : (
                  <p className="hidden text-xs text-(--text-muted) sm:block">Пусто</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
