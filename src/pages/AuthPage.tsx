import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp, loading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) {
      await signUp(email, password)
    } else {
      await signIn(email, password)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ambient-bg" />

      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Context<span className="text-primary">Switch</span>
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Manage your work sessions with precision
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-1">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            {isSignUp ? 'Start tracking your sessions' : 'Resume where you left off'}
          </p>

          {error && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 mb-4 text-warning text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
              <input
                id="auth-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError() }}
                required
                className="w-full bg-bg-elevated border border-border rounded-xl py-3 pl-11 pr-4 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
              <input
                id="auth-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError() }}
                required
                minLength={6}
                className="w-full bg-bg-elevated border border-border rounded-xl py-3 pl-11 pr-4 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              id="auth-toggle"
              onClick={() => { setIsSignUp(!isSignUp); clearError() }}
              className="text-text-secondary text-sm hover:text-primary transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span className="text-primary font-medium">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
