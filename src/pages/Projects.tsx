import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/projects/EmptyState'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectFormModal, type ProjectFormValues } from '../components/projects/ProjectFormModal'
import { createProjectSection, defaultProjectSectionTitles, projectStatusLabels } from '../components/projects/projectMeta'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, Relation, Task } from '../types'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'

type ProjectFilter = 'all' | 'active' | 'paused' | 'completed' | 'archived'

const filterLabels: Record<ProjectFilter, string> = {
  all: 'All',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
}

function toDeadlineValue(value: string) {
  if (!value) {
    return null
  }

  return new Date(`${value}T12:00:00`).toISOString()
}

function buildProject(values: ProjectFormValues, existingProject?: Project): Project {
  const timestamp = new Date().toISOString()

  return {
    id: existingProject?.id ?? crypto.randomUUID(),
    title: values.title,
    description: values.description,
    status: values.status,
    goal: values.goal,
    deadline: toDeadlineValue(values.deadline),
    createdAt: existingProject?.createdAt ?? timestamp,
    updatedAt: timestamp,
    sectionIds: existingProject?.sectionIds ?? [],
    taskIds: existingProject?.taskIds ?? [],
    noteIds: existingProject?.noteIds ?? [],
    ideaIds: existingProject?.ideaIds ?? [],
    fileIds: existingProject?.fileIds ?? [],
    goalIds: existingProject?.goalIds ?? [],
  }
}

function compareProjects(a: Project, b: Project) {
  const statusRank = {
    active: 0,
    paused: 1,
    completed: 2,
    archived: 3,
  }

  if (statusRank[a.status] !== statusRank[b.status]) {
    return statusRank[a.status] - statusRank[b.status]
  }

  if (a.deadline && b.deadline) {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  }

  if (a.deadline) {
    return -1
  }

  if (b.deadline) {
    return 1
  }

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function matchesProject(project: Project, itemProjectId: string | null, itemId: string, linkedIds: string[]) {
  return itemProjectId === project.id || linkedIds.includes(itemId)
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const { value: projects, setValue: setProjects } = useLocalStorage<Project[]>(storageKeys.projects, [])
  const { value: sections, setValue: setSections } = useLocalStorage<ProjectSection[]>(storageKeys.projectSections, [])
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: notes, setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { value: ideas, setValue: setIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { value: files, setValue: setFiles } = useLocalStorage<FileItem[]>(storageKeys.files, [])
  const { value: goals, setValue: setGoals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { value: relations } = useLocalStorage<Relation[]>(storageKeys.relations, [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all')

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? null,
    [editingProjectId, projects],
  )

  const sortedProjects = useMemo(() => [...projects].sort(compareProjects), [projects])

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') {
      return sortedProjects
    }

    return sortedProjects.filter((project) => project.status === activeFilter)
  }, [activeFilter, sortedProjects])

  const projectCounts = useMemo(() => {
    return Object.fromEntries(
      projects.map((project) => {
        const linkedTasks = tasks.filter((item) => matchesProject(project, item.projectId, item.id, project.taskIds))
        const linkedNotes = notes.filter((item) => matchesProject(project, item.projectId, item.id, project.noteIds))
        const linkedIdeas = ideas.filter((item) => matchesProject(project, item.projectId, item.id, project.ideaIds))
        const linkedFiles = files.filter((item) => matchesProject(project, item.projectId, item.id, project.fileIds))

        return [
          project.id,
          {
            tasks: linkedTasks.length,
            notes: linkedNotes.length,
            ideas: linkedIdeas.length,
            files: linkedFiles.length,
          },
        ]
      }),
    )
  }, [files, ideas, notes, projects, tasks])

  const projectCompletion = useMemo(
    () =>
      Object.fromEntries(
        projects.map((project) => {
          const linkedTasks = tasks.filter((item) => matchesProject(project, item.projectId, item.id, project.taskIds))
          const completedTasks = linkedTasks.filter((task) => task.status === 'completed').length
          const completionRate = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0

          return [project.id, completionRate]
        }),
      ),
    [projects, tasks],
  )

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === 'active').length,
      paused: projects.filter((project) => project.status === 'paused').length,
      archived: projects.filter((project) => project.status === 'archived').length,
    }),
    [projects],
  )

  const relationCatalog = useMemo(
    () => buildRelationCatalog({ tasks, notes, ideas, projects, files, goals, sections }),
    [files, goals, ideas, notes, projects, sections, tasks],
  )

  const availableRelationItems = useMemo(
    () => relationCatalog.filter((item) => !(item.type === 'project' && item.id === editingProject?.id)),
    [editingProject?.id, relationCatalog],
  )

  const selectedProjectRelations = useMemo(
    () => (editingProject ? getLinkedItemsFromRelations(editingProject.id, relations.filter(isEditableRelation), relationCatalog) : []),
    [editingProject, relationCatalog, relations],
  )

  function closeModal() {
    setEditingProjectId(null)
    setIsModalOpen(false)
  }

  function openCreateModal() {
    setEditingProjectId(null)
    setIsModalOpen(true)
  }

  function openEditModal(project: Project) {
    setEditingProjectId(project.id)
    setIsModalOpen(true)
  }

  function handleCreateProject(values: ProjectFormValues) {
    const projectId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const defaultSections = defaultProjectSectionTitles.map((title, index) =>
      createProjectSection({
        projectId,
        title,
        order: index,
      }),
    )

    const nextProject: Project = {
      ...buildProject(values, {
        id: projectId,
        title: '',
        description: '',
        status: 'active',
        goal: '',
        deadline: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        sectionIds: defaultSections.map((section) => section.id),
        taskIds: [],
        noteIds: [],
        ideaIds: [],
        fileIds: [],
        goalIds: [],
      }),
      sectionIds: defaultSections.map((section) => section.id),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setProjects((currentProjects) => [nextProject, ...currentProjects])
    setSections((currentSections) => [...currentSections, ...defaultSections])
    syncRelationsForItem(nextProject.id, 'project', values.relatedItems)
    closeModal()
  }

  function handleUpdateProject(values: ProjectFormValues) {
    if (!editingProject) {
      return
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === editingProject.id ? buildProject(values, project) : project,
      ),
    )
    syncRelationsForItem(editingProject.id, 'project', values.relatedItems)
    closeModal()
  }

  function handleDeleteProject(project: Project) {
    const shouldDelete = settings.behavior.askBeforeDelete
      ? window.confirm(`Удалить проект «${project.title}»? Рабочая поверхность будет очищена, а связанные элементы отвяжутся от проекта.`)
      : true

    if (!shouldDelete) {
      return
    }

    setProjects((currentProjects) => currentProjects.filter((item) => item.id !== project.id))
    setSections((currentSections) => currentSections.filter((item) => item.projectId !== project.id))
    setTasks((currentTasks) => currentTasks.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setNotes((currentNotes) => currentNotes.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setIdeas((currentIdeas) => currentIdeas.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setFiles((currentFiles) => currentFiles.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    setGoals((currentGoals) => currentGoals.map((item) => (item.projectId === project.id ? { ...item, projectId: null, updatedAt: new Date().toISOString() } : item)))
    deleteRelationsForItem(project.id)

    if (editingProjectId === project.id) {
      closeModal()
    }
  }

  return (
    <section className="space-y-6">
      <header className="ui-panel p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-(--text-muted)">Project Control</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-(--text-primary) md:text-4xl">Проекты</h1>
            <p className="page-description mt-2 max-w-3xl text-sm text-(--text-muted) md:text-base">
              Главная рабочая поверхность Life OS. Здесь создаются проекты, формируется контекст, а затем каждый проект раскрывается в отдельное рабочее пространство.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="ui-button-accent px-5 py-3"
          >
            Создать проект
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Всего</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.total}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{projectStatusLabels.active}</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.active}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{projectStatusLabels.paused}</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.paused}</p>
          </div>
          <div className="ui-stat-card">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">{projectStatusLabels.archived}</p>
            <p className="mt-2 text-3xl font-semibold text-(--text-primary)">{stats.archived}</p>
          </div>
        </div>
      </header>

      <section className="ui-panel p-5">
        <div className="ui-filter-scroll">
          {(Object.keys(filterLabels) as ProjectFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={[
                'ui-filter-pill',
                activeFilter === filter
                  ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent) shadow-[0_6px_18px_rgba(57,39,255,0.12)]'
                  : 'hover:border-(--accent-border) hover:text-(--text-primary)',
              ].join(' ')}
            >
              {filterLabels[filter]}
            </button>
          ))}
        </div>
      </section>

      {filteredProjects.length > 0 ? (
        <div className="grid gap-5 2xl:grid-cols-2">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              counts={projectCounts[project.id] ?? { tasks: 0, notes: 0, ideas: 0, files: 0 }}
              completionRate={projectCompletion[project.id] ?? 0}
              onEdit={openEditModal}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Проекты пока не созданы"
          description="Создайте первый проект и превратите раздел Projects в основную рабочую поверхность: со своими секциями, связанными задачами, заметками, идеями и материалами."
          actionLabel="Создать проект"
          onAction={openCreateModal}
        />
      )}

      {isModalOpen ? (
        <ProjectFormModal
          mode={editingProject ? 'edit' : 'create'}
          project={editingProject}
          relatedItems={selectedProjectRelations}
          availableRelationItems={availableRelationItems}
          onOpenRelatedItem={(item) => navigate(getLinkedItemPath(item))}
          onClose={closeModal}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        />
      ) : null}
    </section>
  )
}
