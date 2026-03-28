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

export async function generateSummary(notes: string, title: string): Promise<string> {
  const ai = getGenAI()
  if (!ai) return 'AI not configured. Add your Gemini API key to .env'
  
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(
    `You are a productivity assistant. Summarize these work session notes concisely in 2-3 bullet points. Focus on key progress and decisions made.\n\nSession: "${title}"\nNotes:\n${notes}`
  )
  return result.response.text()
}

export async function generateTaskSuggestions(title: string, notes: string, existingTasks: string[]): Promise<string[]> {
  const ai = getGenAI()
  if (!ai) return ['AI not configured']
  
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(
    `You are a productivity assistant. Based on the session context, suggest 3-5 actionable next tasks. Return ONLY a JSON array of strings, no markdown.\n\nSession: "${title}"\nNotes: ${notes}\nExisting tasks: ${existingTasks.join(', ')}`
  )
  
  try {
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(text)
  } catch {
    return ['Could not parse AI suggestions']
  }
}

export async function generateResumeContext(session: {
  title: string
  notes: string | null
  total_duration: number
  checklist: { text: string; completed: boolean }[]
}): Promise<string> {
  const ai = getGenAI()
  if (!ai) return 'AI not configured. Add your Gemini API key to .env'
  
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const completedTasks = session.checklist.filter(t => t.completed).map(t => t.text)
  const pendingTasks = session.checklist.filter(t => !t.completed).map(t => t.text)
  
  const result = await model.generateContent(
    `You are a productivity assistant. Write a brief "where you left off" summary (2-3 sentences) to help the user resume this work session quickly.\n\nSession: "${session.title}"\nTime spent: ${Math.round(session.total_duration / 60)} minutes\nNotes: ${session.notes || 'None'}\nCompleted: ${completedTasks.join(', ') || 'None'}\nPending: ${pendingTasks.join(', ') || 'None'}`
  )
  return result.response.text()
}

export async function generateSessionReview(session: {
  title: string
  notes: string | null
  total_duration: number
  checklist: { text: string; completed: boolean }[]
}): Promise<string> {
  const ai = getGenAI()
  if (!ai) return 'AI not configured. Add your Gemini API key to .env'
  
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const completed = session.checklist.filter(t => t.completed).length
  const total = session.checklist.length
  
  const result = await model.generateContent(
    `You are a productivity coach. Give a brief end-of-session review with insights and tips. Be encouraging but honest. Keep it to 3-4 sentences.\n\nSession: "${session.title}"\nDuration: ${Math.round(session.total_duration / 60)} minutes\nTasks completed: ${completed}/${total}\nNotes: ${session.notes || 'None'}`
  )
  return result.response.text()
}
