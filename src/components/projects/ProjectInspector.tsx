import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TagInput } from '../tags/TagInput'
import type { FileItem, Idea, Note, Project, ProjectAttachment, ProjectSection, ProjectWorkspaceBlock, ProjectWorkspaceRelation, Task } from '../../types'
import { getLinkedItemPath } from '../../utils/relations'
import { projectWorkspaceRelationLabels } from './projectMeta'

type ProjectInspectorProps = {
  project: Project
  selectedBlock: ProjectWorkspaceBlock | null
  onCreateBlock: (type: ProjectWorkspaceBlock['type']) => void
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
}: ProjectInspectorProps) {
  const navigate = useNavigate()
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftSectionId, setDraftSectionId] = useState('')
  const [draftTags, setDraftTags] = useState<string[]>([])
  const [draftExternalUrl, setDraftExternalUrl] = useState('')

  useEffect(() => {
    if (!selectedBlock) {
      setDraftTitle('')
      setDraftContent('')
      setDraftSectionId('')
      setDraftTags([])
      setDraftExternalUrl('')
      return
    }

    setDraftTitle(selectedBlock.title)
    setDraftContent(selectedBlock.content ?? selectedBlock.description ?? '')
    setDraftSectionId(selectedBlock.sectionId ?? '')
    setDraftTags(selectedBlock.tags ?? [])
    setDraftExternalUrl(selectedAttachment?.externalUrl ?? selectedBlock.externalUrl ?? '')
  }, [selectedAttachment, selectedBlock])

  const totalProjectItems = relatedTasks.length + relatedNotes.length + relatedIdeas.length + relatedFiles.length
  const projectProgress = relatedTasks.length > 0
    ? Math.round((relatedTasks.filter((task) => task.status === 'completed').length / relatedTasks.length) * 100)
    : 0

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
      <aside className="ui-panel min-w-0 overflow-hidden p-4 md:p-5 lg:max-h-[calc(100dvh-8rem)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Инспектор</p>
            <h2 className="mt-1 text-lg font-semibold text-(--text-primary)">Выберите блок</h2>
          </div>
          <button type="button" onClick={onClose} className="ui-button px-3 py-2 text-sm">
            Скрыть
          </button>
        </div>

        <div className="mt-5 space-y-4 lg:overflow-y-auto lg:pr-1">
          <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
            <p className="text-sm text-(--text-secondary)">Выберите блок на canvas, чтобы редактировать содержимое, связи и свойства без перехода на другие вкладки.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onCreateBlock('text')} className="ui-button-accent px-3 py-2 text-sm">Текст</button>
              <button type="button" onClick={() => onCreateBlock('task')} className="ui-button px-3 py-2 text-sm">Задача</button>
              <button type="button" onClick={() => onCreateBlock('idea')} className="ui-button px-3 py-2 text-sm">Идея</button>
              <button type="button" onClick={() => onCreateBlock('file')} className="ui-button px-3 py-2 text-sm">Файл</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Прогресс</p>
              <p className="mt-1 text-sm text-(--text-primary)">{projectProgress}%</p>
            </div>
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Всего элементов</p>
              <p className="mt-1 text-sm text-(--text-primary)">{totalProjectItems}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3 text-sm text-(--text-primary)">Задачи: {relatedTasks.length}</div>
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3 text-sm text-(--text-primary)">Заметки: {relatedNotes.length}</div>
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3 text-sm text-(--text-primary)">Идеи: {relatedIdeas.length}</div>
            <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3 text-sm text-(--text-primary)">Файлы: {relatedFiles.length}</div>
          </div>
          <p className="text-sm text-(--text-muted)">Инспектор держит только быстрый контекст. Полное описание проекта остаётся в Overview и header.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="ui-panel min-w-0 overflow-hidden p-4 md:p-5 lg:max-h-[calc(100dvh-8rem)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Инспектор</p>
          <h2 className="mt-1 text-lg font-semibold text-(--text-primary)">{selectedBlock.title}</h2>
        </div>
        <button type="button" onClick={onClose} className="ui-button px-3 py-2 text-sm">
          Закрыть
        </button>
      </div>

      <div className="mt-5 space-y-4 lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto lg:pr-1">
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
          <textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} className="ui-textarea min-h-30" />
        </label>

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

        <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
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
          <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
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
          <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Создан</p>
            <p className="mt-1 text-(--text-primary)">{new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedBlock.createdAt))}</p>
          </div>
          <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
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
                  <div key={relation.relationId} className="rounded-xl border border-(--border-soft) bg-(--panel) p-3">
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
                  <div key={relation.relationId} className="rounded-xl border border-(--border-soft) bg-(--panel) p-3">
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
