type EmptyStateProps = {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="ui-empty ui-panel">
      <p className="text-sm uppercase tracking-[0.24em] text-(--text-muted)">Life OS</p>
      <h3 className="mt-3 text-xl font-semibold text-(--text-primary)">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-(--text-muted) md:text-base">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="ui-button-accent mt-6"
      >
        {actionLabel}
      </button>
    </div>
  )
}
