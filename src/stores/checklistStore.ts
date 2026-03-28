import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { ChecklistItem } from '@/types/database'

interface ChecklistState {
  items: ChecklistItem[]
  loading: boolean

  fetchItems: (sessionId: string) => Promise<void>
  addItem: (sessionId: string, text: string) => Promise<void>
  toggleItem: (id: string, completed: boolean) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  clearItems: () => void
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  items: [],
  loading: false,

  fetchItems: async (sessionId: string) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('checklist')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (!error) {
      set({ items: data ?? [], loading: false })
    } else {
      set({ loading: false })
    }
  },

  addItem: async (sessionId: string, text: string) => {
    const { data, error } = await supabase
      .from('checklist')
      .insert({ session_id: sessionId, text })
      .select()
      .single()

    if (!error && data) {
      set(state => ({ items: [...state.items, data] }))
    }
  },

  toggleItem: async (id: string, completed: boolean) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === id ? { ...item, completed } : item
      ),
    }))

    await supabase
      .from('checklist')
      .update({ completed })
      .eq('id', id)
  },

  deleteItem: async (id: string) => {
    set(state => ({
      items: state.items.filter(item => item.id !== id),
    }))

    await supabase.from('checklist').delete().eq('id', id)
  },

  clearItems: () => set({ items: [] }),
}))
