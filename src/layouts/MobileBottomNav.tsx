import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SectionIcon } from '../components/navigation/SectionIcon'
import { mobileMainNavigation, mobileMoreNavigation } from '../data/navigation'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useAppSettings } from '../settings/useAppSettings'

export function MobileBottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const { settings } = useAppSettings()
  useLockBodyScroll(isMoreOpen)

  const closeMoreSheet = () => setIsMoreOpen(false)
  const visibleMainNavigation = useMemo(
    () => mobileMainNavigation.filter((item) => item.displayKey ? settings.display.visibleModules[item.displayKey] : true),
    [settings.display.visibleModules],
  )
  const visibleMoreNavigation = useMemo(
    () => mobileMoreNavigation.filter((item) => item.displayKey ? settings.display.visibleModules[item.displayKey] : true),
    [settings.display.visibleModules],
  )

  return (
    <>
      <nav className="ui-surface-floating fixed inset-x-0 bottom-0 z-40 border-t px-2.5 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {visibleMainNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => [
                'flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[11px] font-medium transition-colors',
                isActive ? 'bg-(--accent-soft) text-(--accent)' : 'text-(--text-muted)',
              ].join(' ')}
            >
              {({ isActive }) => (
                <>
                  <span className={[
                    'flex h-8 w-8 items-center justify-center rounded-2xl border transition-colors',
                    isActive ? 'border-(--accent-border) bg-(--panel) text-(--accent)' : 'border-(--border-soft) bg-(--panel-elevated)',
                  ].join(' ')}>
                    <SectionIcon section={item.section} size={20} />
                  </span>
                  <span className="max-w-full truncate text-[11px] leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[11px] font-medium text-(--text-muted)"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--panel-elevated)">
              <SectionIcon section="more" size={20} />
            </span>
            <span className="max-w-full truncate text-[11px] leading-none">Ещё</span>
          </button>
        </div>
      </nav>

      {isMoreOpen ? (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={closeMoreSheet}
            className="absolute inset-0 bg-(--overlay) backdrop-blur-sm"
          />

          <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-[28px] ui-shadow-floating">
            <section className="ui-surface-floating flex max-h-[85dvh] flex-col rounded-t-[28px] border text-(--text-primary)">
              <div className="shrink-0 px-5 pt-3 pb-4">
                <div className="mx-auto h-1.5 w-10 rounded-full bg-(--border)" />
                <h3 className="mt-3 text-lg font-semibold text-(--text-primary)">Ещё</h3>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(20px+env(safe-area-inset-bottom))] [touch-action:pan-y]">
                <div className="grid gap-2.5">
                {visibleMoreNavigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMoreSheet}
                    className="flex min-h-11 items-center gap-3 rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-3.5 py-2.5 text-sm text-(--text-secondary) transition-colors hover:border-(--accent-border) hover:bg-(--panel)"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--accent-soft) text-(--accent)">
                      <SectionIcon section={item.section} size={20} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  )
}
