import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Um único client por requisição (layout + página compartilham).
export const createClient = cache(async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
})

/**
 * Usuário autenticado, verificado uma vez por requisição.
 * `getClaims()` valida o JWT localmente (chaves assimétricas) em vez de
 * consultar o servidor de auth a cada layout/página.
 */
export const getAuthUser = cache(async (): Promise<{ id: string } | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const sub = data?.claims?.sub
  return sub ? { id: sub } : null
})
