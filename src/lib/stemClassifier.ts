import type { TrackRole } from '../types'

const ROLE_HINTS: Array<[TrackRole, RegExp]> = [
  ['vocals', /(vocal|voice|vox|voz|lead|backing)/i],
  ['drums', /(drum|bateria|perc|kick|snare)/i],
  ['bass', /(bass|baixo)/i],
  ['guitar', /(guitar|guitarra|viol[aã]o|acoustic)/i],
  ['keys', /(piano|keys|keyboard|teclado|organ|synth)/i],
  ['other', /(other|outros|accompaniment|instrumental|music)/i],
]

export function classifyStem(fileName: string, index: number): TrackRole {
  for (const [role, pattern] of ROLE_HINTS) {
    if (pattern.test(fileName)) return role
  }
  return index === 0 ? 'original' : 'other'
}

export const ROLE_LABELS: Record<TrackRole, string> = {
  original: 'Original',
  vocals: 'Voz',
  drums: 'Bateria',
  bass: 'Baixo',
  guitar: 'Guitarra / Violão',
  keys: 'Teclado / Piano',
  other: 'Outros',
}
