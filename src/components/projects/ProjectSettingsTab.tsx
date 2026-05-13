import { useEffect, useMemo, useState } from 'react'
import { TagInput } from '../tags/TagInput'
import type { Project, ProjectPriority, ProjectStatus } from '../../types'
import { projectPriorityLabels, projectStatusLabels } from './projectMeta'

export type ProjectSettingsValues = {
  title: string
  description: string
  details: string
  goal: string
  status: ProjectStatus
  priority: ProjectPriority
  deadline: string
  tags: string[]
  color: string
  icon: string
}

type ProjectSettingsTabProps = {
  project: Project
  tagSuggestions: string[]
  onSave: (values: ProjectSettingsValues) => void
  onDelete: () => void
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 10)
}

export function ProjectSettingsTab({ project, tagSuggestions, onSave, onDelete }: ProjectSettingsTabProps) {
  const [formState, setFormState] = useState<ProjectSettingsValues>({
    title: project.title,
    description: project.description,
    details: project.details ?? '',
    goal: project.goal,
    status: project.status,
    priority: project.priority ?? 'medium',
    deadline: toDateInputValue(project.deadline),
    tags: project.tags,
    color: project.color ?? '#667085',
    icon: project.icon ?? '',
  })

  useEffect(() => {
    setFormState({
      title: project.title,
      description: project.description,
      details: project.details ?? '',
      goal: project.goal,
      status: project.status,
      priority: project.priority ?? 'medium',
      deadline: toDateInputValue(project.deadline),
      tags: project.tags,
      color: project.color ?? '#667085',
      icon: project.icon ?? '',
    })
  }, [project])

  const mergedTagSuggestions = useMemo(
    () => Array.from(new Set([...tagSuggestions, ...formState.tags])).filter(Boolean),
    [formState.tags, tagSuggestions],
  )

  function updateField<Key extends keyof ProjectSettingsValues>(key: Key, value: ProjectSettingsValues[Key]) {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit() {
    if (!formState.title.trim()) {
      return
    }

    onSave({
      ...formState,
      title: formState.title.trim(),
      description: formState.description.trim(),
      details: formState.details.trim(),
      goal: formState.goal.trim(),
    })
  }

  return (
    <section className="ui-panel p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-(--text-muted)">Редактирование параметров проекта без отдельного повторяющегося hero-блока.</p>
        <button type="button" onClick={handleSubmit} className="ui-button-accent px-4 py-2.5">Сохранить изменения</button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-5">
          <label className="space-y-2">
            <span className="text-sm text-(--text-secondary)">Название</span>
            <input value={formState.title} onChange={(event) => updateField('title', event.target.value)} className="ui-input" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-(--text-secondary)">Краткое описание</span>
            <textarea value={formState.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className="ui-input min-h-28 resize-y" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-(--text-secondary)">Подробное описание</span>
            <textarea value={formState.details} onChange={(event) => updateField('details', event.target.value)} rows={7} className="ui-input min-h-40 resize-y" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-(--text-secondary)">Главная цель</span>
            <textarea value={formState.goal} onChange={(event) => updateField('goal', event.target.value)} rows={4} className="ui-input min-h-28 resize-y" />
          </label>
          <TagInput label="Теги проекта" value={formState.tags} suggestions={mergedTagSuggestions} onChange={(tags) => updateField('tags', tags)} />
        </div>

        <div className="space-y-5">
          <label className="space-y-2">
            <span className="text-sm text-(--text-secondary)">Статус</span>
            <select value={formState.status} onChange={(event) => updateField('status', event.target.value as ProjectStatus)} className="ui-input">
              {Object.entries(projectStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-(--text-secondary)">Приоритет</span>
            <select value={formState.priority} onChange={(event) => updateField('priority', event.target.value as ProjectPriority)} className="ui-input">
              {Object.entries(projectPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-(--text-secondary)">Дедлайн</span>
            <input type="date" value={formState.deadline} onChange={(event) => updateField('deadline', event.target.value)} className="ui-input" />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Цвет проекта</span>
              <input type="color" value={formState.color} onChange={(event) => updateField('color', event.target.value)} className="h-12 w-full rounded-2xl border border-(--border) bg-(--panel-elevated) p-2" />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Иконка</span>
              <input value={formState.icon} onChange={(event) => updateField('icon', event.target.value)} className="ui-input" placeholder="Например, rocket" />
            </label>
          </div>

          <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
            <p className="text-sm font-medium text-(--text-primary)">Опасная зона</p>
            <p className="mt-2 text-sm text-(--text-secondary)">Архивируйте проект, если работа завершена, или удаляйте только если он больше не нужен.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => updateField('status', 'archived')} className="ui-button px-4 py-3">Архивировать проект</button>
              <button type="button" onClick={onDelete} className="ui-button-danger px-4 py-3">Удалить проект</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
