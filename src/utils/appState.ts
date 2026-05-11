import defaultSettings from '../data/defaultSettings'
import { getStorageItem, setStorageItem, storageKeys } from './storage'

export const APP_STATE_STORAGE_MAP = {
  tasks: storageKeys.tasks,
  notes: storageKeys.notes,
  ideas: storageKeys.ideas,
  projects: storageKeys.projects,
  project_sections: storageKeys.projectSections,
  files: storageKeys.files,
  goals: storageKeys.goals,
  relations: storageKeys.relations,
  calendar_events: storageKeys.calendarEvents,
  reminders: storageKeys.reminders,
  settings: storageKeys.appSettings,
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
  goals: [],
  relations: [],
  calendar_events: [],
  reminders: [],
  settings: defaultSettings,
}

const CONTENT_KEYS: AppStateKey[] = [
  'tasks',
  'notes',
  'ideas',
  'projects',
  'project_sections',
  'files',
  'goals',
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getFullLocalAppState(): FullLocalAppState {
  return (Object.keys(APP_STATE_STORAGE_MAP) as AppStateKey[]).reduce<FullLocalAppState>(
    (accumulator, appStateKey) => {
      const storageKey = APP_STATE_STORAGE_MAP[appStateKey]
      accumulator[appStateKey] = getStorageItem(storageKey, APP_STATE_DEFAULTS[appStateKey])
      return accumulator
    },
    { ...APP_STATE_DEFAULTS },
  )
}

export function restoreFullLocalAppState(data: unknown) {
  const source = isObject(data) ? data : {}

  for (const appStateKey of Object.keys(APP_STATE_STORAGE_MAP) as AppStateKey[]) {
    const storageKey = APP_STATE_STORAGE_MAP[appStateKey]
    const fallback = APP_STATE_DEFAULTS[appStateKey]
    const nextValue = appStateKey in source ? source[appStateKey] : fallback

    setStorageItem(storageKey, nextValue)
  }
}

export function hasMeaningfulAppState(data: unknown) {
  const source = isObject(data) ? data : {}

  return CONTENT_KEYS.some((key) => hasMeaningfulValue(source[key]))
}
