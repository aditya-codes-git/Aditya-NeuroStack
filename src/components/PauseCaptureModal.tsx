import { useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import type { Session, ResumeContext } from '@/types/database'
import { MapPin, X, Video, FileIcon, PenLine, Pause } from 'lucide-react'

interface Props {
  session: Session
  onDismiss: () => void
}

export default function PauseCaptureModal({ session, onDismiss }: Props) {
  const { pauseSession, updateResumeContext } = useSessionStore()
  
  const [rcType, setRcType] = useState<ResumeContext['type']>('manual')
  const [rcLink, setRcLink] = useState('')
  const [rcPosition, setRcPosition] = useState('')
  const [saving, setSaving] = useState(false)

  const handlePause = async (withContext: boolean) => {
    setSaving(true)
    try {
      if (withContext && rcPosition.trim()) {
        const ctx: ResumeContext = {
          type: rcType,
          position: rcPosition.trim(),
          ...(rcLink.trim() ? { link: rcLink.trim() } : {}),
        }
        await updateResumeContext(session.id, ctx)
      }
      
      await pauseSession(session.id)
      onDismiss()
    } catch (e) {
      console.error('Failed to pause:', e)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-xl animate-fade-in"
        onClick={onDismiss}
      />
      
      <div className="relative w-full max-w-md glass rounded-3xl border border-border shadow-2xl animate-scale-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-bg-elevated/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Pause Session</h2>
              <p className="text-xs text-text-secondary">Where are you stopping?</p>
            </div>
          </div>
          <button 
            onClick={onDismiss}
            className="p-2 rounded-xl hover:bg-bg-hover text-text-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 bg-bg-primary/50">
          
          {/* Type Selector */}
          <div className="flex rounded-xl bg-bg-elevated p-1 border border-border">
            {(['video', 'document', 'manual'] as const).map(type => (
              <button
                key={type}
                onClick={() => setRcType(type)}
                className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all cursor-pointer capitalize flex items-center justify-center gap-2 ${
                  rcType === type 
                    ? 'bg-amber text-bg-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
                }`}
              >
                {type === 'video' ? <Video className="w-3.5 h-3.5" /> : 
                 type === 'document' ? <FileIcon className="w-3.5 h-3.5" /> : 
                 <PenLine className="w-3.5 h-3.5" />}
                {type}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            {rcType !== 'manual' && (
              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
                  {rcType === 'video' ? 'Video Link' : 'Document Link'}
                </label>
                <input
                  type="url"
                  value={rcLink}
                  onChange={(e) => setRcLink(e.target.value)}
                  placeholder={rcType === 'video' ? 'https://youtube.com/...' : 'https://docs.google.com/...'}
                  className="w-full bg-bg-elevated border border-border rounded-xl py-2.5 px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-all"
                />
              </div>
            )}
            
            <div>
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
                {rcType === 'video' ? 'Timestamp' : rcType === 'document' ? 'Page Number' : 'Stopping Point'}
              </label>
              <input
                type="text"
                value={rcPosition}
                onChange={(e) => setRcPosition(e.target.value)}
                placeholder={
                  rcType === 'video' ? 'e.g. 12:34' :
                  rcType === 'document' ? 'e.g. Page 18' :
                  'e.g. Fixing the login bug'
                }
                autoFocus
                className="w-full bg-bg-elevated border border-border rounded-xl py-2.5 px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber/50 focus:ring-1 focus:ring-amber/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-bg-elevated/50 flex gap-3">
          <button
            onClick={() => handlePause(false)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all text-sm font-medium cursor-pointer disabled:opacity-50"
          >
            Just Pause
          </button>
          
          <button
            onClick={() => handlePause(true)}
            disabled={!rcPosition.trim() || saving}
            className="flex-[2] py-3 rounded-xl bg-amber hover:bg-amber/90 text-[var(--color-bg-primary)] shadow-lg shadow-amber/20 transition-all text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Pause className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & Pause'}
          </button>
        </div>
      </div>
    </div>
  )
}
