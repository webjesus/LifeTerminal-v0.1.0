import type { MouseEventHandler } from 'react'
import { SectionIcon } from './navigation/SectionIcon'
import type { SectionKey } from '../types/navigation'

type PageHeaderProps = {
  section: SectionKey
  title: string
  description: string
  actionLabel?: string
  onAction?: MouseEventHandler<HTMLButtonElement>
}

export function PageHeader({ section, title, description, actionLabel, onAction }: PageHeaderProps) {
  return (
    <header className="ui-panel p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-(--accent-border) bg-(--accent-soft) text-(--accent)">
              <SectionIcon section={section} size={18} />
            </span>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-(--text-primary) md:text-2xl">{title}</h1>
              <p className="page-description mt-1 max-w-3xl text-sm text-(--text-muted) md:text-base">{description}</p>
            </div>
          </div>
        </div>

        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="ui-button-accent px-4 py-2.5 lg:self-start">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </header>
  )
}