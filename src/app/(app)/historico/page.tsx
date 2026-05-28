import { createClient } from '@/lib/supabase/server'
import { Heatmap } from '@/components/charts'
import Icon from '@/components/icons'

type TreinoRow = {
  id: string
  data: string
  duracao_min: number | null
  volume_total: number
  teve_pr: boolean
  ficha_letra: string | null
  fichas: { nome: string; icone: string | null } | null
}

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: treinosRaw } = await supabase
    .from('treinos')
    .select('id, data, duracao_min, volume_total, teve_pr, ficha_letra, fichas(nome, icone)')
    .eq('user_id', user!.id)
    .order('data', { ascending: false })
    .limit(120)

  const treinos = (treinosRaw as TreinoRow[] | null) ?? []

  const hoje = new Date()
  // Filter to last 84 days (12 weeks) for stats + heatmap
  const treinos84 = treinos.filter(t => {
    const d = new Date(t.data + 'T12:00:00')
    return (hoje.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < 84
  })

  // Build heatmap 84-cell array (12 cols × 7 rows, col 0 = oldest, col 11 = newest)
  const cells = new Array(84).fill(0)
  for (const t of treinos84) {
    const d = new Date(t.data + 'T12:00:00')
    const days = Math.floor((hoje.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (days >= 0 && days < 84) {
      const week = Math.floor(days / 7)
      const dow = (d.getDay() + 6) % 7  // 0=Mon..6=Sun
      const col = 11 - week
      const idx = col * 7 + dow
      if (idx >= 0 && idx < 84) {
        cells[idx] = t.teve_pr ? 1.0 : 0.6
      }
    }
  }

  const totalVolume = treinos84.reduce((a, t) => a + (t.volume_total ?? 0), 0)
  const totalMinutes = treinos84.reduce((a, t) => a + (t.duracao_min ?? 0), 0)
  const totalSessions = treinos84.length
  const totalPRs = treinos84.filter(t => t.teve_pr).length

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '0 20px 4px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {'> SEÇÃO 04'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1 }}>
          Histórico
        </div>
        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
          {totalSessions} treinos · últimas 12 semanas
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ padding: '16px 20px 16px' }}>
        <div style={{ padding: 16, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ATIVIDADE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>
              MENOS
              <div style={{ display: 'flex', gap: 2 }}>
                {[0.2, 0.4, 0.6, 0.85, 1].map((v, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', opacity: 0.25 + v * 0.75 }}/>
                ))}
              </div>
              MAIS
            </div>
          </div>
          <Heatmap data={cells} weeks={12}/>
        </div>
      </div>

      {/* Aggregate stats */}
      <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          {
            label: 'VOLUME TOTAL',
            value: (totalVolume / 1000).toFixed(1),
            unit: 'ton',
            sub: 'kg movidos',
          },
          {
            label: 'TEMPO TOTAL',
            value: totalMinutes >= 60 ? Math.floor(totalMinutes / 60) : totalMinutes,
            unit: totalMinutes >= 60 ? `h ${totalMinutes % 60}m` : 'min',
            sub: 'nas barras',
          },
          {
            label: 'SESSÕES',
            value: totalSessions,
            unit: '',
            sub: 'completas',
          },
          {
            label: 'PRS QUEBRADOS',
            value: totalPRs,
            unit: '',
            sub: 'recordes',
            accent: true,
          },
        ].map(({ label, value, unit, sub, accent }) => (
          <div key={label} style={{ padding: 14, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28,
                letterSpacing: '-0.03em', lineHeight: 1,
                color: accent ? 'var(--accent)' : 'var(--text)',
              }}>{value}</span>
              {unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>{unit}</span>}
            </div>
            <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div style={{ padding: '0 20px 6px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
        Sessões recentes
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {treinos.slice(0, 30).map(t => {
          const ficha = t.fichas
          const dateStr = t.data.split('-').reverse().slice(0, 2).join('/')
          return (
            <div key={t.id} style={{
              padding: 12, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted)', flexShrink: 0,
              }}>
                {ficha?.icone ? (
                  <Icon name={ficha.icone} size={22} strokeWidth={1.8}/>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>{t.ficha_letra ?? '?'}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
                    {dateStr}
                  </span>
                  {t.teve_pr && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                      padding: '1px 5px', borderRadius: 3,
                      background: 'rgba(204,255,0,0.14)', color: 'var(--accent)',
                      letterSpacing: '0.08em',
                    }}>★ PR</span>
                  )}
                </div>
                <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600 }}>
                  {ficha?.nome ? ficha.nome.split('·')[0].trim() : `Ficha ${t.ficha_letra ?? '?'}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {t.volume_total > 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
                    {(t.volume_total / 1000).toFixed(1)}<span style={{ color: 'var(--muted-2)', fontSize: 10, fontWeight: 500, marginLeft: 1 }}>k</span>
                  </div>
                )}
                {t.duracao_min && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', marginTop: 1 }}>
                    {t.duracao_min}min
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {treinos.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            Nenhum treino registrado ainda.
          </div>
        )}
      </div>

      <div style={{ height: 20 }}/>
    </div>
  )
}
