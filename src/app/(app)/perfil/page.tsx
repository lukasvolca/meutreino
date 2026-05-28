import { createClient } from '@/lib/supabase/server'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: fichas }, { data: treinos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('fichas').select('*, exercicios(count)').eq('user_id', user!.id).order('ordem'),
    supabase.from('treinos').select('id').eq('user_id', user!.id),
  ])

  return (
    <PerfilClient
      profile={profile!}
      fichas={fichas ?? []}
      treinosTotal={treinos?.length ?? 0}
    />
  )
}
