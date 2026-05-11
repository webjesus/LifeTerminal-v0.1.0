import { Database, Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useAppSettings } from '../../settings/useAppSettings'
import type { AppSettings, DeepPartial } from '../../types/settings'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Экспорт ещё не выполнялся'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function DataSettings() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { settings, setSettings, importSettings, resetSettings } = useAppSettings()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleExport() {
    const exportedAt = new Date().toISOString()
    const nextSettings: AppSettings = {
      ...settings,
      data: {
        ...settings.data,
        lastBackupAt: exportedAt,
      },
    }

    setSettings(nextSettings)

    const blob = new Blob([JSON.stringify(nextSettings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'life-terminal-settings.json'
    link.click()
    URL.revokeObjectURL(url)
    setError(null)
    setFeedback('Настройки экспортированы')
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as DeepPartial<AppSettings>

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Некорректный формат')
      }

      importSettings(parsed)
      setError(null)
      setFeedback('Настройки импортированы')
    } catch {
      setFeedback(null)
      setError('Ошибка импорта')
    } finally {
      event.target.value = ''
    }
  }

  function handleReset() {
    const shouldReset = settings.behavior.askBeforeDelete
      ? window.confirm('Сбросить только настройки приложения к значениям по умолчанию?')
      : true

    if (!shouldReset) {
      return
    }

    resetSettings()
    setError(null)
    setFeedback('Настройки сброшены')
  }

  return (
    <section id="data" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="ui-settings-section-header">
        <span className="ui-settings-section-icon">
          <Database size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Данные</p>
          <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Экспорт, импорт и сброс</h2>
          <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">Только настройки приложения. Задачи, проекты, заметки и другие сущности не затрагиваются.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Имя приложения</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{settings.appInfo.appName}</p>
        </div>
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Версия</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{settings.appInfo.version}</p>
        </div>
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Последний экспорт</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{formatDateTime(settings.data.lastBackupAt)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button type="button" onClick={handleExport} className="ui-button inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5 sm:w-auto">
          <Download size={18} strokeWidth={2} />
          Экспортировать настройки
        </button>
        <input ref={inputRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} className="ui-button inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5 sm:w-auto">
          <Upload size={18} strokeWidth={2} />
          Импортировать файл
        </button>
        <div className="mt-1 border-t border-(--border) pt-3">
          <button type="button" onClick={handleReset} className="ui-button-danger inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5">
          <RotateCcw size={18} strokeWidth={2} />
          Сбросить настройки
          </button>
        </div>
      </div>

      {feedback ? <p className="mt-4 text-sm text-(--success-text)">{feedback}</p> : null}
      {error ? <p className="mt-2 text-sm text-(--danger-text)">{error}</p> : null}
    </section>
  )
}