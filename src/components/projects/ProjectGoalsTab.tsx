import { useMemo, useState } from 'react'
import type { Note, Idea, ProjectAttachment, ProjectGoal, ProjectWorkspaceBlock, Task } from '../../types'
import { calculateGoalProgress } from '../../utils/projectProgress'
import { Modal } from '../Modal'
import { TagInput } from '../tags/TagInput'
import { EmptyState } from './EmptyState'
import { projectGoalStatusLabels, projectPriorityLabels } from './projectMeta'

export type ProjectGoalFormValues = {
  title: string
  description: string
  status: ProjectGoal['status']
  priority: ProjectGoal['priority']
  progress: number
  deadline: string
  taskIds: string[]
  noteIds: string[]
  ideaIds: string[]
  fileIds: string[]
  tags: string[]
}

type ProjectGoalsTabProps = {
  goals: ProjectGoal[]
  tasks: Task[]
  notes: Note[]
  ideas: Idea[]
  files: ProjectAttachment[]
  workspaceBlocks: ProjectWorkspaceBlock[]
  tagSuggestions: string[]
  onCreateGoal: (values: ProjectGoalFormValues) => void
  onUpdateGoal: (goalId: string, values: ProjectGoalFormValues) => void
  onDeleteGoal: (goalId: string) => void
  onOpenWorkspaceBlock: (blockId: string) => void
}

const EMPTY_FORM: ProjectGoalFormValues = {
  title: '',
  description: '',
  status: 'planned',
  priority: 'medium',
  progress: 0,
  deadline: '',
  taskIds: [],
  noteIds: [],
  ideaIds: [],
  fileIds: [],
  tags: [],
}

function toFormValues(goal?: ProjectGoal | null): ProjectGoalFormValues {
  if (!goal) {
    return EMPTY_FORM
  }

  return {
    title: goal.title,
    description: goal.description,
    status: goal.status,
    priority: goal.priority,
    progress: goal.progress,
    deadline: goal.deadline ? goal.deadline.slice(0, 10) : '',
    taskIds: goal.taskIds,
    noteIds: goal.noteIds,
    ideaIds: goal.ideaIds,
    fileIds: goal.fileIds,
    tags: goal.tags,
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Без дедлайна'
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value))
}

function ToggleSelectionList({
  title,
  items,
  selectedIds,
  onToggle,
}: {
  title: string
  items: Array<{ id: string; title: string; meta?: string }>
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{title}</p>
      <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
        {items.length > 0 ? items.map((item) => {
          const checked = selectedIds.includes(item.id)

          return (
            <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-(--border-soft) bg-(--panel) px-3 py-3 text-sm text-(--text-primary)">
              <input type="checkbox" checked={checked} onChange={() => onToggle(item.id)} className="mt-1" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.title}</span>
                {item.meta ? <span className="mt-1 block text-xs text-(--text-muted)">{item.meta}</span> : null}
              </span>
            </label>
          )
        }) : <p className="text-sm text-(--text-muted)">Пока нечего привязывать.</p>}
      </div>
    </div>
  )
}

export function ProjectGoalsTab({
  goals,
  tasks,
  notes,
  ideas,
  files,
  workspaceBlocks,
  tagSuggestions,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onOpenWorkspaceBlock,
}: ProjectGoalsTabProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const editingGoal = useMemo(() => goals.find((goal) => goal.id === editingGoalId) ?? null, [editingGoalId, goals])
  const [formValues, setFormValues] = useState<ProjectGoalFormValues>(EMPTY_FORM)

  const linkedBlockMap = useMemo(
    () => new Map(workspaceBlocks.filter((block) => block.linkedItemType === 'goal' && block.linkedItemId).map((block) => [block.linkedItemId as string, block.id])),
    [workspaceBlocks],
  )

  function openCreateModal() {
    setIsEditorOpen(true)
    setEditingGoalId(null)
    setFormValues({ ...EMPTY_FORM })
  }

  function openEditModal(goal: ProjectGoal) {
    setIsEditorOpen(true)
    setEditingGoalId(goal.id)
    setFormValues(toFormValues(goal))
  }

  function closeModal() {
    setIsEditorOpen(false)
    setEditingGoalId(null)
    setFormValues({ ...EMPTY_FORM })
  }

  function toggleValue(key: 'taskIds' | 'noteIds' | 'ideaIds' | 'fileIds', id: string) {
    setFormValues((current) => ({
      ...current,
      [key]: current[key].includes(id) ? current[key].filter((item) => item !== id) : [...current[key], id],
    }))
  }

  return (
    <section className="ui-panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <p className="max-w-2xl text-sm text-(--text-secondary)">Цели задают направление, объединяют задачи и помогают считать реальный прогресс проекта.</p>
        <button type="button" onClick={openCreateModal} className="ui-button-accent px-4 py-2.5">Добавить цель</button>
      </div>

      <div className="mt-5 grid gap-4">
        {goals.length > 0 ? goals.map((goal) => {
          const goalProgress = calculateGoalProgress(goal, tasks)
          const linkedTasks = tasks.filter((task) => goal.taskIds.includes(task.id))
          const linkedBlockId = linkedBlockMap.get(goal.id)

          return (
            <article key={goal.id} className="ui-panel-elevated p-4 md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="ui-chip">{projectGoalStatusLabels[goal.status]}</span>
                    <span className="ui-chip">Приоритет: {projectPriorityLabels[goal.priority]}</span>
                    <span className="ui-chip">Прогресс: {goalProgress}%</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-(--text-primary)">{goal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-(--text-secondary)">{goal.description || 'Описание цели пока не заполнено.'}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-(--panel)">
                    <div className="h-full rounded-full bg-(--accent) transition-all" style={{ width: `${goalProgress}%` }} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--text-muted)">
                    <span>Дедлайн: {formatDate(goal.deadline)}</span>
                    <span>Задач: {linkedTasks.length}</span>
                    <span>Заметок: {goal.noteIds.length}</span>
                    <span>Идей: {goal.ideaIds.length}</span>
                    <span>Файлов: {goal.fileIds.length}</span>
                  </div>
                  {goal.tags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{goal.tags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>)}</div> : null}
                </div>

                <div className="flex flex-wrap gap-2 lg:max-w-64 lg:justify-end">
                  <button type="button" onClick={() => openEditModal(goal)} className="ui-button px-3 py-2 text-sm">Редактировать</button>
                  {linkedBlockId ? <button type="button" onClick={() => onOpenWorkspaceBlock(linkedBlockId)} className="ui-button px-3 py-2 text-sm">Открыть блок</button> : null}
                  <button type="button" onClick={() => onDeleteGoal(goal.id)} className="ui-button-danger px-3 py-2 text-sm">Удалить</button>
                </div>
              </div>

              {linkedTasks.length > 0 ? (
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {linkedTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="rounded-2xl border border-(--border) bg-(--panel) px-3 py-3">
                      <p className="text-sm font-medium text-(--text-primary)">{task.title}</p>
                      <p className="mt-1 text-xs text-(--text-muted)">{task.status} · {task.priority}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          )
        }) : <EmptyState title="В проекте пока нет целей" description="Добавьте цель, чтобы проект получил понятное направление." actionLabel="Добавить цель" onAction={openCreateModal} />}
      </div>

      {isEditorOpen ? (
        <Modal
          title={editingGoal ? 'Редактировать цель' : 'Новая цель'}
          isOpen={isEditorOpen}
          onClose={closeModal}
          size="lg"
          footer={(
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={closeModal} className="ui-button px-4 py-3 text-sm">Отмена</button>
              <button
                type="button"
                onClick={() => {
                  if (!formValues.title.trim()) {
                    return
                  }

                  if (editingGoal) {
                    onUpdateGoal(editingGoal.id, formValues)
                  } else {
                    onCreateGoal(formValues)
                  }

                  closeModal()
                }}
                className="ui-button-accent px-4 py-3 text-sm"
              >
                {editingGoal ? 'Сохранить изменения' : 'Создать цель'}
              </button>
            </div>
          )}
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Название</span>
                <input value={formValues.title} onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))} className="ui-input" placeholder="Например, выпустить первую публичную версию" />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Описание</span>
                <textarea value={formValues.description} onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))} rows={4} className="ui-textarea min-h-28" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Статус</span>
                  <select value={formValues.status} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as ProjectGoal['status'] }))} className="ui-select">
                    {Object.entries(projectGoalStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Приоритет</span>
                  <select value={formValues.priority} onChange={(event) => setFormValues((current) => ({ ...current, priority: event.target.value as ProjectGoal['priority'] }))} className="ui-select">
                    {Object.entries(projectPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Дедлайн</span>
                  <input type="date" value={formValues.deadline} onChange={(event) => setFormValues((current) => ({ ...current, deadline: event.target.value }))} className="ui-input" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Ручной прогресс</span>
                  <input type="number" min={0} max={100} value={formValues.progress} onChange={(event) => setFormValues((current) => ({ ...current, progress: Number(event.target.value) || 0 }))} className="ui-input" />
                </label>
              </div>

              <TagInput label="Теги" value={formValues.tags} suggestions={tagSuggestions} onChange={(tags) => setFormValues((current) => ({ ...current, tags }))} placeholder="Добавьте теги цели" />
            </div>

            <div className="space-y-4">
              <ToggleSelectionList title="Привязанные задачи" items={tasks.map((task) => ({ id: task.id, title: task.title, meta: `${task.status} · ${task.priority}` }))} selectedIds={formValues.taskIds} onToggle={(id) => toggleValue('taskIds', id)} />
              <ToggleSelectionList title="Привязанные заметки" items={notes.map((note) => ({ id: note.id, title: note.title, meta: note.summary || note.status }))} selectedIds={formValues.noteIds} onToggle={(id) => toggleValue('noteIds', id)} />
              <ToggleSelectionList title="Привязанные идеи" items={ideas.map((idea) => ({ id: idea.id, title: idea.title, meta: idea.nextStep || idea.status }))} selectedIds={formValues.ideaIds} onToggle={(id) => toggleValue('ideaIds', id)} />
              <ToggleSelectionList title="Привязанные файлы" items={files.map((file) => ({ id: file.id, title: file.title, meta: file.type }))} selectedIds={formValues.fileIds} onToggle={(id) => toggleValue('fileIds', id)} />
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}