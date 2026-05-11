import { useState, type FormEvent } from 'react'
import { useAppSettings } from '../../settings/useAppSettings'
import { Modal } from '../Modal'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import type { Task, TaskPriority, TaskStatus } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'
import { taskPriorityLabels, taskStatusLabels } from './taskMeta'

export type TaskFormValues = {
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  deadline: string
  relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
}

type TaskFormModalMode = 'create' | 'edit' | 'view'

type TaskFormModalProps = {
  mode: TaskFormModalMode
  task?: Task | null
  relatedItems: RelationSelectableItem[]
  availableRelationItems: RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void
}

type TaskFormState = {
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  deadline: string
}

function getInitialValues(task: Task | null | undefined, defaultPriority: TaskPriority, defaultStatus: TaskStatus): TaskFormState {
  if (!task) {
    return {
      title: '',
      description: '',
      priority: defaultPriority,
      status: defaultStatus,
      deadline: '',
    }
  }

  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    deadline: task.deadline ? task.deadline.slice(0, 10) : '',
  }
}

export function TaskFormModal({ mode, task, relatedItems, availableRelationItems, onOpenRelatedItem, onClose, onSubmit }: TaskFormModalProps) {
  const { settings } = useAppSettings()
  const [formValues, setFormValues] = useState<TaskFormState>(() => getInitialValues(task, settings.behavior.defaultTaskPriority, settings.behavior.defaultTaskStatus))
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelationSelectableItem[]>(relatedItems)
  const isReadonly = mode === 'view'

  function handleChange<K extends keyof TaskFormState>(field: K, value: TaskFormState[K]) {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isReadonly || !formValues.title.trim()) {
      return
    }

    onSubmit({
      ...formValues,
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      relatedItems: selectedRelatedItems,
    })
  }

  const title =
    mode === 'create' ? 'Новая задача' : mode === 'edit' ? 'Редактирование задачи' : 'Карточка задачи'

  return (
    <Modal
      title={title}
      isOpen
      onClose={onClose}
      size="md"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {!isReadonly ? (
            <button
              type="submit"
              form="task-form"
              className="ui-button-accent w-full sm:w-auto"
            >
              {mode === 'create' ? 'Добавить задачу' : 'Сохранить изменения'}
            </button>
          ) : null}
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
        <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-(--text-muted)">Все изменения сохраняются локально в браузере.</p>

          <div className="space-y-2">
            <label className="text-sm text-(--text-secondary)" htmlFor="task-title">
              Название задачи
            </label>
            <input
              id="task-title"
              value={formValues.title}
              onChange={(event) => handleChange('title', event.target.value)}
              disabled={isReadonly}
              className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
              placeholder="Например, подготовить план недели"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-(--text-secondary)" htmlFor="task-description">
              Описание
            </label>
            <textarea
              id="task-description"
              value={formValues.description}
              onChange={(event) => handleChange('description', event.target.value)}
              disabled={isReadonly}
              rows={5}
              className="ui-input min-h-[120px] max-h-[240px] resize-y disabled:cursor-not-allowed disabled:opacity-80"
              placeholder="Краткий контекст, чекпоинты и детали"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-(--text-secondary)" htmlFor="task-priority">
                Приоритет
              </label>
              <select
                id="task-priority"
                value={formValues.priority}
                onChange={(event) => handleChange('priority', event.target.value as TaskPriority)}
                disabled={isReadonly}
                className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
              >
                {Object.entries(taskPriorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-(--text-secondary)" htmlFor="task-status">
                Статус
              </label>
              <select
                id="task-status"
                value={formValues.status}
                onChange={(event) => handleChange('status', event.target.value as TaskStatus)}
                disabled={isReadonly}
                className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
              >
                {Object.entries(taskStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-(--text-secondary)" htmlFor="task-deadline">
              Дедлайн
            </label>
            <input
              id="task-deadline"
              type="date"
              value={formValues.deadline}
              onChange={(event) => handleChange('deadline', event.target.value)}
              disabled={isReadonly}
              className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
            />
          </div>

          <LinkedItemsPanel
            selectedItems={selectedRelatedItems}
            availableItems={availableRelationItems}
            onChange={(items) =>
              setSelectedRelatedItems(
                availableRelationItems.filter((item) => items.some((entry) => entry.id === item.id && entry.type === item.type)),
              )
            }
            onOpenItem={onOpenRelatedItem}
            isReadonly={isReadonly}
          />

          {task ? (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4 text-sm text-(--text-muted) md:grid-cols-2">
              <p>Создана: {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.createdAt))}</p>
              <p>Обновлена: {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.updatedAt))}</p>
            </div>
          ) : null}
        </form>
    </Modal>
  )
}
