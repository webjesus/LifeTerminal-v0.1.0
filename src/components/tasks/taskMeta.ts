import type { TaskPriority, TaskStatus } from '../../types'

export const taskStatusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  waiting: 'Ожидает',
  completed: 'Выполнена',
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}
