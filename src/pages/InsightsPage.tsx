import { useState, useEffect, useMemo } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useChecklistStore } from '@/stores/checklistStore'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'
import {
  ArrowLeft, Clock, CheckCircle, Zap, TrendingUp,
  Activity, Target, BarChart3, Brain
} from 'lucide-react'
import { ProductivityGraph } from '@/components/ui/line-graph-statistics'
import { Footer } from '@/components/ui/footer-section'

interface SessionWithTasks {
  id: string
  title: string
  status: string
  start_time: string
  end_time: string | null
  total_duration: number
  totalTasks: number
  completedTasks: number
  progressPercent: number
}

interface Props {
  onBack: () => void
}

export default function InsightsPage({ onBack }: Props) {
  const { sessions } = useSessionStore()
  const [sessionData, setSessionData] = useState<SessionWithTasks[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all checklist data for all sessions
  useEffect(() => {
    const fetchAllTasks = async () => {
      setLoading(true)
      const results: SessionWithTasks[] = []

      for (const session of sessions) {
        const { data } = await (supabase
          .from('checklist' as any) as any)
          .select('*')
          .eq('session_id', session.id)

        const tasks = data || []
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.completed).length
        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        results.push({
          id: session.id,
          title: session.title,
          status: session.status,
          start_time: session.start_time,
          end_time: session.end_time,
          total_duration: session.total_duration,
          totalTasks,
          completedTasks,
          progressPercent,
        })
      }

      setSessionData(results)
      setLoading(false)
    }

    if (sessions.length > 0) {
      fetchAllTasks()
    } else {
      setLoading(false)
    }
  }, [sessions])

  // ━━━ COMPUTED METRICS ━━━

  const totalSessions = sessions.length
  const totalAllTime = sessions.reduce((sum, s) => sum + s.total_duration, 0)

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const totalToday = useMemo(() => {
    return sessions
      .filter(s => new Date(s.start_time) >= todayStart)
      .reduce((sum, s) => {
        let dur = s.total_duration
        if (s.status === 'active' && s.last_resume_time) {
          dur += Math.floor((Date.now() - new Date(s.last_resume_time).getTime()) / 1000)
        }
        return sum + dur
      }, 0)
  }, [sessions, todayStart])

  const totalTasks = sessionData.reduce((sum, s) => sum + s.totalTasks, 0)
  const totalCompleted = sessionData.reduce((sum, s) => sum + s.completedTasks, 0)
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

  // Efficiency: tasks per hour
  const totalHours = totalAllTime / 3600
  const efficiency = totalHours > 0 ? totalCompleted / totalHours : 0
  const efficiencyLabel = efficiency >= 3 ? 'High' : efficiency >= 1 ? 'Medium' : 'Low'
  const efficiencyColor = efficiency >= 3 ? 'text-accent' : efficiency >= 1 ? 'text-amber' : 'text-warning'

  // Most productive hour
  const productiveHour = useMemo(() => {
    const hourMap: Record<number, number> = {}
    sessions.forEach(s => {
      const hour = new Date(s.start_time).getHours()
      hourMap[hour] = (hourMap[hour] || 0) + s.total_duration
    })
    let bestHour = 0
    let bestDur = 0
    Object.entries(hourMap).forEach(([h, dur]) => {
      if (dur > bestDur) {
        bestHour = Number(h)
        bestDur = dur
      }
    })
    const startH = bestHour
    const endH = (bestHour + 2) % 24
    const fmt = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM'
      const hh = h % 12 || 12
      return `${hh} ${ampm}`
    }
    return sessions.length > 0 ? `${fmt(startH)} – ${fmt(endH)}` : 'N/A'
  }, [sessions])

  // ━━━ CHART DATA ━━━

  // Progress line chart: sorted by start_time
  const progressChartData = useMemo(() => {
    return [...sessionData]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .map((s, i) => ({
        name: s.title.length > 12 ? s.title.slice(0, 12) + '…' : s.title,
        progress: s.progressPercent,
        session: i + 1,
      }))
  }, [sessionData])

  // Bar chart: sessions vs tasks completed
  const barChartData = useMemo(() => {
    return [...sessionData]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .map(s => ({
        name: s.title.length > 10 ? s.title.slice(0, 10) + '…' : s.title,
        completed: s.completedTasks,
        total: s.totalTasks,
      }))
  }, [sessionData])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs font-medium text-text-primary mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-xs text-text-secondary">
              {p.name}: <span className="font-semibold text-text-primary">{p.value}{p.name === 'progress' ? '%' : ''}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-auto">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-bg-elevated border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-primary" />
              Insights
            </h1>
            <p className="text-text-secondary text-sm mt-0.5">Your productivity at a glance</p>
          </div>
        </div>

        {/* ━━━ TOP SUMMARY CARDS ━━━ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Focus Today */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs text-text-secondary font-medium">Today</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatDuration(totalToday)}</p>
            <p className="text-[11px] text-text-muted mt-1">All time: {formatDuration(totalAllTime)}</p>
          </div>

          {/* Completion Rate */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-text-secondary font-medium">Completion</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{completionRate}%</p>
            <p className="text-[11px] text-text-muted mt-1">{totalCompleted}/{totalTasks} tasks done</p>
          </div>

          {/* Total Sessions */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber" />
              </div>
              <span className="text-xs text-text-secondary font-medium">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{totalSessions}</p>
            <p className="text-[11px] text-text-muted mt-1">
              {sessions.filter(s => s.status === 'completed').length} completed
            </p>
          </div>

          {/* Efficiency */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-text-secondary font-medium">Efficiency</span>
            </div>
            <p className={`text-2xl font-bold ${efficiencyColor}`}>{efficiencyLabel}</p>
            <p className="text-[11px] text-text-muted mt-1">{efficiency.toFixed(1)} tasks/hr</p>
          </div>
        </div>

        {/* ━━━ MIDDLE: CHARTS ━━━ */}
        <div className="mb-8">
          <ProductivityGraph sessions={sessionData} />
        </div>

        {/* ━━━ BOTTOM: ADDITIONAL INSIGHTS ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Productivity Insight */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Peak Hours</h3>
            </div>
            <p className="text-sm text-text-secondary mb-2">
              You're most productive between:
            </p>
            <p className="text-lg font-bold text-primary">{productiveHour}</p>
            <p className="text-[11px] text-text-muted mt-2">
              Based on {totalSessions} session{totalSessions !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Session Breakdown */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">Session Status</h3>
            </div>
            <div className="space-y-2.5">
              {(['active', 'paused', 'completed'] as const).map(status => {
                const count = sessions.filter(s => s.status === status).length
                const pct = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
                const color = status === 'active' ? 'bg-accent' : status === 'paused' ? 'bg-amber' : 'bg-primary'
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary capitalize">{status}</span>
                      <span className="text-xs font-medium text-text-primary">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Average Session */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber" />
              <h3 className="text-sm font-semibold text-text-primary">Averages</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-secondary">Avg session duration</p>
                <p className="text-lg font-bold text-text-primary">
                  {totalSessions > 0 ? formatDuration(Math.round(totalAllTime / totalSessions)) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Avg tasks per session</p>
                <p className="text-lg font-bold text-text-primary">
                  {totalSessions > 0 ? (totalTasks / totalSessions).toFixed(1) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Avg completion rate</p>
                <p className="text-lg font-bold text-text-primary">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
