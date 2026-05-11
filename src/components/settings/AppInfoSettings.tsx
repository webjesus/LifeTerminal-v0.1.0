import { ChevronDown } from 'lucide-react'
import { useAppSettings } from '../../settings/useAppSettings'

const licenseText = 'This application is currently provided as a personal productivity prototype. The software is intended for personal planning, task organization, habit tracking, goal management, notes, ideas, and project structuring. Commercial use, redistribution, or modification for resale is not permitted without explicit permission from the owner.'

const privacyText = 'Life Terminal currently stores user preferences locally in the browser using localStorage. No personal data is sent to external servers unless backend synchronization is added in future versions.'

const termsText = 'By using this application, the user understands that this is an early-stage productivity tool. The application is provided as-is, without guarantees of uninterrupted work, data recovery, or professional advice.'

export function AppInfoSettings() {
  const { settings } = useAppSettings()

  return (
    <section id="app-info" className="ui-panel p-5 md:p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Privacy / Legal / App Info</p>
      <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Информация о приложении</h2>
      <p className="mt-2 max-w-2xl text-sm text-(--text-muted)">Краткие сведения о версии, лицензии и статусе локального прототипа Life Terminal.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Application name</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{settings.appInfo.appName}</p>
        </div>
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Version</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{settings.appInfo.version}</p>
        </div>
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Build</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{settings.appInfo.build}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {[
          { title: 'License', body: licenseText },
          { title: 'Terms of use', body: termsText },
          { title: 'Privacy note', body: privacyText },
        ].map((item) => (
          <details key={item.title} className="rounded-3xl border border-(--border-soft) bg-(--panel-elevated) px-4 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-(--text-primary)">
              <span>{item.title}</span>
              <ChevronDown size={18} strokeWidth={2} className="text-(--text-muted)" />
            </summary>
            <p className="mt-3 text-sm leading-6 text-(--text-muted)">{item.body}</p>
          </details>
        ))}
      </div>
    </section>
  )
}