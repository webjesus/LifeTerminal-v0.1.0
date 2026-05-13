import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SectionIcon } from '../components/navigation/SectionIcon'
import { QuickAddInput } from '../components/quick/QuickAddInput'
import { taskStatusLabels } from '../components/tasks/taskMeta'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { Idea, Note, Project, Task } from '../types'
import { formatDateShort, formatDateTimeShort, toDateKey, toStartOfDay } from '../utils/date'
import { storageKeys } from '../utils/storage'
import { getNextTask, getNextTaskCandidates, isTaskOverdue, NEXT_TASK_HELP_TEXT, NEXT_TASK_TOOLTIP } from '../utils/tasks'

const EMPTY_TASKS: Task[] = []
const EMPTY_PROJECTS: Project[] = []
const EMPTY_NOTES: Note[] = []
const EMPTY_IDEAS: Idea[] = []

type RecentActivityItem = {
  id: string
  title: string
  subtitle: string
  route: string
  updatedAt: string
  section: 'tasks' | 'notes' | 'ideas'
}

function formatTodayLabel(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)
}

function formatStreakLabel(days: number) {
  if (days === 1) {
    return '1 день'
  }

  if (days >= 2 && days <= 4) {
    return `${days} дня`
  }

  return `${days} дней`
}

function calculateStreak(dateKeys: string[], todayKey: string) {
  if (dateKeys.length === 0) {
    return 0
  }

  const keySet = new Set(dateKeys)
  let streak = 0
  let cursor = new Date(`${todayKey}T12:00:00`)

  while (keySet.has(toDateKey(cursor))) {
    streak += 1
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function DashboardPage() {
  const { settings } = useAppSettings()
  const { value: storedTasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: storedProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: storedNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: storedIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])

  const tasks = Array.isArray(storedTasks) ? storedTasks : EMPTY_TASKS
  const projects = Array.isArray(storedProjects) ? storedProjects : EMPTY_PROJECTS
  const notes = Array.isArray(storedNotes) ? storedNotes : EMPTY_NOTES
  const ideas = Array.isArray(storedIdeas) ? storedIdeas : EMPTY_IDEAS

  const today = new Date()
  const todayKey = toDateKey(today)
  const todayStart = toStartOfDay(today)
  const profileName = settings.profile.name || 'TANGO'
  const projectTitleById = useMemo(() => new Map(projects.map((project) => [project.id, project.title])), [projects])

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'completed'), [tasks])

  const todayTasks = useMemo(
    () => openTasks.filter((task) => task.deadline && toDateKey(new Date(task.deadline)) === todayKey).sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()),
    [openTasks, todayKey],
  )

  const overdueTasks = useMemo(
    () => openTasks.filter((task) => isTaskOverdue(task, todayStart)).sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()),
    [openTasks, todayStart],
  )

  const nearestTaskSelection = useMemo(() => getNextTask(tasks, null, today), [tasks, today])
  const nearestTask = nearestTaskSelection.task

  const nearestTasks = useMemo(() => getNextTaskCandidates(tasks, null, today).slice(0, 5), [tasks, today])

  const completedToday = useMemo(
    () => tasks.filter((task) => task.status === 'completed' && toDateKey(new Date(task.completedAt ?? task.updatedAt)) === todayKey).length,
    [tasks, todayKey],
  )

  const ideasToday = useMemo(() => ideas.filter((idea) => toDateKey(new Date(idea.createdAt)) === todayKey).length, [ideas, todayKey])

  const streakDays = useMemo(() => {
    const activityKeys = [
      ...tasks.map((task) => toDateKey(new Date(task.completedAt ?? task.updatedAt))),
      ...notes.map((note) => toDateKey(new Date(note.updatedAt))),
      ...ideas.map((idea) => toDateKey(new Date(idea.updatedAt))),
    ]

    return calculateStreak(activityKeys, todayKey)
  }, [ideas, notes, tasks, todayKey])

  const activeProjects = useMemo(() => {
    return projects
      .filter((project) => project.status === 'active' || project.status === 'planning')
      .map((project) => {
        const linkedTasks = tasks.filter((task) => task.projectId === project.id || project.taskIds.includes(task.id))
        const openProjectTasks = linkedTasks.filter((task) => task.status !== 'completed')
        const totalTasks = linkedTasks.length
        const completedTasks = linkedTasks.filter((task) => task.status === 'completed').length
        const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
        const nextAction = openProjectTasks.filter((task) => task.deadline).sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime())[0] ?? openProjectTasks[0] ?? null

        return {
          project,
          totalTasks,
          completedTasks,
          progressPercent,
          nextAction,
        }
      })
      .sort((a, b) => new Date(b.project.updatedAt).getTime() - new Date(a.project.updatedAt).getTime())
      .slice(0, 3)
  }, [projects, tasks])

  const recentActivity = useMemo<RecentActivityItem[]>(() => {
    return [
      ...tasks.map((task) => ({ id: task.id, title: task.title, subtitle: 'Задача', route: '/tasks', updatedAt: task.updatedAt, section: 'tasks' as const })),
      ...notes.map((note) => ({ id: note.id, title: note.title, subtitle: 'Заметка', route: '/notes', updatedAt: note.updatedAt, section: 'notes' as const })),
      ...ideas.map((idea) => ({ id: idea.id, title: idea.title, subtitle: 'Идея', route: '/ideas', updatedAt: idea.updatedAt, section: 'ideas' as const })),
    ]
      .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
      .slice(0, 3)
  }, [ideas, notes, tasks])

  function handleCompleteTask(taskId: string) {
    const timestamp = new Date().toISOString()

    setTasks((current) => current.map((task) => (
      task.id === taskId
        ? { ...task, status: 'completed', completedAt: timestamp, updatedAt: timestamp }
        : task
    )))
  }

  return (
    <section className="w-full max-w-full space-y-3 md:space-y-4">
      <header className="ui-panel px-4 py-3 md:px-5 md:py-3">
        <div className="min-w-0">
          <div className="min-w-0">
            <p className="text-sm text-(--text-muted)">Добрый день, {profileName}</p>
            <h1 className="mt-0.5 text-xl font-semibold text-(--text-primary) md:text-[1.6rem]">Сегодня</h1>
            <p className="mt-0.5 text-sm text-(--text-secondary)">{formatTodayLabel(today)} · Сфокусируйтесь на ближайших действиях.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)] xl:items-start">
        <div className="space-y-3">
          {settings.display.showTodayFocus ? (
            <section className="ui-panel border-(--accent-border) bg-[color-mix(in_srgb,var(--accent-soft)_30%,var(--panel))] p-3.5 md:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-(--text-muted)">
                    <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                      <SectionIcon section="tasks" size={14} />
                    </span>
                    <p className="text-xs uppercase tracking-[0.12em]">Сегодня в фокусе</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-(--text-secondary)">
                    <span className="ui-chip">Сегодня {todayTasks.length}</span>
                    <span className="ui-chip">Просрочено {overdueTasks.length}</span>
                    <span className="ui-chip">Выполнено {completedToday}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="#dashboard-quick-add" className="ui-button-accent px-3.5 py-2 text-sm">Добавить задачу</a>
                  <Link to="/tasks" className="ui-button px-3.5 py-2 text-sm">Открыть задачи</Link>
                </div>
              </div>

              {todayTasks.length === 0 && overdueTasks.length === 0 && !nearestTask ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-(--border) bg-(--panel-elevated) px-3.5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-(--text-primary)">На сегодня задач нет</p>
                    <p className="mt-0.5 text-sm text-(--text-secondary)">Добавьте задачу или выберите активный проект.</p>
                  </div>
                  <a href="#dashboard-quick-add" className="ui-button-accent shrink-0 px-3 py-2 text-sm">Добавить</a>
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  <div className="rounded-2xl border border-(--accent-border) bg-[color-mix(in_srgb,var(--accent-soft)_44%,var(--panel-elevated))] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-(--accent-border) bg-(--accent-soft) px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--accent)">Главный фокус</span>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">Ближайшее действие</p>
                        </div>
                        <p className="mt-2 truncate text-base font-semibold text-(--text-primary)">{nearestTask?.title || 'Нет активных задач'}</p>
                        <p className="mt-1 text-xs text-(--text-secondary)">{nearestTask?.deadline ? `Срок: ${formatDateShort(nearestTask.deadline)}` : 'Можно быстро добавить новую задачу.'}</p>
                        {nearestTask ? <p title={NEXT_TASK_TOOLTIP} className="mt-2 text-xs text-(--text-muted)">{NEXT_TASK_HELP_TEXT}</p> : null}
                      </div>
                      {nearestTask ? <button type="button" onClick={() => handleCompleteTask(nearestTask.id)} className="ui-button-accent px-3 py-2 text-sm">Выполнить</button> : null}
                    </div>
                  </div>

                  {nearestTasks.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {nearestTasks.slice(0, 3).map((task) => (
                        <Link key={`focus-${task.id}`} to="/tasks" className="rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-3 py-2.5 transition-colors hover:border-(--accent-border)">
                          <p className="truncate text-sm font-medium text-(--text-primary)">{task.title}</p>
                          <p className="mt-1 text-xs text-(--text-muted)">{task.deadline ? formatDateShort(task.deadline) : 'Без срока'} · {taskStatusLabels[task.status]}</p>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}

          {settings.display.showDashboardQuickAdd ? (
            <section id="dashboard-quick-add" className="ui-panel p-3.5 md:p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Быстрое добавление</p>
              <div className="mt-2">
                <QuickAddInput compact todayMode />
              </div>
            </section>
          ) : null}

          <section className="ui-panel p-3.5 md:p-4">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Ближайшие задачи</p>
                <h2 className="mt-1 text-base font-semibold text-(--text-primary)">Что делать дальше</h2>
              </div>
              <Link to="/tasks" className="ui-button px-3 py-2 text-sm">Все задачи</Link>
            </div>

            <div className="mt-3 space-y-2">
              {nearestTasks.length > 0 ? nearestTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-3 py-2.5">
                  <button type="button" aria-label={`Завершить ${task.title}`} onClick={() => handleCompleteTask(task.id)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-(--border-soft) bg-(--panel) text-(--text-muted) transition hover:border-(--accent-border) hover:text-(--accent)">
                    <span className="text-[10px]">✓</span>
                  </button>
                  <Link to="/tasks" className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--text-primary)">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
                      <span>{task.deadline ? formatDateShort(task.deadline) : 'Без срока'}</span>
                      <span>{taskStatusLabels[task.status]}</span>
                      {task.projectId && projectTitleById.get(task.projectId) ? <span className="ui-chip">{projectTitleById.get(task.projectId)}</span> : null}
                    </div>
                  </Link>
                </div>
              )) : <p className="rounded-2xl border border-dashed border-(--border) bg-(--panel-elevated) px-3.5 py-3 text-sm text-(--text-muted)">Ближайших задач нет.</p>}
            </div>
          </section>
        </div>

        <aside className="space-y-2.5">
          <section className="ui-panel p-3 md:p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Прогресс дня</p>
                <h2 className="mt-1 text-sm font-semibold text-(--text-primary)">Снимок дня</h2>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-(--text-secondary)">
              <span className="ui-chip">Выполнено {completedToday}</span>
              <span className="ui-chip">Активных {openTasks.length}</span>
              <span className="ui-chip">Идей {ideasToday}</span>
              <span className="ui-chip">Серия {formatStreakLabel(streakDays)}</span>
            </div>

            <p className="mt-2 text-xs text-(--text-muted)">Сегодня в фокусе {todayTasks.length} задач, из них {overdueTasks.length} требуют внимания.</p>
          </section>

          <section className="ui-panel p-3.5 md:p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Активные проекты</p>
                <h2 className="mt-1 text-base font-semibold text-(--text-primary)">Что двигается сейчас</h2>
              </div>
              <Link to="/projects" className="ui-button px-3 py-2 text-sm">Все</Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-(--border) bg-(--panel-elevated) px-3.5 py-3">
                <p className="text-sm font-semibold text-(--text-primary)">Проектов пока нет</p>
                <p className="mt-1 text-sm text-(--text-secondary)">Создайте первый проект, чтобы собрать задачи, идеи и материалы.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {activeProjects.map((item) => (
                  <article key={item.project.id} className="rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-(--text-primary)">{item.project.title}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-(--text-muted)">{item.nextAction ? `Ближайшее действие: ${item.nextAction.title}` : 'Ближайшее действие пока не задано'}</p>
                      </div>
                      {settings.display.showProjectProgress ? <span className="text-xs text-(--text-muted)">{item.progressPercent}%</span> : null}
                    </div>

                    {settings.display.showProjectProgress ? (
                      <div className="mt-2.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-(--panel)">
                          <div className="h-full rounded-full bg-[color-mix(in_srgb,var(--accent)_72%,var(--border))] transition-all duration-300" style={{ width: `${item.progressPercent}%` }} />
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-(--text-muted)">
                      <span>{item.completedTasks}/{item.totalTasks} задач</span>
                      <Link to={`/projects/${item.project.id}`} className="ui-button px-3 py-1.5 text-sm">Открыть</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {settings.display.showRecentActivity ? (
            <section className="ui-panel p-3 md:p-3.5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">Недавние изменения</p>
                  <h2 className="mt-1 text-sm font-semibold text-(--text-primary)">Последние события</h2>
                </div>
                <Link to="/tasks" className="ui-button px-3 py-2 text-sm">Показать больше</Link>
              </div>

              {recentActivity.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {recentActivity.map((item) => (
                    <Link key={`${item.section}-${item.id}`} to={item.route} className="block rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-3 py-2.5 transition-colors hover:border-(--border)">
                      <div className="flex items-center justify-between gap-3 text-xs text-(--text-muted)">
                        <div className="flex min-w-0 items-center gap-2">
                          <SectionIcon section={item.section} size={14} />
                          <span className="uppercase tracking-[0.1em]">{item.subtitle}</span>
                        </div>
                        <span className="shrink-0">{formatDateTimeShort(item.updatedAt)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-(--text-secondary)">{item.title}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-(--text-muted)">Недавних изменений пока нет.</p>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
