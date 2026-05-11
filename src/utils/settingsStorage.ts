import defaultSettings from '../data/defaultSettings'
import { getStorageItem, setStorageItem } from './storage'
import type { AppSettings, DeepPartial } from '../types/settings'

export const SETTINGS_STORAGE_KEY = 'lifeos_settings'

const LEGACY_SETTINGS_KEYS = ['lifeos_app_settings', 'life_terminal_settings'] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeWithDefaults<T>(defaults: T, incoming: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(incoming) ? incoming : defaults) as T
  }

  if (isPlainObject(defaults)) {
    const source = isPlainObject(incoming) ? incoming : {}

    return Object.keys(defaults).reduce((accumulator, key) => {
      const typedKey = key as keyof T
      const defaultValue = defaults[typedKey]
      const nextValue = source[key]

      accumulator[typedKey] = mergeWithDefaults(defaultValue, nextValue)
      return accumulator
    }, { ...defaults } as T)
  }

  return (incoming ?? defaults) as T
}

function readRawSettings(): unknown {
  const primary = getStorageItem<string | null>(SETTINGS_STORAGE_KEY, null)

  if (primary !== null) {
    return primary
  }

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null
  }

  for (const key of LEGACY_SETTINGS_KEYS) {
    const item = window.localStorage.getItem(key)

    if (item !== null) {
      return item
    }
  }

  return null
}

function parseRawSettings(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    return raw
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function normalizeSettings(settings?: DeepPartial<AppSettings> | null): AppSettings {
  return mergeWithDefaults(defaultSettings, settings)
}

export function getSettings(): AppSettings {
  const parsed = parseRawSettings(readRawSettings())
  return normalizeSettings(isPlainObject(parsed) ? (parsed as DeepPartial<AppSettings>) : null)
}

export function saveSettings(settings: AppSettings): void {
  setStorageItem(SETTINGS_STORAGE_KEY, settings)
}

export function updateSettings(partialSettings: DeepPartial<AppSettings>): AppSettings {
  const merged = normalizeSettings(mergeWithDefaults(getSettings(), partialSettings))
  saveSettings(merged)
  return merged
}

export function replaceSettings(nextSettings: DeepPartial<AppSettings>): AppSettings {
  const normalized = normalizeSettings(nextSettings)
  saveSettings(normalized)
  return normalized
}

export function resetSettings(): AppSettings {
  const resetValue = normalizeSettings(defaultSettings)
  saveSettings(resetValue)
  return resetValue
}