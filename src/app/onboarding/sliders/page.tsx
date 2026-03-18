'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter }                    from 'next/navigation'
import { useAppStore }                  from '@/context/AppContext'
import { useT }                         from '@/lib/i18n'
import type { SliderValues }            from '@/types'

function Slider({ label, sublabel, unit, min, max, step, value, onChange, formatValue, scaleLabels }: {
  label: string; sublabel: string; unit: string; min: number; max: number
  step: number; value: number; onChange: (v: number) => void
  formatValue?: (v: number) => string; scaleLabels?: string[]
}) {
  const pct = ((value - min) / (max - min)) * 100
  const displayVal = formatValue ? formatValue(value) : `${value}`
  return (
    <div className="b4e-card p-3 sm:p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-display font-700 text-sm text-text-primary">{label}</h3>
          <p className="font-body text-xs text-text-secondary mt-0.5">{sublabel}</p>
        </div>
        <div className="text-right">
          <span className="font-mono font-600 text-lg text-glacier">{displayVal}</span>
          <p className="font-body text-xs text-text-muted">{unit}</p>
        </div>
      </div>
      <div className="mt-3 mb-1">
        <input
          type="range" className="b4e-slider"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ '--value': `${pct}%` } as React.CSSProperties}
        />
      </div>
      {scaleLabels && (
        <div className="flex justify-between mt-1">
          {scaleLabels.map((lbl, i) => (
            <span key={i} className="text-[10px] font-body text-text-muted">{lbl}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SlidersPage() {
  const router               = useRouter()
  const { locale, setSliders } = useAppStore()
  const t                    = useT(locale)

  const [aerobic,    setAerobic]    = useState(15)
  const [anaerobic,  setAnaerobic]  = useState(800)
  const [technical,  setTechnical]  = useState(1)
  const [activities, setActivities] = useState<string[]>([''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function updateActivity(idx: number, val: string) {
    setActivities((prev) => prev.map((a, i) => (i === idx ? val : a)))
  }
  function addActivity() {
    if (activities.length < 3) {
      setActivities((prev) => [...prev, ''])
      setTimeout(() => inputRefs.current[activities.length]?.focus(), 50)
    }
  }
  function removeActivity(idx: number) {
    setActivities((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSliders({ aerobic, anaerobic, technical, activities: activities.filter((a) => a.trim().length > 0) })
    router.push('/onboarding/test')
  }

  const technicalLabels = t.technicalLevels

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 sm:py-5">
        <div className="w-full max-w-lg mx-auto">

          {/* Header */}
          <div className="mb-3 sm:mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glacier/10 border border-glacier/30 mb-2">
              <span className="text-glacier text-xs">⛰️</span>
              <span className="text-xs font-display font-600 text-glacier tracking-wide">Paso 2 de 3</span>
            </div>
            <h1 className="font-display font-800 text-2xl sm:text-3xl text-text-primary mb-1">
              {t.slidersTitle}
            </h1>
            <p className="font-body text-text-secondary text-xs sm:text-sm">{t.slidersSub}</p>
          </div>

          <form id="sliders-form" onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3">

            <Slider
              label={t.aerobicLabel} sublabel={t.aerobicSub} unit={t.aerobicUnit}
              min={0} max={60} step={1} value={aerobic} onChange={setAerobic}
              formatValue={(v) => `${v}`} scaleLabels={['0', '15', '30', '45', '60+']}
            />
            <Slider
              label={t.anaerobicLabel} sublabel={t.anaerobicSub} unit={t.anaerobicUnit}
              min={0} max={3500} step={50} value={anaerobic} onChange={setAnaerobic}
              formatValue={(v) => v >= 3500 ? '3500+' : `${v}`}
              scaleLabels={['0', '700', '1400', '2100', '3500+']}
            />

            {/* Technical level */}
            <div className="b4e-card p-3 sm:p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-700 text-sm text-text-primary">{t.technicalLabel}</h3>
                  <p className="font-body text-xs text-text-secondary mt-0.5">{t.technicalSub}</p>
                </div>
                <span className="font-mono font-600 text-base text-glacier">{technicalLabels[technical - 1]}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {technicalLabels.map((lbl, idx) => (
                  <button
                    key={idx} type="button" onClick={() => setTechnical(idx + 1)}
                    className={`
                      py-2 px-1 rounded-lg text-[11px] sm:text-xs font-display font-600 transition-all duration-150
                      border text-center
                      ${technical === idx + 1
                        ? 'bg-glacier text-white border-glacier'
                        : 'bg-bg-elevated text-text-secondary border-border hover:border-border-light hover:text-text-primary'
                      }
                    `}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-bg-elevated">
                {technical === 1 && <p className="text-xs font-body text-text-secondary">Senderos marcados, sin desnivel técnico.</p>}
                {technical === 2 && <p className="text-xs font-body text-text-secondary">Rutas con desnivel, terreno irregular.</p>}
                {technical === 3 && <p className="text-xs font-body text-text-secondary">Pasos expuestos, desnivel significativo.</p>}
                {technical === 4 && <p className="text-xs font-body text-text-secondary">Alta montaña, condiciones adversas.</p>}
              </div>
            </div>

            {/* Activities */}
            <div className="b4e-card p-3 sm:p-4">
              <h3 className="font-display font-700 text-sm text-text-primary mb-0.5">{t.activitiesTitle}</h3>
              <p className="font-body text-xs text-text-secondary mb-3">{t.activitiesSub}</p>
              <div className="flex flex-col gap-2">
                {activities.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-muted w-4 text-right shrink-0">{idx + 1}.</span>
                    <input
                      ref={(el) => { inputRefs.current[idx] = el }}
                      type="text" className="b4e-input flex-1 text-xs sm:text-sm py-2"
                      value={act} onChange={(e) => updateActivity(idx, e.target.value.slice(0, 100))}
                      placeholder={t.activitiesPlaceholder} maxLength={100}
                    />
                    {activities.length > 1 && (
                      <button type="button" onClick={() => removeActivity(idx)}
                        className="w-7 h-7 rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/50 transition-colors flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {activities.length < 3 && (
                  <button type="button" onClick={addActivity}
                    className="mt-0.5 text-xs font-body text-glacier hover:text-glacier-dark transition-colors text-left flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {t.addActivity}
                  </button>
                )}
              </div>
              <button type="button" className="mt-3 text-xs font-body text-text-muted hover:text-text-secondary transition-colors"
                onClick={() => { setActivities([' ']); router.push('/onboarding/test') }}>
                {t.skip} →
              </button>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border">
              <span className="text-warn text-xs mt-0.5">ℹ️</span>
              <p className="text-xs font-body text-text-secondary leading-relaxed">{t.sliderWarning}</p>
            </div>

          </form>
        </div>
      </div>

      {/* ── Sticky submit ────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-bg-primary/95">
        <div className="w-full max-w-lg mx-auto">
          <button type="submit" form="sliders-form" className="btn-primary w-full py-3 text-sm sm:text-base">
            {t.startTest}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
