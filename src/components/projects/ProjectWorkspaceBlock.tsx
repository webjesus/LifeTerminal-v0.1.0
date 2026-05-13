import { CheckSquare, FileText, GripVertical, ImageIcon, Lightbulb, Link2, MessageCircle, NotebookText, Pencil, Target, Type } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { ProjectWorkspaceBlock } from '../../types'
import { cn } from '../../utils/cn'

interface ProjectWorkspaceBlockProps {
  block: ProjectWorkspaceBlock
  sectionTitle?: string | null
  selected?: boolean
  dragging?: boolean
  resizing?: boolean
  relationSummary?: {
    total: number
    items: Array<{
      typeLabel: string
      count: number
    }>
  }
  mobileRelations?: Array<{
    id: string
    typeLabel: string
    directionLabel: string
    otherTitle: string
  }>
  disableViewportPan?: boolean
  showCanvasHandles?: boolean
  onSelect?: (blockId: string) => void
  onEdit?: (blockId: string) => void
  mode?: 'canvas' | 'list'
  onDragStart?: (blockId: string, event: ReactPointerEvent<HTMLElement>) => void
  onDragMove?: (blockId: string, event: ReactPointerEvent<HTMLElement>) => void
  onDragEnd?: (blockId: string, event: ReactPointerEvent<HTMLElement>) => void
  onResizeStart?: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void
  onResizeMove?: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void
  onResizeEnd?: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void
}

const TYPE_LABELS: Record<ProjectWorkspaceBlock['type'], string> = {
  text: 'Текст',
  task: 'Задача',
  note: 'Заметка',
  idea: 'Идея',
  goal: 'Цель',
  file: 'Файл',
  image: 'Фото',
  link: 'Ссылка',
  comment: 'Комментарий',
  drawing: 'Схема',
}

const LINKED_LABELS: Record<Exclude<ProjectWorkspaceBlock['linkedItemType'], undefined>, string> = {
  task: 'Связано с задачей',
  note: 'Связано с заметкой',
  idea: 'Связано с идеей',
  goal: 'Связано с целью',
  file: 'Связано с файлом',
}

const TYPE_ICONS: Record<ProjectWorkspaceBlock['type'], typeof Type> = {
  text: Type,
  task: CheckSquare,
  note: NotebookText,
  idea: Lightbulb,
  goal: Target,
  file: FileText,
  image: ImageIcon,
  link: Link2,
  comment: MessageCircle,
  drawing: FileText,
}

export function ProjectWorkspaceBlock({
  block,
  sectionTitle,
  selected,
  dragging,
  resizing,
  relationSummary,
  mobileRelations = [],
  disableViewportPan = false,
  showCanvasHandles = true,
  onSelect,
  onEdit,
  mode = 'list',
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: ProjectWorkspaceBlockProps) {
  const isCanvas = mode === 'canvas' && typeof block.x === 'number' && typeof block.y === 'number'
  const imageSrc = block.imageUrl || block.previewUrl || block.dataUrl || ''
  const hasImagePreview = Boolean(imageSrc)
  const isImageBlock = (block.type === 'image' || (block.type === 'file' && hasImagePreview)) && hasImagePreview
  const isVisualTemplate = Boolean(block.visualVariant)
  const previewText = block.description || block.content || ''
  const hasPendingMvpState = (block.type === 'drawing' || block.type === 'comment') && !isVisualTemplate
  const resolvedWidth = Math.min(720, Math.max(220, block.width ?? (isImageBlock ? 320 : 280)))
  const resolvedHeight = Math.min(640, Math.max(180, block.height ?? (isImageBlock ? 280 : 170)))
  const TypeIcon = TYPE_ICONS[block.type]
  const canShowCanvasHandles = mode === 'canvas' && showCanvasHandles

  function formatBytes(size?: number) {
    if (!size || size <= 0) {
      return null
    }

    if (size < 1024) {
      return `${size} Б`
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} КБ`
    }

    return `${(size / (1024 * 1024)).toFixed(2)} МБ`
  }

  const fileSizeLabel = formatBytes(block.fileSize)

  return (
    <div
      className={cn(
        'min-w-0 max-w-full rounded-2xl ui-shadow-soft transition',
        mode === 'list' && 'cursor-pointer',
        isCanvas && 'absolute touch-none',
        (dragging || resizing) && 'cursor-grabbing',
        selected && 'shadow-(--shadow-floating)',
      )}
      style={{
        ...(isCanvas
          ? {
              left: Math.max(24, block.x ?? 24),
              top: Math.max(24, block.y ?? 24),
              width: resolvedWidth,
              minWidth: isImageBlock ? 220 : 260,
              maxWidth: isImageBlock ? 720 : 360,
              height: isImageBlock ? resolvedHeight : block.height || 'auto',
              position: 'absolute' as const,
              zIndex: dragging || resizing ? 30 : selected ? 20 : 10,
            }
          : {
              width: '100%',
            }),
      }}
      data-no-pan={disableViewportPan ? 'true' : undefined}
      tabIndex={0}
      onClick={() => onSelect?.(block.id)}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-[inherit] border border-[var(--workspace-block-border)] bg-[var(--workspace-block-bg)]',
          isImageBlock ? 'h-full p-0' : 'p-3',
          selected && 'border-(--accent-border) bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--workspace-block-bg))]',
        )}
      >
        {selected ? <div className="pointer-events-none absolute inset-y-4 left-0 z-10 w-1 rounded-r-full bg-(--accent)" /> : null}

        {isImageBlock ? (
        <>
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-(--border-soft) bg-(--panel) px-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-(--text-secondary)">{block.type === 'file' ? 'Файл / фото' : 'Фото'}</span>
                  {block.linkedItemType ? <span className="rounded-full border border-(--accent-border) bg-(--accent-soft) px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-(--accent)">{LINKED_LABELS[block.linkedItemType]}</span> : null}
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-(--text-primary)">{block.title}</p>
                {block.fileName ? <p className="mt-1 truncate text-xs text-(--text-muted)">{block.fileName}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {canShowCanvasHandles ? (
                  <button
                    type="button"
                    data-no-pan="true"
                    aria-label="Переместить блок"
                    onPointerDown={(event) => onDragStart?.(block.id, event)}
                    onPointerMove={(event) => onDragMove?.(block.id, event)}
                    onPointerUp={(event) => onDragEnd?.(block.id, event)}
                    onPointerCancel={(event) => onDragEnd?.(block.id, event)}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel-elevated) text-(--text-muted) touch-none',
                      dragging ? 'cursor-grabbing' : 'cursor-grab',
                    )}
                  >
                    <GripVertical size={16} />
                  </button>
                ) : null}
                {canShowCanvasHandles ? (
                  <button
                    type="button"
                    data-no-pan="true"
                    aria-label="Редактировать блок"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit?.(block.id)
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel-elevated) text-(--text-muted) transition hover:border-(--accent-border) hover:text-(--accent)"
                  >
                    <Pencil size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 bg-(--panel-elevated) p-3">
              <div
                className="relative flex h-full min-h-[180px] items-center justify-center overflow-hidden rounded-2xl border border-(--border-soft) bg-(--panel)"
                style={{
                  backgroundImage: 'linear-gradient(45deg, color-mix(in srgb, var(--border-soft) 72%, transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb, var(--border-soft) 72%, transparent) 75%), linear-gradient(45deg, color-mix(in srgb, var(--border-soft) 72%, transparent) 25%, transparent 25%, transparent 75%, color-mix(in srgb, var(--border-soft) 72%, transparent) 75%)',
                  backgroundPosition: '0 0, 10px 10px',
                  backgroundSize: '20px 20px',
                }}
              >
                <img src={imageSrc} alt={block.title} className="max-h-full max-w-full object-contain" />
              </div>
            </div>

            <div className="border-t border-(--border-soft) bg-(--panel) px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {sectionTitle ? <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-(--text-secondary)">{sectionTitle}</span> : null}
                    {fileSizeLabel ? <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-(--text-secondary)">{fileSizeLabel}</span> : null}
                    {relationSummary?.total ? <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-(--text-secondary)">Связи: {relationSummary.total}</span> : null}
                  </div>
                  {block.tags?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {block.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2 py-0.5 text-xs text-(--text-muted)">#{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    data-no-pan="true"
                    onClick={(event) => {
                      event.stopPropagation()
                      window.open(imageSrc, '_blank', 'noopener,noreferrer')
                    }}
                    className="ui-button px-3 py-2 text-xs"
                  >
                    Открыть
                  </button>
                </div>
              </div>
            </div>
          </div>
          {canShowCanvasHandles ? (
            <button
              type="button"
              data-no-pan="true"
              aria-label="Изменить размер блока"
              onPointerDown={(event) => onResizeStart?.(block.id, event)}
              onPointerMove={(event) => onResizeMove?.(block.id, event)}
              onPointerUp={(event) => onResizeEnd?.(block.id, event)}
              onPointerCancel={(event) => onResizeEnd?.(block.id, event)}
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-(--border-soft) bg-(--panel) text-(--text-muted) opacity-85 shadow-(--shadow-soft) transition hover:opacity-100 touch-none cursor-nwse-resize"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M5 11L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8.5 11H11V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </>
      ) : isCanvas && isVisualTemplate ? (
        <>
          <div
            className={cn(
              'absolute inset-0 overflow-hidden rounded-[inherit] border transition',
              block.visualVariant === 'template-header' && 'border-(--accent-border) bg-linear-to-br from-(--accent-soft) via-(--panel-elevated) to-(--panel)',
              block.visualVariant === 'template-node' && 'border-(--border-soft) bg-linear-to-br from-(--panel-elevated) via-(--panel) to-(--panel-elevated)',
              block.visualVariant === 'template-panel' && 'border-(--border) bg-linear-to-br from-(--panel-elevated) via-(--panel) to-(--panel)',
              block.visualVariant === 'template-step' && 'border-(--border-soft) bg-linear-to-r from-(--panel-elevated) via-(--panel) to-(--panel-elevated)',
              selected && 'border-(--accent-border)',
            )}
          >
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 14%, transparent), transparent 45%)' }} />
            <div className="absolute inset-x-4 top-4 h-px bg-linear-to-r from-transparent via-(--border) to-transparent opacity-60" />
            <div className="absolute inset-x-4 bottom-4 h-px bg-linear-to-r from-transparent via-(--border-soft) to-transparent opacity-50" />
          </div>
          <div className="relative flex h-full flex-col justify-between p-3">
            <div className="flex justify-end gap-2">
              {canShowCanvasHandles ? (
                <>
                  <button
                    type="button"
                    data-no-pan="true"
                    aria-label="Переместить блок"
                    onPointerDown={(event) => onDragStart?.(block.id, event)}
                    onPointerMove={(event) => onDragMove?.(block.id, event)}
                    onPointerUp={(event) => onDragEnd?.(block.id, event)}
                    onPointerCancel={(event) => onDragEnd?.(block.id, event)}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel) text-(--text-muted) touch-none backdrop-blur-sm',
                      dragging ? 'cursor-grabbing' : 'cursor-grab',
                    )}
                  >
                    <GripVertical size={16} />
                  </button>
                  <button
                    type="button"
                    data-no-pan="true"
                    aria-label="Редактировать блок"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit?.(block.id)
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel) text-(--text-muted) transition hover:border-(--accent-border) hover:text-(--accent)"
                  >
                    <Pencil size={14} />
                  </button>
                </>
              ) : null}
            </div>
            <div className="flex justify-end">
              <div className="h-2.5 w-14 rounded-full bg-linear-to-r from-(--border-soft) via-(--border) to-(--border-soft) opacity-70" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-semibold text-(--text-primary)">
                {block.icon ? <span className="text-lg">{block.icon}</span> : <TypeIcon size={16} className="shrink-0 text-(--text-secondary)" />}
                <span className="truncate">{block.title}</span>
              </div>
            </div>
            {canShowCanvasHandles ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-no-pan="true"
                  aria-label="Переместить блок"
                  onPointerDown={(event) => onDragStart?.(block.id, event)}
                  onPointerMove={(event) => onDragMove?.(block.id, event)}
                  onPointerUp={(event) => onDragEnd?.(block.id, event)}
                  onPointerCancel={(event) => onDragEnd?.(block.id, event)}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel) text-(--text-muted) touch-none',
                    dragging ? 'cursor-grabbing' : 'cursor-grab',
                  )}
                >
                  <GripVertical size={16} />
                </button>
                {canShowCanvasHandles ? (
                  <button
                    type="button"
                    data-no-pan="true"
                    aria-label="Редактировать блок"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit?.(block.id)
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel) text-(--text-muted) transition hover:border-(--accent-border) hover:text-(--accent)"
                  >
                    <Pencil size={14} />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-(--text-muted)">
            <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2.5 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">{TYPE_LABELS[block.type]}</span>
            {!isVisualTemplate && block.linkedItemType ? (
              <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">
                {LINKED_LABELS[block.linkedItemType]}
              </span>
            ) : null}
            {!block.linkedItemType && sectionTitle ? (
              <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">
                Раздел: {sectionTitle}
              </span>
            ) : null}
            {isVisualTemplate ? <span className="rounded-full border border-(--accent-border) bg-(--accent-soft) px-2.5 py-0.5 text-[10px] tracking-[0.12em] text-(--accent)">Шаблон</span> : null}
          </div>
          {(block.type === 'text' || block.type === 'task' || block.type === 'note' || block.type === 'idea' || block.type === 'goal' || block.type === 'comment') && previewText ? (
            <div className="mb-1 line-clamp-3 wrap-break-word text-sm text-(--text-secondary)">{previewText}</div>
          ) : null}
          {block.type === 'image' && hasImagePreview ? <img src={imageSrc} alt={block.title} className="mb-2 h-48 w-full rounded-lg object-contain" /> : null}
          {block.type === 'file' ? (
            <div className="mb-2 rounded-lg border border-(--border-soft) bg-(--panel) p-3">
              <p className="truncate text-sm font-medium text-(--text-primary)">{block.fileName || block.title}</p>
              <p className="mt-1 text-xs text-(--text-secondary)">{block.fileType || 'Тип файла не указан'}</p>
              {typeof block.fileSize === 'number' ? <p className="mt-1 text-xs text-(--text-muted)">{block.fileSize < 1024 ? `${block.fileSize} Б` : `${(block.fileSize / 1024).toFixed(1)} КБ`}</p> : null}
            </div>
          ) : null}
          {block.type === 'link' && block.externalUrl ? (
            <div className="mb-2 rounded-lg border border-(--border-soft) bg-(--panel) p-3">
              <div className="truncate text-sm text-(--accent)">{block.externalUrl}</div>
              <button
                type="button"
                data-no-pan="true"
                onClick={(event) => {
                  event.stopPropagation()
                  window.open(block.externalUrl, '_blank', 'noopener,noreferrer')
                }}
                className="ui-button mt-3 px-3 py-2 text-xs"
              >
                Открыть ссылку
              </button>
            </div>
          ) : null}
          {hasPendingMvpState ? (
            <div className="mb-2 rounded-lg border border-dashed border-(--border) bg-(--panel) px-3 py-6 text-center text-sm text-(--text-muted)">
              {block.type === 'drawing' ? 'Режим схемы появится позже. Пока можно использовать текстовый блок.' : 'Комментарий пока работает как простой текстовый блок.'}
            </div>
          ) : null}
          {mode === 'list' && block.tags?.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {block.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-xs text-(--text-muted)">#{tag}</span>
              ))}
            </div>
          ) : null}
          {mode === 'list' && mobileRelations.length > 0 ? <p className="mt-3 text-xs text-(--text-muted)">Связи и детали доступны в инспекторе.</p> : null}
        </>
      )}
      </div>
    </div>
  )
}
