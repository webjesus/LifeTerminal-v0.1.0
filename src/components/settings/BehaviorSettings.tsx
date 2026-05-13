import { Workflow } from 'lucide-react'
import { useState } from 'react'
import { useAppSettings } from '../../settings/useAppSettings'

const projectViewOptions = [
  { value: 'overview', label: 'Обзор' },
  { value: 'workspace', label: 'Рабочая область' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'notes', label: 'Заметки' },
  { value: 'ideas', label: 'Идеи' },
  { value: 'files', label: 'Файлы' },
  { value: 'map', label: 'Карта связей' },
] as const

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
        <span
          className={[
            'inline-flex h-6 w-6 rounded-full bg-(--input-bg) shadow-(--shadow-soft) transition-transform duration-200',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export function BehaviorSettings() {
  const { settings, updateBehaviorSettings } = useAppSettings()
  const [status, setStatus] = useState<string | null>(null)

  function markSaved() {
    setStatus('Сохранено')
  }

  return (
    <section id="behavior" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="ui-settings-section-header">
        <span className="ui-settings-section-icon">
          <Workflow size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Поведение</p>
          <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Логика создания и удаления</h2>
          <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">Значения по умолчанию для новых задач и базовое поведение интерфейса.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <label className="ui-settings-field">
          <span className="text-sm font-medium text-(--text-primary)">Приоритет задачи по умолчанию</span>
          <span className="text-sm leading-5 text-(--text-muted)">Применяется к новым задачам и быстрому добавлению.</span>
          <select
            value={settings.behavior.defaultTaskPriority}
            onChange={(event) => {
              updateBehaviorSettings({ defaultTaskPriority: event.target.value as 'low' | 'medium' | 'high' })
              markSaved()
            }}
            className="ui-input"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </label>

        <label className="ui-settings-field">
          <span className="text-sm font-medium text-(--text-primary)">Статус новой задачи</span>
          <span className="text-sm leading-5 text-(--text-muted)">Стартовый статус для новых задач в приложении.</span>
          <select
            value={settings.behavior.defaultTaskStatus}
            onChange={(event) => {
              updateBehaviorSettings({ defaultTaskStatus: event.target.value as 'new' | 'in_progress' })
              markSaved()
            }}
            className="ui-input"
          >
            <option value="new">Новая</option>
            <option value="in_progress">В работе</option>
          </select>
        </label>

        <label className="ui-settings-field">
          <span className="text-sm font-medium text-(--text-primary)">Стартовый вид проекта</span>
          <span className="text-sm leading-5 text-(--text-muted)">Какая вкладка открывается первой в карточке проекта.</span>
          <select
            value={settings.behavior.defaultProjectView}
            onChange={(event) => {
              updateBehaviorSettings({ defaultProjectView: event.target.value as typeof settings.behavior.defaultProjectView })
              markSaved()
            }}
            className="ui-input"
          >
            {projectViewOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <ToggleRow
          title="Спрашивать перед удалением"
          description="Подтверждение перед удалением задач, заметок, идей, файлов и проектов."
          checked={settings.behavior.askBeforeDelete}
          onChange={(checked) => {
            updateBehaviorSettings({ askBeforeDelete: checked })
            markSaved()
          }}
        />
        <ToggleRow
          title="Автосохранение"
          description="Изменения сохраняются в localStorage сразу после действия пользователя."
          checked={settings.behavior.autoSave}
          onChange={(checked) => {
            updateBehaviorSettings({ autoSave: checked })
            markSaved()
          }}
        />
      </div>

      {status ? <p className="mt-4 text-sm text-(--success-text)">{status}</p> : null}
    </section>
  )
}