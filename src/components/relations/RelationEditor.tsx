import { useMemo, useState } from 'react'
import type { RelationSelectableItem } from '../../utils/relations'
import { relationTypeLabels } from '../../utils/relations'

type RelationEditorProps = {
  selectedItems: RelationSelectableItem[]
  availableItems: RelationSelectableItem[]
  onChange: (items: Array<Pick<RelationSelectableItem, 'id' | 'type'>>) => void
  onOpenItem: (item: RelationSelectableItem) => void
  isReadonly?: boolean
}

function createItemKey(item: Pick<RelationSelectableItem, 'id' | 'type'>) {
  return `${item.type}:${item.id}`
}

function uniqueItems(items: RelationSelectableItem[]) {
  return Array.from(new Map(items.map((item) => [createItemKey(item), item])).values())
}

export function RelationEditor({ selectedItems, availableItems, onChange, onOpenItem, isReadonly = false }: RelationEditorProps) {
  const [candidateKey, setCandidateKey] = useState('')

  const dedupedSelectedItems = useMemo(() => uniqueItems(selectedItems), [selectedItems])
  const dedupedAvailableItems = useMemo(() => uniqueItems(availableItems), [availableItems])

  const selectedKeys = useMemo(() => new Set(dedupedSelectedItems.map((item) => createItemKey(item))), [dedupedSelectedItems])
  const addableItems = useMemo(
    () => dedupedAvailableItems.filter((item) => !selectedKeys.has(createItemKey(item))),
    [dedupedAvailableItems, selectedKeys],
  )

  function handleAddCandidate() {
    if (!candidateKey) {
      return
    }

    const item = addableItems.find((entry) => createItemKey(entry) === candidateKey)

    if (!item) {
      return
    }

    onChange([...dedupedSelectedItems, { id: item.id, type: item.type }])
    setCandidateKey('')
  }

  function handleRemove(item: RelationSelectableItem) {
    onChange(dedupedSelectedItems.filter((entry) => createItemKey(entry) !== createItemKey(item)))
  }

  return (
    <div className="max-w-full space-y-4 overflow-hidden rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-(--text-primary)">Связанные элементы</p>
          <p className="mt-1 text-xs text-(--text-muted)">Просмотр, добавление, удаление и открытие связанных объектов.</p>
        </div>
        <span className="ui-chip shrink-0">{dedupedSelectedItems.length}</span>
      </div>

      {dedupedSelectedItems.length > 0 ? (
        <div className="space-y-2">
          {dedupedSelectedItems.map((item) => (
            <div key={createItemKey(item)} className="flex max-w-full flex-col gap-3 rounded-2xl border border-(--border-soft) bg-(--panel) px-3.5 py-3 shadow-[0_4px_12px_rgba(11,16,32,0.04)] sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ui-chip text-[11px] uppercase tracking-[0.14em]">
                    {relationTypeLabels[item.type]}
                  </span>
                  <span className="min-w-0 break-words text-sm font-medium text-(--text-primary)">{item.title}</span>
                </div>
                <p className="mt-1 break-words text-xs text-(--text-muted)">{item.description || 'Без описания'}</p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="ui-button w-full px-3 py-2 text-xs sm:w-auto"
                >
                  Открыть
                </button>
                {!isReadonly ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="ui-button-danger w-full px-3 py-2 text-xs sm:w-auto"
                  >
                    Удалить связь
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-(--text-muted)">Связей пока нет.</p>
      )}

      {!isReadonly ? (
        <div className="rounded-3xl border border-(--border-soft) bg-(--panel) p-4">
          <p className="text-sm text-(--text-secondary)">Добавить связь</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              value={candidateKey}
              onChange={(event) => setCandidateKey(event.target.value)}
              className="ui-input min-w-0 flex-1"
            >
              <option value="">Выберите объект для связи</option>
              {addableItems.map((item) => (
                <option key={createItemKey(item)} value={createItemKey(item)}>
                  {relationTypeLabels[item.type]}: {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddCandidate}
              className="ui-button-accent w-full shrink-0 px-4 py-3 sm:w-auto"
            >
              Добавить связь
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}