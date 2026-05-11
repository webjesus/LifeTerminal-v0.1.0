import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { QuickAddInput } from '../components/quick/QuickAddInput'
import { useAppSettings } from '../settings/useAppSettings'

export function MobileFab() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { settings } = useAppSettings()

  if (!settings.display.showFloatingActionButton || location.pathname === '/' || location.pathname === '/settings') {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-(--accent) text-3xl leading-none text-white shadow-[0_14px_26px_rgba(57,39,255,0.35)] md:hidden"
        aria-label="Быстрое добавление"
      >
        +
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Закрыть быстрое добавление"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/20"
          />

          <section className="absolute inset-x-0 bottom-0 max-h-[min(82vh,720px)] overflow-y-auto rounded-t-[28px] border border-(--border) bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5 shadow-[0_-20px_30px_rgba(11,16,32,0.14)]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
            <h3 className="text-lg font-semibold text-(--text-primary)">Быстрое добавление</h3>
            <p className="mt-1 text-sm text-(--text-muted)">Задача, заметка, идея, контекст проекта или напоминание.</p>
            <div className="mt-4">
              <QuickAddInput compact />
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
