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
  4: { bg: 'rgba(11,110,232,0.10)',  border: '#0B6EE8', text: '#0B6EE8' },
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
  const [confTimer,     setConfTimer]     = useState(0)
  const [milestone,     setMilestone]     = useState<number | null>(null)  // "Llevas X/50 ✓" §6.1

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
  }, [phase, trialIndex, currentTrial])

  // ── Commit confidence and advance to next trial ────────────────────────────
  const commitConfidence = useCallback((conf: Confidence | null) => {
    if (confTimerRef.current) clearInterval(confTimerRef.current)

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
      <div className="h-full flex flex-col overflow-y-auto no-scrollbar">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 text-center">
          <div className="w-full max-w-sm">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-summit/10 border border-summit/30 mb-3">
              <span className="text-summit text-xs">🧠</span>
              <span className="text-xs font-display font-600 text-summit tracking-wide">B4E Protocol · DDM</span>
            </div>

            <h1 className="font-display font-800 text-2xl sm:text-3xl text-text-primary mb-2">
              {t.testIntroTitle}
            </h1>
            <p className="font-body text-text-secondary text-xs sm:text-sm mb-4 mx-auto leading-relaxed">
              {t.testIntroSub}
            </p>

            {/* Instructions */}
            <div className="b4e-card p-3 sm:p-4 text-left mb-4 space-y-2">
              {t.testIntroInstructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-glacier/20 border border-glacier/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-mono text-[10px] text-glacier">{i + 1}</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-text-secondary leading-relaxed">{inst}</p>
                </div>
              ))}
            </div>

            {/* Key shortcuts — desktop only */}
            <div className="hidden sm:flex items-center justify-center gap-5 mb-4 text-xs font-body text-text-muted">
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded border border-border bg-bg-elevated font-mono text-xs">→</kbd>
                <span>Sí</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded border border-border bg-bg-elevated font-mono text-xs">←</kbd>
                <span>No</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded border border-border bg-bg-elevated font-mono text-xs">1–5</kbd>
                <span>Confianza</span>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky start button */}
        <div className="shrink-0 px-4 pb-4 flex justify-center">
          <button className="btn-primary w-full max-w-sm py-3 text-sm sm:text-base" onClick={startFixation}>
            {t.startNow}
          </button>
        </div>
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
                stroke="#0B6EE8" strokeWidth="4"
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
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0B6EE8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Llevas {milestone}/50 ✓
            </span>
          </div>
        )}

        {/* ── Image area — flex-1, centers the 4:5 card vertically ─────────── */}
        <div className="flex-1 flex items-center justify-center min-h-0 py-1">

          {/* FIXATION DOT */}
          {phase === 'fixation' && (
            <div
              className="flex items-center justify-center bg-bg-elevated border border-border rounded-2xl animate-fade-in"
              style={{ aspectRatio: '4/5', height: '100%', maxHeight: '340px', maxWidth: '100%' }}
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
                  : 'border-border'
              }`}
              style={{ aspectRatio: '4/5', height: '100%', maxHeight: '340px', maxWidth: '100%' }}
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
              {phase === 'confidence' && lastDecision && (
                <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full font-display font-700 text-xs uppercase tracking-wider animate-scale-in ${lastDecision === 'yes' ? 'bg-safe text-bg-primary' : 'bg-danger text-white'}`}>
                  {lastDecision === 'yes' ? '✓ SÍ' : '✕ NO'}
                </div>
              )}
            </div>
          )}

          {/* ITI blank */}
          {phase === 'iti' && (
            <div
              className="rounded-2xl bg-bg-primary border border-border"
              style={{ aspectRatio: '4/5', height: '100%', maxHeight: '340px', maxWidth: '100%' }}
            />
          )}
        </div>

        {/* ── Bottom controls — shrink-0 ────────────────────────────────────── */}
        <div className="shrink-0 pb-3 pt-1 space-y-2">

          {/* YES / NO buttons */}
          {phase === 'stimulus' && (
            <div className="animate-slide-up">
              <p className="text-center font-display font-600 text-sm text-text-secondary mb-2">
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

          {/* CONFIDENCE 1–5 scale */}
          {phase === 'confidence' && (
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <p className="font-display font-600 text-sm text-text-secondary">
                  {t.confidenceQuestion}
                </p>
                <span className="font-mono text-xs text-text-muted">{confTimer}s</span>
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
