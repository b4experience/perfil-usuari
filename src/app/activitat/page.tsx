'use client'

import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { useAppStore }         from '@/context/AppContext'
import { useT }                from '@/lib/i18n'
import LanguageSelector        from '@/components/LanguageSelector'
import type { Discipline }     from '@/types'

const DISCIPLINES: {
  id: Discipline
  available: boolean
  gradient: string
  textColor: string
}[] = [
  {
    id: 'trekking',
    available: true,
    gradient: 'from-[#1a5c3a] via-[#2d7d5a] to-[#4a9e7a]',
    textColor: 'text-white',
  },
  {
    id: 'trail_running',
    available: false,
    gradient: 'from-[#7c2d12] via-[#c2410c] to-[#ea580c]',
    textColor: 'text-white',
  },
  {
    id: 'alpinismo',
    available: false,
    gradient: 'from-[#1e3a5f] via-[#1d4ed8] to-[#60a5fa]',
    textColor: 'text-white',
  },
  {
    id: 'esqui_montana',
    available: false,
    gradient: 'from-[#0c4a6e] via-[#0284c7] to-[#bae6fd]',
    textColor: 'text-white',
  },
  {
    id: 'escalada',
    available: false,
    gradient: 'from-[#451a03] via-[#92400e] to-[#d97706]',
    textColor: 'text-white',
  },
]

export default function ActivitatPage() {
  const router                          = useRouter()
  const { locale, userName, setDiscipline } = useAppStore()
  const t                               = useT(locale)

  function handleSelect(discipline: Discipline) {
    setDiscipline(discipline)
    router.push('/onboarding/sliders')
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
      <div className="relative z-10 shrink-0 text-center px-4 pt-3 pb-2 animate-fade-in">
        {userName && (
          <p className="font-body text-xs text-text-muted mb-0.5">
            {locale === 'ca' ? `Hola, ${userName}!` : locale === 'en' ? `Hi, ${userName}!` : `Hola, ${userName}!`}
          </p>
        )}
        <h1 className="font-display font-800 text-xl sm:text-2xl text-text-primary mb-0.5">
          {t.chooseActivity}
        </h1>
        <p className="font-body text-text-secondary text-xs max-w-sm mx-auto">
          {t.chooseActivitySub}
        </p>
      </div>

      {/* ── Discipline grid ─────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-3 sm:px-4 pb-3 pt-1">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl mx-auto">

          {/* Trekking — full width, available */}
          {DISCIPLINES.filter(d => d.available).map(({ id, gradient, textColor }, idx) => (
            <div
              key={id}
              onClick={() => handleSelect(id)}
              className="col-span-2 relative rounded-2xl overflow-hidden cursor-pointer select-none
                transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{ aspectRatio: '16/7', animationDelay: `${idx * 60}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              {/* Mountain silhouette */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 200 L0 120 L80 60 L150 90 L250 20 L330 55 L420 10 L500 45 L570 30 L600 40 L600 200 Z" fill="white"/>
                <path d="M0 200 L0 150 L100 120 L200 135 L300 100 L380 115 L460 90 L560 110 L600 100 L600 200 Z" fill="white" opacity="0.5"/>
              </svg>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className={`font-display font-800 text-2xl sm:text-3xl ${textColor} drop-shadow`}>
                  {t.disciplines[id]}
                </h3>
                <p className="text-white/80 text-xs font-body mt-0.5">{t.disciplineDesc[id]}</p>
              </div>
              {/* Arrow */}
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7H11M8 4L11 7L8 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}

          {/* Coming soon — 2-col grid */}
          {DISCIPLINES.filter(d => !d.available).map(({ id, gradient }, idx) => (
            <div
              key={id}
              className="relative rounded-2xl overflow-hidden select-none opacity-60"
              style={{ aspectRatio: '4/3', animationDelay: `${(idx + 1) * 60}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 225" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 225 L0 130 L50 75 L100 100 L150 30 L200 65 L250 20 L300 45 L300 225 Z" fill="white"/>
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-display font-800 text-base text-white drop-shadow">
                  {t.disciplines[id]}
                </h3>
              </div>
              {/* Coming soon badge */}
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/20">
                <span className="text-[10px] font-display font-600 text-white/80">{t.comingSoon}</span>
              </div>
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
