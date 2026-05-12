import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Modal } from '../Modal'
import { TagInput } from '../tags/TagInput'
import type { ProjectAttachment } from '../../types'

const MAX_LOCAL_IMAGE_SIZE = 2 * 1024 * 1024

export type ProjectAttachmentFormValues = {
  type: 'image' | 'file' | 'link'
  title: string
  description: string
  tags: string[]
  fileName?: string
  fileType?: string
  fileSize?: number
  url?: string
  externalUrl?: string
  previewUrl?: string
  dataUrl?: string
}

type ProjectAttachmentUploaderProps = {
  isOpen: boolean
  mode: 'image' | 'file' | 'link'
  attachment?: ProjectAttachment | null
  onClose: () => void
  onSubmit: (values: ProjectAttachmentFormValues) => void
}

type FormState = {
  title: string
  description: string
  tags: string[]
  fileName: string
  fileType: string
  fileSize?: number
  url: string
  externalUrl: string
  previewUrl: string
  dataUrl: string
  error: string
}

function toFormState(_mode: 'image' | 'file' | 'link', attachment?: ProjectAttachment | null): FormState {
  return {
    title: attachment?.title ?? '',
    description: attachment?.description ?? '',
    tags: attachment?.tags ?? [],
    fileName: attachment?.fileName ?? attachment?.path ?? '',
    fileType: attachment?.fileType ?? '',
    fileSize: attachment?.fileSize,
    url: attachment?.url ?? '',
    externalUrl: attachment?.externalUrl ?? '',
    previewUrl: attachment?.previewUrl ?? '',
    dataUrl: attachment?.dataUrl ?? '',
    error: '',
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'))
    reader.readAsDataURL(file)
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

export function ProjectAttachmentUploader({ isOpen, mode, attachment, onClose, onSubmit }: ProjectAttachmentUploaderProps) {
  const [formState, setFormState] = useState<FormState>(() => toFormState(mode, attachment))

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormState(toFormState(mode, attachment))
  }, [attachment, isOpen, mode])

  const title = useMemo(() => {
    if (attachment) {
      return 'Редактирование материала'
    }

    switch (mode) {
      case 'image':
        return 'Добавить изображение'
      case 'link':
        return 'Добавить ссылку'
      default:
        return 'Добавить файл'
    }
  }, [attachment, mode])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    if (mode === 'image') {
      if (selectedFile.size > MAX_LOCAL_IMAGE_SIZE) {
        setFormState((current) => ({
          ...current,
          error: 'Файл слишком большой для локального хранения. Позже будет добавлено облачное хранилище.',
        }))
        return
      }

      const dataUrl = await readFileAsDataUrl(selectedFile)
      setFormState((current) => ({
        ...current,
        title: current.title.trim() ? current.title : selectedFile.name.replace(/\.[^.]+$/, ''),
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        previewUrl: dataUrl,
        dataUrl,
        error: '',
      }))
      return
    }

    setFormState((current) => ({
      ...current,
      title: current.title.trim() ? current.title : selectedFile.name.replace(/\.[^.]+$/, ''),
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      url: selectedFile.name,
      error: '',
    }))
  }

  const preview = mode === 'image' ? (formState.dataUrl || formState.previewUrl) : ''
  const canSubmit = formState.title.trim() && (mode === 'link' ? formState.externalUrl.trim() : mode === 'image' ? preview : formState.fileName.trim()) && !formState.error

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-(--text-muted)">
            {mode === 'file'
              ? 'Для обычных файлов пока сохраняются только метаданные. Облачное хранилище можно добавить позже.'
              : 'Материал сохранится локально и будет доступен внутри проекта.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onClose} className="ui-button px-4 py-3 text-sm">Отмена</button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) {
                  return
                }

                onSubmit({
                  type: mode,
                  title: formState.title.trim(),
                  description: formState.description.trim(),
                  tags: formState.tags,
                  fileName: formState.fileName || undefined,
                  fileType: formState.fileType || undefined,
                  fileSize: formState.fileSize,
                  url: formState.url || undefined,
                  externalUrl: formState.externalUrl.trim() || undefined,
                  previewUrl: formState.previewUrl || undefined,
                  dataUrl: formState.dataUrl || undefined,
                })
                onClose()
              }}
              className="ui-button-accent px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {attachment ? 'Сохранить изменения' : 'Добавить материал'}
            </button>
          </div>
        </div>
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Название</span>
            <input value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} className="ui-input" placeholder="Например, mockup экрана прогресса" />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Описание</span>
            <textarea value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} rows={4} className="ui-textarea min-h-28" placeholder="Коротко опишите, зачем нужен этот материал." />
          </label>

          {mode === 'link' ? (
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Ссылка</span>
              <input value={formState.externalUrl} onChange={(event) => setFormState((current) => ({ ...current, externalUrl: event.target.value }))} className="ui-input" placeholder="https://example.com/reference" />
            </label>
          ) : (
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">{mode === 'image' ? 'Изображение' : 'Файл'}</span>
              <input type="file" accept={mode === 'image' ? 'image/*' : undefined} onChange={handleFileChange} className="ui-input file:mr-4 file:rounded-lg file:border-0 file:bg-(--accent-soft) file:px-3 file:py-2 file:text-sm file:font-medium file:text-(--text-primary)" />
            </label>
          )}

          <TagInput
            label="Теги"
            value={formState.tags}
            suggestions={formState.tags}
            onChange={(tags) => setFormState((current) => ({ ...current, tags }))}
            placeholder="Добавьте теги материала"
          />

          {formState.error ? <div className="rounded-2xl border border-(--danger-border) bg-(--danger-bg) p-3 text-sm text-(--danger-text)">{formState.error}</div> : null}
        </div>

        <div className="rounded-3xl border border-(--border) bg-(--panel-elevated) p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Предпросмотр</p>
          {mode === 'image' && preview ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-(--border) bg-(--panel)">
              <img src={preview} alt={formState.title || 'Новое изображение'} className="h-56 w-full object-cover" />
            </div>
          ) : null}

          {mode === 'link' ? (
            <div className="mt-4 rounded-2xl border border-(--border) bg-(--panel) p-4">
              <p className="text-sm font-semibold text-(--text-primary)">{formState.title || 'Новая ссылка'}</p>
              <p className="mt-2 break-all text-sm text-(--accent)">{formState.externalUrl || 'URL пока не указан'}</p>
              <p className="mt-3 text-sm text-(--text-secondary)">{formState.description || 'Описание появится здесь.'}</p>
            </div>
          ) : null}

          {mode === 'file' || mode === 'image' ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-(--border) bg-(--panel) p-4">
              <p className="text-sm font-semibold text-(--text-primary)">{formState.fileName || 'Файл ещё не выбран'}</p>
              <p className="text-sm text-(--text-secondary)">{formState.fileType || 'Тип определится после выбора файла'}</p>
              <p className="text-sm text-(--text-muted)">{formatBytes(formState.fileSize)}</p>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}