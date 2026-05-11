import type { NavItem } from '../types/navigation'

export const navigationItems: NavItem[] = [
  { label: 'Главная', path: '/', section: 'dashboard' },
  { label: 'Задачи', path: '/tasks', section: 'tasks', displayKey: 'tasks' },
  { label: 'Календарь', path: '/calendar', section: 'calendar', displayKey: 'calendar' },
  { label: 'Дедлайны', path: '/deadlines', section: 'deadlines' },
  { label: 'Напоминания', path: '/reminders', section: 'reminders' },
  { label: 'Заметки', path: '/notes', section: 'notes', displayKey: 'notes' },
  { label: 'Идеи', path: '/ideas', section: 'ideas', displayKey: 'ideas' },
  { label: 'Проекты', path: '/projects', section: 'projects', displayKey: 'projects' },
  { label: 'Файлы', path: '/files', section: 'files', displayKey: 'knowledgeLibrary' },
  { label: 'Настройки', path: '/settings', section: 'settings' },
]

export const mobileMainNavigation = navigationItems.filter((item) =>
  ['/', '/tasks', '/calendar', '/projects'].includes(item.path),
)

export const mobileMoreNavigation = navigationItems.filter((item) =>
  ['/reminders', '/notes', '/ideas', '/files', '/deadlines', '/settings'].includes(item.path),
)
