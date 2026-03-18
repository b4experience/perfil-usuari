'use client'

import { useState, FormEvent } from 'react'
import { useRouter }            from 'next/navigation'
import Link                     from 'next/link'
import { motion }               from 'framer-motion'
import { useAppStore }          from '@/context/AppContext'
import { useT }                 from '@/lib/i18n'
import { Input }                from '@/components/ui/input'
import LanguageSelector         from '@/components/LanguageSelector'
import { cn }                   from '@/lib/utils'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router                  = useRouter()
  const { locale, setUserName } = useAppStore()
  const t                       = useT(locale)

  const [mode,        setMode]        = useState<Mode>('signin')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [name,        setName]        = useState('')
  const [showPass,    setShowPass]    = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setUserName(name.trim() || email.split('@')[0])
    router.push('/activitat')
  }

  function handleSocial(provider: string) {
    // TODO: Supabase OAuth — supabase.auth.signInWithOAuth({ provider })
    setUserName(provider + ' user')
    router.push('/activitat')
  }

  return (
    <main className="mountain-bg h-[100dvh] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950 shadow-md">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/WhiteLogo.png" alt="B4Experience" className="h-8 w-8 object-contain" />
          <span className="font-display font-bold text-base tracking-tight text-white group-hover:text-white/80 transition-colors">
            B4Experience
          </span>
        </Link>
        <LanguageSelector />
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto py-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-sm"
        >

          {/* Card */}
          <div className="bg-white rounded-2xl border border-border shadow-lg px-6 py-8">

            {/* Logo + title */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center mb-3">
                <img src="/WhiteLogo.png" alt="B4Experience" className="h-7 w-7 object-contain" />
              </div>
              <p className="text-sm text-muted-foreground">
                {mode === 'signin' ? t.loginSub : t.loginSub}
              </p>
            </div>

            {/* Sign In / Sign Up toggle */}
            <div className="flex rounded-xl bg-muted p-1 mb-6">
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-150',
                    mode === m
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m === 'signin' ? t.login : t.register}
                </button>
              ))}
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
              {mode === 'signup' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-foreground">{t.nameLabel}</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marc R."
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">{t.emailLabel}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">{t.passwordLabel}</label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4Z" stroke="currentColor" strokeWidth="1.3"/>
                        <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.1 4.2C2.9 5.1 2 6.5 2 8s2.5 4 6 4c1.2 0 2.3-.3 3.2-.8M7 4.1C7.3 4 7.7 4 8 4c3.5 0 6 4 6 4s-.6 1-1.7 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                {mode === 'signin' && (
                  <button type="button" className="text-xs text-primary hover:underline self-start mt-0.5">
                    {t.forgotPassword}
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-1 py-2.5 rounded-xl bg-slate-950 text-white font-display font-semibold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                {mode === 'signin' ? t.login : t.register}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{t.orSeparator}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social buttons */}
            <div className="flex flex-col gap-2">
              <SocialButton onClick={() => handleSocial('google')} label={t.continueGoogle}>
                <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
              </SocialButton>

              <SocialButton onClick={() => handleSocial('apple')} label={t.continueApple}>
                <svg width="15" height="16" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-147.6-110c-44.5-71.6-88.3-184.7-88.3-292s33.2-248 95.4-315.1c49.7-53.7 117.7-86.7 189.8-86.7 62.7 0 107.4 41 166.5 41 57.3 0 93.5-41 179.4-41 65.3 0 125.4 28.6 168.7 74.8zm-318.7-131.9c21.8-28.4 37.7-67.6 37.7-106.8 0-5.5-.5-11.1-1.6-15.5-35.4 1.3-78.3 23.7-103.6 55.3-19.9 24.4-38.9 63.1-38.9 103 0 6.1.9 12.2 1.4 14.1 2.3.4 6 .8 9.7.8 31.8 0 71.8-21.2 95.3-50.9z"/>
                </svg>
              </SocialButton>

              <SocialButton onClick={() => handleSocial('facebook')} label={locale === 'fr' ? 'Continuer avec Facebook' : locale === 'en' ? 'Continue with Facebook' : 'Continuar con Facebook'}>
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                </svg>
              </SocialButton>
            </div>

          </div>
        </motion.div>
      </div>
    </main>
  )
}

function SocialButton({ onClick, label, children }: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm font-body text-foreground hover:bg-border/60 active:scale-[0.98] transition-all"
    >
      <span className="w-5 flex items-center justify-center shrink-0">{children}</span>
      <span>{label}</span>
    </button>
  )
}
