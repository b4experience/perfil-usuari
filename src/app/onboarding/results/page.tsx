'use client'

import { useEffect, useState } from 'react'
import { useRouter }                    from 'next/navigation'
import { useAppStore }                  from '@/context/AppContext'
import { useT }                         from '@/lib/i18n'
import RadarChart                       from '@/components/RadarChart'
import type { ICDResult, TrialResponse }  from '@/types'

// ─── Mock ICD calculator ───────────────────────────────────────────────────────
// TODO: Replace with real HDDM backend call (Supabase Edge Function or API route)
function computeMockResult(responses: TrialResponse[]): ICDResult {
  if (responses.length === 0) {
    // Demo data if no responses (e.g., direct navigation)
    return {
      icd: 58, levelLabel: 'Intermedio', levelNumeric: 5.8,
      percentile: 62, safetyFactor: 0.87,
      params: { v: 0.62, a: 1.20, z: 0.58, kappa: 0.74, ter: 0.31 },
      diagnosticProfile: 'expert_calibrated',
      disciplineUnlocked: true,
      atypicPatterns: [],
      reliabilityScore: 0.82,
    }
  }
  const yesCount = responses.filter((r) => r.decision === 'yes').length
  const avgRT    = responses.reduce((s, r) => s + r.reactionTimeMs, 0) / responses.length
  const avgConf  = responses
    .filter((r) => r.confidence !== null)
    .reduce((s, r) => s + (r.confidence ?? 3), 0) / responses.filter(r => r.confidence !== null).length

  // Simplified estimation (real: Bayesian HDDM)
  const v     = Math.max(-0.8, Math.min(0.8, (0.5 - yesCount / responses.length) * 2))
  const a     = Math.max(0.6, Math.min(1.8, 2000 / avgRT))
  const z     = Math.max(0.3, Math.min(0.7, yesCount / responses.length))
  const kappa = Math.max(0.1, Math.min(0.95, avgConf / 5))
  const ter   = Math.min(0.5, avgRT / 5000)

  const icdRaw = (Math.abs(v) * 35 + a * 20 + kappa * 25 - Math.abs(z - 0.5) * 10 - ter * 5) * 1.8
  const icd    = Math.max(5, Math.min(98, Math.round(icdRaw)))

  const levelLabel =
    icd < 21 ? 'Novato'        :
    icd < 41 ? 'Principiante'  :
    icd < 61 ? 'Intermedio'    :
    icd < 76 ? 'Avanzado'      :
    icd < 91 ? 'Experto'       : 'Profesional'

  return {
    icd,
    levelLabel,
    levelNumeric: icd / 10,
    percentile:   Math.round(icd * 0.75 + 5),
    safetyFactor: Math.round((0.5 + icd / 100) * 100) / 100,
    params:       { v, a, z, kappa, ter },
    diagnosticProfile: kappa > 0.6 ? 'expert_calibrated' : 'beginner_prudent',
    disciplineUnlocked: true,
    atypicPatterns:     [],
    reliabilityScore:   0.8,
  }
}

// ─── ICD color by range ────────────────────────────────────────────────────────
function icdColor(icd: number) {
  if (icd < 21) return '#F5504D'
  if (icd < 41) return '#D17400'
  if (icd < 61) return '#0B6EE8'
  if (icd < 76) return '#1A9E46'
  if (icd < 91) return '#25B556'
  return '#3B8FF0'
}

// ─── Animated ICD counter ──────────────────────────────────────────────────────
function ICDCounter({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    let current = 0
    const duration = 1400
    const steps    = 60
    const increment = target / steps
    const interval  = duration / steps
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setDisplayed(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [target])
  return <>{displayed}</>
}

// ─── Dimension bar ─────────────────────────────────────────────────────────────
function DimensionBar({
  label,
  sublabel,
  userValue,
  expertValue,
  interpretation,
  icon,
}: {
  label: string
  sublabel: string
  userValue: number    // 0–1
  expertValue: number  // 0–1
  interpretation: string
  icon: string
}) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="b4e-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <div>
            <p className="font-display font-600 text-sm text-text-primary">{label}</p>
            <p className="font-body text-xs text-text-muted">{sublabel}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono font-600 text-base" style={{ color: icdColor(userValue * 100) }}>
            {userValue.toFixed(2)}
          </span>
          <p className="text-xs font-body text-text-muted">/ {expertValue.toFixed(2)} exp.</p>
        </div>
      </div>

      {/* User bar */}
      <div className="progress-bar-track mb-1">
        <div
          className="progress-bar-fill"
          style={{
            width: animated ? `${userValue * 100}%` : '0%',
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {/* Expert reference line */}
      <div className="relative h-1 rounded-full">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-summit/60 rounded-full"
          style={{ left: `${expertValue * 100}%` }}
          title="Referencia experto"
        />
      </div>

      <p className="font-body text-xs text-text-secondary mt-3 leading-relaxed">
        {interpretation}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router                   = useRouter()
  const { locale, testResponses } = useAppStore()
  const t                        = useT(locale)

  const [result,  setResult]  = useState<ICDResult | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const computed = computeMockResult(testResponses)
    setResult(computed)
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!result) return null

  const { icd, levelLabel, levelNumeric, percentile, safetyFactor, params } = result
  const color = icdColor(icd)

  // ─── Advisor message ──────────────────────────────────────────────────────
  const advisorMessages: Record<string, string> = {
    expert_calibrated:    `Tomas buenas decisiones cuando las condiciones son claras. Tu punto fuerte es la prudencia: no te lanzas sin evidencia suficiente. Tu área de mejora es la metacognición: en varios momentos del test estabas muy seguro de decisiones que no eran las más acertadas. En montaña, dudar a tiempo es una habilidad, no una debilidad.`,
    beginner_prudent:     `Eres consciente de tus limitaciones y eso es el activo de seguridad más valioso en montaña. Tu prudencia compensa el conocimiento técnico todavía en desarrollo. Sal con personas más experimentadas y tu perfil mejorará rápido.`,
    expert_arrogant:      `Tienes una excelente capacidad de discriminar el riesgo técnico, pero tus decisiones son demasiado rápidas. En condiciones extremas, la velocidad sin reflexión es peligrosa. Trabaja en añadir una pausa consciente antes de decidir.`,
    beginner_imprudent:   `⚠️ Tu perfil indica que tomas decisiones rápidas en situaciones de riesgo sin suficiente evidencia. Esto es el patrón estadísticamente más relacionado con incidentes graves. Te recomendamos encarecidamente salir solo con guía hasta que el test mejore.`,
    chronic_overestimator:`Tiendes a creer que "a ti no te va a pasar". El test muestra decisiones técnicamente aceptables pero con muy alta confianza incluso en situaciones ambiguas. Busca feedback externo de compañeros más experimentados.`,
  }

  const advisorText = advisorMessages[result.diagnosticProfile] ?? advisorMessages['expert_calibrated']

  // ─── Personalized recommendations ─────────────────────────────────────────
  const recommendations = [
    params.kappa < 0.6 && {
      icon: '🎯',
      text: 'Practica la incertidumbre: antes de salir, predice las condiciones. Compara con lo que encuentras. Entrena la metacognición.',
    },
    params.a < 1.0 && {
      icon: '🧘',
      text: 'Tu prudencia decisional es baja. Añade pausas conscientes de 5 segundos antes de cada decisión importante en montaña.',
    },
    params.z > 0.6 && {
      icon: '⚖️',
      text: 'Sesgo leve al "sí". Cuando dudes, implementa la regla: "Si la respuesta no es un sí claro, es un no."',
    },
    {
      icon: '🔁',
      text: `${t.retakeIn}. Tu perfil se refina con cada actividad.`,
    },
    {
      icon: '👥',
      text: 'Sal con niveles mixtos: combinar con trekkers más expertos acelera la calibración de tu juicio en situaciones ambiguas.',
    },
  ].filter(Boolean) as { icon: string; text: string }[]

  // ─── Radar data ────────────────────────────────────────────────────────────
  const radarData = [
    {
      label:         '⚡ v',
      sublabel:      'Discriminación',
      user:          (params.v + 1) / 2,        // normalize [-1,1] → [0,1]
      expert:        (0.85 + 1) / 2,
    },
    {
      label:         '🧭 a',
      sublabel:      'Prudencia',
      user:          params.a / 2,              // normalize [0,2] → [0,1]
      expert:        1.45 / 2,
    },
    {
      label:         '⚖️ z',
      sublabel:      'Sesgo',
      user:          1 - Math.abs(params.z - 0.5) * 2, // 0.5 = best
      expert:        1 - Math.abs(0.51 - 0.5) * 2,
    },
    {
      label:         '🧠 κ',
      sublabel:      'Metacog.',
      user:          params.kappa,
      expert:        0.92,
    },
  ]

  return (
    <div className={`h-full flex flex-col overflow-hidden transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>

      {/* ── ICD Score — always visible at top ──────────────────────────── */}
      <div className="shrink-0 px-3 sm:px-4 pt-3 pb-2">
        <div className="w-full max-w-lg mx-auto">

          {/* Tiny header */}
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated border border-border">
              <span className="text-xs">⛰️</span>
              <span className="text-xs font-display font-600 text-text-secondary">
                {t.resultsDiscipline} · {new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="font-display font-700 text-sm sm:text-base text-text-primary">{t.resultsTitle}</h1>
          </div>

          {/* Compact ICD score card */}
          <div
            className="b4e-card px-4 py-3 animate-scale-in"
            style={{ borderColor: `${color}40`, boxShadow: `0 0 24px ${color}12` }}
          >
            <div className="flex items-center gap-4">
              {/* Semicircle (smaller on mobile) */}
              <div className="shrink-0">
                <svg viewBox="0 0 160 90" width="140" className="sm:w-[180px]">
                  <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="#DDE4EE" strokeWidth="10" strokeLinecap="round"/>
                  <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke={color} strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={`${icd * 1.885} 188.5`}
                    style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)' }}/>
                  <text x="80" y="66" textAnchor="middle" fill={color} fontFamily="Syne, sans-serif" fontSize="30" fontWeight="800">
                    <ICDCounter target={icd} />
                  </text>
                  <text x="80" y="82" textAnchor="middle" fill="#6B7A8D" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10">/ 100</text>
                </svg>
              </div>

              {/* Score details */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div>
                  <p className="font-display font-800 text-xl sm:text-2xl" style={{ color }}>{levelLabel}</p>
                  <p className="font-body text-xs text-text-secondary">{levelNumeric.toFixed(1)} / 10</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="font-mono font-600 text-base text-text-primary">P{percentile}</p>
                    <p className="font-body text-[10px] text-text-muted">{t.percentileLabel}</p>
                  </div>
                  <div>
                    <p className="font-mono font-600 text-base" style={{ color: safetyFactor >= 1 ? '#1A9E46' : '#D17400' }}>
                      {safetyFactor.toFixed(2)}
                    </p>
                    <p className="font-body text-[10px] text-text-muted">{t.safetyFactorLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 sm:px-4 pb-2">
        <div className="w-full max-w-lg mx-auto space-y-3 pt-1">

        {/* ── Advisor message ─────────────────────────────────────────────── */}
        <div className="b4e-card p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-glacier/10 border border-glacier/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#0B6EE8" strokeWidth="1"/>
                <path d="M7 6v4M7 4.5v.5" stroke="#0B6EE8" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-display font-700 text-sm text-text-secondary uppercase tracking-wider">
              {t.advisorTitle}
            </h3>
          </div>
          <p className="font-body text-sm text-text-secondary leading-relaxed">
            {advisorText}
          </p>
        </div>

        {/* ── Radar chart ─────────────────────────────────────────────────── */}
        <div className="b4e-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="font-display font-700 text-sm text-text-secondary uppercase tracking-wider mb-4 text-center">
            {t.dimensionsTitle}
          </h3>

          <RadarChart data={radarData} size={260} />

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-glacier rounded" />
              <span className="text-xs font-body text-text-secondary">Tu perfil</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-summit/70 rounded" style={{ borderTop: '2px dashed' }} />
              <span className="text-xs font-body text-text-secondary">{t.vsExpert}</span>
            </div>
          </div>
        </div>

        {/* ── 4 Dimension bars ────────────────────────────────────────────── */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <DimensionBar
            icon="⚡"
            label={t.dimensions.v}
            sublabel={t.dimensionVSub}
            userValue={Math.max(0, Math.min(1, (params.v + 1) / 2))}
            expertValue={(0.85 + 1) / 2}
            interpretation={
              params.v > 0.5
                ? 'Excelente detección de red flags. En situaciones ambiguas tu juicio es fiable.'
                : params.v > 0
                ? 'Buena detección de red flags claras. En situaciones ambiguas puedes tardar más.'
                : 'Necesitas desarrollar el vocabulario visual del riesgo en trekking.'
            }
          />
          <DimensionBar
            icon="🧭"
            label={t.dimensions.a}
            sublabel={t.dimensionASub}
            userValue={Math.max(0, Math.min(1, params.a / 2))}
            expertValue={1.45 / 2}
            interpretation={
              params.a > 1.2
                ? 'Estilo muy reflexivo. Decisiones lentas pero bien pensadas.'
                : params.a > 0.9
                ? 'Estilo equilibrado. Atención: tu margen se estrecha en el último tercio de jornada.'
                : 'Tomas decisiones demasiado rápido. En alta montaña, la velocidad sin reflexión es peligrosa.'
            }
          />
          <DimensionBar
            icon="⚖️"
            label={t.dimensions.z}
            sublabel={t.dimensionZSub}
            userValue={Math.max(0, Math.min(1, 1 - Math.abs(params.z - 0.5) * 2))}
            expertValue={1 - Math.abs(0.51 - 0.5) * 2}
            interpretation={
              Math.abs(params.z - 0.5) < 0.1
                ? 'Perfectamente neutro. Sin sesgo hacia continuar ni volver.'
                : params.z > 0.5
                ? `Tendencia leve al 'sí' (z=${params.z.toFixed(2)}). Puedes subestimar riesgos sutiles por querer seguir la ruta.`
                : `Tendencia leve al 'no' (z=${params.z.toFixed(2)}). Prudente por naturaleza.`
            }
          />
          <DimensionBar
            icon="🧠"
            label={t.dimensions.kappa}
            sublabel={t.dimensionKappaSub}
            userValue={params.kappa}
            expertValue={0.92}
            interpretation={
              params.kappa > 0.75
                ? 'Cuando tienes dudas, tu confianza baja. Excelente indicador de seguridad — sigue cultivándolo.'
                : params.kappa > 0.5
                ? 'Calibración aceptable. Sigues bien el hilo de tus propias dudas la mayoría del tiempo.'
                : 'Desconexión entre confianza y acierto. Trabaja en reconocer cuándo realmente no sabes.'
            }
          />
        </div>

        {/* ── Recommendations ────────────────────────────────────────────── */}
        <div className="b4e-card p-5 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <h3 className="font-display font-700 text-sm text-text-secondary uppercase tracking-wider mb-4">
            {t.recommendationsTitle}
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base">{rec.icon}</span>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Unlock disciplines ──────────────────────────────────────────── */}
        {result.disciplineUnlocked && (
          <div
            className="b4e-card p-5 animate-slide-up"
            style={{ animationDelay: '600ms', borderColor: '#1A9E4640' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-safe">✅</span>
              <h3 className="font-display font-700 text-sm text-safe">
                Perfil base Trekking activado
              </h3>
            </div>
            <p className="font-body text-xs text-text-secondary mb-4">
              Ahora puedes añadir disciplinas adicionales. Cada una requiere ~5 min adicionales.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: '🏃', label: 'Trail' },
                { icon: '🧗', label: 'Alpinismo' },
                { icon: '⛷️', label: 'Esquí' },
                { icon: '🪨', label: 'Escalada' },
              ].map((d) => (
                <button
                  key={d.label}
                  className="b4e-card p-3 flex flex-col items-center gap-1 opacity-50 cursor-not-allowed"
                  disabled
                  title={t.comingSoon}
                >
                  <span className="text-xl">{d.icon}</span>
                  <span className="text-xs font-body text-text-muted">{d.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted font-body mt-3 text-center italic">
              {t.comingSoon} · {t.retakeIn}
            </p>
          </div>
        )}

        </div>{/* close max-w-lg */}
      </div>{/* close flex-1 overflow-y-auto */}

      {/* ── Sticky CTA footer ───────────────────────────────────────────── */}
      <div className="shrink-0 px-3 sm:px-4 py-3 border-t border-border bg-bg-primary/95">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-2">
          <button
            className="btn-primary w-full py-3 text-sm"
            onClick={() => router.push('/')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 12H2L8 2Z" fill="currentColor" opacity="0.4"/>
              <path d="M8 2L14 12H2L8 2Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
            Volver al inicio
          </button>

          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1.5 py-2">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 10V12H12V10M7 2V9M4 6L7 9L10 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.downloadPdf}
            </button>
            <button className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1.5 py-2">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="3"  cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.3 6.3L9.7 4M4.3 7.7L9.7 10" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              {t.shareResult}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
