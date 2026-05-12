import defaultSettings from '../data/defaultSettings'
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
  ProjectWorkspaceBlock,
  ProjectWorkspaceRelation,
  Reminder,
  Relation,
  Task,
} from '../types'
import type { AppSettings } from '../types/settings'
import { normalizeSettings } from './settingsStorage'

type AppStateLike = {
  tasks?: unknown
  notes?: unknown
  ideas?: unknown
  projects?: unknown
  project_sections?: unknown
  files?: unknown
  projectAttachments?: unknown
  goals?: unknown
  projectGoals?: unknown
  projectMilestones?: unknown
  project_activities?: unknown
  relations?: unknown
  calendar_events?: unknown
  reminders?: unknown
  settings?: unknown
  projectWorkspaceBlocks?: unknown
  projectWorkspaceRelations?: unknown
}

export function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function safeDateFormat(
  value: string | Date | null | undefined,
  formatter: Intl.DateTimeFormat,
  fallback = 'Не задан',
) {
  if (!value) {
    return fallback
  }

  const nextDate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(nextDate.getTime())) {
    return fallback
  }

  return formatter.format(nextDate)
}

export function getEntityTitle(entity: { title?: string | null; name?: string | null } | null | undefined, fallback = 'Без названия') {
  const title = typeof entity?.title === 'string' ? entity.title.trim() : ''
  const name = typeof entity?.name === 'string' ? entity.name.trim() : ''
  return title || name || fallback
}

export function getProjectByIdSafe(projects: Project[], projectId: string | null | undefined) {
  if (!projectId) {
    return null
  }

  return projects.find((project) => project.id === projectId) ?? null
}

export function getLinkedItemSafe<T extends { id: string }>(items: T[], itemId: string | null | undefined) {
  if (!itemId) {
    return null
  }

  return items.find((item) => item.id === itemId) ?? null
}

export function normalizeAppState(data: unknown) {
  const source = isRecord(data) ? data as AppStateLike : {}

  return {
    tasks: ensureArray<Task>(source.tasks),
    notes: ensureArray<Note>(source.notes),
    ideas: ensureArray<Idea>(source.ideas),
    projects: ensureArray<Project>(source.projects),
    project_sections: ensureArray(source.project_sections),
    files: ensureArray<FileItem>(source.files),
    projectAttachments: ensureArray<ProjectAttachment>(source.projectAttachments),
    goals: ensureArray<Goal>(source.goals),
    projectGoals: ensureArray<ProjectGoal>(source.projectGoals),
    projectMilestones: ensureArray<ProjectMilestone>(source.projectMilestones),
    project_activities: ensureArray<ProjectActivity>(source.project_activities),
    relations: ensureArray<Relation>(source.relations),
    calendar_events: ensureArray(source.calendar_events),
    reminders: ensureArray<Reminder>(source.reminders),
    settings: normalizeSettings(isRecord(source.settings) ? source.settings as Partial<AppSettings> : defaultSettings),
    projectWorkspaceBlocks: ensureArray<ProjectWorkspaceBlock>(source.projectWorkspaceBlocks),
    projectWorkspaceRelations: ensureArray<ProjectWorkspaceRelation>(source.projectWorkspaceRelations),
  }
}