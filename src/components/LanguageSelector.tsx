'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/context/AppContext'
import type { Locale } from '@/types'

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

export default function LanguageSelector() {
  const { locale, setLocale } = useAppStore()
  const [open, setOpen]       = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]
  const others  = LOCALES.filter((l) => l.code !== locale)

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Current language button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
      >
        <span className="text-lg leading-none">{current.flag}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`text-white/70 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50 min-w-[140px]">
          {others.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => { setLocale(code); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-body text-text-primary hover:bg-muted transition-colors"
            >
              <span className="text-lg leading-none">{flag}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
