import { CheckSquare, File, Image, Lightbulb, Link, MessageCircle, StickyNote, Target, Type } from 'lucide-react'
import { Modal } from '../Modal'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import type { ProjectWorkspaceBlock } from '../../types'

type ProjectAddElementSheetProps = {
  isOpen: boolean
  onClose: () => void
  onCreateElement: (type: ProjectWorkspaceBlock['type']) => void
}

const ITEMS: Array<{
  type: ProjectWorkspaceBlock['type']
  title: string
  description: string
  icon: typeof Type
}> = [
  { type: 'text', title: 'Текстовый блок', description: 'Свободный текст, мысль или рабочее описание.', icon: Type },
  { type: 'task', title: 'Задача', description: 'Конкретное действие внутри проекта.', icon: CheckSquare },
  { type: 'note', title: 'Заметка', description: 'Материал, инструкция или вывод по проекту.', icon: StickyNote },
  { type: 'idea', title: 'Идея', description: 'Мысль или решение, которое можно развить.', icon: Lightbulb },
  { type: 'goal', title: 'Цель', description: 'Ключевой результат или важный ориентир проекта.', icon: Target },
  { type: 'image', title: 'Фото', description: 'Изображение или визуальный референс для проекта.', icon: Image },
  { type: 'file', title: 'Файл', description: 'Документ или материал, связанный с проектом.', icon: File },
  { type: 'link', title: 'Ссылка', description: 'Внешний ресурс, страница или источник.', icon: Link },
  { type: 'comment', title: 'Комментарий', description: 'Короткая заметка, ремарка или пояснение к блоку.', icon: MessageCircle },
]

export function ProjectAddElementSheet({ isOpen, onClose, onCreateElement }: ProjectAddElementSheetProps) {
  useLockBodyScroll(isOpen)

  return (
    <Modal title="Добавить элемент" isOpen={isOpen} onClose={onClose} size="md">
      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
        {ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                onCreateElement(item.type)
                onClose()
              }}
              className="rounded-3xl border border-(--border) bg-(--panel-elevated) p-4 text-left transition hover:border-(--accent-border) hover:bg-(--accent-soft)"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--panel) text-(--accent)">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-(--text-primary)">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-(--text-muted)">{item.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
