import { useState, useMemo } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import SessionCard from './SessionCard'
import CreateSessionModal from './CreateSessionModal'
import { Plus, Search, Calendar, Archive, Filter } from 'lucide-react'

type View = 'today' | 'archive'

export default function LeftPanel() {
  const { sessions, activeSession, error } = useSessionStore()
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

  const filteredSessions = useMemo(() => {
    let result = view === 'today' ? todaySessions : sessions
    if (searchQuery) {
      result = result.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter)
    }
    return result
  }, [view, todaySessions, sessions, searchQuery, statusFilter])

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
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <>
      {/* Panel Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Sessions
          </h2>
          <button
            id="create-session-btn"
            onClick={() => setShowCreate(true)}
            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
            title="New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg bg-bg-elevated p-0.5 border border-border">
          <button
            onClick={() => setView('today')}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'today' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Today
          </button>
          <button
            onClick={() => setView('archive')}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'archive' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Archive className="w-3 h-3" />
            Archive
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              id="session-search"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg py-1.5 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Done</option>
          </select>
        </div>

        {/* Today Stats */}
        {view === 'today' && (
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} today</span>
            <span className="font-mono text-primary">{formatTotalTime(totalTodayTime)}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg text-warning text-xs animate-fade-in">
          {error}
        </div>
      )}

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-text-secondary text-sm">No sessions found</p>
            <p className="text-text-muted text-xs mt-1">
              {view === 'today' ? 'Start your first session today' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filteredSessions.map((session, i) => (
            <div key={session.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <SessionCard session={session} />
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateSessionModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
