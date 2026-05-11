import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/projects/EmptyState'
import { FileCard } from '../components/files/FileCard'
import { FileFormModal, type FileFormValues } from '../components/files/FileFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, Relation, Task } from '../types'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'

type ModalMode = 'create' | 'edit' | null

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

function parseSearchMatch(file: FileItem, query: string) {
  if (!query.trim()) {
    return true
  }

  const normalizedQuery = query.trim().toLowerCase()
  const haystack = [file.title, file.description, file.photoNote ?? '', file.path, ...file.tags].join(' ').toLowerCase()

  return haystack.includes(normalizedQuery)
}

function compareFiles(a: FileItem, b: FileItem) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function buildFileFromForm(values: FileFormValues, existingFile?: FileItem): FileItem {
  const timestamp = new Date().toISOString()

  return {
    id: existingFile?.id ?? crypto.randomUUID(),
    title: values.title,
    description: values.description,
    photoNote: values.photoNote || undefined,
    type: values.type,
    path: values.path,
    previewUrl: values.previewUrl,
    tags: values.tags,
    createdAt: existingFile?.createdAt ?? timestamp,
    updatedAt: timestamp,
    projectId: values.projectId,
    taskId: values.taskId,
    noteId: values.noteId,
    ideaId: values.ideaId,
  }
}

function syncTaskFileRefs(tasks: Task[], fileId: string, taskId: string | null) {
  const timestamp = new Date().toISOString()

  return tasks.map((task) => {
    const shouldLink = task.id === taskId
    const hasLink = task.fileIds.includes(fileId)

    if (shouldLink === hasLink) {
      return task
    }

    return {
      ...task,
      fileIds: shouldLink ? uniqueIds([...task.fileIds, fileId]) : task.fileIds.filter((id) => id !== fileId),
      updatedAt: timestamp,
    }
  })
}

function syncNoteFileRefs(notes: Note[], fileId: string, noteId: string | null) {
  const timestamp = new Date().toISOString()

  return notes.map((note) => {
    const shouldLink = note.id === noteId
    const hasLink = note.fileIds.includes(fileId)

    if (shouldLink === hasLink) {
      return note
    }

    return {
      ...note,
      fileIds: shouldLink ? uniqueIds([...note.fileIds, fileId]) : note.fileIds.filter((id) => id !== fileId),
      updatedAt: timestamp,
    }
  })
}

function syncProjectFileRefs(projects: Project[], fileId: string, projectId: string | null) {
  const timestamp = new Date().toISOString()

  return projects.map((project) => {
    const shouldLink = project.id === projectId
    const hasLink = project.fileIds.includes(fileId)

    if (shouldLink === hasLink) {
      return project
    }

    return {
      ...project,
      fileIds: shouldLink ? uniqueIds([...project.fileIds, fileId]) : project.fileIds.filter((id) => id !== fileId),
      updatedAt: timestamp,
    }
  })
}

export function FilesPage() {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const { value: files, setValue: setFiles } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: goals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: sections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  const selectedFile = useMemo(
    () => files.find((file) => file.id === selectedFileId) ?? null,
    [files, selectedFileId],
  )

  const filteredFiles = useMemo(
    () => [...files].sort(compareFiles).filter((file) => parseSearchMatch(file, searchQuery)),
    [files, searchQuery],
  )

  const stats = useMemo(
    () => ({
      total: files.length,
      images: files.filter((file) => file.type === 'image').length,
      linked: files.filter((file) => file.projectId || file.taskId || file.noteId || file.ideaId).length,
      tagged: files.filter((file) => file.tags.length > 0).length,
    }),
    [files],
  )

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ projects, tasks, notes, ideas, files, goals, sections }),
    [files, goals, ideas, notes, projects, sections, tasks],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'file' && item.id === selectedFile?.id)),
    [relationCatalog, selectedFile?.id],
  )

  const selectedFileRelations = useMemo(
    () => (selectedFile ? getLinkedItemsFromRelations(selectedFile.id, relations.filter(isEditableRelation), relationCatalog) : []),
    [relationCatalog, relations, selectedFile],
  )

  function closeModal() {
    setModalMode(null)
    setSelectedFileId(null)
  }

  function openCreateModal() {
    setSelectedFileId(null)
    setModalMode('create')
  }

  function openEditModal(file: FileItem) {
    setSelectedFileId(file.id)
    setModalMode('edit')
  }

  function persistFileRelations(nextFiles: FileItem[], nextTasks: Task[], nextNotes: Note[], nextProjects: Project[]) {
    setFiles(nextFiles)
    setTasks(nextTasks)
    setNotes(nextNotes)
    setProjects(nextProjects)
  }

  function handleCreateFile(values: FileFormValues) {
    const nextFile = buildFileFromForm(values)
    const nextFiles = [nextFile, ...files]
    const nextTasks = syncTaskFileRefs(tasks, nextFile.id, nextFile.taskId)
    const nextNotes = syncNoteFileRefs(notes, nextFile.id, nextFile.noteId)
    const nextProjects = syncProjectFileRefs(projects, nextFile.id, nextFile.projectId)

    persistFileRelations(nextFiles, nextTasks, nextNotes, nextProjects)
    syncRelationsForItem(nextFile.id, 'file', values.relatedItems)
    closeModal()
  }

  function handleUpdateFile(values: FileFormValues) {
    if (!selectedFile) {
      return
    }

    const nextFile = buildFileFromForm(values, selectedFile)
    const nextFiles = files.map((file) => (file.id === selectedFile.id ? nextFile : file))
    const nextTasks = syncTaskFileRefs(tasks, nextFile.id, nextFile.taskId)
    const nextNotes = syncNoteFileRefs(notes, nextFile.id, nextFile.noteId)
    const nextProjects = syncProjectFileRefs(projects, nextFile.id, nextFile.projectId)

    persistFileRelations(nextFiles, nextTasks, nextNotes, nextProjects)
    syncRelationsForItem(nextFile.id, 'file', values.relatedItems)
    closeModal()
  }

  function handleDeleteFile(file: FileItem) {
    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить файл «${file.title}»?`)
      : true

    if (!shouldDelete) {
      return
    }

    const nextFiles = files.filter((item) => item.id !== file.id)
    const nextTasks = syncTaskFileRefs(tasks, file.id, null)
    const nextNotes = syncNoteFileRefs(notes, file.id, null)
    const nextProjects = syncProjectFileRefs(projects, file.id, null)

    persistFileRelations(nextFiles, nextTasks, nextNotes, nextProjects)
    deleteRelationsForItem(file.id)

    if (selectedFileId === file.id) {
      closeModal()
    }
  }

  return (
    <section className="space-y-6">
      <header className="ui-panel p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-(--text-muted)">Asset Library</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-(--text-primary) md:text-4xl">Файлы</h1>
            <p className="page-description mt-3 max-w-3xl text-sm text-(--text-muted) md:text-base">
              Локальная система файлов и фото. Для обычных файлов сохраняется путь на компьютере, для фотографий сохраняется превью, заметка к фото и связи с рабочими сущностями Life OS.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="ui-button-accent px-5 py-3"
          >
            Добавить файл
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Всего</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.total}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Фото</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.images}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Со связями</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.linked}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">С тегами</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.tagged}</p>
          </div>
        </div>
      </header>

      <section className="ui-panel p-5">
        <label className="block text-sm text-(--text-secondary)" htmlFor="files-search">
          Поиск по названию, описанию, пути и тегам
        </label>
        <input
          id="files-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Например, референс, camera, release"
          className="ui-input mt-2"
        />
      </section>

      {filteredFiles.length === 0 ? (
        <EmptyState
          title="Файлы пока не найдены"
          description="Добавьте первый файл или фотографию. Обычные файлы хранят путь к ресурсу, а фотографии получают локальное превью и полные метаданные."
          actionLabel="Добавить файл"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid gap-5 2xl:grid-cols-2">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              relations={relations}
              catalog={relationCatalog}
              onOpenPath={(path) => navigate(path)}
              onChangeLinks={(items) => syncRelationsForItem(file.id, 'file', items)}
              onOpen={openEditModal}
              onEdit={openEditModal}
              onDelete={handleDeleteFile}
            />
          ))}
        </div>
      )}

      {modalMode ? (
        <FileFormModal
          key={`${modalMode}-${selectedFile?.id ?? 'new'}`}
          mode={modalMode}
          file={selectedFile}
          projects={projects}
          tasks={tasks}
          notes={notes}
          ideas={ideas}
          relatedItems={selectedFileRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={closeModal}
          onSubmit={modalMode === 'create' ? handleCreateFile : handleUpdateFile}
        />
      ) : null}
    </section>
  )
}
