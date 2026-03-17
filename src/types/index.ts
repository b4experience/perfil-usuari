// ─── Locale & Discipline ──────────────────────────────────────────────────────
export type Locale = 'es' | 'en' | 'ca'
export type Discipline = 'trekking' | 'trail_running' | 'alpinismo' | 'esqui_montana' | 'escalada'

// ─── Onboarding State ─────────────────────────────────────────────────────────
export interface UserConsent {
  rgpd: boolean
  disclaimer: boolean
  emergencyName: string
  emergencyPhone: string
  age?: string
  country?: string
}

export interface SliderValues {
  aerobic: number     // 0–60 km/day
  anaerobic: number   // 0–3500 m elevation/day
  technical: number   // 1–4 scale
  activities: string[] // up to 3 free-text entries
}

// ─── DDM Test ─────────────────────────────────────────────────────────────────
export type RiskLevel = 'low' | 'medium' | 'high' | 'distractor'
export type Block = 1 | 2 | 3 | 4 | 5
export type Decision = 'yes' | 'no'
export type Confidence = 1 | 2 | 3 | 4 | 5

export interface Trial {
  id: string
  imageUrl: string       // Supabase storage URL
  riskLevel: RiskLevel
  block: Block
  correctDecision?: Decision // used server-side only, never sent to client during test
}

export interface TrialResponse {
  trialIndex: number
  imageId: string
  decision: Decision
  reactionTimeMs: number
  confidence: Confidence | null
  timestampEpoch: number
}

// ─── DDM Results ──────────────────────────────────────────────────────────────
export interface DDMParams {
  v: number      // drift rate          [-1.0, +1.0]
  a: number      // boundary separation  [0.5, 2.0]
  z: number      // starting point       [0.3, 0.7]
  kappa: number  // metacognition        [0.0, 1.0]
  ter: number    // non-decision time    [0.2, 0.5]
}

export type DiagnosticProfile =
  | 'expert_calibrated'
  | 'beginner_prudent'
  | 'expert_arrogant'
  | 'beginner_imprudent'
  | 'chronic_overestimator'

export interface ICDResult {
  icd: number              // 0–100
  levelLabel: string       // "Intermedio"
  levelNumeric: number     // 5.8 / 10
  percentile: number       // 62
  safetyFactor: number     // 0.87
  params: DDMParams
  diagnosticProfile: DiagnosticProfile
  disciplineUnlocked: boolean
  atypicPatterns: string[]
  reliabilityScore: number // 0–1
}

// ─── Supabase DB types (mirror of DB schema) ──────────────────────────────────
export interface UserProfile {
  user_id: string
  email: string
  nombre?: string
  edad?: number
  pais?: string
  contacto_emergencia_nombre: string
  contacto_emergencia_tel: string
  datos_medicos?: Record<string, string>
  consentimiento_rgpd: boolean
  sos_desactivado: boolean
}

export interface UserBaseProfile {
  base_profile_id: string
  user_id: string
  fecha_test_base: string
  icd_trekking: number
  param_kappa: number
  param_a: number
  param_z_base: number
  param_v_trekking: number
  factor_seg_trekking: number
  fiabilidad_base: number
  actividades_declaradas_raw?: string[]
  actividades_calibradas_json?: Record<string, unknown>
}
