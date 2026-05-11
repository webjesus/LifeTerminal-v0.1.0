import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../components/projects/EmptyState'
import type { ProjectBlockEditorValues } from '../components/projects/ProjectBlockModal'
import { ProjectFormModal, type ProjectFormValues } from '../components/projects/ProjectFormModal'
import { ProjectRelationMap } from '../components/projects/ProjectRelationMap'
import { ProjectSectionList } from '../components/projects/ProjectSectionList'
import { createProjectSection, projectStatusLabels, type WorkspaceItemKind } from '../components/projects/projectMeta'
import { ProjectWorkspace, type ProjectWorkspaceItemFormValues } from '../components/projects/ProjectWorkspace'
import { LinkedItemsPanel } from '../components/linked/LinkedItemsPanel'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, FileItemType, Goal, Idea, Note, Project, ProjectSection, Relation, RelationEntityType, Task } from '../types'
import type { LinkableRelationType, RelationSelectableItem } from '../utils/relations'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'

type ProjectDetailTab = 'overview' | 'workspace' | 'tasks' | 'notes' | 'ideas' | 'files' | 'map'

const detailTabs: Array<{ key: ProjectDetailTab; label: string }> = [
  { key: 'overview', label: 'Обзор' },
  { key: 'workspace', label: 'Рабочая область' },
  { key: 'tasks', label: 'Задачи' },
  { key: 'notes', label: 'Заметки' },
  { key: 'ideas', label: 'Идеи' },
  { key: 'files', label: 'Файлы' },
  { key: 'map', label: 'Карта связей' },
]

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

function toDeadlineValue(value: string) {
  if (!value) {
    return null
  }

  return new Date(`${value}T12:00:00`).toISOString()
}

function buildProject(values: ProjectFormValues, existingProject: Project): Project {
  return {
    ...existingProject,
    title: values.title,
    description: values.description,
    status: values.status,
    goal: values.goal,
    deadline: toDeadlineValue(values.deadline),
    updatedAt: new Date().toISOString(),
  }
}

function matchesProject(project: Project, itemProjectId: string | null, itemId: string, linkedIds: string[]) {
  return itemProjectId === project.id || linkedIds.includes(itemId)
}

function getFileType(kind: WorkspaceItemKind): FileItemType {
  switch (kind) {
    case 'photo':
      return 'image'
    case 'link':
      return 'link'
    case 'file':
    default:
      return 'document'
  }
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

function syncBlockRelations(
  items: ProjectSection[],
  projectId: string,
  blockId: string,
  nextRelatedBlockIds: string[],
) {
  const timestamp = new Date().toISOString()
  const normalizedRelatedIds = uniqueIds(nextRelatedBlockIds.filter((id) => id !== blockId))

  return items.map((item) => {
    if (item.projectId !== projectId || item.kind === 'section') {
      return item
    }

    if (item.id === blockId) {
      return {
        ...item,
        relatedBlockIds: normalizedRelatedIds,
        updatedAt: timestamp,
      }
    }

    const shouldLink = normalizedRelatedIds.includes(item.id)
    const hasLink = item.relatedBlockIds.includes(blockId)

    if (shouldLink === hasLink) {
      return item
    }

    return {
      ...item,
      relatedBlockIds: shouldLink
        ? uniqueIds([...item.relatedBlockIds, blockId])
        : item.relatedBlockIds.filter((id) => id !== blockId),
      updatedAt: timestamp,
    }
  })
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: sections, setValue: setSections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas, setValue: setIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: files, setValue: setFiles } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: goals, setValue: setGoals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: relations, setValue: setRelations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedWorkspaceBlockId, setSelectedWorkspaceBlockId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>(settings.behavior.defaultProjectView)

  const project = useMemo(
    () => projects.find((item) => item.id === projectId) ?? null,
    [projectId, projects],
  )

  const projectSections = useMemo(
    () => sections.filter((item) => item.projectId === projectId && item.kind === 'section').sort((a, b) => a.order - b.order),
    [projectId, sections],
  )

  const workspaceBlocks = useMemo(
    () => sections.filter((item) => item.projectId === projectId && item.kind !== 'section').sort((a, b) => a.order - b.order),
    [projectId, sections],
  )

  const blockCounts = useMemo(
    () => Object.fromEntries(projectSections.map((section) => [section.id, workspaceBlocks.filter((block) => block.parentSectionId === section.id).length])),
    [projectSections, workspaceBlocks],
  )

  const linkedTasks = useMemo(
    () => (project ? tasks.filter((item) => matchesProject(project, item.projectId, item.id, project.taskIds)) : []),
    [project, tasks],
  )

  const linkedNotes = useMemo(
    () => (project ? notes.filter((item) => matchesProject(project, item.projectId, item.id, project.noteIds)) : []),
    [notes, project],
  )

  const linkedIdeas = useMemo(
    () => (project ? ideas.filter((item) => matchesProject(project, item.projectId, item.id, project.ideaIds)) : []),
    [ideas, project],
  )

  const linkedFiles = useMemo(
    () => (project ? files.filter((item) => matchesProject(project, item.projectId, item.id, project.fileIds)) : []),
    [files, project],
  )

  const linkedGoals = useMemo(
    () => (project ? goals.filter((item) => matchesProject(project, item.projectId, item.id, project.goalIds)) : []),
    [goals, project],
  )

  const selectedWorkspaceBlock = useMemo(
    () => workspaceBlocks.find((block) => block.id === selectedWorkspaceBlockId) ?? null,
    [selectedWorkspaceBlockId, workspaceBlocks],
  )

  const editableRelations = useMemo(
    () => relations.filter(isEditableRelation),
    [relations],
  )

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ tasks, projects, notes, ideas, files, goals, sections }),
    [files, goals, ideas, notes, projects, sections, tasks],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'project' && item.id === project?.id)),
    [project?.id, relationCatalog],
  )

  const selectedProjectRelations = useMemo(
    () => (project ? getLinkedItemsFromRelations(project.id, editableRelations, relationCatalog) : []),
    [editableRelations, project, relationCatalog],
  )

  const selectedBlockRelationType = selectedWorkspaceBlock ? getBlockRelationType(selectedWorkspaceBlock.kind) : null

  const selectedBlockRelations = useMemo(
    () =>
      selectedWorkspaceBlock && selectedWorkspaceBlock.entityId && selectedBlockRelationType
        ? getLinkedItemsFromRelations(selectedWorkspaceBlock.entityId, editableRelations, relationCatalog)
        : [],
    [editableRelations, relationCatalog, selectedBlockRelationType, selectedWorkspaceBlock],
  )

  const availableBlockRelationItems = useMemo(
    () =>
      relationCatalog.filter((item) => {
        if (!selectedWorkspaceBlock || !selectedWorkspaceBlock.entityId || !selectedBlockRelationType) {
          return true
        }

        return !(item.id === selectedWorkspaceBlock.entityId && item.type === selectedBlockRelationType)
      }),
    [relationCatalog, selectedBlockRelationType, selectedWorkspaceBlock],
  )

  const projectRelations = useMemo<Relation[]>(() => {
    if (!project) {
      return []
    }

    const blockById = new Map(workspaceBlocks.map((block) => [block.id, block]))
    const nextRelations: Relation[] = []

    workspaceBlocks.forEach((block) => {
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

        if (!relatedBlock || !relatedBlock.entityId) {
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
  }, [project, workspaceBlocks])

  const completedTasks = useMemo(
    () => linkedTasks.filter((task) => task.status === 'completed').length,
    [linkedTasks],
  )

  const completionRate = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0

  useEffect(() => {
    if (!project) {
      return
    }

    const projectRelationPrefix = `project:${project.id}:`
    const currentProjectRelations = relations
      .filter((relation) => relation.id.startsWith(projectRelationPrefix))
      .sort((a, b) => a.id.localeCompare(b.id))
    const nextProjectRelations = [...projectRelations].sort((a, b) => a.id.localeCompare(b.id))

    if (JSON.stringify(currentProjectRelations) === JSON.stringify(nextProjectRelations)) {
      return
    }

    setRelations((currentRelations) => [
      ...currentRelations.filter((relation) => !relation.id.startsWith(projectRelationPrefix)),
      ...projectRelations,
    ])
  }, [project, projectRelations, relations, setRelations])

  function handleOpenRelationNode(node: { id: string; type: RelationEntityType }) {
    if (node.type === 'project_section') {
      setActiveSectionId(node.id)
      return
    }

    const matchingBlock = workspaceBlocks.find((block) => {
      if (!block.entityId || block.entityId !== node.id) {
        return false
      }

      const blockRelationType = getBlockRelationType(block.kind)
      return blockRelationType === node.type
    })

    if (matchingBlock) {
      setSelectedWorkspaceBlockId(matchingBlock.id)

      if (matchingBlock.parentSectionId) {
        setActiveSectionId(matchingBlock.parentSectionId)
      }

      return
    }

    switch (node.type) {
      case 'task':
        navigate('/tasks')
        break
      case 'note':
        navigate('/notes')
        break
      case 'idea':
        navigate('/ideas')
        break
      case 'file':
        navigate('/files')
        break
      default:
        break
    }
  }

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

  function handleUpdateProject(values: ProjectFormValues) {
    if (!project) {
      return
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) => (item.id === project.id ? buildProject(values, item) : item)),
    )
    syncRelationsForItem(project.id, 'project', values.relatedItems)
    setIsEditModalOpen(false)
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

  function handleAddItem(values: ProjectWorkspaceItemFormValues) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    let entityId: string | null = null
    let taskIds = project.taskIds
    let noteIds = project.noteIds
    let ideaIds = project.ideaIds
    let fileIds = project.fileIds
    let goalIds = project.goalIds

    if (values.kind === 'task') {
      entityId = crypto.randomUUID()
      const nextTask: Task = {
        id: entityId,
        title: values.title,
        description: values.description || values.content,
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
      taskIds = uniqueIds([...project.taskIds, entityId])
    }

    if (values.kind === 'note') {
      entityId = crypto.randomUUID()
      const nextNote: Note = {
        id: entityId,
        title: values.title,
        content: values.content || values.description,
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: project.id,
        taskIds: [],
        ideaIds: [],
        fileIds: [],
        goalIds: [],
      }
      setNotes((currentNotes) => [nextNote, ...currentNotes])
      noteIds = uniqueIds([...project.noteIds, entityId])
    }

    if (values.kind === 'idea') {
      entityId = crypto.randomUUID()
      const nextIdea: Idea = {
        id: entityId,
        title: values.title,
        description: values.description || values.content,
        status: 'new',
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: project.id,
        taskIds: [],
        noteIds: [],
        goalIds: [],
      }
      setIdeas((currentIdeas) => [nextIdea, ...currentIdeas])
      ideaIds = uniqueIds([...project.ideaIds, entityId])
    }

    if (values.kind === 'goal') {
      entityId = crypto.randomUUID()
      const nextGoal: Goal = {
        id: entityId,
        title: values.title,
        description: values.description || values.content,
        status: 'new',
        deadline: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: project.id,
        taskIds: [],
        noteIds: [],
        ideaIds: [],
      }
      setGoals((currentGoals) => [nextGoal, ...currentGoals])
      goalIds = uniqueIds([...project.goalIds, entityId])
    }

    if (values.kind === 'file' || values.kind === 'photo' || values.kind === 'link') {
      entityId = crypto.randomUUID()
      const nextFile: FileItem = {
        id: entityId,
        title: values.title,
        description: values.description || values.content,
        type: getFileType(values.kind),
        path: values.url,
        previewUrl: values.kind === 'photo' ? values.url || null : null,
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: project.id,
        taskId: null,
        noteId: null,
        ideaId: null,
      }
      setFiles((currentFiles) => [nextFile, ...currentFiles])
      fileIds = uniqueIds([...project.fileIds, entityId])
    }

    const nextBlock = createProjectSection({
      projectId: project.id,
      title: values.title,
      description: values.description,
      order: getNextOrder(sections, project.id, values.sectionId, 'block'),
      kind: values.kind,
      parentSectionId: values.sectionId,
      entityId,
      relatedBlockIds: [],
      content: values.content,
      url: values.url || null,
    })

    setSections((currentSections) => [...currentSections, nextBlock])
    updateProjectLinks({ taskIds, noteIds, ideaIds, fileIds, goalIds })
  }

  function handleUpdateBlock(block: ProjectSection, values: ProjectBlockEditorValues) {
    if (!project) {
      return
    }

    const timestamp = new Date().toISOString()
    const blockRelationType = getBlockRelationType(block.kind)

    setSections((currentSections) => {
      const nextOrder =
        block.parentSectionId !== values.sectionId
          ? getNextOrder(
              currentSections.filter((item) => item.id !== block.id),
              project.id,
              values.sectionId,
              'block',
            )
          : block.order

      const updatedSections = currentSections.map((item) =>
        item.id === block.id
          ? {
              ...item,
              title: values.title,
              description: values.description,
              content: values.content,
              url: values.url || null,
              parentSectionId: values.sectionId,
              order: nextOrder,
              updatedAt: timestamp,
            }
          : item,
      )

      return syncBlockRelations(updatedSections, project.id, block.id, values.relatedBlockIds)
    })

    if (block.entityId && blockRelationType) {
      syncRelationsForItem(
        block.entityId,
        blockRelationType as LinkableRelationType,
        values.relatedItems,
      )
    }

    if (block.kind === 'task' && block.entityId) {
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === block.entityId
            ? {
                ...item,
                title: values.title,
                description: values.description || values.content,
                updatedAt: timestamp,
              }
            : item,
        ),
      )
      return
    }

    if (block.kind === 'note' && block.entityId) {
      setNotes((currentNotes) =>
        currentNotes.map((item) =>
          item.id === block.entityId
            ? {
                ...item,
                title: values.title,
                content: values.content || values.description,
                updatedAt: timestamp,
              }
            : item,
        ),
      )
      return
    }

    if (block.kind === 'idea' && block.entityId) {
      setIdeas((currentIdeas) =>
        currentIdeas.map((item) =>
          item.id === block.entityId
            ? {
                ...item,
                title: values.title,
                description: values.description || values.content,
                updatedAt: timestamp,
              }
            : item,
        ),
      )
      return
    }

    if (block.kind === 'goal' && block.entityId) {
      setGoals((currentGoals) =>
        currentGoals.map((item) =>
          item.id === block.entityId
            ? {
                ...item,
                title: values.title,
                description: values.description || values.content,
                updatedAt: timestamp,
              }
            : item,
        ),
      )
      return
    }

    if ((block.kind === 'file' || block.kind === 'photo' || block.kind === 'link') && block.entityId) {
      setFiles((currentFiles) =>
        currentFiles.map((item) =>
          item.id === block.entityId
            ? {
                ...item,
                title: values.title,
                description: values.description || values.content,
                path: values.url,
                previewUrl: block.kind === 'photo' ? values.url || null : item.previewUrl,
                updatedAt: timestamp,
              }
            : item,
        ),
      )
    }
  }

  function handleDeleteBlock(block: ProjectSection) {
    if (!project) {
      return
    }

    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить элемент «${block.title}» из проекта?`)
      : true

    if (!shouldDelete) {
      return
    }

    setSections((currentSections) =>
      currentSections
        .map((item) =>
          item.projectId === project.id && item.id !== block.id && item.relatedBlockIds.includes(block.id)
            ? {
                ...item,
                relatedBlockIds: item.relatedBlockIds.filter((id) => id !== block.id),
                updatedAt: new Date().toISOString(),
              }
            : item,
        )
        .filter((item) => item.id !== block.id),
    )

    if (block.entityId && getBlockRelationType(block.kind)) {
      deleteRelationsForItem(block.entityId)
    }

    if (block.kind === 'task' && block.entityId) {
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== block.entityId))
      updateProjectLinks({ taskIds: project.taskIds.filter((id) => id !== block.entityId) })
      return
    }

    if (block.kind === 'note' && block.entityId) {
      setNotes((currentNotes) => currentNotes.filter((item) => item.id !== block.entityId))
      updateProjectLinks({ noteIds: project.noteIds.filter((id) => id !== block.entityId) })
      return
    }

    if (block.kind === 'idea' && block.entityId) {
      setIdeas((currentIdeas) => currentIdeas.filter((item) => item.id !== block.entityId))
      updateProjectLinks({ ideaIds: project.ideaIds.filter((id) => id !== block.entityId) })
      return
    }

    if (block.kind === 'goal' && block.entityId) {
      setGoals((currentGoals) => currentGoals.filter((item) => item.id !== block.entityId))
      updateProjectLinks({ goalIds: project.goalIds.filter((id) => id !== block.entityId) })
      return
    }

    if ((block.kind === 'file' || block.kind === 'photo' || block.kind === 'link') && block.entityId) {
      setFiles((currentFiles) => currentFiles.filter((item) => item.id !== block.entityId))
      updateProjectLinks({ fileIds: project.fileIds.filter((id) => id !== block.entityId) })
      return
    }

    updateProjectLinks({})
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

  return (
    <section className="space-y-6">
      <div className="ui-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="ui-button px-3 py-2 text-sm"
            >
              Назад к проектам
            </button>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="ui-chip">{projectStatusLabels[project.status]}</span>
              {project.deadline ? <span className="ui-chip">Срок: {new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long' }).format(new Date(project.deadline))}</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-(--text-primary) md:text-4xl">{project.title}</h1>
            <p className="page-description mt-3 max-w-3xl text-sm leading-6 text-(--text-muted) md:text-base">{project.description || 'Описание проекта пока не заполнено.'}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="ui-button-accent px-5 py-3"
          >
            Редактировать проект
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Прогресс</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{completionRate}%</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Задачи</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{linkedTasks.length}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Заметки и идеи</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{linkedNotes.length + linkedIdeas.length}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Файлы</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{linkedFiles.length}</p>
          </div>
        </div>
      </div>

      <section className="ui-panel p-4 md:p-5">
        <div className="ui-filter-scroll">
          {detailTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                'ui-filter-pill',
                activeTab === tab.key
                  ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent) shadow-[0_6px_18px_rgba(57,39,255,0.12)]'
                  : 'hover:border-(--accent-border) hover:text-(--text-primary)',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            <div className="ui-panel p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Overview</p>
              <h2 className="ui-section-title mt-2">Сводка проекта</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="ui-panel-elevated p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Workspace blocks</p>
                  <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{workspaceBlocks.length}</p>
                </div>
                <div className="ui-panel-elevated p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Sections</p>
                  <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{projectSections.length}</p>
                </div>
                <div className="ui-panel-elevated p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Relations</p>
                  <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{projectRelations.length}</p>
                </div>
              </div>
            </div>

            <section className="ui-panel p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Linked Items</p>
              <h2 className="ui-section-title mt-2">Связанные элементы</h2>
              <div className="mt-5">
                <LinkedItemsPanel
                  selectedItems={selectedProjectRelations}
                  availableItems={availableRelationItems}
                  onChange={(items) => syncRelationsForItem(project.id, 'project', items)}
                  onOpenItem={(item) => navigate(getLinkedItemPath(item))}
                />
              </div>
            </section>
          </section>

          <div className="space-y-6">
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
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Workspace Focus</p>
              <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Навигация по рабочей поверхности</h2>
              <p className="mt-3 text-sm text-(--text-muted)">
                {activeSectionId
                  ? `Сейчас выбран подраздел «${projectSections.find((section) => section.id === activeSectionId)?.title ?? 'Подраздел'}».`
                  : 'Сейчас показаны все карточки проекта. Выберите подраздел, если нужно сфокусироваться на одном потоке работы.'}
              </p>
              <button type="button" onClick={() => setActiveTab('workspace')} className="ui-button-accent mt-4 px-4 py-3">Открыть workspace</button>
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === 'workspace' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <ProjectWorkspace
            project={project}
            sections={projectSections}
            blocks={workspaceBlocks}
            activeSectionId={activeSectionId}
            selectedBlockId={selectedWorkspaceBlockId}
            onSelectedBlockChange={setSelectedWorkspaceBlockId}
            selectedBlockRelatedItems={selectedBlockRelations}
            availableRelationItems={availableBlockRelationItems}
            onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
            onAddItem={handleAddItem}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
          />

          <div className="space-y-6">
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
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Workspace Focus</p>
              <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Навигация по рабочей поверхности</h2>
              <p className="mt-3 text-sm text-(--text-muted)">
                {activeSectionId
                  ? `Сейчас выбран подраздел «${projectSections.find((section) => section.id === activeSectionId)?.title ?? 'Подраздел'}».`
                  : 'Сейчас показаны все карточки проекта. Выберите подраздел, если нужно сфокусироваться на одном потоке работы.'}
              </p>
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === 'tasks' ? (
        <section className="ui-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Tasks</p>
              <h2 className="ui-section-title mt-2">Задачи проекта</h2>
            </div>
            <button type="button" onClick={() => setActiveTab('workspace')} className="ui-button-accent px-4 py-3">Добавить в workspace</button>
          </div>
          <div className="mt-5 grid gap-3">
            {linkedTasks.length > 0 ? linkedTasks.map((task) => (
              <button key={task.id} type="button" onClick={() => navigate('/tasks')} className="ui-panel-elevated p-4 text-left">
                <div className="flex flex-wrap items-center gap-2"><span className="ui-chip">Task</span><span className="ui-chip">{task.status}</span></div>
                <p className="mt-3 text-base font-semibold text-(--text-primary)">{task.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-(--text-muted)">{task.description || 'Без описания'}</p>
              </button>
            )) : <EmptyState title="Задач пока нет" description="Добавьте первую задачу в workspace проекта." actionLabel="Открыть workspace" onAction={() => setActiveTab('workspace')} />}
          </div>
        </section>
      ) : null}

      {activeTab === 'notes' ? (
        <section className="ui-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Notes</p>
              <h2 className="ui-section-title mt-2">Заметки проекта</h2>
            </div>
            <button type="button" onClick={() => setActiveTab('workspace')} className="ui-button-accent px-4 py-3">Добавить в workspace</button>
          </div>
          <div className="mt-5 grid gap-3">
            {linkedNotes.length > 0 ? linkedNotes.map((note) => (
              <button key={note.id} type="button" onClick={() => navigate('/notes')} className="ui-panel-elevated p-4 text-left">
                <span className="ui-chip">Note</span>
                <p className="mt-3 text-base font-semibold text-(--text-primary)">{note.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-(--text-muted)">{note.content || 'Без содержания'}</p>
              </button>
            )) : <EmptyState title="Заметок пока нет" description="Соберите контекст проекта заметками в workspace." actionLabel="Открыть workspace" onAction={() => setActiveTab('workspace')} />}
          </div>
        </section>
      ) : null}

      {activeTab === 'ideas' ? (
        <section className="ui-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Ideas</p>
              <h2 className="ui-section-title mt-2">Идеи проекта</h2>
            </div>
            <button type="button" onClick={() => setActiveTab('workspace')} className="ui-button-accent px-4 py-3">Добавить в workspace</button>
          </div>
          <div className="mt-5 grid gap-3">
            {linkedIdeas.length > 0 ? linkedIdeas.map((idea) => (
              <button key={idea.id} type="button" onClick={() => navigate('/ideas')} className="ui-panel-elevated p-4 text-left">
                <div className="flex items-center gap-2"><span className="ui-chip">Idea</span><span className="ui-chip">{idea.status}</span></div>
                <p className="mt-3 text-base font-semibold text-(--text-primary)">{idea.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-(--text-muted)">{idea.description || 'Без описания'}</p>
              </button>
            )) : <EmptyState title="Идей пока нет" description="Соберите гипотезы и мысли в рабочей поверхности проекта." actionLabel="Открыть workspace" onAction={() => setActiveTab('workspace')} />}
          </div>
        </section>
      ) : null}

      {activeTab === 'files' ? (
        <section className="ui-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Files</p>
              <h2 className="ui-section-title mt-2">Файлы проекта</h2>
            </div>
            <button type="button" onClick={() => setActiveTab('workspace')} className="ui-button-accent px-4 py-3">Добавить в workspace</button>
          </div>
          <div className="mt-5 grid gap-3">
            {linkedFiles.length > 0 ? linkedFiles.map((file) => (
              <button key={file.id} type="button" onClick={() => navigate('/files')} className="ui-panel-elevated p-4 text-left">
                <div className="flex items-center gap-2"><span className="ui-chip">File</span>{file.path ? <span className="ui-chip">linked</span> : null}</div>
                <p className="mt-3 text-base font-semibold text-(--text-primary)">{file.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-(--text-muted)">{file.description || file.path || 'Без описания'}</p>
              </button>
            )) : <EmptyState title="Файлов пока нет" description="Добавьте документы, ссылки или фото в workspace проекта." actionLabel="Открыть workspace" onAction={() => setActiveTab('workspace')} />}
          </div>
        </section>
      ) : null}

      {activeTab === 'map' ? (
        <ProjectRelationMap
          project={project}
          sections={projectSections}
          blocks={workspaceBlocks}
          tasks={linkedTasks}
          notes={linkedNotes}
          ideas={linkedIdeas}
          files={linkedFiles}
          goals={linkedGoals}
          relations={projectRelations}
          onOpenNode={handleOpenRelationNode}
        />
      ) : null}

      {isEditModalOpen ? (
        <ProjectFormModal
          mode="edit"
          project={project}
          relatedItems={selectedProjectRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateProject}
        />
      ) : null}
    </section>
  )
}
