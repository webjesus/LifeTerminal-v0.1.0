import { useState } from 'react'
import { LayoutTemplate, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { dashboardLayoutOptions } from '../../settings/appSettingsConfig'
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

export function DisplaySettings() {
  const { settings, updateDisplaySettings, setDashboardLayout, resetDisplaySettings } = useAppSettings()
  const [feedback, setFeedback] = useState<string | null>(null)

  function savePatch(patch: Partial<typeof settings.display>) {
    updateDisplaySettings(patch)
    setFeedback('Сохранено')
  }

  return (
    <section id="display" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="ui-settings-section-header gap-0 md:items-start">
          <span className="ui-settings-section-icon">
            <SlidersHorizontal size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Отображение</p>
            <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Видимость блоков интерфейса</h2>
            <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">Какие блоки показывать на главной странице и в общем интерфейсе приложения.</p>
          </div>
        </div>
        <button type="button" onClick={() => {
          resetDisplaySettings()
          setFeedback('Настройки отображения сброшены')
        }} className="ui-button inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5 md:w-auto">
          <RotateCcw size={18} strokeWidth={2} />
          Сбросить отображение
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <ToggleRow
          title="Показывать быстрый ввод на главной"
          description="Управляет блоком быстрого добавления на главной странице."
          checked={settings.display.showDashboardQuickAdd}
          onChange={(checked) => savePatch({ showDashboardQuickAdd: checked })}
        />
        <ToggleRow
          title="Показывать фокус дня"
          description="Скрывает карточку задач на сегодня и блок статистики дня на главной странице."
          checked={settings.display.showTodayFocus}
          onChange={(checked) => savePatch({ showTodayFocus: checked })}
        />
        <ToggleRow
          title="Показывать последнюю активность"
          description="Включает или скрывает отдельный блок недавних изменений на главной странице."
          checked={settings.display.showRecentActivity}
          onChange={(checked) => savePatch({ showRecentActivity: checked })}
        />
        <ToggleRow
          title="Показывать прогресс проектов"
          description="Управляет прогресс-баром и процентом выполнения в карточках проектов."
          checked={settings.display.showProjectProgress}
          onChange={(checked) => savePatch({ showProjectProgress: checked })}
        />
        <ToggleRow
          title="Показывать описания страниц"
          description="Скрывает вспомогательные текстовые описания под заголовками страниц."
          checked={settings.display.showPageDescriptions}
          onChange={(checked) => savePatch({ showPageDescriptions: checked })}
        />
        <ToggleRow
          title="Показывать плавающую кнопку добавления"
          description="Управляет мобильной FAB-кнопкой быстрого добавления."
          checked={settings.display.showFloatingActionButton}
          onChange={(checked) => savePatch({ showFloatingActionButton: checked })}
        />
      </div>

      <div className="ui-settings-card mt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <LayoutTemplate size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-(--text-primary)">Режим главной страницы</p>
            <p className="mt-1 text-sm text-(--text-muted)">Влияет на порядок и плотность основных блоков главной страницы.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {dashboardLayoutOptions.map((option) => {
            const isActive = settings.layout.dashboardLayout === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setDashboardLayout(option.value)
                  setFeedback('Сохранено')
                }}
                className={[
                  'min-w-0 rounded-3xl border px-4 py-4 text-left transition-all duration-200',
                  isActive ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : 'border-(--border-soft) bg-(--panel) text-(--text-secondary)',
                ].join(' ')}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-2 text-sm text-(--text-muted)">{option.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {feedback ? <p className="mt-4 text-sm text-(--success-text)">{feedback}</p> : null}
    </section>
  )
}