import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { NoteFormModal, type NoteFormValues } from '../components/notes/NoteFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, ProjectWorkspaceBlock, Relation, Task } from '../types'
import { normalizeNote } from '../utils/normalizeEntities'
import {
  buildRelationCatalog,
  deleteRelationsForItem,
  getLinkedItemPath,
  getLinkedItemsFromRelations,
  isEditableRelation,
  syncRelationsForItem,
} from '../utils/relations'
import { storageKeys } from '../utils/storage'
import { detachWorkspaceBlocksFromLinkedEntity, syncWorkspaceBlocksFromLinkedEntity } from '../utils/syncWorkspaceBlocks'
import { getAllTags } from '../utils/tags'

function buildNoteFromForm(values: NoteFormValues, existingNote: Note): Note {
  return {
    ...existingNote,
    title: values.title,
    summary: values.summary,
    content: values.content,
    type: values.type,
    status: values.status,
    tags: values.tags,
    category: values.category,
    projectId: values.projectId,
    taskIds: values.taskIds,
    ideaIds: values.ideaIds,
    updatedAt: new Date().toISOString(),
  }
}

const noteTypeLabels: Record<Note['type'], string> = {
  basic: 'Обычная',
  research: 'Исследование',
  instruction: 'Инструкция',
  project_material: 'Материал проекта',
  personal_thought: 'Личная мысль',
  solution: 'Решение',
  list: 'Список',
  reference: 'Справка',
}

const noteStatusLabels: Record<Note['status'], string> = {
  draft: 'Черновик',
  active: 'В работе',
  completed: 'Готово',
  archived: 'Архив',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()

  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { setValue: setProjectWorkspaceBlocks } = useLocalStorage<ProjectWorkspaceBlock[]>(storageKeys.projectWorkspaceBlocks, [])
  const { value: tasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: files } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: goals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: sections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])

  const [isEditOpen, setIsEditOpen] = useState(false)

  const normalizedNotes = useMemo(() => notes.map(normalizeNote), [notes])
  const note = useMemo(
    () => normalizedNotes.find((item) => item.id === noteId) ?? null,
    [normalizedNotes, noteId],
  )

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ tasks, notes: normalizedNotes, projects, ideas, files, goals, sections }),
    [files, goals, ideas, normalizedNotes, projects, sections, tasks],
  )

  const selectedNoteRelations = useMemo(
    () => (note ? getLinkedItemsFromRelations(note.id, relations.filter(isEditableRelation), relationCatalog) : []),
    [note, relationCatalog, relations],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'note' && item.id === note?.id)),
    [note?.id, relationCatalog],
  )

  const allTags = useMemo(
    () => getAllTags(normalizedNotes, tasks, ideas, projects, files, goals),
    [files, goals, ideas, normalizedNotes, projects, tasks],
  )

  const linkedProject = note ? projects.find((project) => project.id === note.projectId) ?? null : null
  const linkedTasks = note ? tasks.filter((task) => note.taskIds.includes(task.id)) : []
  const linkedIdeas = note ? ideas.filter((idea) => note.ideaIds.includes(idea.id)) : []
  const linkedFiles = note ? files.filter((file) => note.fileIds.includes(file.id)) : []

  if (!note) {
    return (
      <section className="ui-panel p-6">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Заметка не найдена</h1>
        <p className="mt-3 text-sm text-(--text-muted)">Запись была удалена или ссылка устарела.</p>
        <button type="button" onClick={() => navigate('/notes')} className="ui-button mt-4 px-4 py-2">Вернуться к заметкам</button>
      </section>
    )
  }

  const currentNote = note

  function handleUpdateNote(values: NoteFormValues) {
    const nextNote = buildNoteFromForm(values, currentNote)

    setNotes((currentNotes) => currentNotes.map((item) => (item.id === currentNote.id ? nextNote : item)))
    setProjectWorkspaceBlocks((currentBlocks) =>
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'note', entity: nextNote, blocks: currentBlocks }),
    )
    syncRelationsForItem(currentNote.id, 'note', values.relatedItems)
    setIsEditOpen(false)
  }

  function handleDeleteNote() {
    const shouldDelete = window.confirm(`Удалить заметку «${currentNote.title}»?`)

    if (!shouldDelete) {
      return
    }

    setNotes((currentNotes) => currentNotes.filter((item) => item.id !== currentNote.id))
    setProjectWorkspaceBlocks((currentBlocks) => detachWorkspaceBlocksFromLinkedEntity(currentBlocks, 'note', currentNote.id))
    deleteRelationsForItem(currentNote.id)
    navigate('/notes')
  }

  return (
    <section className="space-y-6">
      <header className="ui-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button type="button" onClick={() => navigate('/notes')} className="ui-button px-3 py-2">Назад к заметкам</button>
            <h1 className="mt-3 text-3xl font-semibold text-(--text-primary)">{currentNote.title}</h1>
            <p className="mt-2 text-sm text-(--text-muted)">{currentNote.summary || 'Краткое описание не заполнено.'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="ui-chip">{noteTypeLabels[currentNote.type]}</span>
              <span className="ui-chip">{noteStatusLabels[currentNote.status]}</span>
              {currentNote.category ? <span className="ui-chip">{currentNote.category}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsEditOpen(true)} className="ui-button-accent px-4 py-3">Редактировать</button>
            <button type="button" onClick={handleDeleteNote} className="ui-button-danger px-4 py-3">Удалить</button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="ui-panel p-5 md:p-6">
          <h2 className="ui-section-title">Основной текст</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-(--text-secondary)">{currentNote.content || 'Основной текст пока не добавлен.'}</p>
        </article>

        <aside className="space-y-4">
          <section className="ui-panel p-5">
            <h3 className="text-sm uppercase tracking-[0.16em] text-(--text-muted)">Теги</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentNote.tags.length > 0 ? currentNote.tags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>) : <p className="text-sm text-(--text-muted)">Теги не добавлены</p>}
            </div>
          </section>

          <section className="ui-panel p-5">
            <h3 className="text-sm uppercase tracking-[0.16em] text-(--text-muted)">Связи</h3>
            <div className="mt-3 space-y-3 text-sm text-(--text-secondary)">
              <p>Проект: {linkedProject ? <button type="button" onClick={() => navigate(`/projects/${linkedProject.id}`)} className="text-(--accent)">{linkedProject.title}</button> : 'не указан'}</p>
              <p>Задачи: {linkedTasks.length}</p>
              <p>Идеи: {linkedIdeas.length}</p>
              <p>Файлы: {linkedFiles.length}</p>
            </div>
          </section>

          <section className="ui-panel p-5 text-sm text-(--text-muted)">
            <p>Создана: {formatDateTime(currentNote.createdAt)}</p>
            <p className="mt-2">Обновлена: {formatDateTime(currentNote.updatedAt)}</p>
          </section>
        </aside>
      </div>

      {isEditOpen ? (
        <NoteFormModal
          mode="edit"
          note={currentNote}
          tasks={tasks}
          projects={projects}
          ideas={ideas}
          availableTags={allTags}
          relatedItems={selectedNoteRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdateNote}
        />
      ) : null}
    </section>
  )
}
