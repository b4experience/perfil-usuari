# B4Experience Web

Frontend de evaluación cognitiva para B4Experience — test DDM estilo Tinder para medir la competencia decisional en montaña.

## Stack

- **Next.js 14** (App Router)
- **Supabase** — auth + base de datos + storage de imágenes
- **Vercel** — deploy (automático en cada push a main)
- **Tailwind CSS** — sistema de diseño B4E
- **Zustand** — estado global del onboarding
- **Framer Motion** — animaciones

## Estructura de páginas

```
/                           → Landing: selección de disciplina
/auth                       → Login / Registro (Supabase Auth)
/onboarding/consent         → RGPD + contacto emergencia        [PASO 1]
/onboarding/sliders         → Sliders autopercepción            [PASO 2]
/onboarding/test            → Test DDM 50 imágenes              [PASO 3]
/onboarding/results         → Informe ICD completo              [PASO 4]
```

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crea un archivo `.env.local` (copia de `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase — tablas y storage

Ejecuta estas queries en el SQL Editor de Supabase:

```sql
-- Tabla de perfiles de usuario
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(100),
  edad INT,
  pais VARCHAR(100),
  contacto_emergencia_nombre VARCHAR(200) NOT NULL,
  contacto_emergencia_tel VARCHAR(20) NOT NULL,
  datos_medicos JSONB,
  consentimiento_rgpd BOOLEAN DEFAULT FALSE,
  sos_desactivado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: cada usuario solo ve su fila
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_profile" ON user_profiles
  USING (auth.uid() = user_id);

-- Perfil base trekking
CREATE TABLE user_base_profile (
  base_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  fecha_test_base TIMESTAMPTZ DEFAULT now(),
  icd_trekking FLOAT,
  param_kappa FLOAT,
  param_a FLOAT,
  param_z_base FLOAT,
  param_v_trekking FLOAT,
  factor_seg_trekking FLOAT,
  fiabilidad_base FLOAT,
  actividades_declaradas_raw TEXT[],
  actividades_calibradas_json JSONB
);

ALTER TABLE user_base_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_base_profile" ON user_base_profile
  USING (auth.uid() = user_id);

-- Tabla de trials (catálogo de imágenes del test)
CREATE TABLE trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline VARCHAR(50) NOT NULL DEFAULT 'trekking',
  block INT NOT NULL,
  sequence INT NOT NULL,
  risk_level VARCHAR(20) NOT NULL, -- low | medium | high | distractor
  image_path TEXT NOT NULL, -- path relativo en Supabase Storage
  correct_decision VARCHAR(3), -- 'yes' | 'no' — solo lectura server-side
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: solo lectura para usuarios autenticados
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_trials" ON trials
  FOR SELECT USING (auth.role() = 'authenticated');

-- Tabla de respuestas del test
CREATE TABLE trial_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  trial_id UUID REFERENCES trials(id),
  decision VARCHAR(3) NOT NULL,
  reaction_time_ms INT NOT NULL,
  confidence INT,
  timestamp_epoch BIGINT NOT NULL,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trial_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_responses" ON trial_responses
  USING (auth.uid() = user_id);
```

### 4. Supabase Storage — bucket de imágenes

```
Bucket: trial-images
Estructura de carpetas:
  trial-images/
    trekking/base/         ← 50 imágenes base (t001.jpg ... t050.jpg)
    trekking/discipline/   ← futuro
    trail_running/         ← futuro
    alpinismo/             ← futuro
```

Las imágenes deben ser en formato **5:4** y resolución mínima recomendada **1000×800px**.

### 5. Configurar OAuth en Supabase

En Supabase Dashboard → Authentication → Providers:
- **Google**: configurar OAuth app en Google Cloud Console
- **Apple**: configurar Sign in with Apple

### 6. Desarrollo local

```bash
npm run dev
# → http://localhost:3000
```

### 7. Deploy en Vercel

```bash
# Primera vez
vercel --prod

# O conecta el repo en vercel.com y cada push a main despliega automáticamente
```

En Vercel → Settings → Environment Variables, añade las mismas variables de `.env.local`.

---

## Flujo de datos del test DDM

```
Usuario responde 50 imágenes
       ↓
trial_responses guardadas en Supabase (decision, RT, confidence)
       ↓
Supabase Edge Function: calcular_icd(user_id)
       ↓
HDDM estimation (Python: hddm library o variational Bayes)
       ↓
Resultado guardado en user_base_profile
       ↓
Results page lee user_base_profile y muestra informe
```

⚠️ El cálculo real del ICD necesita implementarse como Supabase Edge Function o API Route de Next.js llamando a un microservicio Python con la librería `hddm`.

## Internacionalización

Idiomas disponibles: ES (default), CA, EN
El selector de idioma está en todas las pantallas.

## TODO (lógica pendiente)

- [ ] Integrar Supabase Edge Function para cálculo HDDM real
- [ ] Cargar trials reales desde Supabase Storage
- [ ] Implementar middleware de autenticación (redirigir si no hay sesión)
- [ ] Persistir respuestas del test en Supabase en tiempo real
- [ ] Pantalla pre-actividad (Sección 8 del documento)
- [ ] Download PDF del informe (jsPDF o html2canvas)
- [ ] Sistema de retake automático a los 6 meses
- [ ] Módulos de disciplinas adicionales (trail, alpinismo, esquí, escalada)
