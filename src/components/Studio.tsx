import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Gauge, ListMusic, Pause, Play, Repeat2, Save, SkipBack, SkipForward, SlidersHorizontal, Users } from 'lucide-react'
import type { LoopRegion, SongProject, StemTrack } from '../types'
import { buildPeaks, decodeAudioBlob } from '../lib/audioAnalysis'
import { clamp, formatTime } from '../lib/format'
import { MixerTrack } from './MixerTrack'
import { Waveform } from './Waveform'

interface StudioProps {
  project: SongProject
  onBack: () => void
  onChange: (project: SongProject) => void
  onSave: (project: SongProject) => Promise<void>
}

type PracticeMode = 'normal' | 'learn' | 'band'

export function Studio({ project, onBack, onChange, onSave }: StudioProps) {
  const audioRefs = useRef(new Map<string, HTMLAudioElement>())
  const syncTimer = useRef<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [rate, setRate] = useState(1)
  const [mode, setMode] = useState<PracticeMode>('normal')
  const [peaks, setPeaks] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const masterTrack = project.tracks[0]
  const hasSolo = project.tracks.some((track) => track.solo)

  useEffect(() => {
    if (!masterTrack) return
    decodeAudioBlob(masterTrack.blob).then((buffer) => setPeaks(buildPeaks(buffer))).catch(() => setPeaks([]))
  }, [masterTrack])

  useEffect(() => {
    project.tracks.forEach((track) => {
      let audio = audioRefs.current.get(track.id)
      if (!audio) {
        audio = new Audio(track.url)
        audio.preload = 'auto'
        audio.preservesPitch = true
        audioRefs.current.set(track.id, audio)
      }
      audio.playbackRate = rate
      const shouldPlay = hasSolo ? track.solo : !track.muted
      let effectiveVolume = shouldPlay ? track.volume : 0
      if (mode === 'learn' && project.studyTrackId) effectiveVolume *= track.id === project.studyTrackId ? 1 : 0.22
      if (mode === 'band' && project.studyTrackId && track.id === project.studyTrackId) effectiveVolume = 0
      audio.volume = clamp(effectiveVolume, 0, 1)
    })
  }, [project.tracks, project.studyTrackId, hasSolo, mode, rate])

  useEffect(() => () => {
    if (syncTimer.current) window.clearInterval(syncTimer.current)
    audioRefs.current.forEach((audio) => { audio.pause(); audio.src = '' })
  }, [])

  useEffect(() => {
    if (!playing) return
    syncTimer.current = window.setInterval(() => {
      const master = masterTrack ? audioRefs.current.get(masterTrack.id) : undefined
      if (!master) return
      let nextTime = master.currentTime
      const { loop } = project
      if (loop.enabled && loop.end > loop.start && nextTime >= loop.end) {
        nextTime = loop.start
        audioRefs.current.forEach((audio) => { audio.currentTime = nextTime })
      }
      setCurrentTime(nextTime)
      audioRefs.current.forEach((audio) => {
        if (Math.abs(audio.currentTime - nextTime) > 0.12) audio.currentTime = nextTime
      })
      if (master.ended) setPlaying(false)
    }, 50)
    return () => {
      if (syncTimer.current) window.clearInterval(syncTimer.current)
      syncTimer.current = null
    }
  }, [playing, masterTrack, project.loop])

  function patchProject(patch: Partial<SongProject>) {
    onChange({ ...project, ...patch, updatedAt: Date.now() })
  }

  function patchTrack(id: string, patch: Partial<StemTrack>) {
    patchProject({ tracks: project.tracks.map((track) => track.id === id ? { ...track, ...patch } : track) })
  }

  async function togglePlayback() {
    if (playing) {
      audioRefs.current.forEach((audio) => audio.pause())
      setPlaying(false)
      return
    }
    const start = project.loop.enabled && (currentTime < project.loop.start || currentTime >= project.loop.end) ? project.loop.start : currentTime
    const actions: Promise<void>[] = []
    audioRefs.current.forEach((audio) => {
      audio.currentTime = start
      actions.push(audio.play())
    })
    await Promise.allSettled(actions)
    setCurrentTime(start)
    setPlaying(true)
  }

  function seek(time: number) {
    const safeTime = clamp(time, 0, project.duration)
    audioRefs.current.forEach((audio) => { audio.currentTime = safeTime })
    setCurrentTime(safeTime)
  }

  function updateLoop(patch: Partial<LoopRegion>) {
    patchProject({ loop: { ...project.loop, ...patch } })
  }

  function setLoopPoint(point: 'start' | 'end') {
    const patch = point === 'start'
      ? { start: Math.min(currentTime, Math.max(0, project.loop.end - 0.5)) }
      : { end: Math.max(currentTime, Math.min(project.duration, project.loop.start + 0.5)) }
    updateLoop({ ...patch, enabled: true })
  }

  async function saveNow() {
    setSaving(true)
    try { await onSave(project) } finally { setSaving(false) }
  }

  const modeDescription = useMemo(() => {
    if (!project.studyTrackId) return 'Selecione uma faixa no mixer para definir seu instrumento.'
    if (mode === 'learn') return 'Instrumento destacado e restante da banda reduzido.'
    if (mode === 'band') return 'Instrumento removido para você tocar com a banda.'
    return 'Mixagem livre, sem ajuste automático.'
  }, [mode, project.studyTrackId])

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={19} /></button>
        <div className="song-heading"><strong>{project.title}</strong><small>{project.artist || 'Projeto local'} · {project.key || 'Tom —'} · {project.bpm ? `${project.bpm} BPM` : 'BPM —'}</small></div>
        <button className="secondary-button" onClick={saveNow} disabled={saving}><Save size={17} /> {saving ? 'Salvando…' : 'Salvar'}</button>
      </header>

      <section className="studio-grid">
        <div className="timeline-panel panel">
          <div className="panel-heading"><span><ListMusic size={17} /> Estrutura e forma de onda</span><span>{formatTime(currentTime)} / {formatTime(project.duration)}</span></div>
          <div className="section-strip">
            {project.sections.map((section) => <button key={section.id} onClick={() => seek(section.time)}>{section.name}</button>)}
          </div>
          <Waveform peaks={peaks} duration={project.duration} currentTime={currentTime} loop={project.loop} sections={project.sections} onSeek={seek} />
          <div className="loop-toolbar">
            <button className={project.loop.enabled ? 'active-pill' : ''} onClick={() => updateLoop({ enabled: !project.loop.enabled })}><Repeat2 size={16} /> Loop {project.loop.enabled ? 'ligado' : 'desligado'}</button>
            <button onClick={() => setLoopPoint('start')}>A · {formatTime(project.loop.start)}</button>
            <button onClick={() => setLoopPoint('end')}>B · {formatTime(project.loop.end)}</button>
          </div>
        </div>

        <aside className="mixer-panel panel">
          <div className="panel-heading"><span><SlidersHorizontal size={17} /> Mixer</span><small>Toque no nome para selecionar</small></div>
          <div className="mixer-list">
            {project.tracks.map((track) => (
              <MixerTrack key={track.id} track={track} isStudyTrack={track.id === project.studyTrackId} onChange={(patch) => patchTrack(track.id, patch)} onSelectStudy={() => patchProject({ studyTrackId: track.id })} />
            ))}
          </div>
        </aside>

        <section className="practice-panel panel">
          <div className="panel-heading"><span><BookOpen size={17} /> Modo de ensaio</span></div>
          <div className="mode-switcher">
            <button className={mode === 'learn' ? 'selected' : ''} onClick={() => setMode('learn')}><BookOpen size={21} /><span>Aprender<small>Destacar instrumento</small></span></button>
            <button className={mode === 'band' ? 'selected' : ''} onClick={() => setMode('band')}><Users size={21} /><span>Tocar com a banda<small>Remover instrumento</small></span></button>
            <button className={mode === 'normal' ? 'selected' : ''} onClick={() => setMode('normal')}><SlidersHorizontal size={21} /><span>Mixagem livre<small>Controle manual</small></span></button>
          </div>
          <p className="mode-description">{modeDescription}</p>
          <div className="speed-control"><span><Gauge size={17} /> Velocidade</span><input type="range" min="0.5" max="1.2" step="0.05" value={rate} onChange={(event) => setRate(Number(event.target.value))} /><strong>{Math.round(rate * 100)}%</strong></div>
        </section>

        <section className="transport-panel panel">
          <div className="transport-time"><strong>{formatTime(currentTime)}</strong><span>{formatTime(project.duration)}</span></div>
          <div className="transport-buttons">
            <button className="icon-button" onClick={() => seek(0)}><SkipBack size={21} /></button>
            <button className="icon-button" onClick={() => seek(currentTime - 5)}><ChevronLeft size={23} /><small>5s</small></button>
            <button className="play-button" onClick={togglePlayback}>{playing ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" />}</button>
            <button className="icon-button" onClick={() => seek(currentTime + 5)}><small>5s</small><ChevronRight size={23} /></button>
            <button className="icon-button" onClick={() => seek(project.duration)}><SkipForward size={21} /></button>
          </div>
          <div className="transport-notes"><span>Velocidade preserva o tom quando o navegador oferece suporte.</span><span>Alteração independente de tom entra na próxima etapa.</span></div>
        </section>
      </section>
    </main>
  )
}
