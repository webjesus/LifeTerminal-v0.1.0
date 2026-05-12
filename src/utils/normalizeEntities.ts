import type {
  Goal,
  Idea,
  IdeaDifficulty,
  IdeaPriority,
  IdeaStatus,
  Note,
  NoteStatus,
  NoteType,
  Project,
  ProjectActivity,
  ProjectAttachment,
  ProjectGoal,
  ProjectMilestone,
  ProjectSection,
  Task,
} from '../types'
import { normalizeTag } from './tags'

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)))
}

function normalizeTags(value: unknown): string[] {
  return normalizeStringArray(value).map((item) => normalizeTag(item)).filter(Boolean)
}

function isNoteType(value: unknown): value is NoteType {
  return [
    'basic',
    'research',
    'instruction',
    'project_material',
    'personal_thought',
    'solution',
    'list',
    'reference',
  ].includes(String(value))
}

function isNoteStatus(value: unknown): value is NoteStatus {
  return ['draft', 'active', 'completed', 'archived'].includes(String(value))
}

function isIdeaStatus(value: unknown): value is IdeaStatus {
  return ['new', 'thinking', 'promising', 'planned', 'in_progress', 'implemented', 'postponed', 'archived'].includes(String(value))
}

function isIdeaPriority(value: unknown): value is IdeaPriority {
  return ['low', 'medium', 'high'].includes(String(value))
}

function isIdeaDifficulty(value: unknown): value is IdeaDifficulty {
  return ['low', 'medium', 'high'].includes(String(value))
}

function toGoalStatus(value: unknown): Goal['status'] {
  const next = String(value)

  if (next === 'new') {
    return 'planned'
  }

  if (next === 'planned' || next === 'in_progress' || next === 'completed' || next === 'archived') {
    return next
  }

  return 'planned'
}

export function normalizeTask(task: Task): Task {
  return {
    ...task,
    tags: normalizeTags((task as Partial<Task>).tags),
    noteIds: normalizeStringArray(task.noteIds),
    ideaIds: normalizeStringArray(task.ideaIds),
    fileIds: normalizeStringArray(task.fileIds),
    goalIds: normalizeStringArray(task.goalIds),
  }
}

export function normalizeNote(note: Note): Note {
  const raw = note as Partial<Note>

  return {
    ...note,
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    type: isNoteType(raw.type) ? raw.type : 'basic',
    status: isNoteStatus(raw.status) ? raw.status : 'draft',
    category: typeof raw.category === 'string' ? raw.category : '',
    tags: normalizeTags(raw.tags),
    projectId: typeof raw.projectId === 'string' ? raw.projectId : null,
    taskIds: normalizeStringArray(raw.taskIds),
    ideaIds: normalizeStringArray(raw.ideaIds),
    fileIds: normalizeStringArray(raw.fileIds),
    goalIds: normalizeStringArray(raw.goalIds),
  }
}

export function normalizeIdea(idea: Idea): Idea {
  const raw = idea as Partial<Idea>

  return {
    ...idea,
    problem: typeof raw.problem === 'string' ? raw.problem : '',
    value: typeof raw.value === 'string' ? raw.value : '',
    nextStep: typeof raw.nextStep === 'string' ? raw.nextStep : '',
    status: isIdeaStatus(raw.status) ? raw.status : raw.status === 'new' ? 'new' : 'new',
    priority: isIdeaPriority(raw.priority) ? raw.priority : 'medium',
    difficulty: isIdeaDifficulty(raw.difficulty) ? raw.difficulty : 'medium',
    tags: normalizeTags(raw.tags),
    projectId: typeof raw.projectId === 'string' ? raw.projectId : null,
    taskIds: normalizeStringArray(raw.taskIds),
    noteIds: normalizeStringArray(raw.noteIds),
    goalIds: normalizeStringArray(raw.goalIds),
  }
}

export function normalizeProject(project: Project): Project {
  const raw = project as Partial<Project>

  return {
    ...project,
    details: typeof raw.details === 'string' ? raw.details : '',
    tags: normalizeTags(raw.tags),
    priority: raw.priority === 'low' || raw.priority === 'high' ? raw.priority : 'medium',
    color: typeof raw.color === 'string' ? raw.color : '',
    icon: typeof raw.icon === 'string' ? raw.icon : '',
    sectionIds: normalizeStringArray(raw.sectionIds),
    taskIds: normalizeStringArray(raw.taskIds),
    noteIds: normalizeStringArray(raw.noteIds),
    ideaIds: normalizeStringArray(raw.ideaIds),
    fileIds: normalizeStringArray(raw.fileIds),
    goalIds: normalizeStringArray(raw.goalIds),
  }
}

export function normalizeGoal(goal: Goal): Goal {
  const raw = goal as Partial<Goal>
  const progressValue = typeof raw.progress === 'number' ? raw.progress : 0

  return {
    ...goal,
    status: toGoalStatus(raw.status),
    progress: Math.max(0, Math.min(100, progressValue)),
    taskIds: normalizeStringArray(raw.taskIds),
    noteIds: normalizeStringArray(raw.noteIds),
    ideaIds: normalizeStringArray(raw.ideaIds),
  }
}

function toMilestoneStatus(value: unknown): ProjectMilestone['status'] {
  const next = String(value)

  if (next === 'planned' || next === 'in_progress' || next === 'completed' || next === 'paused') {
    return next
  }

  return 'planned'
}

export function normalizeProjectGoal(goal: Partial<ProjectGoal>): ProjectGoal {
  const timestamp = new Date().toISOString()
  const progressValue = typeof goal.progress === 'number' ? goal.progress : 0

  return {
    id: String(goal.id ?? ''),
    projectId: String(goal.projectId ?? ''),
    title: typeof goal.title === 'string' ? goal.title : '',
    description: typeof goal.description === 'string' ? goal.description : '',
    status: toGoalStatus(goal.status),
    priority: goal.priority === 'low' || goal.priority === 'high' ? goal.priority : 'medium',
    progress: Math.max(0, Math.min(100, progressValue)),
    deadline: typeof goal.deadline === 'string' ? goal.deadline : null,
    taskIds: normalizeStringArray(goal.taskIds),
    noteIds: normalizeStringArray(goal.noteIds),
    ideaIds: normalizeStringArray(goal.ideaIds),
    fileIds: normalizeStringArray(goal.fileIds),
    tags: normalizeTags(goal.tags),
    createdAt: typeof goal.createdAt === 'string' ? goal.createdAt : timestamp,
    updatedAt: typeof goal.updatedAt === 'string' ? goal.updatedAt : timestamp,
  }
}

export function normalizeProjectMilestone(milestone: Partial<ProjectMilestone>): ProjectMilestone {
  const timestamp = new Date().toISOString()

  return {
    id: String(milestone.id ?? ''),
    projectId: String(milestone.projectId ?? ''),
    title: typeof milestone.title === 'string' ? milestone.title : '',
    description: typeof milestone.description === 'string' ? milestone.description : '',
    status: toMilestoneStatus(milestone.status),
    deadline: typeof milestone.deadline === 'string' ? milestone.deadline : null,
    taskIds: normalizeStringArray(milestone.taskIds),
    order: typeof milestone.order === 'number' ? milestone.order : 0,
    createdAt: typeof milestone.createdAt === 'string' ? milestone.createdAt : timestamp,
    updatedAt: typeof milestone.updatedAt === 'string' ? milestone.updatedAt : timestamp,
  }
}

export function normalizeProjectAttachment(attachment: Partial<ProjectAttachment>): ProjectAttachment {
  const timestamp = new Date().toISOString()

  return {
    id: String(attachment.id ?? ''),
    title: typeof attachment.title === 'string' ? attachment.title : '',
    description: typeof attachment.description === 'string' ? attachment.description : '',
    photoNote: typeof attachment.photoNote === 'string' ? attachment.photoNote : undefined,
    type: typeof attachment.type === 'string' ? attachment.type as ProjectAttachment['type'] : 'file',
    path: typeof attachment.path === 'string' ? attachment.path : '',
    previewUrl: typeof attachment.previewUrl === 'string' ? attachment.previewUrl : null,
    dataUrl: typeof attachment.dataUrl === 'string' ? attachment.dataUrl : undefined,
    url: typeof attachment.url === 'string' ? attachment.url : undefined,
    externalUrl: typeof attachment.externalUrl === 'string' ? attachment.externalUrl : undefined,
    fileName: typeof attachment.fileName === 'string' ? attachment.fileName : undefined,
    fileType: typeof attachment.fileType === 'string' ? attachment.fileType : undefined,
    fileSize: normalizeNumber(attachment.fileSize),
    tags: Array.isArray(attachment.tags) ? normalizeTags(attachment.tags) : [],
    linkedBlockId: typeof attachment.linkedBlockId === 'string' ? attachment.linkedBlockId : undefined,
    linkedItemId: typeof attachment.linkedItemId === 'string' ? attachment.linkedItemId : undefined,
    linkedItemType: typeof attachment.linkedItemType === 'string' ? attachment.linkedItemType as ProjectAttachment['linkedItemType'] : undefined,
    storagePath: typeof attachment.storagePath === 'string' ? attachment.storagePath : undefined,
    publicUrl: typeof attachment.publicUrl === 'string' ? attachment.publicUrl : undefined,
    uploadStatus: attachment.uploadStatus === 'uploading' || attachment.uploadStatus === 'uploaded' || attachment.uploadStatus === 'error' ? attachment.uploadStatus : 'local',
    createdAt: typeof attachment.createdAt === 'string' ? attachment.createdAt : timestamp,
    updatedAt: typeof attachment.updatedAt === 'string' ? attachment.updatedAt : timestamp,
    projectId: typeof attachment.projectId === 'string' ? attachment.projectId : null,
    taskId: typeof attachment.taskId === 'string' ? attachment.taskId : null,
    noteId: typeof attachment.noteId === 'string' ? attachment.noteId : null,
    ideaId: typeof attachment.ideaId === 'string' ? attachment.ideaId : null,
  }
}

export function normalizeProjectSection(section: ProjectSection): ProjectSection {
  const raw = section as Partial<ProjectSection>

  return {
    ...section,
    tags: normalizeTags(raw.tags),
    relatedBlockIds: normalizeStringArray(raw.relatedBlockIds),
    content: typeof raw.content === 'string' ? raw.content : '',
    url: typeof raw.url === 'string' ? raw.url : null,
  }
}

export function normalizeProjectActivity(activity: ProjectActivity): ProjectActivity {
  const raw = activity as Partial<ProjectActivity>

  return {
    ...activity,
    description: typeof raw.description === 'string' ? raw.description : '',
    relatedItemId: typeof raw.relatedItemId === 'string' ? raw.relatedItemId : null,
    relatedItemType: raw.relatedItemType ?? null,
  }
}

import type { ProjectWorkspaceBlock, ProjectWorkspaceRelation } from '../types'

function normalizeNumber(value: unknown, fallback: number | undefined = undefined): number | undefined {
  if (typeof value === 'number' && !isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) return Number(value)
  return fallback
}

export function normalizeProjectWorkspaceBlock(block: Partial<ProjectWorkspaceBlock>): ProjectWorkspaceBlock {
  return {
    id: String(block.id ?? ''),
    projectId: String(block.projectId ?? ''),
    type: typeof block.type === 'string' ? block.type as ProjectWorkspaceBlock["type"] : 'text',
    title: typeof block.title === 'string' ? block.title : '',
    content: typeof block.content === 'string' ? block.content : '',
    description: typeof block.description === 'string' ? block.description : '',
    sectionId: typeof block.sectionId === 'string' ? block.sectionId : null,
    x: normalizeNumber(block.x),
    y: normalizeNumber(block.y),
    width: normalizeNumber(block.width),
    height: normalizeNumber(block.height),
    color: typeof block.color === 'string' ? block.color : undefined,
    icon: typeof block.icon === 'string' ? block.icon : undefined,
    tags: Array.isArray(block.tags) ? normalizeTags(block.tags) : [],
    linkedItemId: typeof block.linkedItemId === 'string' ? block.linkedItemId : undefined,
    linkedItemType: typeof block.linkedItemType === 'string' ? block.linkedItemType as ProjectWorkspaceBlock["linkedItemType"] : undefined,
    fileUrl: typeof block.fileUrl === 'string' ? block.fileUrl : undefined,
    previewUrl: typeof block.previewUrl === 'string' ? block.previewUrl : undefined,
    dataUrl: typeof block.dataUrl === 'string' ? block.dataUrl : undefined,
    fileName: typeof block.fileName === 'string' ? block.fileName : undefined,
    fileType: typeof block.fileType === 'string' ? block.fileType : undefined,
    fileSize: normalizeNumber(block.fileSize),
    imageUrl: typeof block.imageUrl === 'string' ? block.imageUrl : undefined,
    externalUrl: typeof block.externalUrl === 'string' ? block.externalUrl : undefined,
    createdAt: typeof block.createdAt === 'string' ? block.createdAt : new Date().toISOString(),
    updatedAt: typeof block.updatedAt === 'string' ? block.updatedAt : new Date().toISOString(),
  }
}

export function normalizeProjectWorkspaceRelation(relation: Partial<ProjectWorkspaceRelation>): ProjectWorkspaceRelation {
  const timestamp = new Date().toISOString()

  return {
    id: String(relation.id ?? ''),
    projectId: String(relation.projectId ?? ''),
    fromBlockId: String(relation.fromBlockId ?? ''),
    toBlockId: String(relation.toBlockId ?? ''),
    type: typeof relation.type === 'string' ? relation.type as ProjectWorkspaceRelation["type"] : 'related',
    label: typeof relation.label === 'string' ? relation.label : undefined,
    createdAt: typeof relation.createdAt === 'string' ? relation.createdAt : timestamp,
    updatedAt: typeof relation.updatedAt === 'string' ? relation.updatedAt : (typeof relation.createdAt === 'string' ? relation.createdAt : timestamp),
  }
}
