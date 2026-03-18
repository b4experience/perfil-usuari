import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        /* ── shadcn/ui tokens (same CSS vars as B4E website) ──────────── */
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-fg))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-fg))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-fg))',
        },
        accent: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(0 84.2% 60.2%)',
          foreground: 'hsl(0 0% 98%)',
        },
        input:  'hsl(var(--border-hsl))',
        ring:   'hsl(var(--primary))',

        /* ── App semantic aliases ──────────────────────────────────────── */
        bg: {
          primary:  '#FFFFFF',
          surface:  'hsl(210 40% 96.1%)',
          elevated: 'hsl(214.3 31.8% 96%)',
          card:     '#FFFFFF',
        },
        border: {
          DEFAULT: 'hsl(214.3 31.8% 91.4%)',
          light:   'hsl(214.3 31.8% 84%)',
        },
        text: {
          primary:   'hsl(222.2 84% 4.9%)',
          secondary: 'hsl(222.2 47.4% 20%)',
          muted:     'hsl(215.4 16.3% 46.9%)',
        },
        glacier: {
          DEFAULT: 'hsl(217.2 91.2% 45%)',
          light:   'hsl(217.2 70% 55%)',
          dark:    'hsl(217.2 91.2% 35%)',
        },
        summit: {
          DEFAULT: '#E07840',
          light:   '#F0956A',
          dark:    '#B85E2E',
        },
        safe:   { DEFAULT: '#1A9E46', light: '#25B556' },
        danger: { DEFAULT: '#F5504D', light: '#F77574' },
        warn:   { DEFAULT: '#D17400', light: '#E8920D' },
      },
      borderRadius: {
        lg:      'var(--radius, 0.5rem)',
        md:      'calc(var(--radius, 0.5rem) - 2px)',
        sm:      'calc(var(--radius, 0.5rem) - 4px)',
        section: '32px',
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
        'hover':    '0 10px 40px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.06)',
        'xl-brand': '0 20px 60px rgba(15,23,42,0.08)',
        'blue':     '0 8px 32px rgba(15,108,189,0.18)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.23,1,0.32,1) forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
        'scale-in':   'scaleIn 0.25s cubic-bezier(0.23,1,0.32,1) forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}

export default config
