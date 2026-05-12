import { useMemo, useState } from 'react'
import type { ProjectActivity } from '../../types'
import { EmptyState } from './EmptyState'
import { projectActivityTypeLabels } from './projectMeta'

type ProjectActivityTabProps = {
  activities: ProjectActivity[]
}

type ActivityFilter = 'all' | ProjectActivity['type']

export function ProjectActivityTab({ activities }: ProjectActivityTabProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const filteredActivities = useMemo(
    () => (filter === 'all' ? activities : activities.filter((activity) => activity.type === filter)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [activities, filter],
  )

  return (
    <section className="ui-panel p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Активность</p>
          <h2 className="mt-2 text-xl font-semibold text-(--text-primary)">История изменений проекта</h2>
          <p className="mt-2 text-sm text-(--text-secondary)">Смотрите, что было создано, завершено и изменено недавно, чтобы не терять контекст движения проекта.</p>
        </div>
      </div>

      <div className="mt-4 ui-filter-scroll">
        <button type="button" onClick={() => setFilter('all')} className={['ui-filter-pill', filter === 'all' ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : ''].join(' ')}>Все</button>
        {(Object.keys(projectActivityTypeLabels) as ProjectActivity['type'][]).map((type) => (
          <button key={type} type="button" onClick={() => setFilter(type)} className={['ui-filter-pill', filter === type ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : ''].join(' ')}>
            {projectActivityTypeLabels[type]}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
          <article key={activity.id} className="relative overflow-hidden rounded-3xl border border-(--border) bg-(--panel-elevated) p-4 md:p-5">
            <div className="absolute left-0 top-0 h-full w-1 bg-(--accent)" />
            <div className="pl-3">
              <div className="flex flex-wrap gap-2">
                <span className="ui-chip">{projectActivityTypeLabels[activity.type]}</span>
                <span className="ui-chip">{new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.createdAt))}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-(--text-primary)">{activity.title}</h3>
              <p className="mt-2 text-sm text-(--text-secondary)">{activity.description || 'Подробности по событию пока не указаны.'}</p>
              {activity.relatedItemType || activity.relatedItemId ? <p className="mt-3 text-xs text-(--text-muted)">Связанный объект: {activity.relatedItemType ?? 'entity'} {activity.relatedItemId ?? ''}</p> : null}
            </div>
          </article>
        )) : <EmptyState title="Активности пока нет" description="История появится после изменений в проекте." actionLabel="Показать все события" onAction={() => setFilter('all')} />}
      </div>
    </section>
  )
}