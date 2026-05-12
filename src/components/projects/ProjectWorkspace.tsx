import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Project, ProjectSection, ProjectWorkspaceBlock, ProjectWorkspaceRelation } from '../../types'
import { cn } from '../../utils/cn'
import { ProjectWorkspaceBlock as WorkspaceCard } from './ProjectWorkspaceBlock'
import { projectWorkspaceRelationLabels } from './projectMeta'

type ProjectWorkspaceProps = {
  project: Project
  sections: ProjectSection[]
  workspaceBlocks: ProjectWorkspaceBlock[]
  activeSectionFilter: string
  selectedBlockId?: string | null
  selectedRelationId?: string | null
  activeTool?: string
  relationSourceBlockId?: string | null
  relationNotice?: string | null
  onSelectBlock?: (blockId: string | null) => void
  onSelectSectionFilter?: (sectionId: string) => void
  onCreateBlock?: (type: ProjectWorkspaceBlock['type']) => void
  onOpenAddElement?: () => void
  onUpdateBlock?: (blockId: string, updates: Partial<ProjectWorkspaceBlock>) => void
  onArrangeBlocks?: (positions: Array<{ id: string; x: number; y: number }>) => void
  workspaceRelations?: ProjectWorkspaceRelation[]
}

const DEFAULT_BLOCK_WIDTH = 280
const MIN_BLOCK_WIDTH = 260
const MAX_BLOCK_WIDTH = 360
const GRID_CARD_WIDTH = 300
const GRID_CARD_HEIGHT = 160
const GRID_GAP = 24
const GRID_PADDING = 24

const EMPTY_STATE_ACTIONS: Array<{ type: ProjectWorkspaceBlock['type']; label: string }> = [
  { type: 'text', label: 'Добавить текст' },
  { type: 'task', label: 'Добавить задачу' },
  { type: 'idea', label: 'Добавить идею' },
  { type: 'note', label: 'Добавить заметку' },
  { type: 'file', label: 'Добавить файл' },
]

export function ProjectWorkspace({
  project,
  sections,
  workspaceBlocks,
  activeSectionFilter,
  selectedBlockId,
  selectedRelationId,
  activeTool,
  relationSourceBlockId,
  relationNotice,
  onSelectBlock,
  onSelectSectionFilter,
  onCreateBlock,
  onOpenAddElement,
  onUpdateBlock,
  onArrangeBlocks,
  workspaceRelations = [],
}: ProjectWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const blocks = useMemo(
    () => workspaceBlocks.filter((block) => block.projectId === project.id),
    [project.id, workspaceBlocks],
  )
  const sectionTitleMap = useMemo(() => new Map(sections.map((section) => [section.id, section.title])), [sections])

  const [isMobile, setIsMobile] = useState(false)
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null)
  const [temporaryPositions, setTemporaryPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [temporarySizes, setTemporarySizes] = useState<Record<string, { width: number; height: number }>>({})
  const [dragState, setDragState] = useState<{
    blockId: string
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [resizeState, setResizeState] = useState<{
    blockId: string
    pointerId: number
    startX: number
    startY: number
    originWidth: number
    originHeight: number
  } | null>(null)

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 1024)
    updateViewport()
    window.addEventListener('resize', updateViewport)

    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    setTemporaryPositions((currentPositions) => {
      const validIds = new Set(blocks.map((block) => block.id))
      const nextEntries = Object.entries(currentPositions).filter(([blockId]) => validIds.has(blockId))

      return nextEntries.length === Object.keys(currentPositions).length
        ? currentPositions
        : Object.fromEntries(nextEntries)
    })
    setTemporarySizes((currentSizes) => {
      const validIds = new Set(blocks.map((block) => block.id))
      const nextEntries = Object.entries(currentSizes).filter(([blockId]) => validIds.has(blockId))

      return nextEntries.length === Object.keys(currentSizes).length
        ? currentSizes
        : Object.fromEntries(nextEntries)
    })
  }, [blocks])

  useEffect(() => {
    if (isMobile) {
      setDraggingBlockId(null)
      setResizingBlockId(null)
      setDragState(null)
      setResizeState(null)
      setTemporaryPositions({})
      setTemporarySizes({})
    }
  }, [isMobile])

  function handleCreate(type: ProjectWorkspaceBlock['type']) {
    onCreateBlock?.(type)
  }

  function getGridPosition(index: number, canvasWidth?: number) {
    const safeCanvasWidth = Math.max(canvasWidth ?? canvasRef.current?.clientWidth ?? 0, GRID_CARD_WIDTH + GRID_GAP + GRID_PADDING * 2)
    const columns = Math.max(1, Math.floor((safeCanvasWidth - GRID_PADDING * 2) / (GRID_CARD_WIDTH + GRID_GAP)))
    const column = index % columns
    const row = Math.floor(index / columns)

    return {
      x: GRID_PADDING + column * (GRID_CARD_WIDTH + GRID_GAP),
      y: GRID_PADDING + row * (GRID_CARD_HEIGHT + GRID_GAP),
    }
  }

  useEffect(() => {
    if (isMobile) {
      return
    }

    const fallbackCanvasWidth = Math.max(canvasRef.current?.clientWidth ?? 0, window.innerWidth - 560, 960)

    blocks.forEach((block, index) => {
      const fallbackPosition = getGridPosition(index, fallbackCanvasWidth)
      const nextX = typeof block.x === 'number' ? Math.max(GRID_PADDING, block.x) : fallbackPosition.x
      const nextY = typeof block.y === 'number' ? Math.max(GRID_PADDING, block.y) : fallbackPosition.y
      const nextWidth = typeof block.width === 'number' && block.width >= 240
        ? Math.min(MAX_BLOCK_WIDTH, Math.max(MIN_BLOCK_WIDTH, block.width))
        : DEFAULT_BLOCK_WIDTH

      if (nextX !== block.x || nextY !== block.y || nextWidth !== block.width) {
        onUpdateBlock?.(block.id, {
          x: nextX,
          y: nextY,
          width: nextWidth,
        })
      }
    })
  }, [blocks, isMobile, onUpdateBlock])

  const resolvedBlocks = useMemo(
    () => blocks.map((block, index) => {
      const fallbackPosition = getGridPosition(index)
      const savedX = typeof block.x === 'number' ? Math.max(GRID_PADDING, block.x) : fallbackPosition.x
      const savedY = typeof block.y === 'number' ? Math.max(GRID_PADDING, block.y) : fallbackPosition.y
      const transientPosition = temporaryPositions[block.id]
      const transientSize = temporarySizes[block.id]
      const resolvedWidth = typeof block.width === 'number' && block.width >= 240
        ? Math.min(MAX_BLOCK_WIDTH, Math.max(MIN_BLOCK_WIDTH, block.width))
        : DEFAULT_BLOCK_WIDTH
      const resolvedHeight = typeof block.height === 'number' && block.height >= 160
        ? block.height
        : block.type === 'image'
          ? 240
          : undefined

      return {
        ...block,
        x: transientPosition?.x ?? savedX,
        y: transientPosition?.y ?? savedY,
        width: transientSize?.width ?? resolvedWidth,
        height: transientSize?.height ?? resolvedHeight,
      }
    }),
    [blocks, temporaryPositions, temporarySizes],
  )

  const filteredBlocks = useMemo(() => {
    if (activeSectionFilter === 'all') {
      return resolvedBlocks
    }

    if (activeSectionFilter === 'none') {
      return resolvedBlocks.filter((block) => !block.sectionId)
    }

    return resolvedBlocks.filter((block) => block.sectionId === activeSectionFilter)
  }, [activeSectionFilter, resolvedBlocks])

  const canvasHeight = useMemo(() => {
    if (isMobile) {
      return undefined
    }

    const maxBottom = filteredBlocks.reduce((maxValue, block) => {
      const nextBottom = (block.y ?? 0) + (block.height ?? 160)
      return Math.max(maxValue, nextBottom)
    }, 0)

    return Math.max(640, maxBottom + 120)
  }, [filteredBlocks, isMobile])

  const blockById = useMemo(
    () => new Map(filteredBlocks.map((block) => [block.id, block])),
    [filteredBlocks],
  )

  const mobileRelationMap = useMemo(() => {
    const relationMap: Record<string, Array<{ id: string; typeLabel: string; directionLabel: string; otherTitle: string }>> = {}

    workspaceRelations.forEach((relation) => {
      const fromBlock = blockById.get(relation.fromBlockId)
      const toBlock = blockById.get(relation.toBlockId)
      const typeLabel = projectWorkspaceRelationLabels[relation.type]

      if (fromBlock) {
        relationMap[fromBlock.id] = [
          ...(relationMap[fromBlock.id] ?? []),
          { id: `${relation.id}:out`, typeLabel, directionLabel: 'Исходящая', otherTitle: toBlock?.title ?? 'Блок удалён' },
        ]
      }

      if (toBlock) {
        relationMap[toBlock.id] = [
          ...(relationMap[toBlock.id] ?? []),
          { id: `${relation.id}:in`, typeLabel, directionLabel: 'Входящая', otherTitle: fromBlock?.title ?? 'Блок удалён' },
        ]
      }
    })

    return relationMap
  }, [blockById, workspaceRelations])

  const relationSummaryMap = useMemo(() => {
    const summaryMap: Record<string, { total: number; items: Array<{ typeLabel: string; count: number }> }> = {}

    workspaceRelations.forEach((relation) => {
      const blockIds = [relation.fromBlockId, relation.toBlockId]

      blockIds.forEach((blockId) => {
        const current = summaryMap[blockId] ?? { total: 0, items: [] }
        const typeLabel = projectWorkspaceRelationLabels[relation.type]
        const existingItem = current.items.find((item) => item.typeLabel === typeLabel)

        if (existingItem) {
          existingItem.count += 1
        } else {
          current.items.push({ typeLabel, count: 1 })
        }

        current.total += 1
        summaryMap[blockId] = current
      })
    })

    return summaryMap
  }, [workspaceRelations])

  const resolvedRelations = useMemo(
    () => workspaceRelations
      .map((relation) => {
        const fromBlock = blockById.get(relation.fromBlockId)
        const toBlock = blockById.get(relation.toBlockId)

        if (!fromBlock || !toBlock) {
          return null
        }

        const fromWidth = fromBlock.width ?? 280
        const fromHeight = fromBlock.height ?? 160
        const toWidth = toBlock.width ?? 280
        const toHeight = toBlock.height ?? 160

        return {
          ...relation,
          fromX: (fromBlock.x ?? 0) + fromWidth / 2,
          fromY: (fromBlock.y ?? 0) + fromHeight / 2,
          toX: (toBlock.x ?? 0) + toWidth / 2,
          toY: (toBlock.y ?? 0) + toHeight / 2,
        }
      })
      .filter((relation): relation is NonNullable<typeof relation> => relation !== null),
    [blockById, workspaceRelations],
  )

  function clampPosition(x: number, y: number, blockWidth = DEFAULT_BLOCK_WIDTH) {
    const canvasWidth = canvasRef.current?.clientWidth ?? 1200
    const canvasHeightValue = canvasRef.current?.clientHeight ?? 800
    const maxX = Math.max(GRID_PADDING, canvasWidth - blockWidth - GRID_PADDING)
    const maxY = Math.max(GRID_PADDING, canvasHeightValue - GRID_CARD_HEIGHT)

    return {
      x: Math.min(Math.max(GRID_PADDING, x), maxX),
      y: Math.min(Math.max(GRID_PADDING, y), maxY),
    }
  }

  function handleDragStart(blockId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (isMobile) {
      return
    }

    const activeBlock = resolvedBlocks.find((block) => block.id === blockId)

    if (!activeBlock) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    onSelectBlock?.(blockId)
    setDraggingBlockId(blockId)
    setDragState({
      blockId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: activeBlock.x ?? 0,
      originY: activeBlock.y ?? 0,
    })
  }

  function handleDragMove(blockId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragState || dragState.blockId !== blockId || dragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    const activeBlock = resolvedBlocks.find((block) => block.id === blockId)
    const nextPosition = clampPosition(dragState.originX + deltaX, dragState.originY + deltaY, activeBlock?.width ?? DEFAULT_BLOCK_WIDTH)

    setTemporaryPositions((currentPositions) => ({
      ...currentPositions,
      [blockId]: nextPosition,
    }))
  }

  function handleDragEnd(blockId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragState || dragState.blockId !== blockId || dragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const nextPosition = temporaryPositions[blockId] ?? {
      x: dragState.originX,
      y: dragState.originY,
    }

    onUpdateBlock?.(blockId, nextPosition)
    setDraggingBlockId(null)
    setDragState(null)
    setTemporaryPositions((currentPositions) => {
      const { [blockId]: _removed, ...rest } = currentPositions
      return rest
    })
  }

  function clampSize(width: number, height: number) {
    const canvasWidth = canvasRef.current?.clientWidth ?? 1200
    const canvasHeightValue = canvasRef.current?.clientHeight ?? 800

    return {
      width: Math.min(Math.max(220, width), Math.min(560, canvasWidth - GRID_PADDING * 2)),
      height: Math.min(Math.max(180, height), Math.min(560, canvasHeightValue - GRID_PADDING * 2)),
    }
  }

  function handleResizeStart(blockId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (isMobile) {
      return
    }

    const activeBlock = resolvedBlocks.find((block) => block.id === blockId)

    if (!activeBlock) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    onSelectBlock?.(blockId)
    setResizingBlockId(blockId)
    setResizeState({
      blockId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: activeBlock.width ?? DEFAULT_BLOCK_WIDTH,
      originHeight: activeBlock.height ?? 240,
    })
  }

  function handleResizeMove(blockId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!resizeState || resizeState.blockId !== blockId || resizeState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const deltaX = event.clientX - resizeState.startX
    const deltaY = event.clientY - resizeState.startY
    const nextSize = clampSize(resizeState.originWidth + deltaX, resizeState.originHeight + deltaY)

    setTemporarySizes((currentSizes) => ({
      ...currentSizes,
      [blockId]: nextSize,
    }))
  }

  function handleResizeEnd(blockId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!resizeState || resizeState.blockId !== blockId || resizeState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const nextSize = temporarySizes[blockId] ?? {
      width: resizeState.originWidth,
      height: resizeState.originHeight,
    }

    onUpdateBlock?.(blockId, nextSize)
    setResizingBlockId(null)
    setResizeState(null)
    setTemporarySizes((currentSizes) => {
      const { [blockId]: _removed, ...rest } = currentSizes
      return rest
    })
  }

  function handleArrange() {
    const canvasWidth = canvasRef.current?.clientWidth
    const positions = resolvedBlocks.map((block, index) => ({
      id: block.id,
      ...getGridPosition(index, canvasWidth),
    }))

    onArrangeBlocks?.(positions)
  }

  function handleAddElement() {
    if (onOpenAddElement) {
      onOpenAddElement()
      return
    }

    handleCreate('text')
  }

  const activeToolLabel = activeTool === 'select' || !activeTool ? 'Выбор' : activeTool
  const hasFilter = activeSectionFilter !== 'all'
  const filterEmpty = blocks.length > 0 && filteredBlocks.length === 0

  return (
    <section className="min-w-0 space-y-4">
      <div className="ui-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Рабочая область</p>
            <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Пространство блоков и связей</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-(--text-secondary)">
              {isMobile
                ? 'На mobile блоки отображаются вертикальной лентой без горизонтального переполнения.'
                : 'На desktop центральный canvas занимает всё доступное пространство, а блоки можно свободно переставлять.'}
            </p>
            {activeTool === 'relation' ? (
              <p className="mt-3 text-sm text-(--text-secondary)">
                {relationSourceBlockId
                  ? 'Режим связи: выберите второй блок и подтвердите тип связи.'
                  : 'Режим связи: выберите первый блок, затем второй.'}
              </p>
            ) : null}
            {relationNotice ? <p className="mt-2 text-sm text-(--accent)">{relationNotice}</p> : null}
          </div>

          <div className="flex flex-wrap items-start gap-3 lg:justify-end">
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-sm text-(--text-secondary)">
              <span className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Блоки</span>
              <p className="mt-1 text-base font-semibold text-(--text-primary)">{filteredBlocks.length}{hasFilter ? <span className="text-sm font-normal text-(--text-muted)"> из {blocks.length}</span> : null}</p>
            </div>
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-sm text-(--text-secondary)">
              <span className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Инструмент</span>
              <p className="mt-1 text-base font-semibold text-(--text-primary)">{activeToolLabel}</p>
            </div>
            <button type="button" className="ui-button-accent px-4 py-3" onClick={handleAddElement}>
              Добавить элемент
            </button>
            {!isMobile ? (
              <button type="button" className="ui-button px-4 py-3" onClick={handleArrange}>
                Упорядочить
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="ui-panel p-6">
          <div className="rounded-2xl border border-dashed border-(--border) bg-(--panel-elevated) p-6 text-center">
            <h2 className="text-xl font-semibold text-(--text-primary)">Рабочая область пустая</h2>
            <p className="mt-2 text-sm text-(--text-muted)">Добавьте первый блок: задачу, идею, заметку, файл или текст.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {EMPTY_STATE_ACTIONS.map((action) => (
                <button key={action.type} type="button" className="ui-button-accent px-4 py-2" onClick={() => handleCreate(action.type)}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="ui-panel p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Разделы рабочей области</p>
            <p className="mt-1 text-sm text-(--text-secondary)">Фильтруйте блоки по разделу, не изменяя сами данные проекта.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', title: 'Все блоки' },
              ...sections.map((section) => ({ id: section.id, title: section.title })),
              { id: 'none', title: 'Без раздела' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSectionFilter?.(item.id)}
                className={cn(
                  'ui-filter-pill shrink-0',
                  activeSectionFilter === item.id && 'border-(--accent-border) bg-(--accent-soft) text-(--accent)',
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filterEmpty ? (
        <div className="ui-panel p-6">
          <div className="rounded-2xl border border-dashed border-(--border) bg-(--panel-elevated) p-6 text-center">
            <h2 className="text-xl font-semibold text-(--text-primary)">В этом разделе пока нет блоков</h2>
            <p className="mt-2 text-sm text-(--text-muted)">Добавьте текст, задачу, идею или файл, чтобы заполнить выбранный раздел.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {EMPTY_STATE_ACTIONS.slice(0, 4).map((action) => (
                <button key={action.type} type="button" className="ui-button-accent px-4 py-2" onClick={() => handleCreate(action.type)}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="ui-panel min-w-0 p-3 md:p-4">
        <div
          ref={canvasRef}
          className={cn(
            'relative min-h-160 w-full min-w-0 overflow-auto rounded-3xl border border-(--border)',
            isMobile ? 'bg-(--bg) p-3' : 'bg-(--panel) p-4',
          )}
          style={isMobile
            ? undefined
            : {
                backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                backgroundPosition: '0 0',
              }}
        >
          <div className={cn(isMobile ? 'grid grid-cols-1 gap-4' : 'relative min-h-full min-w-full')} style={isMobile ? undefined : { minHeight: canvasHeight }}>
            {!isMobile && resolvedRelations.length > 0 ? (
              <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                {resolvedRelations.map((relation) => {
                  const isSelected = relation.id === selectedRelationId

                  return (
                    <line
                      key={relation.id}
                      x1={relation.fromX}
                      y1={relation.fromY}
                      x2={relation.toX}
                      y2={relation.toY}
                      stroke={isSelected ? 'var(--accent)' : 'var(--border)'}
                      strokeOpacity={isSelected ? 0.75 : 0.6}
                      strokeWidth={isSelected ? 2 : 1.75}
                    />
                  )
                })}
              </svg>
            ) : null}
            {filteredBlocks.map((block) => (
              <WorkspaceCard
                key={block.id}
                block={block}
                sectionTitle={block.sectionId ? (sectionTitleMap.get(block.sectionId) ?? 'Раздел') : null}
                selected={block.id === selectedBlockId}
                dragging={draggingBlockId === block.id}
                resizing={resizingBlockId === block.id}
                relationSummary={relationSummaryMap[block.id]}
                mobileRelations={mobileRelationMap[block.id] ?? []}
                mode={isMobile ? 'list' : 'canvas'}
                onSelect={(blockId) => onSelectBlock?.(blockId)}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onResizeStart={handleResizeStart}
                onResizeMove={handleResizeMove}
                onResizeEnd={handleResizeEnd}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
