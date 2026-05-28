'use client'

import { useState } from 'react'
import { LineChart, BarChart } from '@/components/charts'

export type ExercicioProgresso = {
  id: string
  nome: string
  grupo: string
  ficha: string
  historico: { week: string; maxCarga: number }[]
  pr: number
  delta: number
}

type Props = {
  exercicios: ExercicioProgresso[]
  weeklyVolume: { week: string; vol: number }[]
  treinosMes: number
  freqSemanal: number
}

const PERIOD_WEEKS: Record<string, number> = { '4s': 4, '12s': 12, '6m': 26, '1a': 52 }

export default function ProgressoClient({ exercicios, weeklyVolume, treinosMes, freqSemanal }: Props) {
  const [selectedId, setSelectedId] = useState(exercicios[0]?.id ?? '')
  const [period, setPeriod] = useState<'4s' | '12s' | '6m' | '1a'>('12s')

  const selected = exercicios.find(e => e.id === selectedId) ?? exercicios[0]

  if (!selected) return (
    <div style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--muted)' }}>
      Complete seu primeiro treino para ver o progresso.
    </div>
  )

  const weeks = PERIOD_WEEKS[period]
  const filtered = selected.historico.slice(-weeks)
  const chartData = filtered.map(h => h.maxCarga)
  const chartLabels = filtered.map(h => h.week.slice(5).replace('-', '/'))

  const periodFirst = filtered[0]?.maxCarga ?? 0
  const periodLast = filtered[filtered.length - 1]?.maxCarga ?? 0
  const periodDelta = periodLast - periodFirst
  const deltaPct = periodFirst > 0 ? (periodDelta / periodFirst) * 100 : 0

  // Top 4 PRs by lifetime delta
  const topPRs = [...exercicios]
    .filter(e => e.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4)

  const volData = weeklyVolume.map(w => w.vol)
  const volLabels = weeklyVolume.map((_, i) => `${weeklyVolume.length - i}s`).reverse()
  const currentWeekVol = weeklyVolume[weeklyVolume.length - 1]?.vol ?? 0

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            {'> SEÇÃO 02'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1 }}>
            Progresso
          </div>
        </div>
        {deltaPct !== 0 && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(109,255,176,0.14)', color: '#6dffb0',
            border: '1px solid rgba(109,255,176,0.28)',
          }}>
            {deltaPct > 0 ? '↑' : '↓'} {Math.abs(deltaPct).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Exercise selector */}
      <div style={{ padding: '14px 20px 12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          EXERCÍCIO
        </div>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20,
          scrollbarWidth: 'none',
        }}>
          {exercicios.map(e => (
            <button key={e.id} onClick={() => setSelectedId(e.id)}
              className="tappable"
              style={{
                padding: '8px 12px', borderRadius: 10, flexShrink: 0,
                background: e.id === selectedId ? 'var(--accent)' : 'var(--surface-1)',
                color: e.id === selectedId ? 'var(--accent-ink)' : 'var(--text)',
                border: e.id === selectedId ? 'none' : '1px solid var(--border)',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer',
              }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                padding: '1px 4px', borderRadius: 3,
                background: e.id === selectedId ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)',
              }}>{e.ficha}</span>
              {e.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart card */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          padding: 16, borderRadius: 18,
          background: 'var(--surface-1)',
          border: '1px solid rgba(204,255,0,0.18)',
          boxShadow: '0 0 24px rgba(204,255,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                CARGA · 1RM EFETIVO
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>
                {selected.nome}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', color: 'var(--accent)', lineHeight: 1 }}>
                  {periodLast > 0 ? periodLast.toFixed(1) : '—'}
                </span>
                {periodLast > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>kg</span>
                )}
              </div>
              {periodDelta > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6dffb0', marginTop: 2, fontWeight: 600 }}>
                  +{periodDelta.toFixed(1)}kg no período
                </div>
              )}
            </div>
          </div>

          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, marginBottom: 12, padding: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
            {(['4s', '12s', '6m', '1a'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="tappable"
                style={{
                  flex: 1, height: 28, border: 0, cursor: 'pointer',
                  background: period === p ? 'var(--surface-3)' : 'transparent',
                  color: period === p ? 'var(--text)' : 'var(--muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  borderRadius: 7,
                }}>{p}</button>
            ))}
          </div>

          {chartData.length > 1 ? (
            <LineChart
              data={chartData}
              labels={chartLabels}
              width={360}
              height={180}
              chartId={`prog-${selectedId}-${period}`}
              responsive
            />
          ) : (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Dados insuficientes para este período
            </div>
          )}
        </div>
      </div>

      {/* PRs */}
      {topPRs.length > 0 && (
        <>
          <div style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Recordes recentes</div>
          </div>
          <div style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {topPRs.map(p => (
              <div key={p.id} style={{
                padding: 12, borderRadius: 16,
                background: 'var(--surface-1)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    padding: '1px 5px', borderRadius: 3,
                    background: 'rgba(255,255,255,0.06)', color: 'var(--muted)',
                  }}>{p.ficha} · {p.grupo}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, lineHeight: 1.2, height: 32, overflow: 'hidden' }}>
                  {p.nome}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1 }}>{p.pr.toFixed(1)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>kg</span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 20,
                    background: 'rgba(109,255,176,0.12)', color: '#6dffb0',
                    border: '1px solid rgba(109,255,176,0.24)',
                  }}>+{p.delta.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Volume semanal */}
      <div style={{ padding: '0 20px 6px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
        Volume semanal
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ padding: 16, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {currentWeekVol >= 1000 ? (currentWeekVol / 1000).toFixed(1) + 'k' : currentWeekVol}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>kg · esta semana</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>kg movidos</span>
          </div>
          {volData.length > 0 && (
            <BarChart
              data={volData}
              labels={volLabels}
              width={360}
              height={120}
              responsive
            />
          )}
        </div>
      </div>

      {/* Sessions stats */}
      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>SESSÕES · MÊS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1 }}>{treinosMes}</div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>este mês</div>
        </div>
        <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>FREQ. SEMANAL</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1 }}>{freqSemanal.toFixed(1)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>× / sem</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>últimas 12 sem.</div>
        </div>
      </div>
    </div>
  )
}
