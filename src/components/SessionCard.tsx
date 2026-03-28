import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/stores/sessionStore'
import { useRealtimeTimer, formatDurationShort } from '@/hooks/useRealtimeTimer'
import PauseCaptureModal from './PauseCaptureModal'
import type { Session } from '@/types/database'
import { Play, Pause, CheckCircle, Clock, Trash2 } from 'lucide-react'

interface Props {
  session: Session
}

export default function SessionCard({ session }: Props) {
  const { setSelectedSession, selectedSession, pauseSession, deleteSession } = useSessionStore()
  const isSelected = selectedSession?.id === session.id
  const elapsed = useRealtimeTimer(session)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)

  const statusConfig = {
    active: { class: 'bg-accent/10 text-accent border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]', icon: Play, label: 'Active' },
    paused: { class: 'bg-amber/10 text-amber border-amber/30', icon: Pause, label: 'Paused' },
    completed: { class: 'bg-white/10 text-white border-white/20', icon: CheckCircle, label: 'Done' },
  }

  const config = statusConfig[session.status]
  const StatusIcon = config.icon

  const handleQuickAction = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (session.status === 'active') {
      setShowPauseModal(true)
    } else if (session.status === 'paused') {
      setSelectedSession(session)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDelete(true)
  }

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    await deleteSession(session.id)
    setDeleting(false)
    setConfirmDelete(false)
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDelete(false)
  }

  const timeAgo = () => {
    const diff = Date.now() - new Date(session.start_time).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  // Inline delete confirmation
  if (confirmDelete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-3 rounded-xl bg-warning/10 border border-warning/30 backdrop-blur-md"
      >
        <p className="text-xs text-white mb-2">
          Delete <strong>{session.title}</strong>?
        </p>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="flex-1 py-1.5 rounded-lg bg-warning/20 border border-warning/40 text-warning text-xs font-medium hover:bg-warning/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCancelDelete}
            className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 text-xs hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedSession(session)}
        className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-xl relative overflow-hidden ${
          isSelected
            ? 'bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
            : 'bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
          <h3 className="text-[14px] font-medium text-white truncate flex-1 leading-snug">
            {session.title}
          </h3>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide shrink-0 border ${config.class}`}>
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDurationShort(elapsed)}
            </span>
            <span>{timeAgo()}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick action: pause/resume */}
            {session.status !== 'completed' && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleQuickAction}
                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all cursor-pointer ${
                  session.status === 'active'
                    ? 'hover:bg-amber/20 text-amber'
                    : 'hover:bg-accent/20 text-accent'
                }`}
                title={session.status === 'active' ? 'Pause' : 'Resume'}
              >
                {session.status === 'active' ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </motion.button>
            )}

            {/* Delete button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleDeleteClick}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-warning hover:bg-warning/20 transition-all cursor-pointer"
              title="Delete session"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {showPauseModal && (
        <PauseCaptureModal
          session={session}
          onDismiss={() => setShowPauseModal(false)}
        />
      )}
    </>
  )
}
