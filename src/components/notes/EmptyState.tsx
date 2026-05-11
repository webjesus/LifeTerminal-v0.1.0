type EmptyStateProps = {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-(--border) bg-(--panel) px-6 py-12 text-center">
      <p className="text-sm uppercase tracking-[0.24em] text-(--text-muted)">Life OS</p>
      <h3 className="mt-3 text-xl font-semibold text-(--text-primary)">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-(--text-muted) md:text-base">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 rounded-lg border border-(--accent) bg-(--accent-soft) px-4 py-2 text-sm font-medium text-(--text-primary) transition-colors duration-200 hover:bg-orange-950/60"
      >
        {actionLabel}
      </button>
    </div>
  )
}
