import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/stores/sessionStore'
import { useThemeStore } from '@/stores/themeStore'
import SessionCard from './SessionCard'
import CreateSessionModal from './CreateSessionModal'
import { Plus, Search, Calendar, Archive, Clock, Activity, Timer } from 'lucide-react'
import { BrandBadge, SearchContainer, SectionTitle } from '@/components/ui/sidebar-component'

type View = 'today' | 'archive' | 'timeline'

export default function LeftPanel() {
  const { sessions, activeSession, error } = useSessionStore()
  const { theme, toggleTheme } = useThemeStore() // For theme switching from Left Panel
  const [view, setView] = useState<View>('today')
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const todaySessions = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return sessions.filter(s => new Date(s.start_time) >= start)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
  }, [sessions])

  // Timeline: chronological (earliest first)
  const timelineSessions = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return sessions.filter(s => new Date(s.start_time) >= start)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [sessions])

  const filteredSessions = useMemo(() => {
    let result = view === 'today' ? todaySessions : view === 'timeline' ? timelineSessions : sessions
    if (searchQuery) {
      result = result.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter)
    }
    return result
  }, [view, todaySessions, timelineSessions, sessions, searchQuery, statusFilter])

  // Separate active session for pinning (only in today/archive views)
  const pinnedSession = view !== 'timeline' ? activeSession : null
  const unpinnedSessions = pinnedSession
    ? filteredSessions.filter(s => s.id !== pinnedSession.id)
    : filteredSessions

  const totalTodayTime = useMemo(() => {
    return todaySessions.reduce((sum, s) => {
      let dur = s.total_duration
      if (s.status === 'active' && s.last_resume_time) {
        dur += Math.floor((Date.now() - new Date(s.last_resume_time).getTime()) / 1000)
      }
      return sum + dur
    }, 0)
  }, [todaySessions])

  const formatTotalTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDur = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  return (
    <aside className="bg-white/5 backdrop-blur-3xl border-r border-white/5 flex flex-col w-[340px] min-w-[340px] transition-all duration-500 z-10 hide-scrollbar h-full">
      <div className="p-4 flex flex-col gap-4">
        {/* BrandBadge area */}
        <BrandBadge />

        {/* Panel Header */}
        <div className="flex items-center justify-between">
          <SectionTitle 
            title="Sessions" 
            isCollapsed={false} 
            onToggleCollapse={() => {}}
            rightElement={
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCreate(true)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                title="New Session"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            }
          />
        </div>

        {/* Search */}
        <SearchContainer value={searchQuery} onChange={setSearchQuery} />

        {/* Filters */}
        <div className="flex gap-2 w-full">
          <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 flex-1">
            <button
              onClick={() => setView('today')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                view === 'today' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                view === 'timeline' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('archive')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                view === 'archive' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Archive
            </button>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-neutral-300 focus:outline-none focus:border-white/20 cursor-pointer"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Done</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg text-warning text-xs animate-fade-in">
          {error}
        </div>
      )}

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 hide-scrollbar">
        <AnimatePresence>
          {/* === TIMELINE VIEW === */}
          {view === 'timeline' ? (
            timelineSessions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <Timer className="w-5 h-5 text-neutral-500" />
                </div>
                <p className="text-neutral-400 text-sm">No sessions today</p>
                <p className="text-neutral-500 text-xs mt-1">Start your first session</p>
              </motion.div>
            ) : (
              <div className="relative">
                <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-white/10 rounded-full" />
                {timelineSessions.map((session, i) => {
                  const statusColor =
                    session.status === 'active' ? 'bg-accent border-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                    session.status === 'paused' ? 'bg-amber border-amber' :
                    'bg-primary border-primary'

                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={session.id}
                      className="relative flex gap-3 pb-4 cursor-pointer group"
                      onClick={() => useSessionStore.getState().setSelectedSession(session)}
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 mt-1 shrink-0">
                        <div className={`w-[10px] h-[10px] rounded-full border-2 ${statusColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-3 rounded-xl border border-transparent group-hover:bg-white/5 group-hover:border-white/10 transition-all">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-neutral-500">
                            {formatTime(session.start_time)}
                          </span>
                          {session.end_time && (
                            <>
                              <span className="text-[10px] text-neutral-600">→</span>
                              <span className="text-[10px] font-mono text-neutral-500">
                                {formatTime(session.end_time)}
                              </span>
                            </>
                          )}
                          {session.status === 'active' && (
                            <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
                              <Activity className="w-2.5 h-2.5" /> Live
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
                          {session.title}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          ) : (
            /* === TODAY / ARCHIVE VIEW === */
            <>
              {/* Pinned active session */}
              {pinnedSession && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <Activity className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Active Now</span>
                  </div>
                  <motion.div animate={{ scale: [1, 1.01, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="border border-accent/20 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <SessionCard session={pinnedSession} />
                  </motion.div>
                </motion.div>
              )}

              {/* Regular sessions */}
              {unpinnedSessions.length === 0 && !pinnedSession ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-5 h-5 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 text-sm">No sessions found</p>
                  <p className="text-neutral-500 text-xs mt-1">
                    {view === 'today' ? 'Start your first session today' : 'Try adjusting your filters'}
                  </p>
                </motion.div>
              ) : (
                unpinnedSessions.map((session, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    key={session.id} 
                    className="mb-2"
                  >
                    <SessionCard session={session} />
                  </motion.div>
                ))
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      {showCreate && <CreateSessionModal onClose={() => setShowCreate(false)} />}
    </aside>
  )
}
