'use client'

import { usePathname } from 'next/navigation'
import Link            from 'next/link'

const STEPS = [
  { path: '/onboarding/consent', label: 'Consentimiento', num: 1 },
  { path: '/onboarding/sliders', label: 'Tu nivel',       num: 2 },
  { path: '/onboarding/test',    label: 'Test DDM',       num: 3 },
  { path: '/onboarding/results', label: 'Resultados',     num: 4 },
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname         = usePathname()
  const currentStepIndex = STEPS.findIndex((s) => pathname.startsWith(s.path))
  const isTestOrResults  = pathname.includes('/test') || pathname.includes('/results')

  return (
    <main className="mountain-bg min-h-screen flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <Link href="/activitat" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-glacier/10 border border-glacier/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L13 12.5H1L7 1.5Z" fill="#5BA3C9" opacity="0.3"/>
              <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="#5BA3C9" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-700 text-base tracking-tight">
            B4<span className="text-glacier">Experience</span>
          </span>
        </Link>

        {/* Step indicators — hidden during test */}
        {!isTestOrResults && (
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.slice(0, 3).map((step, idx) => {
              const done    = idx < currentStepIndex
              const current = idx === currentStepIndex
              return (
                <div key={step.path} className="flex items-center gap-2">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-600
                    transition-all duration-200
                    ${done    ? 'bg-glacier text-bg-primary'   : ''}
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
                  {idx < 2 && <div className="w-8 h-px bg-border mx-1 hidden md:block" />}
                </div>
              )
            })}
          </div>
        )}

        <div className="w-20" /> {/* spacer */}
      </header>

      {/* ── Progress bar ────────────────────────────────────────────── */}
      {!pathname.includes('/results') && (
        <div className="progress-bar-track w-full rounded-none h-0.5">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1">
        {children}
      </div>
    </main>
  )
}
