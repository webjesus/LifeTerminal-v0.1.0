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
    <aside className="hidden w-78 border-r border-(--border) bg-white/85 p-5 md:block md:h-screen">
      <div className="ui-panel mb-4 flex min-h-24 items-center justify-center p-4">
        <LogoMark />
      </div>

      <nav className="grid grid-cols-1 gap-2">
        {visibleNavigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'group flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-200',
                isActive
                  ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                  : 'border-(--border) bg-white text-[#475467] hover:border-(--accent-border) hover:text-(--text-primary)',
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
    </aside>
  )
}
