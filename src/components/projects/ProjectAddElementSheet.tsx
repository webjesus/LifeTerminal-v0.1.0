import { CheckSquare, Columns2, File, GitBranch, Image, Lightbulb, Link, MessageCircle, Route, StickyNote, Target, Type } from 'lucide-react'
import { Modal } from '../Modal'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import type { ProjectWorkspaceBlock, ProjectWorkspaceTemplatePreset } from '../../types'

type ProjectAddElementSheetProps = {
  isOpen: boolean
  onClose: () => void
  onCreateElement: (type: ProjectWorkspaceBlock['type']) => void
  onCreateTemplate?: (preset: ProjectWorkspaceTemplatePreset) => void
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

const TEMPLATE_ITEMS: Array<{
  preset: ProjectWorkspaceTemplatePreset
  title: string
  description: string
  icon: typeof Type
}> = [
  {
    preset: 'hierarchy',
    title: 'Иерархия',
    description: 'Верхний узел, ветви и готовые связи для схемы, структуры или карты.',
    icon: GitBranch,
  },
  {
    preset: 'comparison',
    title: 'Сравнение',
    description: 'Шапка и три пустые панели рядом для вариантов, гипотез или направлений.',
    icon: Columns2,
  },
  {
    preset: 'roadmap',
    title: 'Поток',
    description: 'Линейная группа из шагов для процесса, воронки или сценария.',
    icon: Route,
  },
]

export function ProjectAddElementSheet({ isOpen, onClose, onCreateElement, onCreateTemplate }: ProjectAddElementSheetProps) {
  useLockBodyScroll(isOpen)

  return (
    <Modal title="Добавить элемент" isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-5">
        {onCreateTemplate ? (
          <section className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Готовые визуальные группы</p>
              <p className="mt-1 text-sm text-(--text-secondary)">Создают пустые формы и базовые связи без текста внутри блоков.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {TEMPLATE_ITEMS.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.preset}
                    type="button"
                    onClick={() => {
                      onCreateTemplate(item.preset)
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
          </section>
        ) : null}

        <section className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Обычные элементы</p>
            <p className="mt-1 text-sm text-(--text-secondary)">Текст, задачи, материалы и другие блоки для наполнения рабочей области.</p>
          </div>
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
        </section>
      </div>
    </Modal>
  )
}
