import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import { ActionMenu } from '../ui/ActionMenu'
import { projectStatusLabels } from './projectMeta'

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

export function ProjectCard({ project, completionRate, onEdit, onDelete }: ProjectCardProps) {
  return (
    <article className="ui-panel ui-card-hover group p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 text-xs text-(--text-secondary)">
            <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1">{projectStatusLabels[project.status]}</span>
            {project.deadline ? <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1">{formatDeadline(project.deadline)}</span> : null}
          </div>
          <Link to={`/projects/${project.id}`} className="mt-3 block truncate text-lg font-semibold text-(--text-primary) transition-colors duration-200 hover:text-(--accent)">
            {project.title}
          </Link>
          <p className="mt-2 line-clamp-1 text-sm text-(--text-muted) md:line-clamp-2">{project.description || 'Описание проекта пока не заполнено.'}</p>
        </div>
        <ActionMenu
          items={[
            { label: 'Редактировать', onSelect: () => onEdit(project) },
            { label: 'Удалить', onSelect: () => onDelete(project), tone: 'danger' },
          ]}
          triggerClassName="h-10 w-10"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-(--border-soft) bg-(--panel-elevated) p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Прогресс</p>
          <p className="text-sm font-medium text-(--text-primary)">{completionRate}%</p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-(--panel)">
          <div className="h-full rounded-full bg-(--accent)" style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link to={`/projects/${project.id}`} className="ui-button-accent px-4 py-2.5 text-sm">
          Открыть
        </Link>
      </div>
    </article>
  )
}
