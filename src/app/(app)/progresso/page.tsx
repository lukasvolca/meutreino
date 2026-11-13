'use client'

import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/session'
import { useLoad } from '@/lib/load'
import { PageSkeleton } from '@/components/Skeleton'
import ProgressoClient, { type ExercicioProgresso } from './ProgressoClient'
import { todayBR, addDays, mondayOf, isoDateBR } from '@/lib/date'

const weekKey = mondayOf

export default function ProgressoPage() {
  const user = useUser()
  const { data } = useLoad(() => carregar(user.id))
  if (!data) return <PageSkeleton/>
  return <Conteudo {...data}/>
}

async function carregar(uid: string) {
  const supabase = createClient()


  const hoje = todayBR()
  const oneYearAgoStr = addDays(hoje, -365)
  const oneYearAgo = new Date(oneYearAgoStr + 'T03:00:00Z')
  const mesAtualStr = hoje.slice(0, 7)

  const [{ data: fichas }, { data: treinos }] = await Promise.all([
    supabase.from('fichas').select('id, letra').eq('user_id', uid).order('ordem'),
    supabase.from('treinos').select('data, volume_total')
      .eq('user_id', uid)
      .gte('data', oneYearAgoStr)
      .order('data', { ascending: true }),
  ])

  const fichaIds = (fichas ?? []).map(f => f.id)
  const fichaMap: Record<string, string> = {}
  for (const f of fichas ?? []) fichaMap[f.id] = f.letra

  const { data: exercicios } = fichaIds.length > 0
    ? await supabase.from('exercicios').select('id, nome, grupo, ficha_id, tipo')
        .in('ficha_id', fichaIds).order('ordem')
    : { data: [] }

  const exIds = (exercicios ?? []).map(e => e.id)

  const { data: setsLog } = exIds.length > 0
    ? await supabase.from('sets_log')
        .select('exercicio_id, carga, created_at')
        .in('exercicio_id', exIds)
        .eq('done', true)
        .gt('carga', 0)
        .gte('created_at', oneYearAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(exIds.length * 60)
    : { data: [] }

  return { fichas, treinos, fichaMap, exercicios, setsLog }
}

function Conteudo({ fichas, treinos, fichaMap, exercicios, setsLog }: Awaited<ReturnType<typeof carregar>>) {
  const hoje = todayBR()
  const mesAtualStr = hoje.slice(0, 7)

  // Group max carga by week per exercise
  const weeklyMap: Record<string, Record<string, number[]>> = {}
  for (const row of setsLog ?? []) {
    if (!row.exercicio_id || !row.carga) continue
    const week = weekKey(isoDateBR(new Date(row.created_at)))
    if (!weeklyMap[row.exercicio_id]) weeklyMap[row.exercicio_id] = {}
    if (!weeklyMap[row.exercicio_id][week]) weeklyMap[row.exercicio_id][week] = []
    weeklyMap[row.exercicio_id][week].push(row.carga)
  }

  const exercicioData: ExercicioProgresso[] = (exercicios ?? [])
    .filter(e => e.tipo === 'forca')
    .map(e => {
      const weekly = weeklyMap[e.id] ?? {}
      const historico = Object.entries(weekly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, vals]) => ({ week, maxCarga: Math.max(...vals) }))
      const pr = historico.length > 0 ? Math.max(...historico.map(h => h.maxCarga)) : 0
      const first = historico[0]?.maxCarga ?? 0
      return {
        id: e.id,
        nome: e.nome,
        grupo: e.grupo ?? '',
        ficha: fichaMap[e.ficha_id] ?? '?',
        historico,
        pr,
        delta: pr - first,
      }
    })
    .filter(e => e.historico.length > 0)

  // Weekly volume for last 12 weeks
  const volMap: Record<string, number> = {}
  for (const t of treinos ?? []) {
    const week = weekKey(t.data)
    volMap[week] = (volMap[week] ?? 0) + (t.volume_total ?? 0)
  }
  // Build last 12 weeks including current (even if 0)
  const weeklyVolume: { week: string; vol: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const wk = addDays(mondayOf(hoje), -i * 7)
    weeklyVolume.push({ week: wk, vol: volMap[wk] ?? 0 })
  }
  // Deduplicate (same week may appear multiple times due to iteration)
  const seenWeeks = new Set<string>()
  const weeklyVolumeDeduped = weeklyVolume.filter(w => {
    if (seenWeeks.has(w.week)) return false
    seenWeeks.add(w.week)
    return true
  })

  // Session stats
  const treinosMes = (treinos ?? []).filter(t => t.data.startsWith(mesAtualStr)).length
  const treinos12w = (treinos ?? []).filter(t => {
    const d = new Date(t.data + 'T12:00:00')
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 7)
    return diff <= 12
  })
  const freqSemanal = treinos12w.length / 12

  if (exercicioData.length === 0) {
    return (
      <div style={{ padding: '56px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', marginBottom: 16 }}>Progresso</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Complete treinos para ver sua evolução de carga.</div>
      </div>
    )
  }

  return (
    <ProgressoClient
      exercicios={exercicioData}
      weeklyVolume={weeklyVolumeDeduped}
      treinosMes={treinosMes}
      freqSemanal={freqSemanal}
    />
  )
}
