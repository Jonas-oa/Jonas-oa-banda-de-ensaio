import { FileAudio, FolderPlus, Music2, Play, Trash2, WandSparkles } from 'lucide-react'
import type { SongProject } from '../types'
import { formatTime } from '../lib/format'

interface LibraryProps {
  projects: SongProject[]
  loading: boolean
  onOpen: (project: SongProject) => void
  onImport: () => void
  onDemo: () => void
  onDelete: (project: SongProject) => void
}

export function Library({ projects, loading, onOpen, onImport, onDemo, onDelete }: LibraryProps) {
  return (
    <main className="library-shell">
      <header className="library-header">
        <div className="brand-lockup">
          <span className="brand-icon"><Music2 size={25} /></span>
          <div><strong>Banda de Ensaio</strong><small>Seu estúdio pessoal, offline</small></div>
        </div>
        <button className="primary-button" onClick={onImport}><FolderPlus size={18} /> Adicionar música</button>
      </header>

      <section className="hero-panel">
        <div>
          <span className="eyebrow">PRIMEIRA VERSÃO</span>
          <h1>Aprenda uma parte. Depois toque com a banda.</h1>
          <p>Importe sua música ou stems, escolha o instrumento de estudo, repita trechos e ajuste o volume de cada faixa.</p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={onImport}><FileAudio size={20} /> Importar arquivos</button>
            <button className="secondary-button large" onClick={onDemo}><WandSparkles size={20} /> Abrir demonstração</button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          {[78, 42, 92, 60, 88, 34, 72, 54, 96, 50, 82, 38, 68, 90, 48, 74].map((height, index) => (
            <span key={index} style={{ height: `${height}%`, animationDelay: `${index * 60}ms` }} />
          ))}
        </div>
      </section>

      <section className="library-content">
        <div className="section-title"><div><span className="eyebrow">BIBLIOTECA</span><h2>Seus ensaios</h2></div><span>{projects.length} projeto{projects.length === 1 ? '' : 's'}</span></div>
        {loading ? <div className="empty-state">Carregando biblioteca…</div> : projects.length === 0 ? (
          <div className="empty-state"><Music2 size={36} /><strong>Nenhuma música adicionada</strong><p>Comece pela demonstração ou importe um áudio do seu aparelho.</p></div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <button className="project-cover" onClick={() => onOpen(project)}><Music2 size={34} /><span><Play size={18} fill="currentColor" /></span></button>
                <div className="project-info"><strong>{project.title}</strong><small>{project.artist || 'Artista não informado'} · {formatTime(project.duration)}</small><small>{project.tracks.length} faixa{project.tracks.length === 1 ? '' : 's'} · {project.bpm ? `${project.bpm} BPM` : 'BPM não analisado'}</small></div>
                <button className="icon-button" onClick={() => onDelete(project)} aria-label={`Excluir ${project.title}`}><Trash2 size={17} /></button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
