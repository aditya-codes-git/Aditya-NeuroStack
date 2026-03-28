import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session as AuthSession } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: AuthSession | null
  loading: boolean
  error: string | null
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, session, loading: false })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, session, loading: false })
      })
    } catch {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string) => {
    set({ error: null, loading: true })
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ error: null, loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  clearError: () => set({ error: null }),
}))
