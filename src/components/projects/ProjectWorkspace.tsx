import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { Expand, Hand, Minimize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import type { Project, ProjectSection, ProjectWorkspaceBlock, ProjectWorkspaceRelation } from '../../types'
import { cn } from '../../utils/cn'
import { ProjectWorkspaceBlock as WorkspaceCard } from './ProjectWorkspaceBlock'
import { projectWorkspaceRelationLabels } from './projectMeta'

type CanvasViewState = {
  zoom: number
  panX: number
  panY: number
}

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
  onEditBlock?: (blockId: string) => void
  onSelectSectionFilter?: (sectionId: string) => void
  onCreateBlock?: (type: ProjectWorkspaceBlock['type']) => void
  onOpenAddElement?: () => void
  onUpdateBlock?: (blockId: string, updates: Partial<ProjectWorkspaceBlock>) => void
  onArrangeBlocks?: (positions: Array<{ id: string; x: number; y: number; width?: number; height?: number }>) => void
  onInteractionChange?: (interacting: boolean) => void
  workspaceRelations?: ProjectWorkspaceRelation[]
  editorMode?: boolean
  resetViewSignal?: number
  arrangeSignal?: number
  onCanvasViewChange?: (view: CanvasViewState) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

const DEFAULT_BLOCK_WIDTH = 280
const DEFAULT_IMAGE_BLOCK_WIDTH = 320
const DEFAULT_IMAGE_BLOCK_HEIGHT = 280
const MIN_BLOCK_WIDTH = 260
const MAX_BLOCK_WIDTH = 360
const MIN_IMAGE_BLOCK_WIDTH = 220
const MAX_IMAGE_BLOCK_WIDTH = 720
const MIN_IMAGE_BLOCK_HEIGHT = 180
const MAX_IMAGE_BLOCK_HEIGHT = 640
const GRID_CARD_WIDTH = 300
const GRID_CARD_HEIGHT = 160
const GRID_GAP = 24
const GRID_PADDING = 24
const WORLD_MIN_WIDTH = 4800
const WORLD_MIN_HEIGHT = 3600
const WORLD_PADDING_RIGHT = 960
const WORLD_PADDING_BOTTOM = 960
const WORLD_MAX_X = 7600
const WORLD_MAX_Y = 6200
const MIN_CANVAS_ZOOM = 0.35
const MAX_CANVAS_ZOOM = 2.5
const DEFAULT_CANVAS_ZOOM = 1
const CANVAS_ZOOM_FACTOR = 1.08
const CANVAS_EDGE_MARGIN = 720
const CANVAS_VIEW_STORAGE_KEY_PREFIX = 'life-terminal-project-canvas-view:'
const DEFAULT_CANVAS_VIEW_STATE: CanvasViewState = {
  zoom: DEFAULT_CANVAS_ZOOM,
  panX: 0,
  panY: 0,
}

const EMPTY_STATE_ACTIONS: Array<{ type: ProjectWorkspaceBlock['type']; label: string }> = [
  { type: 'text', label: 'Добавить текст' },
  { type: 'task', label: 'Добавить задачу' },
  { type: 'idea', label: 'Добавить идею' },
  { type: 'note', label: 'Добавить заметку' },
  { type: 'file', label: 'Добавить файл' },
]

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function sanitizeCanvasViewState(value: Partial<CanvasViewState> | null | undefined): CanvasViewState {
  const zoomValue = value?.zoom
  const panXValue = value?.panX
  const panYValue = value?.panY
  const zoom = Number.isFinite(zoomValue) ? Number(zoomValue) : DEFAULT_CANVAS_VIEW_STATE.zoom
  const panX = Number.isFinite(panXValue) ? Number(panXValue) : DEFAULT_CANVAS_VIEW_STATE.panX
  const panY = Number.isFinite(panYValue) ? Number(panYValue) : DEFAULT_CANVAS_VIEW_STATE.panY

  return {
    zoom: zoom >= MIN_CANVAS_ZOOM && zoom <= MAX_CANVAS_ZOOM ? zoom : DEFAULT_CANVAS_VIEW_STATE.zoom,
    panX: Math.abs(panX) <= 5000 ? panX : DEFAULT_CANVAS_VIEW_STATE.panX,
    panY: Math.abs(panY) <= 5000 ? panY : DEFAULT_CANVAS_VIEW_STATE.panY,
  }
}

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
  onEditBlock,
  onSelectSectionFilter,
  onCreateBlock,
  onOpenAddElement,
  onUpdateBlock,
  onArrangeBlocks,
  onInteractionChange,
  workspaceRelations = [],
  editorMode = false,
  resetViewSignal,
  arrangeSignal,
  onCanvasViewChange,
  isFullscreen = false,
  onToggleFullscreen,
}: ProjectWorkspaceProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const resetSignalRef = useRef(resetViewSignal)
  const arrangeSignalRef = useRef(arrangeSignal)
  const canvasViewStorageKey = `${CANVAS_VIEW_STORAGE_KEY_PREFIX}${project.id}`
  const { value: storedCanvasView, setValue: setStoredCanvasView } = useLocalStorage<CanvasViewState>(canvasViewStorageKey, DEFAULT_CANVAS_VIEW_STATE)

  const [isMobile, setIsMobile] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [isCanvasPanMode, setIsCanvasPanMode] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null)
  const [temporaryPositions, setTemporaryPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [temporarySizes, setTemporarySizes] = useState<Record<string, { width: number; height: number }>>({})
  const [canvasView, setCanvasView] = useState<CanvasViewState>(() => sanitizeCanvasViewState(storedCanvasView))
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
  const [panState, setPanState] = useState<{
    pointerId: number
    startX: number
    startY: number
    originPanX: number
    originPanY: number
  } | null>(null)

  const blocks = useMemo(
    () => workspaceBlocks.filter((block) => block.projectId === project.id),
    [project.id, workspaceBlocks],
  )
  const sectionTitleMap = useMemo(() => new Map(sections.map((section) => [section.id, section.title])), [sections])

  useEffect(() => {
    const updateViewportMode = () => setIsMobile(window.innerWidth < 1024)
    updateViewportMode()
    window.addEventListener('resize', updateViewportMode)

    return () => window.removeEventListener('resize', updateViewportMode)
  }, [])

  useEffect(() => {
    const element = viewportRef.current

    if (!element || typeof ResizeObserver === 'undefined') {
      setViewportSize({ width: 0, height: 0 })
      return
    }

    const updateSize = () => {
      setViewportSize({
        width: element.clientWidth,
        height: element.clientHeight,
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(element)

    return () => observer.disconnect()
  }, [isMobile])

  useEffect(() => {
    setCanvasView(sanitizeCanvasViewState(storedCanvasView))
  }, [canvasViewStorageKey, storedCanvasView])

  useEffect(() => {
    if (isMobile || typeof window === 'undefined') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setStoredCanvasView((current) => {
        const next = sanitizeCanvasViewState(canvasView)

        if (current.zoom === next.zoom && current.panX === next.panX && current.panY === next.panY) {
          return current
        }

        return next
      })
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [canvasView, isMobile, setStoredCanvasView])

  useEffect(() => {
    onCanvasViewChange?.(canvasView)
  }, [canvasView, onCanvasViewChange])

  useEffect(() => {
    if (resetViewSignal === undefined) {
      return
    }

    if (resetSignalRef.current === resetViewSignal) {
      return
    }

    resetSignalRef.current = resetViewSignal
    updateCanvasView(DEFAULT_CANVAS_VIEW_STATE)
  }, [resetViewSignal])

  useEffect(() => {
    if (arrangeSignal === undefined) {
      return
    }

    if (arrangeSignalRef.current === arrangeSignal) {
      return
    }

    arrangeSignalRef.current = arrangeSignal
    handleArrange()
  }, [arrangeSignal])

  useEffect(() => {
    if (isMobile || typeof window === 'undefined') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return
      }

      const target = event.target as HTMLElement | null
      if (target && target.closest('input, textarea, select, button, [contenteditable="true"]')) {
        return
      }

      event.preventDefault()
      setIsSpacePressed(true)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') {
        return
      }

      setIsSpacePressed(false)
    }

    const handleBlur = () => setIsSpacePressed(false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isMobile])

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
    if (!isMobile) {
      return
    }

    setDraggingBlockId(null)
    setResizingBlockId(null)
    setPanState(null)
    setIsCanvasPanMode(false)
    setIsSpacePressed(false)
    setDragState(null)
    setResizeState(null)
    setTemporaryPositions({})
    setTemporarySizes({})
    onInteractionChange?.(false)
  }, [isMobile, onInteractionChange])

  function handleCreate(type: ProjectWorkspaceBlock['type']) {
    onCreateBlock?.(type)
  }

  function getGridPosition(index: number, canvasWidth?: number) {
    const safeCanvasWidth = Math.max(canvasWidth ?? viewportSize.width ?? 0, GRID_CARD_WIDTH + GRID_GAP + GRID_PADDING * 2)
    const columns = Math.max(1, Math.floor((safeCanvasWidth - GRID_PADDING * 2) / (GRID_CARD_WIDTH + GRID_GAP)))
    const column = index % columns
    const row = Math.floor(index / columns)

    return {
      x: GRID_PADDING + column * (GRID_CARD_WIDTH + GRID_GAP),
      y: GRID_PADDING + row * (GRID_CARD_HEIGHT + GRID_GAP),
    }
  }

  function getDefaultBlockSize(block: Pick<ProjectWorkspaceBlock, 'type' | 'imageUrl' | 'previewUrl' | 'dataUrl'>) {
    const hasImagePreview = Boolean(block.imageUrl || block.previewUrl || block.dataUrl)
    const isImageBlock = block.type === 'image' || (block.type === 'file' && hasImagePreview)

    return isImageBlock
      ? { width: DEFAULT_IMAGE_BLOCK_WIDTH, height: DEFAULT_IMAGE_BLOCK_HEIGHT }
      : { width: DEFAULT_BLOCK_WIDTH, height: GRID_CARD_HEIGHT }
  }

  useEffect(() => {
    if (isMobile) {
      return
    }

    const fallbackCanvasWidth = Math.max(WORLD_MIN_WIDTH, viewportSize.width)

    blocks.forEach((block, index) => {
      const fallbackPosition = getGridPosition(index, fallbackCanvasWidth)
      const defaultSize = getDefaultBlockSize(block)
      const nextX = isFiniteNumber(block.x) && Math.abs(block.x) <= WORLD_MAX_X ? Math.max(GRID_PADDING, block.x) : fallbackPosition.x
      const nextY = isFiniteNumber(block.y) && Math.abs(block.y) <= WORLD_MAX_Y ? Math.max(GRID_PADDING, block.y) : fallbackPosition.y
      const nextWidth = isFiniteNumber(block.width) && block.width >= 220
        ? Math.min(block.type === 'image' ? MAX_IMAGE_BLOCK_WIDTH : MAX_BLOCK_WIDTH, Math.max(block.type === 'image' ? MIN_IMAGE_BLOCK_WIDTH : MIN_BLOCK_WIDTH, block.width))
        : defaultSize.width
      const nextHeight = isFiniteNumber(block.height) && block.height >= 160
        ? Math.min(block.type === 'image' ? MAX_IMAGE_BLOCK_HEIGHT : 520, Math.max(block.type === 'image' ? MIN_IMAGE_BLOCK_HEIGHT : 160, block.height))
        : defaultSize.height

      if (nextX !== block.x || nextY !== block.y || nextWidth !== block.width || nextHeight !== block.height) {
        onUpdateBlock?.(block.id, {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        })
      }
    })
  }, [blocks, isMobile, onUpdateBlock, viewportSize.width])

  const resolvedBlocks = useMemo(
    () => blocks.map((block, index) => {
      const fallbackPosition = getGridPosition(index, viewportSize.width)
      const defaultSize = getDefaultBlockSize(block)
      const savedX = isFiniteNumber(block.x) && Math.abs(block.x) <= WORLD_MAX_X ? Math.max(GRID_PADDING, block.x) : fallbackPosition.x
      const savedY = isFiniteNumber(block.y) && Math.abs(block.y) <= WORLD_MAX_Y ? Math.max(GRID_PADDING, block.y) : fallbackPosition.y
      const transientPosition = temporaryPositions[block.id]
      const transientSize = temporarySizes[block.id]
      const resolvedWidth = isFiniteNumber(block.width) && block.width >= 220
        ? Math.min(block.type === 'image' ? MAX_IMAGE_BLOCK_WIDTH : MAX_BLOCK_WIDTH, Math.max(block.type === 'image' ? MIN_IMAGE_BLOCK_WIDTH : MIN_BLOCK_WIDTH, block.width))
        : defaultSize.width
      const resolvedHeight = isFiniteNumber(block.height) && block.height >= 160
        ? Math.min(block.type === 'image' ? MAX_IMAGE_BLOCK_HEIGHT : 520, Math.max(block.type === 'image' ? MIN_IMAGE_BLOCK_HEIGHT : 160, block.height))
        : defaultSize.height

      return {
        ...block,
        x: transientPosition?.x ?? savedX,
        y: transientPosition?.y ?? savedY,
        width: transientSize?.width ?? resolvedWidth,
        height: transientSize?.height ?? resolvedHeight,
      }
    }),
    [blocks, temporaryPositions, temporarySizes, viewportSize.width],
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

  const canvasWorldHeight = useMemo(() => {
    if (isMobile) {
      return undefined
    }

    const maxBottom = filteredBlocks.reduce((maxValue, block) => {
      const nextBottom = (block.y ?? 0) + (block.height ?? 160)
      return Math.max(maxValue, nextBottom)
    }, 0)

    return Math.max(WORLD_MIN_HEIGHT, maxBottom + WORLD_PADDING_BOTTOM)
  }, [filteredBlocks, isMobile])

  const canvasWorldWidth = useMemo(() => {
    if (isMobile) {
      return undefined
    }

    const maxRight = filteredBlocks.reduce((maxValue, block) => {
      const nextRight = (block.x ?? 0) + (block.width ?? DEFAULT_BLOCK_WIDTH)
      return Math.max(maxValue, nextRight)
    }, 0)

    return Math.max(WORLD_MIN_WIDTH, maxRight + WORLD_PADDING_RIGHT)
  }, [filteredBlocks, isMobile])

  function clampCanvasView(nextView: CanvasViewState) {
    const sanitized = sanitizeCanvasViewState(nextView)

    if (isMobile || !viewportSize.width || !viewportSize.height || !canvasWorldWidth || !canvasWorldHeight) {
      return sanitized
    }

    const scaledWidth = canvasWorldWidth * sanitized.zoom
    const scaledHeight = canvasWorldHeight * sanitized.zoom

    const minPanX = Math.min(CANVAS_EDGE_MARGIN, viewportSize.width - scaledWidth - CANVAS_EDGE_MARGIN)
    const maxPanX = CANVAS_EDGE_MARGIN
    const minPanY = Math.min(CANVAS_EDGE_MARGIN, viewportSize.height - scaledHeight - CANVAS_EDGE_MARGIN)
    const maxPanY = CANVAS_EDGE_MARGIN

    return {
      zoom: sanitized.zoom,
      panX: Math.min(maxPanX, Math.max(minPanX, sanitized.panX)),
      panY: Math.min(maxPanY, Math.max(minPanY, sanitized.panY)),
    }
  }

  function updateCanvasView(nextView: CanvasViewState | ((currentView: CanvasViewState) => CanvasViewState)) {
    setCanvasView((currentView) => {
      const resolvedView = nextView instanceof Function ? nextView(currentView) : nextView
      const clampedView = clampCanvasView(resolvedView)

      return currentView.zoom === clampedView.zoom
        && currentView.panX === clampedView.panX
        && currentView.panY === clampedView.panY
        ? currentView
        : clampedView
    })
  }

  useEffect(() => {
    if (isMobile || !canvasWorldWidth || !canvasWorldHeight) {
      return
    }

    updateCanvasView((currentView) => currentView)
  }, [canvasWorldHeight, canvasWorldWidth, isMobile, viewportSize.height, viewportSize.width])

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

        const fromWidth = fromBlock.width ?? DEFAULT_BLOCK_WIDTH
        const fromHeight = fromBlock.height ?? GRID_CARD_HEIGHT
        const toWidth = toBlock.width ?? DEFAULT_BLOCK_WIDTH
        const toHeight = toBlock.height ?? GRID_CARD_HEIGHT

        return {
          ...relation,
          fromX: (fromBlock.x ?? 0) + fromWidth / 2,
          fromY: (fromBlock.y ?? 0) + fromHeight / 2,
          fromBottomX: (fromBlock.x ?? 0) + fromWidth / 2,
          fromBottomY: (fromBlock.y ?? 0) + fromHeight,
          fromRightX: (fromBlock.x ?? 0) + fromWidth,
          fromRightY: (fromBlock.y ?? 0) + fromHeight / 2,
          toX: (toBlock.x ?? 0) + toWidth / 2,
          toY: (toBlock.y ?? 0) + toHeight / 2,
          toTopX: (toBlock.x ?? 0) + toWidth / 2,
          toTopY: toBlock.y ?? 0,
          toLeftX: toBlock.x ?? 0,
          toLeftY: (toBlock.y ?? 0) + toHeight / 2,
        }
      })
      .filter((relation): relation is NonNullable<typeof relation> => relation !== null),
    [blockById, workspaceRelations],
  )

  function clampPosition(x: number, y: number, blockWidth = DEFAULT_BLOCK_WIDTH, blockHeight = GRID_CARD_HEIGHT) {
    const maxX = Math.max(GRID_PADDING, WORLD_MAX_X - blockWidth - GRID_PADDING)
    const maxY = Math.max(GRID_PADDING, WORLD_MAX_Y - blockHeight - GRID_PADDING)

    return {
      x: Math.min(Math.max(GRID_PADDING, x), maxX),
      y: Math.min(Math.max(GRID_PADDING, y), maxY),
    }
  }

  function handleDragStart(blockId: string, event: ReactPointerEvent<HTMLElement>) {
    if (isMobile || activeTool === 'pan') {
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
    onInteractionChange?.(true)
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

  function handleDragMove(blockId: string, event: ReactPointerEvent<HTMLElement>) {
    if (!dragState || dragState.blockId !== blockId || dragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const deltaX = (event.clientX - dragState.startX) / canvasView.zoom
    const deltaY = (event.clientY - dragState.startY) / canvasView.zoom
    const activeBlock = resolvedBlocks.find((block) => block.id === blockId)
    const nextPosition = clampPosition(
      dragState.originX + deltaX,
      dragState.originY + deltaY,
      activeBlock?.width ?? DEFAULT_BLOCK_WIDTH,
      activeBlock?.height ?? GRID_CARD_HEIGHT,
    )

    setTemporaryPositions((currentPositions) => ({
      ...currentPositions,
      [blockId]: nextPosition,
    }))
  }

  function handleDragEnd(blockId: string, event: ReactPointerEvent<HTMLElement>) {
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
    onInteractionChange?.(false)
    setDragState(null)
    setTemporaryPositions((currentPositions) => {
      const { [blockId]: _removed, ...rest } = currentPositions
      return rest
    })
  }

  function clampSize(width: number, height: number) {
    return {
      width: Math.min(Math.max(MIN_IMAGE_BLOCK_WIDTH, width), MAX_IMAGE_BLOCK_WIDTH),
      height: Math.min(Math.max(MIN_IMAGE_BLOCK_HEIGHT, height), MAX_IMAGE_BLOCK_HEIGHT),
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
    onInteractionChange?.(true)
    setResizingBlockId(blockId)
    setResizeState({
      blockId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: activeBlock.width ?? DEFAULT_IMAGE_BLOCK_WIDTH,
      originHeight: activeBlock.height ?? DEFAULT_IMAGE_BLOCK_HEIGHT,
    })
  }

  function handleResizeMove(blockId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!resizeState || resizeState.blockId !== blockId || resizeState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const deltaX = (event.clientX - resizeState.startX) / canvasView.zoom
    const deltaY = (event.clientY - resizeState.startY) / canvasView.zoom
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
    onInteractionChange?.(false)
    setResizeState(null)
    setTemporarySizes((currentSizes) => {
      const { [blockId]: _removed, ...rest } = currentSizes
      return rest
    })
  }

  function handleArrange() {
    const safeCanvasWidth = Math.max(canvasWorldWidth ?? 0, WORLD_MIN_WIDTH)
    let currentX = GRID_PADDING
    let currentY = GRID_PADDING
    let rowHeight = 0

    const positions = resolvedBlocks.map((block) => {
      const blockWidth = block.width ?? getDefaultBlockSize(block).width
      const blockHeight = block.height ?? getDefaultBlockSize(block).height

      if (currentX + blockWidth + GRID_PADDING > safeCanvasWidth) {
        currentX = GRID_PADDING
        currentY += rowHeight + GRID_GAP
        rowHeight = 0
      }

      const nextPosition = {
        id: block.id,
        x: currentX,
        y: currentY,
        width: blockWidth,
        height: blockHeight,
      }

      currentX += blockWidth + GRID_GAP
      rowHeight = Math.max(rowHeight, blockHeight)

      return nextPosition
    })

    onArrangeBlocks?.(positions)
  }

  function handleAddElement() {
    if (onOpenAddElement) {
      onOpenAddElement()
      return
    }

    handleCreate('text')
  }

  function getViewportCenterPointer() {
    const rect = viewportRef.current?.getBoundingClientRect()

    if (!rect) {
      return undefined
    }

    return {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }
  }

  function updateCanvasZoom(nextZoom: number, pointer?: { clientX: number; clientY: number }) {
    const viewport = viewportRef.current
    const resolvedZoom = Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, Number(nextZoom.toFixed(4))))

    if (!viewport) {
      updateCanvasView({
        ...canvasView,
        zoom: resolvedZoom,
      })
      return
    }

    const rect = viewport.getBoundingClientRect()
    const anchor = pointer ?? getViewportCenterPointer() ?? { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
    const mouseX = anchor.clientX - rect.left
    const mouseY = anchor.clientY - rect.top
    const worldX = (mouseX - canvasView.panX) / canvasView.zoom
    const worldY = (mouseY - canvasView.panY) / canvasView.zoom

    updateCanvasView({
      zoom: resolvedZoom,
      panX: mouseX - worldX * resolvedZoom,
      panY: mouseY - worldY * resolvedZoom,
    })
  }

  function shouldIgnoreViewportPanTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    return Boolean(target.closest('[data-no-pan="true"], button, a, input, textarea, select, option, label, [role="button"], [contenteditable="true"]'))
  }

  function handleViewportWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (isMobile || draggingBlockId || resizingBlockId) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const zoomFactor = event.deltaY < 0 ? CANVAS_ZOOM_FACTOR : 1 / CANVAS_ZOOM_FACTOR
    updateCanvasZoom(canvasView.zoom * zoomFactor, {
      clientX: event.clientX,
      clientY: event.clientY,
    })
  }

  function handleViewportPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const isMiddleMousePan = event.button === 1
    const isLeftMousePan = event.button === 0 && (isSpacePressed || activeTool === 'pan' || isCanvasPanMode)

    if (
      isMobile
      || draggingBlockId
      || resizingBlockId
      || shouldIgnoreViewportPanTarget(event.target)
      || (!isMiddleMousePan && !isLeftMousePan)
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    onInteractionChange?.(true)
    setPanState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originPanX: canvasView.panX,
      originPanY: canvasView.panY,
    })
  }

  function handleViewportPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!panState || panState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const deltaX = event.clientX - panState.startX
    const deltaY = event.clientY - panState.startY

    updateCanvasView({
      zoom: canvasView.zoom,
      panX: panState.originPanX + deltaX,
      panY: panState.originPanY + deltaY,
    })
  }

  function handleViewportPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!panState || panState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    onInteractionChange?.(false)
    setPanState(null)
  }

  function handleResetView() {
    updateCanvasView(DEFAULT_CANVAS_VIEW_STATE)
  }

  function handleFitToContent() {
    if (!filteredBlocks.length) {
      onSelectSectionFilter?.('all')
      updateCanvasView(DEFAULT_CANVAS_VIEW_STATE)
      return
    }

    const viewport = viewportRef.current

    if (!viewport) {
      updateCanvasView(DEFAULT_CANVAS_VIEW_STATE)
      return
    }

    const bounds = filteredBlocks.reduce(
      (accumulator, block) => {
        const blockWidth = block.width ?? getDefaultBlockSize(block).width
        const blockHeight = block.height ?? getDefaultBlockSize(block).height

        return {
          minX: Math.min(accumulator.minX, block.x ?? GRID_PADDING),
          minY: Math.min(accumulator.minY, block.y ?? GRID_PADDING),
          maxX: Math.max(accumulator.maxX, (block.x ?? GRID_PADDING) + blockWidth),
          maxY: Math.max(accumulator.maxY, (block.y ?? GRID_PADDING) + blockHeight),
        }
      },
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: 0,
        maxY: 0,
      },
    )

    const contentWidth = Math.max(GRID_CARD_WIDTH, bounds.maxX - bounds.minX)
    const contentHeight = Math.max(GRID_CARD_HEIGHT, bounds.maxY - bounds.minY)
    const padding = 96
    const zoomByWidth = (viewport.clientWidth - padding * 2) / contentWidth
    const zoomByHeight = (viewport.clientHeight - padding * 2) / contentHeight
    const nextZoom = Math.min(1, Math.max(MIN_CANVAS_ZOOM, Math.min(MAX_CANVAS_ZOOM, zoomByWidth, zoomByHeight)))
    const contentCenterX = bounds.minX + contentWidth / 2
    const contentCenterY = bounds.minY + contentHeight / 2

    updateCanvasView({
      zoom: nextZoom,
      panX: viewport.clientWidth / 2 - contentCenterX * nextZoom,
      panY: viewport.clientHeight / 2 - contentCenterY * nextZoom,
    })
  }

  const activeToolLabel = activeTool === 'select' || !activeTool
    ? 'Выбор'
    : activeTool === 'pan'
      ? 'Рука'
      : activeTool
  const hasFilter = activeSectionFilter !== 'all'
  const filterEmpty = blocks.length > 0 && filteredBlocks.length === 0
  const zoomPercent = Math.round(canvasView.zoom * 100)
  const showDesktopCanvasEmptyHint = editorMode && !isMobile && (blocks.length === 0 || filterEmpty)
  const showCanvasControls = Boolean(onToggleFullscreen)

  return (
    <section className={cn('min-w-0 space-y-3', editorMode && 'flex h-full min-h-0 flex-col')}>
      {!editorMode ? (
        <div className="ui-panel px-4 py-3 md:px-5 md:py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
              <span className="font-semibold text-(--text-primary)">Рабочая область</span>
              <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-xs text-(--text-muted)">
                Блоков: {filteredBlocks.length}{hasFilter ? ` / ${blocks.length}` : ''}
              </span>
              <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-xs text-(--text-muted)">
                Инструмент: {activeToolLabel}
              </span>
              {activeTool === 'relation' ? (
                <span className="rounded-full border border-(--accent-border) bg-(--accent-soft) px-2.5 py-1 text-xs text-(--accent)">
                  {relationSourceBlockId ? 'Выберите второй блок' : 'Выберите первый блок'}
                </span>
              ) : null}
            </div>
            {relationNotice ? <p className="mt-2 text-sm text-(--accent)">{relationNotice}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" className="ui-button-accent px-3 py-2 text-sm" onClick={handleAddElement}>
              Добавить элемент
            </button>
            {!isMobile ? (
              <button type="button" className="ui-button px-3 py-2 text-sm" onClick={handleArrange}>
                Упорядочить
              </button>
            ) : null}
          </div>
        </div>
        </div>
      ) : null}

      {showCanvasControls && isMobile ? (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 md:bottom-8 md:right-8">
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Открыть рабочее пространство на весь экран'}
            className="inline-flex h-13 w-13 items-center justify-center rounded-2xl border border-(--accent-border) bg-(--panel) text-(--accent) shadow-(--shadow-floating) transition hover:-translate-y-0.5 hover:bg-(--panel-elevated)"
          >
            {isFullscreen ? <Minimize2 size={20} strokeWidth={2} /> : <Expand size={20} strokeWidth={2} />}
          </button>
        </div>
      ) : null}

      {blocks.length === 0 && !editorMode ? (
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

      {!editorMode ? (
        <div className="ui-panel px-3 py-2.5 md:px-4 md:py-3">
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
      ) : null}

      {filterEmpty && !editorMode ? (
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

      <div className={cn('ui-panel min-w-0', editorMode ? 'flex flex-1 min-h-0 flex-col overflow-hidden p-0' : 'p-2.5 md:p-3')}>
        {isMobile ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredBlocks.map((block) => (
              <WorkspaceCard
                key={block.id}
                block={block}
                sectionTitle={block.sectionId ? (sectionTitleMap.get(block.sectionId) ?? 'Раздел') : null}
                selected={block.id === selectedBlockId}
                relationSummary={relationSummaryMap[block.id]}
                mobileRelations={mobileRelationMap[block.id] ?? []}
                mode="list"
                onSelect={(blockId) => onSelectBlock?.(blockId)}
                onEdit={onEditBlock}
              />
            ))}
          </div>
        ) : (
          <div
            ref={viewportRef}
            className={cn(
              editorMode
                ? 'relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-3xl border border-(--border) bg-[var(--canvas-bg)]'
                : 'relative h-[82vh] max-h-225 min-h-160 w-full min-w-0 overflow-hidden rounded-3xl border border-(--border) bg-[var(--canvas-bg)]',
              (isCanvasPanMode || activeTool === 'pan' || isSpacePressed) && (panState ? 'cursor-grabbing' : 'cursor-grab'),
            )}
            style={{
              overscrollBehavior: 'none',
              touchAction: 'none',
            }}
            onWheelCapture={handleViewportWheel}
            onWheel={handleViewportWheel}
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerEnd}
            onPointerCancel={handleViewportPointerEnd}
          >
            {showCanvasControls ? (
              <div className="pointer-events-none absolute bottom-5 right-5 z-40 flex max-w-[calc(100%-2.5rem)] justify-end">
                <div className="pointer-events-auto rounded-2xl ui-shadow-floating">
                  <div className="ui-surface-floating isolate flex flex-wrap items-center justify-end gap-1 overflow-hidden rounded-2xl border p-1">
                  <button
                    type="button"
                    onClick={() => setIsCanvasPanMode((current) => !current)}
                    aria-label={isCanvasPanMode ? 'Выключить локальный pan mode' : 'Включить локальный pan mode'}
                    className={cn(
                      'inline-flex h-11 w-11 items-center justify-center rounded-xl transition',
                      (isCanvasPanMode || activeTool === 'pan')
                        ? 'bg-(--accent-soft) text-(--accent)'
                        : 'text-(--text-secondary) hover:bg-(--panel) hover:text-(--text-primary)',
                    )}
                  >
                    <Hand size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCanvasZoom(canvasView.zoom / CANVAS_ZOOM_FACTOR, getViewportCenterPointer())}
                    aria-label="Отдалить рабочую область"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-(--text-secondary) transition hover:bg-(--panel) hover:text-(--text-primary)"
                  >
                    <Minus size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetView}
                    aria-label="Сбросить вид рабочей области"
                    className="min-w-16 rounded-xl px-3 py-2 text-sm font-semibold text-(--text-primary) transition hover:bg-(--panel)"
                  >
                    {zoomPercent}%
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCanvasZoom(canvasView.zoom * CANVAS_ZOOM_FACTOR, getViewportCenterPointer())}
                    aria-label="Приблизить рабочую область"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-(--text-secondary) transition hover:bg-(--panel) hover:text-(--text-primary)"
                  >
                    <Plus size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetView}
                    aria-label="Сбросить масштаб и позицию рабочей области"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-(--text-secondary) transition hover:bg-(--panel) hover:text-(--text-primary)"
                  >
                    <RotateCcw size={16} strokeWidth={2} />
                    Сброс
                  </button>
                  <button
                    type="button"
                    onClick={handleFitToContent}
                    aria-label="Показать все блоки рабочей области"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-(--text-secondary) transition hover:bg-(--panel) hover:text-(--text-primary)"
                  >
                    Показать всё
                  </button>
                  <button
                    type="button"
                    onClick={onToggleFullscreen}
                    aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Открыть рабочее пространство на весь экран'}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--accent-border) bg-(--panel) text-(--accent) transition hover:bg-(--panel)"
                  >
                    {isFullscreen ? <Minimize2 size={18} strokeWidth={2} /> : <Expand size={18} strokeWidth={2} />}
                  </button>
                  </div>
                </div>
              </div>
            ) : null}
            {showDesktopCanvasEmptyHint ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
                <div className="pointer-events-auto rounded-3xl border border-dashed border-(--border) bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] px-6 py-5 text-center shadow-(--shadow-soft)">
                  <h2 className="text-lg font-semibold text-(--text-primary)">{blocks.length === 0 ? 'Рабочая область пустая' : 'В этом фильтре пока нет блоков'}</h2>
                  <p className="mt-2 text-sm text-(--text-secondary)">{blocks.length === 0 ? 'Выберите инструмент или нажмите «Добавить элемент».' : 'Смените фильтр раздела или добавьте новый блок.'}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {filterEmpty ? (
                      <button type="button" className="ui-button px-4 py-2 text-sm" onClick={() => onSelectSectionFilter?.('all')}>
                        Показать все блоки
                      </button>
                    ) : null}
                    <button type="button" className="ui-button-accent px-4 py-2 text-sm" onClick={handleAddElement}>
                      Добавить элемент
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {import.meta.env.DEV ? (
              <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-(--border) bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] px-3 py-2 text-xs text-(--text-secondary) shadow-(--shadow-soft)">
                blocks: {filteredBlocks.length}/{blocks.length} · zoom: {zoomPercent}% · pan: {Math.round(canvasView.panX)} / {Math.round(canvasView.panY)} · viewport: {viewportSize.width}x{viewportSize.height} · world: {canvasWorldWidth ?? 0}x{canvasWorldHeight ?? 0} · filter: {activeSectionFilter}
              </div>
            ) : null}
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-2xl border border-(--border) bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] px-3 py-2 text-xs text-(--text-secondary) shadow-(--shadow-soft)">
              Wheel: zoom · Space + drag: pan · Middle mouse: pan
            </div>
            <div
              className="absolute left-0 top-0"
              style={{
                width: canvasWorldWidth,
                minWidth: WORLD_MIN_WIDTH,
                height: canvasWorldHeight,
                minHeight: WORLD_MIN_HEIGHT,
                transform: `translate(${canvasView.panX}px, ${canvasView.panY}px) scale(${canvasView.zoom})`,
                transformOrigin: '0 0',
                backgroundImage: 'linear-gradient(to right, var(--canvas-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--canvas-grid) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                backgroundPosition: '0 0',
              }}
            >
              {resolvedRelations.length > 0 ? (
                <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                  <defs>
                    <marker id="workspace-relation-arrow" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto" markerUnits="strokeWidth">
                      <path d="M0 0L7 3.5L0 7" fill="none" stroke="context-stroke" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                  </defs>
                  {resolvedRelations.map((relation) => {
                    const isSelected = relation.id === selectedRelationId
                    const isConnectedToSelectedBlock = Boolean(
                      selectedBlockId
                      && (relation.fromBlockId === selectedBlockId || relation.toBlockId === selectedBlockId),
                    )
                    const hasActiveBlockSelection = Boolean(selectedBlockId)

                    const defaultStroke = 'color-mix(in srgb, var(--text-muted) 48%, var(--border))'
                    const connectedStroke = 'var(--accent)'

                    if (relation.type === 'hierarchy') {
                      const verticalDistance = relation.toTopY - relation.fromBottomY
                      const hierarchyStroke = isSelected
                        ? 'var(--accent)'
                        : isConnectedToSelectedBlock
                          ? connectedStroke
                          : defaultStroke
                      const hierarchyOpacity = isSelected
                        ? 0.95
                        : isConnectedToSelectedBlock
                          ? 0.94
                          : hasActiveBlockSelection
                            ? 0.34
                            : 0.58
                      const hierarchyWidth = isSelected
                        ? 2.6
                        : isConnectedToSelectedBlock
                          ? 2.2
                          : 1.7

                      if (verticalDistance >= 20) {
                        const midY = relation.fromBottomY + Math.max(24, verticalDistance / 2)
                        const hierarchyPath = [
                          `M ${relation.fromBottomX} ${relation.fromBottomY}`,
                          `L ${relation.fromBottomX} ${midY}`,
                          `L ${relation.toTopX} ${midY}`,
                          `L ${relation.toTopX} ${relation.toTopY}`,
                        ].join(' ')

                        return (
                          <path
                            key={relation.id}
                            d={hierarchyPath}
                            fill="none"
                            stroke={hierarchyStroke}
                            strokeOpacity={hierarchyOpacity}
                            strokeWidth={hierarchyWidth}
                            markerEnd="url(#workspace-relation-arrow)"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )
                      }

                      const horizontalDistance = relation.toLeftX - relation.fromRightX
                      const midX = relation.fromRightX + Math.max(32, horizontalDistance / 2)
                      const hierarchyPath = [
                        `M ${relation.fromRightX} ${relation.fromRightY}`,
                        `L ${midX} ${relation.fromRightY}`,
                        `L ${midX} ${relation.toLeftY}`,
                        `L ${relation.toLeftX} ${relation.toLeftY}`,
                      ].join(' ')

                      return (
                        <path
                          key={relation.id}
                          d={hierarchyPath}
                          fill="none"
                          stroke={hierarchyStroke}
                          strokeOpacity={hierarchyOpacity}
                          strokeWidth={hierarchyWidth}
                          markerEnd="url(#workspace-relation-arrow)"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )
                    }

                    return (
                      <line
                        key={relation.id}
                        x1={relation.fromX}
                        y1={relation.fromY}
                        x2={relation.toX}
                        y2={relation.toY}
                        stroke={
                          isSelected
                            ? 'var(--accent)'
                            : isConnectedToSelectedBlock
                              ? connectedStroke
                              : defaultStroke
                        }
                        strokeOpacity={
                          isSelected
                            ? 0.92
                            : isConnectedToSelectedBlock
                              ? 0.94
                              : hasActiveBlockSelection
                                ? 0.34
                                : 0.58
                        }
                        strokeWidth={
                          isSelected
                            ? 2.4
                            : isConnectedToSelectedBlock
                              ? 2.1
                              : 1.65
                        }
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
                  mode="canvas"
                  onSelect={(blockId) => {
                    if (activeTool === 'pan' || isSpacePressed || Boolean(panState)) {
                      return
                    }

                    onSelectBlock?.(blockId)
                  }}
                  onEdit={onEditBlock}
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
        )}
      </div>
    </section>
  )
}