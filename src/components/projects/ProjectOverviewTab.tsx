import type { Idea, Project, ProjectActivity, ProjectGoal, ProjectMilestone, Task } from '../../types'
import { calculateGoalProgress, calculateMilestoneProgress } from '../../utils/projectProgress'
import { ProjectMilestonesPanel, type ProjectMilestoneFormValues } from './ProjectMilestonesPanel'
import { projectGoalStatusLabels, projectPriorityLabels, projectStatusLabels } from './projectMeta'

type ProjectOverviewTabProps = {
  project: Project
  tasks: Task[]
  ideas: Idea[]
  goals: ProjectGoal[]
  milestones: ProjectMilestone[]
  activities: ProjectActivity[]
  completionRate: number
  stats: {
    tasksTotal: number
    tasksCompleted: number
    tasksActive: number
    tasksOverdue: number
    goalsTotal: number
    goalsCompleted: number
    milestonesTotal: number
    milestonesCompleted: number
    notesTotal: number
    ideasTotal: number
    filesTotal: number
    workspaceBlocksTotal: number
  }
  onOpenTask: (taskId: string) => void
  onOpenIdea: (ideaId: string) => void
  onCreateTask: () => void
  onOpenWorkspace: () => void
  onCreateMilestone: (values: ProjectMilestoneFormValues) => void
  onUpdateMilestone: (milestoneId: string, values: ProjectMilestoneFormValues) => void
  onDeleteMilestone: (milestoneId: string) => void
  onMoveMilestone: (milestoneId: string, direction: 'up' | 'down') => void
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Не задан'
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value))
}

export function ProjectOverviewTab({
  project,
  tasks,
  ideas,
  goals,
  milestones,
  activities,
  completionRate,
  stats,
  onOpenTask,
  onOpenIdea,
  onCreateTask,
  onOpenWorkspace,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onMoveMilestone,
}: ProjectOverviewTabProps) {
  const primaryGoal = goals[0] ?? null
  const primaryGoalProgress = primaryGoal ? calculateGoalProgress(primaryGoal, tasks) : completionRate
  const currentMilestone = milestones.find((milestone) => milestone.status === 'in_progress') ?? milestones.find((milestone) => milestone.status !== 'completed') ?? null
  const currentMilestoneProgress = currentMilestone ? calculateMilestoneProgress(currentMilestone, tasks) : 0
  const nearestTasks = [...tasks]
    .filter((task) => task.deadline && task.status !== 'completed')
    .sort((a, b) => new Date(a.deadline ?? '').getTime() - new Date(b.deadline ?? '').getTime())
    .slice(0, 4)
  const overdueTaskList = [...tasks]
    .filter((task) => task.deadline && task.status !== 'completed' && new Date(task.deadline).getTime() < Date.now())
    .sort((a, b) => new Date(a.deadline ?? '').getTime() - new Date(b.deadline ?? '').getTime())
    .slice(0, 3)
  const latestActivities = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
  const nextIdeaSteps = ideas.filter((idea) => idea.nextStep.trim()).slice(0, 3)

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Прогресс</p>
          <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{completionRate}%</p>
          <p className="mt-2 text-sm text-(--text-secondary)">Выполнено {stats.tasksCompleted} из {stats.tasksTotal} задач</p>
        </article>
        <article className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Главная цель</p>
          <p className="mt-2 text-lg font-semibold text-(--text-primary)">{primaryGoal?.title || project.goal || 'Не задана'}</p>
          <p className="mt-2 text-sm text-(--text-secondary)">{primaryGoal ? `${projectGoalStatusLabels[primaryGoal.status]} · ${primaryGoalProgress}%` : 'Добавьте цель, чтобы зафиксировать ожидаемый результат.'}</p>
        </article>
        <article className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Текущий этап</p>
          <p className="mt-2 text-lg font-semibold text-(--text-primary)">{currentMilestone?.title || 'Не определён'}</p>
          <p className="mt-2 text-sm text-(--text-secondary)">{currentMilestone ? `${currentMilestoneProgress}% · ${formatDate(currentMilestone.deadline)}` : 'Разбейте проект на этапы, чтобы видеть фазу работы.'}</p>
        </article>
        <article className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Дедлайн</p>
          <p className="mt-2 text-lg font-semibold text-(--text-primary)">{formatDate(project.deadline)}</p>
          <p className="mt-2 text-sm text-(--text-secondary)">{projectStatusLabels[project.status]}</p>
        </article>
      </div>

      <article className="ui-panel p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Описание проекта</p>
        <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Суть и текущее состояние</h2>
        <p className="mt-3 text-sm leading-7 text-(--text-secondary)">{project.description || 'Краткое описание проекта пока не заполнено.'}</p>
        {project.details ? <p className="mt-3 text-sm leading-7 text-(--text-secondary)">{project.details}</p> : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Главный ориентир</p>
            <p className="mt-2 text-sm text-(--text-primary)">{primaryGoal?.title || project.goal || 'Не указана главная цель'}</p>
            <p className="mt-2 text-sm text-(--text-secondary)">{primaryGoal?.description || 'Опишите ожидаемый результат проекта, чтобы было проще оценивать прогресс.'}</p>
          </div>
          <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Статус и приоритет</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="ui-chip">{projectStatusLabels[project.status]}</span>
              <span className="ui-chip">Приоритет: {projectPriorityLabels[project.priority ?? 'medium']}</span>
            </div>
            <p className="mt-3 text-sm text-(--text-secondary)">Целей: {stats.goalsTotal} · Этапов: {stats.milestonesTotal} · Активных задач: {stats.tasksActive}</p>
          </div>
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="ui-panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Ближайшие действия</p>
              <p className="mt-2 text-sm text-(--text-secondary)">Главные следующие шаги, которые двигают проект вперёд.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onCreateTask} className="ui-button-accent px-4 py-2 text-sm">Добавить ближайшее действие</button>
              <button type="button" onClick={onOpenWorkspace} className="ui-button px-4 py-2 text-sm">Открыть рабочую область</button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {nearestTasks.length > 0 ? nearestTasks.map((task) => (
              <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className="w-full rounded-2xl border border-(--border) bg-(--panel-elevated) p-4 text-left">
                <div className="flex flex-wrap gap-2"><span className="ui-chip">{task.status}</span><span className="ui-chip">{task.priority}</span></div>
                <p className="mt-3 text-sm font-semibold text-(--text-primary)">{task.title}</p>
                <p className="mt-1 text-xs text-(--text-muted)">{formatDate(task.deadline)}</p>
              </button>
            )) : <p className="text-sm text-(--text-muted)">В проекте пока нет задач. Добавьте первое действие.</p>}

            {currentMilestone ? (
              <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Текущий этап</p>
                <p className="mt-2 text-sm font-semibold text-(--text-primary)">{currentMilestone.title}</p>
                <p className="mt-1 text-sm text-(--text-secondary)">{currentMilestoneProgress}% · {formatDate(currentMilestone.deadline)}</p>
              </div>
            ) : null}

            {overdueTaskList.map((task) => (
              <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className="w-full rounded-2xl border border-(--danger-border) bg-(--danger-bg) p-4 text-left">
                <p className="text-xs uppercase tracking-[0.16em] text-(--danger-text)">Просрочено</p>
                <p className="mt-2 text-sm font-semibold text-(--danger-text)">{task.title}</p>
                <p className="mt-1 text-xs text-(--text-muted)">Срок истёк: {formatDate(task.deadline)}</p>
              </button>
            ))}

            {nextIdeaSteps.map((idea) => (
              <button key={idea.id} type="button" onClick={() => onOpenIdea(idea.id)} className="w-full rounded-2xl border border-(--border) bg-(--panel-elevated) p-4 text-left">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Следующий шаг из идеи</p>
                <p className="mt-2 text-sm font-semibold text-(--text-primary)">{idea.title}</p>
                <p className="mt-1 text-sm text-(--text-secondary)">{idea.nextStep}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="ui-panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Последняя активность</p>
          <div className="mt-4 space-y-3">
            {latestActivities.length > 0 ? latestActivities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
                <p className="text-sm font-semibold text-(--text-primary)">{activity.title}</p>
                <p className="mt-1 text-sm text-(--text-secondary)">{activity.description || 'Активность без дополнительного описания.'}</p>
                <p className="mt-2 text-xs text-(--text-muted)">{new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.createdAt))}</p>
              </div>
            )) : <p className="text-sm text-(--text-muted)">Активности пока нет. Создайте блок, задачу или заметку, чтобы наполнить ленту проекта.</p>}
          </div>
        </article>
      </div>

      <ProjectMilestonesPanel
        milestones={milestones}
        tasks={tasks}
        onCreateMilestone={onCreateMilestone}
        onUpdateMilestone={onUpdateMilestone}
        onDeleteMilestone={onDeleteMilestone}
        onMoveMilestone={onMoveMilestone}
      />
    </section>
  )
}
