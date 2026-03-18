'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { useRouter }             from 'next/navigation'
import { useAppStore }           from '@/context/AppContext'
import { useT }                  from '@/lib/i18n'
import { Button }                from '@/components/ui/button'
import type { Trial, TrialResponse, Decision, Confidence } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_TRIALS     = 50
const FIXATION_MS      = 200   // spec §4.1: 200ms fixed transition
const CONFIDENCE_MS    = 3000
const ITI_MS           = 300
const CONFIDENCE_DELAY = 200

// ─── Test phase state machine ─────────────────────────────────────────────────
type Phase =
  | 'intro'          // instruction screen
  | 'fixation'       // dot
  | 'stimulus'       // image + yes/no
  | 'confidence'     // 1–5 confidence rating
  | 'iti'            // inter-trial interval
  | 'calculating'    // calculating results
  | 'done'           // redirect

// ─── Confidence color map ─────────────────────────────────────────────────────
const CONFIDENCE_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'rgba(245,80,77,0.10)',   border: '#F5504D', text: '#F5504D' },
  2: { bg: 'rgba(209,116,0,0.10)',   border: '#D17400', text: '#D17400' },
  3: { bg: 'rgba(107,122,141,0.10)', border: '#6B7A8D', text: '#6B7A8D' },
  4: { bg: 'rgba(11,110,232,0.10)',  border: '#0F6CBD', text: '#0F6CBD' },
  5: { bg: 'rgba(26,158,70,0.10)',   border: '#1A9E46', text: '#1A9E46' },
}

// ─── Mock trial loader (replace with Supabase fetch in production) ────────────
function buildMockTrials(): Trial[] {
  // In production: fetch from Supabase `trials` table ordered by block/sequence
  const placeholders = [
    '/placeholder-trekking-low.jpg',
    '/placeholder-trekking-medium.jpg',
    '/placeholder-trekking-high.jpg',
    '/placeholder-distractor.jpg',
  ]
  const risks = ['low', 'low', 'medium', 'medium', 'high', 'high', 'distractor', 'distractor'] as const
  return Array.from({ length: TOTAL_TRIALS }, (_, i) => ({
    id:         `trial_${String(i + 1).padStart(3, '0')}`,
    imageUrl:   placeholders[i % placeholders.length],
    riskLevel:  risks[i % risks.length],
    block:      (Math.floor(i / 10) + 1) as Trial['block'],
  }))
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TestPage() {
  const router                         = useRouter()
  const { locale, addResponse, clearResponses } = useAppStore()
  const t                              = useT(locale)

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,         setPhase]       = useState<Phase>('intro')
  const [trials,        setTrials]      = useState<Trial[]>([])
  const [trialIndex,    setTrialIndex]  = useState(0)
  const [, setResponses]   = useState<TrialResponse[]>([])

  // Per-trial transient state
  const tStartRef   = useRef<number>(0)               // performance.now() at image visible — spec §4.2
  const [lastDecision,  setLastDecision]  = useState<Decision | null>(null)
  const [confBarKey,    setConfBarKey]    = useState(0)
  const [milestone,     setMilestone]     = useState<number | null>(null)  // "Llevas X/50 ✓" §6.1

  // Refs for timers
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTrial = trials[trialIndex]
  const progress     = TOTAL_TRIALS > 0 ? (trialIndex / TOTAL_TRIALS) * 100 : 0

  // ── Load trials ────────────────────────────────────────────────────────────
  useEffect(() => {
    clearResponses()
    // TODO: replace with real Supabase fetch:
    //   const { data } = await supabase.from('trials').select('*').eq('discipline','trekking').order('sequence')
    setTrials(buildMockTrials())
  }, [])

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // ── Phase: FIXATION → STIMULUS ─────────────────────────────────────────────
  const startFixation = useCallback(() => {
    setPhase('fixation')
    setLastDecision(null)
    timerRef.current = setTimeout(() => {
      tStartRef.current = performance.now()  // spec §4.2: performance.now() after render
      setPhase('stimulus')
    }, FIXATION_MS)
  }, [])

  // ── Handle decision (YES / NO) ─────────────────────────────────────────────
  const handleDecision = useCallback((decision: Decision) => {
    if (phase !== 'stimulus') return
    const t_end = performance.now()                          // spec §4.2: first instruction
    const rt = Math.round(t_end - tStartRef.current)        // spec §4.2: RT_ms
    setLastDecision(decision)

    // Record partial response (confidence will be added after)
    const partial: TrialResponse = {
      trialIndex,
      imageId:        currentTrial?.id ?? '',
      decision,
      reactionTimeMs: rt,
      confidence:     null,
      timestampEpoch: Date.now(),
    }
    setResponses((prev) => [...prev, partial])

    // Transition to confidence phase after short delay
    timerRef.current = setTimeout(() => {
      setConfBarKey((k) => k + 1)
      setPhase('confidence')

      // Auto-advance after CONFIDENCE_MS
      timerRef.current = setTimeout(() => commitConfidence(null), CONFIDENCE_MS)
    }, CONFIDENCE_DELAY)
  }, [phase, trialIndex, currentTrial])

  // ── Commit confidence and advance to next trial ────────────────────────────
  const commitConfidence = useCallback((conf: Confidence | null) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    // Update last response with confidence
    setResponses((prev) => {
      const updated = [...prev]
      const last    = { ...updated[updated.length - 1], confidence: conf }
      updated[updated.length - 1] = last
      addResponse(last) // persist to zustand store
      return updated
    })

    setPhase('iti')

    // Show milestone every 10 trials — spec §6.1 step 4
    const next = trialIndex + 1
    if (next > 0 && next % 10 === 0 && next < TOTAL_TRIALS) {
      setMilestone(next)
      setTimeout(() => setMilestone(null), 2000)
    }

    timerRef.current = setTimeout(() => {
      if (next >= TOTAL_TRIALS) {
        // All trials done → calculating
        setPhase('calculating')
        setTimeout(() => router.push('/onboarding/results'), 2800)
      } else {
        setTrialIndex(next)
        startFixation()
      }
    }, ITI_MS)
  }, [trialIndex, addResponse, router, startFixation])

  // ── Keyboard shortcuts (space = yes, backspace = no, 1-5 = confidence) ─────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase === 'stimulus') {
        if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); handleDecision('yes') }
        if (e.code === 'Backspace' || e.code === 'ArrowLeft') { e.preventDefault(); handleDecision('no') }
      }
      if (phase === 'confidence') {
        const n = parseInt(e.key)
        if (n >= 1 && n <= 5) commitConfidence(n as Confidence)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleDecision, commitConfidence])

  // ─────────────────────────────────────────────────────────────────────────────
  // ── RENDER ───────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  // ── INTRO SCREEN ─────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-glacier/10 border border-glacier/20 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 22 L4 14 L9 8 L14 11 L20 4 L24 7 L24 22 Z" fill="#0F6CBD" opacity="0.2"/>
            <path d="M4 22 L9 8 L14 11 L20 4 L24 7" stroke="#0F6CBD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Title */}
        <h1 className="font-display font-800 text-2xl text-text-primary mb-8">
          {t.testIntroTitle}
        </h1>

        {/* Three key points */}
        <div className="flex flex-col gap-5 w-full max-w-xs mb-10 text-left">
          <div>
            <p className="font-display font-700 text-base text-text-primary mb-0.5">🏔️ 50 situaciones reales.</p>
            <p className="font-body text-sm text-text-muted">Imágenes con distintas condiciones en montaña</p>
          </div>
          <div>
            <p className="font-display font-700 text-base text-text-primary mb-0.5">⚡ Confía en tu instinto.</p>
            <p className="font-body text-sm text-text-muted">Decide como lo harías en la montaña.</p>
          </div>
          <div>
            <p className="font-display font-700 text-base text-text-primary mb-0.5">🎯 Valora tu confianza.</p>
            <p className="font-body text-sm text-text-muted">Después de cada decisión puntúa del 1 al 5 cómo de seguro/a estás.</p>
          </div>
        </div>

        <Button className="w-full max-w-xs font-display font-semibold" onClick={startFixation}>
          {t.startNow}
        </Button>

      </div>
    )
  }

  // ── CALCULATING SCREEN ────────────────────────────────────────────────────────
  if (phase === 'calculating') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4 animate-fade-in">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#DDE4EE" strokeWidth="4"/>
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="#0F6CBD" strokeWidth="4"
                strokeDasharray="213.6"
                strokeDashoffset="53.4"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 40 40"
                  to="360 40 40"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
          </div>

          <h2 className="font-display font-700 text-2xl text-text-primary mb-2">{t.calculating}</h2>
          <p className="font-body text-sm text-text-secondary max-w-xs">{t.calculatingSub}</p>

          {/* Fake progress steps */}
          <div className="mt-8 space-y-2 text-left max-w-xs mx-auto">
            {[
              'Analizando tiempos de reacción...',
              'Estimando parámetro v (drift rate)...',
              'Calibrando prudencia decisional (a)...',
              'Calculando metacognición (κ)...',
              'Generando informe personalizado...',
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 animate-fade-in"
                style={{ animationDelay: `${i * 400}ms`, opacity: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#1A9E46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-body text-text-secondary">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── TEST SCREENS (fixation / stimulus / confidence / iti) ─────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden px-3 sm:px-4">
      <div className="w-full max-w-lg mx-auto flex flex-col h-full">

        {/* ── Progress header — shrink-0 ────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between pt-2 pb-1">
          <span className="font-mono text-xs text-text-muted">
            {trialIndex + 1} {t.trialOf} {TOTAL_TRIALS}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((b) => {
              const blockStart = [0, 8, 20, 38, 46][b - 1]
              const blockEnd   = [8, 20, 38, 46, 50][b - 1]
              const active     = trialIndex >= blockStart && trialIndex < blockEnd
              const done       = trialIndex >= blockEnd
              return (
                <div key={b} className={`h-1 rounded-full transition-all duration-300 ${
                  done   ? 'bg-glacier w-4' :
                  active ? 'bg-glacier/60 w-6' :
                           'bg-border w-2'
                }`} />
              )
            })}
          </div>
          <span className="font-mono text-xs text-glacier">{Math.round(progress)}%</span>
        </div>

        {/* Progress bar — shrink-0 */}
        <div className="shrink-0 progress-bar-track mb-1">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Milestone banner — shrink-0, spec §6.1 step 4 */}
        {milestone !== null && (
          <div className="shrink-0 animate-fade-in text-center py-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-glacier/10 border border-glacier/30 font-display font-600 text-xs text-glacier">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0F6CBD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Llevas {milestone}/50 ✓
            </span>
          </div>
        )}

        {/* ── Image area — flex-1 ───────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center min-h-0">

          {/* FIXATION DOT */}
          {phase === 'fixation' && (
            <div
              className="flex items-center justify-center bg-bg-elevated border border-border rounded-2xl animate-fade-in"
              style={{ aspectRatio: '4/5', width: '100%', maxHeight: '100%' }}
            >
              <div className="w-3 h-3 rounded-full bg-text-muted animate-pulse-slow" />
            </div>
          )}

          {/* STIMULUS IMAGE */}
          {(phase === 'stimulus' || phase === 'confidence') && currentTrial && (
            <div
              className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-150 ${
                phase === 'confidence'
                  ? lastDecision === 'yes' ? 'border-safe' : 'border-danger'
                  : 'border-transparent'
              }`}
              style={{ aspectRatio: '4/5', width: '100%', maxHeight: '100%' }}
            >
              {/* spec §5.1: fade to 30% opacity during confidence */}
              <div className={`w-full h-full bg-gradient-to-br from-bg-elevated to-bg-surface flex items-center justify-center transition-opacity duration-150 ${phase === 'confidence' ? 'opacity-30' : 'opacity-100'}`}>
                <svg viewBox="0 0 320 400" className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D6E8FF"/>
                      <stop offset="100%" stopColor="#EBF2FB"/>
                    </linearGradient>
                  </defs>
                  <rect width="320" height="400" fill="url(#sky)"/>
                  <path d="M0 400 L0 260 L50 190 L100 220 L160 110 L210 145 L260 80 L300 110 L320 95 L320 400 Z" fill="#C8D5E8"/>
                  <path d="M0 400 L0 310 L70 270 L130 285 L190 245 L240 258 L290 235 L320 248 L320 400 Z" fill="#DDE4EE"/>
                  <text x="160" y="195" textAnchor="middle" fill="#6B7A8D" fontSize="11" fontFamily="Plus Jakarta Sans">{currentTrial.id}</text>
                  <text x="160" y="212" textAnchor="middle" fill="#6B7A8D" fontSize="10" fontFamily="JetBrains Mono">[{currentTrial.riskLevel.toUpperCase()}]</text>
                </svg>
                {phase === 'confidence' && (
                  <div className={`absolute inset-0 pointer-events-none ${lastDecision === 'yes' ? 'bg-safe/10' : 'bg-danger/10'} animate-fade-in`} />
                )}
              </div>

              {/* Gradient overlay — bottom half to black */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

              {/* Decision badge (confidence phase) */}
              {phase === 'confidence' && lastDecision && (
                <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full font-display font-700 text-xs uppercase tracking-wider animate-scale-in ${lastDecision === 'yes' ? 'bg-safe text-white' : 'bg-danger text-white'}`}>
                  {lastDecision === 'yes' ? '✓ SÍ' : '✕ NO'}
                </div>
              )}

              {/* Round YES / NO buttons — stimulus phase only */}
              {phase === 'stimulus' && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-14 animate-slide-up">
                  <button
                    onClick={() => handleDecision('no')}
                    className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border-2 border-danger flex items-center justify-center transition-transform active:scale-90 touch-action-manipulation"
                  >
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M7 7L19 19M19 7L7 19" stroke="#F5504D" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDecision('yes')}
                    className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border-2 border-safe flex items-center justify-center transition-transform active:scale-90 touch-action-manipulation"
                  >
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M5 13L10.5 18.5L21 8" stroke="#1A9E46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ITI blank */}
          {phase === 'iti' && (
            <div
              className="rounded-2xl bg-background border border-border"
              style={{ aspectRatio: '4/5', width: '100%', maxHeight: '100%' }}
            />
          )}
        </div>

        {/* ── Bottom controls — confidence only ────────────────────────────── */}
        <div className="shrink-0 pb-3 pt-2 space-y-2">

          {/* CONFIDENCE 1–5 scale */}
          {phase === 'confidence' && (
            <div className="animate-slide-up">
              <p className="font-display font-600 text-sm text-text-secondary mb-1.5">
                {t.confidenceQuestion}
              </p>
              <div className="h-1 rounded-full bg-border overflow-hidden mb-2">
                <div
                  key={confBarKey}
                  className="h-full bg-primary rounded-full"
                  style={{ animation: `deplete ${CONFIDENCE_MS}ms linear forwards` }}
                />
              </div>
              <div className="flex justify-between gap-1.5">
                {([1, 2, 3, 4, 5] as Confidence[]).map((level) => {
                  const col = CONFIDENCE_COLORS[level]
                  return (
                    <div key={level} className="flex flex-col items-center gap-1 flex-1">
                      <button
                        onClick={() => commitConfidence(level)}
                        className="confidence-dot w-full"
                        style={{ background: col.bg, border: `2px solid ${col.border}`, color: col.text }}
                      >
                        {level}
                      </button>
                      <span className="text-[9px] font-body text-text-muted text-center leading-tight">
                        {t.confidenceLabels[level - 1]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Keyboard hint — desktop only */}
          {(phase === 'stimulus' || phase === 'confidence') && (
            <p className="text-center text-xs text-text-muted font-body hidden sm:block">
              {phase === 'stimulus' ? '← / → o botones táctiles' : 'Teclado 1–5 o toca el número'}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
