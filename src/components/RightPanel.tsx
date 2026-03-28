import { useEffect, useState, useCallback, useRef } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useChecklistStore } from '@/stores/checklistStore'
import { useVideoSummaryStore } from '@/stores/videoSummaryStore'
import { useRealtimeTimer, formatDuration, formatDurationShort } from '@/hooks/useRealtimeTimer'
import { generateSummary, generateTaskSuggestions, generateResumeContext } from '@/lib/groq'
import type { ResumeContext } from '@/types/database'
import {
  Brain, CheckSquare, Link2, Clock, ExternalLink,
  Plus, X, Trash2, Sparkles, Loader2, ChevronDown, ChevronUp,
  Play, Timer, Activity
} from 'lucide-react'

export default function RightPanel() {
  const { selectedSession, activeSession, updateNotes, updateLinks } = useSessionStore()
  const { items, fetchItems, addItem, toggleItem, deleteItem, clearItems } = useChecklistStore()
  const session = selectedSession || activeSession
  const elapsed = useRealtimeTimer(activeSession)

  const [newTask, setNewTask] = useState('')
  const [newLink, setNewLink] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<string>('')
  const [showAi, setShowAi] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch checklist when session changes
  useEffect(() => {
    if (session) {
      fetchItems(session.id)
    } else {
      clearItems()
    }
  }, [session?.id])

  // Debounced notes auto-save (2 second debounce)
  const handleNotesChange = useCallback((value: string) => {
    if (!session) return
    // Optimistic local update immediately
    updateNotes(session.id, value)
    // Debounce the actual save
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateNotes(session.id, value)
    }, 2000)
  }, [session?.id, updateNotes])

  const handleAddTask = async () => {
    if (!session || !newTask.trim()) return
    await addItem(session.id, newTask.trim())
    setNewTask('')
  }

  const handleAddLink = async () => {
    if (!session || !newLink.trim()) return
    const updatedLinks = [...(session.links || []), newLink.trim()]
    await updateLinks(session.id, updatedLinks)
    setNewLink('')
  }

  const handleRemoveLink = async (link: string) => {
    if (!session) return
    const updatedLinks = (session.links || []).filter(l => l !== link)
    await updateLinks(session.id, updatedLinks)
  }

  // AI handlers
  const handleAiSummary = async () => {
    if (!session) return
    setAiLoading(true); setShowAi(true)
    try {
      setAiResult(await generateSummary(session.notes || '', session.title))
    } catch (e: any) { setAiResult(`⚠️ ${e?.message || 'Failed to generate summary. Try again in a moment.'}`) }
    setAiLoading(false)
  }

  const handleAiTasks = async () => {
    if (!session) return
    setAiLoading(true); setShowAi(true)
    try {
      const suggestions = await generateTaskSuggestions(session.title, session.notes || '', items.map(i => i.text))
      for (const task of suggestions) {
        if (task && !task.startsWith('AI not') && !task.startsWith('Could not')) {
          await addItem(session.id, task)
        }
      }
      setAiResult('✅ Tasks added to your checklist!')
    } catch (e: any) { setAiResult(`⚠️ ${e?.message || 'Failed to generate suggestions. Try again in a moment.'}`) }
    setAiLoading(false)
  }

  const handleAiResume = async () => {
    if (!session) return
    setAiLoading(true); setShowAi(true)
    try {
      setAiResult(await generateResumeContext({
        title: session.title, notes: session.notes, total_duration: session.total_duration,
        checklist: items.map(i => ({ text: i.text, completed: i.completed })),
      }))
    } catch (e: any) { setAiResult(`⚠️ ${e?.message || 'Failed to generate resume context. Try again in a moment.'}`) }
    setAiLoading(false)
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-bg-primary">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm font-medium">Session Details</p>
          <p className="text-text-muted text-xs mt-1">Select a session to view details</p>
        </div>
      </div>
    )
  }

  const pendingItems = items.filter(i => !i.completed)
  const completedCount = items.filter(i => i.completed).length
  const isActive = session.status === 'active'
  const displayTime = isActive ? elapsed : session.total_duration

  // Relative time since last paused
  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
      {/* Panel Header */}
      <div className="p-4 border-b border-border bg-bg-primary">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          {isActive ? <Activity className="w-4 h-4 text-accent" /> : <Brain className="w-4 h-4 text-primary" />}
          Session Details
        </h2>
        <p className="text-xs text-text-secondary mt-1 truncate">{session.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ━━━━━ 🧠 WHAT — Context Summary ━━━━━ */}
        <div className="rounded-xl bg-bg-elevated border border-border overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border bg-primary/5">
            <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              You are working on:
            </h3>
          </div>
          <div className="p-3.5">
            {/* Editable Notes */}
            <textarea
              id="session-notes-editor"
              value={session.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes about your progress..."
              rows={4}
              className="w-full bg-bg-primary border border-border rounded-lg py-2 px-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
            />
            <div className="flex items-center mt-1">
              <span className="text-[10px] text-text-muted">Auto-saves every 2s</span>
            </div>
          </div>
        </div>

        {/* ━━━━━ ✅ NEXT — Pending Tasks ━━━━━ */}
        <div className="rounded-xl bg-bg-elevated border border-border overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border bg-amber/5">
            <h3 className="text-xs font-semibold text-amber flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Checklist
              {items.length > 0 && (
                <span className="ml-auto text-[10px] font-normal text-text-muted">
                  {pendingItems.length}/{items.length} pending
                </span>
              )}
            </h3>
          </div>
          <div className="p-3.5">
            {/* Pending items (highlighted) */}
            {pendingItems.length > 0 && (
              <div className="space-y-1 mb-2">
                {pendingItems.map(item => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-hover transition-all border-l-2 border-amber/40"
                  >
                    <button
                      onClick={() => toggleItem(item.id, true)}
                      className="w-3.5 h-3.5 rounded border border-amber/40 hover:border-accent flex items-center justify-center shrink-0 transition-all cursor-pointer"
                    />
                    <span className="text-xs text-text-primary flex-1">{item.text}</span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1 text-text-muted hover:text-warning cursor-pointer transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed items (faded) */}
            {completedCount > 0 && (
              <div className="space-y-1 mb-2 opacity-50">
                {items.filter(i => i.completed).map(item => (
                  <div key={item.id} className="group flex items-center gap-2 p-1.5 rounded-lg">
                    <button
                      onClick={() => toggleItem(item.id, false)}
                      className="w-3.5 h-3.5 rounded bg-accent border-accent flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <span className="text-xs text-text-muted line-through flex-1">{item.text}</span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1 text-text-muted hover:text-warning cursor-pointer transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && (
              <p className="text-xs text-text-muted italic mb-2">No tasks yet</p>
            )}

            {/* Add task */}
            <div className="flex gap-1.5 mt-2">
              <input
                id="new-task-input"
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a task..."
                className="flex-1 bg-bg-primary border border-border rounded-lg py-1.5 px-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                onClick={handleAddTask}
                className="p-1.5 rounded-lg bg-amber/10 text-amber hover:bg-amber/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ━━━━━ 🔗 Resources ━━━━━ */}
        <div className="rounded-xl bg-bg-elevated border border-border overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border">
            <h3 className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              Resources
              {session.links && session.links.length > 0 && (
                <span className="ml-auto text-[10px] text-text-muted">{session.links.length}</span>
              )}
            </h3>
          </div>
          <div className="p-3.5">
            {session.links && session.links.length > 0 ? (
              <div className="space-y-1 mb-2">
                {session.links.map((link) => (
                  <div key={link} className="group flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-hover transition-all">
                    <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-light truncate flex-1"
                    >
                      {(() => { try { return new URL(link).hostname } catch { return link } })()}
                    </a>
                    <button
                      onClick={() => handleRemoveLink(link)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-warning transition-all cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic mb-2">No links yet</p>
            )}

            <div className="flex gap-1.5">
              <input
                id="new-link-input"
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                placeholder="Add a link..."
                className="flex-1 bg-bg-primary border border-border rounded-lg py-1.5 px-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                onClick={handleAddLink}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ━━━━━ 🕒 Activity & Timer ━━━━━ */}
        <div className="rounded-xl bg-bg-elevated border border-border overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border">
            <h3 className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Activity
            </h3>
          </div>
          <div className="p-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Timer */}
              <div className="col-span-2 flex items-center gap-3 p-2.5 rounded-lg bg-bg-primary border border-border">
                <Timer className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                <div>
                  <span className="text-[10px] text-text-muted block">Total Time</span>
                  <span className={`font-mono text-lg font-bold ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                    {formatDuration(displayTime)}
                  </span>
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-accent animate-pulse ml-auto" />}
              </div>

              {/* Last resumed */}
              {session.last_resume_time && (
                <div className="p-2 rounded-lg bg-bg-primary border border-border">
                  <span className="text-[10px] text-text-muted block">Last Resumed</span>
                  <span className="text-xs text-text-primary font-medium">
                    {relativeTime(session.last_resume_time)}
                  </span>
                </div>
              )}

              {/* Last paused */}
              {session.last_paused_at && (
                <div className="p-2 rounded-lg bg-bg-primary border border-border">
                  <span className="text-[10px] text-text-muted block">Last Paused</span>
                  <span className="text-xs text-text-primary font-medium">
                    {relativeTime(session.last_paused_at)}
                  </span>
                </div>
              )}

              {/* Started */}
              <div className={`p-2 rounded-lg bg-bg-primary border border-border ${!session.last_paused_at && !session.last_resume_time ? 'col-span-2' : ''}`}>
                <span className="text-[10px] text-text-muted block">Started</span>
                <span className="text-xs text-text-primary font-medium">
                  {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━━ ✨ AI Assistant ━━━━━ */}
        <div className="rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowAi(!showAi)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer bg-bg-elevated"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI Assistant
            </span>
            {showAi ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAi && (
            <div className="p-3.5 space-y-2.5 bg-bg-elevated border-t border-border animate-fade-in">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={handleAiSummary}
                  disabled={aiLoading}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50 border border-primary/20 font-medium"
                >
                  📝 Summarize
                </button>
                <button
                  onClick={handleAiTasks}
                  disabled={aiLoading}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all cursor-pointer disabled:opacity-50 border border-accent/20 font-medium"
                >
                  ✅ Suggest Tasks
                </button>
                <button
                  onClick={handleAiResume}
                  disabled={aiLoading}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-amber/10 text-amber hover:bg-amber/20 transition-all cursor-pointer disabled:opacity-50 border border-amber/20 font-medium"
                >
                  🧠 Resume Brief
                </button>
              </div>

              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-text-secondary py-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </div>
              )}

              {aiResult && !aiLoading && (
                <div className="bg-bg-primary border border-border rounded-lg p-2.5 text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                  {aiResult}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
