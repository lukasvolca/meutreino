import { createClient } from '@/lib/supabase/server'

export default async function ProgressoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: treinos } = await supabase
    .from('treinos')
    .select('*')
    .eq('user_id', user!.id)
    .order('data', { ascending: false })
    .limit(30)

  const total = treinos?.length ?? 0
  const volumeTotal = treinos?.reduce((a, t) => a + (t.volume_total ?? 0), 0) ?? 0
  const prs = treinos?.filter(t => t.teve_pr).length ?? 0
  const avgDur = total > 0
    ? Math.round((treinos!.reduce((a, t) => a + (t.duracao_min ?? 0), 0)) / total)
    : 0

  // Últimas 8 semanas de volume
  const weeklyData = buildWeeklyVolume(treinos ?? [])

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Progresso</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Treinos', value: total, unit: 'total' },
          { label: 'Volume', value: (volumeTotal / 1000).toFixed(1), unit: 'toneladas' },
          { label: 'PRs', value: prs, unit: 'recordes' },
          { label: 'Duração média', value: avgDur, unit: 'min' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="p-4 rounded-2xl"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-mono font-semibold tracking-widest uppercase mb-1"
              style={{ color: 'var(--muted-2)' }}>{label}</div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Weekly volume bar chart */}
      {weeklyData.length > 0 && (
        <div className="p-4 rounded-2xl mb-4"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-mono font-semibold tracking-widest uppercase mb-4"
            style={{ color: 'var(--muted-2)' }}>Volume semanal (kg)</div>
          <MiniBarChart data={weeklyData} />
        </div>
      )}

      {total === 0 && (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
          Complete seu primeiro treino para ver o progresso.
        </div>
      )}
    </div>
  )
}

function buildWeeklyVolume(treinos: { data: string; volume_total: number }[]) {
  const weeks: Record<string, number> = {}
  for (const t of treinos) {
    const d = new Date(t.data + 'T12:00:00')
    const monday = new Date(d)
    monday.setDate(d.getDate() - d.getDay() + 1)
    const key = monday.toISOString().split('T')[0]
    weeks[key] = (weeks[key] ?? 0) + (t.volume_total ?? 0)
  }
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, vol]) => ({ week, vol }))
}

function MiniBarChart({ data }: { data: { week: string; vol: number }[] }) {
  const max = Math.max(...data.map(d => d.vol), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map(({ week, vol }) => (
        <div key={week} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm transition-all"
            style={{
              height: `${Math.max(4, (vol / max) * 80)}px`,
              background: 'var(--accent)',
              opacity: 0.8,
            }} />
          <span className="text-[9px] font-mono" style={{ color: 'var(--muted-3)' }}>
            {new Date(week + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  )
}
