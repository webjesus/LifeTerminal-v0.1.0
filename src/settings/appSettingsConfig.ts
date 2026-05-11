import defaultSettings from '../data/defaultSettings'
import type { SectionKey } from '../types/navigation'
import { normalizeSettings } from '../utils/settingsStorage'
import type { AppDisplayModule, AppSettings, DashboardLayoutMode } from '../types/settings'

export type { AppDisplayModule, AppSettings, DashboardLayoutMode } from '../types/settings'

export const defaultAppSettings = defaultSettings

export const displayModuleOptions: Array<{
  key: AppDisplayModule
  label: string
  description: string
  section: SectionKey
}> = [
  { key: 'tasks', label: 'Задачи', description: 'Задачи и дневной фокус.', section: 'tasks' },
  { key: 'habits', label: 'Привычки', description: 'Трекер привычек и повторяющихся действий.', section: 'habits' },
  { key: 'notes', label: 'Заметки', description: 'Заметки и связанные записи.', section: 'notes' },
  { key: 'goals', label: 'Цели', description: 'Цели и долгосрочные ориентиры.', section: 'goals' },
  { key: 'projects', label: 'Проекты', description: 'Проекты, рабочие области и прогресс.', section: 'projects' },
  { key: 'knowledgeLibrary', label: 'База знаний', description: 'База знаний, файлов и материалов.', section: 'knowledge' },
  { key: 'calendar', label: 'Календарь', description: 'Календарь, сроки и обзор ближайших событий.', section: 'calendar' },
  { key: 'ideas', label: 'Идеи', description: 'Идеи, черновики и гипотезы.', section: 'ideas' },
  { key: 'assistant', label: 'Ассистент', description: 'Быстрый персональный помощник и подсказки.', section: 'assistant' },
]

export const dashboardLayoutOptions: Array<{
  value: DashboardLayoutMode
  label: string
  description: string
}> = [
  {
    value: 'default',
    label: 'Стандартный',
    description: 'Стандартная сетка со всеми активными модулями.',
  },
  {
    value: 'focus',
    label: 'Фокус',
    description: 'Приоритет для задач, привычек, целей и ассистента.',
  },
  {
    value: 'minimal',
    label: 'Минимальный',
    description: 'Только самые важные блоки без лишнего шума.',
  },
]

export function normalizeAppSettings(settings?: Partial<AppSettings> | null): AppSettings {
  return normalizeSettings(settings)
}

export function getAppearanceClassNames(settings: AppSettings['appearance']) {
  const roundedClass = `rounded-${settings.roundedStyle}`
  const densityClass = settings.compactMode ? 'density-compact' : 'density-comfortable'

  return [
    densityClass,
    settings.animations ? 'animations-enabled' : 'animations-disabled',
    settings.softShadows ? 'shadows-enabled' : 'shadows-disabled',
    settings.glassEffect ? 'glass-enabled' : 'glass-disabled',
    roundedClass,
  ].join(' ')
}