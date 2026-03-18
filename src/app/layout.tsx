import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import ScrollToTop from '@/components/ScrollToTop'
import './globals.css'

export const metadata: Metadata = {
  title:       'B4Experience — Competencia Decisional en Montaña',
  description: 'Mide tu competencia decisional ante situaciones de riesgo en montaña. Test científico basado en el Drift Diffusion Model.',
  keywords:    ['montaña', 'seguridad', 'trekking', 'alpinismo', 'evaluación cognitiva', 'B4Experience'],
  authors:     [{ name: 'B4Experience' }],
  themeColor:  '#0B6EE8',
  openGraph: {
    type:        'website',
    locale:      'es_ES',
    title:       'B4Experience — Competencia Decisional en Montaña',
    description: 'Conoce tu perfil decisional real antes de salir a la montaña.',
    siteName:    'B4Experience',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <ScrollToTop />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background:  '#FFFFFF',
              color:       '#070D1A',
              border:      '1px solid #DDE4EE',
              boxShadow:   '0 4px 16px rgba(7,13,26,0.10)',
              fontFamily:  "'Plus Jakarta Sans', sans-serif",
              fontSize:    '0.9rem',
            },
          }}
        />
      </body>
    </html>
  )
}
