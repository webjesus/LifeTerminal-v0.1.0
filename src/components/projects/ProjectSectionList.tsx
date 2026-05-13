import { useState, type FormEvent } from 'react'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import { ActionMenu } from '../ui/ActionMenu'
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
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Разделы</p>
          <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Разделы проекта</h2>
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
        <span className="text-xs text-(--text-muted)">Общий поток</span>
      </button>

      <div className="mt-4 space-y-3">
        {sections.length > 0 ? sections.map((section) => (
          <div key={section.id} className="rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-(--text-primary)">{section.title}</p>
                <p className="mt-1 text-sm text-(--text-muted)">{section.description || 'Описание раздела пока не добавлено.'}</p>
                <p className="mt-3 text-xs text-(--text-muted)">Блоков: {blockCounts[section.id] ?? 0}</p>
              </div>
              <ActionMenu
                items={[
                  { label: 'Редактировать', onSelect: () => startEdit(section) },
                  { label: 'Удалить', onSelect: () => onDeleteSection(section), tone: 'danger' },
                ]}
                triggerClassName="rounded-full bg-(--panel)"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={`ui-button px-3 py-2 text-xs ${activeSectionId === section.id ? 'border-(--accent-border) text-(--accent)' : ''}`}
              >
                Открыть
              </button>
            </div>
          </div>
        )) : (
          <div className="rounded-3xl border border-dashed border-(--border-soft) bg-(--panel-elevated) p-5 text-sm text-(--text-muted)">
            <p className="font-medium text-(--text-primary)">Разделы пока не созданы.</p>
            <p className="mt-2">Разбейте проект на логические части: исследование, задачи, материалы, решения.</p>
          </div>
        )}
      </div>

      {(isCreating || editingSectionId) ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
          <div>
            <p className="text-sm font-medium text-(--text-primary)">{editingSectionId ? 'Редактирование раздела' : 'Новый раздел'}</p>
            <p className="mt-1 text-xs text-(--text-muted)">Разделы помогают разложить рабочую область по логическим потокам.</p>
          </div>

          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Название раздела"
            className="ui-input"
          />

          <textarea
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            rows={3}
            placeholder="Короткое описание раздела"
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
