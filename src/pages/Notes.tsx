import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/notes/EmptyState'
import { NoteCard } from '../components/notes/NoteCard'
import { NoteFormModal, type NoteFormValues } from '../components/notes/NoteFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, ProjectWorkspaceBlock, Relation, Task } from '../types'
import { normalizeNote } from '../utils/normalizeEntities'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'
import { detachWorkspaceBlocksFromLinkedEntity, syncWorkspaceBlocksFromLinkedEntity } from '../utils/syncWorkspaceBlocks'
import { getAllTags } from '../utils/tags'

type ModalMode = 'create' | 'edit' | null

function buildNoteFromForm(values: NoteFormValues, existingNote?: Note): Note {
  const timestamp = new Date().toISOString()

  return {
    id: existingNote?.id ?? crypto.randomUUID(),
    title: values.title,
    summary: values.summary,
    content: values.content,
    type: values.type,
    status: values.status,
    tags: values.tags,
    category: values.category,
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
  const haystack = [
    note.title,
    note.summary,
    note.content,
    note.category,
    note.type,
    note.status,
    ...note.tags,
  ].join(' ').toLowerCase()

  return haystack.includes(normalizedQuery)
}

function compareNotes(a: Note, b: Note) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function NotesPage() {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { setValue: setProjectWorkspaceBlocks } = useLocalStorage<ProjectWorkspaceBlock[]>(storageKeys.projectWorkspaceBlocks, [])
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

  const normalizedNotes = useMemo(
    () => notes.map(normalizeNote),
    [notes],
  )

  const allTags = useMemo(
    () => getAllTags(normalizedNotes, tasks, ideas, projects, files, goals),
    [files, goals, ideas, normalizedNotes, projects, tasks],
  )

  const selectedNote = useMemo(
    () => normalizedNotes.find((note) => note.id === selectedNoteId) ?? null,
    [normalizedNotes, selectedNoteId],
  )

  const filteredNotes = useMemo(
    () => [...normalizedNotes].sort(compareNotes).filter((note) => matchesSearch(note, searchQuery)),
    [normalizedNotes, searchQuery],
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
    navigate(`/notes/${note.id}`)
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

    const nextNote = buildNoteFromForm(values, selectedNote)

    setNotes((currentNotes) => currentNotes.map((note) => (note.id === selectedNote.id ? nextNote : note)))
    setProjectWorkspaceBlocks((currentBlocks) =>
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'note', entity: nextNote, blocks: currentBlocks }),
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
  setProjectWorkspaceBlocks((currentBlocks) => detachWorkspaceBlocksFromLinkedEntity(currentBlocks, 'note', note.id))
    deleteRelationsForItem(note.id)

    if (selectedNoteId === note.id) {
      closeModal()
    }
  }

  const totalTags = useMemo(() => new Set(normalizedNotes.flatMap((note) => note.tags)).size, [normalizedNotes])
  return (
    <section className="space-y-4">
      <PageHeader
        section="notes"
        title="Заметки"
        description="Заметки как рабочий материал: название, краткий preview и быстрый переход внутрь."
        actionLabel="Добавить заметку"
        onAction={openCreateModal}
      />

      <section className="ui-panel p-4 md:p-4.5">
        <div className="flex flex-wrap gap-2 text-sm text-(--text-secondary)">
          <span className="ui-chip">Всего {normalizedNotes.length}</span>
          <span className="ui-chip">Тегов {totalTags}</span>
        </div>
      </section>

      <section className="ui-panel p-4 md:p-5">
        <label className="block text-sm text-(--text-secondary)" htmlFor="notes-search">
          Поиск по названию, тексту и тегам
        </label>
        <input
          id="notes-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="ui-input mt-2"
          placeholder="Найти заметку"
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
          availableTags={allTags}
          relatedItems={selectedNoteRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={closeModal}
          onSubmit={modalMode === 'create' ? handleCreateNote : handleUpdateNote}
        />
      ) : null}
    </section>
  )
}
