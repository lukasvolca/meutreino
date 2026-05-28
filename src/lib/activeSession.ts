export interface ActiveSession {
  fichaId: string
  fichaLetra: string
  cor: string
  startTime: number // Date.now()
}

const KEY = 'meutreino_active_session'

export function getActiveSession(): ActiveSession | null {
  if (typeof window === 'undefined') return null
  try {
    const s = localStorage.getItem(KEY)
    return s ? (JSON.parse(s) as ActiveSession) : null
  } catch { return null }
}

export function setActiveSession(s: ActiveSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function clearActiveSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
