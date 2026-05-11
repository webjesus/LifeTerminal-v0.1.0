import { useMemo, useState } from 'react'
import type { Relation } from '../../types'
import { type LinkableRelationType, getLinkedItemsFromRelations, getLinkedItemPath, isEditableRelation, relationTypeLabels } from '../../utils/relations'
import type { RelationSelectableItem } from '../../utils/relations'
import { Modal } from '../Modal'
import { LinkedItemsPanel } from './LinkedItemsPanel'

type LinkedItemsChipsProps = {
  itemId: string
  itemType: LinkableRelationType
  relations: Relation[]
  catalog: RelationSelectableItem[]
  onOpenPath: (path: string) => void
  onChangeLinks: (items: Array<Pick<RelationSelectableItem, 'id' | 'type'>>) => void
  title?: string
  readonly?: boolean
  maxVisible?: number
}

function chipLabel(item: Pick<RelationSelectableItem, 'type'>) {
  return relationTypeLabels[item.type] ?? item.type
}

export function LinkedItemsChips({
  itemId,
  itemType,
  relations,
  catalog,
  onOpenPath,
  onChangeLinks,
  title = 'Связанные элементы',
  readonly,
  maxVisible = 8,
}: LinkedItemsChipsProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const selectedItems = useMemo(
    () => getLinkedItemsFromRelations(itemId, relations.filter(isEditableRelation), catalog),
    [catalog, itemId, relations],
  )

  const availableItems = useMemo(
    () => catalog.filter((item) => !(item.type === itemType && item.id === itemId)),
    [catalog, itemId, itemType],
  )

  const visibleItems = useMemo(() => selectedItems.slice(0, maxVisible), [maxVisible, selectedItems])
  const hiddenCount = Math.max(0, selectedItems.length - visibleItems.length)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{title}</p>
        <div className="flex items-center gap-2">
          <span className="ui-chip text-[11px]">
            {selectedItems.length}
          </span>
          {!readonly ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setIsEditorOpen(true)
              }}
              className="ui-button-accent px-3 py-2 text-xs"
            >
              + связь
            </button>
          ) : null}
        </div>
      </div>

      {selectedItems.length === 0 ? (
        <p className="text-sm text-(--text-muted)">Связей пока нет.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleItems.map((item) => (
            <button
              key={item.relationId}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onOpenPath(getLinkedItemPath(item))
              }}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-(--border-soft) bg-white px-3 py-1.5 text-xs text-(--text-secondary) shadow-[0_2px_8px_rgba(11,16,32,0.04)] transition-all duration-200 hover:border-(--accent-border) hover:text-(--text-primary)"
            >
              <span className="text-(--text-muted)">{chipLabel(item)}</span>
              <span className="max-w-[18rem] truncate">{item.title}</span>
            </button>
          ))}
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setIsEditorOpen(true)
              }}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-(--border-soft) bg-white px-3 py-1.5 text-xs text-(--text-muted) transition-all duration-200 hover:border-(--accent-border) hover:text-(--text-primary)"
            >
              +{hiddenCount} ещё
            </button>
          ) : null}
        </div>
      )}

      <Modal
        title={title}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-(--text-muted)">Выберите объект и нажмите “Добавить связь”.</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setIsEditorOpen(false)
              }}
              className="ui-button px-3 py-2 text-xs"
            >
              Готово
            </button>
          </div>
        }
      >
        <LinkedItemsPanel
          selectedItems={selectedItems}
          availableItems={availableItems}
          onChange={onChangeLinks}
          onOpenItem={(item) => onOpenPath(getLinkedItemPath(item))}
        />
      </Modal>
    </div>
  )
}

