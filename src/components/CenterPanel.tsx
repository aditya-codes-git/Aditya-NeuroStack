import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/50"
          >
            <Zap className="w-10 h-10 text-neutral-500" />
          </motion.div>
          <h2 className="text-2xl font-medium text-white mb-3 tracking-tight">Focus Awaits</h2>
          <p className="text-neutral-400 text-sm mb-10 leading-relaxed">
            Create a new session or select an existing one to immerse yourself in your work.
          </p>

          {/* Resume Last Session Suggestion */}
          {lastPausedSession && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl">
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">Resume previous?</p>
                <div className="flex items-center gap-5">
                  <div className="text-left w-48">
                    <p className="text-[15px] font-medium text-white truncate">{lastPausedSession.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Paused {(() => {
                        if (!lastPausedSession.last_paused_at) return ''
                        const diff = Date.now() - new Date(lastPausedSession.last_paused_at).getTime()
                        const mins = Math.floor(diff / 60000)
                        if (mins < 60) return `${mins}m ago`
                        return `${Math.floor(mins / 60)}h ago`
                      })()}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      setSelectedSession(lastPausedSession)
                      handleResumeClick(lastPausedSession)
                    }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] cursor-pointer"
                  >
                    <Play className="w-5 h-5 ml-1" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Resume Packet Modal */}
        <AnimatePresence>
          {showResumePacket && (
            <ResumePacketModal
              session={showResumePacket}
              onDismiss={() => setShowResumePacket(null)}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  const isActive = session.status === 'active'
  const isPaused = session.status === 'paused'
  const isCompleted = session.status === 'completed'
  const displayTime = isActive ? elapsed : session.total_duration
  const rc = session.resume_context

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Cinematic Ambient Glow */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-[600px] h-[600px] bg-accent/30 rounded-full blur-[120px]" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        key={session.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 text-center max-w-xl w-full"
      >
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-8 shadow-sm backdrop-blur-md ${
          isActive ? 'bg-accent/10 border border-accent/30 text-accent shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 
          isPaused ? 'bg-amber/10 border border-amber/30 text-amber' : 
          'bg-white/10 border border-white/20 text-white'
        }`}>
          {isActive && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 rounded-full bg-accent" />}
          {!isActive && <Activity className="w-3.5 h-3.5" />}
          {session.status}
        </div>

        {/* Session Title */}
        <h2 className="text-3xl font-semibold text-white mb-2 tracking-tight">
          {session.title}
        </h2>
        <p className="text-neutral-400 text-sm mb-10 font-mono">
          STARTED {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {session.last_paused_at && ` · PAUSED ${new Date(session.last_paused_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>

        {/* Resume Context Card */}
        {rc && isPaused && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                {rc.type === 'video' ? <Video className="w-5 h-5 text-accent" /> :
                 rc.type === 'document' ? <FileIcon className="w-5 h-5 text-accent" /> :
                 <PenLine className="w-5 h-5 text-accent" />}
              </div>
              <div className="min-w-0 pr-4">
                <span className="text-[10px] text-accent font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3 h-3" /> Resume from
                </span>
                <p className="text-[15px] text-white font-medium truncate">
                  {rc.type === 'video' ? `${rc.position}` :
                   rc.type === 'document' ? `Page ${rc.position}` :
                   rc.position}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* TIMER — Hero Element */}
        <motion.div 
          layoutId="timer-hero"
          className="mb-12"
        >
          <div className={`inline-flex items-center gap-6 px-12 py-10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl transition-all duration-500 ${
            isActive
              ? 'bg-white/[0.03] border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.1)]'
              : isPaused
              ? 'bg-amber/5 border border-amber/20'
              : 'bg-white/5 border border-white/10'
          }`}>
            <Timer className={`w-10 h-10 ${isActive ? 'text-accent' : isPaused ? 'text-amber' : 'text-neutral-500'}`} />
            <span className={`font-mono text-7xl font-light tracking-tight ${
              isActive ? 'text-white' : isPaused ? 'text-amber' : 'text-neutral-500'
            }`}>
              {formatDuration(displayTime)}
            </span>
          </div>
        </motion.div>

        {/* Controls */}
        {!isCompleted && (
          <div className="flex items-center justify-center gap-5">
            {isActive ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPauseCapture(true)}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-amber/10 border border-amber/20 text-amber hover:bg-amber/20 transition-all text-[15px] font-medium cursor-pointer backdrop-blur-md"
                >
                  <Pause className="w-5 h-5" /> Pause
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => completeSession(session.id)}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-accent hover:bg-accent/90 text-white transition-all text-[15px] font-medium shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer"
                >
                  <Square className="w-5 h-5" /> Complete
                </motion.button>
              </>
            ) : isPaused ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleResumeClick(session)}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-accent text-white hover:bg-accent/90 transition-all text-[15px] font-medium shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer"
                >
                  <Play className="w-5 h-5 ml-1" /> Resume
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => completeSession(session.id)}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-all text-[15px] font-medium cursor-pointer backdrop-blur-md"
                >
                  <Square className="w-5 h-5" /> Complete
                </motion.button>
              </>
            ) : null}
          </div>
        )}

        {/* Pause count */}
        {(session.pause_history?.length || 0) > 0 && (
          <div className="mt-8 text-xs text-neutral-500 font-mono">
            {session.pause_history?.length} PAUSE{(session.pause_history?.length ?? 0) > 1 ? 'S' : ''}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showResumePacket && (
          <ResumePacketModal
            session={showResumePacket}
            onDismiss={() => setShowResumePacket(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPauseCapture && (
          <PauseCaptureModal
            session={session}
            onDismiss={() => setShowPauseCapture(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
