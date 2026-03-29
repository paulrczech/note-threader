import type { Cluster } from './noteUtils'

export interface SavedSession {
  id: string
  name: string
  savedAt: number       // Unix ms timestamp
  sequence: Cluster[]
  voiceCount: number
}

const STORAGE_KEY = 'note-threader-sessions'

function loadAll(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(sessions: SavedSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function listSessions(): SavedSession[] {
  return loadAll().sort((a, b) => b.savedAt - a.savedAt)
}

export function saveSession(sequence: Cluster[], voiceCount: number, name?: string): SavedSession {
  const sessions = loadAll()
  const session: SavedSession = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name ?? `session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    savedAt: Date.now(),
    sequence,
    voiceCount,
  }
  sessions.push(session)
  saveAll(sessions)
  return session
}

export function deleteSession(id: string): void {
  const sessions = loadAll().filter(s => s.id !== id)
  saveAll(sessions)
}

export function renameSession(id: string, name: string): void {
  const sessions = loadAll()
  const target = sessions.find(s => s.id === id)
  if (target) {
    target.name = name
    saveAll(sessions)
  }
}
