import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session } from '@/types/database'

export function useRealtimeTimer(activeSession: Session | null) {
  const [elapsed, setElapsed] = useState(0)
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef<number>(Date.now())

  const computeElapsed = useCallback(() => {
    if (!activeSession) return 0
    if (activeSession.status !== 'active') return activeSession.total_duration

    const lastResume = activeSession.last_resume_time
      ? new Date(activeSession.last_resume_time).getTime()
      : new Date(activeSession.start_time).getTime()

    const now = Date.now()
    const currentSegment = Math.floor((now - lastResume) / 1000)
    return activeSession.total_duration + currentSegment
  }, [activeSession])

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setElapsed(activeSession?.total_duration ?? 0)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = () => {
      const now = Date.now()
      if (now - lastTickRef.current >= 1000) {
        lastTickRef.current = now
        setElapsed(computeElapsed())
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    setElapsed(computeElapsed())
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activeSession, computeElapsed])

  // Re-sync on visibility change (tab focus)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setElapsed(computeElapsed())
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [computeElapsed])

  return elapsed
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

export function formatDurationShort(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}
