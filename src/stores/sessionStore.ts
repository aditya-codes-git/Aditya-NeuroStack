import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session, SessionInsert, ResumeContext } from '@/types/database'

interface SessionState {
  sessions: Session[]
  activeSession: Session | null
  selectedSession: Session | null
  loading: boolean
  error: string | null

  fetchSessions: () => Promise<void>
  fetchTodaySessions: () => Promise<void>
  searchSessions: (query: string, statusFilter?: string) => Promise<void>
  createSession: (data: { title: string; notes?: string; links?: string[] }) => Promise<boolean>
  pauseSession: (id: string) => Promise<void>
  resumeSession: (id: string) => Promise<boolean>
  completeSession: (id: string) => Promise<void>
  updateNotes: (id: string, notes: string) => Promise<void>
  updateLinks: (id: string, links: string[]) => Promise<void>
  updateResumeContext: (id: string, resumeContext: ResumeContext | null) => Promise<void>
  setSelectedSession: (session: Session | null) => void
  clearError: () => void
  setupRealtime: () => () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSession: null,
  selectedSession: null,
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('start_time', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    const active = data?.find(s => s.status === 'active') ?? null
    set({ sessions: data ?? [], activeSession: active, loading: false })
  },

  fetchTodaySessions: async () => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('start_time', startOfDay.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      set({ error: error.message })
      return
    }

    const active = data?.find(s => s.status === 'active') ?? get().activeSession
    set({ sessions: data ?? [], activeSession: active })
  },

  searchSessions: async (query: string, statusFilter?: string) => {
    set({ loading: true })
    let q = supabase.from('sessions').select('*')

    if (query) {
      q = q.ilike('title', `%${query}%`)
    }
    if (statusFilter && statusFilter !== 'all') {
      q = q.eq('status', statusFilter as Session['status'])
    }

    q = q.order('start_time', { ascending: false })

    const { data, error } = await q
    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ sessions: data ?? [], loading: false })
  },

  createSession: async (data) => {
    const { activeSession } = get()
    if (activeSession) {
      set({ error: 'An active session already exists. Pause or complete it first.' })
      return false
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ error: 'Not authenticated' })
      return false
    }

    const now = new Date().toISOString()
    const insert: SessionInsert = {
      user_id: user.id,
      title: data.title,
      notes: data.notes || null,
      links: data.links || [],
      status: 'active',
      start_time: now,
      last_resume_time: now,
    }

    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert(insert)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      return false
    }

    set(state => ({
      sessions: [newSession, ...state.sessions],
      activeSession: newSession,
      selectedSession: newSession,
      error: null,
    }))
    return true
  },

  pauseSession: async (id: string) => {
    const session = get().sessions.find(s => s.id === id)
    if (!session || session.status !== 'active') return

    const now = new Date()
    const lastResume = session.last_resume_time ? new Date(session.last_resume_time) : new Date(session.start_time)
    const elapsed = Math.floor((now.getTime() - lastResume.getTime()) / 1000)
    const newDuration = session.total_duration + elapsed

    const pauseHistory = [...(session.pause_history || []), now.toISOString()]

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'paused',
        last_paused_at: now.toISOString(),
        total_duration: newDuration,
        pause_history: pauseHistory,
      })
      .eq('id', id)

    if (error) {
      set({ error: error.message })
      return
    }

    const updated = {
      ...session,
      status: 'paused' as const,
      last_paused_at: now.toISOString(),
      total_duration: newDuration,
      pause_history: pauseHistory,
    }

    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? updated : s),
      activeSession: null,
      selectedSession: state.selectedSession?.id === id ? updated : state.selectedSession,
    }))
  },

  resumeSession: async (id: string) => {
    const { activeSession } = get()
    if (activeSession && activeSession.id !== id) {
      set({ error: 'Another session is already active. Pause it first.' })
      return false
    }

    const session = get().sessions.find(s => s.id === id)
    if (!session) return false

    const now = new Date().toISOString()
    const resumeHistory = [...(session.resume_history || []), now]

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'active',
        last_resume_time: now,
        resume_history: resumeHistory,
      })
      .eq('id', id)

    if (error) {
      set({ error: error.message })
      return false
    }

    const updated = {
      ...session,
      status: 'active' as const,
      last_resume_time: now,
      resume_history: resumeHistory,
    }

    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? updated : s),
      activeSession: updated,
      selectedSession: updated,
      error: null,
    }))
    return true
  },

  completeSession: async (id: string) => {
    const session = get().sessions.find(s => s.id === id)
    if (!session) return

    const now = new Date()
    let finalDuration = session.total_duration

    if (session.status === 'active' && session.last_resume_time) {
      const lastResume = new Date(session.last_resume_time)
      finalDuration += Math.floor((now.getTime() - lastResume.getTime()) / 1000)
    }

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        end_time: now.toISOString(),
        total_duration: finalDuration,
      })
      .eq('id', id)

    if (error) {
      set({ error: error.message })
      return
    }

    const updated = {
      ...session,
      status: 'completed' as const,
      end_time: now.toISOString(),
      total_duration: finalDuration,
    }

    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? updated : s),
      activeSession: state.activeSession?.id === id ? null : state.activeSession,
      selectedSession: state.selectedSession?.id === id ? updated : state.selectedSession,
    }))
  },

  updateNotes: async (id: string, notes: string) => {
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, notes } : s),
      activeSession: state.activeSession?.id === id ? { ...state.activeSession, notes } : state.activeSession,
      selectedSession: state.selectedSession?.id === id ? { ...state.selectedSession, notes } : state.selectedSession,
    }))

    await supabase.from('sessions').update({ notes }).eq('id', id)
  },

  updateLinks: async (id: string, links: string[]) => {
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, links } : s),
      activeSession: state.activeSession?.id === id ? { ...state.activeSession, links } : state.activeSession,
      selectedSession: state.selectedSession?.id === id ? { ...state.selectedSession, links } : state.selectedSession,
    }))

    await supabase.from('sessions').update({ links }).eq('id', id)
  },

  updateResumeContext: async (id: string, resume_context: ResumeContext | null) => {
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, resume_context } : s),
      activeSession: state.activeSession?.id === id ? { ...state.activeSession, resume_context } : state.activeSession,
      selectedSession: state.selectedSession?.id === id ? { ...state.selectedSession, resume_context } : state.selectedSession,
    }))

    await supabase.from('sessions').update({ resume_context: resume_context as any }).eq('id', id)
  },

  setSelectedSession: (session) => set({ selectedSession: session }),

  clearError: () => set({ error: null }),

  setupRealtime: () => {
    const channel = supabase
      .channel('sessions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload) => {
          const newRecord = payload.new as Session
          if (payload.eventType === 'INSERT') {
            set(state => ({
              sessions: [newRecord, ...state.sessions],
              activeSession: newRecord.status === 'active' ? newRecord : state.activeSession,
            }))
          } else if (payload.eventType === 'UPDATE') {
            set(state => ({
              sessions: state.sessions.map(s => s.id === newRecord.id ? newRecord : s),
              activeSession: newRecord.status === 'active' ? newRecord :
                state.activeSession?.id === newRecord.id ? null : state.activeSession,
              selectedSession: state.selectedSession?.id === newRecord.id ? newRecord : state.selectedSession,
            }))
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as { id: string }
            set(state => ({
              sessions: state.sessions.filter(s => s.id !== oldRecord.id),
              activeSession: state.activeSession?.id === oldRecord.id ? null : state.activeSession,
              selectedSession: state.selectedSession?.id === oldRecord.id ? null : state.selectedSession,
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))
