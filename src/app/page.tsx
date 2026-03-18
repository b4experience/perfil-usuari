'use client'

import { useRouter }    from 'next/navigation'
import { motion }       from 'framer-motion'
import { useAppStore }  from '@/context/AppContext'
import { useT }         from '@/lib/i18n'
import { Button }       from '@/components/ui/button'
import LanguageSelector from '@/components/LanguageSelector'

export default function IntroPage() {
  const router     = useRouter()
  const { locale } = useAppStore()
  const t          = useT(locale)

  return (
    <main className="mountain-bg h-[100dvh] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950 shadow-md">
        <div className="flex items-center gap-2.5">
          <img src="/WhiteLogo.png" alt="B4Experience" className="h-8 w-8 object-contain" />
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white">
            B4Experience
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 overflow-hidden">

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="font-display font-800 text-[1.85rem] sm:text-5xl leading-tight max-w-2xl mb-2 sm:mb-4"
        >
          {t.tagline.split(' ').map((word, i) =>
            ['competencia', 'decisional', 'competence', 'decisional', 'competència', 'decisional'].includes(word.toLowerCase())
              ? <span key={i} className="text-gradient"> {word}</span>
              : ` ${word}`
          )}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="font-body text-text-secondary text-sm sm:text-base max-w-sm leading-relaxed mb-4 sm:mb-7"
        >
          {t.taglineSub}
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center gap-7 sm:gap-10 mb-5 sm:mb-8"
        >
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
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.28, ease: [0.23, 1, 0.32, 1] }}
        >
          <Button
            size="lg"
            onClick={() => router.push('/login')}
            className="px-8 sm:px-10 font-display font-semibold text-base sm:text-lg"
          >
            {locale === 'ca' ? 'Comença' : locale === 'en' ? 'Get started' : 'Comenzar'}
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M4 9H14M11 6L14 9L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </motion.div>

      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="shrink-0 text-center py-2 sm:py-3 px-6 border-t border-border">
        <p className="text-xs text-text-muted font-body">
          © {new Date().getFullYear()} B4Experience. {t.copyright}
        </p>
      </footer>
    </main>
  )
}
