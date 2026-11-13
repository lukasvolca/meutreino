'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => router.replace(data.user ? '/dashboard/' : '/login/'))
  }, [router])
  return null
}
