import { useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useRealtimeTimer, formatDuration } from '@/hooks/useRealtimeTimer'
import { Play, Pause, Square, Timer, Zap, Activity, MapPin, Video, FileIcon, PenLine } from 'lucide-react'
import ResumePacketModal from './ResumePacketModal'
import PauseCaptureModal from './PauseCaptureModal'
import type { Session } from '@/types/database'

export default function CenterPanel() {
  const { activeSession, selectedSession, sessions, completeSession, setSelectedSession, pauseSession } = useSessionStore()
  const session = activeSession || selectedSession
  const elapsed = useRealtimeTimer(activeSession)
  const [showResumePacket, setShowResumePacket] = useState<Session | null>(null)
  const [showPauseCapture, setShowPauseCapture] = useState(false)

  // Find last paused session for "Resume last session?" suggestion
  const lastPausedSession = !activeSession
    ? sessions.find(s => s.status === 'paused')
    : null

  // When user clicks Resume → show Resume Packet Modal (don't resume directly)
  const handleResumeClick = (targetSession: Session) => {
    setShowResumePacket(targetSession)
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">No Active Session</h2>
          <p className="text-text-secondary text-sm max-w-xs mx-auto mb-6">
            Create a new session or select an existing one from the left panel to get started.
          </p>

          {/* Resume Last Session Suggestion */}
          {lastPausedSession && (
            <div className="animate-slide-up">
              <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-accent/5 border border-accent/20">
                <p className="text-xs text-text-secondary">Resume your last session?</p>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{lastPausedSession.title}</p>
                    <p className="text-xs text-text-muted">
                      Paused {(() => {
                        if (!lastPausedSession.last_paused_at) return ''
                        const diff = Date.now() - new Date(lastPausedSession.last_paused_at).getTime()
                        const mins = Math.floor(diff / 60000)
                        if (mins < 60) return `${mins}m ago`
                        return `${Math.floor(mins / 60)}h ago`
                      })()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSession(lastPausedSession)
                      handleResumeClick(lastPausedSession)
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-medium hover:bg-accent/80 transition-all cursor-pointer shadow-lg shadow-accent/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resume Packet Modal */}
        {showResumePacket && (
          <ResumePacketModal
            session={showResumePacket}
            onDismiss={() => setShowResumePacket(null)}
          />
        )}
      </div>
    )
  }

  const isActive = session.status === 'active'
  const isPaused = session.status === 'paused'
  const isCompleted = session.status === 'completed'
  const displayTime = isActive ? elapsed : session.total_duration
  const rc = session.resume_context

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
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 ${
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
        <p className="text-text-secondary text-sm mb-8">
          Started {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {session.last_paused_at && ` · Last paused ${new Date(session.last_paused_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>

        {/* Resume Context Card — shown when session has resume position (paused only) */}
        {rc && isPaused && (
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-accent/5 border border-accent/20 text-left max-w-sm">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                {rc.type === 'video' ? <Video className="w-4.5 h-4.5 text-accent" /> :
                 rc.type === 'document' ? <FileIcon className="w-4.5 h-4.5 text-accent" /> :
                 <PenLine className="w-4.5 h-4.5 text-accent" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-accent font-semibold uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  Resume from
                </span>
                <p className="text-sm text-text-primary font-medium truncate">
                  {rc.type === 'video' ? `${rc.position}` :
                   rc.type === 'document' ? `Page ${rc.position}` :
                   rc.position}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TIMER — Hero Element */}
        <div className={`mb-8 ${isActive ? 'animate-timer-pulse' : ''}`}>
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
                  onClick={() => setShowPauseCapture(true)}
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
                  onClick={() => handleResumeClick(session)}
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

        {/* Pause count */}
        {(session.pause_history?.length || 0) > 0 && (
          <div className="mt-6 text-xs text-text-muted">
            <span>{session.pause_history?.length} pause{(session.pause_history?.length ?? 0) > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Resume Packet Modal */}
      {showResumePacket && (
        <ResumePacketModal
          session={showResumePacket}
          onDismiss={() => setShowResumePacket(null)}
        />
      )}

      {/* Pause Capture Modal */}
      {showPauseCapture && (
        <PauseCaptureModal
          session={session}
          onDismiss={() => setShowPauseCapture(false)}
        />
      )}
    </div>
  )
}
