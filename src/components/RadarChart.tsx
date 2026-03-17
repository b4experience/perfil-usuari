'use client'

import { useEffect, useRef } from 'react'

interface RadarDataPoint {
  label: string
  sublabel: string
  user: number    // 0–1 normalized
  expert: number  // 0–1 normalized
}

interface RadarChartProps {
  data: RadarDataPoint[]
  size?: number
}

export default function RadarChart({ data, size = 280 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const progress  = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr    = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr
    canvas.style.width  = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2 + 8
    const R  = size * 0.34
    const n  = data.length

    function polarToXY(angle: number, r: number) {
      return {
        x: cx + r * Math.cos(angle - Math.PI / 2),
        y: cy + r * Math.sin(angle - Math.PI / 2),
      }
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, size, size)

      // Grid rings
      for (let i = 1; i <= 4; i++) {
        ctx!.beginPath()
        for (let j = 0; j < n; j++) {
          const angle = (j * 2 * Math.PI) / n
          const pt    = polarToXY(angle, (i / 4) * R)
          j === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y)
        }
        ctx!.closePath()
        ctx!.strokeStyle = 'rgba(30, 47, 66, 0.9)'
        ctx!.lineWidth   = 1
        ctx!.stroke()
      }

      // Axis lines
      for (let j = 0; j < n; j++) {
        const angle = (j * 2 * Math.PI) / n
        const pt    = polarToXY(angle, R)
        ctx!.beginPath()
        ctx!.moveTo(cx, cy)
        ctx!.lineTo(pt.x, pt.y)
        ctx!.strokeStyle = 'rgba(42, 63, 86, 0.6)'
        ctx!.lineWidth   = 1
        ctx!.stroke()
      }

      // Expert polygon (dashed orange)
      ctx!.beginPath()
      for (let j = 0; j < n; j++) {
        const angle = (j * 2 * Math.PI) / n
        const pt    = polarToXY(angle, data[j].expert * R)
        j === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y)
      }
      ctx!.closePath()
      ctx!.setLineDash([4, 4])
      ctx!.strokeStyle = 'rgba(224,120,64,0.7)'
      ctx!.lineWidth   = 1.5
      ctx!.stroke()
      ctx!.setLineDash([])

      // User polygon (animated fill)
      ctx!.beginPath()
      for (let j = 0; j < n; j++) {
        const angle = (j * 2 * Math.PI) / n
        const pt    = polarToXY(angle, data[j].user * R * t)
        j === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y)
      }
      ctx!.closePath()
      ctx!.fillStyle   = 'rgba(91,163,201,0.15)'
      ctx!.fill()
      ctx!.strokeStyle = '#5BA3C9'
      ctx!.lineWidth   = 2
      ctx!.stroke()

      // Dots at each axis
      for (let j = 0; j < n; j++) {
        const angle = (j * 2 * Math.PI) / n
        const pt    = polarToXY(angle, data[j].user * R * t)
        ctx!.beginPath()
        ctx!.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
        ctx!.fillStyle = '#82BCE0'
        ctx!.fill()
      }

      // Labels
      for (let j = 0; j < n; j++) {
        const angle     = (j * 2 * Math.PI) / n
        const labelDist = R + 28
        const pt        = polarToXY(angle, labelDist)

        ctx!.font      = '600 11px "Plus Jakarta Sans", sans-serif'
        ctx!.fillStyle = '#E2EAF2'
        ctx!.textAlign = 'center'
        ctx!.textBaseline = 'middle'
        ctx!.fillText(data[j].label.toUpperCase(), pt.x, pt.y - 6)

        ctx!.font      = '400 10px "Plus Jakarta Sans", sans-serif'
        ctx!.fillStyle = '#7A92A8'
        const val = (data[j].user * 10).toFixed(1)
        ctx!.fillText(val, pt.x, pt.y + 8)
      }
    }

    function animate() {
      progress.current = Math.min(progress.current + 0.035, 1)
      draw(progress.current)
      if (progress.current < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    progress.current = 0
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [data, size])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto"
      style={{ display: 'block' }}
      aria-label="Radar chart of decisional competence dimensions"
    />
  )
}
