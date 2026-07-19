import { useEffect, useRef, useState } from 'react'
import { Library } from './components/Library'
import { Studio } from './components/Studio'
import { decodeAudioBlob } from './lib/audioAnalysis'
import { createDemoStems } from './lib/demoAudio'
import { deleteProject, loadProjects, saveProject } from './lib/projectStore'
import { classifyStem, ROLE_LABELS } from './lib/stemClassifier'
import type { SongProject, StemTrack } from './types'

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function titleFromFile(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Nova música'
}

function defaultSections(duration: number) {
  const labels = ['Introdução', 'Verso', 'Refrão', 'Ponte', 'Final']
  return labels.map((name, index) => ({ id: makeId('section'), name, time: duration * (index / labels.length) }))
}

export default function App() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [projects, setProjects] = useState<SongProject[]>([])
  const [activeProject, setActiveProject] = useState<SongProject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects().then(setProjects).finally(() => setLoading(false))
  }, [])

  async function importFiles(files: FileList) {
    const selected = Array.from(files)
    if (!selected.length) return
    setLoading(true)
    try {
      const decoded = await decodeAudioBlob(selected[0])
      const duration = decoded.duration
      const tracks: StemTrack[] = selected.map((file, index) => {
        const role = classifyStem(file.name, index)
        return {
          id: makeId('track'),
          name: role === 'other' ? titleFromFile(file.name) : ROLE_LABELS[role],
          role,
          fileName: file.name,
          mimeType: file.type || 'audio/mpeg',
          blob: file,
          url: URL.createObjectURL(file),
          volume: 0.85,
          muted: false,
          solo: false,
        }
      })
      const now = Date.now()
      const project: SongProject = {
        id: makeId('song'),
        title: titleFromFile(selected[0].name),
        artist: '',
        bpm: null,
        key: null,
        duration,
        createdAt: now,
        updatedAt: now,
        studyTrackId: tracks.find((track) => track.role === 'keys' || track.role === 'guitar')?.id ?? tracks[0].id,
        tracks,
        sections: defaultSections(duration),
        loop: { enabled: false, start: 0, end: Math.min(duration, 12) },
      }
      await saveProject(project)
      setProjects((current) => [project, ...current])
      setActiveProject(project)
    } finally {
      setLoading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function createDemo() {
    setLoading(true)
    try {
      const stems = createDemoStems()
      const duration = 28
      const tracks: StemTrack[] = stems.map(({ role, name, blob }) => ({
        id: makeId('track'), name, role, fileName: `${role}.wav`, mimeType: blob.type, blob, url: URL.createObjectURL(blob), volume: 0.82, muted: false, solo: false,
      }))
      const now = Date.now()
      const project: SongProject = {
        id: makeId('demo'), title: 'Ensaio de demonstração', artist: 'Banda de Ensaio', bpm: 76, key: 'G', duration, createdAt: now, updatedAt: now,
        studyTrackId: tracks.find((track) => track.role === 'keys')?.id ?? null,
        tracks,
        sections: [
          { id: makeId('section'), name: 'Introdução', time: 0 },
          { id: makeId('section'), name: 'Verso', time: 7 },
          { id: makeId('section'), name: 'Refrão', time: 14 },
          { id: makeId('section'), name: 'Ponte', time: 21 },
        ],
        loop: { enabled: true, start: 7, end: 14 },
      }
      await saveProject(project)
      setProjects((current) => [project, ...current])
      setActiveProject(project)
    } finally { setLoading(false) }
  }

  async function persist(project: SongProject) {
    await saveProject(project)
    setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)])
  }

  async function remove(project: SongProject) {
    if (!window.confirm(`Excluir “${project.title}” deste aparelho?`)) return
    await deleteProject(project)
    setProjects((current) => current.filter((item) => item.id !== project.id))
  }

  return (
    <>
      <input ref={fileInput} type="file" accept="audio/*" multiple hidden onChange={(event) => event.target.files && importFiles(event.target.files)} />
      {activeProject ? (
        <Studio project={activeProject} onBack={() => setActiveProject(null)} onChange={setActiveProject} onSave={persist} />
      ) : (
        <Library projects={projects} loading={loading} onOpen={setActiveProject} onImport={() => fileInput.current?.click()} onDemo={createDemo} onDelete={remove} />
      )}
    </>
  )
}
