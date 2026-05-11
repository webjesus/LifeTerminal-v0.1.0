import type { FileItemType } from '../../types'

export const fileTypeLabels: Record<FileItemType, string> = {
  document: 'Документ',
  image: 'Фото',
  video: 'Видео',
  audio: 'Аудио',
  archive: 'Архив',
  link: 'Ссылка',
  other: 'Другое',
}

export const fileTypeBadges: Record<FileItemType, string> = {
  document: 'DOC',
  image: 'IMG',
  video: 'VID',
  audio: 'AUD',
  archive: 'ZIP',
  link: 'URL',
  other: 'FILE',
}

export const fileTypeBadgeClasses: Record<FileItemType, string> = {
  document: 'border-stone-400/35 bg-stone-900/50 text-stone-200',
  image: 'border-orange-400/40 bg-orange-950/50 text-orange-100',
  video: 'border-amber-500/35 bg-amber-950/45 text-amber-100',
  audio: 'border-yellow-500/35 bg-yellow-950/45 text-yellow-100',
  archive: 'border-zinc-400/35 bg-zinc-900/60 text-zinc-200',
  link: 'border-orange-500/35 bg-orange-950/45 text-orange-200',
  other: 'border-stone-500/35 bg-black/20 text-stone-200',
}
