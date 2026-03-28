import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { Footer } from '@/components/ui/footer-section'

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
    <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-x-hidden overflow-y-auto">
      <div className="ambient-bg" />

      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex-1 flex items-center justify-center p-4">
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
                    // minLength={6} // Removed for dev speed, restore later
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

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#050505] px-4 text-text-muted font-medium tracking-widest">or</span>
                </div>
              </div>

              {/* Google Sign-in */}
              <button
                onClick={() => useAuthStore.getState().signInWithGoogle()}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 backdrop-blur-md cursor-pointer group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="mt-8 text-center">
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

      <div className="w-full shrink-0">
        <Footer />
      </div>
    </div>
  )
}
