'use client'

import { useState, FormEvent } from 'react'
import { useRouter }            from 'next/navigation'
import { useAppStore }          from '@/context/AppContext'
import { useT }                 from '@/lib/i18n'

function SliderRow({ label, unit, min, max, step, value, onChange, formatValue, scaleLabels }: {
  label: string; unit: string; min: number; max: number
  step: number; value: number; onChange: (v: number) => void
  formatValue?: (v: number) => string; scaleLabels?: string[]
}) {
  const pct = ((value - min) / (max - min)) * 100
  const displayVal = formatValue ? formatValue(value) : `${value}`
  return (
    <div className="py-5 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display font-600 text-sm text-text-primary">{label}</span>
        <span className="font-mono font-600 text-base text-glacier">
          {displayVal} <span className="text-xs text-text-muted font-body">{unit}</span>
        </span>
      </div>
      <input
        type="range" className="b4e-slider"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--value': `${pct}%` } as React.CSSProperties}
      />
      {scaleLabels && (
        <div className="flex justify-between mt-2">
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

  const [aerobic,   setAerobic]   = useState(15)
  const [anaerobic, setAnaerobic] = useState(800)
  const [technical, setTechnical] = useState(1)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSliders({ aerobic, anaerobic, technical, activities: [] })
    router.push('/onboarding/activities')
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="w-full max-w-lg mx-auto">

          <h1 className="font-display font-800 text-2xl text-text-primary mb-2">
            {t.slidersTitle}
          </h1>

          <form id="sliders-form" onSubmit={handleSubmit}>

            <SliderRow
              label={t.aerobicLabel} unit={t.aerobicUnit}
              min={0} max={60} step={1} value={aerobic} onChange={setAerobic}
              formatValue={(v) => `${v}`} scaleLabels={['0', '15', '30', '45', '60+']}
            />

            <SliderRow
              label={t.anaerobicLabel} unit={t.anaerobicUnit}
              min={0} max={3500} step={50} value={anaerobic} onChange={setAnaerobic}
              formatValue={(v) => v >= 3500 ? '3500+' : `${v}`}
              scaleLabels={['0', '700', '1400', '2100', '3500+']}
            />

            <div className="py-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-600 text-sm text-text-primary">{t.technicalLabel}</span>
                <span className="font-mono font-600 text-sm text-glacier">{t.technicalLevels[technical - 1]}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {t.technicalLevels.map((lbl, idx) => (
                  <button
                    key={idx} type="button" onClick={() => setTechnical(idx + 1)}
                    className={`py-2 rounded-lg text-xs font-display font-600 transition-all duration-150 border text-center
                      ${technical === idx + 1
                        ? 'bg-glacier text-white border-glacier'
                        : 'bg-bg-elevated text-text-secondary border-border hover:border-glacier/40 hover:text-text-primary'
                      }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border bg-bg-primary/95">
        <div className="w-full max-w-lg mx-auto">
          <button type="submit" form="sliders-form" className="btn-primary w-full py-3 text-sm">
            {t.next ?? 'Siguiente'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
