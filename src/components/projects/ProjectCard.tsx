import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import { projectPriorityLabels, projectStatusLabels } from './projectMeta'

type ProjectCardProps = {
  project: Project
  counts: {
    tasks: number
    notes: number
    ideas: number
    files: number
  }
  completionRate: number
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

function formatDeadline(value: string | null) {
  if (!value) {
    return 'Без дедлайна'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function ProjectCard({ project, counts, completionRate, onEdit, onDelete }: ProjectCardProps) {
  return (
    <article className="ui-panel ui-card-hover group p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">{projectStatusLabels[project.status]}</p>
          <Link to={`/projects/${project.id}`} className="mt-2 block text-2xl font-semibold text-(--text-primary) transition-colors duration-200 hover:text-(--accent)">
            {project.title}
          </Link>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 min-h-18 text-sm text-(--text-muted) md:text-base">{project.description || 'Описание проекта пока не заполнено.'}</p>

      <div className="mt-4 rounded-3xl border border-(--border) bg-(--panel-elevated) p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Рабочая область проекта</p>
        <p className="mt-2 text-sm text-(--text-secondary)">Задачи · Заметки · Идеи · Файлы · Связи</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="ui-chip">{projectStatusLabels[project.status]}</span>
          <span className="ui-chip">Приоритет: {projectPriorityLabels[project.priority ?? 'medium']}</span>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Прогресс</p>
          <p className="text-sm font-medium text-(--text-primary)">{completionRate}%</p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-(--panel)">
          <div className="h-full rounded-full bg-(--accent)" style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="ui-panel-elevated p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Цель</p>
          <p className="mt-2 text-sm text-(--text-primary)">{project.goal || 'Цель не задана'}</p>
        </div>
        <div className="ui-panel-elevated p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Дедлайн</p>
          <p className="mt-2 text-sm text-(--text-primary)">{formatDeadline(project.deadline)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="ui-panel-elevated px-3 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Задачи</p>
          <p className="mt-2 text-lg font-semibold text-(--text-primary)">{counts.tasks}</p>
        </div>
        <div className="ui-panel-elevated px-3 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Заметки</p>
          <p className="mt-2 text-lg font-semibold text-(--text-primary)">{counts.notes}</p>
        </div>
        <div className="ui-panel-elevated px-3 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Идеи</p>
          <p className="mt-2 text-lg font-semibold text-(--text-primary)">{counts.ideas}</p>
        </div>
        <div className="ui-panel-elevated px-3 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Файлы</p>
          <p className="mt-2 text-lg font-semibold text-(--text-primary)">{counts.files}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/projects/${project.id}`} className="ui-button-accent px-4 py-3 text-sm">
          Открыть рабочую область
        </Link>
        <button
          type="button"
          onClick={() => onEdit(project)}
          className="ui-button px-4 py-3 text-sm"
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => onDelete(project)}
          className="ui-button-danger px-4 py-3 text-sm"
        >
          Удалить
        </button>
      </div>
    </article>
  )
}
