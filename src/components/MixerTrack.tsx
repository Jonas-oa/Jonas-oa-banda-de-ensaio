import { Headphones, Volume2, VolumeX } from 'lucide-react'
import type { StemTrack } from '../types'

interface MixerTrackProps {
  track: StemTrack
  isStudyTrack: boolean
  onChange: (patch: Partial<StemTrack>) => void
  onSelectStudy: () => void
}

export function MixerTrack({ track, isStudyTrack, onChange, onSelectStudy }: MixerTrackProps) {
  return (
    <div className={`mixer-track ${isStudyTrack ? 'study-track' : ''}`}>
      <button className="track-name" onClick={onSelectStudy} title="Usar como instrumento de estudo">
        <span className="track-dot" />
        <span>{track.name}</span>
      </button>
      <button
        className={`icon-button compact ${track.solo ? 'active' : ''}`}
        onClick={() => onChange({ solo: !track.solo })}
        aria-label={`Solo ${track.name}`}
      >
        <Headphones size={16} />
      </button>
      <button
        className={`icon-button compact ${track.muted ? 'danger' : ''}`}
        onClick={() => onChange({ muted: !track.muted })}
        aria-label={`Silenciar ${track.name}`}
      >
        {track.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <input
        aria-label={`Volume de ${track.name}`}
        className="volume-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={track.volume}
        onChange={(event) => onChange({ volume: Number(event.target.value) })}
      />
      <span className="volume-value">{Math.round(track.volume * 100)}%</span>
    </div>
  )
}
