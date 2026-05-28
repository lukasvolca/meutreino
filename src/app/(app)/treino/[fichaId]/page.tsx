import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TreinoClient from './TreinoClient'

export default async function TreinoPage({ params }: { params: Promise<{ fichaId: string }> }) {
  const { fichaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: ficha }, { data: exercicios }] = await Promise.all([
    supabase.from('fichas').select('*').eq('id', fichaId).eq('user_id', user!.id).single(),
    supabase.from('exercicios').select('*').eq('ficha_id', fichaId).order('ordem'),
  ])

  if (!ficha) notFound()

  return <TreinoClient ficha={ficha} exercicios={exercicios ?? []} userId={user!.id} />
}
