'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { useRouter }             from 'next/navigation'
import Image                     from 'next/image'
import { useAppStore }           from '@/context/AppContext'
import { useT }                  from '@/lib/i18n'
import { createClient }          from '@/lib/supabase'
import type { Trial, TrialResponse, Decision, Confidence } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_TRIALS     = 50
const FIXATION_MS      = 500
const MAX_STIMULUS_MS  = 8000
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
  1: { bg: 'rgba(201,64,64,0.15)',  border: '#C94040', text: '#E05A5A' },
  2: { bg: 'rgba(212,160,48,0.15)', border: '#D4A030', text: '#E8BA50' },
  3: { bg: 'rgba(122,146,168,0.15)',border: '#7A92A8', text: '#A0B8CC' },
  4: { bg: 'rgba(91,163,201,0.15)', border: '#5BA3C9', text: '#82BCE0' },
  5: { bg: 'rgba(61,170,115,0.15)', border: '#3DAA73', text: '#58C98D' },
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
  const [responses,     setResponses]   = useState<TrialResponse[]>([])

  // Per-trial transient state
  const [stimulusStart, setStimulusStart] = useState(0)
  const [lastDecision,  setLastDecision]  = useState<Decision | null>(null)
  const [confSelected,  setConfSelected]  = useState<Confidence | null>(null)
  const [confTimer,     setConfTimer]     = useState(0)

  // Refs for timers
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      if (timerRef.current)    clearTimeout(timerRef.current)
      if (confTimerRef.current) clearInterval(confTimerRef.current)
    }
  }, [])

  // ── Phase: FIXATION → STIMULUS ─────────────────────────────────────────────
  const startFixation = useCallback(() => {
    setPhase('fixation')
    setLastDecision(null)
    setConfSelected(null)
    timerRef.current = setTimeout(() => {
      setStimulusStart(Date.now())
      setPhase('stimulus')
    }, FIXATION_MS)
  }, [])

  // ── Handle decision (YES / NO) ─────────────────────────────────────────────
  const handleDecision = useCallback((decision: Decision) => {
    if (phase !== 'stimulus') return
    const rt = Date.now() - stimulusStart
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
      setConfTimer(CONFIDENCE_MS / 1000)
      setPhase('confidence')

      // Auto-advance confidence countdown
      confTimerRef.current = setInterval(() => {
        setConfTimer((prev) => {
          if (prev <= 1) {
            clearInterval(confTimerRef.current!)
            commitConfidence(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, CONFIDENCE_DELAY)
  }, [phase, stimulusStart, trialIndex, currentTrial])

  // ── Commit confidence and advance to next trial ────────────────────────────
  const commitConfidence = useCallback((conf: Confidence | null) => {
    if (confTimerRef.current) clearInterval(confTimerRef.current)
    setConfSelected(conf)

    // Update last response with confidence
    setResponses((prev) => {
      const updated = [...prev]
      const last    = { ...updated[updated.length - 1], confidence: conf }
      updated[updated.length - 1] = last
      addResponse(last) // persist to zustand store
      return updated
    })

    setPhase('iti')

    timerRef.current = setTimeout(() => {
      const next = trialIndex + 1
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-10 animate-fade-in">
        <div className="w-full max-w-lg text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-summit/10 border border-summit/30 mb-6">
            <span className="text-summit text-xs">🧠</span>
            <span className="text-xs font-display font-600 text-summit tracking-wide">B4E Protocol · DDM</span>
          </div>

          <h1 className="font-display font-800 text-3xl sm:text-4xl text-text-primary mb-3">
            {t.testIntroTitle}
          </h1>
          <p className="font-body text-text-secondary text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            {t.testIntroSub}
          </p>

          {/* Instructions */}
          <div className="b4e-card p-5 text-left mb-8 space-y-3">
            {t.testIntroInstructions.map((inst, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-glacier/20 border border-glacier/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-mono text-xs text-glacier">{i + 1}</span>
                </div>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{inst}</p>
              </div>
            ))}
          </div>

          {/* Key shortcuts hint */}
          <div className="flex items-center justify-center gap-6 mb-8 text-xs font-body text-text-muted">
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded border border-border bg-bg-elevated font-mono">→</kbd>
              <span>Sí</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded border border-border bg-bg-elevated font-mono">←</kbd>
              <span>No</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded border border-border bg-bg-elevated font-mono">1–5</kbd>
              <span>Confianza</span>
            </div>
          </div>

          <button
            className="btn-primary px-8 py-4 text-base w-full max-w-xs"
            onClick={startFixation}
          >
            {t.startNow}
          </button>
        </div>
      </div>
    )
  }

  // ── CALCULATING SCREEN ────────────────────────────────────────────────────────
  if (phase === 'calculating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 animate-fade-in">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1E2F42" strokeWidth="4"/>
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="#5BA3C9" strokeWidth="4"
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
                  <path d="M2 6L5 9L10 3" stroke="#3DAA73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
    <div className="flex flex-col items-center min-h-[calc(100vh-80px)] px-4 py-4">
      <div className="w-full max-w-lg flex flex-col gap-4">

        {/* ── Progress header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-text-muted">
            {trialIndex + 1} {t.trialOf} {TOTAL_TRIALS}
          </span>

          {/* Block indicator */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((b) => {
              const blockStart = [0, 8, 20, 38, 46][b - 1]
              const blockEnd   = [8, 20, 38, 46, 50][b - 1]
              const active     = trialIndex >= blockStart && trialIndex < blockEnd
              const done       = trialIndex >= blockEnd
              return (
                <div
                  key={b}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    done   ? 'bg-glacier w-4' :
                    active ? 'bg-glacier/60 w-6' :
                             'bg-border w-2'
                  }`}
                />
              )
            })}
          </div>

          <span className="font-mono text-xs text-glacier">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Full progress bar */}
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* ── Trial container ───────────────────────────────────────────────── */}
        <div className="relative">

          {/* FIXATION DOT */}
          {phase === 'fixation' && (
            <div
              className="flex items-center justify-center bg-bg-surface border border-border rounded-2xl animate-fade-in"
              style={{ aspectRatio: '5/4' }}
            >
              <div className="w-3 h-3 rounded-full bg-text-muted animate-pulse-slow" />
            </div>
          )}

          {/* STIMULUS IMAGE */}
          {(phase === 'stimulus' || phase === 'confidence' || phase === 'iti') && currentTrial && (
            <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-150
              ${phase === 'confidence' ? (
                lastDecision === 'yes' ? 'border-safe' : 'border-danger'
              ) : 'border-border'}
            `}
              style={{ aspectRatio: '5/4' }}
            >
              {/* Actual mountain image — replace src with real URL from Supabase */}
              <div
                className="w-full h-full bg-gradient-to-br from-bg-elevated to-bg-surface flex items-center justify-center"
              >
                {/* Placeholder mountain silhouette SVG for development */}
                <svg viewBox="0 0 400 320" className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E1520"/>
                      <stop offset="100%" stopColor="#162232"/>
                    </linearGradient>
                  </defs>
                  <rect width="400" height="320" fill="url(#sky)"/>
                  <path d="M0 320 L0 200 L60 140 L120 170 L200 80 L260 110 L320 60 L380 100 L400 80 L400 320 Z" fill="#1A293B"/>
                  <path d="M0 320 L0 240 L80 200 L160 220 L230 180 L290 195 L360 170 L400 185 L400 320 Z" fill="#0E1520"/>
                  <text x="200" y="165" textAnchor="middle" fill="#3E5268" fontSize="11" fontFamily="Plus Jakarta Sans">
                    {currentTrial.id}
                  </text>
                  <text x="200" y="182" textAnchor="middle" fill="#3E5268" fontSize="10" fontFamily="JetBrains Mono">
                    [{currentTrial.riskLevel.toUpperCase()}]
                  </text>
                </svg>

                {/* Decision overlay flash */}
                {phase === 'confidence' && (
                  <div className={`absolute inset-0 rounded-2xl pointer-events-none
                    ${lastDecision === 'yes' ? 'bg-safe/10' : 'bg-danger/10'}
                    animate-fade-in
                  `} />
                )}
              </div>

              {/* Decision badge */}
              {phase === 'confidence' && lastDecision && (
                <div className={`
                  absolute top-3 right-3 px-3 py-1.5 rounded-full
                  font-display font-700 text-xs uppercase tracking-wider
                  animate-scale-in
                  ${lastDecision === 'yes'
                    ? 'bg-safe text-bg-primary'
                    : 'bg-danger text-white'
                  }
                `}>
                  {lastDecision === 'yes' ? '✓ SÍ' : '✕ NO'}
                </div>
              )}
            </div>
          )}

          {/* ITI blank */}
          {phase === 'iti' && (
            <div
              className="rounded-2xl bg-bg-primary border border-border"
              style={{ aspectRatio: '5/4' }}
            />
          )}
        </div>

        {/* ── STIMULUS: YES / NO buttons ─────────────────────────────────────── */}
        {phase === 'stimulus' && (
          <div className="animate-slide-up">
            <p className="text-center font-display font-600 text-sm text-text-secondary mb-3">
              {t.wouldContinue}
            </p>
            <div className="flex gap-3">
              <button className="btn-no" onClick={() => handleDecision('no')}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M5 5L13 13M13 5L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {t.no}
              </button>
              <button className="btn-yes" onClick={() => handleDecision('yes')}>
                {t.yes}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9L7.5 12.5L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIDENCE: 1–5 scale ───────────────────────────────────────────── */}
        {phase === 'confidence' && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-600 text-sm text-text-secondary">
                {t.confidenceQuestion}
              </p>
              <span className="font-mono text-xs text-text-muted">{confTimer}s</span>
            </div>

            <div className="flex justify-between gap-2">
              {([1, 2, 3, 4, 5] as Confidence[]).map((level) => {
                const col = CONFIDENCE_COLORS[level]
                return (
                  <button
                    key={level}
                    onClick={() => commitConfidence(level)}
                    className="confidence-dot flex-1"
                    style={{
                      background:   col.bg,
                      border:       `2px solid ${col.border}`,
                      color:        col.text,
                    }}
                    title={t.confidenceLabels[level - 1]}
                  >
                    {level}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between mt-1.5 px-1">
              <span className="text-xs font-body text-text-muted">{t.confidenceLabels[0]}</span>
              <span className="text-xs font-body text-text-muted">{t.confidenceLabels[4]}</span>
            </div>
          </div>
        )}

        {/* ── Keyboard hint (desktop only) ──────────────────────────────────── */}
        {(phase === 'stimulus' || phase === 'confidence') && (
          <p className="text-center text-xs text-text-muted font-body hidden sm:block">
            {phase === 'stimulus' ? '← / → o botones táctiles' : 'Teclado 1–5 o toca el número'}
          </p>
        )}
      </div>
    </div>
  )
}
