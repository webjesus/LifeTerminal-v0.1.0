import { supabase } from '../lib/supabase'
import {
  getFullLocalAppState,
  restoreFullLocalAppState,
  type FullLocalAppState,
} from '../utils/appState'

const APP_DATA_TABLE = 'user_app_data'

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  return supabase
}

function isNoRowsError(error: { code?: string } | null) {
  return error?.code === 'PGRST116'
}

export async function loadUserAppData(userId: string): Promise<FullLocalAppState | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from(APP_DATA_TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return data.data as FullLocalAppState
}

export async function saveUserAppData(userId: string, data: unknown): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client.from(APP_DATA_TABLE).upsert(
    {
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    },
  )

  if (error) {
    throw error
  }
}

export async function ensureUserAppData(userId: string): Promise<{ created: boolean }> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from(APP_DATA_TABLE)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && !isNoRowsError(error)) {
    throw error
  }

  if (data) {
    return { created: false }
  }

  const { error: insertError } = await client.from(APP_DATA_TABLE).insert({
    user_id: userId,
    data: {},
  })

  if (insertError) {
    throw insertError
  }

  return { created: true }
}

export async function syncLocalToCloud(userId: string): Promise<void> {
  const appState = getFullLocalAppState()
  await saveUserAppData(userId, appState)
}

export async function syncCloudToLocal(userId: string): Promise<void> {
  const cloudData = await loadUserAppData(userId)

  if (!cloudData) {
    return
  }

  restoreFullLocalAppState(cloudData)
}
