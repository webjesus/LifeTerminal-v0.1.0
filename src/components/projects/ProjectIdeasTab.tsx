import { useMemo, useState } from 'react'
import type { Idea, ProjectWorkspaceBlock } from '../../types'
import { EmptyState } from './EmptyState'

type IdeaFilter = 'all' | Idea['status']

type ProjectIdeasTabProps = {
  ideas: Idea[]
  workspaceBlocks: ProjectWorkspaceBlock[]
  onCreateIdea: () => void
  onOpenIdea: (ideaId: string) => void
  onOpenWorkspaceBlock: (blockId: string) => void
}

const FILTER_LABELS: Record<IdeaFilter, string> = {
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

export function ProjectIdeasTab({ ideas, workspaceBlocks, onCreateIdea, onOpenIdea, onOpenWorkspaceBlock }: ProjectIdeasTabProps) {
  const [filter, setFilter] = useState<IdeaFilter>('all')
  const safeIdeas = Array.isArray(ideas) ? ideas : []
  const safeWorkspaceBlocks = Array.isArray(workspaceBlocks) ? workspaceBlocks : []
  const filteredIdeas = useMemo(() => (filter === 'all' ? safeIdeas : safeIdeas.filter((idea) => idea.status === filter)), [filter, safeIdeas])
  const linkedBlockMap = useMemo(
    () => new Map(safeWorkspaceBlocks.filter((block) => block.linkedItemType === 'idea' && block.linkedItemId).map((block) => [block.linkedItemId as string, block.id])),
    [safeWorkspaceBlocks],
  )

  return (
    <section className="ui-panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Идеи проекта</p>
          <h2 className="mt-2 text-2xl font-semibold text-(--text-primary)">Идеи проекта</h2>
        </div>
        <button type="button" onClick={onCreateIdea} className="ui-button-accent px-4 py-3">Добавить идею в проект</button>
      </div>

      <div className="mt-4 ui-filter-scroll">
        {(Object.keys(FILTER_LABELS) as IdeaFilter[]).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={['ui-filter-pill', filter === item ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : ''].join(' ')}>
            {FILTER_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {filteredIdeas.length > 0 ? filteredIdeas.map((idea) => {
          const linkedBlockId = linkedBlockMap.get(idea.id)
          const ideaTags = Array.isArray(idea.tags) ? idea.tags : []

          return (
            <article key={idea.id} className="ui-panel-elevated p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <button type="button" onClick={() => onOpenIdea(idea.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap gap-2"><span className="ui-chip">{idea.status}</span><span className="ui-chip">{idea.priority}</span><span className="ui-chip">{idea.difficulty}</span></div>
                  <p className="mt-3 text-base font-semibold text-(--text-primary)">{idea.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-(--text-muted)">{idea.description || idea.problem || 'Без описания'}</p>
                  {idea.nextStep ? <p className="mt-2 text-sm text-(--text-secondary)">Следующий шаг: {idea.nextStep}</p> : null}
                  {ideaTags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{ideaTags.map((tag) => <span key={tag} className="ui-chip">#{tag}</span>)}</div> : null}
                </button>
                {linkedBlockId ? <button type="button" onClick={() => onOpenWorkspaceBlock(linkedBlockId)} className="ui-button px-3 py-2 text-sm">Связана с рабочей областью</button> : null}
              </div>
            </article>
          )
        }) : <EmptyState title="В проекте пока нет идей" description="Сохраняйте мысли, гипотезы и решения, которые можно развить." actionLabel="Добавить идею" onAction={onCreateIdea} />}
      </div>
    </section>
  )
}
