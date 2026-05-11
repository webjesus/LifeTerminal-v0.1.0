import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/tasks/EmptyState'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskFormModal, type TaskFormValues } from '../components/tasks/TaskFormModal'
import { taskPriorityLabels } from '../components/tasks/taskMeta'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, Relation, Task, TaskPriority } from '../types'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'

type TaskFilter = 'all' | 'today' | 'overdue' | 'upcoming' | 'completed' | 'priority'
type ModalMode = 'create' | 'edit' | 'view' | null

const filterLabels: Record<TaskFilter, string> = {
  all: 'Все задачи',
  today: 'Сегодня',
  overdue: 'Просроченные',
  upcoming: 'Ближайшие',
  completed: 'Выполненные',
  priority: 'По приоритету',
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateInputValue(value: string) {
  return new Date(`${value}T12:00:00`).toISOString()
}

function parseDateOnly(value: string) {
  return new Date(`${value}T12:00:00`)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function isTaskOverdue(task: Task, now: Date) {
  if (!task.deadline || task.status === 'completed') {
    return false
  }

  return parseDateOnly(task.deadline.slice(0, 10)) < getStartOfDay(now)
}

function isTaskForToday(task: Task, now: Date) {
  if (!task.deadline) {
    return false
  }

  const deadline = parseDateOnly(task.deadline.slice(0, 10))
  const today = getStartOfDay(now)

  return deadline.getTime() === today.getTime()
}

function isTaskUpcoming(task: Task, now: Date) {
  if (!task.deadline || task.status === 'completed') {
    return false
  }

  const today = getStartOfDay(now)
  const deadline = parseDateOnly(task.deadline.slice(0, 10))
  const diffInDays = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)

  return diffInDays >= 1 && diffInDays <= 7
}

function compareTasks(a: Task, b: Task) {
  const aCompleted = a.status === 'completed'
  const bCompleted = b.status === 'completed'

  if (aCompleted !== bCompleted) {
    return Number(aCompleted) - Number(bCompleted)
  }

  if (a.deadline && b.deadline) {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  }

  if (a.deadline) {
    return -1
  }

  if (b.deadline) {
    return 1
  }

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function buildTaskFromForm(values: TaskFormValues, existingTask?: Task): Task {
  const timestamp = new Date().toISOString()
  const deadline = values.deadline ? toDateInputValue(values.deadline) : null
  const isCompleted = values.status === 'completed'

  return {
    id: existingTask?.id ?? crypto.randomUUID(),
    title: values.title,
    description: values.description,
    status: values.status,
    priority: values.priority,
    deadline,
    createdAt: existingTask?.createdAt ?? timestamp,
    updatedAt: timestamp,
    completedAt: isCompleted ? existingTask?.completedAt ?? timestamp : null,
    projectId: existingTask?.projectId ?? null,
    noteIds: existingTask?.noteIds ?? [],
    ideaIds: existingTask?.ideaIds ?? [],
    fileIds: existingTask?.fileIds ?? [],
    goalIds: existingTask?.goalIds ?? [],
  }
}

export function TasksPage() {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: notes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: files } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: goals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: sections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority>('high')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  )

  const filteredTasks = useMemo(() => {
    const now = new Date()
    const sortedTasks = [...tasks].sort(compareTasks)

    switch (activeFilter) {
      case 'today':
        return sortedTasks.filter((task) => isTaskForToday(task, now))
      case 'overdue':
        return sortedTasks.filter((task) => isTaskOverdue(task, now))
      case 'upcoming':
        return sortedTasks.filter((task) => isTaskUpcoming(task, now))
      case 'completed':
        return sortedTasks.filter((task) => task.status === 'completed')
      case 'priority':
        return sortedTasks.filter((task) => task.priority === priorityFilter)
      case 'all':
      default:
        return sortedTasks
    }
  }, [activeFilter, priorityFilter, tasks])

  const stats = useMemo(() => {
    const now = new Date()
    return {
      total: tasks.length,
      completed: tasks.filter((task) => task.status === 'completed').length,
      overdue: tasks.filter((task) => isTaskOverdue(task, now)).length,
      today: tasks.filter((task) => isTaskForToday(task, now)).length,
    }
  }, [tasks])

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ tasks, projects, notes, ideas, files, goals, sections }),
    [files, goals, ideas, notes, projects, sections, tasks],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'task' && item.id === selectedTask?.id)),
    [relationCatalog, selectedTask?.id],
  )

  const selectedTaskRelations = useMemo(
    () => (selectedTask ? getLinkedItemsFromRelations(selectedTask.id, relations.filter(isEditableRelation), relationCatalog) : []),
    [relationCatalog, relations, selectedTask],
  )

  function closeModal() {
    setModalMode(null)
    setSelectedTaskId(null)
  }

  function openCreateModal() {
    setSelectedTaskId(null)
    setModalMode('create')
  }

  function openViewModal(task: Task) {
    setSelectedTaskId(task.id)
    setModalMode('view')
  }

  function openEditModal(task: Task) {
    setSelectedTaskId(task.id)
    setModalMode('edit')
  }

  function handleCreateTask(values: TaskFormValues) {
    const nextTask = buildTaskFromForm(values)
    setTasks((currentTasks) => [nextTask, ...currentTasks])
    syncRelationsForItem(nextTask.id, 'task', values.relatedItems)
    closeModal()
  }

  function handleUpdateTask(values: TaskFormValues) {
    if (!selectedTask) {
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === selectedTask.id ? buildTaskFromForm(values, task) : task,
      ),
    )
    syncRelationsForItem(selectedTask.id, 'task', values.relatedItems)
    closeModal()
  }

  function handleDeleteTask(task: Task) {
    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить задачу «${task.title}»?`)
      : true

    if (!shouldDelete) {
      return
    }

    setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id))
    deleteRelationsForItem(task.id)

    if (selectedTaskId === task.id) {
      closeModal()
    }
  }

  function handleToggleComplete(task: Task) {
    const timestamp = new Date().toISOString()

    setTasks((currentTasks) =>
      currentTasks.map((item) => {
        if (item.id !== task.id) {
          return item
        }

        const isCompleted = item.status === 'completed'

        return {
          ...item,
          status: isCompleted ? 'in_progress' : 'completed',
          completedAt: isCompleted ? null : timestamp,
          updatedAt: timestamp,
        }
      }),
    )
  }

  function handleExtendDeadline(task: Task) {
    const baseDate = task.deadline ? new Date(task.deadline) : getStartOfDay(new Date())
    const extendedDate = new Date(baseDate)
    extendedDate.setDate(extendedDate.getDate() + 1)
    const timestamp = new Date().toISOString()

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              deadline: extendedDate.toISOString(),
              updatedAt: timestamp,
            }
          : item,
      ),
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-(--border) bg-(--panel) p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Task Control</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-(--text-primary) md:text-4xl">Задачи</h1>
            <p className="page-description mt-2 max-w-2xl text-sm text-(--text-muted) md:text-base">
              Полноценный локальный рабочий контур для задач с фильтрами, дедлайнами и сохранением после перезагрузки.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="ui-button-accent px-5 py-3"
          >
            Добавить задачу
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Всего</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{stats.total}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">На сегодня</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{stats.today}</p>
          </div>
          <div className="ui-stat-card border-[#f3d2c7] bg-[#fff8f4]">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Просрочено</p>
            <p className="mt-2 text-2xl font-semibold text-[#c35a3d]">{stats.overdue}</p>
          </div>
          <div className="ui-stat-card border-[#d7e8dc] bg-[#ebf7ef]">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Выполнено</p>
            <p className="mt-2 text-2xl font-semibold text-[#37734f]">{stats.completed}</p>
          </div>
        </div>
      </header>

      <section className="ui-panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="ui-filter-scroll">
            {(Object.keys(filterLabels) as TaskFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={[
                  'ui-filter-pill',
                  activeFilter === filter
                    ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent) shadow-[0_6px_18px_rgba(57,39,255,0.12)]'
                    : 'hover:border-(--accent-border) hover:text-(--text-primary)',
                ].join(' ')}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>

          {activeFilter === 'priority' ? (
            <div className="ui-filter-scroll md:justify-end">
              {(Object.keys(taskPriorityLabels) as TaskPriority[]).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setPriorityFilter(priority)}
                  className={[
                    'ui-filter-pill',
                    priorityFilter === priority
                      ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                      : 'hover:border-(--accent-border) hover:text-(--text-primary)',
                  ].join(' ')}
                >
                  {taskPriorityLabels[priority]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title="Задачи пока не найдены"
          description="Создайте первую задачу или смените фильтр. Все изменения будут сохранены в localStorage и останутся после перезагрузки страницы."
          actionLabel="Создать задачу"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-2">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isOverdue={isTaskOverdue(task, new Date())}
              projectTitle={projects.find((project) => project.id === task.projectId)?.title ?? null}
              onOpen={openViewModal}
              onEdit={openEditModal}
              onToggleComplete={handleToggleComplete}
              onExtendDeadline={handleExtendDeadline}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {modalMode ? (
        <TaskFormModal
          key={`${modalMode}-${selectedTask?.id ?? 'new'}`}
          mode={modalMode}
          task={selectedTask}
          relatedItems={selectedTaskRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={closeModal}
          onSubmit={modalMode === 'create' ? handleCreateTask : handleUpdateTask}
        />
      ) : null}

      {selectedTask && modalMode === 'view' ? (
        <div className="ui-panel p-5 text-sm text-(--text-muted)">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Последний выбор</p>
              <p className="mt-1 text-(--text-primary)">{selectedTask.title}</p>
            </div>
            <p>Создана {formatDateTime(selectedTask.createdAt)} · Обновлена {formatDateTime(selectedTask.updatedAt)}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
