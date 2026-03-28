import { useEffect, useState, useCallback, useRef } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useChecklistStore } from '@/stores/checklistStore'
import { formatDurationShort } from '@/hooks/useRealtimeTimer'
import { generateSummary, generateTaskSuggestions, generateResumeContext } from '@/lib/gemini'
import {
  FileText, CheckSquare, Link2, Clock, ExternalLink,
  Plus, X, Trash2, Sparkles, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'

export default function RightPanel() {
  const { selectedSession, activeSession, updateNotes, updateLinks } = useSessionStore()
  const { items, fetchItems, addItem, toggleItem, deleteItem, clearItems } = useChecklistStore()
  const session = selectedSession || activeSession

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

  // Debounced notes auto-save
  const handleNotesChange = useCallback((value: string) => {
    if (!session) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateNotes(session.id, value)
    }, 2000)
    // Optimistic local update
    updateNotes(session.id, value)
  }, [session, updateNotes])

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

  const handleAiSummary = async () => {
    if (!session) return
    setAiLoading(true)
    setShowAi(true)
    try {
      const result = await generateSummary(session.notes || '', session.title)
      setAiResult(result)
    } catch {
      setAiResult('Failed to generate summary')
    }
    setAiLoading(false)
  }

  const handleAiTasks = async () => {
    if (!session) return
    setAiLoading(true)
    setShowAi(true)
    try {
      const suggestions = await generateTaskSuggestions(
        session.title,
        session.notes || '',
        items.map(i => i.text)
      )
      for (const task of suggestions) {
        if (task && !task.startsWith('AI not') && !task.startsWith('Could not')) {
          await addItem(session.id, task)
        }
      }
      setAiResult('✅ Tasks added to your checklist!')
    } catch {
      setAiResult('Failed to generate suggestions')
    }
    setAiLoading(false)
  }

  const handleAiResume = async () => {
    if (!session) return
    setAiLoading(true)
    setShowAi(true)
    try {
      const result = await generateResumeContext({
        title: session.title,
        notes: session.notes,
        total_duration: session.total_duration,
        checklist: items.map(i => ({ text: i.text, completed: i.completed })),
      })
      setAiResult(result)
    } catch {
      setAiResult('Failed to generate resume context')
    }
    setAiLoading(false)
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-secondary text-sm">Select a session to view details</p>
        </div>
      </div>
    )
  }

  const completedCount = items.filter(i => i.completed).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Resume Packet
        </h2>
        <p className="text-xs text-text-secondary mt-1 truncate">{session.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Session Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-elevated rounded-xl p-3 border border-border">
            <div className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Duration
            </div>
            <div className="text-sm font-semibold text-text-primary font-mono">
              {formatDurationShort(session.total_duration)}
            </div>
          </div>
          <div className="bg-bg-elevated rounded-xl p-3 border border-border">
            <div className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
              <CheckSquare className="w-3 h-3" />
              Tasks
            </div>
            <div className="text-sm font-semibold text-text-primary">
              {completedCount}/{items.length}
            </div>
          </div>
          {session.last_paused_at && (
            <div className="col-span-2 bg-bg-elevated rounded-xl p-3 border border-border">
              <div className="text-xs text-text-muted mb-1">Last Paused</div>
              <div className="text-sm text-text-primary">
                {new Date(session.last_paused_at).toLocaleString([], {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Notes
            <span className="text-text-muted text-[10px] ml-auto">Auto-saves</span>
          </h3>
          <textarea
            id="session-notes-editor"
            value={session.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes about your progress..."
            rows={5}
            className="w-full bg-bg-elevated border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Checklist */}
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            Checklist
            {items.length > 0 && (
              <span className="text-text-muted text-[10px] ml-auto">
                {completedCount}/{items.length} done
              </span>
            )}
          </h3>

          {/* Task list */}
          <div className="space-y-1.5 mb-2">
            {items.map(item => (
              <div
                key={item.id}
                className="group flex items-center gap-2 p-2 rounded-lg hover:bg-bg-elevated transition-all"
              >
                <button
                  onClick={() => toggleItem(item.id, !item.completed)}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    item.completed
                      ? 'bg-accent border-accent'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {item.completed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm flex-1 ${item.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-warning transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add task input */}
          <div className="flex gap-2">
            <input
              id="new-task-input"
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Add a task..."
              className="flex-1 bg-bg-elevated border border-border rounded-lg py-1.5 px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
            <button
              onClick={handleAddTask}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Links
          </h3>

          {session.links && session.links.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {session.links.map((link) => (
                <div key={link} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-bg-elevated transition-all">
                  <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary-light truncate flex-1"
                  >
                    {link}
                  </a>
                  <button
                    onClick={() => handleRemoveLink(link)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-warning transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              id="new-link-input"
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              placeholder="Add a link..."
              className="flex-1 bg-bg-elevated border border-border rounded-lg py-1.5 px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
            <button
              onClick={handleAddLink}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="border-t border-border pt-4">
          <button
            onClick={() => setShowAi(!showAi)}
            className="w-full flex items-center justify-between text-xs font-medium text-text-secondary mb-3 cursor-pointer hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI Assistant
            </span>
            {showAi ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAi && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAiSummary}
                  disabled={aiLoading}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50 border border-primary/20"
                >
                  Summarize Notes
                </button>
                <button
                  onClick={handleAiTasks}
                  disabled={aiLoading}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all cursor-pointer disabled:opacity-50 border border-accent/20"
                >
                  Suggest Tasks
                </button>
                <button
                  onClick={handleAiResume}
                  disabled={aiLoading}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-amber/10 text-amber hover:bg-amber/20 transition-all cursor-pointer disabled:opacity-50 border border-amber/20"
                >
                  Resume Context
                </button>
              </div>

              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-text-secondary py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </div>
              )}

              {aiResult && !aiLoading && (
                <div className="bg-bg-elevated border border-border rounded-xl p-3 text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
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
