import { Component, type ReactNode } from 'react'

type AppErrorBoundaryState = {
  error: Error | null
  errorInfo: string | null
}

type AppErrorBoundaryProps = {
  children: ReactNode
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    this.setState({
      error,
      errorInfo: errorInfo.componentStack ?? null,
    })
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-[var(--bg)] p-6 text-[var(--text-secondary)]">
        <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-orange-800/60 bg-orange-950/20 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Life OS</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Произошла ошибка рендера</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Это не “чёрный экран”: приложение поймало исключение и показывает его здесь. Скопируйте текст ошибки ниже.
          </p>

          <div className="rounded-xl border border-orange-800/40 bg-black/30 p-4">
            <p className="text-sm font-medium text-orange-100">{this.state.error.name}</p>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-orange-100/90">
              {this.state.error.message}
            </pre>
          </div>

          {this.state.errorInfo ? (
            <details className="rounded-xl border border-[var(--border)] bg-black/20 p-4">
              <summary className="cursor-pointer text-sm text-[var(--text-secondary)]">Component stack</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-[var(--text-muted)]">{this.state.errorInfo}</pre>
            </details>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-orange-950/60"
            >
              Перезагрузить
            </button>
            <button
              type="button"
              onClick={() => this.setState({ error: null, errorInfo: null })}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Попробовать продолжить
            </button>
          </div>
        </div>
      </div>
    )
  }
}

