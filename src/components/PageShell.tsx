import type { ReactNode } from 'react'

type PageShellProps = {
  title: string
  description: string
  children?: ReactNode
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="space-y-6">
      <header className="ui-panel p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Life OS</p>
        <h1 className="mt-2 text-2xl font-semibold text-(--text-primary) md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-(--text-muted) md:text-base">{description}</p>
      </header>

      {children}
    </section>
  )
}
