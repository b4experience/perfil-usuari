'use client'

import { useState, FormEvent } from 'react'
import { useRouter }            from 'next/navigation'
import { useAppStore }          from '@/context/AppContext'
import { useT }                 from '@/lib/i18n'
import { Button }               from '@/components/ui/button'
import { Card }                 from '@/components/ui/card'
import { cn }                   from '@/lib/utils'

function SliderRow({ label, unit, min, max, step, value, onChange, formatValue, scaleLabels }: {
  label: string; unit: string; min: number; max: number
  step: number; value: number; onChange: (v: number) => void
  formatValue?: (v: number) => string; scaleLabels?: string[]
}) {
  const pct = ((value - min) / (max - min)) * 100
  const displayVal = formatValue ? formatValue(value) : `${value}`
  return (
    <div className="py-5 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display font-semibold text-sm text-foreground">{label}</span>
        <span className="font-mono font-semibold text-base text-primary">
          {displayVal} <span className="text-xs text-muted-foreground font-sans">{unit}</span>
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
            <span key={i} className="text-[10px] text-muted-foreground">{lbl}</span>
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

          <h1 className="font-display font-bold text-2xl text-foreground mb-3">
            {t.slidersTitle}
          </h1>

          <Card className="px-4 py-1 mb-2">
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
                  <span className="font-display font-semibold text-sm text-foreground">{t.technicalLabel}</span>
                  <span className="font-mono font-semibold text-sm text-primary">{t.technicalLevels[technical - 1]}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {t.technicalLevels.map((lbl, idx) => (
                    <button
                      key={idx} type="button" onClick={() => setTechnical(idx + 1)}
                      className={cn(
                        'py-2 rounded-md text-xs font-display font-semibold transition-all duration-150 border text-center',
                        technical === idx + 1
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

            </form>
          </Card>
        </div>
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border bg-background">
        <div className="w-full max-w-lg mx-auto">
          <Button type="submit" form="sliders-form" className="w-full font-display font-semibold">
            {t.next ?? 'Siguiente'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
