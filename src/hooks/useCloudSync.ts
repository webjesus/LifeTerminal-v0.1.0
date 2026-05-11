import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  ensureUserAppData,
  loadUserAppData,
  saveUserAppData,
  syncLocalToCloud,
} from '../services/cloudDataService'
import {
  getFullLocalAppState,
  hasMeaningfulAppState,
  restoreFullLocalAppState,
} from '../utils/appState'
import { STORAGE_CHANGE_EVENT, storageKeys } from '../utils/storage'

type CloudSyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

type CloudSyncContextValue = {
  status: CloudSyncStatus
  statusLabel: string
  lastSyncedAt: string | null
  error: string | null
  pendingLocalDataImport: boolean
  syncNow: () => Promise<void>
  transferLocalDataToAccount: () => Promise<void>
  startWithCleanAccount: () => Promise<void>
}

const CloudSyncContext = createContext<CloudSyncContextValue | undefined>(undefined)

const WATCHED_STORAGE_KEYS = new Set<string>(Object.values(storageKeys))
const SAVE_DEBOUNCE_MS = 1200

function getStatusLabel(status: CloudSyncStatus) {
  if (status === 'syncing') {
    return 'Синхронизация...'
  }

  if (status === 'saved') {
    return 'Сохранено'
  }

  if (status === 'error') {
    return 'Ошибка синхронизации'
  }

  return 'Ожидание синхронизации'
}

function resolveSyncError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Не удалось синхронизировать данные с облаком.'
}

export function CloudSyncProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [status, setStatus] = useState<CloudSyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [pendingLocalDataImport, setPendingLocalDataImport] = useState(false)
  const debounceTimerRef = useRef<number | null>(null)
  const pauseAutosaveRef = useRef(false)

  const runSave = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      return
    }

    setStatus('syncing')
    setError(null)

    try {
      const appState = getFullLocalAppState()
      await saveUserAppData(user.id, appState)
      setStatus('saved')
      setLastSyncedAt(new Date().toISOString())
    } catch (syncError) {
      setStatus('error')
      setError(resolveSyncError(syncError))
    }
  }, [user])

  const scheduleSave = useCallback(() => {
    if (!user || !isSupabaseConfigured || pendingLocalDataImport || pauseAutosaveRef.current) {
      return
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
    }

    setStatus('syncing')
    setError(null)

    debounceTimerRef.current = window.setTimeout(() => {
      void runSave()
      debounceTimerRef.current = null
    }, SAVE_DEBOUNCE_MS)
  }, [pendingLocalDataImport, runSave, user])

  const syncNow = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      return
    }

    await runSave()
  }, [runSave, user])

  const transferLocalDataToAccount = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      return
    }

    setPendingLocalDataImport(false)
    await syncLocalToCloud(user.id)
    setStatus('saved')
    setError(null)
    setLastSyncedAt(new Date().toISOString())
  }, [user])

  const startWithCleanAccount = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      return
    }

    pauseAutosaveRef.current = true

    try {
      restoreFullLocalAppState({})
      await saveUserAppData(user.id, getFullLocalAppState())
      setPendingLocalDataImport(false)
      setStatus('saved')
      setError(null)
      setLastSyncedAt(new Date().toISOString())
    } catch (syncError) {
      setStatus('error')
      setError(resolveSyncError(syncError))
    } finally {
      pauseAutosaveRef.current = false
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setStatus('idle')
      setError(null)
      setLastSyncedAt(null)
      setPendingLocalDataImport(false)

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      return
    }

    if (!isSupabaseConfigured) {
      setStatus('error')
      setError('Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.')
      return
    }

    const userId = user.id

    let isCancelled = false

    async function initializeCloudState() {
      setStatus('syncing')
      setError(null)

      try {
        await ensureUserAppData(userId)
        const cloudData = await loadUserAppData(userId)
        const localData = getFullLocalAppState()
        const cloudHasData = hasMeaningfulAppState(cloudData)
        const localHasData = hasMeaningfulAppState(localData)

        if (isCancelled) {
          return
        }

        if (cloudHasData && cloudData) {
          pauseAutosaveRef.current = true
          restoreFullLocalAppState(cloudData)
          pauseAutosaveRef.current = false
          setPendingLocalDataImport(false)
          setStatus('saved')
          setLastSyncedAt(new Date().toISOString())
          return
        }

        if (localHasData) {
          setPendingLocalDataImport(true)
          setStatus('saved')
          return
        }

        await saveUserAppData(userId, localData)
        setPendingLocalDataImport(false)
        setStatus('saved')
        setLastSyncedAt(new Date().toISOString())
      } catch (syncError) {
        if (isCancelled) {
          return
        }

        setStatus('error')
        setError(resolveSyncError(syncError))
      }
    }

    void initializeCloudState()

    return () => {
      isCancelled = true

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [user])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      return
    }

    const handleCustomStorageEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>
      const changedKey = customEvent.detail?.key

      if (!changedKey || !WATCHED_STORAGE_KEYS.has(changedKey)) {
        return
      }

      scheduleSave()
    }

    const handleNativeStorageEvent = (event: StorageEvent) => {
      if (!event.key || !WATCHED_STORAGE_KEYS.has(event.key)) {
        return
      }

      scheduleSave()
    }

    window.addEventListener(STORAGE_CHANGE_EVENT, handleCustomStorageEvent)
    window.addEventListener('storage', handleNativeStorageEvent)

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleCustomStorageEvent)
      window.removeEventListener('storage', handleNativeStorageEvent)
    }
  }, [scheduleSave, user])

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      status,
      statusLabel: getStatusLabel(status),
      lastSyncedAt,
      error,
      pendingLocalDataImport,
      syncNow,
      transferLocalDataToAccount,
      startWithCleanAccount,
    }),
    [
      error,
      lastSyncedAt,
      pendingLocalDataImport,
      startWithCleanAccount,
      status,
      syncNow,
      transferLocalDataToAccount,
    ],
  )

  return createElement(CloudSyncContext.Provider, { value }, children)
}

export function useCloudSync() {
  const context = useContext(CloudSyncContext)

  if (!context) {
    throw new Error('useCloudSync must be used within CloudSyncProvider')
  }

  return context
}
