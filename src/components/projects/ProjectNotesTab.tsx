import { useMemo, useState } from 'react'
import type { Note, ProjectWorkspaceBlock } from '../../types'
import { EmptyState } from './EmptyState'

type ProjectNotesTabProps = {
  notes: Note[]
  workspaceBlocks: ProjectWorkspaceBlock[]
  onCreateNote: () => void
  onOpenNote: (noteId: string) => void
  onOpenWorkspaceBlock: (blockId: string) => void
}

export function ProjectNotesTab({ notes, workspaceBlocks, onCreateNote, onOpenNote, onOpenWorkspaceBlock }: ProjectNotesTabProps) {
  const [statusFilter, setStatusFilter] = useState<Note['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<Note['type'] | 'all'>('all')
  const safeNotes = Array.isArray(notes) ? notes : []
  const safeWorkspaceBlocks = Array.isArray(workspaceBlocks) ? workspaceBlocks : []

  const filteredNotes = useMemo(
    () => safeNotes.filter((note) => (statusFilter === 'all' || note.status === statusFilter) && (typeFilter === 'all' || note.type === typeFilter)),
    [safeNotes, statusFilter, typeFilter],
  )

  const typeOptions = useMemo(() => Array.from(new Set(safeNotes.map((note) => note.type))), [safeNotes])
  const linkedBlockMap = useMemo(
    () => new Map(safeWorkspaceBlocks.filter((block) => block.linkedItemType === 'note' && block.linkedItemId).map((block) => [block.linkedItemId as string, block.id])),
    [safeWorkspaceBlocks],
  )

  return (
    <section className="ui-panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-(--text-muted)">Заметки и материалы проекта с быстрым переходом в рабочую область.</p>
        <button type="button" onClick={onCreateNote} className="ui-button-accent px-4 py-2.5">Добавить заметку</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-(--text-secondary)">Статус</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Note['status'] | 'all')} className="ui-input">
            <option value="all">Все статусы</option>
            <option value="draft">Черновик</option>
            <option value="active">В работе</option>
            <option value="completed">Готово</option>
            <option value="archived">Архив</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm text-(--text-secondary)">Тип заметки</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as Note['type'] | 'all')} className="ui-input">
            <option value="all">Все типы</option>
            {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3">
        {filteredNotes.length > 0 ? filteredNotes.map((note) => {
          const linkedBlockId = linkedBlockMap.get(note.id)
          const noteTags = Array.isArray(note.tags) ? note.tags : []

          return (
            <article key={note.id} className="ui-panel-elevated p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <button type="button" onClick={() => onOpenNote(note.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap gap-2"><span className="ui-chip">{note.status}</span><span className="ui-chip">{note.type}</span></div>
                  <p className="mt-3 text-base font-semibold text-(--text-primary)">{note.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-(--text-muted)">{note.summary || note.content || 'Без содержания'}</p>
                  {noteTags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{noteTags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>)}</div> : null}
                  <p className="mt-3 text-xs text-(--text-muted)">Обновлено {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.updatedAt))}</p>
                </button>
                {linkedBlockId ? <button type="button" onClick={() => onOpenWorkspaceBlock(linkedBlockId)} className="ui-button px-3 py-2 text-sm">Связана с рабочей областью</button> : null}
              </div>
            </article>
          )
        }) : <EmptyState title="В проекте пока нет заметок" description="Добавьте материалы, инструкции, исследования или выводы." actionLabel="Добавить заметку" onAction={onCreateNote} />}
      </div>
    </section>
  )
}
