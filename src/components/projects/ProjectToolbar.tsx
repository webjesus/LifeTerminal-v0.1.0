import { Hand, MousePointer2, Type, CheckSquare, StickyNote, Lightbulb, Target, Image, File, Link, PencilLine } from 'lucide-react'
import { cn } from '../../utils/cn'

const TOOLS = [
  { key: 'select', icon: MousePointer2, label: 'Выделить' },
  { key: 'pan', icon: Hand, label: 'Рука' },
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
    <div className={cn('w-21 rounded-[1.625rem] ui-shadow-soft', className)}>
      <nav className="ui-surface-panel isolate flex gap-1.5 overflow-hidden rounded-[1.625rem] border px-2 py-2.5 md:min-h-0 md:flex-col md:items-stretch md:justify-center md:overflow-x-hidden md:overflow-y-auto">
        {TOOLS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            className={cn(
              'flex min-h-14 w-full shrink-0 flex-col items-center justify-center gap-1 rounded-[1.125rem] px-1.5 py-2 text-center text-[11px] leading-[1.05] transition',
              activeTool === key ? 'bg-(--panel-elevated) text-(--accent) font-semibold' : 'text-(--text-secondary) hover:bg-(--panel-elevated)',
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
            <span className="hidden md:block max-w-full text-balance">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
