import { createContext } from 'react'
import type { AppSettings, DeepPartial } from '../types/settings'

export type SettingsContextValue = {
  settings: AppSettings
  setSettings: (nextSettings: AppSettings | ((current: AppSettings) => AppSettings)) => void
  updateProfileSettings: (patch: DeepPartial<AppSettings['profile']>) => void
  updateAppearanceSettings: (patch: DeepPartial<AppSettings['appearance']>) => void
  updateDisplaySettings: (patch: DeepPartial<AppSettings['display']>) => void
  updateBehaviorSettings: (patch: DeepPartial<AppSettings['behavior']>) => void
  updateCalendarSettings: (patch: DeepPartial<AppSettings['calendar']>) => void
  updateNotificationSettings: (patch: DeepPartial<AppSettings['notifications']>) => void
  updateDataSettings: (patch: DeepPartial<AppSettings['data']>) => void
  resetSettings: () => void
  importSettings: (nextSettings: DeepPartial<AppSettings>) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)