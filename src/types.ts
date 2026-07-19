export type TrackRole = 'original' | 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'other'

export interface StemTrack {
  id: string
  name: string
  role: TrackRole
  fileName: string
  mimeType: string
  blob: Blob
  url: string
  volume: number
  muted: boolean
  solo: boolean
}

export interface SectionMarker {
  id: string
  name: string
  time: number
}

export interface LoopRegion {
  enabled: boolean
  start: number
  end: number
}

export interface SongProject {
  id: string
  title: string
  artist: string
  bpm: number | null
  key: string | null
  duration: number
  createdAt: number
  updatedAt: number
  studyTrackId: string | null
  tracks: StemTrack[]
  sections: SectionMarker[]
  loop: LoopRegion
}
