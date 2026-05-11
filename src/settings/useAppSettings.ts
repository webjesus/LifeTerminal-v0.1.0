import { useSettings } from '../context/useSettings'
import defaultSettings from '../data/defaultSettings'
import type { AppDisplayModule, DashboardLayoutMode } from '../types/settings'

type AppSettings = typeof defaultSettings

type ToggleDisplayResult = {
  ok: boolean
  message?: string
}

export function useAppSettings() {
  const {
    settings,
    setSettings,
    updateProfileSettings,
    updateAppearanceSettings,
    updateDisplaySettings,
    updateBehaviorSettings,
    updateCalendarSettings,
    updateNotificationSettings,
    updateDataSettings,
    resetSettings,
    importSettings,
  } = useSettings()

  function saveProfile(profile: AppSettings['profile']) {
    updateProfileSettings({
      name: profile.name.trim() || defaultSettings.profile.name,
      avatarUrl: profile.avatarUrl,
    })
  }

  function updateAppearance(patch: Partial<AppSettings['appearance']>) {
    updateAppearanceSettings(patch)
  }

  function setDisplayModule(moduleKey: AppDisplayModule, enabled: boolean): ToggleDisplayResult {
    if (!enabled) {
      const visibleCount = Object.values(settings.display.visibleModules).filter(Boolean).length
      if (visibleCount <= 1 && settings.display.visibleModules[moduleKey]) {
        return {
          ok: false,
          message: 'At least one module must remain visible.',
        }
      }
    }

    updateDisplaySettings({
      visibleModules: {
        ...settings.display.visibleModules,
        [moduleKey]: enabled,
      },
    })

    return { ok: true }
  }

  function resetDisplaySettings() {
    updateDisplaySettings({ ...defaultSettings.display })
  }

  function setDashboardLayout(layout: DashboardLayoutMode) {
    setSettings((current) => ({
      ...current,
      layout: {
        ...current.layout,
        dashboardLayout: layout,
      },
    }))
  }

  return {
    settings,
    setSettings,
    saveProfile,
    updateAppearance,
    updateProfileSettings,
    updateAppearanceSettings,
    updateDisplaySettings,
    updateBehaviorSettings,
    updateCalendarSettings,
    updateNotificationSettings,
    updateDataSettings,
    importSettings,
    resetSettings,
    setDisplayModule,
    resetDisplaySettings,
    setDashboardLayout,
  }
}