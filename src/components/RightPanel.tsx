import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { BrandBadge, SectionTitle } from '@/components/ui/sidebar-component'

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
      <aside className="bg-white/5 backdrop-blur-3xl border-l border-white/5 flex flex-col w-[340px] min-w-[340px] transition-all duration-500 z-10 hide-scrollbar h-full items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Brain className="w-7 h-7 text-neutral-500" />
          </div>
          <p className="text-neutral-300 text-sm font-medium">Session Details</p>
          <p className="text-neutral-500 text-xs mt-1">Select a session to view details</p>
        </motion.div>
      </aside>
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
    <aside className="bg-white/5 backdrop-blur-3xl border-l border-white/5 flex flex-col w-[340px] min-w-[340px] transition-all duration-500 z-10 hide-scrollbar h-full">
      {/* Panel Header */}
      <div className="p-5 border-b border-white/5">
        <SectionTitle 
          title="Session Details" 
          isCollapsed={false} 
          onToggleCollapse={() => {}}
          rightElement={isActive ? <Activity className="w-4 h-4 text-accent" /> : <Brain className="w-4 h-4 text-primary" />}
        />
        <p className="text-[13px] text-neutral-400 mt-1 truncate font-medium">{session.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 hide-scrollbar relative">
        <AnimatePresence>
          {/* ━━━━━ 🧠 WHAT — Context Summary ━━━━━ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <h3 className="text-xs font-semibold text-primary flex items-center gap-2 uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5" /> Context Notes
              </h3>
            </div>
            <div className="p-3">
              <textarea
                id="session-notes-editor"
                value={session.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Jot down quick thoughts..."
                rows={4}
                className="w-full bg-transparent border-0 border-b border-transparent py-2 px-2 text-[13px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50 focus:bg-white/[0.03] transition-all resize-none leading-relaxed rounded-md"
              />
            </div>
          </motion.div>

          {/* ━━━━━ ✅ NEXT — Pending Tasks ━━━━━ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-amber flex items-center gap-2 uppercase tracking-wider">
                <CheckSquare className="w-3.5 h-3.5" /> Tasks
              </h3>
              {items.length > 0 && (
                <span className="text-[10px] font-medium text-amber/60">
                  {pendingItems.length} left
                </span>
              )}
            </div>
            <div className="p-3">
              {pendingItems.length > 0 && (
                <div className="space-y-1 mb-3">
                  {pendingItems.map(item => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      key={item.id}
                      className="group flex flex-start gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-all border-l-2 border-transparent hover:border-amber/40"
                    >
                      <button
                        onClick={() => toggleItem(item.id, true)}
                        className="w-4 h-4 mt-0.5 rounded-md border border-amber/40 hover:border-accent hover:bg-accent/10 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                      />
                      <span className="text-[13px] text-white flex-1 leading-tight">{item.text}</span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-500 hover:text-warning hover:bg-warning/10 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {completedCount > 0 && (
                <div className="space-y-1 mb-3">
                  {items.filter(i => i.completed).map(item => (
                    <motion.div layout key={item.id} className="group flex flex-start gap-2.5 p-2 rounded-xl opacity-40 hover:opacity-100 transition-all">
                      <button
                        onClick={() => toggleItem(item.id, false)}
                        className="w-4 h-4 mt-0.5 rounded-md bg-white/20 border-transparent flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/30"
                      >
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <span className="text-[13px] text-white flex-1 leading-tight">{item.text}</span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-500 hover:text-warning hover:bg-warning/10 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-4 mb-2">
                  <p className="text-[11px] text-neutral-500 uppercase tracking-widest">No tasks yet</p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  id="new-task-input"
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Type a task & press Enter"
                  className="flex-1 bg-transparent border-0 border-b border-white/10 rounded-none py-2 px-1 text-[13px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber/50 focus:bg-white/[0.03] transition-all"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddTask}
                  className="p-2 rounded-xl bg-white/5 text-amber hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ━━━━━ 🔗 Resources ━━━━━ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="text-xs font-semibold text-primary flex items-center gap-2 uppercase tracking-wider">
                <Link2 className="w-3.5 h-3.5" /> Resources
              </h3>
              {session.links && session.links.length > 0 && (
                <span className="text-[10px] text-primary/60 font-medium">{session.links.length} saved</span>
              )}
            </div>
            <div className="p-3">
              {session.links && session.links.length > 0 ? (
                <div className="space-y-1 mb-3">
                  {session.links.map((link) => (
                    <div key={link} className="group flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all outline outline-1 outline-transparent hover:outline-white/10">
                      <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-white hover:text-primary transition-colors truncate flex-1"
                      >
                        {(() => { try { return new URL(link).hostname } catch { return link } })()}
                      </a>
                      <button
                        onClick={() => handleRemoveLink(link)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-500 hover:text-warning hover:bg-warning/10 cursor-pointer transition-all"
                      >
                        <X className="w-3h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 mb-2">
                  <p className="text-[11px] text-neutral-500 uppercase tracking-widest">No links yet</p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  id="new-link-input"
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                  placeholder="Paste URL..."
                  className="flex-1 bg-transparent border-0 border-b border-white/10 rounded-none py-2 px-1 text-[13px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50 focus:bg-white/[0.03] transition-all"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddLink}
                  className="p-2 rounded-xl bg-white/5 text-primary hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ━━━━━ ✨ AI Assistant ━━━━━ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-accent/20 overflow-hidden bg-accent/5 backdrop-blur-md">
            <button
              onClick={() => setShowAi(!showAi)}
              className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold text-accent uppercase tracking-wider hover:bg-accent/10 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> AI Assistant
              </span>
              {showAi ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {showAi && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-3 border-t border-accent/10 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAiSummary}
                        disabled={aiLoading}
                        className="col-span-1 text-[11px] py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50 border border-white/10 font-medium flex items-center justify-center gap-1.5"
                      >
                        📝 Summarize
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAiTasks}
                        disabled={aiLoading}
                        className="col-span-1 text-[11px] py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50 border border-white/10 font-medium flex items-center justify-center gap-1.5"
                      >
                        ✅ Suggest Tasks
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAiResume}
                        disabled={aiLoading}
                        className="col-span-2 text-[11px] py-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.3)] font-medium flex items-center justify-center gap-1.5"
                      >
                        🧠 Generate Resume Brief
                      </motion.button>
                    </div>

                    {aiLoading && (
                      <div className="flex items-center justify-center gap-2 text-[11px] text-accent py-2 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Insights...
                      </div>
                    )}

                    {aiResult && !aiLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-black/20 border border-white/10 rounded-xl p-3 text-[12px] text-neutral-300 leading-relaxed whitespace-pre-wrap shadow-inner">
                        {aiResult}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </AnimatePresence>
      </div>
    </aside>
  )
}
