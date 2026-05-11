import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/notes/EmptyState'
import { NoteCard } from '../components/notes/NoteCard'
import { NoteFormModal, type NoteFormValues } from '../components/notes/NoteFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, Relation, Task } from '../types'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'

type ModalMode = 'create' | 'edit' | 'view' | null

function buildNoteFromForm(values: NoteFormValues, existingNote?: Note): Note {
  const timestamp = new Date().toISOString()

  return {
    id: existingNote?.id ?? crypto.randomUUID(),
    title: values.title,
    content: values.content,
    tags: values.tags,
    createdAt: existingNote?.createdAt ?? timestamp,
    updatedAt: timestamp,
    projectId: values.projectId,
    taskIds: values.taskIds,
    ideaIds: values.ideaIds,
    fileIds: existingNote?.fileIds ?? [],
    goalIds: existingNote?.goalIds ?? [],
  }
}

function matchesSearch(note: Note, query: string) {
  if (!query.trim()) {
    return true
  }

  const normalizedQuery = query.trim().toLowerCase()
  const haystack = [note.title, note.content, ...note.tags].join(' ').toLowerCase()

  return haystack.includes(normalizedQuery)
}

function compareNotes(a: Note, b: Note) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function NotesPage() {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: tasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: files } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: goals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: sections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  )

  const filteredNotes = useMemo(
    () => [...notes].sort(compareNotes).filter((note) => matchesSearch(note, searchQuery)),
    [notes, searchQuery],
  )

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ tasks, notes, projects, ideas, files, goals, sections }),
    [files, goals, ideas, notes, projects, sections, tasks],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'note' && item.id === selectedNote?.id)),
    [relationCatalog, selectedNote?.id],
  )

  const selectedNoteRelations = useMemo(
    () => (selectedNote ? getLinkedItemsFromRelations(selectedNote.id, relations.filter(isEditableRelation), relationCatalog) : []),
    [relationCatalog, relations, selectedNote],
  )

  function closeModal() {
    setModalMode(null)
    setSelectedNoteId(null)
  }

  function openCreateModal() {
    setSelectedNoteId(null)
    setModalMode('create')
  }

  function openViewModal(note: Note) {
    setSelectedNoteId(note.id)
    setModalMode('view')
  }

  function openEditModal(note: Note) {
    setSelectedNoteId(note.id)
    setModalMode('edit')
  }

  function handleCreateNote(values: NoteFormValues) {
    const nextNote = buildNoteFromForm(values)
    setNotes((currentNotes) => [nextNote, ...currentNotes])
    syncRelationsForItem(nextNote.id, 'note', values.relatedItems)
    closeModal()
  }

  function handleUpdateNote(values: NoteFormValues) {
    if (!selectedNote) {
      return
    }

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === selectedNote.id ? buildNoteFromForm(values, note) : note,
      ),
    )
    syncRelationsForItem(selectedNote.id, 'note', values.relatedItems)
    closeModal()
  }

  function handleDeleteNote(note: Note) {
    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить заметку «${note.title}»?`)
      : true

    if (!shouldDelete) {
      return
    }

    setNotes((currentNotes) => currentNotes.filter((item) => item.id !== note.id))
    deleteRelationsForItem(note.id)

    if (selectedNoteId === note.id) {
      closeModal()
    }
  }

  const totalTags = useMemo(() => new Set(notes.flatMap((note) => note.tags)).size, [notes])
  const notesWithLinks = useMemo(
    () => notes.filter((note) => note.taskIds.length > 0 || note.ideaIds.length > 0 || note.projectId).length,
    [notes],
  )

  return (
    <section className="space-y-6">
      <header className="ui-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Knowledge Base</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-(--text-primary) md:text-4xl">Заметки</h1>
            <p className="page-description mt-3 max-w-2xl text-sm text-(--text-muted) md:text-base">
              Полноценное локальное пространство заметок с поиском, тегами и базовыми связями с задачами, проектами и идеями.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="ui-button-accent px-4 py-3"
          >
            Добавить заметку
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Всего заметок</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{notes.length}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Уникальных тегов</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{totalTags}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Со связями</p>
            <p className="mt-2 text-2xl font-semibold text-(--text-primary)">{notesWithLinks}</p>
          </div>
        </div>
      </header>

      <section className="ui-panel p-5">
        <label className="block text-sm text-(--text-secondary)" htmlFor="notes-search">
          Поиск по названию, тексту и тегам
        </label>
        <input
          id="notes-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="ui-input mt-2"
          placeholder="Например, research, ubuntu, план"
        />
      </section>

      {filteredNotes.length === 0 ? (
        <EmptyState
          title="Заметки пока не найдены"
          description="Создайте первую заметку или измените поисковый запрос. Все записи сохраняются в localStorage и доступны после перезагрузки страницы."
          actionLabel="Создать заметку"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-2">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              relations={relations}
              catalog={relationCatalog}
              onOpenPath={(path) => navigate(path)}
              onChangeLinks={(items) => syncRelationsForItem(note.id, 'note', items)}
              onOpen={openViewModal}
              onEdit={openEditModal}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}

      {modalMode ? (
        <NoteFormModal
          key={`${modalMode}-${selectedNote?.id ?? 'new'}`}
          mode={modalMode}
          note={selectedNote}
          tasks={tasks}
          projects={projects}
          ideas={ideas}
          relatedItems={selectedNoteRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={closeModal}
          onSubmit={modalMode === 'create' ? handleCreateNote : handleUpdateNote}
        />
      ) : null}

      {selectedNote && modalMode === 'view' ? (
        <div className="ui-panel p-5 text-sm text-(--text-muted)">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Последний просмотр</p>
              <p className="mt-1 text-(--text-primary)">{selectedNote.title}</p>
            </div>
            <p>Создана {formatDateTime(selectedNote.createdAt)} · Обновлена {formatDateTime(selectedNote.updatedAt)}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
