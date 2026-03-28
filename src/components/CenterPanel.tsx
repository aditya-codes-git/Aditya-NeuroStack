import { useSessionStore } from '@/stores/sessionStore'
import { useRealtimeTimer, formatDuration } from '@/hooks/useRealtimeTimer'
import { Play, Pause, Square, Timer, Zap, Activity } from 'lucide-react'

export default function CenterPanel() {
  const { activeSession, selectedSession, pauseSession, resumeSession, completeSession } = useSessionStore()
  const session = activeSession || selectedSession
  const elapsed = useRealtimeTimer(activeSession)

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">No Active Session</h2>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            Create a new session or select an existing one from the left panel to get started.
          </p>
        </div>
      </div>
    )
  }

  const isActive = session.status === 'active'
  const isPaused = session.status === 'paused'
  const isCompleted = session.status === 'completed'
  const displayTime = isActive ? elapsed : session.total_duration

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
      {/* Active glow effect */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        </div>
      )}

      <div className="relative z-10 text-center animate-fade-in max-w-lg w-full">
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 ${
          isActive ? 'status-active' : isPaused ? 'status-paused' : 'status-completed'
        }`}>
          {isActive && <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
          <Activity className="w-3.5 h-3.5" />
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </div>

        {/* Session Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">
          {session.title}
        </h2>
        <p className="text-text-secondary text-sm mb-10">
          Started {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {session.last_paused_at && ` · Last paused ${new Date(session.last_paused_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>

        {/* TIMER — Hero Element */}
        <div className={`mb-10 ${isActive ? 'animate-timer-pulse' : ''}`}>
          <div className={`inline-flex items-center gap-4 px-10 py-8 rounded-3xl ${
            isActive
              ? 'bg-primary/5 border-2 border-primary/30 animate-pulse-glow'
              : isPaused
              ? 'bg-amber/5 border-2 border-amber/20'
              : 'bg-bg-elevated border-2 border-border'
          }`}>
            <Timer className={`w-8 h-8 ${isActive ? 'text-primary' : isPaused ? 'text-amber' : 'text-text-muted'}`} />
            <span className={`font-mono text-5xl font-bold tracking-widest ${
              isActive ? 'text-primary' : isPaused ? 'text-amber' : 'text-text-secondary'
            }`}>
              {formatDuration(displayTime)}
            </span>
          </div>
        </div>

        {/* Controls */}
        {!isCompleted && (
          <div className="flex items-center justify-center gap-4">
            {isActive ? (
              <>
                <button
                  id="pause-session-btn"
                  onClick={() => pauseSession(session.id)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-amber/10 border border-amber/20 text-amber hover:bg-amber/20 transition-all text-sm font-medium cursor-pointer"
                >
                  <Pause className="w-4.5 h-4.5" />
                  Pause
                </button>
                <button
                  id="complete-session-btn"
                  onClick={() => completeSession(session.id)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white transition-all text-sm font-medium shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  Complete
                </button>
              </>
            ) : isPaused ? (
              <>
                <button
                  id="resume-session-btn"
                  onClick={() => resumeSession(session.id)}
                  className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all text-sm font-medium cursor-pointer"
                >
                  <Play className="w-4.5 h-4.5" />
                  Resume
                </button>
                <button
                  id="complete-paused-btn"
                  onClick={() => completeSession(session.id)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-bg-elevated border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-all text-sm font-medium cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  Complete
                </button>
              </>
            ) : null}
          </div>
        )}

        {/* Pause/Resume History */}
        {(session.pause_history?.length || 0) > 0 && (
          <div className="mt-8 text-xs text-text-muted">
            <span>{session.pause_history?.length} pause{(session.pause_history?.length ?? 0) > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}
