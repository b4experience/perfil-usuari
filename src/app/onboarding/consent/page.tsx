'use client'

import { useState, FormEvent } from 'react'
import { useRouter }            from 'next/navigation'
import { useAppStore }          from '@/context/AppContext'
import { useT }                 from '@/lib/i18n'
import type { UserConsent }     from '@/types'

export default function ConsentPage() {
  const router   = useRouter()
  const { locale, setConsent } = useAppStore()
  const t        = useT(locale)

  const [rgpd,        setRgpd]        = useState(false)
  const [disclaimer,  setDisclaimer]  = useState(false)
  const [emName,      setEmName]      = useState('')
  const [emPhone,     setEmPhone]     = useState('')
  const [age,         setAge]         = useState('')
  const [country,     setCountry]     = useState('')

  const canProceed = rgpd && disclaimer && emName.trim() && emPhone.trim()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canProceed) return
    const consent: UserConsent = {
      rgpd:          true,
      disclaimer:    true,
      emergencyName: emName.trim(),
      emergencyPhone:emPhone.trim(),
      age:           age   || undefined,
      country:       country || undefined,
    }
    setConsent(consent)
    router.push('/onboarding/sliders')
  }

  return (
    <div className="flex flex-col items-center px-4 py-10 animate-fade-in">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warn/10 border border-warn/30 mb-4">
            <span className="text-warn text-xs">⚠️</span>
            <span className="text-xs font-display font-600 text-warn tracking-wide">Paso 1 de 3</span>
          </div>
          <h1 className="font-display font-800 text-3xl text-text-primary mb-2">
            {t.consentTitle}
          </h1>
          <p className="font-body text-text-secondary text-sm">
            {t.consentSub}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Consent checkboxes ───────────────────────────────────── */}
          <div className="b4e-card p-5 flex flex-col gap-4">
            <h2 className="font-display font-700 text-sm uppercase tracking-widest text-text-secondary">
              RGPD & Disclaimer
            </h2>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="b4e-checkbox mt-0.5"
                checked={rgpd}
                onChange={(e) => setRgpd(e.target.checked)}
                required
              />
              <span className="font-body text-sm text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors">
                {t.rgpdLabel}
                {' '}<span className="text-danger text-xs">*</span>
              </span>
            </label>

            <div className="divider" />

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="b4e-checkbox mt-0.5"
                checked={disclaimer}
                onChange={(e) => setDisclaimer(e.target.checked)}
                required
              />
              <span className="font-body text-sm text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors">
                {t.disclaimerLabel}
                {' '}<span className="text-danger text-xs">*</span>
              </span>
            </label>
          </div>

          {/* ── Emergency contact ────────────────────────────────────── */}
          <div className="b4e-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🚨</span>
              <h2 className="font-display font-700 text-sm uppercase tracking-widest text-text-secondary">
                {t.emergencyTitle}
              </h2>
            </div>
            <p className="font-body text-xs text-text-muted mb-4 ml-7">
              {t.emergencySub}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-body font-500 text-text-secondary mb-1.5">
                  {t.emergencyName} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="b4e-input"
                  value={emName}
                  onChange={(e) => setEmName(e.target.value)}
                  placeholder="Anna García"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-xs font-body font-500 text-text-secondary mb-1.5">
                  {t.emergencyPhone} <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="b4e-input"
                  value={emPhone}
                  onChange={(e) => setEmPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* SOS warning */}
            {(!emName || !emPhone) && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
                <span className="text-danger text-xs">🔴</span>
                <span className="text-xs font-body text-danger/90">{t.sosWarning}</span>
              </div>
            )}

            {(emName && emPhone) && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-safe/10 border border-safe/20">
                <span className="text-safe text-xs">✅</span>
                <span className="text-xs font-body text-safe/90">SOS activo</span>
              </div>
            )}
          </div>

          {/* ── Optional personal data ───────────────────────────────── */}
          <details className="b4e-card overflow-hidden">
            <summary className="p-5 cursor-pointer font-display font-600 text-sm text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors list-none flex items-center justify-between">
              <span>{t.personalData}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform">
                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </summary>
            <div className="px-5 pb-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-body font-500 text-text-secondary mb-1.5">
                    {t.ageLabel}
                  </label>
                  <input
                    type="number"
                    className="b4e-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="34"
                    min={16}
                    max={99}
                  />
                </div>
                <div>
                  <label className="block text-xs font-body font-500 text-text-secondary mb-1.5">
                    {t.countryLabel}
                  </label>
                  <input
                    type="text"
                    className="b4e-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="España"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* ── Submit ───────────────────────────────────────────────── */}
          <button
            type="submit"
            className="btn-primary w-full py-4 text-base"
            disabled={!canProceed}
          >
            {t.continue}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {!canProceed && (
            <p className="text-center text-xs text-text-muted font-body -mt-2">
              Completa los campos obligatorios para continuar
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
