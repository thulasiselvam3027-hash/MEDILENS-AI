import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { UserRole, UserSession } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Returns true if valid, non-placeholder Supabase credentials are provided in .env
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key') &&
    supabaseUrl.startsWith('http')
  )
}

// Fallback dummy values to prevent createClient throwing an error if .env isn't set yet
const activeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co'
const activeKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key'

export const supabase: SupabaseClient = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/**
 * Maps a Supabase Auth User object to the application's UserSession interface
 */
export function mapSupabaseUserToSession(user: User): UserSession {
  const metadata = user.user_metadata || {}
  const role: UserRole = metadata.role === 'doctor' ? 'doctor' : 'patient'
  const name: string = metadata.name || user.email?.split('@')[0] || 'User'
  const assignedId: string =
    metadata.patientId ||
    (role === 'doctor'
      ? `DOC-${user.id.slice(0, 5).toUpperCase()}`
      : `PT-${user.id.slice(0, 5).toUpperCase()}`)

  const avatar = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return {
    id: user.id,
    name,
    role,
    email: user.email || '',
    patientId: assignedId,
    avatar: avatar || (role === 'doctor' ? 'DR' : 'PT'),
    isDemoSession: false,
  }
}
