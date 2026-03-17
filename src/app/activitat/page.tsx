'use client'

import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { useAppStore }         from '@/context/AppContext'
import { useT }                from '@/lib/i18n'
import LanguageSelector        from '@/components/LanguageSelector'
import type { Discipline }     from '@/types'

const DISCIPLINES: { id: Discipline; icon: string; available: boolean }[] = [
  { id: 'trekking',      icon: '⛰️',  available: true  },
  { id: 'trail_running', icon: '🏃',  available: false },
  { id: 'alpinismo',     icon: '🧗',  available: false },
  { id: 'esqui_montana', icon: '⛷️',  available: false },
  { id: 'escalada',      icon: '🪨',  available: false },
]

export default function ActivitatPage() {
  const router  = useRouter()
  const { locale, userName, setDiscipline } = useAppStore()
  const t       = useT(locale)

  function handleSelect(discipline: Discipline) {
    setDiscipline(discipline)
    router.push('/onboarding/consent')
  }

  return (
    <main className="mountain-bg min-h-screen flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
        <Link href="/login" className="flex items-center gap-2 group">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 7H3M6 4L3 7L6 10" stroke="#7A92A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-body text-text-secondary group-hover:text-text-primary transition-colors">
            {t.back}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-glacier flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 14H2L9 2Z" fill="#070C12" strokeLinejoin="round"/>
              <path d="M9 7L12 12H6L9 7Z" fill="#070C12" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-display font-800 text-lg tracking-tight text-text-primary">
            B4<span className="text-gradient">Experience</span>
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-8 pb-6 animate-fade-in">
        {userName && (
          <p className="font-body text-sm text-text-muted mb-3">
            {locale === 'ca' ? `Hola, ${userName}!` : locale === 'en' ? `Hi, ${userName}!` : `Hola, ${userName}!`}
          </p>
        )}
        <h1 className="font-display font-800 text-3xl sm:text-4xl text-text-primary mb-2">
          {t.chooseActivity}
        </h1>
        <p className="font-body text-text-secondary text-sm max-w-sm">
          {t.chooseActivitySub}
        </p>
        <p className="mt-3 text-xs text-text-muted font-body italic">
          {t.onlyTrekking}
        </p>
      </section>

      {/* ── Discipline Grid ─────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 flex flex-col items-center px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
          {DISCIPLINES.map(({ id, icon, available }, idx) => (
            <div
              key={id}
              onClick={() => available && handleSelect(id)}
              className={`
                b4e-card p-5 cursor-pointer select-none
                transition-all duration-200
                animate-slide-up
                ${available
                  ? 'hover:b4e-card-active hover:scale-[1.02]'
                  : 'opacity-40 cursor-not-allowed'
                }
                ${id === 'trekking' ? 'b4e-card-active sm:col-span-2 lg:col-span-1' : ''}
              `}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{icon}</div>
                {!available && (
                  <span className="text-xs font-display font-600 px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border">
                    {t.comingSoon}
                  </span>
                )}
                {available && (
                  <div className="w-6 h-6 rounded-full bg-glacier/20 border border-glacier/40 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4.5 7.5L8 3" stroke="#5BA3C9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>

              <h3 className="font-display font-700 text-lg text-text-primary mb-1">
                {t.disciplines[id]}
              </h3>

              <p className="font-body text-xs text-text-secondary leading-relaxed mb-4">
                {t.disciplineDesc[id]}
              </p>

              {available && (
                <button className="btn-primary w-full text-sm py-2.5">
                  {t.startEvaluation}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 text-center py-4 px-6 border-t border-border">
        <p className="text-xs text-text-muted font-body">
          © 2026 B4Experience · <span className="text-text-muted/60">CONFIDENCIAL</span>
        </p>
      </footer>
    </main>
  )
}
