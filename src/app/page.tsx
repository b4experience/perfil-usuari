'use client'

import { useRouter }       from 'next/navigation'
import { useAppStore }     from '@/context/AppContext'
import { useT }            from '@/lib/i18n'
import LanguageSelector    from '@/components/LanguageSelector'

export default function IntroPage() {
  const router  = useRouter()
  const { locale } = useAppStore()
  const t       = useT(locale)

  return (
    <main className="mountain-bg min-h-screen flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-glacier flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 14H2L9 2Z" fill="#070C12" strokeLinejoin="round"/>
              <path d="M9 7L12 12H6L9 7Z" fill="#070C12" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-display font-800 text-xl tracking-tight text-text-primary">
            B4<span className="text-gradient">Experience</span>
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 flex-1 animate-fade-in">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glacier/30 bg-glacier/10 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-glacier animate-pulse-slow" />
          <span className="font-body text-xs text-glacier-light tracking-wider uppercase font-500">
            B4E Protocol · DDM v2.1
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-800 text-5xl sm:text-6xl leading-tight max-w-2xl mb-6">
          {t.tagline.split(' ').map((word, i) =>
            ['competencia', 'decisional', 'competence', 'decisional', 'competència', 'decisional'].includes(word.toLowerCase())
              ? <span key={i} className="text-gradient"> {word}</span>
              : ` ${word}`
          )}
        </h1>

        {/* Subtitle */}
        <p className="font-body text-text-secondary text-lg max-w-md leading-relaxed mb-12">
          {t.taglineSub}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-8 mb-12">
          {[
            { value: '8 min', label: locale === 'ca' ? 'durada' : locale === 'en' ? 'duration' : 'duración' },
            { value: '50', label: locale === 'ca' ? 'imatges' : locale === 'en' ? 'images' : 'imágenes' },
            { value: '5', label: locale === 'ca' ? 'dimensions' : locale === 'en' ? 'dimensions' : 'dimensiones' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-display font-800 text-2xl text-glacier">{value}</span>
              <span className="font-body text-xs text-text-muted uppercase tracking-wider mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/login')}
          className="btn-primary px-10 py-4 text-lg"
        >
          {locale === 'ca' ? 'Comença' : locale === 'en' ? 'Get started' : 'Comenzar'}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9H14M11 6L14 9L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <p className="mt-4 text-xs text-text-muted font-body">
          {t.onlyTrekking}
        </p>
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
