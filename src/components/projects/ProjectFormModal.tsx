import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import type { Project, ProjectStatus } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'
import { projectStatusLabels } from './projectMeta'

export type ProjectFormValues = {
  title: string
  description: string
  status: ProjectStatus
  goal: string
  deadline: string
  relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
}

type ProjectFormModalProps = {
  mode: 'create' | 'edit'
  project?: Project | null
  relatedItems: RelationSelectableItem[]
  availableRelationItems: RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
  onClose: () => void
  onSubmit: (values: ProjectFormValues) => void
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 10)
}

export function ProjectFormModal({ mode, project, relatedItems, availableRelationItems, onOpenRelatedItem, onClose, onSubmit }: ProjectFormModalProps) {
  const [formState, setFormState] = useState<ProjectFormValues>({
    title: project?.title ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'active',
    goal: project?.goal ?? '',
    deadline: toDateInputValue(project?.deadline ?? null),
    relatedItems: [],
  })
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelationSelectableItem[]>(relatedItems)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formState.title.trim()

    if (!title) {
      return
    }

    onSubmit({
      ...formState,
      title,
      description: formState.description.trim(),
      goal: formState.goal.trim(),
      deadline: formState.deadline,
      relatedItems: selectedRelatedItems,
    })
  }

  function handleChange<Key extends keyof ProjectFormValues>(key: Key, value: ProjectFormValues[Key]) {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  return (
    <Modal
      title={mode === 'create' ? 'Новый проект' : 'Редактирование проекта'}
      isOpen
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="submit"
            form="project-form"
            className="ui-button-accent w-full sm:w-auto"
          >
            {mode === 'create' ? 'Создать проект' : 'Сохранить изменения'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ui-button w-full sm:w-auto"
          >
            Отмена
          </button>
        </div>
      }
    >
        <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-(--text-secondary)">Название</span>
              <input
                value={formState.title}
                onChange={(event) => handleChange('title', event.target.value)}
                placeholder="Например, запуск личной системы"
                className="ui-input"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-(--text-secondary)">Описание</span>
              <textarea
                value={formState.description}
                onChange={(event) => handleChange('description', event.target.value)}
                rows={4}
                placeholder="Коротко сформулируйте назначение проекта и текущий контекст."
                className="ui-input min-h-30 max-h-55 resize-y"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Статус</span>
              <select
                value={formState.status}
                onChange={(event) => handleChange('status', event.target.value as ProjectStatus)}
                className="ui-input"
              >
                {Object.entries(projectStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Дедлайн</span>
              <input
                type="date"
                value={formState.deadline}
                onChange={(event) => handleChange('deadline', event.target.value)}
                className="ui-input"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-(--text-secondary)">Цель проекта</span>
              <textarea
                value={formState.goal}
                onChange={(event) => handleChange('goal', event.target.value)}
                rows={3}
                placeholder="Какой главный результат должен дать этот проект?"
                className="ui-input min-h-30 max-h-55 resize-y"
              />
            </label>

            <div className="md:col-span-2">
              <LinkedItemsPanel
                selectedItems={selectedRelatedItems}
                availableItems={availableRelationItems}
                onChange={(items) =>
                  setSelectedRelatedItems(
                    availableRelationItems.filter((item) => items.some((entry) => entry.id === item.id && entry.type === item.type)),
                  )
                }
                onOpenItem={onOpenRelatedItem}
              />
            </div>
          </div>

        </form>
    </Modal>
  )
}
