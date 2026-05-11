import { useMemo, useState, type FormEvent } from 'react'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import type { ProjectSection } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'
import { workspaceItemKindBadges, workspaceItemKindLabels, type WorkspaceItemKind } from './projectMeta'

export type ProjectBlockEditorValues = {
  title: string
  description: string
  content: string
  url: string
  sectionId: string | null
  relatedBlockIds: string[]
  relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
}

type ProjectBlockModalProps = {
  block: ProjectSection
  sections: ProjectSection[]
  availableBlocks: ProjectSection[]
  relatedItems: RelationSelectableItem[]
  availableRelationItems: RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
  onClose: () => void
  onSave: (values: ProjectBlockEditorValues) => void
  onDelete: (block: ProjectSection) => void
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ProjectBlockModal({ block, sections, availableBlocks, relatedItems, availableRelationItems, onOpenRelatedItem, onClose, onSave, onDelete }: ProjectBlockModalProps) {
  const [formState, setFormState] = useState<ProjectBlockEditorValues>({
    title: block.title,
    description: block.description,
    content: block.content,
    url: block.url ?? '',
    sectionId: block.parentSectionId,
    relatedBlockIds: block.relatedBlockIds,
    relatedItems: [],
  })
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelationSelectableItem[]>(relatedItems)

  const badge = workspaceItemKindBadges[block.kind as WorkspaceItemKind]
  const selectableBlocks = useMemo(
    () => availableBlocks.filter((item) => item.id !== block.id),
    [availableBlocks, block.id],
  )
  const canManageEntityRelations = Boolean(
    block.entityId && ['task', 'note', 'idea', 'goal', 'file', 'photo', 'link'].includes(block.kind),
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formState.title.trim()

    if (!title) {
      return
    }

    onSave({
      ...formState,
      title,
      description: formState.description.trim(),
      content: formState.content.trim(),
      url: formState.url.trim(),
      relatedItems: selectedRelatedItems,
    })
  }

  function toggleRelatedBlock(blockId: string) {
    setFormState((current) => ({
      ...current,
      relatedBlockIds: current.relatedBlockIds.includes(blockId)
        ? current.relatedBlockIds.filter((id) => id !== blockId)
        : [...current.relatedBlockIds, blockId],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-(--border) bg-(--panel) shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-(--border) px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.18em] ${badge.className}`}>
                {badge.shortLabel}
              </span>
              <span className="rounded-full border border-(--border) bg-(--panel-elevated) px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-(--text-muted)">
                {workspaceItemKindLabels[block.kind as WorkspaceItemKind]}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-(--text-primary)">{block.title}</h2>
            <p className="mt-2 text-sm text-(--text-muted)">
              Создан: {formatDateTime(block.createdAt)}
              {' · '}
              Обновлён: {formatDateTime(block.updatedAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--border) px-3 py-2 text-sm text-(--text-secondary) transition-colors duration-200 hover:text-(--text-primary)"
          >
            Закрыть
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid max-h-[calc(92vh-92px)] gap-0 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 px-6 py-6">
            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Название</span>
              <input
                value={formState.title}
                onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-(--text-primary) outline-none transition-colors duration-200 focus:border-(--accent)"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Описание</span>
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-(--text-primary) outline-none transition-colors duration-200 focus:border-(--accent)"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Содержимое / детали</span>
              <textarea
                value={formState.content}
                onChange={(event) => setFormState((current) => ({ ...current, content: event.target.value }))}
                rows={8}
                className="w-full rounded-xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-(--text-primary) outline-none transition-colors duration-200 focus:border-(--accent)"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">URL / путь</span>
              <input
                value={formState.url}
                onChange={(event) => setFormState((current) => ({ ...current, url: event.target.value }))}
                placeholder="Для file, photo и link"
                className="w-full rounded-xl border border-(--border) bg-(--panel-elevated) px-4 py-3 text-(--text-primary) outline-none transition-colors duration-200 focus:border-(--accent)"
              />
            </label>

            {(block.kind === 'photo' && formState.url) ? (
              <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--panel-elevated)">
                <img src={formState.url} alt={formState.title} className="h-72 w-full object-cover" />
              </div>
            ) : null}

            {(block.kind === 'link' || block.kind === 'file' || block.kind === 'photo') && formState.url ? (
              <a
                href={formState.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl border border-(--accent) bg-(--accent-soft) px-4 py-3 text-sm font-medium text-(--text-primary) transition-colors duration-200 hover:bg-orange-950/60"
              >
                Открыть ресурс
              </a>
            ) : null}
          </div>

          <div className="border-t border-(--border) bg-black/10 px-6 py-6 xl:border-l xl:border-t-0">
            <div className="space-y-5">
              <label className="space-y-2">
                <span className="text-sm text-(--text-secondary)">Подраздел проекта</span>
                <select
                  value={formState.sectionId ?? ''}
                  onChange={(event) => setFormState((current) => ({ ...current, sectionId: event.target.value || null }))}
                  className="w-full rounded-xl border border-(--border) bg-(--panel) px-4 py-3 text-(--text-primary) outline-none transition-colors duration-200 focus:border-(--accent)"
                >
                  <option value="">Без подраздела</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="text-sm text-(--text-secondary)">Связанные блоки</p>
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {selectableBlocks.length > 0 ? (
                    selectableBlocks.map((item) => {
                      const itemBadge = workspaceItemKindBadges[item.kind as WorkspaceItemKind]
                      const isSelected = formState.relatedBlockIds.includes(item.id)

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleRelatedBlock(item.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors duration-200 ${
                            isSelected
                              ? 'border-(--accent) bg-(--accent-soft) text-(--text-primary)'
                              : 'border-(--border) bg-(--panel) text-(--text-secondary) hover:text-(--text-primary)'
                          }`}
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium tracking-[0.14em] ${itemBadge.className}`}>
                                {itemBadge.shortLabel}
                              </span>
                              <span className="text-sm font-medium text-inherit">{item.title}</span>
                            </div>
                            <p className="mt-1 text-xs text-(--text-muted)">{item.description || 'Без описания'}</p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.16em]">{isSelected ? 'linked' : 'add'}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-(--border) px-4 py-6 text-sm text-(--text-muted)">
                      Других блоков пока нет.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-(--border) bg-(--panel) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Текущая связь</p>
                <p className="mt-2 text-sm text-(--text-primary)">{formState.relatedBlockIds.length > 0 ? `${formState.relatedBlockIds.length} связанных блоков` : 'Связи ещё не настроены'}</p>
              </div>

              {canManageEntityRelations ? (
                <LinkedItemsPanel
                  selectedItems={selectedRelatedItems}
                  availableItems={availableRelationItems}
                  onChange={(items) => setSelectedRelatedItems(availableRelationItems.filter((item) => items.some((entry) => entry.id === item.id && entry.type === item.type)))}
                  onOpenItem={onOpenRelatedItem}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-(--border) bg-(--panel) p-4 text-sm text-(--text-muted)">
                  Для этого типа блока доступны только внутренние связи рабочей поверхности.
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl border border-(--accent) bg-(--accent-soft) px-4 py-3 text-sm font-medium text-(--text-primary) transition-colors duration-200 hover:bg-orange-950/60"
                >
                  Сохранить блок
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(block)}
                  className="rounded-xl border border-red-900/60 px-4 py-3 text-sm font-medium text-red-200 transition-colors duration-200 hover:bg-red-950/40"
                >
                  Удалить блок
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
