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

  const exIds = (exercicios ?? []).map(e => e.id)

  // Fetch last 6 carga values per exercise for sparklines
  const historicoMap: Record<string, number[]> = {}
  if (exIds.length > 0) {
    const { data: logs } = await supabase.from('sets_log')
      .select('exercicio_id, carga, created_at')
      .in('exercicio_id', exIds)
      .eq('done', true)
      .not('carga', 'is', null)
      .gt('carga', 0)
      .order('created_at', { ascending: true })
      .limit(exIds.length * 8)

    for (const row of logs ?? []) {
      if (!row.exercicio_id || row.carga == null) continue
      if (!historicoMap[row.exercicio_id]) historicoMap[row.exercicio_id] = []
      historicoMap[row.exercicio_id].push(row.carga)
    }
    for (const k of Object.keys(historicoMap)) {
      historicoMap[k] = historicoMap[k].slice(-6)
    }
  }

  return (
    <TreinoClient
      ficha={ficha}
      exercicios={exercicios ?? []}
      userId={user!.id}
      historicoMap={historicoMap}
    />
  )
}
