'use client'

import { useState, FormEvent } from 'react'
import { useRouter }            from 'next/navigation'
import Link                     from 'next/link'
import { useAppStore }          from '@/context/AppContext'
import { useT }                 from '@/lib/i18n'
import LanguageSelector         from '@/components/LanguageSelector'

export default function LoginPage() {
  const router               = useRouter()
  const { locale, setUserName } = useAppStore()
  const t                    = useT(locale)

  const [name, setName] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setUserName(name.trim())
    router.push('/activitat')
  }

  return (
    <main className="mountain-bg min-h-screen flex flex-col items-center justify-center px-4 py-12">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 7H3M6 4L3 7L6 10" stroke="#7A92A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-body text-text-secondary group-hover:text-text-primary transition-colors">
            {t.back}
          </span>
        </Link>
        <LanguageSelector />
      </div>

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="b4e-card w-full max-w-sm p-8 animate-scale-in relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-glacier/10 border border-glacier/30 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 18H4L12 3Z" fill="#5BA3C9" opacity="0.2"/>
              <path d="M12 3L20 18H4L12 3Z" stroke="#5BA3C9" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 9L15 15H9L12 9Z" fill="#5BA3C9" opacity="0.6"/>
            </svg>
          </div>
          <h1 className="font-display font-700 text-2xl text-text-primary">
            {locale === 'ca' ? 'Accés ràpid' : locale === 'en' ? 'Quick access' : 'Acceso rápido'}
          </h1>
          <p className="font-body text-sm text-text-secondary mt-1 text-center max-w-xs">
            {locale === 'ca'
              ? 'Mode prova — sense validació de compte'
              : locale === 'en'
              ? 'Test mode — no account validation'
              : 'Modo prueba — sin validación de cuenta'}
          </p>
        </div>

        {/* Test mode badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warn/10 border border-warn/20 mb-6">
          <span className="text-warn text-sm">🧪</span>
          <span className="text-xs font-body text-warn/90">
            {locale === 'ca'
              ? 'Mode proves actiu'
              : locale === 'en'
              ? 'Test mode active'
              : 'Modo pruebas activo'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-body font-500 text-text-secondary mb-1.5">
              {t.nameLabel}{' '}
              <span className="text-text-muted">
                ({locale === 'ca' ? 'opcional' : locale === 'en' ? 'optional' : 'opcional'})
              </span>
            </label>
            <input
              type="text"
              className="b4e-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === 'ca' ? 'Marc R.' : locale === 'en' ? 'Alex R.' : 'Marc R.'}
              autoComplete="name"
              autoFocus
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2 py-3.5">
            {t.continue}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </main>
  )
}
