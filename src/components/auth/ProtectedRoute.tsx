import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg) px-4">
        <div className="ui-panel w-full max-w-md p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Life Terminal</p>
          <h2 className="mt-3 text-lg font-semibold text-(--text-primary)">Загрузка аккаунта</h2>
          <p className="mt-2 text-sm text-(--text-muted)">Проверяем сессию и подготавливаем рабочее пространство...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
