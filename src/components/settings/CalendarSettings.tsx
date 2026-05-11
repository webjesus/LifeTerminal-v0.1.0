import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { useAppSettings } from '../../settings/useAppSettings'

function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="ui-settings-row">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-(--text-primary)">{title}</p>
        <p className="mt-1 text-sm text-(--text-muted)">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-200',
          checked ? 'border-(--accent) bg-(--accent)' : 'border-(--border) bg-white',
        ].join(' ')}
      >
        <span className={[
          'inline-flex h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(11,16,32,0.12)] transition-transform duration-200',
          checked ? 'translate-x-[1.4rem]' : 'translate-x-1',
        ].join(' ')} />
      </button>
    </div>
  )
}

export function CalendarSettings() {
  const { settings, updateCalendarSettings } = useAppSettings()
  const [status, setStatus] = useState<string | null>(null)

  function markSaved() {
    setStatus('Сохранено')
  }

  return (
    <section id="calendar-settings" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="ui-settings-section-header">
        <span className="ui-settings-section-icon">
          <CalendarDays size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Календарь</p>
          <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Параметры календаря</h2>
          <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">Первый день недели, формат даты и показ завершённых задач.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="ui-settings-field">
          <span className="text-sm font-medium text-(--text-primary)">Первый день недели</span>
          <span className="text-sm leading-5 text-(--text-muted)">Определяет порядок дней в недельной сетке календаря.</span>
          <select
            value={settings.calendar.weekStartsOn}
            onChange={(event) => {
              updateCalendarSettings({ weekStartsOn: event.target.value as 'monday' | 'sunday' })
              markSaved()
            }}
            className="ui-input"
          >
            <option value="monday">Понедельник</option>
            <option value="sunday">Воскресенье</option>
          </select>
        </label>

        <label className="ui-settings-field">
          <span className="text-sm font-medium text-(--text-primary)">Формат даты</span>
          <span className="text-sm leading-5 text-(--text-muted)">Как отображаются даты в календаре и связанной информации.</span>
          <select
            value={settings.calendar.dateFormat}
            onChange={(event) => {
              updateCalendarSettings({ dateFormat: event.target.value as 'dd.mm.yyyy' | 'yyyy-mm-dd' })
              markSaved()
            }}
            className="ui-input"
          >
            <option value="dd.mm.yyyy">ДД.ММ.ГГГГ</option>
            <option value="yyyy-mm-dd">ГГГГ-ММ-ДД</option>
          </select>
        </label>
      </div>

      <div className="mt-4">
        <ToggleRow
          title="Показывать выполненные задачи в календаре"
          description="Если выключить, завершённые задачи будут скрыты из сетки и дневной панели календаря."
          checked={settings.calendar.showCompletedTasksInCalendar}
          onChange={(checked) => {
            updateCalendarSettings({ showCompletedTasksInCalendar: checked })
            markSaved()
          }}
        />
      </div>

      {status ? <p className="mt-4 text-sm text-(--success-text)">{status}</p> : null}
    </section>
  )
}