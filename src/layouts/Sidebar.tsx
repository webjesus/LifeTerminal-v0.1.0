import { NavLink } from 'react-router-dom'
import { LogoMark } from '../components/branding/LogoMark'
import { SectionIcon } from '../components/navigation/SectionIcon'
import { navigationItems } from '../data/navigation'
import { useAppSettings } from '../settings/useAppSettings'
import { cn } from '../utils/cn'

export function Sidebar() {
  const { settings } = useAppSettings()
  const visibleNavigationItems = navigationItems.filter((item) => item.displayKey ? settings.display.visibleModules[item.displayKey] : true)

  return (
    <aside className="hidden border-r border-(--border) bg-(--panel) md:sticky md:top-0 md:block md:h-dvh md:w-78 md:overflow-y-auto">
      <div className="p-4">
        <div className="ui-panel mb-3 flex min-h-22 items-center justify-center p-3.5">
          <LogoMark />
        </div>

        <nav className="grid grid-cols-1 gap-2.5">
          {visibleNavigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition-all duration-200',
                  isActive
                    ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent) shadow-[var(--shadow-panel-elevated)]'
                    : 'border-(--border-soft) bg-(--panel-elevated) text-(--text-secondary) hover:border-(--accent-border) hover:bg-(--panel) hover:text-(--text-primary)',
                )
              }
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--panel-elevated) text-(--text-muted) transition-colors group-hover:border-(--accent-border) group-hover:text-(--accent)">
                <SectionIcon section={item.section} />
              </span>
              <span className="min-w-0 text-[0.95rem] font-medium leading-none">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
