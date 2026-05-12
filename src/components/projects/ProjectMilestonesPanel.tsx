import { useMemo, useState } from 'react'
import type { ProjectMilestone, Task } from '../../types'
import { calculateMilestoneProgress } from '../../utils/projectProgress'
import { Modal } from '../Modal'
import { EmptyState } from './EmptyState'
import { projectMilestoneStatusLabels } from './projectMeta'

export type ProjectMilestoneFormValues = {
  title: string
  description: string
  status: ProjectMilestone['status']
  deadline: string
  taskIds: string[]
}

type ProjectMilestonesPanelProps = {
  milestones: ProjectMilestone[]
  tasks: Task[]
  onCreateMilestone: (values: ProjectMilestoneFormValues) => void
  onUpdateMilestone: (milestoneId: string, values: ProjectMilestoneFormValues) => void
  onDeleteMilestone: (milestoneId: string) => void
  onMoveMilestone: (milestoneId: string, direction: 'up' | 'down') => void
}

const EMPTY_FORM: ProjectMilestoneFormValues = {
  title: '',
  description: '',
  status: 'planned',
  deadline: '',
  taskIds: [],
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Без дедлайна'
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value))
}

export function ProjectMilestonesPanel({ milestones, tasks, onCreateMilestone, onUpdateMilestone, onDeleteMilestone, onMoveMilestone }: ProjectMilestonesPanelProps) {
  const [editorState, setEditorState] = useState<{ milestoneId: string | null; values: ProjectMilestoneFormValues } | null>(null)
  const editingMilestone = useMemo(() => (editorState?.milestoneId ? milestones.find((milestone) => milestone.id === editorState.milestoneId) ?? null : null), [editorState?.milestoneId, milestones])

  function openCreate() {
    setEditorState({ milestoneId: null, values: EMPTY_FORM })
  }

  function openEdit(milestone: ProjectMilestone) {
    setEditorState({
      milestoneId: milestone.id,
      values: {
        title: milestone.title,
        description: milestone.description,
        status: milestone.status,
        deadline: milestone.deadline ? milestone.deadline.slice(0, 10) : '',
        taskIds: milestone.taskIds,
      },
    })
  }

  function closeEditor() {
    setEditorState(null)
  }

  return (
    <article className="ui-panel p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Этапы</p>
          <h3 className="mt-2 text-xl font-semibold text-(--text-primary)">Пошаговое движение проекта</h3>
          <p className="mt-2 text-sm text-(--text-secondary)">Этапы помогают видеть текущую фазу, следующий шаг и прогресс по крупным кускам работы.</p>
        </div>
        <button type="button" onClick={openCreate} className="ui-button px-4 py-3">Добавить этап</button>
      </div>

      <div className="mt-5 space-y-4">
        {milestones.length > 0 ? milestones.map((milestone, index) => {
          const progress = calculateMilestoneProgress(milestone, tasks)
          const linkedTasks = tasks.filter((task) => milestone.taskIds.includes(task.id))

          return (
            <article key={milestone.id} className="rounded-3xl border border-(--border) bg-(--panel-elevated) p-4 md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="ui-chip">#{index + 1}</span>
                    <span className="ui-chip">{projectMilestoneStatusLabels[milestone.status]}</span>
                    <span className="ui-chip">Прогресс: {progress}%</span>
                  </div>
                  <h4 className="mt-3 text-lg font-semibold text-(--text-primary)">{milestone.title}</h4>
                  <p className="mt-2 text-sm text-(--text-secondary)">{milestone.description || 'Описание этапа пока не заполнено.'}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-(--panel)">
                    <div className="h-full rounded-full bg-(--accent)" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-(--text-muted)">Дедлайн: {formatDate(milestone.deadline)} · Задач внутри этапа: {linkedTasks.length}</p>
                </div>

                <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
                  <button type="button" onClick={() => onMoveMilestone(milestone.id, 'up')} disabled={index === 0} className="ui-button px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Вверх</button>
                  <button type="button" onClick={() => onMoveMilestone(milestone.id, 'down')} disabled={index === milestones.length - 1} className="ui-button px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Вниз</button>
                  <button type="button" onClick={() => openEdit(milestone)} className="ui-button px-3 py-2 text-sm">Редактировать</button>
                  <button type="button" onClick={() => onDeleteMilestone(milestone.id)} className="ui-button-danger px-3 py-2 text-sm">Удалить</button>
                </div>
              </div>
            </article>
          )
        }) : <EmptyState title="Этапы пока не заданы" description="Разбейте проект на этапы, чтобы видеть, где вы находитесь и что идёт следующим." actionLabel="Добавить этап" onAction={openCreate} />}
      </div>

      {editorState ? (
        <Modal
          title={editingMilestone ? 'Редактировать этап' : 'Новый этап'}
          isOpen={Boolean(editorState)}
          onClose={closeEditor}
          size="lg"
          footer={(
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={closeEditor} className="ui-button px-4 py-3 text-sm">Отмена</button>
              <button
                type="button"
                onClick={() => {
                  if (!editorState.values.title.trim()) {
                    return
                  }

                  if (editingMilestone) {
                    onUpdateMilestone(editingMilestone.id, editorState.values)
                  } else {
                    onCreateMilestone(editorState.values)
                  }

                  closeEditor()
                }}
                className="ui-button-accent px-4 py-3 text-sm"
              >
                {editingMilestone ? 'Сохранить изменения' : 'Создать этап'}
              </button>
            </div>
          )}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <p className="text-sm text-(--text-secondary)">Опишите ожидаемый результат этапа и привяжите задачи, которые должны быть закрыты внутри него.</p>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Название</span>
                <input value={editorState.values.title} onChange={(event) => setEditorState((current) => current ? { ...current, values: { ...current.values, title: event.target.value } } : current)} className="ui-input" placeholder="Например, дизайн и подготовка интерфейса" />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Описание</span>
                <textarea value={editorState.values.description} onChange={(event) => setEditorState((current) => current ? { ...current, values: { ...current.values, description: event.target.value } } : current)} rows={5} className="ui-textarea min-h-30 w-full" placeholder="Что должно быть завершено на этом этапе и по каким признакам будет понятно, что этап закрыт." />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Статус</span>
                  <select value={editorState.values.status} onChange={(event) => setEditorState((current) => current ? { ...current, values: { ...current.values, status: event.target.value as ProjectMilestone['status'] } } : current)} className="ui-select">
                    {Object.entries(projectMilestoneStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Дедлайн</span>
                  <input type="date" value={editorState.values.deadline} onChange={(event) => setEditorState((current) => current ? { ...current, values: { ...current.values, deadline: event.target.value } } : current)} className="ui-input" />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Связанные задачи</p>
              <p className="mt-2 text-sm text-(--text-secondary)">Отметьте задачи, которые относятся к текущему этапу.</p>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                {tasks.length > 0 ? tasks.map((task) => {
                  const checked = editorState.values.taskIds.includes(task.id)

                  return (
                    <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-(--border-soft) bg-(--panel) px-3 py-3 text-sm text-(--text-primary)">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setEditorState((current) => current ? {
                          ...current,
                          values: {
                            ...current.values,
                            taskIds: checked ? current.values.taskIds.filter((item) => item !== task.id) : [...current.values.taskIds, task.id],
                          },
                        } : current)}
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{task.title}</span>
                        <span className="mt-1 block text-xs text-(--text-muted)">{task.status} · {task.priority}</span>
                      </span>
                    </label>
                  )
                }) : <p className="text-sm text-(--text-muted)">Сначала добавьте задачи в проект.</p>}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </article>
  )
}