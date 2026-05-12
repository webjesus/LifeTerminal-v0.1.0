import type { Note, Relation } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'
import { LinkedItemsChips } from '../linked/LinkedItemsChips'

type NoteCardProps = {
  note: Note
  relations: Relation[]
  catalog: RelationSelectableItem[]
  onOpenPath: (path: string) => void
  onChangeLinks: (items: Array<Pick<RelationSelectableItem, 'id' | 'type'>>) => void
  onOpen: (note: Note) => void
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function NoteCard({
  note,
  relations,
  catalog,
  onOpenPath,
  onChangeLinks,
  onOpen,
  onEdit,
  onDelete,
}: NoteCardProps) {
  const previewText = note.summary || note.content
  const excerpt = previewText.length > 180 ? `${previewText.slice(0, 180)}...` : previewText

  const typeLabels: Record<Note['type'], string> = {
    basic: 'Обычная',
    research: 'Исследование',
    instruction: 'Инструкция',
    project_material: 'Материал проекта',
    personal_thought: 'Личная мысль',
    solution: 'Решение',
    list: 'Список',
    reference: 'Справка',
  }

  const statusLabels: Record<Note['status'], string> = {
    draft: 'Черновик',
    active: 'В работе',
    completed: 'Готово',
    archived: 'Архив',
  }

  return (
    <article className="ui-panel ui-card-hover p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-(--text-primary)">{note.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="ui-chip">{typeLabels[note.type]}</span>
            <span className="ui-chip">{statusLabels[note.status]}</span>
            {note.category ? <span className="ui-chip">{note.category}</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-(--text-muted)">{excerpt || 'Текст заметки пока не добавлен.'}</p>
        </div>

        <div className="ui-chip rounded-2xl border-(--border-soft) bg-(--panel-elevated) px-3 py-2 text-xs text-(--text-muted)">
          Обновлена {formatDateTime(note.updatedAt)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {note.tags.length > 0 ? (
          note.tags.map((tag) => (
            <span key={tag} className="ui-chip border-[#f2dcc4] bg-[#fff4e8] text-[#b26a26]">
              #{tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-(--text-muted)">Теги не добавлены.</span>
        )}
      </div>

      <div className="mt-5 rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
        <LinkedItemsChips
          itemId={note.id}
          itemType="note"
          relations={relations}
          catalog={catalog}
          onOpenPath={onOpenPath}
          onChangeLinks={onChangeLinks}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-(--text-muted)">Создана {formatDateTime(note.createdAt)}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onOpen(note)}
            className="ui-button px-3 py-2"
          >
            Открыть
          </button>
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="ui-button px-3 py-2"
          >
            Редактировать
          </button>
          <button
            type="button"
            onClick={() => onDelete(note)}
            className="ui-button-danger px-3 py-2"
          >
            Удалить
          </button>
        </div>
      </div>
    </article>
  )
}
