import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IdeaFormModal, type IdeaFormValues } from '../components/ideas/IdeaFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Goal, Idea, Note, Project, ProjectSection, ProjectWorkspaceBlock, Relation, Task } from '../types'
import { normalizeIdea, normalizeNote } from '../utils/normalizeEntities'
import {
  buildRelationCatalog,
  createRelation,
  deleteRelationsForItem,
  getLinkedItemPath,
  getLinkedItemsFromRelations,
  isEditableRelation,
  syncRelationsForItem,
} from '../utils/relations'
import { storageKeys } from '../utils/storage'
import { detachWorkspaceBlocksFromLinkedEntity, syncWorkspaceBlocksFromLinkedEntity } from '../utils/syncWorkspaceBlocks'
import { getAllTags } from '../utils/tags'

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function buildIdeaFromForm(values: IdeaFormValues, existingIdea: Idea): Idea {
  return {
    ...existingIdea,
    title: values.title,
    description: values.description,
    problem: values.problem,
    value: values.value,
    nextStep: values.nextStep,
    status: values.status,
    priority: values.priority,
    difficulty: values.difficulty,
    tags: values.tags,
    projectId: values.projectId,
    taskIds: values.taskIds,
    noteIds: values.noteIds,
    updatedAt: new Date().toISOString(),
  }
}

const statusLabels: Record<Idea['status'], string> = {
  new: 'Новая',
  thinking: 'Обдумывается',
  promising: 'Перспективная',
  planned: 'Запланирована',
  in_progress: 'В работе',
  implemented: 'Реализована',
  postponed: 'Отложена',
  archived: 'Архив',
}

const priorityLabels: Record<Idea['priority'], string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

const difficultyLabels: Record<Idea['difficulty'], string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
}

export function IdeaDetailPage() {
  const { ideaId } = useParams<{ ideaId: string }>()
  const navigate = useNavigate()

  const { value: ideas, setValue: setIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { setValue: setProjectWorkspaceBlocks } = useLocalStorage<ProjectWorkspaceBlock[]>(storageKeys.projectWorkspaceBlocks, [])
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: goals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: sections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])

  const [isEditOpen, setIsEditOpen] = useState(false)

  const normalizedIdeas = useMemo(() => ideas.map(normalizeIdea), [ideas])
  const normalizedNotes = useMemo(() => notes.map(normalizeNote), [notes])
  const idea = useMemo(() => normalizedIdeas.find((item) => item.id === ideaId) ?? null, [ideaId, normalizedIdeas])

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ tasks, notes: normalizedNotes, ideas: normalizedIdeas, projects, goals, sections }),
    [goals, normalizedIdeas, normalizedNotes, projects, sections, tasks],
  )

  const selectedIdeaRelations = useMemo(
    () => (idea ? getLinkedItemsFromRelations(idea.id, relations.filter(isEditableRelation), relationCatalog) : []),
    [idea, relationCatalog, relations],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'idea' && item.id === idea?.id)),
    [idea?.id, relationCatalog],
  )

  const allTags = useMemo(() => getAllTags(normalizedIdeas, normalizedNotes, tasks, projects), [normalizedIdeas, normalizedNotes, projects, tasks])

  if (!idea) {
    return (
      <section className="ui-panel p-6">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Идея не найдена</h1>
        <p className="mt-3 text-sm text-(--text-muted)">Запись была удалена или ссылка устарела.</p>
        <button type="button" onClick={() => navigate('/ideas')} className="ui-button mt-4 px-4 py-2">Вернуться к идеям</button>
      </section>
    )
  }

  const currentIdea = idea

  function handleUpdateIdea(values: IdeaFormValues) {
    const nextIdea = buildIdeaFromForm(values, currentIdea)

    setIdeas((currentIdeas) => currentIdeas.map((item) => (item.id === currentIdea.id ? nextIdea : item)))
    setProjectWorkspaceBlocks((currentBlocks) =>
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'idea', entity: nextIdea, blocks: currentBlocks }),
    )
    syncRelationsForItem(currentIdea.id, 'idea', values.relatedItems)
    setIsEditOpen(false)
  }

  function handleDeleteIdea() {
    const shouldDelete = window.confirm(`Удалить идею «${currentIdea.title}»?`)

    if (!shouldDelete) {
      return
    }

    setIdeas((currentIdeas) => currentIdeas.filter((item) => item.id !== currentIdea.id))
    setProjectWorkspaceBlocks((currentBlocks) => detachWorkspaceBlocksFromLinkedEntity(currentBlocks, 'idea', currentIdea.id))
    deleteRelationsForItem(currentIdea.id)
    navigate('/ideas')
  }

  function createTaskFromIdea() {
    const timestamp = new Date().toISOString()
    const nextTask: Task = {
      id: crypto.randomUUID(),
      title: currentIdea.title,
      description: currentIdea.description,
      tags: uniqueIds(['idea', ...currentIdea.tags]),
      status: 'new',
      priority: 'medium',
      deadline: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      projectId: currentIdea.projectId,
      noteIds: currentIdea.noteIds,
      ideaIds: [currentIdea.id],
      fileIds: [],
      goalIds: [],
    }

    setTasks((currentTasks) => [nextTask, ...currentTasks])
    setIdeas((currentIdeas) => currentIdeas.map((item) => (
      item.id === currentIdea.id
        ? { ...item, taskIds: uniqueIds([...item.taskIds, nextTask.id]), updatedAt: timestamp }
        : item
    )))

    setProjects((currentProjects) => currentProjects.map((project) => (
      project.id === currentIdea.projectId
        ? {
            ...project,
            taskIds: uniqueIds([...project.taskIds, nextTask.id]),
            ideaIds: uniqueIds([...project.ideaIds, currentIdea.id]),
            updatedAt: timestamp,
          }
        : project
    )))

    createRelation(currentIdea.id, 'idea', nextTask.id, 'task', 'converted_to_task')
  }

  function createNoteFromIdea() {
    const timestamp = new Date().toISOString()
    const nextNote: Note = {
      id: crypto.randomUUID(),
      title: currentIdea.title,
      summary: currentIdea.problem || currentIdea.nextStep,
      content: currentIdea.description,
      type: 'solution',
      status: 'draft',
      tags: uniqueIds(['idea', ...currentIdea.tags]),
      category: 'ideas',
      createdAt: timestamp,
      updatedAt: timestamp,
      projectId: currentIdea.projectId,
      taskIds: currentIdea.taskIds,
      ideaIds: [currentIdea.id],
      fileIds: [],
      goalIds: [],
    }

    setNotes((currentNotes) => [nextNote, ...currentNotes])
    setIdeas((currentIdeas) => currentIdeas.map((item) => (
      item.id === currentIdea.id
        ? { ...item, noteIds: uniqueIds([...item.noteIds, nextNote.id]), updatedAt: timestamp }
        : item
    )))

    setProjects((currentProjects) => currentProjects.map((project) => (
      project.id === currentIdea.projectId
        ? {
            ...project,
            noteIds: uniqueIds([...project.noteIds, nextNote.id]),
            ideaIds: uniqueIds([...project.ideaIds, currentIdea.id]),
            updatedAt: timestamp,
          }
        : project
    )))

    createRelation(currentIdea.id, 'idea', nextNote.id, 'note', 'converted_to_note')
  }

  function assignToProject() {
    if (currentIdea.projectId || projects.length === 0) {
      return
    }

    const project = projects[0]
    const timestamp = new Date().toISOString()

    setIdeas((currentIdeas) => currentIdeas.map((item) => (
      item.id === currentIdea.id ? { ...item, projectId: project.id, updatedAt: timestamp } : item
    )))

    setProjects((currentProjects) => currentProjects.map((item) => (
      item.id === project.id
        ? { ...item, ideaIds: uniqueIds([...item.ideaIds, currentIdea.id]), updatedAt: timestamp }
        : item
    )))
  }

  function postponeIdea() {
    setIdeas((currentIdeas) => currentIdeas.map((item) => (
      item.id === currentIdea.id ? { ...item, status: 'postponed', updatedAt: new Date().toISOString() } : item
    )))
  }

  function archiveIdea() {
    setIdeas((currentIdeas) => currentIdeas.map((item) => (
      item.id === currentIdea.id ? { ...item, status: 'archived', updatedAt: new Date().toISOString() } : item
    )))
  }

  return (
    <section className="space-y-6">
      <header className="ui-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button type="button" onClick={() => navigate('/ideas')} className="ui-button px-3 py-2">Назад к идеям</button>
            <h1 className="mt-3 text-3xl font-semibold text-(--text-primary)">{currentIdea.title}</h1>
            <p className="mt-2 text-sm text-(--text-muted)">{currentIdea.description || 'Описание не заполнено.'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="ui-chip">{statusLabels[currentIdea.status]}</span>
              <span className="ui-chip">Приоритет: {priorityLabels[currentIdea.priority]}</span>
              <span className="ui-chip">Сложность: {difficultyLabels[currentIdea.difficulty]}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsEditOpen(true)} className="ui-button-accent px-4 py-3">Редактировать</button>
            <button type="button" onClick={handleDeleteIdea} className="ui-button-danger px-4 py-3">Удалить</button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="ui-panel p-5 md:p-6 space-y-5">
          <section>
            <h2 className="ui-section-title">Проблема</h2>
            <p className="mt-2 text-sm text-(--text-secondary)">{currentIdea.problem || 'Не указана'}</p>
          </section>
          <section>
            <h2 className="ui-section-title">Польза</h2>
            <p className="mt-2 text-sm text-(--text-secondary)">{currentIdea.value || 'Не указана'}</p>
          </section>
          <section>
            <h2 className="ui-section-title">Следующий шаг</h2>
            <p className="mt-2 text-sm text-(--text-secondary)">{currentIdea.nextStep || 'Не указан'}</p>
          </section>
        </article>

        <aside className="space-y-4">
          <section className="ui-panel p-5">
            <h3 className="text-sm uppercase tracking-[0.16em] text-(--text-muted)">Теги</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentIdea.tags.length > 0 ? currentIdea.tags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>) : <p className="text-sm text-(--text-muted)">Теги не добавлены</p>}
            </div>
          </section>
          <section className="ui-panel p-5 text-sm text-(--text-muted)">
            <p>Создана: {formatDateTime(currentIdea.createdAt)}</p>
            <p className="mt-2">Обновлена: {formatDateTime(currentIdea.updatedAt)}</p>
          </section>
        </aside>
      </div>

      <section className="ui-panel p-5">
        <h2 className="ui-section-title">Действия</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={createTaskFromIdea} className="ui-button-accent px-4 py-3">Создать задачу из идеи</button>
          <button type="button" onClick={createNoteFromIdea} className="ui-button px-4 py-3">Создать заметку из идеи</button>
          <button type="button" onClick={assignToProject} className="ui-button px-4 py-3">Добавить в проект</button>
          <button type="button" onClick={postponeIdea} className="ui-button px-4 py-3">Отложить</button>
          <button type="button" onClick={archiveIdea} className="ui-button-danger px-4 py-3">Архивировать</button>
        </div>
      </section>

      {isEditOpen ? (
        <IdeaFormModal
          mode="edit"
          idea={currentIdea}
          projects={projects}
          tasks={tasks}
          notes={normalizedNotes}
          availableTags={allTags}
          relatedItems={selectedIdeaRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdateIdea}
        />
      ) : null}
    </section>
  )
}
