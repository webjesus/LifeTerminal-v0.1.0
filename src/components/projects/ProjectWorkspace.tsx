import { useMemo, useState, type FormEvent } from 'react'
import type { Project, ProjectSection } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'
import { ProjectBlockModal, type ProjectBlockEditorValues } from './ProjectBlockModal'
import { workspaceItemKindBadges, workspaceItemKindLabels, type WorkspaceItemKind } from './projectMeta'

export type ProjectWorkspaceItemFormValues = {
  kind: WorkspaceItemKind
  title: string
  description: string
  content: string
  url: string
  sectionId: string | null
}

type ProjectWorkspaceProps = {
  project: Project
  sections: ProjectSection[]
  blocks: ProjectSection[]
  activeSectionId: string | null
  selectedBlockId?: string | null
  onSelectedBlockChange?: (blockId: string | null) => void
  selectedBlockRelatedItems: RelationSelectableItem[]
  availableRelationItems: RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
  onAddItem: (values: ProjectWorkspaceItemFormValues) => void
  onUpdateBlock: (block: ProjectSection, values: ProjectBlockEditorValues) => void
  onDeleteBlock: (block: ProjectSection) => void
}

const initialFormState: ProjectWorkspaceItemFormValues = {
  kind: 'task',
  title: '',
  description: '',
  content: '',
  url: '',
  sectionId: null,
}

function getBlockSurfaceLabel(kind: WorkspaceItemKind) {
  switch (kind) {
    case 'task':
      return 'Задача'
    case 'note':
      return 'Заметка'
    case 'idea':
      return 'Идея'
    case 'goal':
      return 'Цель'
    case 'file':
      return 'Файл'
    case 'photo':
      return 'Фото'
    case 'link':
      return 'Ссылка'
    case 'text':
      return 'Текст'
    case 'thought':
      return 'Мысль'
    default:
      return 'Блок'
  }
}

export function ProjectWorkspace({
  project,
  sections,
  blocks,
  activeSectionId,
  selectedBlockId: controlledSelectedBlockId,
  onSelectedBlockChange,
  selectedBlockRelatedItems,
  availableRelationItems,
  onOpenRelatedItem,
  onAddItem,
  onUpdateBlock,
  onDeleteBlock,
}: ProjectWorkspaceProps) {
  const [formState, setFormState] = useState<ProjectWorkspaceItemFormValues>(initialFormState)
  const [internalSelectedBlockId, setInternalSelectedBlockId] = useState<string | null>(null)

  const selectedBlockId = controlledSelectedBlockId ?? internalSelectedBlockId

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  )

  function openBlock(blockId: string) {
    if (controlledSelectedBlockId === undefined) {
      setInternalSelectedBlockId(blockId)
    }

    onSelectedBlockChange?.(blockId)
  }

  function closeBlock() {
    if (controlledSelectedBlockId === undefined) {
      setInternalSelectedBlockId(null)
    }

    onSelectedBlockChange?.(null)
  }

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((section) => [section.id, section])),
    [sections],
  )

  const visibleBlocks = useMemo(() => {
    if (activeSectionId) {
      return blocks.filter((block) => block.parentSectionId === activeSectionId)
    }

    return blocks
  }, [activeSectionId, blocks])

  const orderedBlocks = useMemo(
    () =>
      [...visibleBlocks].sort((a, b) => {
        const sectionA = a.parentSectionId ? sectionMap[a.parentSectionId]?.title ?? '' : ''
        const sectionB = b.parentSectionId ? sectionMap[b.parentSectionId]?.title ?? '' : ''

        if (sectionA !== sectionB) {
          return sectionA.localeCompare(sectionB, 'ru')
        }

        if (a.order !== b.order) {
          return a.order - b.order
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }),
    [sectionMap, visibleBlocks],
  )

  function resetForm() {
    setFormState({
      ...initialFormState,
      sectionId: activeSectionId,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formState.title.trim()

    if (!title) {
      return
    }

    onAddItem({
      ...formState,
      title,
      description: formState.description.trim(),
      content: formState.content.trim(),
      url: formState.url.trim(),
    })

    resetForm()
  }

  function renderBlock(block: ProjectSection) {
    const badge = workspaceItemKindBadges[block.kind as WorkspaceItemKind]
    const sectionTitle = block.parentSectionId ? sectionMap[block.parentSectionId]?.title ?? 'Подраздел' : 'Без подраздела'

    return (
      <article key={block.id} className="ui-panel ui-card-hover group overflow-hidden">
        <button
          type="button"
          onClick={() => openBlock(block.id)}
          className="w-full text-left"
        >
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.16em] ${badge.className}`}>
                {badge.shortLabel}
              </span>
              <span className="ui-chip text-[11px] uppercase tracking-[0.16em]">
                {sectionTitle}
              </span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{getBlockSurfaceLabel(block.kind as WorkspaceItemKind)}</p>
              <h4 className="mt-2 text-xl font-semibold text-(--text-primary)">{block.title}</h4>
            </div>

            {block.kind === 'photo' && block.url ? (
              <div className="overflow-hidden rounded-2xl border border-(--border)">
                <img src={block.url} alt={block.title} className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </div>
            ) : null}

            <p className="line-clamp-4 min-h-18 text-sm leading-6 text-(--text-secondary)">{block.description || block.content || 'Детали пока не заполнены.'}</p>

            {block.content && block.kind !== 'photo' ? (
              <p className="line-clamp-3 text-sm text-(--text-muted)">{block.content}</p>
            ) : null}

            {block.url ? (
              <p className="truncate text-sm text-(--accent)">{block.url}</p>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="ui-panel-elevated px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Связи</p>
                <p className="mt-2 text-lg font-semibold text-(--text-primary)">{block.relatedBlockIds.length}</p>
              </div>
              <div className="ui-panel-elevated px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Фокус</p>
                <p className="mt-2 text-sm font-medium text-(--text-primary)">{sectionTitle}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-(--border-soft) pt-3 text-sm">
              <span className="text-(--text-muted)">Открыть детали</span>
              <span className="font-medium text-(--accent)">Редактировать</span>
            </div>
          </div>
        </button>

        <div className="flex gap-2 border-t border-(--border-soft) bg-(--panel-elevated) px-5 py-4">
          <button
            type="button"
            onClick={() => openBlock(block.id)}
            className="ui-button px-4 py-2"
          >
            Детали
          </button>
          <button
            type="button"
            onClick={() => onDeleteBlock(block)}
            className="ui-button-danger px-4 py-2"
          >
            Удалить
          </button>
        </div>
      </article>
    )
  }

  return (
    <section className="space-y-6">
      <div className="ui-panel p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-primary)">{project.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-(--text-muted) md:text-base">{project.description || 'Описание проекта пока не заполнено.'}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-90">
            <div className="ui-panel-elevated p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Цель</p>
              <p className="mt-2 text-sm text-(--text-primary)">{project.goal || 'Цель не задана'}</p>
            </div>
            <div className="ui-panel-elevated p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Фокус</p>
              <p className="mt-2 text-sm text-(--text-primary)">{activeSectionId ? sections.find((section) => section.id === activeSectionId)?.title ?? 'Подраздел' : 'Весь проект'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="ui-panel-elevated p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Canvas</p>
                <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Рабочая поверхность проекта</h2>
                <p className="mt-2 text-sm text-(--text-muted)">
                  {activeSectionId
                    ? `Фильтр по подразделу: ${sectionMap[activeSectionId]?.title ?? 'Подраздел'}`
                    : 'Показаны все блоки проекта. Откройте карточку, чтобы посмотреть детали, отредактировать содержимое и настроить связи.'}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="ui-panel px-4 py-3 shadow-none">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Карточек</p>
                  <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{orderedBlocks.length}</p>
                </div>
                <div className="ui-panel px-4 py-3 shadow-none">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Связей</p>
                  <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{orderedBlocks.reduce((total, block) => total + block.relatedBlockIds.length, 0)}</p>
                </div>
                <div className="ui-panel px-4 py-3 shadow-none">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">Подразделы</p>
                  <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{sections.length}</p>
                </div>
              </div>
            </div>
          </div>

          {orderedBlocks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 3xl:grid-cols-3">
              {orderedBlocks.map(renderBlock)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-(--border) bg-(--panel) px-6 py-14 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-(--text-muted)">Workspace</p>
              <h3 className="mt-3 text-2xl font-semibold text-(--text-primary)">Рабочая поверхность пока пуста</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-(--text-muted) md:text-base">
                Добавьте первый блок справа. Каждый элемент сохранится в localStorage, откроется как отдельная карточка и сможет связываться с другими блоками проекта.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-(--border) bg-(--panel) p-5 shadow-[0_16px_50px_rgba(0,0,0,0.16)] 2xl:sticky 2xl:top-6 2xl:self-start">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Add Item</p>
          <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">Добавить карточку</h2>

          <div className="mt-5 space-y-4">
            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Тип блока</span>
              <select
                value={formState.kind}
                onChange={(event) => setFormState((current) => ({ ...current, kind: event.target.value as WorkspaceItemKind }))}
                className="ui-input"
              >
                {Object.entries(workspaceItemKindLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Подраздел</span>
              <select
                value={formState.sectionId ?? ''}
                onChange={(event) => setFormState((current) => ({ ...current, sectionId: event.target.value || null }))}
                className="ui-input"
              >
                <option value="">Без подраздела</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Название</span>
              <input
                value={formState.title}
                onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                placeholder="Название блока"
                className="ui-input"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Описание</span>
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Контекст, краткое описание, следующий шаг"
                className="ui-input min-h-28 resize-y"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">Содержимое / детали</span>
              <textarea
                value={formState.content}
                onChange={(event) => setFormState((current) => ({ ...current, content: event.target.value }))}
                rows={formState.kind === 'text' || formState.kind === 'thought' ? 6 : 4}
                placeholder="Текст заметки, ссылка на следующий шаг, содержимое блока"
                className="ui-input min-h-36 resize-y"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-(--text-secondary)">URL / путь</span>
              <input
                value={formState.url}
                onChange={(event) => setFormState((current) => ({ ...current, url: event.target.value }))}
                placeholder="Для файлов, фото и ссылок"
                className="ui-input"
              />
            </label>

            <div className="rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4 text-sm text-(--text-muted)">
              Связи между блоками настраиваются после создания: откройте карточку и выберите связанные элементы в детальном окне.
            </div>
          </div>

          <button
            type="submit"
            className="ui-button-accent mt-5 w-full px-4 py-3"
          >
            Добавить {workspaceItemKindLabels[formState.kind].toLowerCase()}
          </button>
        </form>
      </div>

      {selectedBlock ? (
        <ProjectBlockModal
          key={selectedBlock.id}
          block={selectedBlock}
          sections={sections}
          availableBlocks={blocks}
          relatedItems={selectedBlockRelatedItems}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={onOpenRelatedItem}
          onClose={closeBlock}
          onSave={(values) => {
            onUpdateBlock(selectedBlock, values)
            closeBlock()
          }}
          onDelete={(block) => {
            onDeleteBlock(block)
            closeBlock()
          }}
        />
      ) : null}
    </section>
  )
}