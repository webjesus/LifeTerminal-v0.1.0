import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { supabase } from '../lib/supabase'

type AuthActionResult = {
  error: string | null
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<AuthActionResult>
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signOut: () => Promise<AuthActionResult>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const SUPABASE_MISSING_ENV_ERROR =
  'Не настроены VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Авторизация недоступна.'

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (!supabase) {
      setLoading(false)
      return
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return
      }

      if (error) {
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!isMounted) {
        return
      }

      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    if (!supabase) {
      return { error: SUPABASE_MISSING_ENV_ERROR }
    }

    try {
      const { error } = await supabase.auth.signUp({ email, password })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return {
        error: normalizeErrorMessage(error, 'Не удалось выполнить регистрацию. Попробуйте позже.'),
      }
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    if (!supabase) {
      return { error: SUPABASE_MISSING_ENV_ERROR }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return {
        error: normalizeErrorMessage(error, 'Не удалось выполнить вход. Попробуйте позже.'),
      }
    }
  }, [])

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    if (!supabase) {
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return {
        error: normalizeErrorMessage(error, 'Не удалось выйти из аккаунта. Попробуйте позже.'),
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, signUp, signIn, signOut }),
    [loading, session, signIn, signOut, signUp, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
