import { createBrowserClient } from '@supabase/ssr'

// ─── Browser Client (for client components) ───────────────────────────────────
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Returns the public URL of a trial image stored in Supabase Storage.
 *  Bucket: 'trial-images' | Path example: 'trekking/base/t001.jpg'
 */
export function getTrialImageUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from('trial-images').getPublicUrl(path)
  return data.publicUrl
}

/** Signs out the current user */
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
