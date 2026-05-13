import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/ideas/EmptyState'
import { IdeaCard } from '../components/ideas/IdeaCard'
import { IdeaFormModal, type IdeaFormValues } from '../components/ideas/IdeaFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { Goal, Idea, Note, Project, ProjectSection, ProjectWorkspaceBlock, Relation, Task } from '../types'
import { normalizeIdea, normalizeNote } from '../utils/normalizeEntities'
import { buildRelationCatalog, createRelation, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'
import { detachWorkspaceBlocksFromLinkedEntity, syncWorkspaceBlocksFromLinkedEntity } from '../utils/syncWorkspaceBlocks'
import { getAllTags } from '../utils/tags'

type ModalMode = 'create' | 'edit' | null
type IdeaFilter = 'all' | 'new' | 'thinking' | 'promising' | 'planned' | 'in_progress' | 'implemented' | 'postponed' | 'archived'

const filterLabels: Record<IdeaFilter, string> = {
  all: 'Все',
  new: 'Новые',
  thinking: 'Обдумываются',
  promising: 'Перспективные',
  planned: 'Запланированные',
  in_progress: 'В работе',
  implemented: 'Реализованные',
  postponed: 'Отложенные',
  archived: 'Архив',
}

const VISIBLE_FILTERS: IdeaFilter[] = ['all', 'new', 'in_progress', 'implemented', 'archived']

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

function syncTaskIdeaRefs(tasks: Task[], ideaId: string, taskIds: string[]) {
  return tasks.map((task) => {
    const shouldLink = taskIds.includes(task.id)
    const hasLink = task.ideaIds.includes(ideaId)

    if (shouldLink === hasLink) {
      return task
    }

    return {
      ...task,
      ideaIds: shouldLink
        ? uniqueIds([...task.ideaIds, ideaId])
        : task.ideaIds.filter((id) => id !== ideaId),
      updatedAt: new Date().toISOString(),
    }
  })
}

function syncNoteIdeaRefs(notes: Note[], ideaId: string, noteIds: string[]) {
  return notes.map((note) => {
    const shouldLink = noteIds.includes(note.id)
    const hasLink = note.ideaIds.includes(ideaId)

    if (shouldLink === hasLink) {
      return note
    }

    return {
      ...note,
      ideaIds: shouldLink
        ? uniqueIds([...note.ideaIds, ideaId])
        : note.ideaIds.filter((id) => id !== ideaId),
      updatedAt: new Date().toISOString(),
    }
  })
}

function syncProjectIdeaRefs(projects: Project[], ideaId: string, projectId: string | null) {
  return projects.map((project) => {
    const shouldLink = project.id === projectId
    const hasLink = project.ideaIds.includes(ideaId)

    if (shouldLink === hasLink) {
      return project
    }

    return {
      ...project,
      ideaIds: shouldLink
        ? uniqueIds([...project.ideaIds, ideaId])
        : project.ideaIds.filter((id) => id !== ideaId),
      updatedAt: new Date().toISOString(),
    }
  })
}

function buildIdeaFromForm(values: IdeaFormValues, existingIdea?: Idea): Idea {
  const timestamp = new Date().toISOString()

  return {
    id: existingIdea?.id ?? crypto.randomUUID(),
    title: values.title,
    description: values.description,
    problem: values.problem,
    value: values.value,
    nextStep: values.nextStep,
    status: values.status,
    priority: values.priority,
    difficulty: values.difficulty,
    tags: values.tags,
    createdAt: existingIdea?.createdAt ?? timestamp,
    updatedAt: timestamp,
    projectId: values.projectId,
    taskIds: uniqueIds(values.taskIds),
    noteIds: uniqueIds(values.noteIds),
    goalIds: existingIdea?.goalIds ?? [],
  }
}

function compareIdeas(a: Idea, b: Idea) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function IdeasPage() {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const { value: ideas, setValue: setIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: projectWorkspaceBlocks, setValue: setProjectWorkspaceBlocks } = useLocalStorage<ProjectWorkspaceBlock[]>(storageKeys.projectWorkspaceBlocks, [])
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: goals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: sections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [quickTitle, setQuickTitle] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<IdeaFilter>('all')

  const normalizedIdeas = useMemo(
    () => ideas.map(normalizeIdea),
    [ideas],
  )

  const normalizedNotes = useMemo(
    () => notes.map(normalizeNote),
    [notes],
  )

  const allTags = useMemo(
    () => getAllTags(normalizedIdeas, normalizedNotes, tasks, projects),
    [normalizedIdeas, normalizedNotes, projects, tasks],
  )

  const selectedIdea = useMemo(
    () => normalizedIdeas.find((idea) => idea.id === selectedIdeaId) ?? null,
    [normalizedIdeas, selectedIdeaId],
  )

  const sortedIdeas = useMemo(() => [...normalizedIdeas].sort(compareIdeas), [normalizedIdeas])

  const filteredIdeas = useMemo(() => {
    if (activeFilter === 'all') {
      return sortedIdeas
    }

    return sortedIdeas.filter((idea) => idea.status === activeFilter)
  }, [activeFilter, sortedIdeas])

  const stats = useMemo(
    () => ({
      total: ideas.length,
      implemented: normalizedIdeas.filter((idea) => idea.status === 'implemented').length,
      inProgress: normalizedIdeas.filter((idea) => idea.status === 'in_progress').length,
      linked: normalizedIdeas.filter((idea) => idea.projectId || idea.taskIds.length > 0 || idea.noteIds.length > 0).length,
    }),
    [normalizedIdeas, ideas.length],
  )

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ projects, tasks, notes, ideas, goals, sections }),
    [goals, ideas, notes, projects, sections, tasks],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'idea' && item.id === selectedIdea?.id)),
    [relationCatalog, selectedIdea?.id],
  )

  const selectedIdeaRelations = useMemo(
    () => (selectedIdea ? getLinkedItemsFromRelations(selectedIdea.id, relations.filter(isEditableRelation), relationCatalog) : []),
    [relationCatalog, relations, selectedIdea],
  )

  function closeModal() {
    setModalMode(null)
    setSelectedIdeaId(null)
  }

  function openCreateModal() {
    setSelectedIdeaId(null)
    setModalMode('create')
  }

  function openViewModal(idea: Idea) {
    navigate(`/ideas/${idea.id}`)
  }

  function openEditModal(idea: Idea) {
    setSelectedIdeaId(idea.id)
    setModalMode('edit')
  }

  function persistIdeaRelations(
    nextIdeas: Idea[],
    nextTasks: Task[],
    nextNotes: Note[],
    nextProjects: Project[],
  ) {
    setIdeas(nextIdeas)
    setTasks(nextTasks)
    setNotes(nextNotes)
    setProjects(nextProjects)
  }

  function handleCreateIdea(values: IdeaFormValues) {
    const nextIdea = buildIdeaFromForm(values)
    const nextIdeas = [nextIdea, ...ideas]
    const nextTasks = syncTaskIdeaRefs(tasks, nextIdea.id, nextIdea.taskIds)
    const nextNotes = syncNoteIdeaRefs(notes, nextIdea.id, nextIdea.noteIds)
    const nextProjects = syncProjectIdeaRefs(projects, nextIdea.id, nextIdea.projectId)

    persistIdeaRelations(nextIdeas, nextTasks, nextNotes, nextProjects)
    setProjectWorkspaceBlocks(
      syncWorkspaceBlocksFromLinkedEntity({ entityType: 'idea', entity: nextIdea, blocks: projectWorkspaceBlocks }),
    )
    syncRelationsForItem(nextIdea.id, 'idea', values.relatedItems)
    closeModal()
  }

  function handleUpdateIdea(values: IdeaFormValues) {
    if (!selectedIdea) {
      return
    }

    const nextIdea = buildIdeaFromForm(values, selectedIdea)
    const nextIdeas = ideas.map((idea) => (idea.id === selectedIdea.id ? nextIdea : idea))
    const nextTasks = syncTaskIdeaRefs(tasks, nextIdea.id, nextIdea.taskIds)
    const nextNotes = syncNoteIdeaRefs(notes, nextIdea.id, nextIdea.noteIds)
    const nextProjects = syncProjectIdeaRefs(projects, nextIdea.id, nextIdea.projectId)

    persistIdeaRelations(nextIdeas, nextTasks, nextNotes, nextProjects)
    syncRelationsForItem(nextIdea.id, 'idea', values.relatedItems)
    closeModal()
  }

  function handleDeleteIdea(idea: Idea) {
    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить идею «${idea.title}»?`)
      : true

    if (!shouldDelete) {
      return
    }

    const nextIdeas = ideas.filter((item) => item.id !== idea.id)
    const nextTasks = syncTaskIdeaRefs(tasks, idea.id, [])
    const nextNotes = syncNoteIdeaRefs(notes, idea.id, [])
    const nextProjects = syncProjectIdeaRefs(projects, idea.id, null)

    persistIdeaRelations(nextIdeas, nextTasks, nextNotes, nextProjects)
    setProjectWorkspaceBlocks(detachWorkspaceBlocksFromLinkedEntity(projectWorkspaceBlocks, 'idea', idea.id))
    deleteRelationsForItem(idea.id)

    if (selectedIdeaId === idea.id) {
      closeModal()
    }
  }

  function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = quickTitle.trim()

    if (!title) {
      return
    }

    const nextIdea = buildIdeaFromForm({
      title,
      description: '',
      problem: '',
      value: '',
      nextStep: '',
      status: 'new',
      priority: 'medium',
      difficulty: 'medium',
      tags: [],
      projectId: null,
      taskIds: [],
      noteIds: [],
      relatedItems: [],
    })

    setIdeas((currentIdeas) => [nextIdea, ...currentIdeas])
    setQuickTitle('')
  }

  function handleConvertToTask(idea: Idea) {
    const timestamp = new Date().toISOString()
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: idea.title,
      description: idea.description,
      tags: ['idea'],
      status: 'new',
      priority: 'medium',
      deadline: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      projectId: idea.projectId,
      noteIds: idea.noteIds,
      ideaIds: [idea.id],
      fileIds: [],
      goalIds: [],
    }

    const nextIdea: Idea = {
      ...idea,
      taskIds: uniqueIds([...idea.taskIds, newTask.id]),
      updatedAt: timestamp,
    }
    const nextIdeas = normalizedIdeas.map((item) => (item.id === idea.id ? nextIdea : item))
    const nextTasks = syncTaskIdeaRefs([...tasks, newTask], idea.id, nextIdea.taskIds)
    const nextProjects = projects.map((project) =>
      project.id === idea.projectId
        ? {
            ...project,
            ideaIds: uniqueIds([...project.ideaIds, idea.id]),
            taskIds: uniqueIds([...project.taskIds, newTask.id]),
            updatedAt: timestamp,
          }
        : project,
    )

    setIdeas(nextIdeas)
    setTasks(nextTasks)
    setProjects(nextProjects)
    createRelation(idea.id, 'idea', newTask.id, 'task', 'converted_to_task')
  }

  function handleConvertToNote(idea: Idea) {
    const timestamp = new Date().toISOString()
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: idea.title,
      summary: idea.problem || idea.nextStep,
      content: idea.description,
      type: 'solution',
      status: 'draft',
      tags: ['idea'],
      category: 'ideas',
      createdAt: timestamp,
      updatedAt: timestamp,
      projectId: idea.projectId,
      taskIds: idea.taskIds,
      ideaIds: [idea.id],
      fileIds: [],
      goalIds: [],
    }

    const nextIdea: Idea = {
      ...idea,
      noteIds: uniqueIds([...idea.noteIds, newNote.id]),
      updatedAt: timestamp,
    }
    const nextIdeas = normalizedIdeas.map((item) => (item.id === idea.id ? nextIdea : item))
    const nextNotes = syncNoteIdeaRefs([...normalizedNotes, newNote], idea.id, nextIdea.noteIds)
    const nextProjects = projects.map((project) =>
      project.id === idea.projectId
        ? {
            ...project,
            ideaIds: uniqueIds([...project.ideaIds, idea.id]),
            noteIds: uniqueIds([...project.noteIds, newNote.id]),
            updatedAt: timestamp,
          }
        : project,
    )

    setIdeas(nextIdeas)
    setNotes(nextNotes)
    setProjects(nextProjects)
    createRelation(idea.id, 'idea', newNote.id, 'note', 'converted_to_note')
  }

  return (
    <section className="space-y-4">
      <PageHeader
        section="ideas"
        title="Идеи"
        description="Быстрый список мыслей и гипотез. Сложные связи и оценка остаются внутри detail view."
        actionLabel="Добавить идею"
        onAction={openCreateModal}
      />

      <section className="ui-panel p-4 md:p-4.5">
        <div className="flex flex-wrap gap-2 text-sm text-(--text-secondary)">
          <span className="ui-chip">Всего {stats.total}</span>
          <span className="ui-chip">В работе {stats.inProgress}</span>
          <span className={stats.implemented > 0 ? 'ui-chip border-(--completed-border) bg-(--completed-bg) text-(--completed-text)' : 'ui-chip'}>Реализовано {stats.implemented}</span>
          <span className="ui-chip">Со связями {stats.linked}</span>
        </div>
      </section>

      <section className="ui-panel p-4 md:p-5">
        <div className="ui-filter-scroll mb-4">
          {VISIBLE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={[
                'ui-filter-pill',
                activeFilter === filter
                  ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                  : 'hover:border-(--accent-border) hover:text-(--text-primary)',
              ].join(' ')}
            >
              {filterLabels[filter]}
            </button>
          ))}
        </div>

        <form onSubmit={handleQuickAdd} className="flex flex-col gap-3 lg:flex-row">
          <input
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            className="ui-input flex-1"
            placeholder="Быстрое добавление идеи..."
          />
          <button
            type="submit"
            className="ui-button-accent px-4 py-3"
          >
            Добавить быстро
          </button>
        </form>
      </section>

      {filteredIdeas.length === 0 ? (
        <EmptyState
          title="Идеи пока не добавлены"
          description="Добавьте первую идею через быстрый ввод или откройте полную форму. Все данные сохраняются в localStorage."
          actionLabel="Создать идею"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-2">
          {filteredIdeas.map((idea) => {
            const linkedProject = projects.find((project) => project.id === idea.projectId) ?? null
            const linkedTasks = tasks.filter((task) => idea.taskIds.includes(task.id))
            const linkedNotes = normalizedNotes.filter((note) => idea.noteIds.includes(note.id))

            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                linkedProject={linkedProject}
                linkedTasks={linkedTasks}
                linkedNotes={linkedNotes}
                onOpen={openViewModal}
                onEdit={openEditModal}
                onDelete={handleDeleteIdea}
                onConvertToTask={handleConvertToTask}
                onConvertToNote={handleConvertToNote}
              />
            )
          })}
        </div>
      )}

      {modalMode ? (
        <IdeaFormModal
          key={`${modalMode}-${selectedIdea?.id ?? 'new'}`}
          mode={modalMode}
          idea={selectedIdea}
          projects={projects}
          tasks={tasks}
          notes={normalizedNotes}
          availableTags={allTags}
          relatedItems={selectedIdeaRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={closeModal}
          onSubmit={modalMode === 'create' ? handleCreateIdea : handleUpdateIdea}
        />
      ) : null}
    </section>
  )
}
