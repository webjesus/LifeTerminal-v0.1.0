export type EntityId = string
export type ISODateString = string

export type TaskStatus = 'new' | 'in_progress' | 'waiting' | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high'

export type NoteType =
  | 'basic'
  | 'research'
  | 'instruction'
  | 'project_material'
  | 'personal_thought'
  | 'solution'
  | 'list'
  | 'reference'

export type NoteStatus = 'draft' | 'active' | 'completed' | 'archived'

export type IdeaStatus =
  | 'new'
  | 'thinking'
  | 'promising'
  | 'planned'
  | 'in_progress'
  | 'implemented'
  | 'postponed'
  | 'archived'

export type IdeaPriority = 'low' | 'medium' | 'high'

export type IdeaDifficulty = 'low' | 'medium' | 'high'

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived'

export type ProjectPriority = 'low' | 'medium' | 'high'

export type GoalStatus = 'planned' | 'in_progress' | 'completed' | 'archived'

export type ProjectMilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'paused'

export type ProjectSectionKind =
  | 'section'
  | 'task'
  | 'note'
  | 'idea'
  | 'goal'
  | 'file'
  | 'text'
  | 'link'
  | 'problem'
  | 'solution'
  | 'photo'
  | 'thought'

export type RelationEntityType =
  | 'task'
  | 'note'
  | 'idea'
  | 'project'
  | 'project_section'
  | 'file'
  | 'goal'
  | 'milestone'
  | 'calendar_event'
  | 'reminder'

export type FileItemType =
  | 'file'
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'link'
  | 'other'

export type UploadStatus = 'local' | 'uploading' | 'uploaded' | 'error'

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
  tags: string[]
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
  summary: string
  content: string
  type: NoteType
  status: NoteStatus
  tags: string[]
  category: string
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
  problem: string
  value: string
  nextStep: string
  status: IdeaStatus
  priority: IdeaPriority
  difficulty: IdeaDifficulty
  tags: string[]
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
  details?: string
  tags: string[]
  status: ProjectStatus
  priority?: ProjectPriority
  goal: string
  deadline: ISODateString | null
  color?: string
  icon?: string
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
  tags: string[]
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
  dataUrl?: string
  url?: string
  externalUrl?: string
  fileName?: string
  fileType?: string
  fileSize?: number
  tags: string[]
  linkedBlockId?: EntityId
  linkedItemId?: EntityId
  linkedItemType?: 'task' | 'note' | 'idea' | 'goal' | 'file'
  storagePath?: string
  publicUrl?: string
  uploadStatus?: UploadStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  projectId: EntityId | null
  taskId: EntityId | null
  noteId: EntityId | null
  ideaId: EntityId | null
}

export type ProjectAttachment = FileItem

export type Goal = {
  id: EntityId
  title: string
  description: string
  status: GoalStatus
  deadline: ISODateString | null
  progress: number
  createdAt: ISODateString
  updatedAt: ISODateString
  projectId: EntityId | null
  taskIds: EntityId[]
  noteIds: EntityId[]
  ideaIds: EntityId[]
}

export type ProjectGoal = {
  id: EntityId
  projectId: EntityId
  title: string
  description: string
  status: GoalStatus
  priority: ProjectPriority
  progress: number
  deadline: ISODateString | null
  taskIds: EntityId[]
  noteIds: EntityId[]
  ideaIds: EntityId[]
  fileIds: EntityId[]
  tags: string[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type ProjectMilestone = {
  id: EntityId
  projectId: EntityId
  title: string
  description: string
  status: ProjectMilestoneStatus
  deadline: ISODateString | null
  taskIds: EntityId[]
  order: number
  createdAt: ISODateString
  updatedAt: ISODateString
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

export type ProjectActivityType =
  | 'project_created'
  | 'project_updated'
  | 'task_created'
  | 'task_completed'
  | 'note_created'
  | 'idea_created'
  | 'file_added'
  | 'goal_created'
  | 'goal_completed'
  | 'milestone_created'
  | 'milestone_completed'
  | 'workspace_block_created'
  | 'workspace_block_updated'
  | 'workspace_block_deleted'
  | 'workspace_block_moved'
  | 'workspace_block_section_changed'
  | 'relation_created'

export type ProjectActivity = {
  id: EntityId
  projectId: EntityId
  type: ProjectActivityType
  title: string
  description: string
  relatedItemId: EntityId | null
  relatedItemType: RelationEntityType | null
  createdAt: ISODateString
}


// ===== Workspace/Canvas =====

export type ProjectWorkspaceBlockType =
  | 'text'
  | 'task'
  | 'note'
  | 'idea'
  | 'goal'
  | 'file'
  | 'image'
  | 'link'
  | 'comment'
  | 'drawing'

export type ProjectWorkspaceBlock = {
  id: EntityId
  projectId: EntityId
  type: ProjectWorkspaceBlockType
  title: string
  content?: string
  description?: string
  sectionId?: EntityId | null
  x?: number
  y?: number
  width?: number
  height?: number
  color?: string
  icon?: string
  tags: string[]
  linkedItemId?: EntityId
  linkedItemType?: 'task' | 'note' | 'idea' | 'goal' | 'file'
  fileUrl?: string
  previewUrl?: string
  dataUrl?: string
  fileName?: string
  fileType?: string
  fileSize?: number
  imageUrl?: string
  externalUrl?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type ProjectWorkspaceRelationType =
  | 'related'
  | 'depends_on'
  | 'supports'
  | 'blocks'
  | 'idea_to_task'
  | 'note_to_task'
  | 'file_to_block'
  | 'goal_to_task'

export type ProjectWorkspaceRelation = {
  id: EntityId
  projectId: EntityId
  fromBlockId: EntityId
  toBlockId: EntityId
  type: ProjectWorkspaceRelationType
  label?: string
  createdAt: ISODateString
  updatedAt: ISODateString
}

export * from './settings'
