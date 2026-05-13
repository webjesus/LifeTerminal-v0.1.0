import { CheckSquare, Ellipsis, Lightbulb, Plus, Type } from 'lucide-react'

type ProjectMobileToolbarProps = {
  onAdd: () => void
  onCreateText: () => void
  onCreateTask: () => void
  onCreateIdea: () => void
  onMore: () => void
}

export function ProjectMobileToolbar({ onAdd, onCreateText, onCreateTask, onCreateIdea, onMore }: ProjectMobileToolbarProps) {
  return (
    <div className="lg:hidden">
      <div
        className="fixed left-4 right-4 z-30 rounded-3xl border border-(--border) bg-(--panel) p-2 shadow-(--shadow-floating)"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
      >
        <div className="grid grid-cols-5 gap-2">
          <button type="button" onClick={onAdd} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs text-(--text-secondary) hover:bg-(--panel-elevated)">
            <Plus size={18} />
            <span>Добавить</span>
          </button>
          <button type="button" onClick={onCreateText} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs text-(--text-secondary) hover:bg-(--panel-elevated)">
            <Type size={18} />
            <span>Текст</span>
          </button>
          <button type="button" onClick={onCreateTask} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs text-(--text-secondary) hover:bg-(--panel-elevated)">
            <CheckSquare size={18} />
            <span>Задача</span>
          </button>
          <button type="button" onClick={onCreateIdea} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs text-(--text-secondary) hover:bg-(--panel-elevated)">
            <Lightbulb size={18} />
            <span>Идея</span>
          </button>
          <button type="button" onClick={onMore} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs text-(--text-secondary) hover:bg-(--panel-elevated)">
            <Ellipsis size={18} />
            <span>Ещё</span>
          </button>
        </div>
      </div>
    </div>
  )
}
