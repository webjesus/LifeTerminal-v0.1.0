import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SectionIcon } from '../components/navigation/SectionIcon'
import { mobileMainNavigation, mobileMoreNavigation } from '../data/navigation'
import { useAppSettings } from '../settings/useAppSettings'

export function MobileBottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const { settings } = useAppSettings()
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
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border) bg-white/96 px-2.5 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_20px_rgba(11,16,32,0.06)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {visibleMainNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => [
                'flex min-h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[11px] font-medium transition-colors',
                isActive ? 'bg-(--accent-soft) text-(--accent)' : 'text-(--text-muted)',
              ].join(' ')}
            >
              {({ isActive }) => (
                <>
                  <span className={[
                    'flex h-8 w-8 items-center justify-center rounded-2xl border transition-colors',
                    isActive ? 'border-(--accent-border) bg-white text-(--accent)' : 'border-(--border-soft) bg-(--panel-elevated)',
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
            className="flex min-h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[11px] font-medium text-(--text-muted)"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--panel-elevated)">
              <SectionIcon section="more" size={20} />
            </span>
            <span className="max-w-full truncate text-[11px] leading-none">Ещё</span>
          </button>
        </div>
      </nav>

      {isMoreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setIsMoreOpen(false)}
            className="absolute inset-0 bg-black/25"
          />

          <section className="absolute inset-x-0 bottom-0 max-h-[min(80vh,680px)] overflow-y-auto rounded-t-[28px] border border-(--border) bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5 shadow-[0_-20px_30px_rgba(11,16,32,0.14)]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
            <h3 className="text-lg font-semibold text-(--text-primary)">Ещё</h3>
            <div className="mt-4 grid gap-2">
              {visibleMoreNavigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-2xl border border-(--border-soft) bg-white px-4 py-3 text-sm text-(--text-secondary)"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section={item.section} size={20} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
