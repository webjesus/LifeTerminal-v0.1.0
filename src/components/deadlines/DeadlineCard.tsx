type DeadlineEntityType = 'task' | 'project'

type DeadlineCardProps = {
  title: string
  description: string
  dateLabel: string
  type: DeadlineEntityType
  isOverdue: boolean
  onExtend: () => void
}

const typeLabels: Record<DeadlineEntityType, string> = {
  task: 'Задача',
  project: 'Проект',
}

export function DeadlineCard({
  title,
  description,
  dateLabel,
  type,
  isOverdue,
  onExtend,
}: DeadlineCardProps) {
  return (
    <article
      className={[
        'ui-panel ui-card-hover p-4',
        isOverdue
          ? 'border-(--danger-border) bg-(--danger-bg)'
          : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-(--text-primary)">{title}</p>
          <p className="mt-1 text-sm text-(--text-muted)">{description || 'Описание не добавлено.'}</p>
        </div>
        <span className="ui-chip">
          {typeLabels[type]}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Дедлайн</p>
          <p className={isOverdue ? 'mt-1 text-sm text-(--danger-text)' : 'mt-1 text-sm text-(--text-primary)'}>
            {dateLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onExtend}
          className="ui-button-accent px-3 py-2"
        >
          Продлить
        </button>
      </div>
    </article>
  )
}
