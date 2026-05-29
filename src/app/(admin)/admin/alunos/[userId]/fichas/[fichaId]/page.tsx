import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import FichaAdmin from './FichaAdmin'

export default async function FichaAdminPage({ params }: { params: Promise<{ userId: string; fichaId: string }> }) {
  const { userId, fichaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: myProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = myProfile?.role ?? 'user'
  if (role !== 'admin' && role !== 'trainer') redirect('/admin/login')

  const { data: ficha } = await supabase
    .from('fichas')
    .select('id, letra, nome, cor, duracao_min, ordem, user_id')
    .eq('id', fichaId)
    .eq('user_id', userId)
    .single()

  if (!ficha) notFound()

  const { data: aluno } = await supabase
    .from('profiles').select('id, nome').eq('id', userId).single()

  const { data: exercicios } = await supabase
    .from('exercicios')
    .select('*')
    .eq('ficha_id', fichaId)
    .order('ordem')

  return (
    <FichaAdmin
      ficha={ficha}
      aluno={aluno ?? { id: userId, nome: '—' }}
      exercicios={exercicios ?? []}
    />
  )
}
