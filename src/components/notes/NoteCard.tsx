import type { Note, Relation } from '../../types'
import { ActionMenu } from '../ui/ActionMenu'
import type { RelationSelectableItem } from '../../utils/relations'

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
  onOpen,
  onEdit,
  onDelete,
}: NoteCardProps) {
  const previewText = note.summary || note.content
  const excerpt = previewText.length > 180 ? `${previewText.slice(0, 180)}...` : previewText

  return (
    <article className="ui-panel ui-card-hover p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpen(note)} className="min-w-0 flex-1 text-left">
          <h3 className="text-lg font-semibold text-(--text-primary)">{note.title}</h3>
          <p className="mt-2 line-clamp-1 text-sm leading-6 text-(--text-muted) md:line-clamp-2">{excerpt || 'Текст заметки пока не добавлен.'}</p>
        </button>

        <ActionMenu
          items={[
            { label: 'Открыть', onSelect: () => onOpen(note) },
            { label: 'Редактировать', onSelect: () => onEdit(note) },
            { label: 'Удалить', onSelect: () => onDelete(note), tone: 'danger' },
          ]}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {note.tags[0] ? <span className="ui-chip border-[#f2dcc4] bg-[#fff4e8] text-[#b26a26]">#{note.tags[0]}</span> : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-(--text-muted)">Обновлена {formatDateTime(note.updatedAt)}</p>
        <button type="button" onClick={() => onOpen(note)} className="ui-button px-3 py-2">Открыть</button>
      </div>
    </article>
  )
}
