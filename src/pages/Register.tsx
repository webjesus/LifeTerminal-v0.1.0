import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/branding/LogoMark'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const result = await signUp(email.trim(), password)

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccessMessage('Аккаунт создан. Теперь выполните вход.')
    navigate('/login', { replace: true })
  }

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_8%_0%,rgba(57,39,255,0.08),transparent_28%),radial-gradient(circle_at_95%_5%,rgba(59,130,246,0.12),transparent_30%),var(--bg)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="mx-auto">
          <LogoMark showText className="justify-center" iconClassName="h-11 w-11" textClassName="text-center" />
        </div>

        <div className="ui-panel space-y-5 p-6 sm:p-7">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">Life Terminal OS</p>
            <h1 className="text-2xl font-semibold text-(--text-primary)">Регистрация</h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-(--text-primary)">Электронная почта</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="ui-input"
                placeholder="name@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-(--text-primary)">Пароль</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="ui-input"
                placeholder="Минимум 6 символов"
              />
            </label>

            <button type="submit" disabled={submitting} className="ui-button-accent w-full disabled:cursor-not-allowed disabled:opacity-70">
              {submitting ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </form>

          {successMessage ? (
            <p className="rounded-2xl bg-(--success-bg) px-4 py-3 text-sm text-(--success-text)">{successMessage}</p>
          ) : null}

          {error ? <p className="rounded-2xl bg-(--danger-bg) px-4 py-3 text-sm text-(--danger-text)">{error}</p> : null}

          <p className="text-sm text-(--text-secondary)">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium text-(--accent) hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
