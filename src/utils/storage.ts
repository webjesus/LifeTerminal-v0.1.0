export const storageKeys = {
  tasks: 'lifeos_tasks',
  notes: 'lifeos_notes',
  ideas: 'lifeos_ideas',
  projects: 'lifeos_projects',
  projectSections: 'lifeos_project_sections',
  files: 'lifeos_files',
  goals: 'lifeos_goals',
  relations: 'lifeos_relations',
  calendarEvents: 'lifeos_calendar_events',
  reminders: 'lifeos_reminders',
  appSettings: 'lifeos_settings',
} as const

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys]
export const STORAGE_CHANGE_EVENT = 'lifeos-storage-change'

export interface StorageAdapter {
  getItem<T>(key: string, defaultValue: T): T
  setItem<T>(key: string, value: T): void
  removeItem(key: string): void
}

function isBrowserStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function dispatchStorageChange(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } }))
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isBrowserStorageAvailable()) {
    return defaultValue
  }

  try {
    const item = window.localStorage.getItem(key)

    if (item === null) {
      return defaultValue
    }

    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (!isBrowserStorageAvailable()) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    dispatchStorageChange(key)
  } catch {
    // Ignore storage write errors for now and keep app responsive.
  }
}

export function removeStorageItem(key: string): void {
  if (!isBrowserStorageAvailable()) {
    return
  }

  try {
    window.localStorage.removeItem(key)
    dispatchStorageChange(key)
  } catch {
    // Ignore storage removal errors for now and keep app responsive.
  }
}

export const localStorageAdapter: StorageAdapter = {
  getItem: getStorageItem,
  setItem: setStorageItem,
  removeItem: removeStorageItem,
}
