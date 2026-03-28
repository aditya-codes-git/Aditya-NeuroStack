import { useSessionStore } from '@/stores/sessionStore'
import { formatDurationShort } from '@/hooks/useRealtimeTimer'
import type { Session } from '@/types/database'
import { Play, Pause, CheckCircle, Clock } from 'lucide-react'

interface Props {
  session: Session
}

export default function SessionCard({ session }: Props) {
  const { setSelectedSession, selectedSession, pauseSession, resumeSession } = useSessionStore()
  const isSelected = selectedSession?.id === session.id

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
      await resumeSession(session.id)
    }
  }

  const timeAgo = () => {
    const diff = Date.now() - new Date(session.start_time).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
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
      </div>
    </div>
  )
}
