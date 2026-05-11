import type { AppDisplayModule } from './settings'

export type SectionKey =
  | 'dashboard'
  | 'tasks'
  | 'habits'
  | 'calendar'
  | 'deadlines'
  | 'reminders'
  | 'notes'
  | 'knowledge'
  | 'ideas'
  | 'projects'
  | 'files'
  | 'settings'
  | 'more'
  | 'project'
  | 'workspace'
  | 'map'
  | 'goals'
  | 'assistant'

export type NavItem = {
  label: string
  path: string
  section: SectionKey
  displayKey?: AppDisplayModule
}
