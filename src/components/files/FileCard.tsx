import type { FileItem, Relation } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'
import { FilePreview } from './FilePreview'
import { fileTypeBadges, fileTypeLabels } from './fileMeta'
import { LinkedItemsChips } from '../linked/LinkedItemsChips'

type FileCardProps = {
  file: FileItem
  relations: Relation[]
  catalog: RelationSelectableItem[]
  onOpenPath: (path: string) => void
  onChangeLinks: (items: Array<Pick<RelationSelectableItem, 'id' | 'type'>>) => void
  onOpen: (file: FileItem) => void
  onEdit: (file: FileItem) => void
  onDelete: (file: FileItem) => void
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function FileCard({ file, relations, catalog, onOpenPath, onChangeLinks, onOpen, onEdit, onDelete }: FileCardProps) {
  return (
    <article className="ui-panel ui-card-hover overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(file)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpen(file)
          }
        }}
        className="block w-full cursor-pointer select-none text-left p-5 outline-none"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-(--warning-border) bg-(--warning-bg) px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-(--warning-text)">
            {fileTypeBadges[file.type]}
          </span>
          <span className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{fileTypeLabels[file.type]}</span>
        </div>

        <h3 className="mt-3 text-xl font-semibold text-(--text-primary)">{file.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-(--text-muted)">{file.description || file.photoNote || 'Описание не добавлено.'}</p>

        <div className="mt-4">
          <FilePreview file={file} compact />
        </div>

        {file.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {file.tags.map((tag) => (
              <span key={tag} className="ui-chip">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
          <LinkedItemsChips
            itemId={file.id}
            itemType="file"
            relations={relations}
            catalog={catalog}
            onOpenPath={onOpenPath}
            onChangeLinks={onChangeLinks}
          />
        </div>
      </div>

      <div className="grid gap-3 border-t border-(--border-soft) bg-(--panel-elevated) px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="text-sm text-(--text-muted)">
          <p>Путь: {file.path || 'не указан'}</p>
          <p className="mt-1">Обновлено: {formatDateTime(file.updatedAt)}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(file)
            }}
            className="ui-button px-4 py-2"
          >
            Редактировать
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(file)
            }}
            className="ui-button-danger px-4 py-2"
          >
            Удалить
          </button>
        </div>
      </div>
    </article>
  )
}
