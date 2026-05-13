import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/projects/EmptyState'
import { ProjectAddElementSheet } from '../components/projects/ProjectAddElementSheet'
import { ProjectAttachmentUploader, type ProjectAttachmentFormValues } from '../components/projects/ProjectAttachmentUploader'
import { ProjectAddRelationSheet } from '../components/projects/ProjectAddRelationSheet'
import { ProjectFilesTab } from '../components/projects/ProjectFilesTab'
import { ProjectGoalsTab, type ProjectGoalFormValues } from '../components/projects/ProjectGoalsTab'
import { ProjectHeader } from '../components/projects/ProjectHeader'
import { ProjectIdeasTab } from '../components/projects/ProjectIdeasTab'
import { ProjectInspector } from '../components/projects/ProjectInspector'
import { ProjectNotesTab } from '../components/projects/ProjectNotesTab'
import { ProjectOverviewTab } from '../components/projects/ProjectOverviewTab'
import { ProjectSectionList } from '../components/projects/ProjectSectionList'
import { ProjectSettingsTab, type ProjectSettingsValues } from '../components/projects/ProjectSettingsTab'
import { ProjectTabs } from '../components/projects/ProjectTabs'
import type { ProjectSurfaceTab } from '../components/projects/ProjectTabs'
import { ProjectActivityTab } from '../components/projects/ProjectActivityTab'
import { ProjectMilestonesPanel, type ProjectMilestoneFormValues } from '../components/projects/ProjectMilestonesPanel'
import { ProjectTasksTab } from '../components/projects/ProjectTasksTab'
import { ProjectToolbar } from '../components/projects/ProjectToolbar'
import { createProjectSection } from '../components/projects/projectMeta'
import { ProjectWorkspace } from '../components/projects/ProjectWorkspace'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type {
  FileItem,
  Goal,
  Idea,
  Note,
  Project,
  ProjectActivity,
  ProjectAttachment,
  ProjectGoal,
  ProjectMilestone,
  ProjectSection,
  ProjectWorkspaceBlock,
  ProjectWorkspaceRelation,
  ProjectWorkspaceTemplatePreset,
  Relation,
  RelationEntityType,
  Task,
} from '../types'
import {
  normalizeGoal,
  normalizeIdea,
  normalizeNote,
  normalizeProjectAttachment,
  normalizeProjectActivity,
  normalizeProjectGoal,
  normalizeProjectMilestone,
  normalizeProject,
  normalizeProjectSection,
  normalizeTask,
  normalizeProjectWorkspaceBlock,
  normalizeProjectWorkspaceRelation,
} from '../utils/normalizeEntities'
import type { RelationSelectableItem } from '../utils/relations'
import {
  buildRelationCatalog,
  deleteRelationsForItem,
  getLinkedItemPath,
  getLinkedItemsFromRelations,
  isEditableRelation,
  syncRelationsForItem,
} from '../utils/relations'
import { calculateGoalProgress, calculateProjectProgress, getProjectStats } from '../utils/projectProgress'
import { cn } from '../utils/cn'
import { storageKeys } from '../utils/storage'

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

function resolveProjectTab(value: string | null | undefined): ProjectSurfaceTab {
  switch (value) {
    case 'overview':
    case 'workspace':
    case 'tasks':
    case 'materials':
    case 'progress':
    case 'settings':
      return value
    case 'notes':
    case 'ideas':
    case 'files':
      return 'materials'
    case 'goals':
    case 'activity':
      return 'progress'
    case 'relations':
    case 'map':
      return 'workspace'
    default:
      return 'overview'
  }
}

function toDeadlineValue(value: string) {
  if (!value) {
    return null
  }

  return new Date(`${value}T12:00:00`).toISOString()
}

function getNextOrder(items: ProjectSection[], projectId: string, parentSectionId: string | null, kind?: 'section' | 'block') {
  return items.filter((item) => {
    if (item.projectId !== projectId || item.parentSectionId !== parentSectionId) {
      return false
    }

    if (kind === 'section') {
      return item.kind === 'section'
    }

    if (kind === 'block') {
      return item.kind !== 'section'
    }

    return true
  }).length
}

function getBlockRelationType(kind: ProjectSection['kind']): RelationEntityType | null {
  switch (kind) {
    case 'task':
    case 'note':
    case 'idea':
    case 'goal':
      return kind
    case 'file':
    case 'photo':
    case 'link':
      return 'file'
    default:
      return null
  }
}

function createDeterministicRelationId(projectId: string, sourceId: string, targetId: string, label: string) {
  return `project:${projectId}:${label}:${[sourceId, targetId].sort().join(':')}`
}

function getSuggestedWorkspaceRelationType(
  fromBlock: ProjectWorkspaceBlock,
  toBlock: ProjectWorkspaceBlock,
): ProjectWorkspaceRelation['type'] {
  if (fromBlock.visualVariant || toBlock.visualVariant) {
    return 'hierarchy'
  }

  if (fromBlock.type === 'idea' && toBlock.type === 'task') {
    return 'idea_to_task'
  }

  if (fromBlock.type === 'note' && toBlock.type === 'task') {
    return 'note_to_task'
  }

  if (fromBlock.type === 'file') {
    return 'file_to_block'
  }

  if (fromBlock.type === 'goal' && toBlock.type === 'task') {
    return 'goal_to_task'
  }

  return 'related'
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { settings } = useAppSettings()
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: sections, setValue: setSections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: projectWorkspaceBlocks, setValue: setProjectWorkspaceBlocks } = useLocalStorage<ProjectWorkspaceBlock[]>(storageKeys.projectWorkspaceBlocks, [])
  const { value: projectWorkspaceRelations, setValue: setProjectWorkspaceRelations } = useLocalStorage<ProjectWorkspaceRelation[]>(storageKeys.projectWorkspaceRelations, [])
  const { value: projectAttachments, setValue: setProjectAttachments } = useLocalStorage<ProjectAttachment[]>(storageKeys.projectAttachments, [])
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas, setValue: setIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: files, setValue: setFiles } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: goals, setValue: setGoals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: projectGoals, setValue: setProjectGoals } = useLocalStorage<ProjectGoal[]>(storageKeys.projectGoals, [])
  const { value: projectMilestones, setValue: setProjectMilestones } = useLocalStorage<ProjectMilestone[]>(storageKeys.projectMilestones, [])
  const { value: projectActivities, setValue: setProjectActivities } = useLocalStorage<ProjectActivity[]>(storageKeys.projectActivities, [])
  const { value: relations, setValue: setRelations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [workspaceSectionFilter, setWorkspaceSectionFilter] = useState<string>('all')
  const [isAddElementSheetOpen, setIsAddElementSheetOpen] = useState(false)
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false)
  const [isAddRelationSheetOpen, setIsAddRelationSheetOpen] = useState(false)
  const [materialsFilter, setMaterialsFilter] = useState<'all' | 'notes' | 'ideas' | 'files' | 'links'>('all')
  const [attachmentEditor, setAttachmentEditor] = useState<{
    mode: 'image' | 'file' | 'link'
    attachmentId?: string | null
  } | null>(null)
  const [isWorkspaceInspectorVisible, setIsWorkspaceInspectorVisible] = useState(true)
  const [isWorkspaceFullscreen, setIsWorkspaceFullscreen] = useState(false)
  const [isWorkspaceToolbarVisible, setIsWorkspaceToolbarVisible] = useState(true)
  const [selectedWorkspaceBlockId, setSelectedWorkspaceBlockId] = useState<string | null>(null)
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null)
  const [isWorkspaceCanvasInteracting, setIsWorkspaceCanvasInteracting] = useState(false)
  const [workspaceInspectorPosition, setWorkspaceInspectorPosition] = useState({ x: 0, y: 0 })
  const [workspaceInspectorWidth, setWorkspaceInspectorWidth] = useState(360)
  const [workspaceInspectorHeight, setWorkspaceInspectorHeight] = useState(680)
  const [workspaceCanvasView, setWorkspaceCanvasView] = useState({ zoom: 1, panX: 0, panY: 0 })
  const [workspaceResetViewSignal, setWorkspaceResetViewSignal] = useState(0)
  const [workspaceArrangeSignal, setWorkspaceArrangeSignal] = useState(0)
  const [isWorkspaceInspectorPositionReady, setIsWorkspaceInspectorPositionReady] = useState(false)
  const [workspaceInspectorDragState, setWorkspaceInspectorDragState] = useState<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [workspaceInspectorResizeState, setWorkspaceInspectorResizeState] = useState<{
    pointerId: number
    startX: number
    startY: number
    originWidth: number
    originHeight: number
  } | null>(null)
  const [relationSourceBlockId, setRelationSourceBlockId] = useState<string | null>(null)
  const [relationDraft, setRelationDraft] = useState<{
    fromBlockId: string
    toBlockId: string
    type: ProjectWorkspaceRelation['type']
    label?: string
  } | null>(null)
  const workspaceShellRef = useRef<HTMLDivElement | null>(null)
  const workspaceLayoutRef = useRef<HTMLElement | null>(null)
  const [relationNotice, setRelationNotice] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [workspaceAvailableHeight, setWorkspaceAvailableHeight] = useState<number | null>(null)

  const activeTab = resolveProjectTab(searchParams.get('tab') ?? settings.behavior.defaultProjectView)
  const normalizedProjects = useMemo(() => projects.map(normalizeProject), [projects])
  const normalizedTasks = useMemo(() => tasks.map(normalizeTask), [tasks])
  const normalizedNotes = useMemo(() => notes.map(normalizeNote), [notes])
  const normalizedIdeas = useMemo(() => ideas.map(normalizeIdea), [ideas])
  const normalizedGoals = useMemo(() => goals.map(normalizeGoal), [goals])
  const normalizedProjectGoals = useMemo(() => projectGoals.map(normalizeProjectGoal), [projectGoals])
  const normalizedProjectMilestones = useMemo(() => projectMilestones.map(normalizeProjectMilestone), [projectMilestones])
  const normalizedProjectAttachments = useMemo(() => projectAttachments.map(normalizeProjectAttachment), [projectAttachments])
  const normalizedProjectActivities = useMemo(() => projectActivities.map(normalizeProjectActivity), [projectActivities])
  const normalizedSections = useMemo(() => sections.map(normalizeProjectSection), [sections])
  const normalizedWorkspaceBlocks = useMemo(() => projectWorkspaceBlocks.map((block) => normalizeProjectWorkspaceBlock(block)), [projectWorkspaceBlocks])
  const normalizedWorkspaceRelations = useMemo(() => projectWorkspaceRelations.map((relation) => normalizeProjectWorkspaceRelation(relation)), [projectWorkspaceRelations])

  const project = useMemo(() => normalizedProjects.find((item) => item.id === projectId) ?? null, [normalizedProjects, projectId])
  const projectSections = useMemo(() => normalizedSections.filter((item) => item.projectId === projectId && item.kind === 'section').sort((a, b) => a.order - b.order), [normalizedSections, projectId])
  const projectSectionBlocks = useMemo(() => normalizedSections.filter((item) => item.projectId === projectId && item.kind !== 'section').sort((a, b) => a.order - b.order), [normalizedSections, projectId])
  const workspaceBlocks = useMemo(() => normalizedWorkspaceBlocks.filter((item) => item.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [normalizedWorkspaceBlocks, projectId])
  const workspaceRelationsForProject = useMemo(() => normalizedWorkspaceRelations.filter((relation) => relation.projectId === projectId), [normalizedWorkspaceRelations, projectId])
  const projectGoalsForProject = useMemo(() => normalizedProjectGoals.filter((item) => item.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [normalizedProjectGoals, projectId])
  const projectMilestonesForProject = useMemo(() => normalizedProjectMilestones.filter((item) => item.projectId === projectId).sort((a, b) => a.order - b.order), [normalizedProjectMilestones, projectId])

  useEffect(() => {
    if (typeof window === 'undefined' || isWorkspaceInspectorPositionReady) {
      return
    }

    setWorkspaceInspectorPosition({
      x: Math.max(24, window.innerWidth - 384),
      y: 132,
    })
    setWorkspaceInspectorHeight(Math.min(680, Math.max(460, window.innerHeight - 180)))
    setIsWorkspaceInspectorPositionReady(true)
  }, [isWorkspaceInspectorPositionReady])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      setWorkspaceInspectorPosition((current) => ({
        x: Math.min(Math.max(24, current.x), Math.max(24, window.innerWidth - 384)),
        y: Math.min(Math.max(112, current.y), Math.max(112, window.innerHeight - 180)),
      }))
      setWorkspaceInspectorHeight((current) => Math.min(Math.max(420, current), Math.max(420, window.innerHeight - 140)))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handleFullscreenChange = () => {
      setIsWorkspaceFullscreen(document.fullscreenElement === workspaceShellRef.current)
    }

    handleFullscreenChange()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!isWorkspaceFullscreen) {
      return
    }

    setIsWorkspaceInspectorVisible(true)
    setIsWorkspaceToolbarVisible(true)
  }, [isWorkspaceFullscreen])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (activeTab !== 'workspace' || isWorkspaceFullscreen) {
      setWorkspaceAvailableHeight(null)
      return
    }

    const element = workspaceLayoutRef.current

    if (!element) {
      setWorkspaceAvailableHeight(null)
      return
    }

    const updateWorkspaceHeight = () => {
      if (window.innerWidth < 1024) {
        setWorkspaceAvailableHeight(null)
        return
      }

      const rect = element.getBoundingClientRect()
      const nextHeight = Math.max(320, Math.floor(window.innerHeight - rect.top - 8))
      setWorkspaceAvailableHeight(nextHeight)
    }

    updateWorkspaceHeight()

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateWorkspaceHeight())
      : null

    observer?.observe(element)

    window.addEventListener('resize', updateWorkspaceHeight)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateWorkspaceHeight)
    }
  }, [activeTab, isWorkspaceFullscreen])

  function clampWorkspaceInspectorPosition(x: number, y: number) {
    if (typeof window === 'undefined') {
      return { x, y }
    }

    return {
      x: Math.min(Math.max(24, x), Math.max(24, window.innerWidth - 384)),
      y: Math.min(Math.max(112, y), Math.max(112, window.innerHeight - 180)),
    }
  }

  function shouldIgnoreWorkspaceInspectorDragTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    return Boolean(target.closest('button, a, input, textarea, select, option, label, [role="button"], [contenteditable="true"]'))
  }

  function handleWorkspaceInspectorDragStart(event: ReactPointerEvent<HTMLElement>) {
    if (shouldIgnoreWorkspaceInspectorDragTarget(event.target)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setWorkspaceInspectorDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: workspaceInspectorPosition.x,
      originY: workspaceInspectorPosition.y,
    })
  }

  function handleWorkspaceInspectorDragMove(event: ReactPointerEvent<HTMLElement>) {
    if (!workspaceInspectorDragState || workspaceInspectorDragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const deltaX = event.clientX - workspaceInspectorDragState.startX
    const deltaY = event.clientY - workspaceInspectorDragState.startY
    setWorkspaceInspectorPosition(clampWorkspaceInspectorPosition(
      workspaceInspectorDragState.originX + deltaX,
      workspaceInspectorDragState.originY + deltaY,
    ))
  }

  function handleWorkspaceInspectorDragEnd(event: ReactPointerEvent<HTMLElement>) {
    if (!workspaceInspectorDragState || workspaceInspectorDragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setWorkspaceInspectorDragState(null)
  }
  const projectAttachmentsForProject = useMemo(() => normalizedProjectAttachments.filter((item) => item.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [normalizedProjectAttachments, projectId])
  const selectedWorkspaceBlock = useMemo(() => workspaceBlocks.find((item) => item.id === selectedWorkspaceBlockId) ?? null, [selectedWorkspaceBlockId, workspaceBlocks])
  const selectedAttachment = useMemo(() => {
    if (!selectedWorkspaceBlock?.linkedItemId || selectedWorkspaceBlock.linkedItemType !== 'file') {
      return null
    }

    return projectAttachmentsForProject.find((item) => item.id === selectedWorkspaceBlock.linkedItemId) ?? null
  }, [projectAttachmentsForProject, selectedWorkspaceBlock])
  const editedAttachment = useMemo(() => (attachmentEditor?.attachmentId ? projectAttachmentsForProject.find((item) => item.id === attachmentEditor.attachmentId) ?? null : null), [attachmentEditor?.attachmentId, projectAttachmentsForProject])
  const selectedWorkspaceRelation = useMemo(() => workspaceRelationsForProject.find((relation) => relation.id === selectedRelationId) ?? null, [selectedRelationId, workspaceRelationsForProject])
  const blockCounts = useMemo(() => Object.fromEntries(projectSections.map((section) => [section.id, projectSectionBlocks.filter((block) => block.parentSectionId === section.id).length])), [projectSectionBlocks, projectSections])
  const projectSectionIds = useMemo(() => new Set(projectSections.map((section) => section.id)), [projectSections])
  const linkedTasks = useMemo(() => (project ? normalizedTasks.filter((item) => item.projectId === project.id) : []), [normalizedTasks, project])
  const linkedNotes = useMemo(() => (project ? normalizedNotes.filter((item) => item.projectId === project.id) : []), [normalizedNotes, project])
  const linkedIdeas = useMemo(() => (project ? normalizedIdeas.filter((item) => item.projectId === project.id) : []), [normalizedIdeas, project])
  const linkedFiles = useMemo(() => projectAttachmentsForProject, [projectAttachmentsForProject])
  const projectActivityFeed = useMemo(() => (project ? normalizedProjectActivities.filter((item) => item.projectId === project.id) : []), [normalizedProjectActivities, project])
  const editableRelations = useMemo(() => relations.filter(isEditableRelation), [relations])
  const relationCatalog = useMemo(() => buildRelationCatalog({ tasks, projects, notes: normalizedNotes, ideas: normalizedIdeas, files, goals: normalizedGoals, sections: normalizedSections }), [files, normalizedGoals, normalizedIdeas, normalizedNotes, normalizedSections, projects, tasks])
  const availableRelationItems = useMemo(() => relationCatalog.filter((item) => !(item.type === 'project' && item.id === project?.id)), [project?.id, relationCatalog])
  const linkedEntityByBlock = useMemo(() => {
    const taskMap = new Map(tasks.map((item) => [item.id, item]))
    const noteMap = new Map(normalizedNotes.map((item) => [item.id, item]))
    const ideaMap = new Map(normalizedIdeas.map((item) => [item.id, item]))
    const fileMap = new Map(files.map((item) => [item.id, item]))
    const projectAttachmentMap = new Map(projectAttachmentsForProject.map((item) => [item.id, item]))
    const goalMap = new Map(normalizedGoals.map((item) => [item.id, item]))
    const projectGoalMap = new Map(projectGoalsForProject.map((item) => [item.id, item]))

    if (!selectedWorkspaceBlock?.linkedItemType || !selectedWorkspaceBlock.linkedItemId) {
      return null
    }

    const linkedType = selectedWorkspaceBlock.linkedItemType
    const linkedId = selectedWorkspaceBlock.linkedItemId

    switch (linkedType) {
      case 'task': {
        const linkedTask = taskMap.get(linkedId)
        return linkedTask
          ? { id: linkedTask.id, type: 'task' as const, title: linkedTask.title, exists: true, canOpen: true }
          : { id: linkedId, type: 'task' as const, title: 'Связанная задача не найдена', exists: false, canOpen: true }
      }
      case 'note': {
        const linkedNote = noteMap.get(linkedId)
        return linkedNote
          ? { id: linkedNote.id, type: 'note' as const, title: linkedNote.title, exists: true, canOpen: true }
          : { id: linkedId, type: 'note' as const, title: 'Связанная заметка не найдена', exists: false, canOpen: true }
      }
      case 'idea': {
        const linkedIdea = ideaMap.get(linkedId)
        return linkedIdea
          ? { id: linkedIdea.id, type: 'idea' as const, title: linkedIdea.title, exists: true, canOpen: true }
          : { id: linkedId, type: 'idea' as const, title: 'Связанная идея не найдена', exists: false, canOpen: true }
      }
      case 'file': {
        const linkedAttachment = projectAttachmentMap.get(linkedId)

        if (linkedAttachment) {
          return { id: linkedAttachment.id, type: 'file' as const, title: linkedAttachment.title, exists: true, canOpen: false }
        }

        const linkedFile = fileMap.get(linkedId)
        return linkedFile
          ? { id: linkedFile.id, type: 'file' as const, title: linkedFile.title, exists: true, canOpen: true }
          : { id: linkedId, type: 'file' as const, title: 'Связанный файл не найден', exists: false, canOpen: true }
      }
      case 'goal': {
        const linkedProjectGoal = projectGoalMap.get(linkedId)

        if (linkedProjectGoal) {
          return { id: linkedProjectGoal.id, type: 'goal' as const, title: linkedProjectGoal.title, exists: true, canOpen: false }
        }

        const linkedGoal = goalMap.get(linkedId)
        return linkedGoal
          ? { id: linkedGoal.id, type: 'goal' as const, title: linkedGoal.title, exists: true, canOpen: true }
          : { id: linkedId, type: 'goal' as const, title: 'Связанная цель не найдена', exists: false, canOpen: true }
      }
      default:
        return null
    }
  }, [files, normalizedGoals, normalizedIdeas, normalizedNotes, projectAttachmentsForProject, projectGoalsForProject, selectedWorkspaceBlock, tasks])
  const projectRelations = useMemo<Relation[]>(() => {
    if (!project) {
      return []
    }

    const blockById = new Map(projectSectionBlocks.map((block) => [block.id, block]))
    const nextRelations: Relation[] = []

    projectSectionBlocks.forEach((block) => {
      const blockRelationType = getBlockRelationType(block.kind)

      if (block.parentSectionId && block.entityId && blockRelationType) {
        nextRelations.push({
          id: createDeterministicRelationId(project.id, block.parentSectionId, block.entityId, 'section'),
          sourceId: block.parentSectionId,
          sourceType: 'project_section',
          targetId: block.entityId,
          targetType: blockRelationType,
          label: 'section_contains',
          createdAt: block.updatedAt,
        })
      }

      if (!block.entityId || !blockRelationType) {
        return
      }

      const sourceEntityId = block.entityId

      block.relatedBlockIds.forEach((relatedBlockId) => {
        const relatedBlock = blockById.get(relatedBlockId)

        if (!relatedBlock?.entityId) {
          return
        }

        const relatedType = getBlockRelationType(relatedBlock.kind)

        if (!relatedType) {
          return
        }

        const relationId = createDeterministicRelationId(project.id, sourceEntityId, relatedBlock.entityId, 'related')

        if (nextRelations.some((relation) => relation.id === relationId)) {
          return
        }

        nextRelations.push({
          id: relationId,
          sourceId: sourceEntityId,
          sourceType: blockRelationType,
          targetId: relatedBlock.entityId,
          targetType: relatedType,
          label: 'related',
          createdAt: block.updatedAt,
        })
      })
    })

    return nextRelations
  }, [project, projectSectionBlocks])
  const completionRate = useMemo(() => calculateProjectProgress(projectId ?? '', linkedTasks, projectGoalsForProject, projectMilestonesForProject), [linkedTasks, projectGoalsForProject, projectId, projectMilestonesForProject])
  const projectStats = useMemo(() => getProjectStats(projectId ?? '', {
    tasks,
    goals: projectGoals,
    milestones: projectMilestones,
    notesCount: linkedNotes.length,
    ideas: linkedIdeas,
    filesCount: linkedFiles.length,
    workspaceBlocks,
    activities: projectActivityFeed,
  }), [linkedFiles.length, linkedIdeas, linkedNotes.length, projectActivityFeed, projectGoals, projectId, projectMilestones, tasks, workspaceBlocks])
  const projectTagSuggestions = useMemo(
    () => Array.from(new Set([
      ...(project?.tags ?? []),
      ...linkedTasks.flatMap((task) => task.tags),
      ...linkedNotes.flatMap((note) => note.tags),
      ...linkedIdeas.flatMap((idea) => idea.tags),
      ...projectGoalsForProject.flatMap((goal) => goal.tags),
      ...linkedFiles.flatMap((file) => file.tags),
    ])).filter(Boolean),
    [linkedFiles, linkedIdeas, linkedNotes, linkedTasks, project?.tags, projectGoalsForProject],
  )
  const projectTabCounts = useMemo(
    () => ({
      tasks: linkedTasks.length,
      materials: linkedNotes.length + linkedIdeas.length + linkedFiles.length,
      progress: projectGoalsForProject.length + projectMilestonesForProject.length + linkedTasks.filter((task) => task.status === 'completed').length + projectActivityFeed.length,
      blocks: workspaceBlocks.length,
    }),
    [linkedFiles.length, linkedIdeas.length, linkedNotes.length, linkedTasks, projectActivityFeed.length, projectGoalsForProject.length, projectMilestonesForProject.length, workspaceBlocks.length],
  )
  const progressMetrics = useMemo(() => {
    const completedTasks = linkedTasks.filter((task) => task.status === 'completed').length
    const activeTasks = linkedTasks.filter((task) => task.status !== 'completed').length
    const overdueTasks = linkedTasks.filter((task) => task.deadline && task.status !== 'completed' && new Date(task.deadline).getTime() < Date.now()).length
    const materialsAdded = linkedNotes.length + linkedIdeas.length + linkedFiles.length
    const activeDays = new Set(projectActivityFeed.map((activity) => new Date(activity.createdAt).toISOString().slice(0, 10))).size

    return {
      completedTasks,
      activeTasks,
      overdueTasks,
      materialsAdded,
      blocks: workspaceBlocks.length,
      activeDays,
    }
  }, [linkedFiles.length, linkedIdeas.length, linkedNotes.length, linkedTasks, projectActivityFeed, workspaceBlocks.length])
  const materialLinks = useMemo(() => linkedFiles.filter((file) => file.type === 'link'), [linkedFiles])
  const materialFiles = useMemo(() => linkedFiles.filter((file) => file.type !== 'link'), [linkedFiles])

  function handleOpenAddMaterialModal() {
    setIsAddMaterialModalOpen(true)
  }

  function handleCreateMaterial(type: 'note' | 'idea' | 'file' | 'link') {
    setIsAddMaterialModalOpen(false)

    if (type === 'file' || type === 'link') {
      openAttachmentUploader(type)
      return
    }

    handleCreateWorkspaceBlock(type)
  }

  const selectedBlockRelations = useMemo(() => {
    if (!selectedWorkspaceBlock) {
      return { outgoing: [], incoming: [] }
    }

    const blockById = new Map(workspaceBlocks.map((block) => [block.id, block]))

    return {
      outgoing: workspaceRelationsForProject
        .filter((relation) => relation.fromBlockId === selectedWorkspaceBlock.id)
        .map((relation) => ({
          relationId: relation.id,
          type: relation.type,
          label: relation.label,
          relatedBlockId: relation.toBlockId,
          relatedBlockTitle: blockById.get(relation.toBlockId)?.title ?? 'Блок удалён',
        })),
      incoming: workspaceRelationsForProject
        .filter((relation) => relation.toBlockId === selectedWorkspaceBlock.id)
        .map((relation) => ({
          relationId: relation.id,
          type: relation.type,
          label: relation.label,
          relatedBlockId: relation.fromBlockId,
          relatedBlockTitle: blockById.get(relation.fromBlockId)?.title ?? 'Блок удалён',
        })),
    }
  }, [selectedWorkspaceBlock, workspaceBlocks, workspaceRelationsForProject])

  useEffect(() => {
    if (!relationNotice) {
      return
    }

    const timeoutId = window.setTimeout(() => setRelationNotice(null), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [relationNotice])

  useEffect(() => {
    if (selectedRelationId && !selectedWorkspaceRelation) {
      setSelectedRelationId(null)
    }
  }, [selectedRelationId, selectedWorkspaceRelation])

  useEffect(() => {
    if (workspaceSectionFilter === 'all' || workspaceSectionFilter === 'none') {
      return
    }

    if (!projectSectionIds.has(workspaceSectionFilter)) {
      setWorkspaceSectionFilter('all')
    }
  }, [projectSectionIds, workspaceSectionFilter])

  function appendProjectActivity(entry: ProjectActivity) {
    setProjectActivities((current) => [entry, ...current])
  }

  useEffect(() => {
    if (!project) {
      return
    }

    const hasCreatedActivity = projectActivityFeed.some((activity) => activity.type === 'project_created')

    if (hasCreatedActivity) {
      return
    }

    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'project_created',
      title: `Проект создан: ${project.title}`,
      description: project.description,
      relatedItemId: project.id,
      relatedItemType: 'project',
      createdAt: project.createdAt,
    })
  }, [project, projectActivityFeed])

  useEffect(() => {
    if (!project) {
      return
    }

    const completedTaskIds = new Set(projectActivityFeed.filter((activity) => activity.type === 'task_completed' && activity.relatedItemId).map((activity) => activity.relatedItemId as string))
    const completedGoalIds = new Set(projectActivityFeed.filter((activity) => activity.type === 'goal_completed' && activity.relatedItemId).map((activity) => activity.relatedItemId as string))
    const completedMilestoneIds = new Set(projectActivityFeed.filter((activity) => activity.type === 'milestone_completed' && activity.relatedItemId).map((activity) => activity.relatedItemId as string))
    const missingEntries: ProjectActivity[] = []

    linkedTasks.forEach((task) => {
      if (task.status === 'completed' && !completedTaskIds.has(task.id)) {
        missingEntries.push({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'task_completed',
          title: `Завершена задача: ${task.title}`,
          description: task.description,
          relatedItemId: task.id,
          relatedItemType: 'task',
          createdAt: task.completedAt ?? task.updatedAt,
        })
      }
    })

    projectGoalsForProject.forEach((goal) => {
      if ((goal.status === 'completed' || calculateGoalProgress(goal, linkedTasks) >= 100) && !completedGoalIds.has(goal.id)) {
        missingEntries.push({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'goal_completed',
          title: `Цель завершена: ${goal.title}`,
          description: goal.description,
          relatedItemId: goal.id,
          relatedItemType: 'goal',
          createdAt: goal.updatedAt,
        })
      }
    })

    projectMilestonesForProject.forEach((milestone) => {
      if (milestone.status === 'completed' && !completedMilestoneIds.has(milestone.id)) {
        missingEntries.push({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'milestone_completed',
          title: `Этап завершён: ${milestone.title}`,
          description: milestone.description,
          relatedItemId: milestone.id,
          relatedItemType: 'milestone',
          createdAt: milestone.updatedAt,
        })
      }
    })

    if (missingEntries.length === 0) {
      return
    }

    setProjectActivities((current) => [...missingEntries, ...current])
  }, [linkedTasks, project, projectActivityFeed, projectGoalsForProject, projectMilestonesForProject])

  useEffect(() => {
    if (!project) {
      return
    }

    const projectRelationPrefix = `project:${project.id}:`
    const currentProjectRelations = relations.filter((relation) => relation.id.startsWith(projectRelationPrefix)).sort((a, b) => a.id.localeCompare(b.id))
    const nextProjectRelations = [...projectRelations].sort((a, b) => a.id.localeCompare(b.id))

    if (JSON.stringify(currentProjectRelations) === JSON.stringify(nextProjectRelations)) {
      return
    }

    setRelations((currentRelations) => [
      ...currentRelations.filter((relation) => !relation.id.startsWith(projectRelationPrefix)),
      ...projectRelations,
    ])
  }, [project, projectRelations, relations, setRelations])

  function updateProjectLinks(projectPatch: Partial<Pick<Project, 'taskIds' | 'noteIds' | 'ideaIds' | 'fileIds' | 'goalIds' | 'sectionIds'>>) {
    if (!project) {
      return
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id
          ? {
              ...item,
              ...projectPatch,
              taskIds: projectPatch.taskIds ? uniqueIds(projectPatch.taskIds) : item.taskIds,
              noteIds: projectPatch.noteIds ? uniqueIds(projectPatch.noteIds) : item.noteIds,
              ideaIds: projectPatch.ideaIds ? uniqueIds(projectPatch.ideaIds) : item.ideaIds,
              fileIds: projectPatch.fileIds ? uniqueIds(projectPatch.fileIds) : item.fileIds,
              goalIds: projectPatch.goalIds ? uniqueIds(projectPatch.goalIds) : item.goalIds,
              sectionIds: projectPatch.sectionIds ? uniqueIds(projectPatch.sectionIds) : item.sectionIds,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }

  function handleChangeTab(tab: ProjectSurfaceTab) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set('tab', tab)
      return nextParams
    }, { replace: true })
  }

  function handleSaveProjectSettings(values: ProjectSettingsValues) {
    if (!project) {
      return
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id
          ? {
              ...item,
              title: values.title,
              description: values.description,
              details: values.details,
              goal: values.goal,
              status: values.status,
              priority: values.priority,
              deadline: toDeadlineValue(values.deadline),
              tags: values.tags,
              color: values.color,
              icon: values.icon,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'project_updated',
      title: `Обновлены настройки проекта: ${values.title}`,
      description: values.goal,
      relatedItemId: project.id,
      relatedItemType: 'project',
      createdAt: new Date().toISOString(),
    })
  }

  function handleDeleteProject() {
    if (!project) {
      return
    }

    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить проект «${project.title}»? Рабочая поверхность будет очищена, а связанные элементы отвяжутся от проекта.`)
      : true

    if (!shouldDelete) {
      return
    }

    setProjects((currentProjects) => currentProjects.filter((item) => item.id !== project.id))
    setSections((currentSections) => currentSections.filter((item) => item.projectId !== project.id))
    setProjectWorkspaceBlocks((currentBlocks) => currentBlocks.filter((block) => block.projectId !== project.id))
    setProjectWorkspaceRelations((currentRelations) => currentRelations.filter((relation) => relation.projectId !== project.id))
    setProjectAttachments((currentAttachments) => currentAttachments.filter((item) => item.projectId !== project.id))
    setProjectGoals((currentProjectGoals) => currentProjectGoals.filter((item) => item.projectId !== project.id))
    setProjectMilestones((currentProjectMilestones) => currentProjectMilestones.filter((item) => item.projectId !== project.id))
    setProjectActivities((currentActivities) => currentActivities.filter((item) => item.projectId !== project.id))
    setTasks((currentTasks) => currentTasks.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setNotes((currentNotes) => currentNotes.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setIdeas((currentIdeas) => currentIdeas.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setFiles((currentFiles) => currentFiles.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setGoals((currentGoals) => currentGoals.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    deleteRelationsForItem(project.id)
    projectSections.forEach((section) => deleteRelationsForItem(section.id))
    navigate('/projects')
  }

  const workspaceBlockTitles: Record<ProjectWorkspaceBlock['type'], string> = {
    text: 'Новый текстовый блок',
    task: 'Новая задача',
    note: 'Новая заметка',
    idea: 'Новая идея',
    goal: 'Новая цель',
    file: 'Новый файл',
    image: 'Новое изображение',
    link: 'Новая ссылка',
    comment: 'Комментарий',
    drawing: 'Схема / рисунок',
  }

  function handleCreateWorkspaceTemplate(preset: ProjectWorkspaceTemplatePreset) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const sectionId = workspaceSectionFilter !== 'all' && workspaceSectionFilter !== 'none' ? workspaceSectionFilter : null
    const templateOffset = workspaceBlocks.filter((block) => block.projectId === project.id).length * 36

    const createTemplateBlock = (
      title: string,
      x: number,
      y: number,
      width: number,
      height: number,
      visualVariant: NonNullable<ProjectWorkspaceBlock['visualVariant']>,
    ): ProjectWorkspaceBlock => ({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'comment',
      title,
      content: '',
      description: '',
      sectionId,
      visualVariant,
      x: x + templateOffset,
      y,
      width,
      height,
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    let nextBlocks: ProjectWorkspaceBlock[] = []
    let nextRelations: ProjectWorkspaceRelation[] = []

    if (preset === 'hierarchy') {
      const root = createTemplateBlock('Корень схемы', 240, 52, 220, 82, 'template-header')
      const leftNode = createTemplateBlock('Ветка A', 88, 196, 214, 98, 'template-node')
      const rightNode = createTemplateBlock('Ветка B', 396, 196, 214, 98, 'template-node')
      const leftPanel = createTemplateBlock('Группа A', 42, 368, 260, 156, 'template-panel')
      const rightPanel = createTemplateBlock('Группа B', 350, 368, 260, 156, 'template-panel')

      nextBlocks = [root, leftNode, rightNode, leftPanel, rightPanel]
      nextRelations = [
        [root.id, leftNode.id],
        [root.id, rightNode.id],
        [leftNode.id, leftPanel.id],
        [rightNode.id, rightPanel.id],
      ].map(([fromBlockId, toBlockId]) => ({
        id: crypto.randomUUID(),
        projectId: project.id,
        fromBlockId,
        toBlockId,
        type: 'hierarchy' as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
    }

    if (preset === 'comparison') {
      const header = createTemplateBlock('Шапка сравнения', 188, 52, 324, 80, 'template-header')
      const first = createTemplateBlock('Вариант 1', 36, 204, 190, 240, 'template-panel')
      const second = createTemplateBlock('Вариант 2', 256, 204, 190, 240, 'template-panel')
      const third = createTemplateBlock('Вариант 3', 476, 204, 190, 240, 'template-panel')

      nextBlocks = [header, first, second, third]
      nextRelations = [first.id, second.id, third.id].map((toBlockId) => ({
        id: crypto.randomUUID(),
        projectId: project.id,
        fromBlockId: header.id,
        toBlockId,
        type: 'hierarchy' as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
    }

    if (preset === 'roadmap') {
      const stepOne = createTemplateBlock('Шаг 1', 36, 220, 148, 116, 'template-step')
      const stepTwo = createTemplateBlock('Шаг 2', 220, 220, 148, 116, 'template-step')
      const stepThree = createTemplateBlock('Шаг 3', 404, 220, 148, 116, 'template-step')
      const stepFour = createTemplateBlock('Шаг 4', 588, 220, 148, 116, 'template-step')

      nextBlocks = [stepOne, stepTwo, stepThree, stepFour]
      nextRelations = [
        [stepOne.id, stepTwo.id],
        [stepTwo.id, stepThree.id],
        [stepThree.id, stepFour.id],
      ].map(([fromBlockId, toBlockId]) => ({
        id: crypto.randomUUID(),
        projectId: project.id,
        fromBlockId,
        toBlockId,
        type: 'hierarchy' as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
    }

    if (nextBlocks.length === 0) {
      return
    }

    setProjectWorkspaceBlocks((currentBlocks) => [...nextBlocks, ...currentBlocks])
    setProjectWorkspaceRelations((currentRelations) => [...nextRelations, ...currentRelations])
    setSelectedWorkspaceBlockId(nextBlocks[0].id)
    setIsWorkspaceInspectorVisible(true)
    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'workspace_block_created',
      title: 'Добавлена визуальная группа в рабочую область',
      description: preset,
      relatedItemId: nextBlocks[0].id,
      relatedItemType: null,
      createdAt: timestamp,
    })
    setRelationNotice('Визуальная группа добавлена. Связи можно редактировать вручную.')
  }

  function openAttachmentUploader(mode: 'image' | 'file' | 'link', attachmentId?: string | null) {
    setAttachmentEditor({ mode, attachmentId: attachmentId ?? null })
  }

  function resolveAttachmentMode(attachment: ProjectAttachment): 'image' | 'file' | 'link' {
    if (attachment.type === 'image' || attachment.type === 'link') {
      return attachment.type
    }

    return 'file'
  }

  function closeAttachmentUploader() {
    setAttachmentEditor(null)
  }

  function buildWorkspaceBlockFromAttachment(attachment: ProjectAttachment, existingBlock?: ProjectWorkspaceBlock | null): ProjectWorkspaceBlock {
    const timestamp = new Date().toISOString()

    return {
      id: existingBlock?.id ?? crypto.randomUUID(),
      projectId: attachment.projectId ?? project?.id ?? '',
      type: attachment.type === 'image' ? 'image' : attachment.type === 'link' ? 'link' : 'file',
      title: attachment.title,
      content: attachment.description,
      description: attachment.description,
      sectionId: existingBlock?.sectionId ?? null,
      tags: attachment.tags,
      linkedItemId: attachment.id,
      linkedItemType: 'file',
      fileUrl: attachment.url ?? attachment.path,
      previewUrl: attachment.previewUrl ?? undefined,
      dataUrl: attachment.dataUrl ?? undefined,
      fileName: attachment.fileName ?? undefined,
      fileType: attachment.fileType ?? undefined,
      fileSize: attachment.fileSize,
      imageUrl: attachment.type === 'image' ? (attachment.dataUrl ?? attachment.previewUrl ?? undefined) : undefined,
      externalUrl: attachment.externalUrl ?? undefined,
      createdAt: existingBlock?.createdAt ?? timestamp,
      updatedAt: attachment.updatedAt,
      x: existingBlock?.x,
      y: existingBlock?.y,
      width: existingBlock?.width,
      height: existingBlock?.height,
      color: existingBlock?.color,
      icon: existingBlock?.icon,
    }
  }

  function handleCreateAttachment(values: ProjectAttachmentFormValues) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const attachmentId = crypto.randomUUID()
    const blockId = crypto.randomUUID()
    const nextAttachment: ProjectAttachment = {
      id: attachmentId,
      projectId: project.id,
      title: values.title,
      description: values.description,
      type: values.type,
      path: values.fileName ?? values.url ?? values.externalUrl ?? '',
      previewUrl: values.previewUrl ?? null,
      dataUrl: values.dataUrl,
      url: values.url,
      externalUrl: values.externalUrl,
      fileName: values.fileName,
      fileType: values.fileType,
      fileSize: values.fileSize,
      tags: values.tags,
      linkedBlockId: blockId,
      uploadStatus: 'local',
      createdAt: timestamp,
      updatedAt: timestamp,
      taskId: null,
      noteId: null,
      ideaId: null,
    }

    const nextBlock = buildWorkspaceBlockFromAttachment(nextAttachment, {
      id: blockId,
      projectId: project.id,
      type: nextAttachment.type === 'image' ? 'image' : nextAttachment.type === 'link' ? 'link' : 'file',
      title: nextAttachment.title,
      description: nextAttachment.description,
      content: nextAttachment.description,
      sectionId: workspaceSectionFilter !== 'all' && workspaceSectionFilter !== 'none' ? workspaceSectionFilter : null,
      tags: nextAttachment.tags,
      linkedItemId: nextAttachment.id,
      linkedItemType: 'file',
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    setProjectAttachments((currentAttachments) => [nextAttachment, ...currentAttachments])
    setProjectWorkspaceBlocks((currentBlocks) => [nextBlock, ...currentBlocks])
    setSelectedWorkspaceBlockId(nextBlock.id)
    setIsWorkspaceInspectorVisible(true)
    setProjectActivities((current) => [
      {
        id: crypto.randomUUID(),
        projectId: project.id,
        type: 'file_added',
        title: `Добавлен материал: ${nextAttachment.title}`,
        description: values.type,
        relatedItemId: nextAttachment.id,
        relatedItemType: 'file',
        createdAt: timestamp,
      },
      ...current,
    ])
  }

  function handleUpdateAttachment(attachmentId: string, values: ProjectAttachmentFormValues) {
    const currentAttachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

    if (!currentAttachment) {
      return
    }

    const timestamp = new Date().toISOString()
    const nextAttachment: ProjectAttachment = {
      ...currentAttachment,
      title: values.title,
      description: values.description,
      type: values.type,
      path: values.fileName ?? values.url ?? values.externalUrl ?? currentAttachment.path,
      previewUrl: values.previewUrl ?? currentAttachment.previewUrl,
      dataUrl: values.dataUrl ?? currentAttachment.dataUrl,
      url: values.url ?? currentAttachment.url,
      externalUrl: values.externalUrl ?? undefined,
      fileName: values.fileName ?? currentAttachment.fileName,
      fileType: values.fileType ?? currentAttachment.fileType,
      fileSize: values.fileSize ?? currentAttachment.fileSize,
      tags: values.tags,
      updatedAt: timestamp,
    }

    setProjectAttachments((currentAttachments) => currentAttachments.map((item) => (item.id === attachmentId ? nextAttachment : item)))
    setProjectWorkspaceBlocks((currentBlocks) => currentBlocks.map((block) => block.linkedItemType === 'file' && block.linkedItemId === attachmentId ? buildWorkspaceBlockFromAttachment(nextAttachment, block) : block))
  }

  function handleDeleteAttachment(attachmentId: string) {
    const attachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

    if (!attachment) {
      return
    }

    const linkedBlock = workspaceBlocks.find((block) => block.linkedItemType === 'file' && block.linkedItemId === attachment.id)
    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(linkedBlock ? `Материал «${attachment.title}» связан с workspace-блоком. Удалить материал и связанный блок?` : `Удалить материал «${attachment.title}»?`)
      : true

    if (!shouldDelete) {
      return
    }

    setProjectAttachments((currentAttachments) => currentAttachments.filter((item) => item.id !== attachmentId))

    if (linkedBlock) {
      setProjectWorkspaceBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== linkedBlock.id))
      setProjectWorkspaceRelations((currentRelations) => currentRelations.filter((relation) => relation.fromBlockId !== linkedBlock.id && relation.toBlockId !== linkedBlock.id))

      if (selectedWorkspaceBlockId === linkedBlock.id) {
        setSelectedWorkspaceBlockId(null)
      }
    }
  }

  function handleOpenAttachment(attachmentId: string) {
    const attachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

    if (!attachment) {
      return
    }

    if (attachment.type === 'link' && attachment.externalUrl) {
      window.open(attachment.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (attachment.type === 'image' && (attachment.dataUrl || attachment.previewUrl)) {
      window.open(attachment.dataUrl || attachment.previewUrl || '', '_blank', 'noopener,noreferrer')
      return
    }

    window.alert('Для обычных файлов пока сохраняются только метаданные. Позже будет добавлено облачное хранилище.')
  }

  function buildWorkspaceBlockFromProjectGoal(goal: ProjectGoal, existingBlock?: ProjectWorkspaceBlock | null): ProjectWorkspaceBlock {
    const timestamp = new Date().toISOString()

    return {
      id: existingBlock?.id ?? crypto.randomUUID(),
      projectId: goal.projectId,
      type: 'goal',
      title: goal.title,
      content: goal.description,
      description: goal.description,
      sectionId: existingBlock?.sectionId ?? (workspaceSectionFilter !== 'all' && workspaceSectionFilter !== 'none' ? workspaceSectionFilter : null),
      tags: goal.tags,
      linkedItemId: goal.id,
      linkedItemType: 'goal',
      createdAt: existingBlock?.createdAt ?? timestamp,
      updatedAt: goal.updatedAt,
      x: existingBlock?.x,
      y: existingBlock?.y,
      width: existingBlock?.width,
      height: existingBlock?.height,
      color: existingBlock?.color,
      icon: existingBlock?.icon,
    }
  }

  function handleCreateProjectGoal(values: ProjectGoalFormValues) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const goalId = crypto.randomUUID()
    const nextGoal: ProjectGoal = {
      id: goalId,
      projectId: project.id,
      title: values.title.trim(),
      description: values.description.trim(),
      status: values.status,
      priority: values.priority,
      progress: values.progress,
      deadline: values.deadline ? toDeadlineValue(values.deadline) : null,
      taskIds: values.taskIds,
      noteIds: values.noteIds,
      ideaIds: values.ideaIds,
      fileIds: values.fileIds,
      tags: values.tags,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const nextBlock = buildWorkspaceBlockFromProjectGoal(nextGoal)

    setProjectGoals((currentGoals) => [nextGoal, ...currentGoals])
    setProjectWorkspaceBlocks((currentBlocks) => [nextBlock, ...currentBlocks])
    setSelectedWorkspaceBlockId(nextBlock.id)
    setIsWorkspaceInspectorVisible(true)
    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'goal_created',
      title: `Создана цель: ${nextGoal.title}`,
      description: nextGoal.description,
      relatedItemId: nextGoal.id,
      relatedItemType: 'goal',
      createdAt: timestamp,
    })
  }

  function handleUpdateProjectGoal(goalId: string, values: ProjectGoalFormValues) {
    const currentGoal = projectGoalsForProject.find((goal) => goal.id === goalId)

    if (!currentGoal) {
      return
    }

    const timestamp = new Date().toISOString()
    const nextGoal: ProjectGoal = {
      ...currentGoal,
      title: values.title.trim(),
      description: values.description.trim(),
      status: values.status,
      priority: values.priority,
      progress: values.progress,
      deadline: values.deadline ? toDeadlineValue(values.deadline) : null,
      taskIds: values.taskIds,
      noteIds: values.noteIds,
      ideaIds: values.ideaIds,
      fileIds: values.fileIds,
      tags: values.tags,
      updatedAt: timestamp,
    }

    setProjectGoals((currentGoals) => currentGoals.map((goal) => (goal.id === goalId ? nextGoal : goal)))
    setProjectWorkspaceBlocks((currentBlocks) => currentBlocks.map((block) => block.linkedItemType === 'goal' && block.linkedItemId === goalId ? buildWorkspaceBlockFromProjectGoal(nextGoal, block) : block))
  }

  function handleDeleteProjectGoal(goalId: string) {
    const goal = projectGoalsForProject.find((item) => item.id === goalId)

    if (!goal) {
      return
    }

    const linkedBlock = workspaceBlocks.find((block) => block.linkedItemType === 'goal' && block.linkedItemId === goal.id)
    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(linkedBlock ? `Удалить цель «${goal.title}» и связанный workspace-блок?` : `Удалить цель «${goal.title}»?`)
      : true

    if (!shouldDelete) {
      return
    }

    setProjectGoals((currentGoals) => currentGoals.filter((item) => item.id !== goalId))

    if (linkedBlock) {
      setProjectWorkspaceBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== linkedBlock.id))
      setProjectWorkspaceRelations((currentRelations) => currentRelations.filter((relation) => relation.fromBlockId !== linkedBlock.id && relation.toBlockId !== linkedBlock.id))
    }
  }

  function handleCreateProjectMilestone(values: ProjectMilestoneFormValues) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const nextMilestone: ProjectMilestone = {
      id: crypto.randomUUID(),
      projectId: project.id,
      title: values.title.trim(),
      description: values.description.trim(),
      status: values.status,
      deadline: values.deadline ? toDeadlineValue(values.deadline) : null,
      taskIds: values.taskIds,
      order: projectMilestonesForProject.length,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setProjectMilestones((currentMilestones) => [...currentMilestones, nextMilestone])
    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'milestone_created',
      title: `Создан этап: ${nextMilestone.title}`,
      description: nextMilestone.description,
      relatedItemId: nextMilestone.id,
      relatedItemType: 'milestone',
      createdAt: timestamp,
    })
  }

  function handleUpdateProjectMilestone(milestoneId: string, values: ProjectMilestoneFormValues) {
    const currentMilestone = projectMilestonesForProject.find((milestone) => milestone.id === milestoneId)

    if (!currentMilestone) {
      return
    }

    const timestamp = new Date().toISOString()

    setProjectMilestones((currentMilestones) => currentMilestones.map((milestone) =>
      milestone.id === milestoneId
        ? {
            ...milestone,
            title: values.title.trim(),
            description: values.description.trim(),
            status: values.status,
            deadline: values.deadline ? toDeadlineValue(values.deadline) : null,
            taskIds: values.taskIds,
            updatedAt: timestamp,
          }
        : milestone,
    ))
  }

  function handleDeleteProjectMilestone(milestoneId: string) {
    const milestone = projectMilestonesForProject.find((item) => item.id === milestoneId)

    if (!milestone) {
      return
    }

    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить этап «${milestone.title}»?`)
      : true

    if (!shouldDelete) {
      return
    }

    setProjectMilestones((currentMilestones) => currentMilestones.filter((item) => item.id !== milestoneId))
  }

  function handleMoveProjectMilestone(milestoneId: string, direction: 'up' | 'down') {
    const orderedMilestones = [...projectMilestonesForProject]
    const currentIndex = orderedMilestones.findIndex((milestone) => milestone.id === milestoneId)

    if (currentIndex === -1) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= orderedMilestones.length) {
      return
    }

    const reorderedMilestones = [...orderedMilestones]
    const [movedMilestone] = reorderedMilestones.splice(currentIndex, 1)
    reorderedMilestones.splice(targetIndex, 0, movedMilestone)
    const timestamp = new Date().toISOString()
    const reorderedIds = new Map(reorderedMilestones.map((milestone, index) => [milestone.id, index]))

    setProjectMilestones((currentMilestones) => currentMilestones.map((milestone) =>
      milestone.projectId === projectId && reorderedIds.has(milestone.id)
        ? {
            ...milestone,
            order: reorderedIds.get(milestone.id) ?? milestone.order,
            updatedAt: timestamp,
          }
        : milestone,
    ))
  }

  function createLinkedWorkspaceEntity(type: ProjectWorkspaceBlock['type'], timestamp: string) {
    if (!project) {
      return null
    }

    switch (type) {
      case 'task': {
        const entityId = crypto.randomUUID()
        const nextTask: Task = {
          id: entityId,
          title: 'Новая задача проекта',
          description: '',
          tags: [],
          status: settings.behavior.defaultTaskStatus,
          priority: settings.behavior.defaultTaskPriority,
          deadline: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          completedAt: null,
          projectId: project.id,
          noteIds: [],
          ideaIds: [],
          fileIds: [],
          goalIds: [],
        }

        setTasks((currentTasks) => [nextTask, ...currentTasks])
        updateProjectLinks({ taskIds: [...project.taskIds, entityId] })
        appendProjectActivity({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'task_created',
          title: `Создана задача: ${nextTask.title}`,
          description: nextTask.description,
          relatedItemId: nextTask.id,
          relatedItemType: 'task',
          createdAt: timestamp,
        })

        return { linkedItemId: entityId, linkedItemType: 'task' as const, title: nextTask.title, relatedType: 'task' as const }
      }
      case 'note': {
        const entityId = crypto.randomUUID()
        const nextNote: Note = {
          id: entityId,
          title: 'Новая заметка проекта',
          summary: '',
          content: '',
          type: 'project_material',
          status: 'draft',
          tags: [],
          category: 'project',
          createdAt: timestamp,
          updatedAt: timestamp,
          projectId: project.id,
          taskIds: [],
          ideaIds: [],
          fileIds: [],
          goalIds: [],
        }

        setNotes((currentNotes) => [nextNote, ...currentNotes])
        updateProjectLinks({ noteIds: [...project.noteIds, entityId] })
        appendProjectActivity({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'note_created',
          title: `Создана заметка: ${nextNote.title}`,
          description: nextNote.summary,
          relatedItemId: nextNote.id,
          relatedItemType: 'note',
          createdAt: timestamp,
        })

        return { linkedItemId: entityId, linkedItemType: 'note' as const, title: nextNote.title, relatedType: 'note' as const }
      }
      case 'idea': {
        const entityId = crypto.randomUUID()
        const nextIdea: Idea = {
          id: entityId,
          title: 'Новая идея проекта',
          description: '',
          problem: '',
          value: '',
          nextStep: '',
          status: 'new',
          priority: 'medium',
          difficulty: 'medium',
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
          projectId: project.id,
          taskIds: [],
          noteIds: [],
          goalIds: [],
        }

        setIdeas((currentIdeas) => [nextIdea, ...currentIdeas])
        updateProjectLinks({ ideaIds: [...project.ideaIds, entityId] })
        appendProjectActivity({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'idea_created',
          title: `Создана идея: ${nextIdea.title}`,
          description: nextIdea.description,
          relatedItemId: nextIdea.id,
          relatedItemType: 'idea',
          createdAt: timestamp,
        })

        return { linkedItemId: entityId, linkedItemType: 'idea' as const, title: nextIdea.title, relatedType: 'idea' as const }
      }
      case 'file': {
        const entityId = crypto.randomUUID()
        const nextFile: FileItem = {
          id: entityId,
          title: 'Новый файл проекта',
          description: '',
          type: 'document',
          path: '',
          previewUrl: null,
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
          projectId: project.id,
          taskId: null,
          noteId: null,
          ideaId: null,
        }

        setFiles((currentFiles) => [nextFile, ...currentFiles])
        updateProjectLinks({ fileIds: [...project.fileIds, entityId] })

        return { linkedItemId: entityId, linkedItemType: 'file' as const, title: nextFile.title, relatedType: 'file' as const }
      }
      case 'goal': {
        const entityId = crypto.randomUUID()
        const nextGoal: ProjectGoal = {
          id: entityId,
          projectId: project.id,
          title: 'Новая цель проекта',
          description: '',
          status: 'planned',
          priority: project.priority ?? 'medium',
          progress: 0,
          deadline: null,
          taskIds: [],
          noteIds: [],
          ideaIds: [],
          fileIds: [],
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        setProjectGoals((currentGoals) => [nextGoal, ...currentGoals])
        appendProjectActivity({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'goal_created',
          title: `Создана цель: ${nextGoal.title}`,
          description: nextGoal.description,
          relatedItemId: nextGoal.id,
          relatedItemType: 'goal',
          createdAt: timestamp,
        })

        return { linkedItemId: entityId, linkedItemType: 'goal' as const, title: nextGoal.title, relatedType: 'goal' as const }
      }
      default:
        return null
    }
  }

  function handleCreateWorkspaceBlock(type: ProjectWorkspaceBlock['type']) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const id = crypto.randomUUID()
    const linkedEntity = createLinkedWorkspaceEntity(type, timestamp)
    const projectBlocks = workspaceBlocks.filter((block) => block.projectId === project.id)
    const blockIndex = projectBlocks.length
    const defaultWidth = type === 'image' ? 320 : 300
    const defaultHeight = type === 'image' ? 280 : 170

    const nextBlock: ProjectWorkspaceBlock = {
      id,
      projectId: project.id,
      type,
      title: linkedEntity?.title ?? workspaceBlockTitles[type],
      content: '',
      description: '',
      sectionId: workspaceSectionFilter !== 'all' && workspaceSectionFilter !== 'none' ? workspaceSectionFilter : null,
      tags: [],
      linkedItemId: linkedEntity?.linkedItemId,
      linkedItemType: linkedEntity?.linkedItemType,
      x: 32 + (blockIndex % 3) * 340,
      y: 32 + Math.floor(blockIndex / 3) * 220,
      width: defaultWidth,
      height: defaultHeight,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setProjectWorkspaceBlocks((currentBlocks) => [nextBlock, ...currentBlocks])
    setSelectedWorkspaceBlockId(id)
    setIsWorkspaceInspectorVisible(true)

    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'workspace_block_created',
      title: `Добавлен workspace-блок: ${linkedEntity?.title ?? workspaceBlockTitles[type]}`,
      description: type,
      relatedItemId: id,
      relatedItemType: linkedEntity?.relatedType ?? null,
      createdAt: timestamp,
    })
  }

  function handleToolbarCreateBlock(tool: string) {
    setActiveTool(tool)

    const toolToType: Partial<Record<string, ProjectWorkspaceBlock['type']>> = {
      text: 'text',
      task: 'task',
      note: 'note',
      idea: 'idea',
      goal: 'goal',
      file: 'file',
      image: 'image',
      link: 'link',
      comment: 'comment',
      draw: 'drawing',
    }

    const nextType = toolToType[tool]

    if (tool === 'image' || tool === 'file' || tool === 'link') {
      openAttachmentUploader(tool)
      return
    }

    if (nextType) {
      handleCreateWorkspaceBlock(nextType)
    }
  }

  function handleSelectTool(tool: string) {
    setActiveTool(tool)

    if (tool !== 'relation') {
      setRelationSourceBlockId(null)
      setRelationNotice(null)
    }
  }

  function handleOpenRelationSheet(initial?: {
    fromBlockId?: string | null
    toBlockId?: string | null
    type?: ProjectWorkspaceRelation['type']
    label?: string
  }) {
    setRelationDraft({
      fromBlockId: initial?.fromBlockId ?? relationSourceBlockId ?? selectedWorkspaceBlockId ?? '',
      toBlockId: initial?.toBlockId ?? '',
      type: initial?.type ?? 'related',
      label: initial?.label,
    })
    setIsAddRelationSheetOpen(true)
  }

  function handleCreateRelation(
    fromBlockId: string,
    toBlockId: string,
    type: ProjectWorkspaceRelation['type'],
    label?: string,
  ) {
    if (!project || !fromBlockId || !toBlockId || fromBlockId === toBlockId) {
      if (fromBlockId === toBlockId) {
        setRelationNotice('Нельзя создать связь блока с самим собой.')
      }

      return
    }

    const timestamp = new Date().toISOString()
    const trimmedLabel = label?.trim() || undefined
    const existingRelation = workspaceRelationsForProject.find((relation) => relation.fromBlockId === fromBlockId && relation.toBlockId === toBlockId && relation.type === type)

    if (existingRelation) {
      if (existingRelation.label === trimmedLabel) {
        setRelationNotice('Такая связь уже существует.')
      } else {
        setProjectWorkspaceRelations((currentRelations) =>
          currentRelations.map((relation) =>
            relation.id === existingRelation.id
              ? {
                  ...relation,
                  fromBlockId,
                  toBlockId,
                  type,
                  label: trimmedLabel,
                  updatedAt: timestamp,
                }
              : relation,
          ),
        )
        setRelationNotice('Тип существующей связи обновлён.')
        setSelectedRelationId(existingRelation.id)
      }

      setActiveTool('select')
      setRelationSourceBlockId(null)
      return
    }

    const nextRelation: ProjectWorkspaceRelation = {
      id: crypto.randomUUID(),
      projectId: project.id,
      fromBlockId,
      toBlockId,
      type,
      label: trimmedLabel,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setProjectWorkspaceRelations((currentRelations) => [nextRelation, ...currentRelations])
    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'relation_created',
      title: 'Создана связь между блоками',
      description: `${fromBlockId} -> ${toBlockId}`,
      relatedItemId: nextRelation.id,
      relatedItemType: null,
      createdAt: timestamp,
    })
    setSelectedRelationId(nextRelation.id)
    setActiveTool('select')
    setRelationSourceBlockId(null)
    setRelationNotice('Связь добавлена.')
  }

  function handleDeleteRelation(relationId: string) {
    const relation = workspaceRelationsForProject.find((item) => item.id === relationId)

    if (!relation) {
      return
    }

    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm('Удалить связь между блоками?')
      : true

    if (!shouldDelete) {
      return
    }

    setProjectWorkspaceRelations((currentRelations) => currentRelations.filter((item) => item.id !== relationId))

    if (selectedRelationId === relationId) {
      setSelectedRelationId(null)
    }
  }

  function handleSelectWorkspaceBlock(blockId: string | null) {
    setSelectedWorkspaceBlockId(blockId)

    if (!blockId) {
      return
    }

    if (activeTool !== 'relation') {
      setIsWorkspaceInspectorVisible(true)
    }

    if (activeTool !== 'relation') {
      return
    }

    if (!relationSourceBlockId) {
      setRelationSourceBlockId(blockId)
      setRelationNotice('Выбран исходный блок. Теперь нажмите на второй блок.')
      return
    }

    if (relationSourceBlockId === blockId) {
      setRelationNotice('Выберите другой блок для связи.')
      return
    }

    const fromBlock = workspaceBlocks.find((block) => block.id === relationSourceBlockId)
    const toBlock = workspaceBlocks.find((block) => block.id === blockId)

    if (!fromBlock || !toBlock) {
      return
    }

    const existingRelation = workspaceRelationsForProject.find((relation) => {
      const isForwardMatch = relation.fromBlockId === relationSourceBlockId && relation.toBlockId === blockId
      const isReverseMatch = relation.fromBlockId === blockId && relation.toBlockId === relationSourceBlockId
      return isForwardMatch || isReverseMatch
    })

    handleOpenRelationSheet({
      fromBlockId: relationSourceBlockId,
      toBlockId: blockId,
      type: existingRelation?.type ?? getSuggestedWorkspaceRelationType(fromBlock, toBlock),
      label: existingRelation?.label,
    })

    if (existingRelation) {
      setRelationNotice('Связь между этими блоками уже есть. Можно изменить её тип.')
      setSelectedRelationId(existingRelation.id)
    }
  }

  function handleEditWorkspaceBlock(blockId: string) {
    setSelectedWorkspaceBlockId(blockId)
    setIsWorkspaceInspectorVisible(true)
  }

  function clampWorkspaceInspectorWidth(width: number) {
    return Math.min(520, Math.max(280, width))
  }

  function clampWorkspaceInspectorHeight(height: number) {
    if (typeof window === 'undefined') {
      return Math.min(860, Math.max(420, height))
    }

    return Math.min(Math.max(420, height), Math.max(420, window.innerHeight - 140))
  }

  async function handleToggleWorkspaceFullscreen() {
    const element = workspaceShellRef.current

    if (!element || typeof document === 'undefined') {
      return
    }

    if (document.fullscreenElement === element) {
      await document.exitFullscreen()
      return
    }

    await element.requestFullscreen()
  }

  function handleWorkspaceInspectorResizeStart(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setWorkspaceInspectorResizeState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: workspaceInspectorWidth,
      originHeight: workspaceInspectorHeight,
    })
  }

  function handleWorkspaceInspectorResizeMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!workspaceInspectorResizeState || workspaceInspectorResizeState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    const deltaX = event.clientX - workspaceInspectorResizeState.startX
    const deltaY = event.clientY - workspaceInspectorResizeState.startY
    setWorkspaceInspectorWidth(clampWorkspaceInspectorWidth(workspaceInspectorResizeState.originWidth + deltaX))
    setWorkspaceInspectorHeight(clampWorkspaceInspectorHeight(workspaceInspectorResizeState.originHeight + deltaY))
  }

  function handleWorkspaceInspectorResizeEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!workspaceInspectorResizeState || workspaceInspectorResizeState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setWorkspaceInspectorResizeState(null)
  }

  function updateLinkedEntityFromBlock(block: ProjectWorkspaceBlock, updates: Partial<ProjectWorkspaceBlock>, timestamp: string) {
    const linkedItemType = Object.prototype.hasOwnProperty.call(updates, 'linkedItemType')
      ? updates.linkedItemType
      : block.linkedItemType
    const linkedItemId = Object.prototype.hasOwnProperty.call(updates, 'linkedItemId')
      ? updates.linkedItemId
      : block.linkedItemId

    if (!linkedItemType || !linkedItemId) {
      return
    }

    const nextTitle = updates.title ?? block.title
    const nextContent = updates.content ?? updates.description ?? block.content ?? block.description ?? ''
    const nextDescription = updates.description ?? updates.content ?? block.description ?? block.content ?? ''
    const nextTags = updates.tags ?? block.tags ?? []

    switch (linkedItemType) {
      case 'task':
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === linkedItemId
              ? {
                  ...task,
                  title: nextTitle,
                  description: nextDescription,
                  tags: nextTags,
                  updatedAt: timestamp,
                }
              : task,
          ),
        )
        break
      case 'note':
        setNotes((currentNotes) =>
          currentNotes.map((note) =>
            note.id === linkedItemId
              ? {
                  ...note,
                  title: nextTitle,
                  content: nextContent,
                  tags: nextTags,
                  updatedAt: timestamp,
                }
              : note,
          ),
        )
        break
      case 'idea':
        setIdeas((currentIdeas) =>
          currentIdeas.map((idea) =>
            idea.id === linkedItemId
              ? {
                  ...idea,
                  title: nextTitle,
                  description: nextDescription,
                  tags: nextTags,
                  updatedAt: timestamp,
                }
              : idea,
          ),
        )
        break
      case 'file':
        if (projectAttachmentsForProject.some((attachment) => attachment.id === linkedItemId)) {
          setProjectAttachments((currentAttachments) =>
            currentAttachments.map((attachment) =>
              attachment.id === linkedItemId
                ? {
                    ...attachment,
                    title: nextTitle,
                    description: nextDescription,
                    tags: nextTags,
                    externalUrl: updates.externalUrl ?? block.externalUrl ?? attachment.externalUrl,
                    previewUrl: updates.previewUrl ?? updates.imageUrl ?? block.previewUrl ?? block.imageUrl ?? attachment.previewUrl,
                    dataUrl: updates.dataUrl ?? block.dataUrl ?? attachment.dataUrl,
                    linkedBlockId: block.id,
                    updatedAt: timestamp,
                  }
                : attachment,
            ),
          )
          break
        }

        setFiles((currentFiles) =>
          currentFiles.map((file) =>
            file.id === linkedItemId
              ? {
                  ...file,
                  title: nextTitle,
                  description: nextDescription,
                  tags: nextTags,
                  updatedAt: timestamp,
                }
              : file,
          ),
        )
        break
      case 'goal':
        if (projectGoalsForProject.some((goal) => goal.id === linkedItemId)) {
          setProjectGoals((currentGoals) =>
            currentGoals.map((goal) =>
              goal.id === linkedItemId
                ? {
                    ...goal,
                    title: nextTitle,
                    description: nextDescription,
                    tags: nextTags,
                    updatedAt: timestamp,
                  }
                : goal,
            ),
          )
          break
        }

        setGoals((currentGoals) =>
          currentGoals.map((goal) =>
            goal.id === linkedItemId
              ? {
                  ...goal,
                  title: nextTitle,
                  description: nextDescription,
                  updatedAt: timestamp,
                }
              : goal,
          ),
        )
        break
      default:
        break
    }
  }

  function handleUpdateWorkspaceBlock(blockId: string, updates: Partial<ProjectWorkspaceBlock>) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const currentBlock = workspaceBlocks.find((block) => block.id === blockId && block.projectId === project.id)

    if (!currentBlock) {
      return
    }

    updateLinkedEntityFromBlock(currentBlock, updates, timestamp)

    const nextSectionId = Object.prototype.hasOwnProperty.call(updates, 'sectionId')
      ? updates.sectionId ?? null
      : currentBlock.sectionId ?? null

    if (Object.prototype.hasOwnProperty.call(updates, 'sectionId') && nextSectionId !== (currentBlock.sectionId ?? null)) {
      appendProjectActivity({
        id: crypto.randomUUID(),
        projectId: project.id,
        type: 'workspace_block_section_changed',
        title: `Блок «${currentBlock.title}» привязан к разделу`,
        description: nextSectionId ? projectSections.find((section) => section.id === nextSectionId)?.title ?? 'Раздел' : 'Без раздела',
        relatedItemId: currentBlock.id,
        relatedItemType: null,
        createdAt: timestamp,
      })
    } else if (updates.x !== undefined || updates.y !== undefined) {
      appendProjectActivity({
        id: crypto.randomUUID(),
        projectId: project.id,
        type: 'workspace_block_moved',
        title: `Перемещён блок: ${currentBlock.title}`,
        description: 'Позиция блока обновлена на canvas.',
        relatedItemId: currentBlock.id,
        relatedItemType: null,
        createdAt: timestamp,
      })
    } else if (Object.keys(updates).some((key) => key !== 'updatedAt')) {
      appendProjectActivity({
        id: crypto.randomUUID(),
        projectId: project.id,
        type: 'workspace_block_updated',
        title: `Обновлён блок: ${updates.title ?? currentBlock.title}`,
        description: 'Изменены свойства блока рабочей области.',
        relatedItemId: currentBlock.id,
        relatedItemType: null,
        createdAt: timestamp,
      })
    }

    setProjectWorkspaceBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === blockId && block.projectId === project.id
          ? {
              ...block,
              ...updates,
              projectId: block.projectId,
              updatedAt: timestamp,
            }
          : block,
      ),
    )
  }

  function handleArrangeWorkspaceBlocks(positions: Array<{ id: string; x: number; y: number; width?: number; height?: number }>) {
    if (!project || positions.length === 0) {
      return
    }

    const timestamp = new Date().toISOString()
    const positionsMap = new Map(positions.map((item) => [item.id, item]))

    setProjectWorkspaceBlocks((currentBlocks) =>
      currentBlocks.map((block) => {
        const nextPosition = positionsMap.get(block.id)

        if (!nextPosition || block.projectId !== project.id) {
          return block
        }

        return {
          ...block,
          x: Math.max(24, nextPosition.x),
          y: Math.max(24, nextPosition.y),
          width: nextPosition.width ?? block.width ?? (block.type === 'image' ? 320 : 300),
          height: nextPosition.height ?? block.height ?? (block.type === 'image' ? 280 : 170),
          updatedAt: timestamp,
        }
      }),
    )

    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'workspace_block_moved',
      title: 'Блоки рабочей области упорядочены',
      description: 'Позиции блоков выровнены по сетке.',
      relatedItemId: null,
      relatedItemType: null,
      createdAt: timestamp,
    })
  }

  function handleOpenWorkspaceBlockFromTabs(blockId: string) {
    setSelectedWorkspaceBlockId(blockId)
    setIsWorkspaceInspectorVisible(true)
    handleChangeTab('workspace')
  }

  function handleStartRelationFromBlock(blockId: string) {
    setSelectedWorkspaceBlockId(blockId)
    setIsWorkspaceInspectorVisible(true)
    setRelationSourceBlockId(blockId)
    setActiveTool('relation')
    handleOpenRelationSheet({ fromBlockId: blockId })
  }

  function handleOpenTaskFromProject(_taskId: string) {
    navigate('/tasks')
  }

  function handleOpenNoteFromProject(noteId: string) {
    navigate(`/notes/${noteId}`)
  }

  function handleOpenIdeaFromProject(ideaId: string) {
    navigate(`/ideas/${ideaId}`)
  }

  function handleDeleteWorkspaceBlock(blockId: string) {
    if (!project) {
      return
    }

    const block = workspaceBlocks.find((item) => item.id === blockId)

    if (!block) {
      return
    }

    const linkedItemType = block.linkedItemType
    const linkedItemId = block.linkedItemId
    let deleteLinkedEntity = false

    if (linkedItemType && linkedItemId) {
      const action = window.prompt(
        [
          `Блок «${block.title}» связан с сущностью типа «${linkedItemType}».`,
          'Введите 1, чтобы удалить только блок.',
          'Введите 2, чтобы удалить блок и связанную сущность.',
          'Оставьте пусто или нажмите Cancel, чтобы отменить.',
        ].join('\n'),
        '1',
      )

      if (!action) {
        return
      }

      if (action.trim() === '2') {
        deleteLinkedEntity = true
      } else if (action.trim() !== '1') {
        return
      }
    } else {
      const shouldDelete = settings.behavior.askBeforeDelete
        ? window.confirm(`Удалить блок «${block.title}»?`)
        : true

      if (!shouldDelete) {
        return
      }
    }

    setProjectWorkspaceBlocks((currentBlocks) => currentBlocks.filter((item) => item.id !== blockId))
    setProjectWorkspaceRelations((currentRelations) => currentRelations.filter((relation) => relation.fromBlockId !== blockId && relation.toBlockId !== blockId))

    appendProjectActivity({
      id: crypto.randomUUID(),
      projectId: project.id,
      type: 'workspace_block_deleted',
      title: `Удалён блок: ${block.title}`,
      description: deleteLinkedEntity ? 'Блок удалён вместе со связанной сущностью.' : 'Удалён только блок рабочей области.',
      relatedItemId: block.id,
      relatedItemType: null,
      createdAt: new Date().toISOString(),
    })

    if (deleteLinkedEntity && linkedItemType && linkedItemId) {
      deleteRelationsForItem(linkedItemId)

      switch (linkedItemType) {
        case 'task':
          setTasks((currentTasks) => currentTasks.filter((task) => task.id !== linkedItemId))
          updateProjectLinks({ taskIds: project.taskIds.filter((id) => id !== linkedItemId) })
          break
        case 'note':
          setNotes((currentNotes) => currentNotes.filter((note) => note.id !== linkedItemId))
          updateProjectLinks({ noteIds: project.noteIds.filter((id) => id !== linkedItemId) })
          break
        case 'idea':
          setIdeas((currentIdeas) => currentIdeas.filter((idea) => idea.id !== linkedItemId))
          updateProjectLinks({ ideaIds: project.ideaIds.filter((id) => id !== linkedItemId) })
          break
        case 'file':
          if (projectAttachmentsForProject.some((attachment) => attachment.id === linkedItemId)) {
            setProjectAttachments((currentAttachments) => currentAttachments.filter((attachment) => attachment.id !== linkedItemId))
          } else {
            setFiles((currentFiles) => currentFiles.filter((file) => file.id !== linkedItemId))
            updateProjectLinks({ fileIds: project.fileIds.filter((id) => id !== linkedItemId) })
          }
          break
        case 'goal':
          if (projectGoalsForProject.some((goal) => goal.id === linkedItemId)) {
            setProjectGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== linkedItemId))
          } else {
            setGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== linkedItemId))
            updateProjectLinks({ goalIds: project.goalIds.filter((id) => id !== linkedItemId) })
          }
          break
        default:
          break
      }

      setProjectWorkspaceBlocks((currentBlocks) =>
        currentBlocks.map((item) =>
          item.linkedItemId === linkedItemId && item.id !== blockId
            ? {
                ...item,
                linkedItemId: undefined,
                linkedItemType: undefined,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
    }

    if (selectedWorkspaceBlockId === blockId) {
      setSelectedWorkspaceBlockId(null)
    }

    if (relationSourceBlockId === blockId) {
      setRelationSourceBlockId(null)
    }
  }

  function getSectionRelatedItems(sectionId: string | null) {
    if (!sectionId) {
      return []
    }

    return getLinkedItemsFromRelations(sectionId, editableRelations, relationCatalog)
  }

  type SectionEditorValues = {
    title: string
    description: string
    relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
  }

  function handleCreateSection(values: SectionEditorValues) {
    if (!project) {
      return
    }

    const nextSection = createProjectSection({
      projectId: project.id,
      title: values.title,
      description: values.description,
      order: getNextOrder(sections, project.id, null, 'section'),
    })

    setSections((currentSections) => [...currentSections, nextSection])
    updateProjectLinks({ sectionIds: [...project.sectionIds, nextSection.id] })
    syncRelationsForItem(nextSection.id, 'section', values.relatedItems)
    setActiveSectionId(nextSection.id)
  }

  function handleUpdateSection(section: ProjectSection, values: SectionEditorValues) {
    setSections((currentSections) =>
      currentSections.map((item) =>
        item.id === section.id
          ? {
              ...item,
              title: values.title,
              description: values.description,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
    syncRelationsForItem(section.id, 'section', values.relatedItems)
  }

  function handleDeleteSection(section: ProjectSection) {
    if (!project) {
      return
    }

    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить подраздел «${section.title}»? Его элементы будут перенесены на верхний уровень рабочей поверхности.`)
      : true

    if (!shouldDelete) {
      return
    }

    setSections((currentSections) =>
      currentSections
        .map((item) =>
          item.parentSectionId === section.id
            ? {
                ...item,
                parentSectionId: null,
                updatedAt: new Date().toISOString(),
              }
            : item,
        )
        .filter((item) => item.id !== section.id),
    )
    updateProjectLinks({ sectionIds: project.sectionIds.filter((id) => id !== section.id) })
    deleteRelationsForItem(section.id)

    if (activeSectionId === section.id) {
      setActiveSectionId(null)
    }
  }

  if (!project) {
    return (
      <EmptyState
        title="Проект не найден"
        description="Вероятно, проект был удалён или идентификатор больше не существует."
        actionLabel="Вернуться к проектам"
        onAction={() => navigate('/projects')}
      />
    )
  }

  const overviewStats = [
    { label: 'Задач всего', value: projectStats.tasksTotal },
    { label: 'Выполнено', value: projectStats.tasksCompleted },
    { label: 'Активных', value: projectStats.tasksActive },
    { label: 'Просрочено', value: projectStats.tasksOverdue },
    { label: 'Идей', value: projectStats.ideasTotal },
    { label: 'Заметок', value: projectStats.notesTotal },
    { label: 'Файлов', value: projectStats.filesTotal },
    { label: 'Блоков', value: projectStats.workspaceBlocksTotal },
  ]

  return (
    <section ref={workspaceLayoutRef} className={cn(activeTab === 'workspace' ? 'flex flex-col gap-3 lg:flex-1 lg:grid lg:h-full lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-2 lg:overflow-hidden' : 'space-y-6')} style={activeTab === 'workspace' && !isWorkspaceFullscreen && workspaceAvailableHeight ? { height: workspaceAvailableHeight } : undefined}>
      {activeTab !== 'workspace' ? (
        <ProjectHeader
          project={project}
          progress={completionRate}
          onBack={() => navigate('/projects')}
          onEdit={() => handleChangeTab('settings')}
          onAddElement={() => setIsAddElementSheetOpen(true)}
        />
      ) : null}

      <ProjectTabs activeTab={activeTab} onChange={handleChangeTab} counts={projectTabCounts} compact={activeTab === 'workspace'} className={activeTab === 'workspace' ? 'lg:shrink-0' : undefined} />

      {activeTab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <ProjectOverviewTab
              project={project}
              tasks={linkedTasks}
              ideas={linkedIdeas}
              goals={projectGoalsForProject}
              milestones={projectMilestonesForProject}
              activities={projectActivityFeed}
              completionRate={completionRate}
              stats={projectStats}
              onOpenTask={handleOpenTaskFromProject}
              onOpenIdea={handleOpenIdeaFromProject}
              onCreateTask={() => handleCreateWorkspaceBlock('task')}
              onOpenWorkspace={() => handleChangeTab('workspace')}
              onCreateMilestone={handleCreateProjectMilestone}
              onUpdateMilestone={handleUpdateProjectMilestone}
              onDeleteMilestone={handleDeleteProjectMilestone}
              onMoveMilestone={handleMoveProjectMilestone}
            />
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="ui-panel p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Ключевые показатели</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {overviewStats.map((item) => (
                  <div key={item.label} className={`rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-3 py-3 ${item.value === 0 ? 'opacity-70' : ''}`}>
                    <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-(--text-primary)">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <ProjectSectionList
              sections={projectSections}
              activeSectionId={activeSectionId}
              blockCounts={blockCounts}
              onSelectSection={setActiveSectionId}
              onCreateSection={handleCreateSection}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
              availableRelationItems={availableRelationItems}
              getRelatedItems={getSectionRelatedItems}
              onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
            />

            <section className="ui-panel p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Рабочая область</p>
              <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Короткий обзор рабочей области</h2>
              <p className="mt-3 text-sm text-(--text-muted)">
                {workspaceBlocks.length > 0
                  ? `${workspaceBlocks.length} ${workspaceBlocks.length === 1 ? 'блок' : workspaceBlocks.length < 5 ? 'блока' : 'блоков'} уже добавлено в рабочую область.`
                  : 'Рабочая область пока пустая. Добавьте блоки, чтобы собрать задачи, заметки, идеи и материалы в одном потоке.'}
              </p>
              {activeSectionId ? <p className="mt-3 text-sm text-(--text-secondary)">Сейчас выбран раздел «{projectSections.find((section) => section.id === activeSectionId)?.title ?? 'Раздел'}».</p> : null}
              <button type="button" onClick={() => handleChangeTab('workspace')} className="ui-button-accent mt-4 px-4 py-3">Открыть рабочую область</button>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => handleChangeTab('tasks')} className="ui-button px-4 py-2.5 text-sm">Добавить задачу</button>
                <button type="button" onClick={handleOpenAddMaterialModal} className="ui-button px-4 py-2.5 text-sm">Добавить материал</button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === 'workspace' ? (
        <div
          ref={workspaceShellRef}
          className={cn('relative', isWorkspaceFullscreen ? 'min-h-screen overflow-auto bg-(--bg) p-4 md:p-6' : 'min-h-0 lg:h-full lg:overflow-hidden')}
        >
          {isWorkspaceFullscreen ? (
            <div className="pointer-events-none fixed left-6 top-6 z-50 hidden lg:flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsWorkspaceToolbarVisible((current) => !current)}
                aria-label={isWorkspaceToolbarVisible ? 'Свернуть панель инструментов' : 'Показать панель инструментов'}
                className={cn(
                  'pointer-events-auto inline-flex h-13 w-13 items-center justify-center rounded-2xl border bg-(--panel) shadow-(--shadow-floating) transition hover:-translate-y-0.5',
                  isWorkspaceToolbarVisible
                    ? 'border-(--accent-border) text-(--accent)'
                    : 'border-(--border) text-(--text-secondary)',
                )}
              >
                <SlidersHorizontal size={20} strokeWidth={2} />
              </button>
            </div>
          ) : null}
          {isWorkspaceFullscreen && isWorkspaceToolbarVisible ? (
            <div className="pointer-events-none fixed left-7 top-38 z-50 hidden lg:block">
              <ProjectToolbar
                activeTool={activeTool}
                onSelectTool={handleSelectTool}
                onCreateBlock={handleToolbarCreateBlock}
                className="pointer-events-auto"
              />
            </div>
          ) : null}
          <div
            className={cn(
              'grid h-full min-h-0 gap-4 lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden',
              isWorkspaceFullscreen
                ? 'grid-cols-1 pt-20'
                : isWorkspaceInspectorVisible
                  ? 'lg:grid-cols-[84px_minmax(0,1fr)_360px]'
                  : 'lg:grid-cols-[84px_minmax(0,1fr)]',
            )}
          >
            <div className={cn('lg:w-21 lg:min-h-0', isWorkspaceFullscreen ? 'hidden' : 'hidden lg:flex lg:h-full lg:items-center lg:justify-center lg:overflow-hidden')}>
              <ProjectToolbar activeTool={activeTool} onSelectTool={handleSelectTool} onCreateBlock={handleToolbarCreateBlock} />
            </div>
            <div className="min-h-0 min-w-0 lg:h-full lg:overflow-hidden">
              <ProjectWorkspace
                project={project}
                sections={projectSections}
                workspaceBlocks={workspaceBlocks}
                activeSectionFilter={workspaceSectionFilter}
                selectedBlockId={selectedWorkspaceBlockId}
                selectedRelationId={selectedRelationId}
                activeTool={activeTool}
                relationSourceBlockId={relationSourceBlockId}
                relationNotice={relationNotice}
                onSelectBlock={handleSelectWorkspaceBlock}
                onEditBlock={handleEditWorkspaceBlock}
                onSelectSectionFilter={setWorkspaceSectionFilter}
                onCreateBlock={handleCreateWorkspaceBlock}
                onOpenAddElement={() => setIsAddElementSheetOpen(true)}
                onUpdateBlock={handleUpdateWorkspaceBlock}
                onArrangeBlocks={handleArrangeWorkspaceBlocks}
                onInteractionChange={setIsWorkspaceCanvasInteracting}
                workspaceRelations={workspaceRelationsForProject}
                editorMode
                resetViewSignal={workspaceResetViewSignal}
                arrangeSignal={workspaceArrangeSignal}
                onCanvasViewChange={setWorkspaceCanvasView}
                isFullscreen={isWorkspaceFullscreen}
                onToggleFullscreen={() => {
                  void handleToggleWorkspaceFullscreen()
                }}
              />
            </div>
            {isWorkspaceInspectorVisible && !isWorkspaceFullscreen ? (
              <div className="hidden min-h-0 min-w-0 lg:block lg:h-full lg:overflow-hidden">
                <ProjectInspector
                  project={project}
                  selectedBlock={selectedWorkspaceBlock}
                  sections={projectSections}
                  onUpdateBlock={handleUpdateWorkspaceBlock}
                  onDeleteBlock={handleDeleteWorkspaceBlock}
                  onClose={() => {
                    setIsWorkspaceInspectorVisible(false)
                  }}
                  relatedTasks={linkedTasks}
                  relatedNotes={linkedNotes}
                  relatedIdeas={linkedIdeas}
                  relatedFiles={linkedFiles}
                  linkedEntity={linkedEntityByBlock}
                  selectedAttachment={selectedAttachment}
                  blockRelations={selectedBlockRelations}
                  onCreateBlock={handleCreateWorkspaceBlock}
                  onOpenAddElement={() => setIsAddElementSheetOpen(true)}
                  onDeleteRelation={handleDeleteRelation}
                  onCreateRelation={handleStartRelationFromBlock}
                  onOpenRelatedBlock={handleOpenWorkspaceBlockFromTabs}
                  onEditAttachment={(attachmentId) => {
                    const attachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

                    if (attachment) {
                      openAttachmentUploader(resolveAttachmentMode(attachment), attachment.id)
                    }
                  }}
                  onDeleteAttachment={handleDeleteAttachment}
                  onOpenAttachment={handleOpenAttachment}
                  workspaceBlockCount={workspaceBlocks.length}
                  activeToolLabel={activeTool === 'select' ? 'Выбор' : activeTool === 'pan' ? 'Рука' : activeTool}
                  selectedSectionFilter={workspaceSectionFilter}
                  zoomPercent={Math.round(workspaceCanvasView.zoom * 100)}
                  onArrangeBlocks={() => setWorkspaceArrangeSignal((current) => current + 1)}
                  onResetView={() => setWorkspaceResetViewSignal((current) => current + 1)}
                  onOpenProjectSettings={() => handleChangeTab('settings')}
                  onSelectSectionFilter={setWorkspaceSectionFilter}
                  className="h-full"
                  contentClassName="h-full"
                />
              </div>
            ) : null}
            {isWorkspaceInspectorVisible && selectedWorkspaceBlock ? (
              <div className="lg:hidden">
                <button
                  type="button"
                  aria-label="Закрыть инспектор"
                  onClick={() => {
                    setIsWorkspaceInspectorVisible(false)
                  }}
                  className="fixed inset-0 z-30 bg-(--overlay) backdrop-blur-[2px]"
                />
                <div className="fixed inset-x-0 bottom-0 z-40 px-0 pb-[env(safe-area-inset-bottom)]">
                  <ProjectInspector
                    project={project}
                    selectedBlock={selectedWorkspaceBlock}
                    sections={projectSections}
                    onUpdateBlock={handleUpdateWorkspaceBlock}
                    onDeleteBlock={handleDeleteWorkspaceBlock}
                    onClose={() => {
                      setIsWorkspaceInspectorVisible(false)
                    }}
                    relatedTasks={linkedTasks}
                    relatedNotes={linkedNotes}
                    relatedIdeas={linkedIdeas}
                    relatedFiles={linkedFiles}
                    linkedEntity={linkedEntityByBlock}
                    selectedAttachment={selectedAttachment}
                    blockRelations={selectedBlockRelations}
                    onCreateBlock={handleCreateWorkspaceBlock}
                    onOpenAddElement={() => setIsAddElementSheetOpen(true)}
                    onDeleteRelation={handleDeleteRelation}
                    onCreateRelation={handleStartRelationFromBlock}
                    onOpenRelatedBlock={handleOpenWorkspaceBlockFromTabs}
                    onEditAttachment={(attachmentId) => {
                      const attachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

                      if (attachment) {
                        openAttachmentUploader(resolveAttachmentMode(attachment), attachment.id)
                      }
                    }}
                    onDeleteAttachment={handleDeleteAttachment}
                    onOpenAttachment={handleOpenAttachment}
                    workspaceBlockCount={workspaceBlocks.length}
                    activeToolLabel={activeTool === 'select' ? 'Выбор' : activeTool === 'pan' ? 'Рука' : activeTool}
                    selectedSectionFilter={workspaceSectionFilter}
                    zoomPercent={Math.round(workspaceCanvasView.zoom * 100)}
                    onArrangeBlocks={() => setWorkspaceArrangeSignal((current) => current + 1)}
                    onResetView={() => setWorkspaceResetViewSignal((current) => current + 1)}
                    onOpenProjectSettings={() => handleChangeTab('settings')}
                    onSelectSectionFilter={setWorkspaceSectionFilter}
                    className="h-[min(78dvh,760px)] rounded-t-[28px] rounded-b-none border-x-0 border-b-0 shadow-(--shadow-floating)"
                    contentClassName="h-full pb-[calc(env(safe-area-inset-bottom)+1rem)]"
                  />
                </div>
              </div>
            ) : null}
          </div>
          {isWorkspaceInspectorVisible && isWorkspaceFullscreen ? (
            <div
              className="pointer-events-none fixed z-40 hidden lg:block"
              style={{
                left: workspaceInspectorPosition.x,
                top: workspaceInspectorPosition.y,
              }}
            >
              <div
                className={cn(
                  isWorkspaceCanvasInteracting ? 'pointer-events-none max-w-[calc(100vw-6rem)]' : 'pointer-events-auto max-w-[calc(100vw-6rem)]',
                  workspaceInspectorDragState ? 'cursor-grabbing' : 'cursor-grab',
                )}
                style={{ width: workspaceInspectorWidth, height: workspaceInspectorHeight }}
                onPointerDown={handleWorkspaceInspectorDragStart}
                onPointerMove={handleWorkspaceInspectorDragMove}
                onPointerUp={handleWorkspaceInspectorDragEnd}
                onPointerCancel={handleWorkspaceInspectorDragEnd}
              >
                <div className="relative h-full">
                  <ProjectInspector
                    project={project}
                    selectedBlock={selectedWorkspaceBlock}
                    sections={projectSections}
                    onUpdateBlock={handleUpdateWorkspaceBlock}
                    onDeleteBlock={handleDeleteWorkspaceBlock}
                    onClose={() => {
                      setIsWorkspaceInspectorVisible(false)
                    }}
                    relatedTasks={linkedTasks}
                    relatedNotes={linkedNotes}
                    relatedIdeas={linkedIdeas}
                    relatedFiles={linkedFiles}
                    linkedEntity={linkedEntityByBlock}
                    selectedAttachment={selectedAttachment}
                    blockRelations={selectedBlockRelations}
                    onCreateBlock={handleCreateWorkspaceBlock}
                    onOpenAddElement={() => setIsAddElementSheetOpen(true)}
                    onDeleteRelation={handleDeleteRelation}
                    onCreateRelation={handleStartRelationFromBlock}
                    onOpenRelatedBlock={handleOpenWorkspaceBlockFromTabs}
                    onEditAttachment={(attachmentId) => {
                      const attachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

                      if (attachment) {
                        openAttachmentUploader(resolveAttachmentMode(attachment), attachment.id)
                      }
                    }}
                    onDeleteAttachment={handleDeleteAttachment}
                    onOpenAttachment={handleOpenAttachment}
                    workspaceBlockCount={workspaceBlocks.length}
                    activeToolLabel={activeTool === 'select' ? 'Выбор' : activeTool === 'pan' ? 'Рука' : activeTool}
                    selectedSectionFilter={workspaceSectionFilter}
                    zoomPercent={Math.round(workspaceCanvasView.zoom * 100)}
                    onArrangeBlocks={() => setWorkspaceArrangeSignal((current) => current + 1)}
                    onResetView={() => setWorkspaceResetViewSignal((current) => current + 1)}
                    onOpenProjectSettings={() => handleChangeTab('settings')}
                    onSelectSectionFilter={setWorkspaceSectionFilter}
                    className="h-full max-h-none"
                    contentClassName="lg:max-h-none"
                  />
                  <button
                    type="button"
                    aria-label="Изменить размер инспектора"
                    onPointerDown={handleWorkspaceInspectorResizeStart}
                    onPointerMove={handleWorkspaceInspectorResizeMove}
                    onPointerUp={handleWorkspaceInspectorResizeEnd}
                    onPointerCancel={handleWorkspaceInspectorResizeEnd}
                    className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-(--border-soft) bg-(--panel) text-(--text-muted) shadow-(--shadow-soft) touch-none cursor-nwse-resize"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M5 11L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M8.5 11H11V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'tasks' ? <ProjectTasksTab tasks={linkedTasks} workspaceBlocks={workspaceBlocks} onCreateTask={() => handleCreateWorkspaceBlock('task')} onOpenTask={handleOpenTaskFromProject} onOpenWorkspaceBlock={handleOpenWorkspaceBlockFromTabs} /> : null}

      {activeTab === 'materials' ? (
        <div className="space-y-6">
          <section className="ui-panel p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Материалы</p>
                <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Заметки, идеи и файлы проекта</h2>
                <p className="mt-2 max-w-3xl text-sm text-(--text-secondary)">Собранное знание и артефакты проекта в одном месте. На поверхности только краткий контекст, детали открываются внутри сущности.</p>
              </div>
              <button type="button" onClick={handleOpenAddMaterialModal} className="ui-button-accent px-4 py-3">Добавить материал</button>
            </div>
            <div className="mt-4 ui-filter-scroll">
              {([
                ['all', 'Все'],
                ['notes', 'Заметки'],
                ['ideas', 'Идеи'],
                ['files', 'Файлы'],
                ['links', 'Ссылки'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMaterialsFilter(value)}
                  className={[
                    'ui-filter-pill',
                    materialsFilter === value
                      ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                      : 'hover:border-(--accent-border) hover:text-(--text-primary)',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {(materialsFilter === 'all' || materialsFilter === 'notes') ? <ProjectNotesTab notes={linkedNotes} workspaceBlocks={workspaceBlocks} onCreateNote={() => handleCreateWorkspaceBlock('note')} onOpenNote={handleOpenNoteFromProject} onOpenWorkspaceBlock={handleOpenWorkspaceBlockFromTabs} /> : null}
          {(materialsFilter === 'all' || materialsFilter === 'ideas') ? <ProjectIdeasTab ideas={linkedIdeas} workspaceBlocks={workspaceBlocks} onCreateIdea={() => handleCreateWorkspaceBlock('idea')} onOpenIdea={handleOpenIdeaFromProject} onOpenWorkspaceBlock={handleOpenWorkspaceBlockFromTabs} /> : null}
          {(materialsFilter === 'all' || materialsFilter === 'files') ? <ProjectFilesTab files={materialFiles} workspaceBlocks={workspaceBlocks} onCreateFile={() => openAttachmentUploader('file')} onCreateImage={() => openAttachmentUploader('image')} onCreateLink={() => openAttachmentUploader('link')} onOpenFile={handleOpenAttachment} onEditFile={(attachmentId) => {
            const attachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

            if (attachment) {
              openAttachmentUploader(resolveAttachmentMode(attachment), attachment.id)
            }
          }} onDeleteFile={handleDeleteAttachment} onOpenWorkspaceBlock={handleOpenWorkspaceBlockFromTabs} /> : null}
          {materialsFilter === 'links' ? <ProjectFilesTab files={materialLinks} workspaceBlocks={workspaceBlocks} onCreateFile={() => openAttachmentUploader('file')} onCreateImage={() => openAttachmentUploader('image')} onCreateLink={() => openAttachmentUploader('link')} onOpenFile={handleOpenAttachment} onEditFile={(attachmentId) => {
            const attachment = projectAttachmentsForProject.find((item) => item.id === attachmentId)

            if (attachment) {
              openAttachmentUploader(resolveAttachmentMode(attachment), attachment.id)
            }
          }} onDeleteFile={handleDeleteAttachment} onOpenWorkspaceBlock={handleOpenWorkspaceBlockFromTabs} /> : null}
        </div>
      ) : null}

      {activeTab === 'progress' ? (
        <div className="space-y-6">
          <section className="ui-panel p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Прогресс</p>
                <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Цели, этапы и движение проекта</h2>
                <p className="mt-2 max-w-3xl text-sm text-(--text-secondary)">Понятная сводка по результату, этапам и последним изменениям без отдельной перегруженной вкладки связей.</p>
              </div>
              <div className="rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-4 py-3 text-sm text-(--text-secondary)">
                Общий прогресс: <span className="font-semibold text-(--text-primary)">{completionRate}%</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="ui-panel-elevated px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Выполнено задач</p><p className="mt-1 text-lg font-semibold text-(--text-primary)">{progressMetrics.completedTasks}</p></div>
              <div className="ui-panel-elevated px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Активных задач</p><p className="mt-1 text-lg font-semibold text-(--text-primary)">{progressMetrics.activeTasks}</p></div>
              <div className="ui-panel-elevated px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Просрочено</p><p className="mt-1 text-lg font-semibold text-(--text-primary)">{progressMetrics.overdueTasks}</p></div>
              <div className="ui-panel-elevated px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Материалов</p><p className="mt-1 text-lg font-semibold text-(--text-primary)">{progressMetrics.materialsAdded}</p></div>
              <div className="ui-panel-elevated px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Блоков в workspace</p><p className="mt-1 text-lg font-semibold text-(--text-primary)">{progressMetrics.blocks}</p></div>
              <div className="ui-panel-elevated px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Дней активности</p><p className="mt-1 text-lg font-semibold text-(--text-primary)">{progressMetrics.activeDays}</p></div>
            </div>
          </section>

          <ProjectGoalsTab goals={projectGoalsForProject} tasks={linkedTasks} notes={linkedNotes} ideas={linkedIdeas} files={linkedFiles} workspaceBlocks={workspaceBlocks} tagSuggestions={projectTagSuggestions} onCreateGoal={handleCreateProjectGoal} onUpdateGoal={handleUpdateProjectGoal} onDeleteGoal={handleDeleteProjectGoal} onOpenWorkspaceBlock={handleOpenWorkspaceBlockFromTabs} />

          <ProjectMilestonesPanel milestones={projectMilestonesForProject} tasks={linkedTasks} onCreateMilestone={handleCreateProjectMilestone} onUpdateMilestone={handleUpdateProjectMilestone} onDeleteMilestone={handleDeleteProjectMilestone} onMoveMilestone={handleMoveProjectMilestone} />

          <ProjectActivityTab activities={projectActivityFeed} />
        </div>
      ) : null}

      {activeTab === 'settings' ? <ProjectSettingsTab project={project} tagSuggestions={projectTagSuggestions} onSave={handleSaveProjectSettings} onDelete={handleDeleteProject} /> : null}

      <Modal
        title="Добавить материал"
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        size="md"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => handleCreateMaterial('note')} className="ui-panel-elevated px-4 py-4 text-left transition hover:border-(--accent-border)">
            <p className="font-semibold text-(--text-primary)">Заметка</p>
            <p className="mt-1 text-sm text-(--text-secondary)">Текст, исследование, инструкция или мысль.</p>
          </button>
          <button type="button" onClick={() => handleCreateMaterial('idea')} className="ui-panel-elevated px-4 py-4 text-left transition hover:border-(--accent-border)">
            <p className="font-semibold text-(--text-primary)">Идея</p>
            <p className="mt-1 text-sm text-(--text-secondary)">Гипотеза, находка или будущая задача.</p>
          </button>
          <button type="button" onClick={() => handleCreateMaterial('file')} className="ui-panel-elevated px-4 py-4 text-left transition hover:border-(--accent-border)">
            <p className="font-semibold text-(--text-primary)">Файл</p>
            <p className="mt-1 text-sm text-(--text-secondary)">Документ, изображение или другой артефакт.</p>
          </button>
          <button type="button" onClick={() => handleCreateMaterial('link')} className="ui-panel-elevated px-4 py-4 text-left transition hover:border-(--accent-border)">
            <p className="font-semibold text-(--text-primary)">Ссылка</p>
            <p className="mt-1 text-sm text-(--text-secondary)">Внешний ресурс, reference или attachment.</p>
          </button>
        </div>
      </Modal>

      <ProjectAddElementSheet
        isOpen={isAddElementSheetOpen}
        onClose={() => setIsAddElementSheetOpen(false)}
        onCreateTemplate={(preset) => {
          setIsAddElementSheetOpen(false)
          handleCreateWorkspaceTemplate(preset)
        }}
        onCreateElement={(type) => {
          setIsAddElementSheetOpen(false)

          if (type === 'image' || type === 'file' || type === 'link') {
            openAttachmentUploader(type)
            return
          }

          handleCreateWorkspaceBlock(type)
        }}
      />

      {attachmentEditor ? (
        <ProjectAttachmentUploader
          isOpen={Boolean(attachmentEditor)}
          mode={attachmentEditor.mode}
          attachment={editedAttachment}
          onClose={closeAttachmentUploader}
          onSubmit={(values) => {
            if (attachmentEditor.attachmentId) {
              handleUpdateAttachment(attachmentEditor.attachmentId, values)
            } else {
              handleCreateAttachment(values)
            }

            closeAttachmentUploader()
          }}
        />
      ) : null}

      <ProjectAddRelationSheet
        isOpen={isAddRelationSheetOpen}
        onClose={() => {
          setIsAddRelationSheetOpen(false)
          setRelationDraft(null)
          setRelationSourceBlockId(null)
          setActiveTool('select')
        }}
        blocks={workspaceBlocks}
        initialFromBlockId={relationDraft?.fromBlockId}
        initialToBlockId={relationDraft?.toBlockId}
        initialType={relationDraft?.type}
        initialLabel={relationDraft?.label}
        existingRelations={workspaceRelationsForProject}
        submitLabel={selectedRelationId ? 'Сохранить тип связи' : 'Создать связь'}
        onSubmit={({ fromBlockId, toBlockId, type, label }) => {
          handleCreateRelation(fromBlockId, toBlockId, type, label)
          setRelationDraft(null)
          setIsAddRelationSheetOpen(false)
        }}
      />
    </section>
  )
}
