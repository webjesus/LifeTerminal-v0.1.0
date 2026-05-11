import { useState, type FormEvent } from 'react'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import type { ProjectSection } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'

type SectionDraft = {
  title: string
  description: string
  relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
}

type ProjectSectionListProps = {
  sections: ProjectSection[]
  activeSectionId: string | null
  blockCounts: Record<string, number>
  onSelectSection: (sectionId: string | null) => void
  onCreateSection: (values: SectionDraft) => void
  onUpdateSection: (section: ProjectSection, values: SectionDraft) => void
  onDeleteSection: (section: ProjectSection) => void
  availableRelationItems: RelationSelectableItem[]
  getRelatedItems: (sectionId: string | null) => RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
}

const emptyDraft: SectionDraft = {
  title: '',
  description: '',
  relatedItems: [],
}

export function ProjectSectionList({
  sections,
  activeSectionId,
  blockCounts,
  onSelectSection,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  availableRelationItems,
  getRelatedItems,
  onOpenRelatedItem,
}: ProjectSectionListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SectionDraft>(emptyDraft)
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelationSelectableItem[]>([])

  const selectableRelationItems = availableRelationItems.filter(
    (item) => !(item.type === 'section' && item.id === editingSectionId),
  )

  function resetForm() {
    setDraft(emptyDraft)
    setSelectedRelatedItems([])
    setIsCreating(false)
    setEditingSectionId(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = draft.title.trim()

    if (!title) {
      return
    }

    if (editingSectionId) {
      const section = sections.find((item) => item.id === editingSectionId)

      if (!section) {
        return
      }

      onUpdateSection(section, {
        title,
        description: draft.description.trim(),
        relatedItems: selectedRelatedItems,
      })
      resetForm()
      return
    }

    onCreateSection({
      title,
      description: draft.description.trim(),
      relatedItems: selectedRelatedItems,
    })
    resetForm()
  }

  function startEdit(section: ProjectSection) {
    setEditingSectionId(section.id)
    setIsCreating(false)
    setDraft({
      title: section.title,
      description: section.description,
      relatedItems: [],
    })
    setSelectedRelatedItems(getRelatedItems(section.id))
  }

  return (
    <aside className="ui-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Sections</p>
          <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Подразделы проекта</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating((value) => !value)
            setEditingSectionId(null)
            setDraft(emptyDraft)
            setSelectedRelatedItems([])
          }}
          className="ui-button-accent px-3 py-2 text-xs"
        >
          Добавить
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelectSection(null)}
        className={`mt-5 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors duration-200 ${
          activeSectionId === null
            ? 'border-(--accent) bg-(--accent-soft) text-(--text-primary)'
            : 'border-(--border-soft) bg-(--panel-elevated) text-(--text-secondary) hover:text-(--text-primary)'
        }`}
      >
        <span>Все блоки</span>
        <span className="text-xs uppercase tracking-[0.16em]">ALL</span>
      </button>

      <div className="mt-4 space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
            <button
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={`w-full rounded-xl px-3 py-3 text-left transition-colors duration-200 ${
                activeSectionId === section.id ? 'bg-(--accent-soft) text-(--text-primary)' : 'text-(--text-secondary) hover:bg-black/10 hover:text-(--text-primary)'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-inherit">{section.title}</p>
                  <p className="mt-1 text-sm text-(--text-muted)">{section.description || 'Без описания'}</p>
                </div>
                <span className="ui-chip text-xs">{blockCounts[section.id] ?? 0}</span>
              </div>
            </button>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(section)}
                className="ui-button px-3 py-2 text-xs"
              >
                Изменить
              </button>
              <button
                type="button"
                onClick={() => onDeleteSection(section)}
                className="ui-button-danger px-3 py-2 text-xs"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {(isCreating || editingSectionId) ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
          <div>
            <p className="text-sm font-medium text-(--text-primary)">{editingSectionId ? 'Редактирование подраздела' : 'Новый подраздел'}</p>
            <p className="mt-1 text-xs text-(--text-muted)">Подразделы управляют структурой рабочей поверхности проекта.</p>
          </div>

          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Название подраздела"
            className="ui-input"
          />

          <textarea
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            rows={3}
            placeholder="Короткое описание подраздела"
            className="ui-input min-h-28 resize-y"
          />

          <LinkedItemsPanel
            selectedItems={selectedRelatedItems}
            availableItems={selectableRelationItems}
            onChange={(items) =>
              setSelectedRelatedItems(
                selectableRelationItems.filter((item) => items.some((entry) => entry.id === item.id && entry.type === item.type)),
              )
            }
            onOpenItem={onOpenRelatedItem}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="ui-button px-4 py-3"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="ui-button-accent px-4 py-3"
            >
              {editingSectionId ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      ) : null}
    </aside>
  )
}
