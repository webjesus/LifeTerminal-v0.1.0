import { useMemo, useState } from 'react'
import type { ProjectAttachment, ProjectWorkspaceBlock } from '../../types'
import { EmptyState } from './EmptyState'

type ProjectFilesTabProps = {
  files: ProjectAttachment[]
  workspaceBlocks: ProjectWorkspaceBlock[]
  onCreateFile: () => void
  onCreateImage: () => void
  onCreateLink: () => void
  onOpenFile: (fileId: string) => void
  onEditFile: (fileId: string) => void
  onDeleteFile: (fileId: string) => void
  onOpenWorkspaceBlock: (blockId: string) => void
}

type AttachmentFilter = 'all' | 'image' | 'file' | 'link'

const FILTER_LABELS: Record<AttachmentFilter, string> = {
  all: 'Все',
  image: 'Фото',
  file: 'Файлы',
  link: 'Ссылки',
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

export function ProjectFilesTab({ files, workspaceBlocks, onCreateFile, onCreateImage, onCreateLink, onOpenFile, onEditFile, onDeleteFile, onOpenWorkspaceBlock }: ProjectFilesTabProps) {
  const [filter, setFilter] = useState<AttachmentFilter>('all')
  const safeFiles = Array.isArray(files) ? files : []
  const safeWorkspaceBlocks = Array.isArray(workspaceBlocks) ? workspaceBlocks : []
  const linkedBlockMap = useMemo(
    () => new Map(safeWorkspaceBlocks.filter((block) => block.linkedItemType === 'file' && block.linkedItemId).map((block) => [block.linkedItemId as string, block.id])),
    [safeWorkspaceBlocks],
  )
  const filteredFiles = useMemo(() => (filter === 'all' ? safeFiles : safeFiles.filter((file) => file.type === filter)), [safeFiles, filter])

  return (
    <section className="ui-panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-(--text-muted)">Файлы, ссылки и изображения проекта без отдельного hero-блока.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCreateFile} className="ui-button-accent px-4 py-2.5">Добавить файл</button>
          <button type="button" onClick={onCreateImage} className="ui-button px-4 py-2.5">Добавить изображение</button>
          <button type="button" onClick={onCreateLink} className="ui-button px-4 py-2.5">Добавить ссылку</button>
        </div>
      </div>

      <div className="mt-4 ui-filter-scroll">
        {(Object.keys(FILTER_LABELS) as AttachmentFilter[]).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={['ui-filter-pill', filter === item ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : ''].join(' ')}>
            {FILTER_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-(--border) bg-(--panel)">
        {filteredFiles.length > 0 ? filteredFiles.map((file) => {
          const linkedBlockId = linkedBlockMap.get(file.id)
          const previewImage = file.dataUrl || file.previewUrl
          const fileTags = Array.isArray(file.tags) ? file.tags : []

          return (
            <article key={file.id} className="border-b border-(--border) bg-(--panel-elevated) p-4 transition hover:bg-[color-mix(in_srgb,var(--panel-elevated)_76%,var(--panel))] last:border-b-0">
              <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--panel)">
                  {file.type === 'image' && previewImage ? (
                    <img src={previewImage} alt={file.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-(--text-muted)">
                      {file.type === 'link' ? (file.externalUrl || 'Ссылка без URL') : (file.fileName || file.path || 'Сохранены только метаданные файла')}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2"><span className="ui-chip">{file.type === 'image' ? 'Фото' : file.type === 'link' ? 'Ссылка' : 'Файл'}</span>{file.fileType ? <span className="ui-chip">{file.fileType}</span> : null}{file.fileSize ? <span className="ui-chip">{formatBytes(file.fileSize)}</span> : null}</div>
                  <p className="mt-3 text-base font-semibold text-(--text-primary)">{file.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-(--text-muted)">{file.description || file.photoNote || 'Без описания'}</p>
                  {fileTags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{fileTags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>)}</div> : null}
                  <div className="mt-3 space-y-1 text-xs text-(--text-muted)">
                    <p>Добавлен {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(file.createdAt))}</p>
                    {file.fileName ? <p>Имя файла: {file.fileName}</p> : null}
                    {file.externalUrl ? <p className="break-all">URL: {file.externalUrl}</p> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => onOpenFile(file.id)} className="ui-button-accent px-3 py-2 text-sm">Открыть</button>
                    <button type="button" onClick={() => onEditFile(file.id)} className="ui-button px-3 py-2 text-sm">Редактировать</button>
                    <button type="button" onClick={() => onDeleteFile(file.id)} className="ui-button-danger px-3 py-2 text-sm">Удалить</button>
                    {linkedBlockId ? <button type="button" onClick={() => onOpenWorkspaceBlock(linkedBlockId)} className="ui-button px-3 py-2 text-sm">Связанный блок</button> : null}
                  </div>
                </div>
              </div>
            </article>
          )
        }) : <div className="p-5"><EmptyState title="В проекте пока нет материалов" description="Добавьте фото, файлы или ссылки, чтобы собрать всё нужное в одном месте." actionLabel="Добавить файл" onAction={onCreateFile} /></div>}
      </div>
    </section>
  )
}
