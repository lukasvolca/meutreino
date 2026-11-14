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
  return <TreinoClient ficha={data.ficha} exercicios={data.exercicios} userId={user.id} historicoMap={data.historicoMap}
    ultimaVez={data.ultimaVez} recorde={data.recorde}/>
}

async function carregar(fichaId: string, uid: string) {
  const supabase = createClient()
  if (!fichaId) return { ficha: null, exercicios: [], historicoMap: {}, ultimaVez: {}, recorde: {} }
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

  // "Última vez": as séries feitas no treino mais recente de cada exercício
  const ultimaVez: Record<string, { carga: number, reps: number | null }[]> = {}
  // Recorde: maior carga já registrada em cada exercício (uma consulta pequena por exercício)
  const recorde: Record<string, number> = {}
  if (exIds.length > 0) {
    const [{ data: recentes }, ...maiores] = await Promise.all([
      supabase.from('sets_log')
        .select('exercicio_id, treino_id, serie_num, carga, reps, created_at')
        .in('exercicio_id', exIds)
        .eq('done', true)
        .order('created_at', { ascending: false })
        .limit(exIds.length * 15),
      ...exIds.map((id: string) => supabase.from('sets_log').select('exercicio_id, carga')
        .eq('exercicio_id', id).eq('done', true).gt('carga', 0)
        .order('carga', { ascending: false }).limit(1).maybeSingle()),
    ])
    const treinoDoEx: Record<string, string> = {}
    const series: Record<string, { n: number, carga: number, reps: number | null }[]> = {}
    for (const r of recentes ?? []) {
      if (!r.exercicio_id) continue
      treinoDoEx[r.exercicio_id] ??= r.treino_id   // o primeiro visto é o treino mais recente
      if (r.treino_id !== treinoDoEx[r.exercicio_id]) continue
      ;(series[r.exercicio_id] ??= []).push({ n: r.serie_num, carga: Number(r.carga ?? 0), reps: r.reps })
    }
    for (const [k, v] of Object.entries(series)) {
      ultimaVez[k] = v.sort((a, b) => a.n - b.n).map(({ carga, reps }) => ({ carga, reps }))
    }
    for (const m of maiores) if (m.data?.exercicio_id) recorde[m.data.exercicio_id] = Number(m.data.carga ?? 0)
  }

  return { ficha, exercicios: exercicios ?? [], historicoMap, ultimaVez, recorde }
}
