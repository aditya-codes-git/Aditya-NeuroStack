import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/stores/sessionStore'
import { useAuthStore } from '@/stores/authStore'
import { IconNavigation, DetailSidebar } from '@/components/ui/sidebar-component'
import LeftPanel from '@/components/LeftPanel'
import CenterPanel from '@/components/CenterPanel'
import RightPanel from '@/components/RightPanel'
import InsightsPage from '@/pages/InsightsPage'

export default function Dashboard() {
  const { fetchSessions, setupRealtime } = useSessionStore()
  const { signOut } = useAuthStore()
  const [activeSection, setActiveSection] = useState('dashboard')

  useEffect(() => {
    fetchSessions()
    const cleanup = setupRealtime()
    return cleanup
  }, [fetchSessions, setupRealtime])

  return (
    <div className="min-h-screen bg-bg-primary flex flex-row text-text-primary overflow-hidden">
      <div className="ambient-bg" />

      {/* Global Icon Navigation */}
      <div className="relative z-20">
        <IconNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onSettingsClick={() => setActiveSection('settings')}
          onAccountClick={() => setActiveSection('account')}
          onLogoutClick={signOut}
        />
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeSection === 'insights' ? (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 relative z-10 w-full overflow-hidden"
          >
            <InsightsPage onBack={() => setActiveSection('dashboard')} />
          </motion.div>
        ) : activeSection === 'settings' || activeSection === 'account' ? (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex items-center justify-center relative z-10"
          >
            <div className="bg-white/5 backdrop-blur-3xl p-12 rounded-3xl border border-white/10 text-center max-w-lg mx-auto shadow-2xl">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 capitalize">{activeSection}</h2>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                We're currently refining the <span className="text-primary font-medium">{activeSection}</span> module to ensure it meets our premium performance standards. 
              </p>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 font-medium"
              >
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex overflow-hidden relative z-10"
          >
            {/* Left Panel — Wrapped in DetailSidebar aesthetic */}
            <LeftPanel />

            {/* Center Panel — Active Session + Timer */}
            <section className="flex-1 flex flex-col overflow-hidden">
              <CenterPanel />
            </section>

            {/* Right Panel — Resume Packet */}
            <RightPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

