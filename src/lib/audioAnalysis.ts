export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const context = new AudioContext()
  try {
    return await context.decodeAudioData(await blob.arrayBuffer())
  } finally {
    await context.close()
  }
}

export function buildPeaks(buffer: AudioBuffer, count = 1000): number[] {
  const channel = buffer.getChannelData(0)
  const blockSize = Math.max(1, Math.floor(channel.length / count))
  const peaks: number[] = []
  for (let index = 0; index < count; index += 1) {
    const start = index * blockSize
    let peak = 0
    for (let sample = start; sample < Math.min(start + blockSize, channel.length); sample += 1) {
      peak = Math.max(peak, Math.abs(channel[sample]))
    }
    peaks.push(peak)
  }
  return peaks
}
