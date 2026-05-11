import { Check, Monitor } from 'lucide-react'
import { useState } from 'react'
import { useAppSettings } from '../../settings/useAppSettings'

type ToggleRowProps = {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
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
        <span
          className={[
            'inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-(--accent) shadow-[0_2px_8px_rgba(11,16,32,0.12)] transition-transform duration-200',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-1',
          ].join(' ')}
        >
          {checked ? <Check size={14} strokeWidth={2.5} /> : null}
        </span>
      </button>
    </div>
  )
}

export function AppearanceSettings() {
  const { settings, updateAppearance } = useAppSettings()
  const [status, setStatus] = useState<string | null>(null)

  function savePatch(patch: Parameters<typeof updateAppearance>[0]) {
    updateAppearance(patch)
    setStatus('Сохранено')
  }

  return (
    <section id="appearance" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="ui-settings-section-header">
        <span className="ui-settings-section-icon">
          <Monitor size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Внешний вид</p>
          <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Внешний вид</h2>
          <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">Тема, цветовые акценты и плотность интерфейса.</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="ui-settings-card space-y-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-(--text-primary)">Тема</p>
            <p className="mt-1 text-sm leading-5 text-(--text-muted)">Выберите светлую, тёмную или системную тему приложения.</p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { value: 'light', label: 'Светлая' },
              { value: 'dark', label: 'Тёмная' },
              { value: 'system', label: 'Системная' },
            ].map((option) => {
              const isActive = settings.appearance.theme === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => savePatch({ theme: option.value as 'light' | 'dark' | 'system' })}
                  className={[
                    'min-w-0 rounded-3xl border px-4 py-4 text-left transition-all duration-200',
                    isActive ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : 'border-(--border-soft) bg-white text-(--text-secondary)',
                  ].join(' ')}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="ui-settings-card space-y-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-(--text-primary)">Акцентный цвет</p>
            <p className="mt-1 text-sm leading-5 text-(--text-muted)">Цвет выделений, кнопок и активных состояний интерфейса.</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { value: 'violet', label: 'Фиолетовый', color: 'bg-violet-600' },
              { value: 'blue', label: 'Синий', color: 'bg-blue-600' },
              { value: 'purple', label: 'Пурпурный', color: 'bg-purple-600' },
              { value: 'indigo', label: 'Индиго', color: 'bg-indigo-600' },
            ].map((option) => {
              const isActive = settings.appearance.accentColor === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => savePatch({ accentColor: option.value as 'violet' | 'blue' | 'purple' | 'indigo' })}
                  className={[
                    'min-w-0 rounded-3xl border px-4 py-4 text-left transition-all duration-200',
                    isActive ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : 'border-(--border-soft) bg-white text-(--text-secondary)',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <span className={[ 'h-3.5 w-3.5 shrink-0 rounded-full', option.color ].join(' ')} />
                    <p className="text-sm font-semibold">{option.label}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="ui-settings-card space-y-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-(--text-primary)">Скругления</p>
            <p className="mt-1 text-sm leading-5 text-(--text-muted)">Настройте форму карточек, кнопок и панелей в приложении.</p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([
              { value: 'soft', label: 'Мягкие', description: 'Более собранный силуэт карточек.' },
              { value: 'medium', label: 'Средние', description: 'Сбалансированный вариант по умолчанию.' },
              { value: 'large', label: 'Крупные', description: 'Самый мягкий и воздушный стиль интерфейса.' },
            ] as const).map((option) => {
              const isActive = settings.appearance.roundedStyle === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => savePatch({ roundedStyle: option.value as 'soft' | 'medium' | 'large' })}
                  className={[
                    'min-w-0 rounded-3xl border px-4 py-4 text-left transition-all duration-200',
                    isActive
                      ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                      : 'border-(--border-soft) bg-white text-(--text-secondary)',
                  ].join(' ')}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="mt-1 text-sm text-(--text-muted)">{option.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <ToggleRow
            title="Компактный режим"
            description="Уменьшает отступы и делает рабочие карточки плотнее."
            checked={settings.appearance.compactMode}
            onChange={(checked) => savePatch({ compactMode: checked })}
          />
          <ToggleRow
            title="Анимации интерфейса"
            description="Плавные микроанимации и переходы по интерфейсу."
            checked={settings.appearance.animations}
            onChange={(checked) => savePatch({ animations: checked })}
          />
          <ToggleRow
            title="Мягкие тени"
            description="Мягкие тени для карточек, панелей и модальных окон."
            checked={settings.appearance.softShadows}
            onChange={(checked) => savePatch({ softShadows: checked })}
          />
          <ToggleRow
            title="Эффект стекла"
            description="Небольшая прозрачность и размытие для панелей и системных элементов интерфейса."
            checked={settings.appearance.glassEffect}
            onChange={(checked) => savePatch({ glassEffect: checked })}
          />
        </div>
      </div>

      {status ? <p className="mt-4 text-sm text-(--success-text)">{status}</p> : null}
    </section>
  )
}