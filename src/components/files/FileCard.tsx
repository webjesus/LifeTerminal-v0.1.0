import type { FileItem, Relation } from '../../types'
import { ActionMenu } from '../ui/ActionMenu'
import type { RelationSelectableItem } from '../../utils/relations'
import { FilePreview } from './FilePreview'
import { fileTypeBadges, fileTypeLabels } from './fileMeta'

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

export function FileCard({ file, onOpen, onEdit, onDelete }: FileCardProps) {
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
        className="block w-full cursor-pointer select-none text-left p-4 outline-none md:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-(--warning-border) bg-(--warning-bg) px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-(--warning-text)">
            {fileTypeBadges[file.type]}
          </span>
              <span className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{fileTypeLabels[file.type]}</span>
              {file.tags[0] ? <span className="ui-chip">#{file.tags[0]}</span> : null}
            </div>

            <h3 className="mt-3 text-lg font-semibold text-(--text-primary)">{file.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-(--text-muted)">{file.description || file.photoNote || 'Описание не добавлено.'}</p>
          </div>

          <ActionMenu
            items={[
              { label: 'Открыть', onSelect: () => onOpen(file) },
              { label: 'Редактировать', onSelect: () => onEdit(file) },
              { label: 'Удалить', onSelect: () => onDelete(file), tone: 'danger' },
            ]}
          />
        </div>

        <div className="mt-4">
          <FilePreview file={file} compact />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-(--border-soft) bg-(--panel-elevated) px-4 py-3 md:px-5">
        <p className="text-xs text-(--text-muted)">Обновлено {formatDateTime(file.updatedAt)}</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onOpen(file)
          }}
          className="ui-button px-3 py-2"
        >
          Открыть
        </button>
      </div>
    </article>
  )
}
