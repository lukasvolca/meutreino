import { createClient } from '@/lib/supabase/server'
import ProgressoClient, { type ExercicioProgresso } from './ProgressoClient'

function weekKey(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon.toISOString().split('T')[0]
}

export default async function ProgressoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0]

  const hoje = new Date().toISOString().split('T')[0]
  const mesAtualStr = hoje.slice(0, 7)

  const [{ data: fichas }, { data: treinos }] = await Promise.all([
    supabase.from('fichas').select('id, letra').eq('user_id', user!.id).order('ordem'),
    supabase.from('treinos').select('data, volume_total')
      .eq('user_id', user!.id)
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

  // Group max carga by week per exercise
  const weeklyMap: Record<string, Record<string, number[]>> = {}
  for (const row of setsLog ?? []) {
    if (!row.exercicio_id || !row.carga) continue
    const week = weekKey(row.created_at.split('T')[0])
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
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const wk = weekKey(d.toISOString().split('T')[0])
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
