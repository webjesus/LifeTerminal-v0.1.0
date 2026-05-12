import type { Project } from '../../types'
import { cn } from '../../utils/cn'
import { projectPriorityLabels, projectStatusLabels } from './projectMeta'

interface ProjectHeaderProps {
  project: Project
  progress: number
  onBack?: () => void
  onEdit?: () => void
  onAddElement?: () => void
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Без дедлайна'
  }

  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value))
}

export function ProjectHeader({ project, progress, onBack, onEdit, onAddElement }: ProjectHeaderProps) {
  return (
    <header className={cn('ui-panel flex w-full flex-col gap-5 p-4 md:gap-6 md:p-6')}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
            <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-3 py-1 font-medium text-(--text-secondary)">
              {projectStatusLabels[project.status]}
            </span>
            <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-3 py-1 font-medium text-(--text-secondary)">
              Приоритет: {projectPriorityLabels[project.priority ?? 'medium']}
            </span>
            <span className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-3 py-1 font-medium text-(--text-secondary)">
              Дедлайн: {formatDate(project.deadline)}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-semibold text-(--text-primary) md:text-3xl">{project.title}</h1>
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-(--text-secondary)">
            {project.description || 'Краткое описание проекта пока не заполнено.'}
          </p>

          <div className="mt-4 rounded-2xl border border-(--border-soft) bg-(--panel-elevated) p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Прогресс проекта</p>
                <p className="mt-1 text-lg font-semibold text-(--text-primary)">{progress}%</p>
              </div>
              <p className="text-sm text-(--text-secondary)">{project.goal || 'Главная цель пока не указана'}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-(--panel)">
              <div className="h-full rounded-full bg-(--accent) transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {project.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-(--border-soft) bg-(--panel-elevated) px-2.5 py-1 text-xs text-(--text-muted)">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 md:max-w-xs md:justify-end">
          {onBack ? <button type="button" className="ui-button px-4 py-3 text-sm" onClick={onBack}>Назад</button> : null}
          {onEdit ? <button type="button" className="ui-button px-4 py-3 text-sm" onClick={onEdit}>Настройки</button> : null}
          {onAddElement ? <button type="button" className="ui-button-accent px-4 py-3 text-sm" onClick={onAddElement}>Добавить элемент</button> : null}
        </div>
      </div>
    </header>
  )
}
