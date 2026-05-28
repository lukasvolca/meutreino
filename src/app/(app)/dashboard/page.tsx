import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Icon from '@/components/icons'
import { BarChart } from '@/components/charts'
import DashboardHeroButton from './DashboardHeroButton'

// Helper: get Monday-based week key (YYYY-MM-DD)
function weekKey(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon.toISOString().split('T')[0]
}

// Today in local date string (server uses UTC; shift by -3h for BRT)
function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hoje = todayStr()
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - 90)
  const dataLimiteStr = dataLimite.toISOString().split('T')[0]

  const [{ data: profile }, { data: fichas }, { data: treinos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('fichas').select('*').eq('user_id', user!.id).order('ordem'),
    supabase.from('treinos').select('data, ficha_letra, ficha_id, duracao_min, volume_total')
      .eq('user_id', user!.id)
      .gte('data', dataLimiteStr)
      .order('data', { ascending: false })
      .limit(90),
  ])

  const fichaIds = (fichas ?? []).map(f => f.id)
  const { data: exerciciosCount } = fichaIds.length > 0
    ? await supabase.from('exercicios').select('ficha_id').in('ficha_id', fichaIds)
    : { data: [] }

  // Count exercises per ficha
  const exCountMap: Record<string, number> = {}
  for (const ex of exerciciosCount ?? []) {
    exCountMap[ex.ficha_id] = (exCountMap[ex.ficha_id] ?? 0) + 1
  }

  // Determine "ficha de hoje" — next in rotation after last treino
  const fichaList = fichas ?? []
  const treinoList = treinos ?? []
  const treinoHoje = treinoList.find(t => t.data === hoje)

  let fichaHoje = fichaList[0]
  if (!treinoHoje && fichaList.length > 1) {
    const lastTreino = treinoList[0]
    if (lastTreino?.ficha_id) {
      const lastIdx = fichaList.findIndex(f => f.id === lastTreino.ficha_id)
      if (lastIdx >= 0) fichaHoje = fichaList[(lastIdx + 1) % fichaList.length]
    }
  }

  // Weekly volume data (last 12 weeks)
  const weekVolumes: Record<string, number> = {}
  for (const t of treinoList) {
    const wk = weekKey(t.data)
    weekVolumes[wk] = (weekVolumes[wk] ?? 0) + (t.volume_total ?? 0)
  }
  const allWeeks = Object.keys(weekVolumes).sort()
  // Build last 12 weeks (including empty ones)
  const last12: number[] = []
  const weekLabels: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff - i * 7)
    const wk = d.toISOString().split('T')[0]
    last12.push(weekVolumes[wk] ?? 0)
    weekLabels.push(`${12 - i}s`)
  }
  weekLabels[0] = '12s'
  weekLabels[11] = '1s'

  const totalVolume12s = last12.reduce((s, v) => s + v, 0)
  const totalVolume12sPrev = allWeeks.slice(0, 12).reduce((s, wk) => s + (weekVolumes[wk] ?? 0), 0)

  // This week stats
  const startOfWeek = (() => {
    const d = new Date()
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    return d.toISOString().split('T')[0]
  })()

  const DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] // Mon-Sun
  const treinosEstaSemana = treinoList.filter(t => t.data >= startOfWeek)
  const diasTreinados = new Set(treinosEstaSemana.map(t => {
    const d = new Date(t.data + 'T12:00:00')
    return (d.getDay() + 6) % 7 // 0=Mon
  }))

  const treinosSemana = treinosEstaSemana.length
  const todayDow = (new Date().getDay() + 6) % 7 // 0=Mon

  const firstName = profile?.nome?.split(' ')[0] ?? 'você'
  const streak = profile?.streak ?? 0

  // Date label like "QUI · 21 MAI"
  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short'
  }).toUpperCase().replace(/\./g, '').replace(/(\w+)\s(\d+)\s(\w+)/, '$1 · $2 $3')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px' }}>
        <Link href="/perfil" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '-6px -8px', padding: '6px 8px', borderRadius: 12,
          textDecoration: 'none', color: 'inherit',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a2d36, #14161c)',
            border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
            color: 'var(--text)', letterSpacing: '-0.02em',
          }}>
            {(profile?.nome ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.16em' }}>
              {dateLabel}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', marginTop: 1 }}>
              Olá, {firstName}
            </div>
          </div>
        </Link>
        <Link href="/notificacoes" style={{
          width: 42, height: 42, borderRadius: 21,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
          color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', textDecoration: 'none',
        }}>
          <Icon name="bell" size={18}/>
          <div style={{ position: 'absolute', top: 9, right: 11, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}/>
        </Link>
      </div>

      {/* Hero: Treino de hoje */}
      {fichaHoje && (
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(20,22,28,0.95), rgba(26,29,37,0.95))',
            border: '1px solid var(--border)',
            borderRadius: 20,
            boxShadow: '0 0 0 1px rgba(204,255,0,0.25), 0 8px 24px rgba(204,255,0,0.08)',
            overflow: 'hidden',
          }}>
            <Link href={`/treino/${fichaHoje.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '18px 18px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div className="animate-pulse-slow" style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)',
                    }}/>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 500 }}>
                      {treinoHoje ? 'TREINO CONCLUÍDO' : 'TREINO DE HOJE'}
                    </span>
                    {treinoHoje && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px 3px 6px',
                        background: 'var(--accent)', color: 'var(--accent-ink)',
                        borderRadius: 6, fontFamily: 'var(--font-mono)',
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                        boxShadow: '0 0 16px rgba(204,255,0,0.4)',
                      }}>
                        <Icon name="check" size={10}/> FEITO!
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    Ficha {fichaHoje.letra}
                  </div>
                  <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>
                    {fichaHoje.nome.split(' · ').slice(1).join(' · ')}
                  </div>
                </div>
                <div style={{
                  width: 58, height: 58, borderRadius: 16,
                  background: fichaHoje.cor, color: 'var(--accent-ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 20px ${fichaHoje.cor}40`,
                }}>
                  <Icon name={fichaHoje.icone ?? 'dumbbell'} size={34} color="var(--accent-ink)" strokeWidth={1.9}/>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em' }}>EXERCÍCIOS</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginTop: 1 }}>
                    {exCountMap[fichaHoje.id] ?? 0}
                  </div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }}/>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em' }}>
                    DURAÇÃO{treinoHoje ? <span style={{ color: 'var(--accent)' }}> ✓</span> : ''}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginTop: 1, color: treinoHoje ? 'var(--accent)' : 'var(--text)' }}>
                    {treinoHoje?.duracao_min ?? fichaHoje.duracao_min ?? '—'}
                    <span style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 500, marginLeft: 2 }}>min</span>
                  </div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }}/>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em' }}>VOLUME</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginTop: 1 }}>
                    {treinoHoje?.volume_total
                      ? `${(treinoHoje.volume_total / 1000).toFixed(1)}k`
                      : '—'}
                    <span style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 500, marginLeft: 2 }}>kg</span>
                  </div>
                </div>
              </div>
            </Link>

            <div style={{ padding: '0 14px 14px' }}>
              <DashboardHeroButton
                fichaId={fichaHoje.id}
                fichaLetra={fichaHoje.letra ?? ''}
                cor={fichaHoje.cor ?? 'var(--accent)'}
                isCompleted={!!treinoHoje}
                duracaoMin={treinoHoje?.duracao_min ?? null}
              />
            </div>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div style={{ padding: '0 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Streak */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 20, padding: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500 }}>STREAK</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1, color: '#ffb547' }}>{streak}</span>
            <span style={{ fontSize: 12, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>dias</span>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 1, background: i < streak ? 'linear-gradient(180deg, #ff5e1f, #ffb547)' : 'rgba(255,255,255,0.06)' }}/>
            ))}
          </div>
        </div>

        {/* Semana */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 20, padding: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500 }}>SEMANA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {treinosSemana}
              <span style={{ color: 'var(--muted-3)', fontSize: 22 }}>/5</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {DIAS.map((d, i) => {
              const done = diasTreinados.has(i)
              const today = i === todayDow
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 18, borderRadius: 4,
                    background: today ? 'var(--accent)' : done ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
                    boxShadow: today ? '0 0 8px rgba(204,255,0,0.5)' : 'none',
                  }}/>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted-2)', marginTop: 3 }}>{d}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Volume chart */}
      <div style={{ padding: '0 20px 18px' }}>
        <Link href="/progresso" style={{
          display: 'block', textDecoration: 'none',
          background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 20, padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 500 }}>
                VOLUME · 12 SEMANAS
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {(totalVolume12s / 1000).toFixed(1)}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(11, 28 * 0.22), color: 'var(--muted-2)', fontWeight: 500, marginLeft: 4 }}>k kg</span>
                </div>
              </div>
            </div>
            <Icon name="chevronRight" size={18} color="var(--muted-2)"/>
          </div>
          <BarChart data={last12} width={370} height={90} labels={weekLabels} color="var(--accent)"/>
        </Link>
      </div>

      {/* Fichas */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>Suas fichas</h3>
        <Link href="/perfil" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Editar</Link>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fichaList.map(f => {
          const isHoje = fichaHoje?.id === f.id
          return (
            <Link key={f.id} href={`/treino/${f.id}`} style={{
              display: 'block', textDecoration: 'none',
              background: 'var(--surface-1)',
              border: `1px solid ${isHoje ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
              borderRadius: 20, padding: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: isHoje ? 'var(--accent)' : 'var(--surface-2)',
                  color: isHoje ? 'var(--accent-ink)' : 'var(--muted)',
                  border: isHoje ? 'none' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name={f.icone ?? 'dumbbell'} size={26}
                    color={isHoje ? 'var(--accent-ink)' : 'var(--muted)'}
                    strokeWidth={1.8}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
                      Ficha {f.letra}
                    </span>
                    {isHoje && !treinoHoje && (
                      <span style={{
                        padding: '4px 10px', borderRadius: 999,
                        background: 'rgba(204,255,0,0.14)', color: 'var(--accent)',
                        border: '1px solid rgba(204,255,0,0.4)',
                        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                        letterSpacing: '0.06em',
                      }}>HOJE</span>
                    )}
                    {isHoje && treinoHoje && (
                      <span style={{
                        padding: '2px 7px',
                        background: 'var(--accent)', color: 'var(--accent-ink)',
                        borderRadius: 4, fontFamily: 'var(--font-mono)',
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                      }}>✓ FEITO</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.nome.split(' · ').slice(1).join(' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                    <span>{exCountMap[f.id] ?? 0} EXS</span>
                    <span>·</span>
                    <span>~{f.duracao_min ?? '?'}MIN</span>
                  </div>
                </div>
                <Icon name="chevronRight" size={18} color="var(--muted-2)"/>
              </div>
            </Link>
          )
        })}

        {/* Nova ficha dashed */}
        <Link href="/perfil" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'transparent', border: '1px dashed var(--border-strong)',
          borderRadius: 20, padding: 14, textDecoration: 'none',
          color: 'var(--muted)', fontSize: 13, fontWeight: 600,
        }}>
          <Icon name="plus" size={16} color="var(--muted)"/>
          Nova ficha
        </Link>
      </div>

      <div style={{ height: 20 }}/>
    </div>
  )
}
