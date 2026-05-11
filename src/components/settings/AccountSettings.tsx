import { CloudUpload, LogOut, RefreshCw, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCloudSync } from '../../hooks/useCloudSync'

function formatSyncTime(value: string | null) {
  if (!value) {
    return 'Еще не синхронизировалось'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AccountSettings() {
  const { user, signOut } = useAuth()
  const {
    status,
    statusLabel,
    lastSyncedAt,
    error,
    pendingLocalDataImport,
    syncNow,
    transferLocalDataToAccount,
    startWithCleanAccount,
  } = useCloudSync()
  const [actionInProgress, setActionInProgress] = useState<'sync' | 'transfer' | 'clean' | 'signout' | null>(
    null,
  )
  const [actionError, setActionError] = useState<string | null>(null)

  async function runAction<T extends typeof actionInProgress>(
    action: T,
    operation: () => Promise<void>,
  ) {
    setActionInProgress(action)
    setActionError(null)

    try {
      await operation()
    } catch (operationError) {
      if (operationError instanceof Error && operationError.message.trim()) {
        setActionError(operationError.message)
      } else {
        setActionError('Операция не выполнена. Попробуйте позже.')
      }
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleSignOut() {
    setActionInProgress('signout')
    setActionError(null)

    const result = await signOut()

    if (result.error) {
      setActionError(result.error)
    }

    setActionInProgress(null)
  }

  return (
    <section id="account" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="ui-settings-section-header">
        <span className="ui-settings-section-icon">
          <UserRound size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Аккаунт</p>
          <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Авторизация и облако</h2>
          <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">
            Подключенный аккаунт, статус синхронизации и управление облачным сохранением.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Почта</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{user?.email ?? 'Не авторизован'}</p>
        </div>
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Статус</p>
          <p
            className={[
              'mt-2 text-sm font-medium',
              status === 'error' ? 'text-(--danger-text)' : 'text-(--text-primary)',
            ].join(' ')}
          >
            {statusLabel}
          </p>
        </div>
        <div className="ui-stat-card">
          <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Последняя синхронизация</p>
          <p className="mt-2 text-sm font-medium text-(--text-primary)">{formatSyncTime(lastSyncedAt)}</p>
        </div>
      </div>

      {pendingLocalDataImport ? (
        <div className="mt-6 rounded-3xl border border-(--accent-border) bg-(--accent-soft) p-4">
          <p className="text-sm font-medium text-(--text-primary)">
            На этом устройстве найдены локальные данные. Перенести их в аккаунт?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction('transfer', transferLocalDataToAccount)}
              disabled={actionInProgress !== null}
              className="ui-button-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              Перенести
            </button>
            <button
              type="button"
              onClick={() => runAction('clean', startWithCleanAccount)}
              disabled={actionInProgress !== null}
              className="ui-button disabled:cursor-not-allowed disabled:opacity-70"
            >
              Начать с чистого аккаунта
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => runAction('sync', syncNow)}
          disabled={actionInProgress !== null}
          className="ui-button inline-flex min-h-11 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw size={18} strokeWidth={2} />
          Синхронизировать сейчас
        </button>

        <button
          type="button"
          onClick={() => runAction('transfer', transferLocalDataToAccount)}
          disabled={actionInProgress !== null}
          className="ui-button inline-flex min-h-11 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <CloudUpload size={18} strokeWidth={2} />
          Перенести локальные данные в аккаунт
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={actionInProgress !== null}
          className="ui-button-danger inline-flex min-h-11 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut size={18} strokeWidth={2} />
          Выйти
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-(--danger-text)">{error}</p> : null}
      {actionError ? <p className="mt-2 text-sm text-(--danger-text)">{actionError}</p> : null}
    </section>
  )
}
