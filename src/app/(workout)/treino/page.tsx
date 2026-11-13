'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/session'
import { useLoad } from '@/lib/load'
import TreinoClient from './TreinoClient'
import Loading from './loading'

// Página estática: o id da ficha vem na URL como /treino/?id=<fichaId>
export default function TreinoPage() {
  return <Suspense fallback={<Loading/>}><Treino/></Suspense>
}

function Treino() {
  const fichaId = useSearchParams().get('id') ?? ''
  const user = useUser()
  const { data } = useLoad(() => carregar(fichaId, user.id), fichaId)

  if (!data) return <Loading/>
  if (!data.ficha) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        <p>Ficha não encontrada.</p>
        <Link href="/dashboard/" style={{ color: 'var(--accent)' }}>Voltar para o início</Link>
      </div>
    )
  }
  return <TreinoClient ficha={data.ficha} exercicios={data.exercicios} userId={user.id} historicoMap={data.historicoMap}/>
}

async function carregar(fichaId: string, uid: string) {
  const supabase = createClient()
  if (!fichaId) return { ficha: null, exercicios: [], historicoMap: {} }
  const [{ data: ficha }, { data: exercicios }] = await Promise.all([
    supabase.from('fichas').select('*').eq('id', fichaId).eq('user_id', uid).maybeSingle(),
    supabase.from('exercicios').select('*').eq('ficha_id', fichaId).order('ordem'),
  ])

  const exIds = (exercicios ?? []).map((e: { id: string }) => e.id)

  // Últimas 6 cargas de cada exercício para os mini-gráficos
  const historicoMap: Record<string, { carga: number, date: string }[]> = {}
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
      historicoMap[row.exercicio_id].push({ carga: row.carga, date: row.created_at })
    }
    for (const k of Object.keys(historicoMap)) historicoMap[k] = historicoMap[k].slice(-6)
  }

  return { ficha, exercicios: exercicios ?? [], historicoMap }
}
