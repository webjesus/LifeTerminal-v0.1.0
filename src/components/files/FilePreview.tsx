import type { FileItem } from '../../types'
import { fileTypeBadgeClasses, fileTypeBadges, fileTypeLabels } from './fileMeta'

type PreviewableFile = Pick<FileItem, 'title' | 'type' | 'path' | 'previewUrl' | 'description' | 'photoNote'>

type FilePreviewProps = {
  file: PreviewableFile
  compact?: boolean
}

export function FilePreview({ file, compact = false }: FilePreviewProps) {
  if (file.type === 'image' && file.previewUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-(--border) bg-(--panel-elevated) ${compact ? 'h-44' : 'h-72'}`}>
        <img src={file.previewUrl} alt={file.title} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-(--border) bg-(--panel-elevated) p-4 ${compact ? 'min-h-44' : 'min-h-72'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.16em] ${fileTypeBadgeClasses[file.type]}`}>
          {fileTypeBadges[file.type]}
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{fileTypeLabels[file.type]}</span>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-sm text-(--text-secondary)">{file.description || 'Описание не добавлено.'}</p>
        {file.photoNote ? <p className="rounded-xl border border-(--border) bg-black/10 px-3 py-3 text-sm text-(--text-muted)">{file.photoNote}</p> : null}
        <div className="rounded-xl border border-dashed border-(--border) px-3 py-3 text-sm text-(--text-muted)">
          {file.path || 'Путь к файлу не указан.'}
        </div>
      </div>
    </div>
  )
}
