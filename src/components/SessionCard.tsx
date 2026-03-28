import { useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { formatDurationShort } from '@/hooks/useRealtimeTimer'
import type { Session } from '@/types/database'
import { Play, Pause, CheckCircle, Clock, Trash2, X } from 'lucide-react'

interface Props {
  session: Session
}

export default function SessionCard({ session }: Props) {
  const { setSelectedSession, selectedSession, pauseSession, deleteSession } = useSessionStore()
  const isSelected = selectedSession?.id === session.id
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const statusConfig = {
    active: { class: 'status-active', icon: Play, label: 'Active' },
    paused: { class: 'status-paused', icon: Pause, label: 'Paused' },
    completed: { class: 'status-completed', icon: CheckCircle, label: 'Done' },
  }

  const config = statusConfig[session.status]
  const StatusIcon = config.icon

  const handleQuickAction = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (session.status === 'active') {
      await pauseSession(session.id)
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
      <div className="p-3 rounded-xl bg-warning/5 border border-warning/30 animate-fade-in">
        <p className="text-xs text-text-primary mb-2">
          Delete <strong>{session.title}</strong>?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="flex-1 py-1.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs font-medium hover:bg-warning/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button
            onClick={handleCancelDelete}
            className="flex-1 py-1.5 rounded-lg bg-bg-elevated border border-border text-text-secondary text-xs hover:bg-bg-hover transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setSelectedSession(session)}
      className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'bg-bg-elevated/50 border border-transparent hover:border-border hover:bg-bg-elevated'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-text-primary truncate flex-1 leading-tight">
          {session.title}
        </h3>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${config.class}`}>
          <StatusIcon className="w-2.5 h-2.5" />
          {config.label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDurationShort(session.total_duration)}
          </span>
          <span>{timeAgo()}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick action: pause/resume */}
          {session.status !== 'completed' && (
            <button
              onClick={handleQuickAction}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all cursor-pointer ${
                session.status === 'active'
                  ? 'hover:bg-amber/10 text-amber'
                  : 'hover:bg-accent/10 text-accent'
              }`}
              title={session.status === 'active' ? 'Pause' : 'Resume'}
            >
              {session.status === 'active' ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-text-muted hover:text-warning hover:bg-warning/10 transition-all cursor-pointer"
            title="Delete session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
