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
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: {
          primary:  '#F0F6FF',
          surface:  '#F7FAFF',
          elevated: '#EBF2FB',
          card:     '#FFFFFF',
        },
        border: {
          DEFAULT: '#DDE4EE',
          light:   '#C8D5E8',
        },
        text: {
          primary:   '#070D1A',
          secondary: '#2C3E5A',
          muted:     '#6B7A8D',
        },
        glacier: {
          DEFAULT: '#0B6EE8',
          light:   '#3B8FF0',
          dark:    '#0855C4',
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
      animation: {
        'fade-in':       'fadeIn 0.5s ease forwards',
        'slide-up':      'slideUp 0.4s ease forwards',
        'slide-down':    'slideDown 0.3s ease forwards',
        'scale-in':      'scaleIn 0.3s ease forwards',
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'count-up':      'countUp 0.1s ease',
        'flash':         'flash 0.15s ease',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                   to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        flash:     { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
      aspectRatio: {
        '5/4': '5 / 4',
      },
    },
  },
  plugins: [],
}

export default config
