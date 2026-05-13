import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { TaskCard } from '../components/tasks/TaskCard'
import { TaskFormModal, type TaskFormValues } from '../components/tasks/TaskFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, ProjectWorkspaceBlock, Relation, Task } from '../types'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'
import { detachWorkspaceBlocksFromLinkedEntity, syncWorkspaceBlocksFromLinkedEntity } from '../utils/syncWorkspaceBlocks'
import { compareTasksForNextSelection, getNextTask, isTaskDueToday, isTaskOverdue, NEXT_TASK_HELP_TEXT, NEXT_TASK_TOOLTIP } from '../utils/tasks'

type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed'
type ModalMode = 'create' | 'edit' | 'view' | null
type TaskSection = {
  key: string
  label: string
  items: Task[]
}

const filterLabels: Record<TaskFilter, string> = {
  all: 'Все',
  today: 'Сегодня',
  upcoming: 'Предстоящие',
  completed: 'Выполненные',
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

function isTaskForToday(task: Task, now: Date) {
  return isTaskDueToday(task, now)
}

function isTaskUpcoming(task: Task, now: Date) {
  if (!task.deadline || task.status === 'completed') {
    return false
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const deadline = parseDateOnly(task.deadline.slice(0, 10))
  const diffInDays = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)

  return diffInDays >= 1 && diffInDays <= 7
}

function compareTasks(a: Task, b: Task) {
  return compareTasksForNextSelection(a, b)
}

function buildTaskFromForm(values: TaskFormValues, existingTask?: Task): Task {
  const timestamp = new Date().toISOString()
  const deadline = values.deadline ? toDateInputValue(values.deadline) : null
  const isCompleted = values.status === 'completed'

  return {
    id: existingTask?.id ?? crypto.randomUUID(),
    title: values.title,
    description: values.description,
    tags: existingTask?.tags ?? [],
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
  const { setValue: setProjectWorkspaceBlocks } = useLocalStorage<ProjectWorkspaceBlock[]>(storageKeys.projectWorkspaceBlocks, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: notes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: files } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: goals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: sections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
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
      case 'upcoming':
        return sortedTasks.filter((task) => isTaskUpcoming(task, now) || isTaskOverdue(task, now))
      case 'completed':
        return sortedTasks.filter((task) => task.status === 'completed')
      case 'all':
      default:
        return sortedTasks
    }
  }, [activeFilter, tasks])

  const nextTaskSelection = useMemo(() => getNextTask(filteredTasks), [filteredTasks])
  const leadTaskId = nextTaskSelection.task?.id ?? null

  const taskSections = useMemo<TaskSection[]>(() => {
    const now = new Date()
    const sectionsMap = new Map<string, TaskSection>()

    const resolveSection = (task: Task) => {
      if (task.id === leadTaskId) {
        return { key: 'next', label: 'Следующая' }
      }

      if (task.status === 'completed') {
        return { key: 'completed', label: 'Выполненные' }
      }

      if (isTaskOverdue(task, now)) {
        return { key: 'overdue', label: 'Требуют внимания' }
      }

      if (isTaskForToday(task, now)) {
        return { key: 'today', label: 'Сегодня' }
      }

      if (isTaskUpcoming(task, now)) {
        return { key: 'upcoming', label: 'Предстоящие' }
      }

      return { key: 'later', label: 'Без срока' }
    }

    filteredTasks.forEach((task) => {
      const sectionMeta = resolveSection(task)
      const existingSection = sectionsMap.get(sectionMeta.key)

      if (existingSection) {
        existingSection.items.push(task)
        return
      }

      sectionsMap.set(sectionMeta.key, {
        ...sectionMeta,
        items: [task],
      })
    })

    const orderedKeys = ['next', 'overdue', 'today', 'upcoming', 'later', 'completed']

    return orderedKeys.map((key) => sectionsMap.get(key)).filter((section): section is TaskSection => Boolean(section))
  }, [filteredTasks, leadTaskId])

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

    const nextTask = buildTaskFromForm(values, selectedTask)

    setTasks((currentTasks) => currentTasks.map((task) => (task.id === selectedTask.id ? nextTask : task)))
    setProjectWorkspaceBlocks((currentBlocks) =>
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'task', entity: nextTask, blocks: currentBlocks }),
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
    setProjectWorkspaceBlocks((currentBlocks) => detachWorkspaceBlocksFromLinkedEntity(currentBlocks, 'task', task.id))
    deleteRelationsForItem(task.id)

    if (selectedTaskId === task.id) {
      closeModal()
    }
  }

  function handleToggleComplete(task: Task) {
    const timestamp = new Date().toISOString()
    const updatedTask: Task = {
      ...task,
      status: task.status === 'completed' ? 'in_progress' : 'completed',
      completedAt: task.status === 'completed' ? null : timestamp,
      updatedAt: timestamp,
    }

    setTasks((currentTasks) =>
      currentTasks.map((item) => {
        if (item.id !== task.id) {
          return item
        }

        return updatedTask
      }),
    )

    setProjectWorkspaceBlocks((currentBlocks) =>
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'task', entity: updatedTask, blocks: currentBlocks }),
    )
  }

  function handleExtendDeadline(task: Task) {
    const baseDate = task.deadline ? new Date(task.deadline) : getStartOfDay(new Date())
    const extendedDate = new Date(baseDate)
    extendedDate.setDate(extendedDate.getDate() + 1)
    const timestamp = new Date().toISOString()
    const updatedTask: Task = {
      ...task,
      deadline: extendedDate.toISOString(),
      updatedAt: timestamp,
    }

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? updatedTask
          : item,
      ),
    )

    setProjectWorkspaceBlocks((currentBlocks) =>
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'task', entity: updatedTask, blocks: currentBlocks }),
    )
  }

  function handleInlineUpdate(task: Task, patch: Partial<Pick<Task, 'deadline' | 'priority'>>) {
    const timestamp = new Date().toISOString()
    const updatedTask: Task = {
      ...task,
      ...patch,
      updatedAt: timestamp,
    }

    setTasks((currentTasks) => currentTasks.map((item) => (item.id === task.id ? updatedTask : item)))
    setProjectWorkspaceBlocks((currentBlocks) =>
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'task', entity: updatedTask, blocks: currentBlocks }),
    )
  }

  function handleUpdateTaskDeadline(task: Task, nextDeadline: string | null) {
    const normalizedDeadline = nextDeadline ? toDateInputValue(nextDeadline) : null
    handleInlineUpdate(task, { deadline: normalizedDeadline })
  }

  function handleUpdateTaskPriority(task: Task, nextPriority: Task['priority']) {
    if (task.priority === nextPriority) {
      return
    }

    handleInlineUpdate(task, { priority: nextPriority })
  }

  return (
    <section className="space-y-4">
      <PageHeader
        section="tasks"
        title="Задачи"
        description="Короткий список того, что нужно сделать сейчас. Детали открываются по клику."
        actionLabel="Добавить задачу"
        onAction={openCreateModal}
      />

      <section className="ui-panel p-4 md:p-4.5">
        <div className="flex flex-wrap items-center gap-3 text-xs text-(--text-muted)">
          {leadTaskId ? (
            <span title={NEXT_TASK_TOOLTIP} className="rounded-full border border-(--accent-border) bg-(--accent-soft) px-2.5 py-1 text-(--accent)">
              {NEXT_TASK_HELP_TEXT}
            </span>
          ) : null}
          <span>Всего {stats.total}</span>
          <span>Сегодня {stats.today}</span>
          <span className={stats.overdue > 0 ? 'text-(--danger-text)' : ''}>Просрочено {stats.overdue}</span>
          <span className={stats.completed > 0 ? 'text-(--completed-text)' : ''}>Выполнено {stats.completed}</span>
        </div>

        <div className="mt-3 ui-filter-scroll">
          {(Object.keys(filterLabels) as TaskFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={[
                'ui-filter-pill',
                activeFilter === filter
                  ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                  : 'hover:border-(--accent-border) hover:text-(--text-primary)',
              ].join(' ')}
            >
              {filterLabels[filter]}
            </button>
          ))}
        </div>
      </section>

      {filteredTasks.length === 0 || (activeFilter !== 'completed' && leadTaskId === null && filteredTasks.every((task) => task.status === 'completed')) ? (
        <section className="ui-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-(--text-muted)">Задачи</p>
          <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">{filteredTasks.length === 0 ? 'Задач пока нет' : 'Все активные задачи выполнены'}</h2>
          <p className="mt-2 max-w-2xl text-sm text-(--text-muted)">{filteredTasks.length === 0 ? 'Добавьте первое действие, чтобы начать день.' : 'Следующая задача появится автоматически, когда вы добавите новое действие или вернёте задачу в работу.'}</p>
          <button type="button" onClick={openCreateModal} className="ui-button-accent mt-4 px-4 py-2.5">Добавить задачу</button>
        </section>
      ) : (
        <section className="ui-panel p-0">
          <div className="overflow-hidden rounded-[inherit] border border-(--border) bg-(--panel)">
            <div className="hidden grid-cols-[44px_minmax(0,1.8fr)_minmax(130px,0.9fr)_110px_110px_120px_48px] items-center gap-3 border-b border-(--border) px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-(--text-muted) md:grid">
              <span>Статус</span>
              <span>Задача</span>
              <span>Проект</span>
              <span>Дедлайн</span>
              <span>Приоритет</span>
              <span>Действие</span>
              <span className="text-right">Меню</span>
            </div>

            <div>
            {taskSections.map((section) => (
              <div key={section.key}>
                <div className="border-b border-(--border) px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-(--text-muted) md:px-4">
                  {section.label}
                </div>
                {section.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isLead={task.id === leadTaskId}
                    isOverdue={isTaskOverdue(task, new Date())}
                    projectTitle={projects.find((project) => project.id === task.projectId)?.title ?? null}
                    closeOnChangeKey={activeFilter}
                    onOpen={openViewModal}
                    onEdit={openEditModal}
                    onToggleComplete={handleToggleComplete}
                    onExtendDeadline={handleExtendDeadline}
                    onUpdateDeadline={handleUpdateTaskDeadline}
                    onUpdatePriority={handleUpdateTaskPriority}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            ))}
            </div>
          </div>
        </section>
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
    </section>
  )
}
