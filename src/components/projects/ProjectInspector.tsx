import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TagInput } from '../tags/TagInput'
import type { FileItem, Idea, Note, Project, ProjectAttachment, ProjectSection, ProjectWorkspaceBlock, ProjectWorkspaceRelation, Task } from '../../types'
import { cn } from '../../utils/cn'
import { getLinkedItemPath } from '../../utils/relations'
import { projectWorkspaceRelationLabels } from './projectMeta'

type ProjectInspectorProps = {
  project: Project
  selectedBlock: ProjectWorkspaceBlock | null
  onCreateBlock: (type: ProjectWorkspaceBlock['type']) => void
  onOpenAddElement?: () => void
  onUpdateBlock: (blockId: string, updates: Partial<ProjectWorkspaceBlock>) => void
  onDeleteBlock: (blockId: string) => void
  onClose: () => void
  sections: ProjectSection[]
  relatedTasks: Task[]
  relatedNotes: Note[]
  relatedIdeas: Idea[]
  relatedFiles: FileItem[]
  linkedEntity: {
    id: string
    type: 'task' | 'note' | 'idea' | 'goal' | 'file'
    title: string
    exists: boolean
    canOpen: boolean
  } | null
  selectedAttachment: ProjectAttachment | null
  blockRelations: {
    outgoing: Array<{
      relationId: string
      type: ProjectWorkspaceRelation['type']
      label?: string
      relatedBlockId: string
      relatedBlockTitle: string
    }>
    incoming: Array<{
      relationId: string
      type: ProjectWorkspaceRelation['type']
      label?: string
      relatedBlockId: string
      relatedBlockTitle: string
    }>
  }
  onDeleteRelation: (relationId: string) => void
  onCreateRelation: (fromBlockId: string) => void
  onOpenRelatedBlock: (blockId: string) => void
  onEditAttachment: (attachmentId: string) => void
  onDeleteAttachment: (attachmentId: string) => void
  onOpenAttachment: (attachmentId: string) => void
  workspaceBlockCount?: number
  activeToolLabel?: string
  selectedSectionFilter?: string
  zoomPercent?: number
  onArrangeBlocks?: () => void
  onResetView?: () => void
  onOpenProjectSettings?: () => void
  onSelectSectionFilter?: (sectionId: string) => void
  className?: string
  contentClassName?: string
}

const LINK_TYPE_LABELS: Record<NonNullable<ProjectWorkspaceBlock['linkedItemType']>, string> = {
  task: 'Задача',
  note: 'Заметка',
  idea: 'Идея',
  goal: 'Цель',
  file: 'Файл',
}

const BLOCK_TYPE_LABELS: Record<ProjectWorkspaceBlock['type'], string> = {
  text: 'Текстовый блок',
  task: 'Задача',
  note: 'Заметка',
  idea: 'Идея',
  goal: 'Цель',
  file: 'Файл',
  image: 'Фото',
  link: 'Ссылка',
  comment: 'Комментарий',
  drawing: 'Схема / рисунок',
}

export function ProjectInspector({
  project,
  selectedBlock,
  onCreateBlock,
  onOpenAddElement,
  onUpdateBlock,
  onDeleteBlock,
  onClose,
  sections,
  relatedTasks,
  relatedNotes,
  relatedIdeas,
  relatedFiles,
  linkedEntity,
  selectedAttachment,
  blockRelations,
  onDeleteRelation,
  onCreateRelation,
  onOpenRelatedBlock,
  onEditAttachment,
  onDeleteAttachment,
  onOpenAttachment,
  workspaceBlockCount = 0,
  activeToolLabel = 'Выбор',
  selectedSectionFilter = 'all',
  zoomPercent = 100,
  onArrangeBlocks,
  onResetView,
  onOpenProjectSettings,
  onSelectSectionFilter,
  className,
  contentClassName,
}: ProjectInspectorProps) {
  const navigate = useNavigate()
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftSectionId, setDraftSectionId] = useState('')
  const [draftTags, setDraftTags] = useState<string[]>([])
  const [draftExternalUrl, setDraftExternalUrl] = useState('')
  const [draftWidth, setDraftWidth] = useState('')
  const [draftHeight, setDraftHeight] = useState('')

  useEffect(() => {
    if (!selectedBlock) {
      setDraftTitle('')
      setDraftContent('')
      setDraftSectionId('')
      setDraftTags([])
      setDraftExternalUrl('')
      setDraftWidth('')
      setDraftHeight('')
      return
    }

    setDraftTitle(selectedBlock.title)
    setDraftContent(selectedBlock.content ?? selectedBlock.description ?? '')
    setDraftSectionId(selectedBlock.sectionId ?? '')
    setDraftTags(selectedBlock.tags ?? [])
    setDraftExternalUrl(selectedAttachment?.externalUrl ?? selectedBlock.externalUrl ?? '')
    setDraftWidth(typeof selectedBlock.width === 'number' ? String(selectedBlock.width) : '')
    setDraftHeight(typeof selectedBlock.height === 'number' ? String(selectedBlock.height) : '')
  }, [selectedAttachment, selectedBlock])

  const hasImageDimensions = selectedBlock?.type === 'image' || (selectedBlock?.type === 'file' && Boolean(selectedBlock.imageUrl || selectedBlock.previewUrl || selectedBlock.dataUrl))

  const currentSectionLabel = selectedSectionFilter === 'all'
    ? 'Все блоки'
    : selectedSectionFilter === 'none'
      ? 'Без раздела'
      : sections.find((section) => section.id === selectedSectionFilter)?.title ?? 'Все блоки'

  const tagSuggestions = useMemo(
    () => Array.from(new Set([...project.tags, ...draftTags])).filter(Boolean),
    [draftTags, project.tags],
  )

  function handleSave() {
    if (!selectedBlock) {
      return
    }

    onUpdateBlock(selectedBlock.id, {
      title: draftTitle.trim() || selectedBlock.title,
      content: draftContent.trim(),
      description: draftContent.trim(),
      sectionId: draftSectionId || null,
      tags: draftTags,
      externalUrl: draftExternalUrl.trim() || undefined,
      ...(hasImageDimensions
        ? {
            width: Math.min(720, Math.max(220, Number(draftWidth) || 320)),
            height: Math.min(640, Math.max(180, Number(draftHeight) || 280)),
          }
        : {}),
    })
  }

  function handleOpenLinkedItem() {
    if (!selectedBlock?.linkedItemType || !selectedBlock.linkedItemId || !linkedEntity?.canOpen) {
      return
    }

    navigate(getLinkedItemPath({
      type: selectedBlock.linkedItemType,
      id: selectedBlock.linkedItemId,
      projectId: project.id,
    }))
  }

  function handleDetachBlock() {
    if (!selectedBlock) {
      return
    }

    onUpdateBlock(selectedBlock.id, {
      linkedItemType: undefined,
      linkedItemId: undefined,
    })
  }

  function formatBytes(size?: number) {
    if (!size || size <= 0) {
      return 'Размер не указан'
    }

    if (size < 1024) {
      return `${size} Б`
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} КБ`
    }

    return `${(size / (1024 * 1024)).toFixed(2)} МБ`
  }

  if (!selectedBlock) {
    return (
      <aside className={cn('ui-panel isolate flex min-h-0 min-w-0 flex-col overflow-hidden p-4 md:p-5', className)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Инспектор</p>
            <h2 className="mt-1 text-lg font-semibold text-(--text-primary)">Workspace</h2>
          </div>
          <button type="button" onClick={onClose} className="ui-button px-3 py-2 text-sm">
            Скрыть
          </button>
        </div>

        <div className={cn('mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1', contentClassName)}>
          <div className="ui-surface-elevated rounded-2xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Workspace</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-(--text-muted)">Блоков</p>
                <p className="mt-1 font-medium text-(--text-primary)">{workspaceBlockCount}</p>
              </div>
              <div>
                <p className="text-(--text-muted)">Инструмент</p>
                <p className="mt-1 font-medium text-(--text-primary)">{activeToolLabel}</p>
              </div>
              <div>
                <p className="text-(--text-muted)">Zoom</p>
                <p className="mt-1 font-medium text-(--text-primary)">{zoomPercent}%</p>
              </div>
              <div>
                <p className="text-(--text-muted)">Фильтр</p>
                <p className="mt-1 font-medium text-(--text-primary)">{currentSectionLabel}</p>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Раздел</span>
              <select value={selectedSectionFilter} onChange={(event) => onSelectSectionFilter?.(event.target.value)} className="ui-input">
                <option value="all">Все блоки</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.title}</option>
                ))}
                <option value="none">Без раздела</option>
              </select>
            </label>
          </div>

          <div className="ui-surface-elevated rounded-2xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Project</p>
            <p className="mt-3 text-sm font-medium text-(--text-primary)">{project.title}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-(--text-secondary)">
              <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2.5 py-1">{project.status}</span>
              <span className="rounded-full border border-(--border-soft) bg-(--panel) px-2.5 py-1">{project.deadline ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(project.deadline)) : 'Без дедлайна'}</span>
            </div>
            <p className="mt-3 text-sm text-(--text-secondary)">
              Задачи: {relatedTasks.length} · Заметки: {relatedNotes.length} · Идеи: {relatedIdeas.length} · Файлы: {relatedFiles.length}
            </p>
            {onOpenProjectSettings ? (
              <button type="button" onClick={onOpenProjectSettings} className="ui-button mt-4 px-3 py-2 text-sm">Открыть настройки проекта</button>
            ) : null}
          </div>

          <div className="ui-surface-elevated rounded-2xl border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={onOpenAddElement ?? (() => onCreateBlock('text'))} className="ui-button px-3 py-2 text-sm">Добавить элемент</button>
              <button type="button" onClick={onArrangeBlocks} className="ui-button px-3 py-2 text-sm">Упорядочить</button>
              <button type="button" onClick={onResetView} className="ui-button px-3 py-2 text-sm">Сбросить вид</button>
            </div>
            <p className="mt-3 text-sm text-(--text-muted)">Выберите блок на canvas, чтобы переключиться на его свойства и связи.</p>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className={cn('ui-panel isolate flex min-h-0 min-w-0 flex-col overflow-hidden p-4 md:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Инспектор</p>
          <h2 className="mt-1 text-lg font-semibold text-(--text-primary)">{selectedBlock.title}</h2>
        </div>
        <button type="button" onClick={onClose} className="ui-button px-3 py-2 text-sm">
          Закрыть
        </button>
      </div>

      <div className={cn('mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1', contentClassName)}>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Тип</p>
          <p className="mt-1 text-sm text-(--text-primary)">{BLOCK_TYPE_LABELS[selectedBlock.type]}</p>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Название</span>
          <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="ui-input" />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Описание / текст</span>
          <textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} className="ui-textarea min-h-40" />
        </label>

        {hasImageDimensions ? (
          <div className="ui-surface-elevated rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Размер</p>
                <p className="mt-1 text-sm text-(--text-secondary)">Настройка размера фото-блока на desktop canvas.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftWidth('320')
                  setDraftHeight('280')
                  onUpdateBlock(selectedBlock.id, { width: 320, height: 280 })
                }}
                className="ui-button px-3 py-2 text-sm"
              >
                Сбросить размер
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Ширина</span>
                <input
                  type="number"
                  min={220}
                  max={720}
                  step={10}
                  value={draftWidth}
                  onChange={(event) => setDraftWidth(event.target.value)}
                  className="ui-input"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Высота</span>
                <input
                  type="number"
                  min={180}
                  max={640}
                  step={10}
                  value={draftHeight}
                  onChange={(event) => setDraftHeight(event.target.value)}
                  className="ui-input"
                />
              </label>
            </div>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Раздел проекта</span>
          <select value={draftSectionId} onChange={(event) => setDraftSectionId(event.target.value)} className="ui-input">
            <option value="">Без раздела</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>{section.title}</option>
            ))}
          </select>
        </label>

        {selectedBlock.type === 'link' ? (
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Ссылка</span>
            <input value={draftExternalUrl} onChange={(event) => setDraftExternalUrl(event.target.value)} className="ui-input" placeholder="https://example.com" />
          </label>
        ) : null}

        <TagInput
          label="Теги"
          value={draftTags}
          suggestions={tagSuggestions}
          onChange={setDraftTags}
          placeholder="Добавьте тег и нажмите Enter"
        />

        <div className="ui-surface-elevated rounded-2xl border p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Связанный элемент</p>
          {selectedBlock.linkedItemType && selectedBlock.linkedItemId ? (
            <>
              <p className="mt-2 text-sm font-medium text-(--text-primary)">{LINK_TYPE_LABELS[selectedBlock.linkedItemType]}</p>
              <p className="mt-1 text-sm text-(--text-secondary)">{linkedEntity?.title ?? 'Связанный элемент не найден'}</p>
              <p className="mt-1 break-all text-xs text-(--text-muted)">{selectedBlock.linkedItemId}</p>
              <p className="mt-3 text-xs leading-5 text-(--text-muted)">
                {linkedEntity?.exists === false
                  ? 'Связанный элемент не найден. Можно отвязать блок или удалить его.'
                  : 'Изменения в этом блоке обновляют связанную сущность.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleOpenLinkedItem}
                  disabled={!linkedEntity?.canOpen}
                  className="ui-button-accent px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Открыть
                </button>
                <button type="button" onClick={handleDetachBlock} className="ui-button px-3 py-2 text-sm">
                  Отвязать блок
                </button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-(--text-muted)">Это самостоятельный блок рабочей области. Изменения обновляют только сам блок.</p>
          )}
        </div>

        {selectedAttachment ? (
          <div className="ui-surface-elevated rounded-2xl border p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Материал проекта</p>
            {selectedAttachment.type === 'image' && (selectedAttachment.dataUrl || selectedAttachment.previewUrl) ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-(--border) bg-(--panel)">
                <img src={selectedAttachment.dataUrl || selectedAttachment.previewUrl || ''} alt={selectedAttachment.title} className="h-48 w-full object-cover" />
              </div>
            ) : null}
            <div className="mt-3 space-y-2 text-sm text-(--text-secondary)">
              {selectedAttachment.fileName ? <p><span className="text-(--text-primary)">Имя файла:</span> {selectedAttachment.fileName}</p> : null}
              {selectedAttachment.fileType ? <p><span className="text-(--text-primary)">Тип:</span> {selectedAttachment.fileType}</p> : null}
              {typeof selectedAttachment.fileSize === 'number' ? <p><span className="text-(--text-primary)">Размер:</span> {formatBytes(selectedAttachment.fileSize)}</p> : null}
              {selectedAttachment.externalUrl ? <p className="break-all"><span className="text-(--text-primary)">URL:</span> {selectedAttachment.externalUrl}</p> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onOpenAttachment(selectedAttachment.id)} className="ui-button-accent px-3 py-2 text-sm">Открыть</button>
              <button type="button" onClick={() => onEditAttachment(selectedAttachment.id)} className="ui-button px-3 py-2 text-sm">Редактировать материал</button>
              <button type="button" onClick={() => onDeleteAttachment(selectedAttachment.id)} className="ui-button-danger px-3 py-2 text-sm">Удалить материал</button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="ui-surface-elevated rounded-2xl border p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Создан</p>
            <p className="mt-1 text-(--text-primary)">{new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedBlock.createdAt))}</p>
          </div>
          <div className="ui-surface-elevated rounded-2xl border p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Обновлён</p>
            <p className="mt-1 text-(--text-primary)">{new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedBlock.updatedAt))}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Связи блока</p>
              <p className="mt-1 text-sm text-(--text-secondary)">Входящие и исходящие связи для выбранного блока.</p>
            </div>
            <button type="button" onClick={() => onCreateRelation(selectedBlock.id)} className="ui-button-accent px-3 py-2 text-sm">
              Создать связь
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {blockRelations.outgoing.length === 0 && blockRelations.incoming.length === 0 ? (
              <p className="text-sm text-(--text-muted)">У этого блока пока нет связей.</p>
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Исходящие</p>
              <div className="mt-2 space-y-2">
                {blockRelations.outgoing.length > 0 ? blockRelations.outgoing.map((relation) => (
                  <div key={relation.relationId} className="ui-surface-panel rounded-xl border p-3">
                    <p className="text-sm font-medium text-(--text-primary)">{projectWorkspaceRelationLabels[relation.type]}</p>
                    <button type="button" onClick={() => onOpenRelatedBlock(relation.relatedBlockId)} className="mt-1 text-left text-sm text-(--text-secondary) hover:text-(--text-primary)">
                      {relation.relatedBlockTitle}
                    </button>
                    {relation.label ? <p className="mt-1 text-xs text-(--text-muted)">{relation.label}</p> : null}
                    <button type="button" onClick={() => onDeleteRelation(relation.relationId)} className="ui-button mt-3 px-3 py-2 text-xs">
                      Удалить связь
                    </button>
                  </div>
                )) : <p className="text-sm text-(--text-muted)">Исходящих связей пока нет.</p>}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Входящие</p>
              <div className="mt-2 space-y-2">
                {blockRelations.incoming.length > 0 ? blockRelations.incoming.map((relation) => (
                  <div key={relation.relationId} className="ui-surface-panel rounded-xl border p-3">
                    <p className="text-sm font-medium text-(--text-primary)">{projectWorkspaceRelationLabels[relation.type]}</p>
                    <button type="button" onClick={() => onOpenRelatedBlock(relation.relatedBlockId)} className="mt-1 text-left text-sm text-(--text-secondary) hover:text-(--text-primary)">
                      {relation.relatedBlockTitle}
                    </button>
                    {relation.label ? <p className="mt-1 text-xs text-(--text-muted)">{relation.label}</p> : null}
                    <button type="button" onClick={() => onDeleteRelation(relation.relationId)} className="ui-button mt-3 px-3 py-2 text-xs">
                      Удалить связь
                    </button>
                  </div>
                )) : <p className="text-sm text-(--text-muted)">Входящих связей пока нет.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={handleSave} className="ui-button-accent px-4 py-2">
            Сохранить
          </button>
          <button type="button" onClick={() => onDeleteBlock(selectedBlock.id)} className="ui-button-danger px-4 py-2">
            Удалить
          </button>
        </div>
      </div>
    </aside>
  )
}
