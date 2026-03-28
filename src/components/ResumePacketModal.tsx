import { useState, useEffect } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useChecklistStore } from '@/stores/checklistStore'
import { formatDurationShort } from '@/hooks/useRealtimeTimer'
import { generateResumePacketBrief } from '@/lib/gemini'
import type { Session } from '@/types/database'
import {
  Brain, MapPin, CheckSquare, Link2, Clock, ExternalLink,
  Play, Video, FileIcon, PenLine, Loader2, X, Sparkles, Timer
} from 'lucide-react'

interface Props {
  session: Session
  onDismiss: () => void
}

export default function ResumePacketModal({ session, onDismiss }: Props) {
  const { resumeSession } = useSessionStore()
  const { items, fetchItems } = useChecklistStore()
  const [aiSummary, setAiSummary] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(true)
  const [resuming, setResuming] = useState(false)

  const pendingItems = items.filter(i => !i.completed)
  const completedCount = items.filter(i => i.completed).length
  const rc = session.resume_context

  // Fetch checklist + generate AI summary on mount
  useEffect(() => {
    fetchItems(session.id)
    generateBrief()
  }, [session.id])

  const generateBrief = async () => {
    setAiLoading(true)
    try {
      const summary = await generateResumePacketBrief({
        title: session.title,
        notes: session.notes,
        total_duration: session.total_duration,
        checklist: items.map(i => ({ text: i.text, completed: i.completed })),
        resumeContext: session.resume_context || undefined,
      })
      setAiSummary(summary)
    } catch (e: any) {
      setAiSummary(e?.message || 'Could not generate AI summary')
    }
    setAiLoading(false)
  }

  const handleResume = async () => {
    setResuming(true)
    await resumeSession(session.id)
    setResuming(false)
    onDismiss()
  }

  // Build resume link for video with timestamp
  const buildResumeLink = (): string | null => {
    if (!rc?.link) return null
    if (rc.type === 'video' && rc.position) {
      const parts = rc.position.split(':').map(Number)
      let seconds = 0
      if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
      else if (parts.length === 2) seconds = parts[0] * 60 + parts[1]
      else seconds = parts[0] || 0

      if (rc.link.includes('youtube.com') || rc.link.includes('youtu.be')) {
        const url = new URL(rc.link)
        url.searchParams.set('t', `${seconds}s`)
        return url.toString()
      }
    }
    return rc.link
  }

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto glass-elevated rounded-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-bg-elevated/95 backdrop-blur-sm flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Resume Packet</h2>
              <p className="text-xs text-text-secondary">Pick up where you left off</p>
            </div>
          </div>
          <button onClick={onDismiss} className="p-2 rounded-lg hover:bg-bg-hover text-text-secondary transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ━━━ Session Info ━━━ */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-text-primary">{session.title}</h3>
              {session.last_paused_at && (
                <p className="text-xs text-text-muted mt-1">
                  Paused {relativeTime(session.last_paused_at)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border">
              <Timer className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-sm font-semibold text-text-primary">
                {formatDurationShort(session.total_duration)}
              </span>
            </div>
          </div>

          {/* ━━━ 🧠 WHAT — You were working on ━━━ */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-primary/5 border-b border-border">
              <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                🧠 You were working on:
              </h4>
            </div>
            <div className="p-4">
              {session.notes ? (
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {session.notes.length > 300 ? session.notes.slice(0, 300) + '...' : session.notes}
                </p>
              ) : (
                <p className="text-sm text-text-muted italic">No notes saved</p>
              )}
            </div>
          </div>

          {/* ━━━ 📍 WHERE — Resume from ━━━ */}
          {rc && (
            <div className="rounded-xl border border-accent/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-accent/5 border-b border-accent/15">
                <h4 className="text-xs font-semibold text-accent flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  📍 Resume from:
                </h4>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    {rc.type === 'video' ? <Video className="w-5 h-5 text-accent" /> :
                     rc.type === 'document' ? <FileIcon className="w-5 h-5 text-accent" /> :
                     <PenLine className="w-5 h-5 text-accent" />}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-accent/70 block">
                      {rc.type === 'video' ? '▶ Video' : rc.type === 'document' ? '📄 Document' : '✏️ Manual Note'}
                    </span>
                    <p className="text-sm font-semibold text-text-primary">
                      {rc.type === 'video' ? `Timestamp: ${rc.position}` :
                       rc.type === 'document' ? `Page ${rc.position}` :
                       rc.position}
                    </p>
                  </div>
                </div>

                {rc.link && (
                  <a
                    href={buildResumeLink() || rc.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-sm font-medium w-full"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {rc.type === 'video' ? `Open video at ${rc.position}` :
                       rc.type === 'document' ? `Open document (Page ${rc.position})` :
                       'Open link'}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ━━━ ✅ NEXT — Pending Tasks ━━━ */}
          {items.length > 0 && (
            <div className="rounded-xl border border-amber/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-amber/5 border-b border-amber/15">
                <h4 className="text-xs font-semibold text-amber flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  ✅ Next steps
                  <span className="ml-auto text-[10px] font-normal text-text-muted">
                    {pendingItems.length} pending · {completedCount} done
                  </span>
                </h4>
              </div>
              <div className="p-4 space-y-1.5">
                {pendingItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 py-1.5 border-l-2 border-amber/40 pl-3">
                    <div className="w-3 h-3 rounded border border-amber/40 shrink-0" />
                    <span className="text-sm text-text-primary">{item.text}</span>
                  </div>
                ))}
                {completedCount > 0 && (
                  <p className="text-xs text-text-muted mt-2 pl-3">
                    + {completedCount} completed task{completedCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ━━━ 🔗 Resources ━━━ */}
          {session.links && session.links.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-bg-elevated border-b border-border">
                <h4 className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  🔗 Quick Access Links
                </h4>
              </div>
              <div className="p-4 space-y-2">
                {session.links.map(link => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-hover transition-all text-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-primary truncate">
                      {(() => { try { return new URL(link).hostname + new URL(link).pathname.slice(0, 30) } catch { return link } })()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ━━━ 🤖 AI Summary (auto-generated) ━━━ */}
          <div className="rounded-xl border border-primary/20 overflow-hidden">
            <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/15">
              <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                🤖 AI Resume Brief
              </h4>
            </div>
            <div className="p-4">
              {aiLoading ? (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Generating your resume brief...
                </div>
              ) : aiSummary ? (
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {aiSummary}
                </p>
              ) : null}
            </div>
          </div>

        </div>

        {/* Footer — Resume Button */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-bg-elevated/95 backdrop-blur-sm rounded-b-2xl">
          <button
            id="resume-confirm-btn"
            onClick={handleResume}
            disabled={resuming}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-accent hover:brightness-110 text-white font-semibold text-sm transition-all shadow-lg shadow-accent/20 cursor-pointer disabled:opacity-50"
          >
            {resuming ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <>
                <Play className="w-4.5 h-4.5" />
                Continue Working
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
