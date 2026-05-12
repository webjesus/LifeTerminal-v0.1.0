import { CheckSquare, FileText, GripVertical, ImageIcon, Lightbulb, Link2, MessageCircle, NotebookText, Target, Type } from 'lucide-react'
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
  onSelect?: (blockId: string) => void
  onEdit?: (blockId: string) => void
  mode?: 'canvas' | 'list'
  onDragStart?: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void
  onDragMove?: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void
  onDragEnd?: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void
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
  const hasImagePreview = Boolean(block.imageUrl || block.previewUrl || block.dataUrl)
  const isImageCanvas = isCanvas && block.type === 'image' && hasImagePreview
  const previewText = block.description || block.content || ''
  const hasPendingMvpState = block.type === 'drawing' || block.type === 'comment'
  const resolvedWidth = Math.min(360, Math.max(260, block.width ?? 280))
  const TypeIcon = TYPE_ICONS[block.type]

  return (
    <div
      className={cn(
        'min-w-0 max-w-full overflow-hidden rounded-2xl border border-(--border) bg-(--panel-elevated) shadow-(--shadow-soft) transition',
        isImageCanvas ? 'p-0' : 'p-3',
        mode === 'list' && 'cursor-pointer',
        isCanvas && 'absolute touch-none',
        selected && 'border-(--accent-border) bg-(--accent-soft)',
        (dragging || resizing) && 'cursor-grabbing',
      )}
      style={{
        ...(isCanvas
          ? {
              left: Math.max(24, block.x ?? 24),
              top: Math.max(24, block.y ?? 24),
              width: resolvedWidth,
              minWidth: 260,
              maxWidth: 360,
              height: isImageCanvas ? Math.max(180, block.height ?? 240) : block.height || 'auto',
              position: 'absolute' as const,
              zIndex: dragging || resizing ? 30 : selected ? 20 : 10,
            }
          : {
              width: '100%',
            }),
      }}
      tabIndex={0}
      onClick={() => onSelect?.(block.id)}
      onDoubleClick={() => onEdit?.(block.id)}
    >
      {isImageCanvas ? (
        <>
          <div className="absolute inset-0 bg-(--panel)">
            <img src={block.imageUrl || block.previewUrl || block.dataUrl} alt={block.title} className="h-full w-full object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[rgba(11,16,32,0.58)] to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-[rgba(11,16,32,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/90">Фото</span>
                  {block.linkedItemType ? <span className="rounded-full border border-white/20 bg-[rgba(11,16,32,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/90">{LINKED_LABELS[block.linkedItemType]}</span> : null}
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-white">{block.title}</p>
              </div>
              <button
                type="button"
                aria-label="Переместить блок"
                onPointerDown={(event) => onDragStart?.(block.id, event)}
                onPointerMove={(event) => onDragMove?.(block.id, event)}
                onPointerUp={(event) => onDragEnd?.(block.id, event)}
                onPointerCancel={(event) => onDragEnd?.(block.id, event)}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[rgba(11,16,32,0.42)] text-white touch-none',
                  dragging ? 'cursor-grabbing' : 'cursor-grab',
                )}
              >
                <GripVertical size={16} />
              </button>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="flex min-w-0 flex-wrap gap-2">
                {sectionTitle ? <span className="rounded-full border border-white/20 bg-[rgba(11,16,32,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/90">{sectionTitle}</span> : null}
                {relationSummary?.total ? <span className="rounded-full border border-white/20 bg-[rgba(11,16,32,0.42)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/90">Связи: {relationSummary.total}</span> : null}
              </div>
              <button
                type="button"
                aria-label="Изменить размер блока"
                onPointerDown={(event) => onResizeStart?.(block.id, event)}
                onPointerMove={(event) => onResizeMove?.(block.id, event)}
                onPointerUp={(event) => onResizeEnd?.(block.id, event)}
                onPointerCancel={(event) => onResizeEnd?.(block.id, event)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[rgba(11,16,32,0.42)] text-white touch-none cursor-se-resize"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M5 11L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8.5 11H11V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
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
            {mode === 'canvas' ? (
              <button
                type="button"
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
            ) : null}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-(--text-muted)">
            <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2.5 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">{TYPE_LABELS[block.type]}</span>
            {block.linkedItemType ? (
              <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">
                {LINKED_LABELS[block.linkedItemType]}
              </span>
            ) : null}
            {sectionTitle ? (
              <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">
                Раздел: {sectionTitle}
              </span>
            ) : null}
            {relationSummary?.total ? (
              mode === 'list' ? (
                <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">
                  Связи: {relationSummary.total}
                </span>
              ) : (
                relationSummary.items.slice(0, 2).map((item) => (
                  <span key={item.typeLabel} className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-[10px] tracking-[0.12em] text-(--text-secondary)">
                    {item.typeLabel}: {item.count}
                  </span>
                ))
              )
            ) : null}
          </div>
          {block.type === 'task' ? <p className="mb-1 text-xs text-(--text-secondary)">Задача проекта{block.linkedItemType === 'task' ? ' синхронизирована с глобальной задачей' : ''}</p> : null}
          {block.type === 'note' ? <p className="mb-1 text-xs text-(--text-secondary)">Короткий preview заметки</p> : null}
          {block.type === 'idea' ? <p className="mb-1 text-xs text-(--text-secondary)">Идея или гипотеза проекта</p> : null}
          {(block.type === 'text' || block.type === 'task' || block.type === 'note' || block.type === 'idea' || block.type === 'goal' || block.type === 'comment') && previewText ? (
            <div className="mb-1 line-clamp-4 wrap-break-word text-sm text-(--text-secondary)">{previewText}</div>
          ) : null}
          {block.type === 'image' && (block.imageUrl || block.previewUrl || block.dataUrl) ? <img src={block.imageUrl || block.previewUrl || block.dataUrl} alt={block.title} className="mb-2 h-40 w-full rounded-lg object-cover" /> : null}
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
          {block.tags?.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {block.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-(--border-soft) bg-(--panel) px-2 py-0.5 text-xs text-(--text-muted)">#{tag}</span>
              ))}
            </div>
          ) : null}
          {mode === 'list' && mobileRelations.length > 0 ? (
            <div className="mt-3 rounded-xl border border-(--border-soft) bg-(--panel) p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Связи</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {mobileRelations.map((relation) => (
                  <span key={relation.id} className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-xs text-(--text-secondary)">
                    {relation.directionLabel}: {relation.typeLabel} · {relation.otherTitle}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
