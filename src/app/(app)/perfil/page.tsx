'use client'

import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/session'
import { useLoad } from '@/lib/load'
import { PageSkeleton } from '@/components/Skeleton'
import PerfilClient from './PerfilClient'

export default function PerfilPage() {
  const user = useUser()
  const { data } = useLoad(async () => {
    const supabase = createClient()
    const [{ data: profile }, { data: fichas }, { data: treinos }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('fichas').select('*, exercicios(count)').eq('user_id', user.id).order('ordem'),
      supabase.from('treinos').select('id').eq('user_id', user.id),
    ])
    return { profile, fichas: fichas ?? [], treinosTotal: treinos?.length ?? 0 }
  })
  if (!data?.profile) return <PageSkeleton/>
  return <PerfilClient profile={data.profile} fichas={data.fichas as unknown as Parameters<typeof PerfilClient>[0]['fichas']} treinosTotal={data.treinosTotal}/>
}
