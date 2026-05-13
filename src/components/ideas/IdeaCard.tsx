import type { Idea, Note, Project, Task } from '../../types'
import { ActionMenu } from '../ui/ActionMenu'
import { StatusBadge } from './StatusBadge'

type IdeaCardProps = {
  idea: Idea
  linkedProject: Project | null
  linkedTasks: Task[]
  linkedNotes: Note[]
  onOpen: (idea: Idea) => void
  onEdit: (idea: Idea) => void
  onDelete: (idea: Idea) => void
  onConvertToTask: (idea: Idea) => void
  onConvertToNote: (idea: Idea) => void
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function IdeaCard({
  idea,
  linkedProject,
  onOpen,
  onEdit,
  onDelete,
  onConvertToTask,
  onConvertToNote,
}: IdeaCardProps) {
  const excerpt = idea.description.length > 160 ? `${idea.description.slice(0, 160)}...` : idea.description
  const secondaryChip = linkedProject?.title || null
  const showStatus = !secondaryChip && idea.status !== 'new'

  return (
    <article className="ui-panel ui-card-hover p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(idea)} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-(--text-primary)">{idea.title}</h3>
            {secondaryChip ? <span className="ui-chip">{secondaryChip}</span> : showStatus ? <StatusBadge status={idea.status} /> : null}
          </div>
          <p className="mt-2 line-clamp-1 text-sm leading-6 text-(--text-muted) md:line-clamp-2">{excerpt || 'Короткое описание идеи пока не добавлено.'}</p>
        </button>

        <ActionMenu
          items={[
            { label: 'Открыть', onSelect: () => onOpen(idea) },
            { label: 'Редактировать', onSelect: () => onEdit(idea) },
            { label: 'В заметку', onSelect: () => onConvertToNote(idea) },
            { label: 'Удалить', onSelect: () => onDelete(idea), tone: 'danger' },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onConvertToTask(idea)} className="rounded-2xl border border-(--reminder-border) bg-(--reminder-bg) px-3 py-2 text-sm font-medium text-(--reminder-text) transition-all duration-200 active:scale-[0.98]">В задачу</button>
          <button type="button" onClick={() => onOpen(idea)} className="ui-button px-3 py-2">Открыть</button>
        </div>
        <p className="text-xs text-(--text-muted)">Обновлена {formatDateTime(idea.updatedAt)}</p>
      </div>
    </article>
  )
}
