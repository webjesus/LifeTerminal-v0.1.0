import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { SectionIcon } from '../components/navigation/SectionIcon'
import { useCurrentPageTitle } from '../hooks/useCurrentPageTitle'

export function Topbar() {
  const currentPage = useCurrentPageTitle()
  const shouldShowSettingsAction = currentPage.section !== 'settings'

  return (
    <header className="sticky top-0 z-20 border-b border-(--border) bg-[color-mix(in_oklab,var(--panel)_96%,transparent)] px-4 py-2.5 md:px-7 md:py-4">
      <div className="flex min-h-11 items-center justify-between gap-3 md:min-h-12">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-(--accent-border) bg-(--accent-soft) text-(--accent) md:h-10 md:w-10">
              <SectionIcon section={currentPage.section} size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-(--text-primary) md:text-xl">{currentPage.label}</h2>
            </div>
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {shouldShowSettingsAction ? (
            <Link
              to="/settings"
              aria-label="Открыть настройки"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-(--border) bg-(--panel-elevated) text-(--text-muted) transition-colors duration-200 hover:border-(--accent-border) hover:bg-(--accent-soft) hover:text-(--accent)"
            >
              <Settings size={20} strokeWidth={2} />
            </Link>
          ) : <span className="h-11 w-11" aria-hidden="true" />}
        </div>
      </div>
    </header>
  )
}
