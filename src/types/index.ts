export type EntityId = string
export type ISODateString = string

export type TaskStatus = 'new' | 'in_progress' | 'waiting' | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high'

export type IdeaStatus = 'new' | 'thinking' | 'in_progress' | 'implemented' | 'postponed'

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export type GoalStatus = 'new' | 'in_progress' | 'completed' | 'archived'

export type ProjectSectionKind =
  | 'section'
  | 'task'
  | 'note'
  | 'idea'
  | 'goal'
  | 'file'
  | 'photo'
  | 'text'
  | 'link'
  | 'thought'

export type RelationEntityType =
  | 'task'
  | 'note'
  | 'idea'
  | 'project'
  | 'project_section'
  | 'file'
  | 'goal'
  | 'calendar_event'
  | 'reminder'

export type FileItemType =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'link'
  | 'other'

export type CalendarEventType =
  | 'task'
  | 'deadline'
  | 'meeting'
  | 'goal'
  | 'project'
  | 'reminder'
  | 'custom'

export type LinkedItemType =
  | 'task'
  | 'note'
  | 'idea'
  | 'project'
  | 'file'
  | 'goal'

export type Task = {
  id: EntityId
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  deadline: ISODateString | null
  createdAt: ISODateString
  updatedAt: ISODateString
  completedAt: ISODateString | null
  projectId: EntityId | null
  noteIds: EntityId[]
  ideaIds: EntityId[]
  fileIds: EntityId[]
  goalIds: EntityId[]
}

export type Note = {
  id: EntityId
  title: string
  content: string
  tags: string[]
  createdAt: ISODateString
  updatedAt: ISODateString
  projectId: EntityId | null
  taskIds: EntityId[]
  ideaIds: EntityId[]
  fileIds: EntityId[]
  goalIds: EntityId[]
}

export type Idea = {
  id: EntityId
  title: string
  description: string
  status: IdeaStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  projectId: EntityId | null
  taskIds: EntityId[]
  noteIds: EntityId[]
  goalIds: EntityId[]
}

export type Project = {
  id: EntityId
  title: string
  description: string
  status: ProjectStatus
  goal: string
  deadline: ISODateString | null
  createdAt: ISODateString
  updatedAt: ISODateString
  sectionIds: EntityId[]
  taskIds: EntityId[]
  noteIds: EntityId[]
  ideaIds: EntityId[]
  fileIds: EntityId[]
  goalIds: EntityId[]
}

export type ProjectSection = {
  id: EntityId
  projectId: EntityId
  title: string
  description: string
  order: number
  kind: ProjectSectionKind
  parentSectionId: EntityId | null
  entityId: EntityId | null
  relatedBlockIds: EntityId[]
  content: string
  url: string | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type FileItem = {
  id: EntityId
  title: string
  description: string
  photoNote?: string
  type: FileItemType
  path: string
  previewUrl: string | null
  tags: string[]
  createdAt: ISODateString
  updatedAt: ISODateString
  projectId: EntityId | null
  taskId: EntityId | null
  noteId: EntityId | null
  ideaId: EntityId | null
}

export type Goal = {
  id: EntityId
  title: string
  description: string
  status: GoalStatus
  deadline: ISODateString | null
  createdAt: ISODateString
  updatedAt: ISODateString
  projectId: EntityId | null
  taskIds: EntityId[]
  noteIds: EntityId[]
  ideaIds: EntityId[]
}

export type Relation = {
  id: EntityId
  sourceId: EntityId
  sourceType: RelationEntityType
  targetId: EntityId
  targetType: RelationEntityType
  label: string
  createdAt: ISODateString
}

export type CalendarEvent = {
  id: EntityId
  title: string
  description: string
  date: ISODateString
  type: CalendarEventType
  linkedItemId: EntityId | null
  linkedItemType: LinkedItemType | null
  createdAt: ISODateString
}

export type Reminder = {
  id: EntityId
  title: string
  description: string
  remindAt: ISODateString
  linkedItemId: EntityId | null
  linkedItemType: LinkedItemType | null
  completed: boolean
  createdAt: ISODateString
}

export * from './settings'
