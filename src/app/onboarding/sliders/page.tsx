'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter }                    from 'next/navigation'
import { useAppStore }                  from '@/context/AppContext'
import { useT }                         from '@/lib/i18n'
import type { SliderValues }            from '@/types'

// ─── Slider component ─────────────────────────────────────────────────────────
function Slider({
  label,
  sublabel,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
  scaleLabels,
}: {
  label: string
  sublabel: string
  unit: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  formatValue?: (v: number) => string
  scaleLabels?: string[]
}) {
  const pct = ((value - min) / (max - min)) * 100
  const displayVal = formatValue ? formatValue(value) : `${value}`

  return (
    <div className="b4e-card p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-display font-700 text-base text-text-primary">{label}</h3>
          <p className="font-body text-xs text-text-secondary mt-0.5">{sublabel}</p>
        </div>
        <div className="text-right">
          <span className="font-mono font-600 text-xl text-glacier">{displayVal}</span>
          <p className="font-body text-xs text-text-muted">{unit}</p>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <input
          type="range"
          className="b4e-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ '--value': `${pct}%` } as React.CSSProperties}
        />
      </div>

      {scaleLabels && (
        <div className="flex justify-between mt-2">
          {scaleLabels.map((lbl, i) => (
            <span key={i} className="text-xs font-body text-text-muted">{lbl}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SlidersPage() {
  const router               = useRouter()
  const { locale, setSliders } = useAppStore()
  const t                    = useT(locale)

  const [aerobic,    setAerobic]    = useState(15)
  const [anaerobic,  setAnaerobic]  = useState(800)
  const [technical,  setTechnical]  = useState(1)
  const [activities, setActivities] = useState<string[]>([''])

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ─── Activity list helpers ─────────────────────────────────────────────────
  function updateActivity(idx: number, val: string) {
    setActivities((prev) => prev.map((a, i) => (i === idx ? val : a)))
  }
  function addActivity() {
    if (activities.length < 3) {
      setActivities((prev) => [...prev, ''])
      // focus next input after render
      setTimeout(() => inputRefs.current[activities.length]?.focus(), 50)
    }
  }
  function removeActivity(idx: number) {
    setActivities((prev) => prev.filter((_, i) => i !== idx))
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const sliders: SliderValues = {
      aerobic,
      anaerobic,
      technical,
      activities: activities.filter((a) => a.trim().length > 0),
    }
    setSliders(sliders)
    router.push('/onboarding/test')
  }

  const technicalLabels = t.technicalLevels

  return (
    <div className="flex flex-col items-center px-4 py-10 animate-fade-in">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glacier/10 border border-glacier/30 mb-4">
            <span className="text-glacier text-xs">⛰️</span>
            <span className="text-xs font-display font-600 text-glacier tracking-wide">Paso 2 de 3</span>
          </div>
          <h1 className="font-display font-800 text-3xl text-text-primary mb-2">
            {t.slidersTitle}
          </h1>
          <p className="font-body text-text-secondary text-sm">
            {t.slidersSub}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Aerobic */}
          <Slider
            label={t.aerobicLabel}
            sublabel={t.aerobicSub}
            unit={t.aerobicUnit}
            min={0} max={60} step={1}
            value={aerobic}
            onChange={setAerobic}
            formatValue={(v) => `${v}`}
            scaleLabels={['0', '15', '30', '45', '60+']}
          />

          {/* Anaerobic */}
          <Slider
            label={t.anaerobicLabel}
            sublabel={t.anaerobicSub}
            unit={t.anaerobicUnit}
            min={0} max={3500} step={50}
            value={anaerobic}
            onChange={setAnaerobic}
            formatValue={(v) => v >= 3500 ? '3500+' : `${v}`}
            scaleLabels={['0', '700', '1400', '2100', '3500+']}
          />

          {/* Technical level */}
          <div className="b4e-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-700 text-base text-text-primary">{t.technicalLabel}</h3>
                <p className="font-body text-xs text-text-secondary mt-0.5">{t.technicalSub}</p>
              </div>
              <span className="font-mono font-600 text-xl text-glacier">{technicalLabels[technical - 1]}</span>
            </div>

            {/* Segmented selector */}
            <div className="grid grid-cols-4 gap-2">
              {technicalLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTechnical(idx + 1)}
                  className={`
                    py-2.5 px-1 rounded-lg text-xs font-display font-600 transition-all duration-150
                    border text-center
                    ${technical === idx + 1
                      ? 'bg-glacier text-bg-primary border-glacier'
                      : 'bg-bg-elevated text-text-secondary border-border hover:border-border-light hover:text-text-primary'
                    }
                  `}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Technical level descriptions */}
            <div className="mt-3 px-3 py-2 rounded-lg bg-bg-elevated">
              {technical === 1 && <p className="text-xs font-body text-text-secondary">Senderos marcados, sin desnivel técnico. Calzado de trekking básico.</p>}
              {technical === 2 && <p className="text-xs font-body text-text-secondary">Rutas con algo de desnivel, terreno irregular. Alguna experiencia.</p>}
              {technical === 3 && <p className="text-xs font-body text-text-secondary">Rutas con desnivel significativo, pasos expuestos. Varias salidas anuales.</p>}
              {technical === 4 && <p className="text-xs font-body text-text-secondary">Alta montaña, rutas técnicas, condiciones adversas. Experiencia sólida.</p>}
            </div>
          </div>

          {/* Optional activities */}
          <div className="b4e-card p-5">
            <h3 className="font-display font-700 text-base text-text-primary mb-1">
              {t.activitiesTitle}
            </h3>
            <p className="font-body text-xs text-text-secondary mb-4">
              {t.activitiesSub}
            </p>

            <div className="flex flex-col gap-2">
              {activities.map((act, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-text-muted w-5 text-right shrink-0">{idx + 1}.</span>
                  <input
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    className="b4e-input flex-1 text-sm py-2"
                    value={act}
                    onChange={(e) => updateActivity(idx, e.target.value.slice(0, 100))}
                    placeholder={t.activitiesPlaceholder}
                    maxLength={100}
                  />
                  {activities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(idx)}
                      className="w-8 h-8 rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/50 transition-colors flex items-center justify-center shrink-0"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {activities.length < 3 && (
                <button
                  type="button"
                  onClick={addActivity}
                  className="mt-1 text-xs font-body text-glacier hover:text-glacier-light transition-colors text-left flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {t.addActivity}
                </button>
              )}
            </div>

            <button
              type="button"
              className="mt-4 text-xs font-body text-text-muted hover:text-text-secondary transition-colors"
              onClick={() => {
                setActivities([''])
                router.push('/onboarding/test')
              }}
            >
              {t.skip} →
            </button>
          </div>

          {/* Disclaimer note */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-bg-elevated border border-border">
            <span className="text-warn text-sm mt-0.5">ℹ️</span>
            <p className="text-xs font-body text-text-secondary leading-relaxed">
              {t.sliderWarning}
            </p>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary w-full py-4 text-base mt-2">
            {t.startTest}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
