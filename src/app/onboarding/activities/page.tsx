'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter }                    from 'next/navigation'
import { useAppStore }                  from '@/context/AppContext'
import { useT }                         from '@/lib/i18n'
import { Button }                       from '@/components/ui/button'
import { Input }                        from '@/components/ui/input'

export default function ActivitiesPage() {
  const router                 = useRouter()
  const { locale, setSliders, sliders } = useAppStore()
  const t                      = useT(locale)

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
    setSliders({
      aerobic:    sliders?.aerobic    ?? 15,
      anaerobic:  sliders?.anaerobic  ?? 800,
      technical:  sliders?.technical  ?? 1,
      activities: activities.filter((a) => a.trim().length > 0),
    })
    router.push('/onboarding/test')
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="w-full max-w-lg mx-auto">

          <h1 className="font-display font-bold text-2xl text-foreground mb-1">
            {t.activitiesTitle}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t.activitiesSub}
          </p>

          <form id="activities-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              {activities.map((act, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}.</span>
                  <Input
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    value={act}
                    onChange={(e) => updateActivity(idx, e.target.value.slice(0, 100))}
                    placeholder={t.activitiesPlaceholder}
                    maxLength={100}
                    className="flex-1 text-sm"
                  />
                  {activities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(idx)}
                      className="w-8 h-8 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors flex items-center justify-center shrink-0"
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
                  className="text-xs text-primary hover:text-primary/80 transition-colors text-left flex items-center gap-1.5 ml-7"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {t.addActivity}
                </button>
              )}
            </div>
          </form>

          {/* Skip button — top right */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => router.push('/onboarding/test')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.skip} →
            </button>
          </div>

        </div>
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border bg-background">
        <div className="w-full max-w-lg mx-auto">
          <Button type="submit" form="activities-form" className="w-full font-display font-semibold">
            {t.startTest}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
