'use client'

import { useRouter }       from 'next/navigation'
import { useAppStore }     from '@/context/AppContext'
import { useT }            from '@/lib/i18n'
import LanguageSelector    from '@/components/LanguageSelector'

export default function IntroPage() {
  const router     = useRouter()
  const { locale } = useAppStore()
  const t          = useT(locale)

  return (
    <main className="mountain-bg h-[100dvh] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-glacier flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 14H2L9 2Z" fill="white" strokeLinejoin="round"/>
              <path d="M9 7L12 12H6L9 7Z" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-display font-800 text-lg sm:text-xl tracking-tight text-text-primary">
            B4<span className="text-gradient">Experience</span>
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 animate-fade-in overflow-hidden">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-glacier/30 bg-glacier/10 mb-3 sm:mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-glacier animate-pulse-slow" />
          <span className="font-body text-xs text-glacier-light tracking-wider uppercase font-500">
            B4E Protocol · DDM v2.1
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-800 text-[1.85rem] sm:text-5xl leading-tight max-w-2xl mb-2 sm:mb-4">
          {t.tagline.split(' ').map((word, i) =>
            ['competencia', 'decisional', 'competence', 'decisional', 'competència', 'decisional'].includes(word.toLowerCase())
              ? <span key={i} className="text-gradient"> {word}</span>
              : ` ${word}`
          )}
        </h1>

        {/* Subtitle */}
        <p className="font-body text-text-secondary text-sm sm:text-base max-w-sm leading-relaxed mb-4 sm:mb-7">
          {t.taglineSub}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-7 sm:gap-10 mb-5 sm:mb-8">
          {[
            { value: '8 min', label: locale === 'ca' ? 'durada' : locale === 'en' ? 'duration' : 'duración' },
            { value: '50',    label: locale === 'ca' ? 'imatges' : locale === 'en' ? 'images'   : 'imágenes'   },
            { value: '5',     label: locale === 'ca' ? 'dimensions' : locale === 'en' ? 'dimensions' : 'dimensiones' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-display font-800 text-xl sm:text-2xl text-glacier">{value}</span>
              <span className="font-body text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/login')}
          className="btn-primary px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg"
        >
          {locale === 'ca' ? 'Comença' : locale === 'en' ? 'Get started' : 'Comenzar'}
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M4 9H14M11 6L14 9L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <p className="mt-3 text-xs text-text-muted font-body">
          {t.onlyTrekking}
        </p>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 shrink-0 text-center py-2 sm:py-3 px-6 border-t border-border">
        <p className="text-xs text-text-muted font-body">
          © 2026 B4Experience · <span className="text-text-muted/60">CONFIDENCIAL</span>
        </p>
      </footer>
    </main>
  )
}
