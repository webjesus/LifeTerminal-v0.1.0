type EmptyStateProps = {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-(--border) bg-(--panel) px-6 py-14 text-center shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
      <p className="text-xs uppercase tracking-[0.28em] text-(--text-muted)">Project Space</p>
      <h3 className="mt-3 text-2xl font-semibold text-(--text-primary)">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-(--text-muted) md:text-base">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-8 rounded-xl border border-(--accent) bg-(--accent-soft) px-5 py-3 text-sm font-medium text-(--text-primary) transition-colors duration-200 hover:bg-orange-950/60"
      >
        {actionLabel}
      </button>
    </div>
  )
}
