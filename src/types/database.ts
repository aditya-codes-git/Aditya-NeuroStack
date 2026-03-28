export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ResumeContext {
  type: 'video' | 'document' | 'manual'
  link?: string
  position: string
}

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          notes: string | null
          links: string[]
          resume_context: ResumeContext | null
          status: 'active' | 'paused' | 'completed'
          start_time: string
          end_time: string | null
          last_resume_time: string | null
          last_paused_at: string | null
          pause_history: string[] | null
          resume_history: string[] | null
          total_duration: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          notes?: string | null
          links?: string[]
          resume_context?: ResumeContext | null
          status?: 'active' | 'paused' | 'completed'
          start_time?: string
          end_time?: string | null
          last_resume_time?: string | null
          last_paused_at?: string | null
          pause_history?: string[] | null
          resume_history?: string[] | null
          total_duration?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          notes?: string | null
          links?: string[]
          resume_context?: ResumeContext | null
          status?: 'active' | 'paused' | 'completed'
          start_time?: string
          end_time?: string | null
          last_resume_time?: string | null
          last_paused_at?: string | null
          pause_history?: string[] | null
          resume_history?: string[] | null
          total_duration?: number
          created_at?: string
        }
      }
      checklist: {
        Row: {
          id: string
          session_id: string
          text: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          text: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          text?: string
          completed?: boolean
          created_at?: string
        }
      }
      video_summaries: {
        Row: {
          id: string
          user_id: string
          video_url: string
          summary: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          summary: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_url?: string
          summary?: string
          created_at?: string
        }
      }
    }
  }
}

export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']
export type ChecklistItem = Database['public']['Tables']['checklist']['Row']
export type ChecklistInsert = Database['public']['Tables']['checklist']['Insert']
export type ChecklistUpdate = Database['public']['Tables']['checklist']['Update']
export type VideoSummary = Database['public']['Tables']['video_summaries']['Row']
export type VideoSummaryInsert = Database['public']['Tables']['video_summaries']['Insert']
