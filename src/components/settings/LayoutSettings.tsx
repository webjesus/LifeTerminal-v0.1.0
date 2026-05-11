import { dashboardLayoutOptions } from '../../settings/appSettingsConfig'
import { useAppSettings } from '../../settings/useAppSettings'

export function LayoutSettings() {
  const { settings, setDashboardLayout } = useAppSettings()

  return (
    <section id="layout" className="ui-panel p-5 md:p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Dashboard Layout</p>
      <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Структура главного экрана</h2>
      <p className="mt-2 max-w-2xl text-sm text-(--text-muted)">Настройте общую логику первой страницы: стандартный обзор, режим фокуса или минимальный сценарий.</p>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {dashboardLayoutOptions.map((option) => {
          const isActive = settings.layout.dashboardLayout === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setDashboardLayout(option.value)}
              className={[
                'rounded-3xl border px-4 py-4 text-left transition-all duration-200',
                isActive
                  ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                  : 'border-(--border-soft) bg-(--panel-elevated) text-(--text-secondary)',
              ].join(' ')}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-2 text-sm text-(--text-muted)">{option.description}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}