'use client'

import { usePathname } from 'next/navigation'
import Link            from 'next/link'
import { cn }          from '@/lib/utils'

const STEPS = [
  { path: '/onboarding/sliders',    label: 'Nivel',       num: 1 },
  { path: '/onboarding/activities', label: 'Actividades', num: 2 },
  { path: '/onboarding/test',       label: 'Test',        num: 3 },
  { path: '/onboarding/results',    label: 'Resultados',  num: 4 },
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname         = usePathname()
  const currentStepIndex = STEPS.findIndex((s) => pathname.startsWith(s.path))
  const isTestOrResults  = pathname.includes('/test') || pathname.includes('/results')

  return (
    <main className="mountain-bg h-[100dvh] flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950 shadow-md">
        <Link href="/activitat" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/WhiteLogo.png" alt="B4Experience" className="h-7 w-7 object-contain" />
          <span className="font-display font-bold text-sm tracking-tight text-white">
            B4Experience
          </span>
        </Link>

        {/* Step indicators — hidden during test */}
        {!isTestOrResults && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {STEPS.slice(0, 3).map((step, idx) => {
              const done    = idx < currentStepIndex
              const current = idx === currentStepIndex
              return (
                <div key={step.path} className="flex items-center gap-1.5">
                  <div className={cn(
                    'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-semibold transition-all duration-200',
                    done    && 'bg-primary text-white',
                    current && 'bg-white/20 text-white border border-white/60',
                    !done && !current && 'bg-white/10 text-white/50 border border-white/20'
                  )}>
                    {done ? '✓' : step.num}
                  </div>
                  <span className={cn(
                    'text-xs hidden md:inline',
                    current ? 'text-white' : 'text-white/50'
                  )}>
                    {step.label}
                  </span>
                  {idx < 2 && <div className="w-4 sm:w-6 h-px bg-white/20 mx-0.5 hidden sm:block" />}
                </div>
              )
            })}
          </div>
        )}

        <div className="w-16 sm:w-20" />
      </header>

      {/* ── Progress bar ────────────────────────────────────────────── */}
      {!pathname.includes('/results') && (
        <div className="progress-bar-track w-full rounded-none h-0.5 shrink-0">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </main>
  )
}
