import { MousePointer2, Type, CheckSquare, StickyNote, Lightbulb, Target, Image, File, Link, PencilLine } from 'lucide-react'
import { cn } from '../../utils/cn'

const TOOLS = [
  { key: 'select', icon: MousePointer2, label: 'Выделить' },
  { key: 'relation', icon: PencilLine, label: 'Связь' },
  { key: 'text', icon: Type, label: 'Текст' },
  { key: 'task', icon: CheckSquare, label: 'Задача' },
  { key: 'note', icon: StickyNote, label: 'Заметка' },
  { key: 'idea', icon: Lightbulb, label: 'Идея' },
  { key: 'goal', icon: Target, label: 'Цель' },
  { key: 'image', icon: Image, label: 'Фото' },
  { key: 'file', icon: File, label: 'Файл' },
  { key: 'link', icon: Link, label: 'Ссылка' },
]

interface ProjectToolbarProps {
  activeTool: string
  onSelectTool: (tool: string) => void
  onCreateBlock: (tool: string) => void
  className?: string
}

const CREATION_TOOLS = new Set(['text', 'task', 'note', 'idea', 'goal', 'file', 'image', 'link'])

export function ProjectToolbar({ activeTool, onSelectTool, onCreateBlock, className }: ProjectToolbarProps) {
  return (
    <nav className={cn('flex gap-1 rounded-2xl border border-(--border) bg-(--panel) p-2 shadow-(--shadow-soft) md:flex-col', className)}>
      {TOOLS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-xs transition',
            activeTool === key ? 'bg-(--panel-elevated) text-(--accent) font-bold' : 'text-(--text-secondary) hover:bg-(--panel-elevated)',
          )}
          aria-label={label}
          onClick={() => {
            onSelectTool(key)

            if (CREATION_TOOLS.has(key)) {
              onCreateBlock(key)
            }
          }}
        >
          <Icon size={20} />
          <span className="hidden md:block mt-0.5">{label}</span>
        </button>
      ))}
    </nav>
  )
}
