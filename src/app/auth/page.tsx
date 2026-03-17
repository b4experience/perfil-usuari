'use client'

import { useState, FormEvent }  from 'react'
import { useRouter }             from 'next/navigation'
import Link                      from 'next/link'
import toast                     from 'react-hot-toast'
import { createClient }          from '@/lib/supabase'
import { useAppStore }           from '@/context/AppContext'
import { useT }                  from '@/lib/i18n'
import LanguageSelector          from '@/components/LanguageSelector'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const router             = useRouter()
  const { locale }         = useAppStore()
  const t                  = useT(locale)
  const supabase           = createClient()

  const [tab,      setTab]      = useState<Tab>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)

  // ─── Social OAuth ──────────────────────────────────────────────────────────
  async function handleSocial(provider: 'google' | 'apple') {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding/consent` },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  // ─── Email login ───────────────────────────────────────────────────────────
  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      router.push('/onboarding/consent')
    }
  }

  // ─── Email register ────────────────────────────────────────────────────────
  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre: name } },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.')
      router.push('/onboarding/consent')
    }
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
      <div className="b4e-card w-full max-w-md p-8 animate-scale-in relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-glacier/10 border border-glacier/30 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 18H4L12 3Z" fill="#5BA3C9" opacity="0.2"/>
              <path d="M12 3L20 18H4L12 3Z" stroke="#5BA3C9" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 9L15 15H9L12 9Z" fill="#5BA3C9" opacity="0.6"/>
            </svg>
          </div>
          <h1 className="font-display font-700 text-2xl text-text-primary">{t.loginTitle}</h1>
          <p className="font-body text-sm text-text-secondary mt-1 text-center max-w-xs">
            {t.loginSub}
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex rounded-lg border border-border bg-bg-elevated p-1 mb-6">
          {(['login', 'register'] as Tab[]).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              className={`
                flex-1 py-2 text-sm font-display font-600 rounded-md transition-all duration-150
                ${tab === t_
                  ? 'bg-glacier text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {t_ === 'login' ? t.login : t.register}
            </button>
          ))}
        </div>

        {/* ── Social buttons ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => handleSocial('google')}
            disabled={loading}
            className="btn-ghost w-full flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H9v3h4.26C12.5 13.34 11 14.5 9 14.5a5.5 5.5 0 1 1 0-11c1.4 0 2.67.53 3.63 1.39L15.06 3.5A8.5 8.5 0 1 0 17.5 9c0-.34-.03-.67-.07-1H16.51z"/>
            </svg>
            {t.continueGoogle}
          </button>
          <button
            onClick={() => handleSocial('apple')}
            disabled={loading}
            className="btn-ghost w-full flex items-center justify-center gap-3"
          >
            <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
              <path d="M13.54 9.11c-.02-2.02 1.65-2.99 1.72-3.04C14.26 4.6 12.8 4.39 12.27 4.37c-1.31-.13-2.57.77-3.24.77-.68 0-1.7-.76-2.81-.73-1.42.02-2.75.83-3.48 2.1C1.17 9.07 2.2 13.53 3.7 15.97c.75 1.21 1.63 2.56 2.78 2.51 1.12-.04 1.54-.71 2.89-.71 1.34 0 1.73.71 2.89.69 1.2-.02 1.97-1.22 2.71-2.44.85-1.39 1.2-2.74 1.22-2.81-.03-.01-2.34-.9-2.36-3.1zM11.44 2.98c.62-.75 1.04-1.8.92-2.84-.9.04-1.98.59-2.62 1.33-.57.66-1.07 1.71-.94 2.72.99.07 2.01-.51 2.64-1.21z"/>
            </svg>
            {t.continueApple}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="divider flex-1" />
          <span className="text-xs text-text-muted font-body">{t.orSeparator}</span>
          <div className="divider flex-1" />
        </div>

        {/* ── Email form ───────────────────────────────────────────────── */}
        <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-body font-500 text-text-secondary mb-1.5">
                {t.nameLabel}
              </label>
              <input
                type="text"
                className="b4e-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marc R."
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-body font-500 text-text-secondary mb-1.5">
              {t.emailLabel} <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className="b4e-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-body font-500 text-text-secondary">
                {t.passwordLabel} <span className="text-danger">*</span>
              </label>
              {tab === 'login' && (
                <button type="button" className="text-xs font-body text-glacier hover:text-glacier-light transition-colors">
                  {t.forgotPassword}
                </button>
              )}
            </div>
            <input
              type="password"
              className="b4e-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? t.loading : (tab === 'login' ? t.login : t.register)}
          </button>
        </form>

        {/* Switch tab */}
        <p className="text-center text-sm font-body text-text-secondary mt-5">
          {tab === 'login' ? t.noAccount : t.hasAccount}{' '}
          <button
            onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
            className="text-glacier hover:text-glacier-light font-500 transition-colors"
          >
            {tab === 'login' ? t.register : t.login}
          </button>
        </p>
      </div>
    </main>
  )
}
