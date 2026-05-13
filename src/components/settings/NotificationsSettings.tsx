import { Bell } from 'lucide-react'
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
          checked ? 'border-(--accent) bg-(--accent)' : 'border-(--border) bg-(--panel-elevated)',
        ].join(' ')}
      >
        <span className={[
          'inline-flex h-6 w-6 rounded-full bg-(--input-bg) shadow-(--shadow-soft) transition-transform duration-200',
          checked ? 'translate-x-[1.4rem]' : 'translate-x-1',
        ].join(' ')} />
      </button>
    </div>
  )
}

export function NotificationsSettings() {
  const { settings, updateNotificationSettings } = useAppSettings()
  const [status, setStatus] = useState<string | null>(null)

  function markSaved() {
    setStatus('Сохранено')
  }

  return (
    <section id="notifications" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="ui-settings-section-header">
        <span className="ui-settings-section-icon">
          <Bell size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Напоминания</p>
          <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Напоминания и предупреждения</h2>
          <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">Глобальный флаг напоминаний и время предварительного предупреждения.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <ToggleRow
          title="Включить напоминания"
          description="Сохраняет глобальный флаг доступности напоминаний в приложении."
          checked={settings.notifications.enableReminders}
          onChange={(checked) => {
            updateNotificationSettings({ enableReminders: checked })
            markSaved()
          }}
        />

        <label className="ui-settings-field">
          <span className="text-sm font-medium text-(--text-primary)">Время предупреждения</span>
          <span className="text-sm leading-5 text-(--text-muted)">За сколько минут до события показывать предупреждение.</span>
          <select
            value={String(settings.notifications.reminderLeadTimeMinutes)}
            onChange={(event) => {
              updateNotificationSettings({ reminderLeadTimeMinutes: Number(event.target.value) as 5 | 10 | 15 | 30 | 60 })
              markSaved()
            }}
            className="ui-input"
          >
            {[5, 10, 15, 30, 60].map((value) => (
              <option key={value} value={value}>{value} минут</option>
            ))}
          </select>
        </label>
      </div>

      {status ? <p className="mt-4 text-sm text-(--success-text)">{status}</p> : null}
    </section>
  )
}