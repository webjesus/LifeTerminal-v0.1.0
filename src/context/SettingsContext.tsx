import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import {
  getSettings,
  normalizeSettings,
  replaceSettings,
  resetSettings as resetStoredSettings,
  saveSettings,
} from '../utils/settingsStorage'
import { STORAGE_CHANGE_EVENT, storageKeys } from '../utils/storage'
import type { AppSettings } from '../types/settings'
import { SettingsContext, type SettingsContextValue } from './settingsContext'

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settingsState, setSettingsState] = useState<AppSettings>(() => getSettings())

  useEffect(() => {
    const syncSettings = () => {
      setSettingsState(getSettings())
    }

    const handleNativeStorage = (event: StorageEvent) => {
      if (event.key !== storageKeys.appSettings) {
        return
      }

      syncSettings()
    }

    const handleCustomStorage = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>

      if (customEvent.detail?.key !== storageKeys.appSettings) {
        return
      }

      syncSettings()
    }

    window.addEventListener('storage', handleNativeStorage)
    window.addEventListener(STORAGE_CHANGE_EVENT, handleCustomStorage)

    return () => {
      window.removeEventListener('storage', handleNativeStorage)
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleCustomStorage)
    }
  }, [])

  function setPersistedSettings(nextSettings: AppSettings | ((current: AppSettings) => AppSettings)) {
    setSettingsState((current) => {
      const resolved = normalizeSettings(
        typeof nextSettings === 'function' ? nextSettings(current) : nextSettings,
      )
      saveSettings(resolved)
      return resolved
    })
  }

  const value = useMemo<SettingsContextValue>(() => ({
    settings: settingsState,
    setSettings: setPersistedSettings,
    updateProfileSettings: (patch) => {
      setPersistedSettings((current) => ({
        ...current,
        profile: {
          ...current.profile,
          ...patch,
        },
      }))
    },
    updateAppearanceSettings: (patch) => {
      setPersistedSettings((current) => ({
        ...current,
        appearance: {
          ...current.appearance,
          ...patch,
        },
      }))
    },
    updateDisplaySettings: (patch) => {
      setPersistedSettings((current) => ({
        ...current,
        display: {
          ...current.display,
          ...patch,
          visibleModules: {
            ...current.display.visibleModules,
            ...(patch.visibleModules ?? {}),
          },
        },
      }))
    },
    updateBehaviorSettings: (patch) => {
      setPersistedSettings((current) => ({
        ...current,
        behavior: {
          ...current.behavior,
          ...patch,
        },
      }))
    },
    updateCalendarSettings: (patch) => {
      setPersistedSettings((current) => ({
        ...current,
        calendar: {
          ...current.calendar,
          ...patch,
        },
      }))
    },
    updateNotificationSettings: (patch) => {
      setPersistedSettings((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          ...patch,
        },
      }))
    },
    updateDataSettings: (patch) => {
      setPersistedSettings((current) => ({
        ...current,
        data: {
          ...current.data,
          ...patch,
        },
      }))
    },
    resetSettings: () => {
      setSettingsState(resetStoredSettings())
    },
    importSettings: (nextSettings) => {
      const normalized = replaceSettings(nextSettings)
      setSettingsState(normalized)
    },
  }), [settingsState])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
