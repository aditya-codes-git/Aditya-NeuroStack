import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import Header from '@/components/Header'
import LeftPanel from '@/components/LeftPanel'
import CenterPanel from '@/components/CenterPanel'
import RightPanel from '@/components/RightPanel'
import InsightsPage from '@/pages/InsightsPage'

export default function Dashboard() {
  const { fetchSessions, setupRealtime } = useSessionStore()
  const [showInsights, setShowInsights] = useState(false)

  useEffect(() => {
    fetchSessions()
    const cleanup = setupRealtime()
    return cleanup
  }, [fetchSessions, setupRealtime])

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="ambient-bg" />
      <Header
        onInsightsClick={() => setShowInsights(!showInsights)}
        showingInsights={showInsights}
      />

      {showInsights ? (
        <InsightsPage onBack={() => setShowInsights(false)} />
      ) : (
        <main className="flex-1 flex relative z-10 overflow-hidden">
          {/* Left Panel — Sessions List */}
          <aside className="w-80 min-w-80 border-r border-border flex flex-col bg-bg-surface/50 overflow-hidden">
            <LeftPanel />
          </aside>

          {/* Center Panel — Active Session + Timer */}
          <section className="flex-1 flex flex-col overflow-hidden">
            <CenterPanel />
          </section>

          {/* Right Panel — Resume Packet */}
          <aside className="w-96 min-w-96 border-l border-border flex flex-col bg-bg-surface/50 overflow-hidden">
            <RightPanel />
          </aside>
        </main>
      )}
    </div>
  )
}
