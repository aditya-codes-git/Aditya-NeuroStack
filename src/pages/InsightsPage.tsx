import { useState, useEffect, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, Variants } from 'framer-motion'
import { useSessionStore } from '@/stores/sessionStore'
import { useChecklistStore } from '@/stores/checklistStore'
import { supabase } from '@/lib/supabase'
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

function CountUp({ value, suffix = '', prefix = '', decimals = 0 }: { value: number, suffix?: string, prefix?: string, decimals?: number }) {
  const count = useMotionValue(0)
  const formatted = useTransform(count, (latest) => {
    const val = decimals > 0 ? latest.toFixed(decimals) : Math.round(latest)
    return `${prefix}${val}${suffix}`
  })

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" })
    return controls.stop
  }, [value, count])

  return <motion.span>{formatted}</motion.span>
}

const formatDurationForAnimation = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function DurationCountUp({ valueInSeconds }: { valueInSeconds: number }) {
  const count = useMotionValue(0)
  const display = useTransform(count, (latest) => formatDurationForAnimation(Math.round(latest)))

  useEffect(() => {
    const controls = animate(count, valueInSeconds, { duration: 1.5, ease: "easeOut" })
    return controls.stop
  }, [valueInSeconds, count])

  return <motion.span>{display}</motion.span>
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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
  const efficiencyColor = efficiency >= 3 ? 'text-accent' : efficiency >= 1 ? 'text-amber' : 'text-neutral-400'

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

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm tracking-widest uppercase">Analyzing Context...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-auto hide-scrollbar">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] opacity-30" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[150px] opacity-30" />
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="relative z-10 max-w-6xl mx-auto px-8 py-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-10">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-primary" />
              Insights
            </h1>
            <p className="text-neutral-500 text-sm mt-0.5 tracking-wide">Your deep work analytics</p>
          </div>
        </motion.div>

        {/* ━━━ TOP SUMMARY CARDS ━━━ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {/* Total Focus Today */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[13px] text-neutral-400 font-medium uppercase tracking-wider">Today</span>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight relative z-10">
              <DurationCountUp valueInSeconds={totalToday} />
            </p>
            <p className="text-[12px] text-neutral-500 mt-2 relative z-10">
              All time: {formatDurationForAnimation(totalAllTime)}
            </p>
          </motion.div>

          {/* Completion Rate */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[13px] text-neutral-400 font-medium uppercase tracking-wider">Completion</span>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight relative z-10">
              <CountUp value={completionRate} suffix="%" />
            </p>
            <p className="text-[12px] text-neutral-500 mt-2 relative z-10">
              {totalCompleted} / {totalTasks} tasks done
            </p>
          </motion.div>

          {/* Total Sessions */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber" />
              </div>
              <span className="text-[13px] text-neutral-400 font-medium uppercase tracking-wider">Sessions</span>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight relative z-10">
              <CountUp value={totalSessions} />
            </p>
            <p className="text-[12px] text-neutral-500 mt-2 relative z-10">
              {sessions.filter(s => s.status === 'completed').length} completed
            </p>
          </motion.div>

          {/* Efficiency */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[13px] text-neutral-400 font-medium uppercase tracking-wider">Efficiency</span>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${efficiencyColor} relative z-10`}>
              {efficiencyLabel}
            </p>
            <p className="text-[12px] text-neutral-500 mt-2 relative z-10">
              <CountUp value={efficiency} decimals={1} suffix=" tasks/hr" />
            </p>
          </motion.div>
        </div>

        {/* ━━━ MIDDLE: CHARTS ━━━ */}
        <motion.div variants={itemVariants} className="mb-10 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-xl">
          <ProductivityGraph sessions={sessionData} />
        </motion.div>

        {/* ━━━ BOTTOM: ADDITIONAL INSIGHTS ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Productivity Insight */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 border border-white/10 hover:bg-white/[0.07] transition-all relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider text-primary">Peak Hours</h3>
            </div>
            <p className="text-[13px] text-neutral-400 mb-2 relative z-10">
              You're most productive between:
            </p>
            <p className="text-xl font-bold text-primary tracking-wide relative z-10">{productiveHour}</p>
            <p className="text-[11px] text-neutral-500 mt-3 uppercase tracking-wider mt-4 relative z-10">
              Based on {totalSessions} session{totalSessions !== 1 ? 's' : ''}
            </p>
          </motion.div>

          {/* Session Breakdown */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 border border-white/10 hover:bg-white/[0.07] transition-all">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-accent" />
              <h3 className="text-[13px] font-semibold text-accent uppercase tracking-wider">Session Status</h3>
            </div>
            <div className="space-y-5">
              {(['active', 'paused', 'completed'] as const).map((status, idx) => {
                const count = sessions.filter(s => s.status === status).length
                const pct = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
                const color = status === 'active' ? 'bg-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]' : status === 'paused' ? 'bg-amber shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-neutral-400 capitalize font-medium">{status}</span>
                      <span className="text-[12px] font-bold text-white flex gap-[3px]">
                        <CountUp value={count} /> (<CountUp value={pct} suffix="%" />)
                      </span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.5, delay: 0.2 + (idx * 0.1), ease: "easeOut" }}
                        className={`h-full ${color} rounded-full`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Average Session */}
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-3xl rounded-2xl p-6 border border-white/10 hover:bg-white/[0.07] transition-all relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <Clock className="w-5 h-5 text-amber" />
              <h3 className="text-[13px] font-semibold text-amber uppercase tracking-wider">Averages</h3>
            </div>
            <div className="space-y-4 relative z-10 flex flex-col justify-center h-[calc(100%-40px)]">
              <div>
                <p className="text-[12px] text-neutral-400 mb-1">Avg session duration</p>
                <p className="text-xl font-bold text-white">
                  {totalSessions > 0 ? formatDurationForAnimation(Math.round(totalAllTime / totalSessions)) : '—'}
                </p>
              </div>
              <div className="h-px w-full bg-white/5 my-2" />
              <div>
                <p className="text-[12px] text-neutral-400 mb-1">Avg tasks per session</p>
                <p className="text-xl font-bold text-white">
                  {totalSessions > 0 ? <CountUp value={totalTasks / totalSessions} decimals={1} /> : '—'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <Footer />
    </div>
  )
}
