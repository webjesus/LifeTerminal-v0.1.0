import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import { TagInput } from '../tags/TagInput'
import type {
  Idea,
  IdeaDifficulty,
  IdeaPriority,
  IdeaStatus,
  Note,
  Project,
  Task,
} from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'

type IdeaFormModalProps = {
  mode: 'create' | 'edit' | 'view'
  idea?: Idea | null
  projects: Project[]
  tasks: Task[]
  notes: Note[]
  availableTags: string[]
  relatedItems: RelationSelectableItem[]
  availableRelationItems: RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
  onClose: () => void
  onSubmit: (values: IdeaFormValues) => void
}

export type IdeaFormValues = {
  title: string
  description: string
  problem: string
  value: string
  nextStep: string
  status: IdeaStatus
  priority: IdeaPriority
  difficulty: IdeaDifficulty
  tags: string[]
  projectId: string | null
  taskIds: string[]
  noteIds: string[]
  relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
}

type FormState = {
  title: string
  description: string
  problem: string
  value: string
  nextStep: string
  status: IdeaStatus
  priority: IdeaPriority
  difficulty: IdeaDifficulty
  tags: string[]
  projectId: string
  taskIds: string[]
  noteIds: string[]
}

const statusLabels: Record<IdeaStatus, string> = {
  new: 'Новая',
  thinking: 'Обдумывается',
  promising: 'Перспективная',
  planned: 'Запланирована',
  in_progress: 'В работе',
  implemented: 'Реализована',
  postponed: 'Отложена',
  archived: 'Архив',
}

const priorityLabels: Record<IdeaPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

const difficultyLabels: Record<IdeaDifficulty, string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
}

function getInitialState(idea?: Idea | null): FormState {
  return {
    title: idea?.title ?? '',
    description: idea?.description ?? '',
    problem: idea?.problem ?? '',
    value: idea?.value ?? '',
    nextStep: idea?.nextStep ?? '',
    status: idea?.status ?? 'new',
    priority: idea?.priority ?? 'medium',
    difficulty: idea?.difficulty ?? 'medium',
    tags: idea?.tags ?? [],
    projectId: idea?.projectId ?? '',
    taskIds: idea?.taskIds ?? [],
    noteIds: idea?.noteIds ?? [],
  }
}

export function IdeaFormModal({
  mode,
  idea,
  projects,
  tasks,
  notes,
  availableTags,
  relatedItems,
  availableRelationItems,
  onOpenRelatedItem,
  onClose,
  onSubmit,
}: IdeaFormModalProps) {
  const [formState, setFormState] = useState<FormState>(() => getInitialState(idea))
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelationSelectableItem[]>(relatedItems)
  const isReadonly = mode === 'view'

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function toggleSelection(field: 'taskIds' | 'noteIds', id: string) {
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
      description: formState.description.trim(),
      problem: formState.problem.trim(),
      value: formState.value.trim(),
      nextStep: formState.nextStep.trim(),
      status: formState.status,
      priority: formState.priority,
      difficulty: formState.difficulty,
      tags: formState.tags,
      projectId: formState.projectId || null,
      taskIds: formState.taskIds,
      noteIds: formState.noteIds,
      relatedItems: selectedRelatedItems,
    })
  }

  const modalTitle = mode === 'create' ? 'Новая идея' : mode === 'edit' ? 'Редактирование идеи' : 'Просмотр идеи'

  return (
    <Modal
      title={modalTitle}
      isOpen
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {!isReadonly ? (
            <button type="submit" form="idea-form" className="ui-button-accent w-full sm:w-auto">
              {mode === 'create' ? 'Добавить идею' : 'Сохранить изменения'}
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="ui-button w-full sm:w-auto">Отмена</button>
        </div>
      }
    >
      <form id="idea-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-(--text-muted)">Идеи сохраняются локально и могут быть превращены в задачи и заметки.</p>

        <div className="space-y-2">
          <label htmlFor="idea-title" className="text-sm text-(--text-secondary)">Название идеи</label>
          <input id="idea-title" value={formState.title} onChange={(event) => handleChange('title', event.target.value)} disabled={isReadonly} className="ui-input disabled:cursor-not-allowed disabled:opacity-80" placeholder="Например, еженедельный обзор прогресса" required />
        </div>

        <div className="space-y-2">
          <label htmlFor="idea-description" className="text-sm text-(--text-secondary)">Описание идеи</label>
          <textarea id="idea-description" value={formState.description} onChange={(event) => handleChange('description', event.target.value)} disabled={isReadonly} rows={4} className="ui-input min-h-25 resize-y disabled:cursor-not-allowed disabled:opacity-80" placeholder="Краткий смысл и общий контекст" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="idea-problem" className="text-sm text-(--text-secondary)">Проблема</label>
            <textarea id="idea-problem" value={formState.problem} onChange={(event) => handleChange('problem', event.target.value)} disabled={isReadonly} rows={3} className="ui-input min-h-24 resize-y disabled:cursor-not-allowed disabled:opacity-80" placeholder="Какую проблему решает идея" />
          </div>
          <div className="space-y-2">
            <label htmlFor="idea-value" className="text-sm text-(--text-secondary)">Потенциальная польза</label>
            <textarea id="idea-value" value={formState.value} onChange={(event) => handleChange('value', event.target.value)} disabled={isReadonly} rows={3} className="ui-input min-h-24 resize-y disabled:cursor-not-allowed disabled:opacity-80" placeholder="Почему это важно" />
          </div>
          <div className="space-y-2">
            <label htmlFor="idea-next-step" className="text-sm text-(--text-secondary)">Следующий шаг</label>
            <textarea id="idea-next-step" value={formState.nextStep} onChange={(event) => handleChange('nextStep', event.target.value)} disabled={isReadonly} rows={3} className="ui-input min-h-24 resize-y disabled:cursor-not-allowed disabled:opacity-80" placeholder="Что сделать первым" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="idea-status" className="text-sm text-(--text-secondary)">Статус</label>
            <select id="idea-status" value={formState.status} onChange={(event) => handleChange('status', event.target.value as IdeaStatus)} disabled={isReadonly} className="ui-input disabled:cursor-not-allowed disabled:opacity-80">
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="idea-priority" className="text-sm text-(--text-secondary)">Приоритет</label>
            <select id="idea-priority" value={formState.priority} onChange={(event) => handleChange('priority', event.target.value as IdeaPriority)} disabled={isReadonly} className="ui-input disabled:cursor-not-allowed disabled:opacity-80">
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="idea-difficulty" className="text-sm text-(--text-secondary)">Сложность</label>
            <select id="idea-difficulty" value={formState.difficulty} onChange={(event) => handleChange('difficulty', event.target.value as IdeaDifficulty)} disabled={isReadonly} className="ui-input disabled:cursor-not-allowed disabled:opacity-80">
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="idea-project" className="text-sm text-(--text-secondary)">Проект</label>
            <select id="idea-project" value={formState.projectId} onChange={(event) => handleChange('projectId', event.target.value)} disabled={isReadonly} className="ui-input disabled:cursor-not-allowed disabled:opacity-80">
              <option value="">Без проекта</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>
        </div>

        <TagInput
          label="Теги"
          value={formState.tags}
          suggestions={availableTags}
          disabled={isReadonly}
          onChange={(tags) => handleChange('tags', tags)}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
            <p className="mb-3 text-sm font-medium text-(--text-primary)">Привязка к задачам</p>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {tasks.length > 0 ? tasks.map((task) => (
                <label key={task.id} className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-(--border) px-3 py-2 text-sm text-(--text-secondary)">
                  <input type="checkbox" checked={formState.taskIds.includes(task.id)} onChange={() => toggleSelection('taskIds', task.id)} disabled={isReadonly} className="mt-1" />
                  <span className="min-w-0 wrap-break-word">{task.title}</span>
                </label>
              )) : <p className="text-sm text-(--text-muted)">Пока нет задач для привязки.</p>}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
            <p className="mb-3 text-sm font-medium text-(--text-primary)">Привязка к заметкам</p>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {notes.length > 0 ? notes.map((note) => (
                <label key={note.id} className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-(--border) px-3 py-2 text-sm text-(--text-secondary)">
                  <input type="checkbox" checked={formState.noteIds.includes(note.id)} onChange={() => toggleSelection('noteIds', note.id)} disabled={isReadonly} className="mt-1" />
                  <span className="min-w-0 wrap-break-word">{note.title}</span>
                </label>
              )) : <p className="text-sm text-(--text-muted)">Пока нет заметок для привязки.</p>}
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

        {idea ? (
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4 text-sm text-(--text-muted) md:grid-cols-2">
            <p>Создана: {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(idea.createdAt))}</p>
            <p>Обновлена: {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(idea.updatedAt))}</p>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
