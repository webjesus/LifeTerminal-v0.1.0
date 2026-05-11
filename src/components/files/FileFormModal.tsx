import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { LinkedItemsPanel } from '../linked/LinkedItemsPanel'
import type { FileItem, FileItemType, Idea, Note, Project, Task } from '../../types'
import type { RelationSelectableItem } from '../../utils/relations'
import { FilePreview } from './FilePreview'
import { fileTypeLabels } from './fileMeta'

export type FileFormValues = {
  title: string
  description: string
  photoNote: string
  type: FileItemType
  path: string
  previewUrl: string | null
  tags: string[]
  projectId: string | null
  taskId: string | null
  noteId: string | null
  ideaId: string | null
  relatedItems: Array<Pick<RelationSelectableItem, 'id' | 'type'>>
}

type FileFormModalProps = {
  mode: 'create' | 'edit'
  file?: FileItem | null
  projects: Project[]
  tasks: Task[]
  notes: Note[]
  ideas: Idea[]
  relatedItems: RelationSelectableItem[]
  availableRelationItems: RelationSelectableItem[]
  onOpenRelatedItem: (item: RelationSelectableItem) => void
  onClose: () => void
  onSubmit: (values: FileFormValues) => void
}

type FormState = {
  title: string
  description: string
  photoNote: string
  type: FileItemType
  path: string
  previewUrl: string | null
  tagsInput: string
  projectId: string
  taskId: string
  noteId: string
  ideaId: string
}

function getInitialState(file?: FileItem | null): FormState {
  return {
    title: file?.title ?? '',
    description: file?.description ?? '',
    photoNote: file?.photoNote ?? '',
    type: file?.type ?? 'document',
    path: file?.path ?? '',
    previewUrl: file?.previewUrl ?? null,
    tagsInput: file?.tags.join(', ') ?? '',
    projectId: file?.projectId ?? '',
    taskId: file?.taskId ?? '',
    noteId: file?.noteId ?? '',
    ideaId: file?.ideaId ?? '',
  }
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export function FileFormModal({ mode, file, projects, tasks, notes, ideas, relatedItems, availableRelationItems, onOpenRelatedItem, onClose, onSubmit }: FileFormModalProps) {
  const [formState, setFormState] = useState<FormState>(() => getInitialState(file))
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<RelationSelectableItem[]>(relatedItems)
  const isImage = formState.type === 'image'

  const previewFile = useMemo(
    () => ({
      title: formState.title || 'Файл без названия',
      type: formState.type,
      path: formState.path,
      previewUrl: formState.previewUrl,
      description: formState.description,
      photoNote: formState.photoNote,
    }),
    [formState.description, formState.path, formState.photoNote, formState.previewUrl, formState.title, formState.type],
  )

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
      ...(field === 'type' && value !== 'image'
        ? { previewUrl: null, photoNote: '' }
        : {}),
    }))
  }

  async function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    const nextPreviewUrl = await readFileAsDataUrl(selectedFile)

    setFormState((current) => ({
      ...current,
      type: 'image',
      previewUrl: nextPreviewUrl,
      path: current.path.trim() ? current.path : selectedFile.name,
      title: current.title.trim() ? current.title : selectedFile.name.replace(/\.[^.]+$/, ''),
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formState.title.trim()
    const path = formState.path.trim()

    if (!title) {
      return
    }

    if (!isImage && !path) {
      return
    }

    if (isImage && !formState.previewUrl) {
      return
    }

    onSubmit({
      title,
      description: formState.description.trim(),
      photoNote: formState.photoNote.trim(),
      type: formState.type,
      path,
      previewUrl: isImage ? formState.previewUrl : null,
      tags: parseTags(formState.tagsInput),
      projectId: formState.projectId || null,
      taskId: formState.taskId || null,
      noteId: formState.noteId || null,
      ideaId: formState.ideaId || null,
      relatedItems: selectedRelatedItems,
    })
  }

  return (
    <Modal
      title={mode === 'create' ? 'Новый файл' : 'Редактирование файла'}
      isOpen
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="submit"
            form="file-form"
            className="ui-button-accent w-full sm:w-auto"
          >
            {mode === 'create' ? 'Добавить файл' : 'Сохранить изменения'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ui-button w-full sm:w-auto"
          >
            Отмена
          </button>
        </div>
      }
    >
        <form id="file-form" onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-(--text-muted)">
            Для обычных файлов сохраняется путь, для фотографий сохраняется локальное превью и метаданные.
          </p>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <label className="space-y-2 lg:col-span-2">
                <span className="text-sm text-(--text-secondary)">Название файла</span>
                <input
                  value={formState.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  placeholder="Например, спецификация интерфейса"
                  className="ui-input"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-(--text-secondary)">Тип файла</span>
                <select
                  value={formState.type}
                  onChange={(event) => handleChange('type', event.target.value as FileItemType)}
                  className="ui-input"
                >
                  {Object.entries(fileTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-(--text-secondary)">Путь к файлу</span>
                <input
                  value={formState.path}
                  onChange={(event) => handleChange('path', event.target.value)}
                  placeholder={isImage ? 'Например, фото_отчёт.jpg' : 'Например, C:/Docs/spec.pdf'}
                  className="ui-input"
                />
              </label>

              <label className="space-y-2 lg:col-span-2">
                <span className="text-sm text-(--text-secondary)">Описание</span>
                <textarea
                  value={formState.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  rows={4}
                  placeholder="Коротко опишите, что это за файл и зачем он нужен."
                  className="ui-input min-h-30 max-h-55 resize-y"
                />
              </label>

              <label className="space-y-2 lg:col-span-2">
                <span className="text-sm text-(--text-secondary)">Теги</span>
                <input
                  value={formState.tagsInput}
                  onChange={(event) => handleChange('tagsInput', event.target.value)}
                  placeholder="фото, справка, релиз"
                  className="ui-input"
                />
              </label>

              {isImage ? (
                <>
                  <label className="space-y-2 lg:col-span-2">
                    <span className="text-sm text-(--text-secondary)">Загрузить фотографию</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelection}
                      className="ui-input file:mr-4 file:rounded-lg file:border-0 file:bg-(--accent-soft) file:px-3 file:py-2 file:text-sm file:font-medium file:text-(--text-primary)"
                    />
                  </label>

                  <label className="space-y-2 lg:col-span-2">
                    <span className="text-sm text-(--text-secondary)">Заметка к фото</span>
                    <textarea
                      value={formState.photoNote}
                      onChange={(event) => handleChange('photoNote', event.target.value)}
                      rows={4}
                      placeholder="Что важно на фото, контекст съёмки, выводы"
                      className="ui-input min-h-30 max-h-55 resize-y"
                    />
                  </label>
                </>
              ) : null}
            </div>
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4 sm:p-5">
            <div className="space-y-5">
              <div>
                <p className="text-sm text-(--text-secondary)">Превью</p>
                <div className="mt-3">
                  <FilePreview file={previewFile} />
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm text-(--text-secondary)">Проект</span>
                <select
                  value={formState.projectId}
                  onChange={(event) => handleChange('projectId', event.target.value)}
                  className="ui-input"
                >
                  <option value="">Без проекта</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-(--text-secondary)">Задача</span>
                <select
                  value={formState.taskId}
                  onChange={(event) => handleChange('taskId', event.target.value)}
                  className="ui-input"
                >
                  <option value="">Без задачи</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-(--text-secondary)">Заметка</span>
                <select
                  value={formState.noteId}
                  onChange={(event) => handleChange('noteId', event.target.value)}
                  className="ui-input"
                >
                  <option value="">Без заметки</option>
                  {notes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-(--text-secondary)">Идея</span>
                <select
                  value={formState.ideaId}
                  onChange={(event) => handleChange('ideaId', event.target.value)}
                  className="ui-input"
                >
                  <option value="">Без идеи</option>
                  {ideas.map((idea) => (
                    <option key={idea.id} value={idea.id}>
                      {idea.title}
                    </option>
                  ))}
                </select>
              </label>

              <LinkedItemsPanel
                selectedItems={selectedRelatedItems}
                availableItems={availableRelationItems}
                onChange={(items) =>
                  setSelectedRelatedItems(
                    availableRelationItems.filter((item) => items.some((entry) => entry.id === item.id && entry.type === item.type)),
                  )
                }
                onOpenItem={onOpenRelatedItem}
              />
            </div>
          </div>
        </form>
    </Modal>
  )
}
