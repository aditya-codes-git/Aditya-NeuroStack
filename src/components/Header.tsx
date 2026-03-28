import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useThemeStore } from '@/stores/themeStore'
import { useRealtimeTimer, formatDuration } from '@/hooks/useRealtimeTimer'
import { Zap, Timer, LogOut, User, BarChart3, Sun, Moon } from 'lucide-react'

interface Props {
  onInsightsClick?: () => void
  showingInsights?: boolean
}

export default function Header({ onInsightsClick, showingInsights }: Props) {
  const { user, signOut } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { activeSession } = useSessionStore()
  const elapsed = useRealtimeTimer(activeSession)

  return (
    <header className="h-16 border-b border-white/5 bg-bg-primary/40 backdrop-blur-2xl shadow-sm shadow-black/10 flex items-center justify-between px-6 relative z-50 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-lg font-bold text-text-primary tracking-tight">
          Context<span className="text-primary">Switch</span>
        </h1>
      </div>

      {/* Active Timer Badge */}
      {activeSession && (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <Timer className="w-4 h-4 text-accent" />
          <span className="font-mono text-sm font-semibold text-accent tracking-wider">
            {formatDuration(elapsed)}
          </span>
          <span className="text-text-secondary text-xs hidden sm:inline">
            {activeSession.title}
          </span>
        </div>
      )}

      {/* Nav + User Menu */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all cursor-pointer group"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          ) : (
            <Sun className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          )}
        </button>

        {/* Insights Button */}
        <button
          onClick={onInsightsClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            showingInsights
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-bg-elevated border border-border text-text-secondary hover:text-primary hover:border-primary/30'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Insights
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border">
          <User className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-xs text-text-secondary max-w-32 truncate">
            {user?.email}
          </span>
        </div>
        <button
          id="sign-out-btn"
          onClick={signOut}
          className="p-2 rounded-lg text-text-secondary hover:text-warning hover:bg-warning/10 transition-all cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
