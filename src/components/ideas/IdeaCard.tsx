import { Link } from 'react-router-dom'
import type { Idea, Note, Project, Task } from '../../types'
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

function LinkChip({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-full border border-(--border) bg-(--panel-elevated) px-3 py-1.5 text-xs text-(--text-secondary) transition-colors duration-200 hover:border-(--accent) hover:text-(--text-primary)"
    >
      {label}
    </Link>
  )
}

export function IdeaCard({
  idea,
  linkedProject,
  linkedTasks,
  linkedNotes,
  onOpen,
  onEdit,
  onDelete,
  onConvertToTask,
  onConvertToNote,
}: IdeaCardProps) {
  const excerpt = idea.description.length > 160 ? `${idea.description.slice(0, 160)}...` : idea.description

  return (
    <article className="ui-panel ui-card-hover p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-(--text-primary)">{idea.title}</h3>
            {linkedProject ? <span className="ui-chip">{linkedProject.title}</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-(--text-muted)">{excerpt || 'Описание идеи пока не добавлено.'}</p>
        </div>
        <StatusBadge status={idea.status} />
      </div>

      <div className="mt-4 space-y-3 rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--text-muted)">Проблема / Следующий шаг</p>
          <p className="text-sm text-(--text-secondary)">{idea.problem || idea.nextStep || 'Не заполнено'}</p>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--text-muted)">Проект</p>
          {linkedProject ? <LinkChip to="/projects" label={linkedProject.title} /> : <p className="text-sm text-(--text-muted)">Не привязана</p>}
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--text-muted)">Задачи</p>
          <div className="flex flex-wrap gap-2">
            {linkedTasks.length > 0 ? linkedTasks.map((task) => <LinkChip key={task.id} to="/tasks" label={task.title} />) : <p className="text-sm text-(--text-muted)">Нет связанных задач</p>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--text-muted)">Заметки</p>
          <div className="flex flex-wrap gap-2">
            {linkedNotes.length > 0 ? linkedNotes.map((note) => <LinkChip key={note.id} to="/notes" label={note.title} />) : <p className="text-sm text-(--text-muted)">Нет связанных заметок</p>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-(--text-muted)">Теги</p>
          <div className="flex flex-wrap gap-2">
            {idea.tags.length > 0
              ? idea.tags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>)
              : <p className="text-sm text-(--text-muted)">Нет тегов</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-(--text-muted)">
        <p>Создана {formatDateTime(idea.createdAt)}</p>
        <p>Обновлена {formatDateTime(idea.updatedAt)}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => onOpen(idea)} className="ui-button px-3 py-2">Открыть</button>
        <button type="button" onClick={() => onEdit(idea)} className="ui-button px-3 py-2">Редактировать</button>
        <button type="button" onClick={() => onConvertToTask(idea)} className="rounded-2xl border border-(--reminder-border) bg-(--reminder-bg) px-3 py-2 text-sm font-medium text-(--reminder-text) transition-all duration-200 active:scale-[0.98]">В задачу</button>
        <button type="button" onClick={() => onConvertToNote(idea)} className="rounded-2xl border border-[#e0d8ff] bg-[#f6f2ff] px-3 py-2 text-sm font-medium text-[#6a4fd4] transition-all duration-200 active:scale-[0.98]">В заметку</button>
        <button type="button" onClick={() => onDelete(idea)} className="ui-button-danger px-3 py-2">Удалить</button>
      </div>
    </article>
  )
}
