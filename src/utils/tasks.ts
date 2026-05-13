import type { Task, TaskPriority } from '../types'
import { toDateKey, toStartOfDay } from './date'

export const NEXT_TASK_HELP_TEXT = 'Выбирается автоматически по дедлайну и приоритету.'
export const NEXT_TASK_TOOLTIP = 'Сначала просроченные, затем задачи на сегодня, затем ближайшие по дедлайну и приоритету.'

export type NextTaskReason = 'overdue' | 'today' | 'deadline' | 'priority' | 'auto' | 'none'

export type NextTaskSelection = {
  task: Task | null
  reason: NextTaskReason
}

type NextTaskBucket = 'overdue' | 'today' | 'upcoming' | 'backlog'

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function normalizeTaskStatus(task: Task) {
  return String(task.status)
}

function isSelectableTask(task: Task) {
  const status = normalizeTaskStatus(task)
  return status !== 'completed' && status !== 'archived' && status !== 'deleted'
}

function getDeadlineDate(task: Task) {
  if (!task.deadline) {
    return null
  }

  return new Date(task.deadline)
}

export function isTaskOverdue(task: Task, now = new Date()) {
  const deadline = getDeadlineDate(task)

  if (!deadline || !isSelectableTask(task)) {
    return false
  }

  return deadline.getTime() < toStartOfDay(now).getTime()
}

export function isTaskDueToday(task: Task, now = new Date()) {
  const deadline = getDeadlineDate(task)

  if (!deadline || !isSelectableTask(task)) {
    return false
  }

  return toDateKey(deadline) === toDateKey(now)
}

function getTaskBucket(task: Task, now: Date): NextTaskBucket {
  if (isTaskOverdue(task, now)) {
    return 'overdue'
  }

  if (isTaskDueToday(task, now)) {
    return 'today'
  }

  if (task.deadline) {
    return 'upcoming'
  }

  return 'backlog'
}

function getBucketRank(bucket: NextTaskBucket) {
  switch (bucket) {
    case 'overdue':
      return 0
    case 'today':
      return 1
    case 'upcoming':
      return 2
    case 'backlog':
    default:
      return 3
  }
}

function getCreatedAtTime(task: Task) {
  const timestamp = new Date(task.createdAt).getTime()
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

function compareByPriorityAndAge(a: Task, b: Task) {
  const priorityDifference = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]

  if (priorityDifference !== 0) {
    return priorityDifference
  }

  return getCreatedAtTime(a) - getCreatedAtTime(b)
}

export function compareTasksForNextSelection(a: Task, b: Task, now = new Date()) {
  const aSelectable = isSelectableTask(a)
  const bSelectable = isSelectableTask(b)

  if (aSelectable !== bSelectable) {
    return aSelectable ? -1 : 1
  }

  if (!aSelectable && !bSelectable) {
    return getCreatedAtTime(a) - getCreatedAtTime(b)
  }

  const bucketDifference = getBucketRank(getTaskBucket(a, now)) - getBucketRank(getTaskBucket(b, now))

  if (bucketDifference !== 0) {
    return bucketDifference
  }

  const aDeadline = getDeadlineDate(a)
  const bDeadline = getDeadlineDate(b)

  if (aDeadline && bDeadline) {
    const deadlineDifference = aDeadline.getTime() - bDeadline.getTime()

    if (deadlineDifference !== 0) {
      return deadlineDifference
    }
  }

  if (aDeadline && !bDeadline) {
    return -1
  }

  if (!aDeadline && bDeadline) {
    return 1
  }

  return compareByPriorityAndAge(a, b)
}

export function sanitizePinnedNextTaskId(tasks: Task[], pinnedNextTaskId?: string | null) {
  return tasks.some((task) => task.id === pinnedNextTaskId) ? pinnedNextTaskId ?? null : null
}

export function getAutoNextTask(tasks: Task[], now = new Date()) {
  return [...tasks].filter(isSelectableTask).sort((a, b) => compareTasksForNextSelection(a, b, now))[0] ?? null
}

function getNextTaskReason(task: Task, now: Date): NextTaskReason {
  if (isTaskOverdue(task, now)) {
    return 'overdue'
  }

  if (isTaskDueToday(task, now)) {
    return 'today'
  }

  if (task.deadline) {
    return 'deadline'
  }

  if (task.priority === 'high' || task.priority === 'medium') {
    return 'priority'
  }

  return 'auto'
}

export function getNextTask(tasks: Task[], _ignoredPinnedNextTaskId?: string | null, now = new Date()): NextTaskSelection {
  const autoTask = getAutoNextTask(tasks, now)

  if (autoTask) {
    return {
      task: autoTask,
      reason: getNextTaskReason(autoTask, now),
    }
  }

  return {
    task: null,
    reason: 'none',
  }
}

export function getNextTaskCandidates(tasks: Task[], _ignoredPinnedNextTaskId?: string | null, now = new Date()) {
  return [...tasks].filter(isSelectableTask).sort((a, b) => compareTasksForNextSelection(a, b, now))
}