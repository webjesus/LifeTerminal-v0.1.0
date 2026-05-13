import type { AppSettings } from '../types/settings'

const defaultSettings: AppSettings = {
  profile: {
    name: 'Пользователь',
    avatarUrl: null,
  },
  appearance: {
    theme: 'light',
    accentColor: 'violet',
    roundedStyle: 'large',
    compactMode: false,
    animations: true,
    softShadows: true,
    glassEffect: false,
  },
  display: {
    showDashboardQuickAdd: true,
    showRecentActivity: true,
    showTodayFocus: true,
    showProjectProgress: true,
    showPageDescriptions: true,
    showFloatingActionButton: true,
    visibleModules: {
      tasks: true,
      habits: true,
      notes: true,
      goals: true,
      projects: true,
      knowledgeLibrary: true,
      calendar: true,
      ideas: true,
      assistant: true,
    },
  },
  behavior: {
    defaultTaskPriority: 'medium',
    defaultTaskStatus: 'new',
    defaultProjectView: 'overview',
    askBeforeDelete: true,
    autoSave: true,
    pinnedNextTaskId: null,
  },
  calendar: {
    weekStartsOn: 'monday',
    dateFormat: 'dd.mm.yyyy',
    showCompletedTasksInCalendar: true,
  },
  notifications: {
    enableReminders: true,
    reminderLeadTimeMinutes: 30,
  },
  layout: {
    dashboardLayout: 'default',
  },
  appInfo: {
    appName: 'Life Terminal',
    version: '0.1.0',
    build: 'MVP / Local Prototype',
  },
  data: {
    lastBackupAt: null,
  },
}

export default defaultSettings