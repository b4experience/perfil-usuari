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
  const router                          = useRouter()
  const { locale, userName, setDiscipline } = useAppStore()
  const t                               = useT(locale)

  function handleSelect(discipline: Discipline) {
    setDiscipline(discipline)
    router.push('/onboarding/consent')
  }

  return (
    <main className="mountain-bg h-[100dvh] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border">
        <Link href="/login" className="flex items-center gap-2 group">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 7H3M6 4L3 7L6 10" stroke="#6B7A8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-body text-text-secondary group-hover:text-text-primary transition-colors">
            {t.back}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-glacier flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 14H2L9 2Z" fill="white" strokeLinejoin="round"/>
              <path d="M9 7L12 12H6L9 7Z" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-display font-800 text-base tracking-tight text-text-primary">
            B4<span className="text-gradient">Experience</span>
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 text-center px-4 pt-3 sm:pt-5 pb-2 sm:pb-3 animate-fade-in">
        {userName && (
          <p className="font-body text-xs text-text-muted mb-1">
            {locale === 'ca' ? `Hola, ${userName}!` : locale === 'en' ? `Hi, ${userName}!` : `Hola, ${userName}!`}
          </p>
        )}
        <h1 className="font-display font-800 text-xl sm:text-3xl text-text-primary mb-1">
          {t.chooseActivity}
        </h1>
        <p className="font-body text-text-secondary text-xs sm:text-sm max-w-sm mx-auto">
          {t.chooseActivitySub}
        </p>
      </div>

      {/* ── Discipline list ─────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-3 sm:px-4 pb-3">
        <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-2xl mx-auto">
          {DISCIPLINES.map(({ id, icon, available }, idx) => (
            <div
              key={id}
              onClick={() => available && handleSelect(id)}
              className={`
                b4e-card cursor-pointer select-none
                transition-all duration-200 animate-slide-up
                flex items-center gap-3 p-3 sm:p-4
                ${available
                  ? 'hover:b4e-card-active hover:scale-[1.01]'
                  : 'opacity-40 cursor-not-allowed'
                }
                ${id === 'trekking' ? 'b4e-card-active' : ''}
              `}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Icon */}
              <div className={`
                text-2xl sm:text-3xl shrink-0 w-10 h-10 sm:w-12 sm:h-12
                flex items-center justify-center rounded-xl
                ${available ? 'bg-glacier/10' : 'bg-bg-elevated'}
              `}>
                {icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-700 text-sm sm:text-base text-text-primary">
                    {t.disciplines[id]}
                  </h3>
                  {!available && (
                    <span className="text-[10px] font-display font-600 px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border shrink-0">
                      {t.comingSoon}
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-text-secondary leading-snug mt-0.5 truncate sm:whitespace-normal">
                  {t.disciplineDesc[id]}
                </p>
              </div>

              {/* Arrow / check */}
              {available ? (
                <div className="w-8 h-8 rounded-full bg-glacier flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7H11M8 4L11 7L8 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 6H8" stroke="#6B7A8D" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 shrink-0 text-center py-2 px-4 border-t border-border">
        <p className="text-[10px] text-text-muted font-body italic">{t.onlyTrekking}</p>
      </footer>
    </main>
  )
}
