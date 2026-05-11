import type { ProjectSection, ProjectSectionKind, ProjectStatus } from '../../types'

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
  active: 'Активный',
  paused: 'На паузе',
  completed: 'Завершён',
  archived: 'Архив',
}

export type WorkspaceItemKind = Exclude<ProjectSectionKind, 'section'>

export const workspaceItemKindLabels: Record<WorkspaceItemKind, string> = {
  task: 'Задача',
  note: 'Заметка',
  idea: 'Идея',
  goal: 'Цель',
  file: 'Файл',
  photo: 'Фото',
  text: 'Текстовый блок',
  link: 'Ссылка',
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
    content,
    url,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
