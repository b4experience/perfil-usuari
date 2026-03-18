'use client'

import { useEffect } from 'react'
import { useRouter }  from 'next/navigation'

export default function ConsentPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/onboarding/sliders') }, [router])
  return null
}
