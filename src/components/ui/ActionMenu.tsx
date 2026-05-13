import { MoreHorizontal } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'

const ACTION_MENU_OPEN_EVENT = 'lifeos:action-menu-open'

type ActionMenuTone = 'default' | 'accent' | 'warning' | 'danger'

export type ActionMenuItem = {
  label: string
  onSelect: () => void
  tone?: ActionMenuTone
  disabled?: boolean
  title?: string
}

type ActionMenuProps = {
  items: ActionMenuItem[]
  buttonLabel?: string
  triggerClassName?: string
  contentClassName?: string
  align?: 'left' | 'right'
  closeOnChangeKey?: string | number | null
}

type MenuPosition = {
  top: number
  left?: number
  right?: number
}

function getToneClassName(tone: ActionMenuTone = 'default') {
  switch (tone) {
    case 'accent':
      return 'text-(--accent) hover:bg-(--accent-soft)'
    case 'warning':
      return 'text-(--warning-text) hover:bg-(--warning-bg)'
    case 'danger':
      return 'text-(--danger-text) hover:bg-(--danger-bg)'
    case 'default':
    default:
      return 'text-(--text-secondary) hover:bg-(--panel-elevated) hover:text-(--text-primary)'
  }
}

export function ActionMenu({
  items,
  buttonLabel = 'Открыть меню действий',
  triggerClassName,
  contentClassName,
  align = 'right',
  closeOnChangeKey,
}: ActionMenuProps) {
  const location = useLocation()
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const resolvedItems = useMemo(() => items.filter(Boolean), [items])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function updatePosition() {
      const trigger = triggerRef.current

      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const estimatedMenuHeight = 16 + resolvedItems.length * 40
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow < estimatedMenuHeight
        ? Math.max(12, rect.top - estimatedMenuHeight - 8)
        : Math.min(window.innerHeight - 12, rect.bottom + 8)

      setPosition(
        align === 'right'
          ? {
              top,
              right: Math.max(12, window.innerWidth - rect.right),
            }
          : {
              top,
              left: Math.max(12, rect.left),
            },
      )
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [align, isOpen, resolvedItems.length])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null

      if (!target) {
        return
      }

      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) {
        return
      }

      setIsOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    function handleOtherMenuOpen(event: Event) {
      const customEvent = event as CustomEvent<{ id: string }>

      if (customEvent.detail?.id !== menuId) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener(ACTION_MENU_OPEN_EVENT, handleOtherMenuOpen)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener(ACTION_MENU_OPEN_EVENT, handleOtherMenuOpen)
    }
  }, [isOpen, menuId])

  useEffect(() => {
    setIsOpen(false)
    setPosition(null)
  }, [closeOnChangeKey, location.pathname])

  function toggleMenu(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    setIsOpen((current) => {
      const next = !current

      if (next) {
        window.dispatchEvent(new CustomEvent(ACTION_MENU_OPEN_EVENT, { detail: { id: menuId } }))
      }

      return next
    })
  }

  return (
    <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={buttonLabel}
        aria-expanded={isOpen}
        onClick={toggleMenu}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-2xl border border-(--border-soft) bg-transparent text-(--text-muted) transition hover:border-(--accent-border) hover:bg-(--panel) hover:text-(--accent)',
          triggerClassName,
        )}
      >
        <MoreHorizontal size={16} strokeWidth={2} />
      </button>

      {isOpen && position ? createPortal(
        <div
          ref={contentRef}
          style={position}
          className={cn(
            'fixed z-[70] min-w-44 rounded-2xl border border-(--border) bg-(--panel) p-2 shadow-(--shadow-floating)',
            contentClassName,
          )}
        >
          {resolvedItems.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              title={item.title}
              onClick={(event) => {
                event.stopPropagation()
                setIsOpen(false)

                if (!item.disabled) {
                  item.onSelect()
                }
              }}
              className={cn(
                'flex w-full rounded-xl px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60',
                getToneClassName(item.tone),
              )}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </div>
  )
}