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
          primary:  '#070C12',
          surface:  '#0E1520',
          elevated: '#162232',
          card:     '#1A293B',
        },
        border: {
          DEFAULT: '#1E2F42',
          light:   '#2A3F56',
        },
        text: {
          primary:   '#E2EAF2',
          secondary: '#7A92A8',
          muted:     '#3E5268',
        },
        glacier: {
          DEFAULT: '#5BA3C9',
          light:   '#82BCE0',
          dark:    '#3A7AA0',
        },
        summit: {
          DEFAULT: '#E07840',
          light:   '#F0956A',
          dark:    '#B85E2E',
        },
        safe:   { DEFAULT: '#3DAA73', light: '#58C98D' },
        danger: { DEFAULT: '#C94040', light: '#E05A5A' },
        warn:   { DEFAULT: '#D4A030', light: '#E8BA50' },
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
