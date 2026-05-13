import { NavLink } from 'react-router-dom'
import { LogoMark } from '../components/branding/LogoMark'
import { SectionIcon } from '../components/navigation/SectionIcon'
import { navigationItems } from '../data/navigation'
import { useAppSettings } from '../settings/useAppSettings'
import { cn } from '../utils/cn'

type SidebarProps = {
  compact?: boolean
}

export function Sidebar({ compact = false }: SidebarProps) {
  const { settings } = useAppSettings()
  const visibleNavigationItems = navigationItems.filter((item) => item.displayKey ? settings.display.visibleModules[item.displayKey] : true)

  return (
    <aside
      className={cn(
        'ui-surface-panel hidden border-r transition-[width] duration-200 ease-out md:sticky md:top-0 md:block md:h-dvh md:overflow-y-auto',
        compact ? 'md:w-20' : 'md:w-78',
      )}
    >
      <div className={cn(compact ? 'p-3' : 'p-4')}>
        <div className={cn('ui-panel mb-3 flex items-center justify-center', compact ? 'min-h-16 p-3' : 'min-h-22 p-3.5')}>
          <LogoMark showText={!compact} className={compact ? 'justify-center' : ''} iconClassName={compact ? 'h-8 w-8' : 'h-10 w-10'} />
        </div>

        <nav className="grid grid-cols-1 gap-2.5">
          {visibleNavigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={compact ? item.label : undefined}
              aria-label={compact ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-12 rounded-2xl border text-sm transition-all duration-200',
                  compact ? 'justify-center px-2.5 py-2.5' : 'items-center gap-3 px-3.5 py-2.5',
                  isActive
                    ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent) shadow-(--shadow-soft)'
                    : 'border-(--border-soft) bg-(--panel-elevated) text-(--text-secondary) hover:border-(--accent-border) hover:bg-(--panel) hover:text-(--text-primary)',
                )
              }
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--panel-elevated) text-(--text-muted) transition-colors group-hover:border-(--accent-border) group-hover:text-(--accent)">
                <SectionIcon section={item.section} />
              </span>
              <span className={cn('min-w-0 text-[0.95rem] font-medium leading-none', compact && 'hidden')}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
