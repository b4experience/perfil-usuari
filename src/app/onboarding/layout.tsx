'use client'

import { usePathname } from 'next/navigation'
import Link            from 'next/link'

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
      <header className="relative z-10 shrink-0 flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-border">
        <Link href="/activitat" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-glacier/10 border border-glacier/30 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L13 12.5H1L7 1.5Z" fill="#0B6EE8" opacity="0.3"/>
              <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="#0B6EE8" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-700 text-sm tracking-tight">
            B4<span className="text-glacier">Experience</span>
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
                  <div className={`
                    w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-600
                    transition-all duration-200
                    ${done    ? 'bg-glacier text-white'          : ''}
                    ${current ? 'bg-glacier/20 text-glacier border border-glacier' : ''}
                    ${!done && !current ? 'bg-bg-elevated text-text-muted border border-border' : ''}
                  `}>
                    {done ? '✓' : step.num}
                  </div>
                  <span className={`text-xs font-body hidden md:inline
                    ${current ? 'text-text-primary' : 'text-text-muted'}
                  `}>
                    {step.label}
                  </span>
                  {idx < 2 && <div className="w-4 sm:w-6 h-px bg-border mx-0.5 hidden sm:block" />}
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
      <div className="relative z-10 flex-1 overflow-hidden">
        {children}
      </div>
    </main>
  )
}
