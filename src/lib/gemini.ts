import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

let genAI: GoogleGenerativeAI | null = null

function getGenAI() {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

// Retry with exponential backoff for rate limiting
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const status = error?.status || error?.response?.status
      const isRateLimit = status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests')
      
      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000
        console.warn(`[Gemini] Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      if (isRateLimit) {
        throw new Error('API rate limit reached. Please wait a minute and try again.')
      }
      
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export async function generateSummary(notes: string, title: string): Promise<string> {
  const ai = getGenAI()
  if (!ai) return '⚠️ AI not configured. Add your Gemini API key to .env'
  if (!notes.trim()) return '⚠️ No notes to summarize.'

  return withRetry(async () => {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `You are a productivity assistant. Summarize these work session notes concisely in 2-3 bullet points. Focus on key progress and decisions made.\n\nSession: "${title}"\nNotes:\n${notes}`
    )
    return result.response.text()
  })
}

export async function generateTaskSuggestions(title: string, notes: string, existingTasks: string[]): Promise<string[]> {
  const ai = getGenAI()
  if (!ai) return ['⚠️ AI not configured']

  return withRetry(async () => {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `You are a productivity assistant. Based on the session context, suggest 3-5 actionable next tasks. Return ONLY a JSON array of strings, no markdown.\n\nSession: "${title}"\nNotes: ${notes || 'None'}\nExisting tasks: ${existingTasks.join(', ') || 'None'}`
    )

    try {
      const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(text)
    } catch {
      return ['Could not parse AI suggestions']
    }
  })
}

export async function generateResumeContext(session: {
  title: string
  notes: string | null
  total_duration: number
  checklist: { text: string; completed: boolean }[]
}): Promise<string> {
  const ai = getGenAI()
  if (!ai) return '⚠️ AI not configured. Add your Gemini API key to .env'

  const completedTasks = session.checklist.filter(t => t.completed).map(t => t.text)
  const pendingTasks = session.checklist.filter(t => !t.completed).map(t => t.text)

  return withRetry(async () => {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `You are a productivity assistant. Write a brief "where you left off" summary (2-3 sentences) to help the user resume this work session quickly.\n\nSession: "${session.title}"\nTime spent: ${Math.round(session.total_duration / 60)} minutes\nNotes: ${session.notes || 'None'}\nCompleted: ${completedTasks.join(', ') || 'None'}\nPending: ${pendingTasks.join(', ') || 'None'}`
    )
    return result.response.text()
  })
}

export async function generateSessionReview(session: {
  title: string
  notes: string | null
  total_duration: number
  checklist: { text: string; completed: boolean }[]
}): Promise<string> {
  const ai = getGenAI()
  if (!ai) return '⚠️ AI not configured. Add your Gemini API key to .env'

  const completed = session.checklist.filter(t => t.completed).length
  const total = session.checklist.length

  return withRetry(async () => {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `You are a productivity coach. Give a brief end-of-session review with insights and tips. Be encouraging but honest. Keep it to 3-4 sentences.\n\nSession: "${session.title}"\nDuration: ${Math.round(session.total_duration / 60)} minutes\nTasks completed: ${completed}/${total}\nNotes: ${session.notes || 'None'}`
    )
    return result.response.text()
  })
}

export async function generateResumePacketBrief(session: {
  title: string
  notes: string | null
  total_duration: number
  checklist: { text: string; completed: boolean }[]
  resumeContext?: {
    type: 'video' | 'document' | 'manual'
    link?: string
    position: string
  }
}): Promise<string> {
  const ai = getGenAI()
  if (!ai) return '⚠️ AI not configured. Add your Gemini API key to .env'

  const pendingTasks = session.checklist.filter(t => !t.completed).map(t => t.text)
  const completedTasks = session.checklist.filter(t => t.completed).map(t => t.text)
  const rc = session.resumeContext

  // Build resume context section for the prompt
  let resumePositionPrompt = ''
  if (rc) {
    if (rc.type === 'video' && rc.link) {
      resumePositionPrompt = `\n\nIMPORTANT — The user was watching a YouTube video: ${rc.link}
They paused at timestamp: ${rc.position}
Please provide:
1. A brief summary of what the video likely covers up to the ${rc.position} mark (based on the video URL, title, and session context)
2. What they should pay attention to when they resume watching from ${rc.position}`
    } else if (rc.type === 'document' && rc.link) {
      resumePositionPrompt = `\n\nThe user was reading a document at: ${rc.link}
They stopped at: Page ${rc.position}
Mention where they left off and suggest what to look for next.`
    } else if (rc.type === 'manual') {
      resumePositionPrompt = `\n\nThe user left off at: "${rc.position}"
Incorporate this into the resume brief.`
    }
  }

  return withRetry(async () => {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `You are a productivity assistant helping a user resume their work session. Generate a concise "Resume Brief" — a quick-read summary that helps them pick up exactly where they left off in under 5 seconds.

Format your response like this:
📋 **Quick Recap:** (1-2 sentences on what was being done)
${rc?.type === 'video' ? '🎬 **Video Summary:** (summary of video content up to the timestamp)\n' : ''}📌 **Where You Stopped:** (specific point of interruption)
⚡ **Next Action:** (the single most important thing to do now)

Session: "${session.title}"
Time spent: ${Math.round(session.total_duration / 60)} minutes
Notes: ${session.notes || 'None'}
Completed tasks: ${completedTasks.join(', ') || 'None'}
Pending tasks: ${pendingTasks.join(', ') || 'None'}${resumePositionPrompt}`
    )
    return result.response.text()
  })
}

export async function generateVideoSummary(videoUrl: string): Promise<string> {
  const ai = getGenAI()
  if (!ai) return '⚠️ AI not configured. Add your Gemini API key to .env'

  return withRetry(async () => {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(
      `Summarize this YouTube video in 5-6 concise bullet points focusing on key ideas and takeaways. Be specific and actionable.\n\nVideo URL: ${videoUrl}`
    )
    return result.response.text()
  })
}
