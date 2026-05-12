import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import { TagInput } from '../tags/TagInput'
import type { Idea, Note, NoteStatus, NoteType, Project, Task } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'

export type NoteFormValues = {
  title: string
  summary: string
  content: string
  type: NoteType
  status: NoteStatus
  tags: string[]
  category: string
  projectId: string | null
  taskIds: string[]
  ideaIds: string[]
  relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
}

type NoteFormModalMode = 'create' | 'edit' | 'view'

type NoteFormModalProps = {
  mode: NoteFormModalMode
  note?: Note | null
  tasks: Task[]
  projects: Project[]
  ideas: Idea[]
  availableTags: string[]
  relatedItems: RelationSelectableItem[]
  availableRelationItems: RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
  onClose: () => void
  onSubmit: (values: NoteFormValues) => void
}

type FormState = {
  title: string
  summary: string
  content: string
  type: NoteType
  status: NoteStatus
  tags: string[]
  category: string
  projectId: string
  taskIds: string[]
  ideaIds: string[]
}

const noteTypeLabels: Record<NoteType, string> = {
  basic: 'Обычная',
  research: 'Исследование',
  instruction: 'Инструкция',
  project_material: 'Материал проекта',
  personal_thought: 'Личная мысль',
  solution: 'Решение',
  list: 'Список',
  reference: 'Справка',
}

const noteStatusLabels: Record<NoteStatus, string> = {
  draft: 'Черновик',
  active: 'В работе',
  completed: 'Готово',
  archived: 'Архив',
}

function getInitialState(note?: Note | null): FormState {
  return {
    title: note?.title ?? '',
    summary: note?.summary ?? '',
    content: note?.content ?? '',
    type: note?.type ?? 'basic',
    status: note?.status ?? 'draft',
    tags: note?.tags ?? [],
    category: note?.category ?? '',
    projectId: note?.projectId ?? '',
    taskIds: note?.taskIds ?? [],
    ideaIds: note?.ideaIds ?? [],
  }
}

export function NoteFormModal({ mode, note, tasks, projects, ideas, availableTags, relatedItems, availableRelationItems, onOpenRelatedItem, onClose, onSubmit }: NoteFormModalProps) {
  const [formState, setFormState] = useState<FormState>(() => getInitialState(note))
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelationSelectableItem[]>(relatedItems)
  const isReadonly = mode === 'view'

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function handleToggleSelection(field: 'taskIds' | 'ideaIds', id: string) {
    setFormState((current) => {
      const hasValue = current[field].includes(id)

      return {
        ...current,
        [field]: hasValue ? current[field].filter((item) => item !== id) : [...current[field], id],
      }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isReadonly || !formState.title.trim()) {
      return
    }

    onSubmit({
      title: formState.title.trim(),
      summary: formState.summary.trim(),
      content: formState.content.trim(),
      type: formState.type,
      status: formState.status,
      tags: formState.tags,
      category: formState.category.trim(),
      projectId: formState.projectId || null,
      taskIds: formState.taskIds,
      ideaIds: formState.ideaIds,
      relatedItems: selectedRelatedItems,
    })
  }

  const modalTitle = mode === 'create' ? 'Новая заметка' : mode === 'edit' ? 'Редактирование заметки' : 'Просмотр заметки'

  return (
    <Modal
      title={modalTitle}
      isOpen
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {!isReadonly ? (
            <button
              type="submit"
              form="note-form"
              className="ui-button-accent w-full sm:w-auto"
            >
              {mode === 'create' ? 'Добавить заметку' : 'Сохранить изменения'}
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
        <form id="note-form" onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-(--text-muted)">Заметки сохраняются локально и остаются после перезагрузки страницы.</p>

          <div className="space-y-2">
            <label className="text-sm text-(--text-secondary)" htmlFor="note-title">
              Название заметки
            </label>
            <input
              id="note-title"
              value={formState.title}
              onChange={(event) => handleChange('title', event.target.value)}
              disabled={isReadonly}
              className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
              placeholder="Например, наблюдения по рабочему процессу"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-(--text-secondary)" htmlFor="note-content">
              Краткое описание
            </label>
            <textarea
              id="note-summary"
              value={formState.summary}
              onChange={(event) => handleChange('summary', event.target.value)}
              disabled={isReadonly}
              rows={2}
              className="ui-input min-h-21 max-h-45 resize-y disabled:cursor-not-allowed disabled:opacity-80"
              placeholder="О чём эта заметка и зачем она нужна"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-(--text-secondary)" htmlFor="note-type">
                Тип заметки
              </label>
              <select
                id="note-type"
                value={formState.type}
                onChange={(event) => handleChange('type', event.target.value as NoteType)}
                disabled={isReadonly}
                className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
              >
                {Object.entries(noteTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-(--text-secondary)" htmlFor="note-status">
                Статус
              </label>
              <select
                id="note-status"
                value={formState.status}
                onChange={(event) => handleChange('status', event.target.value as NoteStatus)}
                disabled={isReadonly}
                className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
              >
                {Object.entries(noteStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-(--text-secondary)" htmlFor="note-category">
                Категория
              </label>
              <input
                id="note-category"
                value={formState.category}
                onChange={(event) => handleChange('category', event.target.value)}
                disabled={isReadonly}
                className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
                placeholder="Например, Архитектура"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-(--text-secondary)" htmlFor="note-content">
              Основной текст
            </label>
            <textarea
              id="note-content"
              value={formState.content}
              onChange={(event) => handleChange('content', event.target.value)}
              disabled={isReadonly}
              rows={5}
              className="ui-input min-h-30 max-h-60 resize-y disabled:cursor-not-allowed disabled:opacity-80"
              placeholder="Запишите мысли, факты, выводы или структуру документа"
            />
          </div>

          <TagInput
            label="Теги"
            value={formState.tags}
            suggestions={availableTags}
            disabled={isReadonly}
            onChange={(tags) => handleChange('tags', tags)}
          />

          <div className="space-y-2">
            <label className="text-sm text-(--text-secondary)" htmlFor="note-project">
              Связанный проект
            </label>
            <select
              id="note-project"
              value={formState.projectId}
              onChange={(event) => handleChange('projectId', event.target.value)}
              disabled={isReadonly}
              className="ui-input disabled:cursor-not-allowed disabled:opacity-80"
            >
              <option value="">Без проекта</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
              <p className="mb-3 text-sm font-medium text-(--text-primary)">Связанные задачи</p>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <label key={task.id} className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-(--border) px-3 py-2 text-sm text-(--text-secondary)">
                      <input
                        type="checkbox"
                        checked={formState.taskIds.includes(task.id)}
                        onChange={() => handleToggleSelection('taskIds', task.id)}
                        disabled={isReadonly}
                        className="mt-1"
                      />
                      <span className="min-w-0 wrap-break-word">{task.title}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-(--text-muted)">Пока нет задач для связи.</p>
                )}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
              <p className="mb-3 text-sm font-medium text-(--text-primary)">Связанные идеи</p>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {ideas.length > 0 ? (
                  ideas.map((idea) => (
                    <label key={idea.id} className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-(--border) px-3 py-2 text-sm text-(--text-secondary)">
                      <input
                        type="checkbox"
                        checked={formState.ideaIds.includes(idea.id)}
                        onChange={() => handleToggleSelection('ideaIds', idea.id)}
                        disabled={isReadonly}
                        className="mt-1"
                      />
                      <span className="min-w-0 wrap-break-word">{idea.title}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-(--text-muted)">Пока нет идей для связи.</p>
                )}
              </div>
            </div>
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

          {note ? (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4 text-sm text-(--text-muted) md:grid-cols-2">
              <p>Создана: {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.createdAt))}</p>
              <p>Обновлена: {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.updatedAt))}</p>
            </div>
          ) : null}
        </form>
    </Modal>
  )
}
