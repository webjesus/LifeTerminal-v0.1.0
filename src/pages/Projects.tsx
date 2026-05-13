import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/projects/EmptyState'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectFormModal, type ProjectFormValues } from '../components/projects/ProjectFormModal'
import { createProjectSection, defaultProjectSectionTitles } from '../components/projects/projectMeta'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, Relation, Task } from '../types'
import { buildRelationCatalog, deleteRelationsForItem, getLinkedItemPath, getLinkedItemsFromRelations, isEditableRelation, syncRelationsForItem } from '../utils/relations'
import { storageKeys } from '../utils/storage'

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
    details: existingProject?.details ?? '',
    tags: existingProject?.tags ?? [],
    status: values.status,
    priority: existingProject?.priority ?? 'medium',
    goal: values.goal,
    deadline: toDeadlineValue(values.deadline),
    color: existingProject?.color ?? '',
    icon: existingProject?.icon ?? '',
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
    planning: 0,
    active: 0,
    paused: 2,
    completed: 3,
    archived: 4,
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

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? null,
    [editingProjectId, projects],
  )

  const sortedProjects = useMemo(() => [...projects].sort(compareProjects), [projects])

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
      inactive: projects.filter((project) => project.status === 'paused' || project.status === 'planning').length,
      completed: projects.filter((project) => project.status === 'completed').length,
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
        tags: [],
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
    <section className="space-y-4">
      <PageHeader
        section="projects"
        title="Проекты"
        description="Оглавление ваших проектов: что активно, какой прогресс и куда зайти дальше."
        actionLabel="Создать проект"
        onAction={openCreateModal}
      />

      <section className="ui-panel p-4 md:p-4.5">
        <div className="flex flex-wrap gap-2 text-sm text-(--text-secondary)">
          <span className="ui-chip">Всего {stats.total}</span>
          <span className="ui-chip">Активные {stats.active}</span>
          <span className="ui-chip">На паузе {stats.inactive}</span>
          <span className={stats.completed > 0 ? 'ui-chip border-(--completed-border) bg-(--completed-bg) text-(--completed-text)' : 'ui-chip'}>Завершённые {stats.completed}</span>
          <span className="ui-chip">Архив {stats.archived}</span>
        </div>
      </section>

      {sortedProjects.length > 0 ? (
        <div className="grid gap-5 2xl:grid-cols-2">
          {sortedProjects.map((project) => (
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
