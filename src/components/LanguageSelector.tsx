'use client'

import { useAppStore } from '@/context/AppContext'
import type { Locale } from '@/types'

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'ca', label: 'CA', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
]

export default function LanguageSelector() {
  const { locale, setLocale } = useAppStore()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-bg-surface">
      {LOCALES.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`
            px-2.5 py-1 rounded-md text-xs font-display font-700 tracking-wider
            transition-all duration-150 flex items-center gap-1.5
            ${locale === code
              ? 'bg-glacier text-bg-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }
          `}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
