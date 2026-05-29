import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AlunoDetail from './AlunoDetail'

export default async function AlunoPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: myProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = myProfile?.role ?? 'user'
  if (role !== 'admin' && role !== 'trainer') redirect('/admin/login')

  const { data: aluno } = await supabase
    .from('profiles')
    .select('id, nome, objetivo, streak')
    .eq('id', userId)
    .single()

  if (!aluno) notFound()

  const { data: fichas } = await supabase
    .from('fichas')
    .select('id, letra, nome, cor, icone, duracao_min, ordem, exercicios(count)')
    .eq('user_id', userId)
    .order('ordem')

  const { data: treinosCount } = await supabase
    .from('treinos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  return (
    <AlunoDetail
      aluno={aluno}
      fichas={fichas ?? []}
      treinosTotal={(treinosCount as unknown as { count: number } | null)?.count ?? 0}
      myRole={role}
    />
  )
}
