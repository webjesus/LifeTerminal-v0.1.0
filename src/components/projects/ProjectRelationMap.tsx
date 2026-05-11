import { useMemo, useState } from 'react'
import type { FileItem, Goal, Idea, Note, Project, ProjectSection, Relation, RelationEntityType, Task } from '../../types'
import { workspaceItemKindBadges } from './projectMeta'

type ProjectRelationMapProps = {
  project: Project
  sections: ProjectSection[]
  blocks: ProjectSection[]
  tasks: Task[]
  notes: Note[]
  ideas: Idea[]
  files: FileItem[]
  goals: Goal[]
  relations: Relation[]
  onOpenNode: (node: { id: string; type: RelationEntityType }) => void
}

type MapNode = {
  id: string
  type: RelationEntityType
  title: string
  subtitle: string
  badge: string
  badgeClassName: string
}

function getLayout(nodesCount: number) {
  const columns = nodesCount <= 1 ? 1 : nodesCount <= 4 ? 2 : nodesCount <= 9 ? 3 : 4
  const rows = Math.max(1, Math.ceil(nodesCount / columns))
  const cardWidth = 196
  const cardHeight = 116
  const gapX = 24
  const gapY = 24

  return {
    columns,
    rows,
    cardWidth,
    cardHeight,
    gapX,
    gapY,
    width: columns * cardWidth + (columns - 1) * gapX,
    height: rows * cardHeight + (rows - 1) * gapY,
  }
}

function getNodeBadgeForFile(block?: ProjectSection) {
  if (!block) {
    return {
      badge: 'FILE',
      badgeClassName: 'border-stone-400/35 bg-stone-900/50 text-stone-200',
    }
  }

  const badge = workspaceItemKindBadges[block.kind === 'photo' || block.kind === 'link' ? block.kind : 'file']

  return {
    badge: badge.shortLabel,
    badgeClassName: badge.className,
  }
}

function getUniqueEdges(relations: Relation[], nodeIds: Set<string>) {
  const seen = new Set<string>()

  return relations.filter((relation) => {
    if (!nodeIds.has(relation.sourceId) || !nodeIds.has(relation.targetId) || relation.sourceId === relation.targetId) {
      return false
    }

    const key = [relation.sourceId, relation.targetId].sort().join('::')

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function ProjectRelationMap({
  project,
  sections,
  blocks,
  tasks,
  notes,
  ideas,
  files,
  goals,
  relations,
  onOpenNode,
}: ProjectRelationMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const nodes = useMemo<MapNode[]>(() => {
    const blockByEntityId = new Map(
      blocks.filter((block) => block.entityId).map((block) => [block.entityId!, block]),
    )

    return [
      ...sections.map((section) => ({
        id: section.id,
        type: 'project_section' as const,
        title: section.title,
        subtitle: section.description || 'Подраздел проекта',
        badge: 'SEC',
        badgeClassName: 'border-[#e0e5ee] bg-[#f7f9fc] text-[#667085]',
      })),
      ...tasks.map((task) => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        subtitle: task.description || 'Задача проекта',
        badge: workspaceItemKindBadges.task.shortLabel,
        badgeClassName: workspaceItemKindBadges.task.className,
      })),
      ...notes.map((note) => ({
        id: note.id,
        type: 'note' as const,
        title: note.title,
        subtitle: note.content || 'Заметка проекта',
        badge: workspaceItemKindBadges.note.shortLabel,
        badgeClassName: workspaceItemKindBadges.note.className,
      })),
      ...ideas.map((idea) => ({
        id: idea.id,
        type: 'idea' as const,
        title: idea.title,
        subtitle: idea.description || 'Идея проекта',
        badge: workspaceItemKindBadges.idea.shortLabel,
        badgeClassName: workspaceItemKindBadges.idea.className,
      })),
      ...goals.map((goal) => ({
        id: goal.id,
        type: 'goal' as const,
        title: goal.title,
        subtitle: goal.description || 'Цель проекта',
        badge: workspaceItemKindBadges.goal.shortLabel,
        badgeClassName: workspaceItemKindBadges.goal.className,
      })),
      ...files.map((file) => {
        const fileBadge = getNodeBadgeForFile(blockByEntityId.get(file.id))

        return {
          id: file.id,
          type: 'file' as const,
          title: file.title,
          subtitle: file.description || file.path || 'Файл проекта',
          badge: fileBadge.badge,
          badgeClassName: fileBadge.badgeClassName,
        }
      }),
    ]
  }, [blocks, files, goals, ideas, notes, sections, tasks])

  const layout = useMemo(() => getLayout(nodes.length), [nodes.length])

  const nodePositions = useMemo(
    () =>
      Object.fromEntries(
        nodes.map((node, index) => {
          const column = index % layout.columns
          const row = Math.floor(index / layout.columns)
          const left = column * (layout.cardWidth + layout.gapX)
          const top = row * (layout.cardHeight + layout.gapY)

          return [
            node.id,
            {
              left,
              top,
              centerX: left + layout.cardWidth / 2,
              centerY: top + layout.cardHeight / 2,
            },
          ]
        }),
      ),
    [layout.cardHeight, layout.cardWidth, layout.columns, layout.gapX, layout.gapY, nodes],
  )

  const nodeIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes])
  const edges = useMemo(() => getUniqueEdges(relations, nodeIds), [nodeIds, relations])

  const activeNodeId = hoveredNodeId ?? selectedNodeId

  return (
    <section className="ui-panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Relation Map</p>
          <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Карта связей проекта</h2>
        </div>
        <div className="rounded-2xl border border-(--border-soft) bg-(--panel-elevated) px-4 py-3 text-sm text-(--text-secondary)">
          Центральный узел: <span className="font-medium text-(--text-primary)">{project.title}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-x-auto rounded-3xl border border-(--border-soft) bg-(--panel-elevated) p-4">
          {nodes.length > 0 ? (
            <>
              <div className="space-y-3 lg:hidden">
                {nodes.map((node) => (
                  <button
                    key={`${node.type}:${node.id}:mobile`}
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(node.id)
                      onOpenNode({ id: node.id, type: node.type })
                    }}
                    className="w-full rounded-2xl border border-(--border-soft) bg-(--panel) p-4 text-left shadow-[0_4px_12px_rgba(11,16,32,0.05)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] ${node.badgeClassName}`}>
                        {node.badge}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-(--text-muted)">{node.type === 'project_section' ? 'Subsection' : 'Object'}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-(--text-primary)">{node.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-(--text-muted)">{node.subtitle}</p>
                  </button>
                ))}
              </div>

              <div className="mx-auto hidden min-w-fit lg:block">
              <div className="relative" style={{ width: layout.width, height: layout.height }}>
                <svg width={layout.width} height={layout.height} className="absolute inset-0 h-full w-full overflow-visible">
                  {edges.map((edge) => {
                    const source = nodePositions[edge.sourceId]
                    const target = nodePositions[edge.targetId]

                    if (!source || !target) {
                      return null
                    }

                    const isActive = activeNodeId ? edge.sourceId === activeNodeId || edge.targetId === activeNodeId : false

                    return (
                      <line
                        key={edge.id}
                        x1={source.centerX}
                        y1={source.centerY}
                        x2={target.centerX}
                        y2={target.centerY}
                        stroke={isActive ? '#5b4dff' : '#b8c0ff'}
                        strokeWidth={isActive ? 2.4 : 1.5}
                        strokeOpacity={activeNodeId ? (isActive ? 0.95 : 0.18) : 0.52}
                      />
                    )
                  })}
                </svg>

                {nodes.map((node) => {
                  const position = nodePositions[node.id]
                  const isSelected = selectedNodeId === node.id
                  const isHighlighted = activeNodeId === node.id

                  return (
                    <button
                      key={`${node.type}:${node.id}`}
                      type="button"
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => {
                        setSelectedNodeId(node.id)
                        onOpenNode({ id: node.id, type: node.type })
                      }}
                      className={`absolute overflow-hidden rounded-2xl border p-4 text-left shadow-[0_12px_32px_rgba(0,0,0,0.24)] transition-all duration-200 ${
                        isSelected
                          ? 'border-(--accent-border) bg-(--accent-soft) ring-1 ring-(--accent-border)'
                          : isHighlighted
                            ? 'border-(--accent-border) bg-[#f8f7ff]'
                            : 'border-(--border-soft) bg-(--panel) hover:border-(--accent-border) hover:bg-[#f8f7ff]'
                      }`}
                      style={{ left: position.left, top: position.top, width: layout.cardWidth, height: layout.cardHeight }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] ${node.badgeClassName}`}>
                          {node.badge}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-(--text-muted)">{node.type === 'project_section' ? 'Subsection' : 'Object'}</span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-(--text-primary)">{node.title}</h3>
                      <p className="mt-2 line-clamp-3 text-xs text-(--text-muted)">{node.subtitle}</p>
                    </button>
                  )
                })}
              </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-(--border) px-6 py-12 text-center text-sm text-(--text-muted)">
              В проекте пока недостаточно узлов для карты связей.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="ui-panel-elevated p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Узлы</p>
            <p className="mt-3 text-3xl font-semibold text-(--text-primary)">{nodes.length}</p>
          </div>
          <div className="ui-panel-elevated p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Связи</p>
            <p className="mt-3 text-3xl font-semibold text-(--text-primary)">{edges.length}</p>
          </div>
          <div className="ui-panel-elevated p-4 text-sm text-(--text-secondary)">
            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Поведение</p>
            <p className="mt-3">Клик по узлу открывает соответствующий объект. Hover подсвечивает связанные линии, а выбранный узел остаётся выделенным.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
