import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { generateVideoSummary } from '@/lib/groq'
import type { VideoSummaryInsert } from '@/types/database'

interface VideoSummaryState {
  summaries: Record<string, string> // videoUrl → summary
  loading: string | null            // currently loading URL
  error: string | null
  cooldown: boolean

  getSummary: (videoUrl: string) => Promise<void>
  fetchCachedSummary: (videoUrl: string) => Promise<string | null>
  clearError: () => void
}

const COOLDOWN_MS = 10_000 // 10 seconds

export const useVideoSummaryStore = create<VideoSummaryState>((set, get) => ({
  summaries: {},
  loading: null,
  error: null,
  cooldown: false,

  fetchCachedSummary: async (videoUrl: string) => {
    // Check local cache first
    const local = get().summaries[videoUrl]
    if (local) return local

    // Check database
    const { data } = await supabase
      .from('video_summaries' as any)
      .select('summary')
      .eq('video_url', videoUrl)
      .maybeSingle() as { data: { summary: string } | null }

    if (data?.summary) {
      set(state => ({
        summaries: { ...state.summaries, [videoUrl]: data.summary },
      }))
      return data.summary
    }

    return null
  },

  getSummary: async (videoUrl: string) => {
    const { cooldown, loading } = get()

    // Prevent duplicate calls
    if (cooldown || loading) return

    // Check cache first (local + DB)
    const cached = await get().fetchCachedSummary(videoUrl)
    if (cached) return

    // Generate via Groq
    set({ loading: videoUrl, error: null })

    try {
      const summary = await generateVideoSummary(videoUrl)

      if (summary.startsWith('⚠️')) {
        // AI not configured — use fallback
        set({ error: summary, loading: null })
        return
      }

      // Save to database
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await (supabase
          .from('video_summaries' as any) as any)
          .upsert(
            { user_id: user.id, video_url: videoUrl, summary },
            { onConflict: 'user_id,video_url' }
          )
      }

      // Update local cache
      set(state => ({
        summaries: { ...state.summaries, [videoUrl]: summary },
        loading: null,
        cooldown: true,
      }))

      // Clear cooldown after 10s
      setTimeout(() => set({ cooldown: false }), COOLDOWN_MS)
    } catch (e: any) {
      set({
        error: e?.message || 'Summary unavailable. Continue with notes.',
        loading: null,
        cooldown: true,
      })
      setTimeout(() => set({ cooldown: false }), COOLDOWN_MS)
    }
  },

  clearError: () => set({ error: null }),
}))
