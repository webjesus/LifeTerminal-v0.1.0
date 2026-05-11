export type AppTheme = 'light' | 'dark' | 'system'
export type AccentColor = 'violet' | 'blue' | 'purple' | 'indigo'
export type RoundedStyle = 'soft' | 'medium' | 'large'
export type DefaultTaskStatus = 'new' | 'in_progress'
export type DefaultProjectView = 'overview' | 'workspace' | 'tasks' | 'notes' | 'ideas' | 'files' | 'map'
export type WeekStartsOn = 'monday' | 'sunday'
export type DateFormatPreference = 'dd.mm.yyyy' | 'yyyy-mm-dd'
export type ReminderLeadTime = 5 | 10 | 15 | 30 | 60
export type DashboardLayoutMode = 'default' | 'focus' | 'minimal'
export type AppDisplayModule =
  | 'tasks'
  | 'habits'
  | 'notes'
  | 'goals'
  | 'projects'
  | 'knowledgeLibrary'
  | 'calendar'
  | 'ideas'
  | 'assistant'

export type AppSettings = {
  profile: {
    name: string
    avatarUrl: string | null
  }
  appearance: {
    theme: AppTheme
    accentColor: AccentColor
    roundedStyle: RoundedStyle
    compactMode: boolean
    animations: boolean
    softShadows: boolean
    glassEffect: boolean
  }
  display: {
    showDashboardQuickAdd: boolean
    showRecentActivity: boolean
    showTodayFocus: boolean
    showProjectProgress: boolean
    showPageDescriptions: boolean
    showFloatingActionButton: boolean
    visibleModules: Record<AppDisplayModule, boolean>
  }
  behavior: {
    defaultTaskPriority: 'low' | 'medium' | 'high'
    defaultTaskStatus: DefaultTaskStatus
    defaultProjectView: DefaultProjectView
    askBeforeDelete: boolean
    autoSave: boolean
  }
  calendar: {
    weekStartsOn: WeekStartsOn
    dateFormat: DateFormatPreference
    showCompletedTasksInCalendar: boolean
  }
  notifications: {
    enableReminders: boolean
    reminderLeadTimeMinutes: ReminderLeadTime
  }
  layout: {
    dashboardLayout: DashboardLayoutMode
  }
  appInfo: {
    appName: string
    version: string
    build: string
  }
  data: {
    lastBackupAt: string | null
  }
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K]
}