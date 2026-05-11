import { DeadlineCard } from './DeadlineCard'

export type DeadlineItem = {
  id: string
  title: string
  description: string
  dateLabel: string
  type: 'task' | 'project'
  isOverdue: boolean
  rawDate: string
}

type DeadlineListProps = {
  title: string
  items: DeadlineItem[]
  emptyText: string
  onExtend: (item: DeadlineItem) => void
}

export function DeadlineList({ title, items, emptyText, onExtend }: DeadlineListProps) {
  return (
    <section className="ui-panel space-y-3 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-(--text-primary)">{title}</h2>
        <span className="ui-chip text-(--text-muted)">
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <DeadlineCard
              key={item.id}
              title={item.title}
              description={item.description}
              dateLabel={item.dateLabel}
              type={item.type}
              isOverdue={item.isOverdue}
              onExtend={() => onExtend(item)}
            />
          ))}
        </div>
      ) : (
        <div className="ui-empty py-8 text-left">
          {emptyText}
        </div>
      )}
    </section>
  )
}
