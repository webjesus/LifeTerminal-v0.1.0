import type { GoalStatus, ProjectActivityType, ProjectMilestoneStatus, ProjectPriority, ProjectSection, ProjectSectionKind, ProjectStatus, ProjectWorkspaceRelationType } from '../../types'

export const defaultProjectSectionTitles = [
  'Общее',
  'Исследование',
  'Задачи',
  'Материалы',
  'Идеи',
  'Файлы',
  'Цели',
  'Заметки',
] as const

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: 'Планирование',
  active: 'Активный',
  paused: 'На паузе',
  completed: 'Завершён',
  archived: 'Архив',
}

export const projectPriorityLabels: Record<ProjectPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const projectGoalStatusLabels: Record<GoalStatus, string> = {
  planned: 'Запланирована',
  in_progress: 'В работе',
  completed: 'Выполнена',
  archived: 'Архив',
}

export const projectMilestoneStatusLabels: Record<ProjectMilestoneStatus, string> = {
  planned: 'Запланирован',
  in_progress: 'В работе',
  completed: 'Завершён',
  paused: 'На паузе',
}

export const projectActivityTypeLabels: Record<ProjectActivityType, string> = {
  project_created: 'Проект создан',
  project_updated: 'Проект обновлён',
  task_created: 'Создана задача',
  task_completed: 'Задача завершена',
  note_created: 'Создана заметка',
  idea_created: 'Создана идея',
  file_added: 'Добавлен материал',
  goal_created: 'Создана цель',
  goal_completed: 'Цель завершена',
  milestone_created: 'Создан этап',
  milestone_completed: 'Этап завершён',
  workspace_block_created: 'Создан блок рабочей области',
  workspace_block_updated: 'Обновлён блок рабочей области',
  workspace_block_deleted: 'Удалён блок рабочей области',
  workspace_block_moved: 'Перемещён блок рабочей области',
  workspace_block_section_changed: 'Блок привязан к разделу',
  relation_created: 'Создана связь',
}

export const projectWorkspaceRelationLabels: Record<ProjectWorkspaceRelationType, string> = {
  hierarchy: 'Иерархия',
  related: 'Связано',
  depends_on: 'Зависит от',
  supports: 'Поддерживает',
  blocks: 'Блокирует',
  idea_to_task: 'Идея -> задача',
  note_to_task: 'Заметка -> задача',
  file_to_block: 'Файл -> блок',
  goal_to_task: 'Цель -> задача',
}

export const projectWorkspaceRelationOptions = (
  Object.entries(projectWorkspaceRelationLabels) as Array<[ProjectWorkspaceRelationType, string]>
).map(([value, label]) => ({ value, label }))

export type WorkspaceItemKind = Exclude<ProjectSectionKind, 'section'>

export const workspaceItemKindLabels: Record<WorkspaceItemKind, string> = {
  task: 'Задача',
  note: 'Заметка',
  idea: 'Идея',
  goal: 'Цель',
  file: 'Файл',
  text: 'Текстовый блок',
  link: 'Ссылка',
  problem: 'Проблема',
  solution: 'Решение',
  photo: 'Фото',
  thought: 'Мысль',
}

export const workspaceItemKindBadges: Record<
  WorkspaceItemKind,
  {
    shortLabel: string
    className: string
  }
> = {
  task: {
    shortLabel: 'TASK',
    className: 'border-[#dadfff] bg-[#eef0ff] text-[#4c46c7]',
  },
  note: {
    shortLabel: 'NOTE',
    className: 'border-[#d9e6ff] bg-[#f2f7ff] text-[#4266c8]',
  },
  idea: {
    shortLabel: 'IDEA',
    className: 'border-[#f4dec8] bg-[#fff4e8] text-[#b26a26]',
  },
  goal: {
    shortLabel: 'GOAL',
    className: 'border-[#d8eadc] bg-[#edf7ef] text-[#3d7554]',
  },
  file: {
    shortLabel: 'FILE',
    className: 'border-[#e0e5ee] bg-[#f7f9fc] text-[#667085]',
  },
  photo: {
    shortLabel: 'PHOTO',
    className: 'border-[#e0d8ff] bg-[#f6f3ff] text-[#6b55d8]',
  },
  text: {
    shortLabel: 'TEXT',
    className: 'border-[#e5e7eb] bg-[#f8fafc] text-[#5b6476]',
  },
  link: {
    shortLabel: 'LINK',
    className: 'border-[#d7e5ff] bg-[#eef5ff] text-[#4365c2]',
  },
  problem: {
    shortLabel: 'PROBLEM',
    className: 'border-[#f3d2c7] bg-[#fff0eb] text-[#c35a3d]',
  },
  solution: {
    shortLabel: 'SOLUTION',
    className: 'border-[#d7e8dc] bg-[#ebf7ef] text-[#37734f]',
  },
  thought: {
    shortLabel: 'THOUGHT',
    className: 'border-[#e6dbff] bg-[#f6f2ff] text-[#6a4fd4]',
  },
}


type CreateProjectSectionInput = {
  projectId: string
  title: string
  description?: string
  order: number
  kind?: ProjectSectionKind
  parentSectionId?: string | null
  entityId?: string | null
  relatedBlockIds?: string[]
  tags?: string[]
  content?: string
  url?: string | null
}

export function createProjectSection({
  projectId,
  title,
  description = '',
  order,
  kind = 'section',
  parentSectionId = null,
  entityId = null,
  relatedBlockIds = [],
  tags = [],
  content = '',
  url = null,
}: CreateProjectSectionInput): ProjectSection {
  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    projectId,
    title,
    description,
    order,
    kind,
    parentSectionId,
    entityId,
    relatedBlockIds,
    tags,
    content,
    url,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
