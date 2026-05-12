import type { FileItem, Goal, Idea, Note, Project, ProjectSection, Relation, RelationEntityType, Task } from '../types'
import { getStorageItem, setStorageItem, storageKeys } from './storage'

export type LinkableRelationType = 'task' | 'note' | 'idea' | 'project' | 'file' | 'goal' | 'section'

export type RelationSelectableItem = {
  id: string
  type: LinkableRelationType
  title: string
  description: string
  projectId?: string | null
}

export type LinkedRelationItem = RelationSelectableItem & {
  relationId: string
  label: string
}

type RelationCatalogInput = {
  tasks?: Task[]
  notes?: Note[]
  ideas?: Idea[]
  projects?: Project[]
  files?: FileItem[]
  goals?: Goal[]
  sections?: ProjectSection[]
}

function getAllRelations() {
  return getStorageItem<Relation[]>(storageKeys.relations, [])
}

function setAllRelations(relations: Relation[]) {
  setStorageItem(storageKeys.relations, relations)
}

export function normalizeRelationType(type: LinkableRelationType | RelationEntityType): RelationEntityType {
  return type === 'section' ? 'project_section' : type
}

export function denormalizeRelationType(type: RelationEntityType): LinkableRelationType {
  return type === 'project_section' ? 'section' : (type as LinkableRelationType)
}

function createRelationSignature(
  sourceId: string,
  sourceType: RelationEntityType,
  targetId: string,
  targetType: RelationEntityType,
) {
  return [
    `${sourceType}:${sourceId}`,
    `${targetType}:${targetId}`,
  ].sort().join('::')
}

export function isEditableRelation(relation: Relation) {
  return !relation.id.startsWith('project:')
}

export function createRelation(
  sourceId: string,
  sourceType: LinkableRelationType | RelationEntityType,
  targetId: string,
  targetType: LinkableRelationType | RelationEntityType,
  label: string,
) {
  const normalizedSourceType = normalizeRelationType(sourceType)
  const normalizedTargetType = normalizeRelationType(targetType)

  if (sourceId === targetId && normalizedSourceType === normalizedTargetType) {
    return null
  }

  const currentRelations = getAllRelations()
  const signature = createRelationSignature(sourceId, normalizedSourceType, targetId, normalizedTargetType)
  const existingRelation = currentRelations.find(
    (relation) =>
      createRelationSignature(relation.sourceId, relation.sourceType, relation.targetId, relation.targetType) === signature,
  )

  if (existingRelation) {
    return existingRelation
  }

  const nextRelation: Relation = {
    id: crypto.randomUUID(),
    sourceId,
    sourceType: normalizedSourceType,
    targetId,
    targetType: normalizedTargetType,
    label,
    createdAt: new Date().toISOString(),
  }

  setAllRelations([...currentRelations, nextRelation])
  return nextRelation
}

export function deleteRelation(relationId: string) {
  setAllRelations(getAllRelations().filter((relation) => relation.id !== relationId))
}

export function getRelationsForItem(itemId: string) {
  return getAllRelations().filter(
    (relation) => relation.sourceId === itemId || relation.targetId === itemId,
  )
}

export function checkRelationExists(sourceId: string, targetId: string) {
  return getAllRelations().some(
    (relation) =>
      (relation.sourceId === sourceId && relation.targetId === targetId) ||
      (relation.sourceId === targetId && relation.targetId === sourceId),
  )
}

export function buildRelationCatalog({
  tasks = [],
  notes = [],
  ideas = [],
  projects = [],
  files = [],
  goals = [],
  sections = [],
}: RelationCatalogInput): RelationSelectableItem[] {
  return [
    ...tasks.map((task) => ({ id: task.id, type: 'task' as const, title: task.title, description: task.description })),
    ...notes.map((note) => ({ id: note.id, type: 'note' as const, title: note.title, description: note.summary || note.content })),
    ...ideas.map((idea) => ({ id: idea.id, type: 'idea' as const, title: idea.title, description: idea.problem || idea.description })),
    ...projects.map((project) => ({ id: project.id, type: 'project' as const, title: project.title, description: project.description })),
    ...files.map((file) => ({ id: file.id, type: 'file' as const, title: file.title, description: file.description || file.path, projectId: file.projectId })),
    ...goals.map((goal) => ({ id: goal.id, type: 'goal' as const, title: goal.title, description: goal.description, projectId: goal.projectId })),
    ...sections.map((section) => ({ id: section.id, type: 'section' as const, title: section.title, description: section.description, projectId: section.projectId })),
  ]
}

function getStorageBackedCatalog() {
  return buildRelationCatalog({
    tasks: getStorageItem<Task[]>(storageKeys.tasks, []),
    notes: getStorageItem<Note[]>(storageKeys.notes, []),
    ideas: getStorageItem<Idea[]>(storageKeys.ideas, []),
    projects: getStorageItem<Project[]>(storageKeys.projects, []),
    files: getStorageItem<FileItem[]>(storageKeys.files, []),
    goals: getStorageItem<Goal[]>(storageKeys.goals, []),
    sections: getStorageItem<ProjectSection[]>(storageKeys.projectSections, []),
  })
}

export function getLinkedItemsFromRelations(
  itemId: string,
  relations: Relation[],
  catalog: RelationSelectableItem[],
) {
  const catalogMap = new Map(catalog.map((item) => [`${item.type}:${item.id}`, item]))

  return relations.flatMap<LinkedRelationItem>((relation) => {
    const isSource = relation.sourceId === itemId
    const linkedId = isSource ? relation.targetId : relation.sourceId
    const linkedType = denormalizeRelationType(isSource ? relation.targetType : relation.sourceType)
    const linkedItem = catalogMap.get(`${linkedType}:${linkedId}`)

    if (!linkedItem) {
      return []
    }

    return [
      {
        ...linkedItem,
        relationId: relation.id,
        label: relation.label,
      },
    ]
  })
}

export function getLinkedItems(itemId: string) {
  return getLinkedItemsFromRelations(itemId, getRelationsForItem(itemId), getStorageBackedCatalog())
}

export function syncRelationsForItem(
  itemId: string,
  itemType: LinkableRelationType | RelationEntityType,
  nextLinkedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>,
  label = 'linked',
) {
  const normalizedItemType = normalizeRelationType(itemType)
  const currentRelations = getRelationsForItem(itemId).filter((relation) => {
    if (!isEditableRelation(relation)) {
      return false
    }

    const sourceMatches = relation.sourceId === itemId && relation.sourceType === normalizedItemType
    const targetMatches = relation.targetId === itemId && relation.targetType === normalizedItemType
    return sourceMatches || targetMatches
  })

  const nextSignatures = new Set(
    nextLinkedItems.map((item) =>
      createRelationSignature(itemId, normalizedItemType, item.id, normalizeRelationType(item.type)),
    ),
  )

  currentRelations.forEach((relation) => {
    const signature = createRelationSignature(relation.sourceId, relation.sourceType, relation.targetId, relation.targetType)

    if (!nextSignatures.has(signature)) {
      deleteRelation(relation.id)
    }
  })

  nextLinkedItems.forEach((item) => {
    createRelation(itemId, normalizedItemType, item.id, item.type, label)
  })
}

export function deleteRelationsForItem(itemId: string) {
  const relationIds = getRelationsForItem(itemId).map((relation) => relation.id)

  relationIds.forEach((relationId) => deleteRelation(relationId))
}

export const relationTypeLabels: Record<LinkableRelationType, string> = {
  task: 'Задача',
  note: 'Заметка',
  idea: 'Идея',
  project: 'Проект',
  file: 'Файл',
  goal: 'Цель',
  section: 'Подраздел',
}

export function getLinkedItemPath(item: Pick<RelationSelectableItem, 'type' | 'id' | 'projectId'>) {
  switch (item.type) {
    case 'project':
      return `/projects/${item.id}`
    case 'section':
      return item.projectId ? `/projects/${item.projectId}` : '/projects'
    case 'task':
      return '/tasks'
    case 'note':
      return `/notes/${item.id}`
    case 'idea':
      return `/ideas/${item.id}`
    case 'file':
      return '/files'
    case 'goal':
    default:
      return '/projects'
  }
}
