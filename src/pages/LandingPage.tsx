import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Clock, Focus, Play, FileText, CheckCircle2, Bookmark, Pause, PlayCircle } from 'lucide-react';
import { HalideLandingHero } from '@/components/ui/halide-topo-hero';
import { Footer } from '@/components/ui/footer-section';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">
      {/* 1. Hero Section */}
      <HalideLandingHero />

      {/* 2. Problem Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-warning/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-warning uppercase mb-3">The Problem</h2>
            <h3 className="text-3xl md:text-5xl font-bold">Context switching is killing your momentum.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-2xl border-warning/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-warning/50 transition-all group-hover:w-full group-hover:opacity-10" />
              <Focus className="w-10 h-10 text-warning mb-5 relative z-10" />
              <h4 className="text-xl font-semibold mb-3 relative z-10">Breaks Focus</h4>
              <p className="text-text-secondary relative z-10">Every interruption costs you 23 minutes to recover your original deep work state.</p>
            </div>
            
            <div className="glass p-8 rounded-2xl border-warning/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber/50 transition-all group-hover:w-full group-hover:opacity-10" />
              <Brain className="w-10 h-10 text-amber mb-5 relative z-10" />
              <h4 className="text-xl font-semibold mb-3 relative z-10">Loses State</h4>
              <p className="text-text-secondary relative z-10">You constantly forget where you left off, what tab you were reading, and what the next step was.</p>
            </div>

            <div className="glass p-8 rounded-2xl border-warning/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-warning/50 transition-all group-hover:w-full group-hover:opacity-10" />
              <Clock className="w-10 h-10 text-warning mb-5 relative z-10" />
              <h4 className="text-xl font-semibold mb-3 relative z-10">Wastes Time</h4>
              <p className="text-text-secondary relative z-10">Rebuilding context from scratch every time you sit down drains cognitive energy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Solution Section */}
      <section className="py-24 px-6 bg-bg-surface relative border-y border-border">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
        
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">The Solution</h2>
            <h3 className="text-3xl md:text-5xl font-bold">A state machine for your brain.</h3>
            <p className="text-text-secondary mt-4 max-w-2xl mx-auto text-lg">
              ContextSwitch is built on three core pillars to ensure you never lose a train of thought again.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-bg-elevated p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Bookmark className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-2xl font-bold mb-4">1. Capture</h4>
              <p className="text-text-secondary mb-6">Instantly log your exact mental state.</p>
              <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Markdown Notes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Pending Tasks</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Reference Links</li>
              </ul>
            </div>

            <div className="bg-bg-elevated p-8 rounded-2xl border border-border shadow-[0_0_40px_rgba(108,99,255,0.1)] transform md:-translate-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/20">
                <Pause className="w-6 h-6 text-accent" />
              </div>
              <h4 className="text-2xl font-bold mb-4">2. Preserve</h4>
              <p className="text-text-secondary mb-6">Hit pause and walk away with confidence.</p>
               <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Zero state loss</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Timers auto-pause</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Safe cloud sync</li>
              </ul>
            </div>

            <div className="bg-bg-elevated p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <PlayCircle className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-2xl font-bold mb-4">3. Resume</h4>
              <p className="text-text-secondary mb-6">Jump back in precisely where you left off.</p>
               <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> AI Context Briefs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Instant setup</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 1-click timer start</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Highlight (Resume Packet) */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-sm font-bold tracking-widest text-accent uppercase">The Resume Packet</h2>
            <h3 className="text-4xl lg:text-5xl font-bold leading-tight">
              AI-generated context <br/> <span className="text-text-secondary">before you start.</span>
            </h3>
            <p className="text-lg text-text-secondary leading-relaxed">
              When you resume a session, ContextSwitch generates an instant "Resume Packet" using Groq AI. It scans your paused notes and tasks to build a personalized briefing.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0 mt-1">
                  <span className="text-accent font-mono text-sm">01</span>
                </div>
                <div>
                  <h5 className="font-semibold text-text-primary text-lg">What you were doing</h5>
                  <p className="text-text-muted text-sm">A quick recap of the overall goal and last thoughts.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0 mt-1">
                  <span className="text-accent font-mono text-sm">02</span>
                </div>
                <div>
                  <h5 className="font-semibold text-text-primary text-lg">Where you stopped</h5>
                  <p className="text-text-muted text-sm">The exact block or feature you were working on.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0 mt-1">
                  <span className="text-accent font-mono text-sm">03</span>
                </div>
                <div>
                  <h5 className="font-semibold text-text-primary text-lg">What to do next</h5>
                  <p className="text-text-muted text-sm">AI-suggested next steps to eliminate friction.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg relative perspective-1000">
             <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
             <div className="glass-elevated border border-border/50 rounded-2xl p-6 shadow-2xl transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform hover:rotate-0 duration-500">
               <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
                 <Brain className="w-5 h-5 text-accent" />
                 <span className="font-semibold">AI Briefing Generated</span>
               </div>
               <div className="space-y-4">
                 <div className="h-6 w-3/4 bg-bg-hover rounded animate-pulse" />
                 <div className="space-y-2">
                   <div className="h-2 bg-text-muted/20 rounded w-full" />
                   <div className="h-2 bg-text-muted/20 rounded w-full" />
                   <div className="h-2 bg-text-muted/20 rounded w-5/6" />
                 </div>
                 <div className="mt-6 pt-4 border-t border-border/50">
                    <span className="text-xs text-text-muted mb-2 block">RECOMMENDED NEXT EVENT</span>
                    <div className="bg-bg-primary p-3 rounded-lg border border-border/50 flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-accent" />
                      <span className="text-sm">Implement Auth Flow</span>
                    </div>
                 </div>
               </div>
               <button className="w-full mt-6 py-3 bg-accent hover:bg-accent/80 text-bg-primary font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                 <Play className="w-4 h-4" /> Start Timer
               </button>
             </div>
          </div>
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-t from-primary/10 to-bg-primary text-center relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="max-w-3xl mx-auto space-y-8 animate-slide-up relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold">Ready to master your focus?</h2>
          <p className="text-xl text-text-secondary">Start your first session in seconds. No credit card required.</p>
          <div className="pt-4 flex items-center justify-center gap-4">
             <button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(108,99,255,0.3)] hover:shadow-[0_0_50px_rgba(108,99,255,0.5)] transition-all flex items-center gap-2 hover:-translate-y-1">
               Get Started Free <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
