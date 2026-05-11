import { Bell, CalendarDays, Database, Monitor, SlidersHorizontal, UserRound, Workflow } from 'lucide-react'
import { AccountSettings } from '../components/settings/AccountSettings'
import { AppearanceSettings } from '../components/settings/AppearanceSettings'
import { BehaviorSettings } from '../components/settings/BehaviorSettings'
import { CalendarSettings } from '../components/settings/CalendarSettings'
import { DataSettings } from '../components/settings/DataSettings'
import { DisplaySettings } from '../components/settings/DisplaySettings'
import { NotificationsSettings } from '../components/settings/NotificationsSettings'
import { ProfileSettings } from '../components/settings/ProfileSettings'
import { useAppSettings } from '../settings/useAppSettings'

export function SettingsPage() {
  const { settings } = useAppSettings()
  const sections = [
    { id: 'account', label: 'Аккаунт', icon: UserRound },
    { id: 'profile', label: 'Профиль', icon: UserRound },
    { id: 'appearance', label: 'Внешний вид', icon: Monitor },
    { id: 'display', label: 'Отображение', icon: SlidersHorizontal },
    { id: 'behavior', label: 'Поведение', icon: Workflow },
    { id: 'calendar-settings', label: 'Календарь', icon: CalendarDays },
    { id: 'notifications', label: 'Напоминания', icon: Bell },
    { id: 'data', label: 'Данные', icon: Database },
  ]

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-4 md:space-y-6">
      <header className="ui-panel p-4 sm:p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Настройки</p>
        <h1 className="mt-2 text-2xl font-semibold text-(--text-primary) md:text-3xl">Настройки приложения</h1>
        <p className="page-description mt-2 max-w-3xl text-sm text-(--text-muted) md:text-base">Управляйте профилем, внешним видом, отображением, поведением и данными приложения. Имя пользователя сейчас: {settings.profile.name}.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)] xl:gap-6">
        <aside className="ui-panel h-fit overflow-hidden p-3.5 xl:sticky xl:top-6">
          <p className="px-2 text-xs uppercase tracking-[0.22em] text-(--text-muted)">Разделы</p>
          <nav className="ui-filter-scroll mt-4 xl:grid xl:gap-2 xl:overflow-visible xl:px-0">
            {sections.map((section) => {
              const Icon = section.icon

              return (
                <a key={section.id} href={`#${section.id}`} className="flex min-h-10 shrink-0 items-center gap-3 rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-3.5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors duration-200 hover:border-(--accent-border) hover:bg-(--panel) hover:text-(--text-primary) xl:min-h-11 xl:w-full">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--accent-soft) text-(--accent)">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span>{section.label}</span>
                </a>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4 md:space-y-6">
          <AccountSettings />
          <ProfileSettings />
          <AppearanceSettings />
          <DisplaySettings />
          <BehaviorSettings />
          <CalendarSettings />
          <NotificationsSettings />
          <DataSettings />
        </div>
      </div>
    </section>
  )
}
