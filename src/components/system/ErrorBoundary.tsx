import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
  errorInfo: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
      errorInfo: null,
    }
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
      <div className="flex min-h-screen items-center justify-center bg-(--bg) px-4 py-8 text-(--text-primary)">
        <div className="ui-panel w-full max-w-2xl p-6 md:p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Life Terminal OS</p>
          <h1 className="mt-3 text-2xl font-semibold text-(--text-primary)">Что-то пошло не так</h1>
          <p className="mt-3 text-sm leading-6 text-(--text-secondary)">
            Приложение поймало runtime-ошибку и показало безопасный fallback вместо белого экрана.
          </p>

          {import.meta.env.DEV ? (
            <div className="mt-5 rounded-2xl border border-(--danger-border) bg-(--danger-bg) p-4">
              <p className="text-sm font-medium text-(--danger-text)">{this.state.error.name}</p>
              <pre className="mt-2 whitespace-pre-wrap wrap-break-word text-xs text-(--danger-text)">{this.state.error.message}</pre>
              {this.state.errorInfo ? <pre className="mt-3 whitespace-pre-wrap wrap-break-word text-xs text-(--text-muted)">{this.state.errorInfo}</pre> : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} className="ui-button-accent px-4 py-3 text-sm">Обновить страницу</button>
            <button type="button" onClick={() => window.location.assign('/')} className="ui-button px-4 py-3 text-sm">Вернуться на главную</button>
          </div>
        </div>
      </div>
    )
  }
}