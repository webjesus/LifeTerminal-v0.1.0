import { X } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

type ModalProps = {
  title: string
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'center' | 'side'
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-lg',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
}

export function Modal({ title, children, isOpen, onClose, footer, size = 'md', variant = 'center' }: ModalProps) {
  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex items-end bg-(--overlay) p-0',
        variant === 'side' ? 'justify-center sm:items-stretch sm:justify-end sm:p-0' : 'justify-center sm:items-center sm:p-4',
      ].join(' ')}
    >
      <button
        type="button"
        aria-label="Закрыть модальное окно"
        onClick={onClose}
        className="absolute inset-0 bg-(--overlay) backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={[
          'relative w-full max-w-full rounded-t-[28px] ui-shadow-floating',
          sizeClasses[size],
          variant === 'side' ? 'sm:h-full sm:max-h-full sm:max-w-[42rem] sm:rounded-none sm:rounded-l-[28px]' : 'sm:rounded-3xl',
        ].join(' ')}
      >
        <div
          className={[
            'ui-surface-floating flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] border',
            variant === 'side' ? 'sm:h-full sm:max-h-full sm:rounded-none sm:rounded-l-[28px]' : 'sm:max-h-[90vh] sm:rounded-3xl',
          ].join(' ')}
        >
          <div className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-(--border) sm:hidden" />
          <div className="ui-surface-elevated sticky top-0 z-20 flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Форма</p>
              <h3 className="mt-1 text-lg font-semibold text-(--text-primary)">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel) text-(--text-secondary) transition-all duration-200 hover:border-(--accent-border) hover:text-(--text-primary)"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">{children}</div>

          {footer ? <div className="ui-surface-elevated sticky bottom-0 z-20 shrink-0 border-t px-4 py-4 sm:px-5">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}

