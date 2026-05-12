import type { FileItem, Goal, Idea, Note, Project, ProjectSection, ProjectWorkspaceBlock, ProjectWorkspaceRelation, Relation, Task } from '../../types'
import { ProjectRelationMap } from './ProjectRelationMap'
import { EmptyState } from './EmptyState'
import { projectWorkspaceRelationLabels } from './projectMeta'

type ProjectRelationsTabProps = {
  project: Project
  sections: ProjectSection[]
  blocks: ProjectSection[]
  tasks: Task[]
  notes: Note[]
  ideas: Idea[]
  files: FileItem[]
  goals: Goal[]
  relations: Relation[]
  workspaceBlocks: ProjectWorkspaceBlock[]
  workspaceRelations: ProjectWorkspaceRelation[]
  onOpenNode: (node: { id: string; type: Relation['sourceType'] }) => void
  onOpenWorkspaceBlock: (blockId: string) => void
  onDeleteRelation: (relationId: string) => void
  onSelectRelation: (relationId: string | null) => void
}

export function ProjectRelationsTab({
  project,
  sections,
  blocks,
  tasks,
  notes,
  ideas,
  files,
  goals,
  relations,
  workspaceBlocks,
  workspaceRelations,
  onOpenNode,
  onOpenWorkspaceBlock,
  onDeleteRelation,
  onSelectRelation,
}: ProjectRelationsTabProps) {
  const safeWorkspaceBlocks = Array.isArray(workspaceBlocks) ? workspaceBlocks : []
  const safeWorkspaceRelations = Array.isArray(workspaceRelations) ? workspaceRelations : []
  const blockById = new Map(safeWorkspaceBlocks.map((block) => [block.id, block]))
  const linkedEntityTitleMap = new Map<string, string>([
    ...tasks.map((task) => [`task:${task.id}`, task.title] as const),
    ...notes.map((note) => [`note:${note.id}`, note.title] as const),
    ...ideas.map((idea) => [`idea:${idea.id}`, idea.title] as const),
    ...files.map((file) => [`file:${file.id}`, file.title] as const),
    ...goals.map((goal) => [`goal:${goal.id}`, goal.title] as const),
  ])
  const implicitLinkedRelations = safeWorkspaceBlocks
    .filter((block) => block.linkedItemType && block.linkedItemId)
    .map((block) => ({
      id: `linked:${block.id}`,
      fromTitle: block.title,
      relationLabel: 'Связан с объектом',
      toTitle: linkedEntityTitleMap.get(`${block.linkedItemType}:${block.linkedItemId}`) ?? 'Связанный объект не найден',
      blockId: block.id,
    }))

  return (
    <section className="space-y-6">
      <ProjectRelationMap
        project={project}
        sections={sections}
        blocks={blocks}
        tasks={tasks}
        notes={notes}
        ideas={ideas}
        files={files}
        goals={goals}
        relations={relations}
        onOpenNode={onOpenNode}
      />

      <section className="ui-panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Связи</p>
        <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Связи проекта</h2>
        <div className="mt-5 space-y-3">
          {safeWorkspaceRelations.length > 0 ? safeWorkspaceRelations.map((relation) => {
            const fromBlock = blockById.get(relation.fromBlockId)
            const toBlock = blockById.get(relation.toBlockId)
            const isBroken = !fromBlock || !toBlock

            return (
              <article key={relation.id} className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">{isBroken ? 'Связь повреждена' : 'Связь рабочей области'}</p>
                    <p className="mt-2 text-sm font-semibold text-(--text-primary)">{fromBlock?.title ?? 'Блок удалён'}</p>
                    <p className="mt-1 text-sm text-(--text-secondary)">{projectWorkspaceRelationLabels[relation.type]}</p>
                    <p className="mt-1 text-sm font-semibold text-(--text-primary)">{toBlock?.title ?? 'Блок удалён'}</p>
                    {relation.label ? <p className="mt-2 text-sm text-(--text-muted)">{relation.label}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fromBlock ? <button type="button" onClick={() => { onSelectRelation(relation.id); onOpenWorkspaceBlock(fromBlock.id) }} className="ui-button px-3 py-2 text-sm">К исходному</button> : null}
                    {toBlock ? <button type="button" onClick={() => { onSelectRelation(relation.id); onOpenWorkspaceBlock(toBlock.id) }} className="ui-button px-3 py-2 text-sm">К целевому</button> : null}
                    <button type="button" onClick={() => onDeleteRelation(relation.id)} className="ui-button-danger px-3 py-2 text-sm">Удалить связь</button>
                  </div>
                </div>
              </article>
            )
          }) : implicitLinkedRelations.length > 0 ? implicitLinkedRelations.map((relation) => (
            <article key={relation.id} className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">Связанный элемент рабочей области</p>
                  <p className="mt-2 text-sm font-semibold text-(--text-primary)">{relation.fromTitle}</p>
                  <p className="mt-1 text-sm text-(--text-secondary)">{relation.relationLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-(--text-primary)">{relation.toTitle}</p>
                </div>
                <button type="button" onClick={() => onOpenWorkspaceBlock(relation.blockId)} className="ui-button px-3 py-2 text-sm">Открыть блок</button>
              </div>
            </article>
          )) : <EmptyState title="Связей пока нет" description="Связывайте задачи, идеи, заметки и файлы, чтобы проект стал понятной системой." actionLabel="Открыть рабочую область" onAction={() => onOpenNode({ id: project.id, type: 'project' })} />}
        </div>
      </section>
    </section>
  )
}
