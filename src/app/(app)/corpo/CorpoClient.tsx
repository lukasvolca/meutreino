'use client'

import { useState } from 'react'
import { LineChart } from '@/components/charts'
import Icon from '@/components/icons'

type Medida = {
  id: string
  data: string
  peso: number | null
  altura: number | null
  gordura: number | null
  braco_d: number | null
  braco_e: number | null
  peito: number | null
  cintura: number | null
  quadril: number | null
  coxa_d: number | null
  coxa_e: number | null
  panturrilha: number | null
}

type Props = {
  medidas: Medida[]
  userId: string
}

function deltaOf(curr: number | null | undefined, prev: number | null | undefined) {
  if (curr == null || prev == null) return null
  return curr - prev
}

function DeltaPill({ d, invertGood = false }: { d: number | null; invertGood?: boolean }) {
  if (d == null) return null
  const isGood = invertGood ? d < 0 : d > 0
  const color = isGood ? '#6dffb0' : d === 0 ? 'var(--muted)' : '#ff4f5e'
  const bg = isGood ? 'rgba(109,255,176,0.14)' : d === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,79,94,0.14)'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 20,
      background: bg, color, border: `1px solid ${color}40`,
    }}>
      {d > 0 ? '+' : ''}{d.toFixed(1)}
    </span>
  )
}

function SilhouetteAnnotation({ m }: { m: Medida }) {
  const acc = 'var(--accent)'
  const annotations = [
    { top: '18%', side: 'left' as const, label: 'BRAÇO', val: m.braco_d != null ? `${m.braco_d}cm` : '—' },
    { top: '36%', side: 'right' as const, label: 'PEITO', val: m.peito != null ? `${m.peito}cm` : '—' },
    { top: '52%', side: 'left' as const, label: 'CINTURA', val: m.cintura != null ? `${m.cintura}cm` : '—' },
    { top: '70%', side: 'right' as const, label: 'COXA', val: m.coxa_d != null ? `${m.coxa_d}cm` : '—' },
  ]
  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden',
      background: 'linear-gradient(135deg, var(--surface-1), var(--surface-2))',
      border: '1px solid var(--border)',
    }}>
      <div style={{ position: 'relative', height: 260, padding: 16 }}>
        <svg width="100%" height="100%" viewBox="0 0 200 240" style={{ display: 'block', margin: '0 auto', maxWidth: 160 }}>
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={acc} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={acc} stopOpacity="0.15"/>
            </linearGradient>
          </defs>
          <circle cx="100" cy="22" r="14" fill="none" stroke={acc} strokeWidth="1.5" opacity="0.85"/>
          <path d="M75 42 Q72 50 78 56 L72 90 Q70 110 75 130 L88 175 L82 220 L92 222 L95 180 L100 175 L105 180 L108 222 L118 220 L112 175 L125 130 Q130 110 128 90 L122 56 Q128 50 125 42 Q113 38 100 38 Q87 38 75 42 Z"
            fill="url(#bodyGrad)" stroke={acc} strokeWidth="1.5" opacity="0.9"/>
          <path d="M75 50 L62 70 L56 100 L50 120" fill="none" stroke={acc} strokeWidth="1.5" opacity="0.85" strokeLinecap="round"/>
          <path d="M125 50 L138 70 L144 100 L150 120" fill="none" stroke={acc} strokeWidth="1.5" opacity="0.85" strokeLinecap="round"/>
        </svg>
        {annotations.map((a, i) => (
          <div key={i} style={{
            position: 'absolute', [a.side]: 8, top: a.top,
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(204,255,0,0.25)',
            borderRadius: 8, padding: '4px 8px',
            display: 'flex', flexDirection: 'column', gap: 1,
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>{a.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: acc, fontWeight: 700 }}>{a.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CorpoClient({ medidas, userId }: Props) {
  const [tab, setTab] = useState<'atual' | 'historico' | 'foto'>('atual')

  const atual = medidas[0]
  const anterior = medidas[1]

  const imc = atual?.peso && atual?.altura ? atual.peso / ((atual.altura / 100) ** 2) : null

  const campos = [
    { key: 'braco_d' as const, label: 'Braço direito', unit: 'cm' },
    { key: 'braco_e' as const, label: 'Braço esquerdo', unit: 'cm' },
    { key: 'peito' as const, label: 'Peito', unit: 'cm' },
    { key: 'cintura' as const, label: 'Cintura', unit: 'cm', invertGood: true },
    { key: 'quadril' as const, label: 'Quadril', unit: 'cm' },
    { key: 'coxa_d' as const, label: 'Coxa direita', unit: 'cm' },
    { key: 'coxa_e' as const, label: 'Coxa esquerda', unit: 'cm' },
    { key: 'panturrilha' as const, label: 'Panturrilha', unit: 'cm' },
  ]

  const pesoHist = [...medidas].reverse().map(m => m.peso ?? 0).filter(v => v > 0)
  const gorduraHist = [...medidas].reverse().map(m => m.gordura ?? 0).filter(v => v > 0)
  const histLabels = [...medidas].reverse().map(m => m.data.slice(5).replace('-', '/'))

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '0 20px 4px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {'> SEÇÃO 03'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1 }}>
          Corpo
        </div>
        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
          {atual ? `última medição · ${atual.data.split('-').reverse().join('/')}` : 'Nenhuma medição registrada'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 20px 10px', display: 'flex', gap: 4 }}>
        {([
          { id: 'atual', label: 'Atual' },
          { id: 'historico', label: 'Histórico' },
          { id: 'foto', label: 'Fotos' },
        ] as const).map(t => (
          <button key={t.id} className="tappable" onClick={() => setTab(t.id)} style={{
            flex: 1, height: 36, cursor: 'pointer',
            background: tab === t.id ? 'var(--surface-2)' : 'transparent',
            border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--muted)',
            borderRadius: 10, fontSize: 12, fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'atual' && (
        <>
          {!atual ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Nenhuma medição registrada.<br/>
              <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Adicione sua primeira medição abaixo.</span>
            </div>
          ) : (
            <>
              {/* Top metrics */}
              <div style={{ padding: '4px 20px 14px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>PESO</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, letterSpacing: '-0.04em', lineHeight: 1 }}>{atual.peso?.toFixed(1)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>kg</span>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <DeltaPill d={deltaOf(atual.peso, anterior?.peso)} invertGood={false}/>
                    <span style={{ fontSize: 10, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>30d</span>
                  </div>
                </div>
                <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>IMC</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, letterSpacing: '-0.04em', lineHeight: 1 }}>{imc?.toFixed(1)}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(204,255,0,0.14)', color: 'var(--accent)',
                      border: '1px solid rgba(204,255,0,0.3)',
                    }}>
                      {imc != null && imc < 18.5 ? 'ABAIXO' : imc != null && imc < 25 ? 'NORMAL' : 'SOBREP.'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>% GORDURA</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>{atual.gordura?.toFixed(1)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>%</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <DeltaPill d={deltaOf(atual.gordura, anterior?.gordura)} invertGood={true}/>
                  </div>
                </div>
                <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>ALTURA</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>{atual.altura}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>cm</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)' }}>fixa</div>
                </div>
              </div>

              {/* Silhouette */}
              <div style={{ padding: '0 20px 14px' }}>
                <SilhouetteAnnotation m={atual}/>
              </div>

              {/* Measurements list */}
              <div style={{ padding: '0 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Circunferências</div>
              </div>
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {campos.map(({ key, label, unit, invertGood }) => {
                  const val = atual[key]
                  if (val == null) return null
                  const d = deltaOf(val, anterior?.[key])
                  return (
                    <div key={key} style={{
                      padding: 12, borderRadius: 16,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {val}<span style={{ color: 'var(--muted-2)', fontSize: 11, fontWeight: 500, marginLeft: 2 }}>{unit}</span>
                        </span>
                        {d != null && (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                            color: (invertGood ? d < 0 : d > 0) ? '#6dffb0' : d === 0 ? 'var(--muted)' : '#ff4f5e',
                            minWidth: 38, textAlign: 'right',
                          }}>
                            {d > 0 ? '+' : ''}{d.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ height: 20 }}/>
            </>
          )}
        </>
      )}

      {tab === 'historico' && (
        <>
          {pesoHist.length > 1 ? (
            <>
              <div style={{ padding: '4px 20px 14px' }}>
                <div style={{ padding: 16, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>PESO · {medidas.length} MEDIÇÕES</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>{atual?.peso?.toFixed(1)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>kg</span>
                  </div>
                  <LineChart data={pesoHist} labels={histLabels.slice(-pesoHist.length)} width={360} height={170} chartId="peso" responsive/>
                </div>
              </div>
              {gorduraHist.length > 1 && (
                <div style={{ padding: '0 20px 14px' }}>
                  <div style={{ padding: 16, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>% GORDURA</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 10 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>{atual?.gordura?.toFixed(1)}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>%</span>
                    </div>
                    <LineChart data={gorduraHist} labels={histLabels.slice(-gorduraHist.length)} width={360} height={150} color="#ffb547" chartId="gordura" responsive/>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Registre pelo menos 2 medições para ver o histórico.
            </div>
          )}

          {medidas.length > 0 && (
            <>
              <div style={{ padding: '0 20px 6px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Medições anteriores</div>
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {medidas.map(m => (
                  <div key={m.id} style={{
                    padding: 12, borderRadius: 16,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
                        {m.data.split('-').reverse().join('/')}
                      </div>
                      <div style={{ marginTop: 2, fontSize: 13, color: 'var(--muted)' }}>Peso · gordura · medidas completas</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>KG</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{m.peso}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>% GORD</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{m.gordura}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ height: 20 }}/>
        </>
      )}

      {tab === 'foto' && (
        <>
          <div style={{ padding: '4px 20px 14px' }}>
            <div style={{ padding: 16, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>COMPARAÇÃO · ANTES / DEPOIS</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['Antes', 'Depois'].map((label, i) => (
                  <div key={i} style={{
                    aspectRatio: '3/4', borderRadius: 12,
                    background: `repeating-linear-gradient(${i ? 135 : 45}deg, rgba(255,255,255,0.04) 0 4px, rgba(255,255,255,0.02) 4px 12px)`,
                    border: '1px dashed rgba(255,255,255,0.12)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <Icon name="camera" size={28} color="rgba(255,255,255,0.18)"/>
                    <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
                      ARRASTE A FOTO
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13, cursor: 'not-allowed' }}>
                <Icon name="camera" size={16}/>
                Tirar nova foto (em breve)
              </div>
            </div>
          </div>
          <div style={{ height: 20 }}/>
        </>
      )}
    </div>
  )
}
