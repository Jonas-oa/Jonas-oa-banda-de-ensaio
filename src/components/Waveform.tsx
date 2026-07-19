import { useEffect, useRef } from 'react'
import type { LoopRegion, SectionMarker } from '../types'
import { clamp } from '../lib/format'

interface WaveformProps {
  peaks: number[]
  duration: number
  currentTime: number
  loop: LoopRegion
  sections: SectionMarker[]
  onSeek: (time: number) => void
}

export function Waveform({ peaks, duration, currentTime, loop, sections, onSeek }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scale = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(rect.width * scale))
    canvas.height = Math.max(1, Math.floor(rect.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return
    context.scale(scale, scale)
    const width = rect.width
    const height = rect.height
    context.clearRect(0, 0, width, height)

    context.fillStyle = '#0b1729'
    context.fillRect(0, 0, width, height)

    if (loop.enabled && duration > 0) {
      const loopStart = (loop.start / duration) * width
      const loopWidth = ((loop.end - loop.start) / duration) * width
      context.fillStyle = 'rgba(41, 208, 255, 0.11)'
      context.fillRect(loopStart, 0, loopWidth, height)
      context.strokeStyle = 'rgba(41, 208, 255, 0.85)'
      context.lineWidth = 1
      context.strokeRect(loopStart, 0.5, loopWidth, height - 1)
    }

    if (peaks.length) {
      const middle = height / 2
      const barWidth = width / peaks.length
      context.fillStyle = '#55708f'
      peaks.forEach((peak, index) => {
        const barHeight = Math.max(1, peak * height * 0.82)
        context.fillRect(index * barWidth, middle - barHeight / 2, Math.max(1, barWidth * 0.72), barHeight)
      })
    }

    sections.forEach((section) => {
      const x = duration > 0 ? (section.time / duration) * width : 0
      context.strokeStyle = 'rgba(255,255,255,.16)'
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    })

    const progressX = duration > 0 ? clamp(currentTime / duration, 0, 1) * width : 0
    context.strokeStyle = '#f7b84b'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(progressX, 0)
    context.lineTo(progressX, height)
    context.stroke()
    context.fillStyle = '#f7b84b'
    context.beginPath()
    context.arc(progressX, 8, 4, 0, Math.PI * 2)
    context.fill()
  }, [peaks, duration, currentTime, loop, sections])

  function handlePointer(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    onSeek(clamp((event.clientX - rect.left) / rect.width, 0, 1) * duration)
  }

  return <canvas ref={canvasRef} className="waveform" onPointerDown={handlePointer} aria-label="Forma de onda da música" />
}
