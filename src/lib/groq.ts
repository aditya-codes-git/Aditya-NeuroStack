const apiKey = import.meta.env.VITE_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

async function callGroq(messages: { role: string; content: string }[], options: { model?: string; temperature?: number } = {}) {
  if (!apiKey) {
    throw new Error('⚠️ Groq API key not configured. Add your Groq API key to .env')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      model: options.model || DEFAULT_MODEL,
      temperature: options.temperature ?? 0.7,
      max_tokens: 1024,
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error?.message || 'Error calling Groq API')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// Retry with exponential backoff for rate limiting
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('rate limit')
      
      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000
        console.warn(`[Groq] Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export async function generateSummary(notes: string, title: string): Promise<string> {
  if (!notes.trim()) return '⚠️ No notes to summarize.'

  return withRetry(async () => {
    return await callGroq([
      { role: 'system', content: 'You are a productivity assistant. Summarize the provided work session notes concisely in 2-3 bullet points. Focus on key progress and decisions made.' },
      { role: 'user', content: `Session: "${title}"\nNotes:\n${notes}` }
    ])
  })
}

export async function generateTaskSuggestions(title: string, notes: string, existingTasks: string[]): Promise<string[]> {
  return withRetry(async () => {
    const content = await callGroq([
      { role: 'system', content: 'You are a productivity assistant. Based on the session context, suggest 3-5 actionable next tasks. Return ONLY a JSON array of strings, no markdown or extra text.' },
      { role: 'user', content: `Session: "${title}"\nNotes: ${notes || 'None'}\nExisting tasks: ${existingTasks.join(', ') || 'None'}` }
    ])

    try {
      const text = content.replace(/```json\n?|\n?```/g, '').trim()
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
  const completedTasks = session.checklist.filter(t => t.completed).map(t => t.text)
  const pendingTasks = session.checklist.filter(t => !t.completed).map(t => t.text)

  return withRetry(async () => {
    return await callGroq([
      { role: 'system', content: 'You are a productivity assistant. Write a brief "where you left off" summary (2-3 sentences) to help the user resume this work session quickly.' },
      { role: 'user', content: `Session: "${session.title}"\nTime spent: ${Math.round(session.total_duration / 60)} minutes\nNotes: ${session.notes || 'None'}\nCompleted: ${completedTasks.join(', ') || 'None'}\nPending: ${pendingTasks.join(', ') || 'None'}` }
    ])
  })
}

export async function generateSessionReview(session: {
  title: string
  notes: string | null
  total_duration: number
  checklist: { text: string; completed: boolean }[]
}): Promise<string> {
  const completed = session.checklist.filter(t => t.completed).length
  const total = session.checklist.length

  return withRetry(async () => {
    return await callGroq([
      { role: 'system', content: 'You are a productivity coach. Give a brief end-of-session review with insights and tips. Be encouraging but honest. Keep it to 3-4 sentences.' },
      { role: 'user', content: `Session: "${session.title}"\nDuration: ${Math.round(session.total_duration / 60)} minutes\nTasks completed: ${completed}/${total}\nNotes: ${session.notes || 'None'}` }
    ])
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
  const pendingTasks = session.checklist.filter(t => !t.completed).map(t => t.text)
  const completedTasks = session.checklist.filter(t => t.completed).map(t => t.text)
  const rc = session.resumeContext

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
    return await callGroq([
      { role: 'system', content: 'You are a productivity assistant helping a user resume their work session. Generate a concise "Resume Brief" — a quick-read summary that helps them pick up exactly where they left off in under 5 seconds.' },
      { role: 'user', content: `Format your response like this:
📋 **Quick Recap:** (1-2 sentences on what was being done)
${rc?.type === 'video' ? '🎬 **Video Summary:** (summary of video content up to the timestamp)\n' : ''}📌 **Where You Stopped:** (specific point of interruption)
⚡ **Next Action:** (the single most important thing to do now)

Session: "${session.title}"
Time spent: ${Math.round(session.total_duration / 60)} minutes
Notes: ${session.notes || 'None'}
Completed tasks: ${completedTasks.join(', ') || 'None'}
Pending tasks: ${pendingTasks.join(', ') || 'None'}${resumePositionPrompt}` }
    ])
  })
}

export async function generateVideoSummary(videoUrl: string): Promise<string> {
  return withRetry(async () => {
    return await callGroq([
      { role: 'system', content: 'Summarize this YouTube video in 5-6 concise bullet points focusing on key ideas and takeaways. Be specific and actionable.' },
      { role: 'user', content: `Video URL: ${videoUrl}` }
    ])
  })
}
