import defaultSettings from '../data/defaultSettings'
import type { AppSettings } from '../types/settings'
import { getStorageItem, setStorageItem, storageKeys } from './storage'
import { isRecord, normalizeAppState } from './safe'
import { sanitizePinnedNextTaskId } from './tasks'

export const APP_STATE_STORAGE_MAP = {
  tasks: storageKeys.tasks,
  notes: storageKeys.notes,
  ideas: storageKeys.ideas,
  projects: storageKeys.projects,
  project_sections: storageKeys.projectSections,
  files: storageKeys.files,
  projectAttachments: storageKeys.projectAttachments,
  goals: storageKeys.goals,
  projectGoals: storageKeys.projectGoals,
  projectMilestones: storageKeys.projectMilestones,
  project_activities: storageKeys.projectActivities,
  relations: storageKeys.relations,
  calendar_events: storageKeys.calendarEvents,
  reminders: storageKeys.reminders,
  settings: storageKeys.appSettings,
  projectWorkspaceBlocks: storageKeys.projectWorkspaceBlocks,
  projectWorkspaceRelations: storageKeys.projectWorkspaceRelations,
} as const

type AppStateKey = keyof typeof APP_STATE_STORAGE_MAP

export type FullLocalAppState = Record<AppStateKey, unknown>

const APP_STATE_DEFAULTS: FullLocalAppState = {
  tasks: [],
  notes: [],
  ideas: [],
  projects: [],
  project_sections: [],
  files: [],
  projectAttachments: [],
  goals: [],
  projectGoals: [],
  projectMilestones: [],
  project_activities: [],
  relations: [],
  calendar_events: [],
  reminders: [],
  settings: defaultSettings,
  projectWorkspaceBlocks: [],
  projectWorkspaceRelations: [],
}

const CONTENT_KEYS: AppStateKey[] = [
  'tasks',
  'notes',
  'ideas',
  'projects',
  'project_sections',
  'files',
  'projectAttachments',
  'goals',
  'projectGoals',
  'projectMilestones',
  'project_activities',
  'projectWorkspaceBlocks',
  'projectWorkspaceRelations',
  'relations',
  'calendar_events',
  'reminders',
]

function hasMeaningfulValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0
  }

  return Boolean(value)
}

function sanitizeStateSettings(state: FullLocalAppState) {
  const tasks = Array.isArray(state.tasks) ? state.tasks : []
  const settings = state.settings as AppSettings

  return {
    ...settings,
    behavior: {
      ...settings.behavior,
      pinnedNextTaskId: sanitizePinnedNextTaskId(tasks, settings.behavior.pinnedNextTaskId),
    },
  }
}

export function getFullLocalAppState(): FullLocalAppState {
  const rawState = (Object.keys(APP_STATE_STORAGE_MAP) as AppStateKey[]).reduce<FullLocalAppState>(
    (accumulator, appStateKey) => {
      const storageKey = APP_STATE_STORAGE_MAP[appStateKey]
      accumulator[appStateKey] = getStorageItem(storageKey, APP_STATE_DEFAULTS[appStateKey])
      return accumulator
    },
    { ...APP_STATE_DEFAULTS },
  )

  const normalizedState = normalizeAppState(rawState) as FullLocalAppState
  normalizedState.settings = sanitizeStateSettings(normalizedState)

  return normalizedState
}

export function restoreFullLocalAppState(data: unknown) {
  const source = normalizeAppState(data) as FullLocalAppState
  source.settings = sanitizeStateSettings(source)

  for (const appStateKey of Object.keys(APP_STATE_STORAGE_MAP) as AppStateKey[]) {
    const storageKey = APP_STATE_STORAGE_MAP[appStateKey]
    const fallback = APP_STATE_DEFAULTS[appStateKey]
    const nextValue = appStateKey in source ? source[appStateKey] : fallback

    setStorageItem(storageKey, nextValue)
  }
}

export function hasMeaningfulAppState(data: unknown) {
  const source = isRecord(data) ? data : {}

  return CONTENT_KEYS.some((key) => hasMeaningfulValue(source[key]))
}
