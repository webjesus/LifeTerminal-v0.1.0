import { RelationEditor } from '../relations/RelationEditor'
import type { RelationSelectableItem } from '../../utils/relations'

type LinkedItemsPanelProps = {
  selectedItems: RelationSelectableItem[]
  availableItems: RelationSelectableItem[]
  onChange: (items: Array<Pick<RelationSelectableItem, 'id' | 'type'>>) => void
  onOpenItem: (item: RelationSelectableItem) => void
  isReadonly?: boolean
}

export function LinkedItemsPanel({ selectedItems, availableItems, onChange, onOpenItem, isReadonly }: LinkedItemsPanelProps) {
  return (
    <RelationEditor
      selectedItems={selectedItems}
      availableItems={availableItems}
      onChange={onChange}
      onOpenItem={onOpenItem}
      isReadonly={isReadonly}
    />
  )
}

