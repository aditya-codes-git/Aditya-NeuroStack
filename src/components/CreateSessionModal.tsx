import { useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { X, Plus, Link2, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function CreateSessionModal({ onClose }: Props) {
  const { createSession } = useSessionStore()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [links, setLinks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLink = () => {
    const trimmed = linkInput.trim()
    if (trimmed && !links.includes(trimmed)) {
      setLinks([...links, trimmed])
      setLinkInput('')
    }
  }

  const removeLink = (link: string) => {
    setLinks(links.filter(l => l !== link))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const success = await createSession({
      title,
      notes: notes || undefined,
      links,
    })
    setLoading(false)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-elevated rounded-2xl w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">New Session</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="session-title" className="block text-xs font-medium text-text-secondary mb-1.5">
              Session Title *
            </label>
            <input
              id="session-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you working on?"
              required
              className="w-full bg-bg-primary border border-border rounded-xl py-2.5 px-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="session-notes" className="block text-xs font-medium text-text-secondary mb-1.5">
              Initial Notes
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, goals, or initial thoughts..."
              rows={3}
              className="w-full bg-bg-primary border border-border rounded-xl py-2.5 px-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Links
            </label>
            <div className="flex gap-2">
              <input
                id="link-input"
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                placeholder="https://..."
                className="flex-1 bg-bg-primary border border-border rounded-xl py-2 px-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                type="button"
                onClick={addLink}
                className="px-3 rounded-xl bg-bg-primary border border-border text-text-secondary hover:text-primary hover:border-primary/50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {links.map((link) => (
                  <span key={link} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs">
                    <Link2 className="w-3 h-3" />
                    <span className="max-w-32 truncate">{link}</span>
                    <button
                      type="button"
                      onClick={() => removeLink(link)}
                      className="hover:text-warning transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-hover transition-all text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="create-session-submit"
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-medium transition-all text-sm disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
