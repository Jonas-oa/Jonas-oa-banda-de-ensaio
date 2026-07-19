import type { SongProject, StemTrack } from '../types'

const DB_NAME = 'banda-de-ensaio'
const DB_VERSION = 1
const PROJECT_STORE = 'projects'
const AUDIO_STORE = 'audio'

interface StoredProject extends Omit<SongProject, 'tracks'> {
  tracks: Array<Omit<StemTrack, 'blob' | 'url'>>
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECT_STORE)) db.createObjectStore(PROJECT_STORE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE)
    }
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveProject(project: SongProject): Promise<void> {
  const db = await openDb()
  const transaction = db.transaction([PROJECT_STORE, AUDIO_STORE], 'readwrite')
  const projects = transaction.objectStore(PROJECT_STORE)
  const audio = transaction.objectStore(AUDIO_STORE)
  const stored: StoredProject = {
    ...project,
    tracks: project.tracks.map(({ blob: _blob, url: _url, ...track }) => track),
  }
  projects.put(stored)
  for (const track of project.tracks) audio.put(track.blob, `${project.id}:${track.id}`)
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
}

export async function loadProjects(): Promise<SongProject[]> {
  const db = await openDb()
  const storedProjects = await requestToPromise<StoredProject[]>(
    db.transaction(PROJECT_STORE, 'readonly').objectStore(PROJECT_STORE).getAll(),
  )
  const projects: SongProject[] = []
  for (const stored of storedProjects) {
    const tracks: StemTrack[] = []
    for (const track of stored.tracks) {
      const blob = await requestToPromise<Blob>(
        db.transaction(AUDIO_STORE, 'readonly').objectStore(AUDIO_STORE).get(`${stored.id}:${track.id}`),
      )
      if (blob) tracks.push({ ...track, blob, url: URL.createObjectURL(blob) })
    }
    projects.push({ ...stored, tracks })
  }
  db.close()
  return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteProject(project: SongProject): Promise<void> {
  const db = await openDb()
  const transaction = db.transaction([PROJECT_STORE, AUDIO_STORE], 'readwrite')
  transaction.objectStore(PROJECT_STORE).delete(project.id)
  for (const track of project.tracks) transaction.objectStore(AUDIO_STORE).delete(`${project.id}:${track.id}`)
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
  project.tracks.forEach((track) => URL.revokeObjectURL(track.url))
}
