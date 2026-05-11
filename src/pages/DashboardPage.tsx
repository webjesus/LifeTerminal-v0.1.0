import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SectionIcon } from '../components/navigation/SectionIcon'
import { QuickAddInput } from '../components/quick/QuickAddInput'
import { taskPriorityLabels, taskStatusLabels } from '../components/tasks/taskMeta'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { DashboardLayoutMode } from '../types/settings'
import type { Goal, Idea, Note, Project, Task } from '../types'
import { formatDateShort, formatDateTimeShort, toDateKey, toStartOfDay } from '../utils/date'
import { storageKeys } from '../utils/storage'

function isTaskOverdue(task: Task, todayStart: Date) {
  return Boolean(task.deadline && task.status !== 'completed' && new Date(task.deadline) < todayStart)
}

type DeadlineItem = {
  id: string
  title: string
  deadline: string
  route: string
  sourceType: 'task' | 'project'
  overdue: boolean
}

const EMPTY_TASKS: Task[] = []
const EMPTY_PROJECTS: Project[] = []
const EMPTY_NOTES: Note[] = []
const EMPTY_IDEAS: Idea[] = []
const EMPTY_GOALS: Goal[] = []

type DashboardCard = {
  key: string
  defaultOrder: number
  focusOrder: number
  minimalOrder: number
  element: ReactNode
}

type RecentActivityItem = {
  id: string
  title: string
  subtitle: string
  route: string
  updatedAt: string
  section: 'tasks' | 'notes' | 'ideas'
}

function orderDashboardCards(cards: DashboardCard[], layout: DashboardLayoutMode) {
  const ordered = [...cards].sort((first, second) => {
    if (layout === 'focus') {
      return first.focusOrder - second.focusOrder
    }

    if (layout === 'minimal') {
      return first.minimalOrder - second.minimalOrder
    }

    return first.defaultOrder - second.defaultOrder
  })

  return layout === 'minimal' ? ordered.slice(0, 4) : ordered
}

export function DashboardPage() {
  const { settings } = useAppSettings()
  const { value: storedTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: storedProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: storedNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: storedIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: storedGoals } = useLocalStorage<Goal[]>(storageKeys.goals, [])

  const tasks = Array.isArray(storedTasks) ? storedTasks : EMPTY_TASKS
  const projects = Array.isArray(storedProjects) ? storedProjects : EMPTY_PROJECTS
  const notes = Array.isArray(storedNotes) ? storedNotes : EMPTY_NOTES
  const ideas = Array.isArray(storedIdeas) ? storedIdeas : EMPTY_IDEAS
  const goals = Array.isArray(storedGoals) ? storedGoals : EMPTY_GOALS

  const todayKey = toDateKey(new Date())
  const todayStart = toStartOfDay(new Date())

  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.deadline && toDateKey(new Date(task.deadline)) === todayKey)
        .sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') {
            return 1
          }
          if (a.status !== 'completed' && b.status === 'completed') {
            return -1
          }

          return new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()
        })
        .slice(0, 6),
    [tasks, todayKey],
  )

  const { overdueDeadlines, upcomingDeadlines } = useMemo(() => {
    const taskItems: DeadlineItem[] = tasks
      .filter((task) => task.deadline)
      .map((task) => ({
        id: task.id,
        title: task.title,
        deadline: task.deadline as string,
        route: '/tasks',
        sourceType: 'task',
        overdue: isTaskOverdue(task, todayStart),
      }))

    const projectItems: DeadlineItem[] = projects
      .filter((project) => project.deadline && project.status !== 'completed' && project.status !== 'archived')
      .map((project) => {
        const deadline = project.deadline as string

        return {
          id: project.id,
          title: project.title,
          deadline,
          route: `/projects/${project.id}`,
          sourceType: 'project' as const,
          overdue: new Date(deadline) < todayStart,
        }
      })

    const merged = [...taskItems, ...projectItems].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    )

    return {
      overdueDeadlines: merged.filter((item) => item.overdue).slice(0, 6),
      upcomingDeadlines: merged.filter((item) => !item.overdue).slice(0, 6),
    }
  }, [projects, tasks, todayStart])

  const activeProjects = useMemo(() => {
    return projects
      .filter((project) => project.status === 'active')
      .map((project) => {
        const linkedTasks = tasks.filter(
          (task) => task.projectId === project.id || project.taskIds.includes(task.id),
        )
        const totalTasks = linkedTasks.length
        const completedTasks = linkedTasks.filter((task) => task.status === 'completed').length
        const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

        return {
          project,
          totalTasks,
          completedTasks,
          progressPercent,
        }
      })
      .sort((a, b) => new Date(b.project.updatedAt).getTime() - new Date(a.project.updatedAt).getTime())
      .slice(0, 6)
  }, [projects, tasks])

  const latestNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6),
    [notes],
  )

  const latestIdeas = useMemo(
    () => [...ideas].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6),
    [ideas],
  )

  const recentActivity = useMemo<RecentActivityItem[]>(() => {
    return [
      ...tasks.map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: 'Задача',
        route: '/tasks',
        updatedAt: task.updatedAt,
        section: 'tasks' as const,
      })),
      ...notes.map((note) => ({
        id: note.id,
        title: note.title,
        subtitle: 'Заметка',
        route: '/notes',
        updatedAt: note.updatedAt,
        section: 'notes' as const,
      })),
      ...ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        subtitle: 'Идея',
        route: '/ideas',
        updatedAt: idea.updatedAt,
        section: 'ideas' as const,
      })),
    ]
      .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
      .slice(0, 5)
  }, [ideas, notes, tasks])

  const visibleCards = useMemo(() => {
    const cards: DashboardCard[] = []
    const visibleModules = settings.display.visibleModules

    if (visibleModules.tasks && settings.display.showTodayFocus) {
      cards.push({
        key: 'tasks',
        defaultOrder: 1,
        focusOrder: 1,
        minimalOrder: 1,
        element: (
          <article key="tasks" className="ui-panel ui-card-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-(--text-muted)">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section="tasks" size={18} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.22em]">Задачи</p>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Фокус на сегодня</h3>
              </div>
              <Link to="/tasks" className="ui-button px-3 py-2 text-xs">Открыть</Link>
            </div>
            {todaysTasks.length === 0 ? (
              <p className="mt-4 text-sm text-(--text-muted)">На сегодня задач не найдено. Добавьте новую задачу через быстрое добавление.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {todaysTasks.map((task) => (
                  <li key={task.id}>
                    <Link to="/tasks" className="block rounded-2xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-sm text-(--text-secondary) transition-colors hover:border-(--accent)">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-(--text-primary)">{task.title}</span>
                        <span className="shrink-0 text-xs text-(--text-muted)">{formatDateShort(task.deadline as string)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">
                        <span className="rounded-md border border-(--border) px-2 py-1">{taskStatusLabels[task.status]}</span>
                        <span className="rounded-md border border-(--border) px-2 py-1">{taskPriorityLabels[task.priority]}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ),
      })
    }

    if (visibleModules.calendar) {
      cards.push({
        key: 'calendar',
        defaultOrder: 2,
        focusOrder: 5,
        minimalOrder: 4,
        element: (
          <article key="calendar" className="ui-panel ui-card-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-(--text-muted)">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section="calendar" size={18} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.22em]">Календарь</p>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Ближайшие дедлайны</h3>
              </div>
              <Link to="/deadlines" className="ui-button px-3 py-2 text-xs">Открыть</Link>
            </div>
            {upcomingDeadlines.length === 0 && overdueDeadlines.length === 0 ? (
              <p className="mt-4 text-sm text-(--text-muted)">Дедлайнов пока нет. Задайте дату задаче или проекту.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {overdueDeadlines.length > 0 ? (
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-red-300">Просрочено</p>
                    <ul className="space-y-2">
                      {overdueDeadlines.map((item) => (
                        <li key={`${item.sourceType}-${item.id}`}>
                          <Link to={item.route} className="block rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm transition-colors hover:border-rose-300">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-(--text-primary)">{item.title}</span>
                              <span className="shrink-0 text-xs text-rose-500">{formatDateShort(item.deadline)}</span>
                            </div>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-rose-500">{item.sourceType === 'task' ? 'Задача' : 'Проект'}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {upcomingDeadlines.length > 0 ? (
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Ближайшие</p>
                    <ul className="space-y-2">
                      {upcomingDeadlines.map((item) => (
                        <li key={`${item.sourceType}-${item.id}`}>
                          <Link to={item.route} className="block rounded-2xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-sm transition-colors hover:border-(--accent)">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-(--text-primary)">{item.title}</span>
                              <span className="shrink-0 text-xs text-(--text-muted)">{formatDateShort(item.deadline)}</span>
                            </div>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-(--text-muted)">{item.sourceType === 'task' ? 'Задача' : 'Проект'}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </article>
        ),
      })
    }

    if (visibleModules.projects) {
      cards.push({
        key: 'projects',
        defaultOrder: 3,
        focusOrder: 6,
        minimalOrder: 2,
        element: (
          <article key="projects" className="ui-panel ui-card-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-(--text-muted)">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section="projects" size={18} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.22em]">Проекты</p>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Активные проекты</h3>
                <p className="mt-2 text-sm text-(--text-muted)">Короткий обзор активности и прогресса.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <Link to="/projects" className="ui-button px-3 py-2 text-xs">Все проекты</Link>
            </div>
            {activeProjects.length === 0 ? (
              <p className="mt-4 text-sm text-(--text-muted)">Активных проектов пока нет. Создайте проект и начните собирать контекст.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {activeProjects.map((item) => (
                  <li key={item.project.id}>
                    <Link to={`/projects/${item.project.id}`} className="block rounded-2xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-sm text-(--text-secondary) transition-colors hover:border-(--accent)">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-(--text-primary)">{item.project.title}</p>
                        {settings.display.showProjectProgress ? <span className="text-xs text-(--text-muted)">{item.progressPercent}%</span> : null}
                      </div>
                      {settings.display.showProjectProgress ? (
                        <>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
                            <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${item.progressPercent}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-(--text-muted)">Выполнено задач: {item.completedTasks} / {item.totalTasks}</p>
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-(--text-muted)">Связанных задач: {item.totalTasks}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ),
      })
    }

    if (visibleModules.notes) {
      cards.push({
        key: 'notes',
        defaultOrder: 4,
        focusOrder: 7,
        minimalOrder: 3,
        element: (
          <article key="notes" className="ui-panel ui-card-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-(--text-muted)">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section="notes" size={18} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.22em]">Заметки</p>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Последние заметки</h3>
              </div>
              <Link to="/notes" className="ui-button px-3 py-2 text-xs">Все заметки</Link>
            </div>
            {latestNotes.length === 0 ? (
              <p className="mt-4 text-sm text-(--text-muted)">Заметок пока нет. Добавьте заметку через быстрый ввод.</p>
            ) : (
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {latestNotes.map((note) => (
                  <li key={note.id}>
                    <Link to="/notes" className="block rounded-2xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-sm transition-colors hover:border-(--accent)">
                      <p className="truncate text-(--text-primary)">{note.title}</p>
                      <p className="mt-1 text-[11px] text-(--text-muted)">{formatDateTimeShort(note.updatedAt)}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-(--text-muted)">{note.content || 'Пустая заметка'}</p>
                      {note.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {note.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="rounded-md border border-(--border) bg-(--panel) px-2 py-1 text-[10px] text-(--text-muted)">#{tag}</span>
                          ))}
                        </div>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ),
      })
    }

    if (visibleModules.ideas) {
      cards.push({
        key: 'ideas',
        defaultOrder: 5,
        focusOrder: 9,
        minimalOrder: 8,
        element: (
          <article key="ideas" className="ui-panel ui-card-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-(--text-muted)">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section="ideas" size={18} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.22em]">Идеи</p>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Последние идеи</h3>
              </div>
              <Link to="/ideas" className="ui-button px-3 py-2 text-xs">Все идеи</Link>
            </div>
            {latestIdeas.length === 0 ? (
              <p className="mt-4 text-sm text-(--text-muted)">Идей пока нет. Добавьте идею через быстрый ввод.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {latestIdeas.map((idea) => (
                  <li key={idea.id}>
                    <Link to="/ideas" className="block rounded-2xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-sm transition-colors hover:border-(--accent)">
                      <p className="truncate text-(--text-primary)">{idea.title}</p>
                      <p className="mt-1 text-[11px] text-(--text-muted)">{formatDateTimeShort(idea.updatedAt)}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-(--text-muted)">{idea.description || 'Без описания'}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ),
      })
    }

    if (visibleModules.goals) {
      cards.push({
        key: 'goals',
        defaultOrder: 6,
        focusOrder: 3,
        minimalOrder: 5,
        element: (
          <article key="goals" className="ui-panel ui-card-hover min-w-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-(--text-muted)">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section="goals" size={18} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.22em]">Цели</p>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Цели и направления</h3>
                <p className="mt-2 text-sm text-(--text-muted)">Всего целей: {goals.length}. Управление целями доступно через проекты и связанные рабочие области.</p>
              </div>
              <Link to="/projects" className="ui-button px-3 py-2 text-xs">Открыть</Link>
            </div>
          </article>
        ),
      })
    }

    if (visibleModules.knowledgeLibrary) {
      cards.push({
        key: 'knowledgeLibrary',
        defaultOrder: 7,
        focusOrder: 8,
        minimalOrder: 7,
        element: (
          <article key="knowledgeLibrary" className="ui-panel ui-card-hover min-w-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-(--text-muted)">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    <SectionIcon section="knowledge" size={18} />
                  </span>
                  <p className="text-xs uppercase tracking-[0.22em]">База знаний</p>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">База знаний</h3>
                <p className="mt-2 text-sm text-(--text-muted)">Соберите заметки, файлы и референсы в одном месте. Сейчас доступно {notes.length} заметок и {projects.length} активных контекстов.</p>
              </div>
              <Link to="/files" className="ui-button px-3 py-2 text-xs">Файлы</Link>
            </div>
          </article>
        ),
      })
    }

    if (visibleModules.habits) {
      cards.push({
        key: 'habits',
        defaultOrder: 8,
        focusOrder: 2,
        minimalOrder: 6,
        element: (
          <article key="habits" className="ui-panel ui-card-hover min-w-0 p-5">
            <div className="flex items-center gap-2 text-(--text-muted)">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                <SectionIcon section="habits" size={18} />
              </span>
              <p className="text-xs uppercase tracking-[0.22em]">Привычки</p>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Привычки</h3>
            <p className="mt-3 text-sm text-(--text-muted)">Этот модуль подготовлен для следующего этапа. Его можно держать в фокусе dashboard уже сейчас.</p>
          </article>
        ),
      })
    }

    if (visibleModules.assistant) {
      cards.push({
        key: 'assistant',
        defaultOrder: 9,
        focusOrder: 4,
        minimalOrder: 9,
        element: (
          <article key="assistant" className="ui-panel ui-card-hover min-w-0 p-5">
            <div className="flex items-center gap-2 text-(--text-muted)">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                <SectionIcon section="assistant" size={18} />
              </span>
              <p className="text-xs uppercase tracking-[0.22em]">Ассистент</p>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-(--text-primary)">Ассистент</h3>
            <p className="mt-3 text-sm text-(--text-muted)">Модуль ассистента ещё не подключён, но layout и настройки уже готовы для его появления в интерфейсе.</p>
          </article>
        ),
      })
    }

    return orderDashboardCards(cards, settings.layout.dashboardLayout)
  }, [
    activeProjects,
    goals.length,
    latestIdeas,
    latestNotes,
    notes.length,
    overdueDeadlines,
    projects.length,
    settings.display.showProjectProgress,
    settings.display.showTodayFocus,
    settings.display.visibleModules,
    settings.layout.dashboardLayout,
    todaysTasks,
    upcomingDeadlines,
  ])

  const shouldShowStatCards = settings.layout.dashboardLayout !== 'minimal' && settings.display.showTodayFocus

  return (
    <section className="w-full max-w-full space-y-4 md:space-y-6">
      <header className="ui-panel overflow-hidden px-5 py-5 md:px-6 md:py-6">
        <div className="min-w-0">
          <p className="text-sm text-(--text-muted)">Добрый день, {settings.profile.name}</p>
          <h1 className="mt-2 max-w-[15ch] text-[1.95rem] font-semibold leading-[1.05] text-(--text-primary) sm:max-w-none sm:text-[2.1rem] md:text-[2.35rem]">Ваше личное пространство продуктивности</h1>
          <p className="page-description mt-3 max-w-2xl text-sm leading-6 text-(--text-muted)">Фокус на задачах, заметках, идеях и проектах.</p>
        </div>

        {settings.display.showDashboardQuickAdd ? (
          <div className="mt-5 rounded-[26px] border border-(--border) bg-(--panel-elevated) p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Быстрое добавление</p>
            <div className="mt-3">
              <QuickAddInput compact />
            </div>
          </div>
        ) : null}

        {settings.display.showRecentActivity ? (
          <div className="mt-4 rounded-[26px] border border-(--border) bg-(--panel-elevated) p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Последняя активность</p>
                <p className="mt-1 text-sm text-(--text-muted)">Недавние изменения в задачах, заметках и идеях.</p>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-(--text-muted)">Активность появится после первых изменений в приложении.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {recentActivity.map((item) => (
                  <Link key={`${item.section}-${item.id}`} to={item.route} className="min-w-0 rounded-2xl border border-(--border) bg-white px-4 py-3 text-sm transition-colors hover:border-(--accent)">
                    <div className="flex min-w-0 items-center gap-2 text-(--text-muted)">
                      <SectionIcon section={item.section} size={16} />
                      <span className="text-xs uppercase tracking-[0.14em]">{item.subtitle}</span>
                    </div>
                    <p className="mt-2 truncate text-(--text-primary)">{item.title}</p>
                    <p className="mt-1 text-xs text-(--text-muted)">{formatDateTimeShort(item.updatedAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {shouldShowStatCards ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="ui-panel-elevated p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Сегодня</p>
              <p className="mt-2 text-xl font-semibold text-(--text-primary)">{todaysTasks.length} задач в фокусе</p>
            </div>
            <div className="ui-panel-elevated p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Ближайшие</p>
              <p className="mt-2 text-xl font-semibold text-(--text-primary)">{upcomingDeadlines.length} ближайших сроков</p>
            </div>
            <div className="ui-panel-elevated p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Просроченные</p>
              <p className="mt-2 text-xl font-semibold text-rose-600">{overdueDeadlines.length} просрочено</p>
            </div>
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((card) => card.element)}
      </div>
    </section>
  )
}
