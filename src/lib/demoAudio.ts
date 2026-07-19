import type { TrackRole } from '../types'

const SAMPLE_RATE = 44100
const DURATION = 28

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index))
}

function encodeWav(samples: Float32Array): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let offset = 44
  for (const sample of samples) {
    const normalized = Math.max(-1, Math.min(1, sample))
    view.setInt16(offset, normalized < 0 ? normalized * 0x8000 : normalized * 0x7fff, true)
    offset += 2
  }
  return new Blob([view], { type: 'audio/wav' })
}

function envelope(time: number, beat: number): number {
  const position = time % beat
  return Math.exp(-position * 11)
}

function synthesize(role: TrackRole): Blob {
  const samples = new Float32Array(SAMPLE_RATE * DURATION)
  const beat = 60 / 76
  const chordRoots = [196, 146.83, 164.81, 130.81]
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / SAMPLE_RATE
    const measure = Math.floor(time / (beat * 4))
    const root = chordRoots[measure % chordRoots.length]
    let value = 0
    if (role === 'drums') {
      const kick = Math.sin(2 * Math.PI * 54 * time) * envelope(time, beat) * 0.55
      const eighth = Math.exp(-(time % (beat / 2)) * 35) * (Math.random() * 2 - 1) * 0.09
      const snarePosition = (time + beat) % (beat * 2)
      const snare = snarePosition < 0.12 ? Math.exp(-snarePosition * 22) * (Math.random() * 2 - 1) * 0.32 : 0
      value = kick + eighth + snare
    } else if (role === 'bass') {
      value = Math.sin(2 * Math.PI * (root / 2) * time) * 0.32 * (0.65 + 0.35 * envelope(time, beat))
    } else if (role === 'keys') {
      value = [1, 1.25, 1.5].reduce((sum, ratio) => sum + Math.sin(2 * Math.PI * root * ratio * time), 0) * 0.075
    } else if (role === 'guitar') {
      const pulse = Math.max(0, Math.sin(Math.PI * (time % (beat / 2)) / (beat / 2)))
      value = Math.sin(2 * Math.PI * root * 2 * time) * pulse * 0.11
    } else if (role === 'vocals') {
      const phrase = Math.sin(2 * Math.PI * (root * 2) * time + Math.sin(time * 3) * 0.3)
      value = phrase * (0.09 + 0.05 * Math.sin(time * 1.7))
    } else {
      value = Math.sin(2 * Math.PI * (root / 2) * time) * 0.045
    }
    samples[index] = value
  }
  return encodeWav(samples)
}

export function createDemoStems(): Array<{ role: TrackRole; name: string; blob: Blob }> {
  const definitions: Array<[TrackRole, string]> = [
    ['vocals', 'Voz guia'],
    ['drums', 'Bateria'],
    ['bass', 'Baixo'],
    ['guitar', 'Violão'],
    ['keys', 'Teclado'],
    ['other', 'Pad'],
  ]
  return definitions.map(([role, name]) => ({ role, name, blob: synthesize(role) }))
}
