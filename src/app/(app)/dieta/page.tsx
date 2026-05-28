'use client'

import { useState } from 'react'
import Icon from '@/components/icons'

const MACRO_COLORS = {
  c: '#ffb547',
  p: '#ff5e1f',
  g: '#6dadff',
}

type Ingrediente = { nome: string; qtd: string; c: number; p: number; g: number }
type Refeicao = {
  id: string; nome: string; horario: string
  kcal: number; c: number; p: number; g: number
  ingredientes: Ingrediente[]
  preparo: string
  ytId?: string
}

const DIETA_ALVO = { kcal: 2800, c: 320, p: 200, g: 75 }

const REFEICOES: Refeicao[] = [
  {
    id: 'r1', nome: 'Café da manhã', horario: '07:00',
    kcal: 520, c: 62, p: 32, g: 14,
    ingredientes: [
      { nome: 'Aveia em flocos finos', qtd: '60g', c: 36, p: 8, g: 4 },
      { nome: 'Leite desnatado', qtd: '200ml', c: 10, p: 7, g: 0 },
      { nome: 'Banana nanica', qtd: '1 un (100g)', c: 23, p: 1, g: 0 },
      { nome: 'Ovo inteiro', qtd: '2 un', c: 1, p: 12, g: 10 },
      { nome: 'Pasta de amendoim', qtd: '15g', c: 3, p: 4, g: 8 },
    ],
    preparo: 'Aqueça o leite e despeje sobre a aveia, mexa até engrossar (3min). Adicione a banana picada e a pasta de amendoim por cima. Os ovos vão mexidos numa frigideira antiaderente em fogo médio, sem óleo.',
    ytId: 'tH3ZN5FYKHs',
  },
  {
    id: 'r2', nome: 'Lanche da manhã', horario: '10:00',
    kcal: 280, c: 32, p: 18, g: 8,
    ingredientes: [
      { nome: 'Iogurte natural integral', qtd: '170g', c: 8, p: 10, g: 5 },
      { nome: 'Granola sem açúcar', qtd: '30g', c: 18, p: 4, g: 3 },
      { nome: 'Maçã fuji', qtd: '1 un', c: 22, p: 0, g: 0 },
      { nome: 'Whey protein (opcional)', qtd: '15g', c: 1, p: 12, g: 0 },
    ],
    preparo: 'Monte uma tigela com o iogurte, jogue a granola por cima, fatias da maçã e — se for dia de treino — uma colher de whey misturada antes.',
    ytId: '',
  },
  {
    id: 'r3', nome: 'Almoço', horario: '12:30',
    kcal: 720, c: 78, p: 55, g: 16,
    ingredientes: [
      { nome: 'Arroz integral cozido', qtd: '150g', c: 35, p: 4, g: 1 },
      { nome: 'Feijão carioca', qtd: '120g', c: 25, p: 9, g: 1 },
      { nome: 'Frango grelhado (peito)', qtd: '180g', c: 0, p: 42, g: 6 },
      { nome: 'Salada (folhas + tomate)', qtd: 'à vontade', c: 6, p: 2, g: 0 },
      { nome: 'Azeite extra virgem', qtd: '1 cs', c: 0, p: 0, g: 14 },
    ],
    preparo: 'Tempere o frango com sal, alho e páprica e grelhe 4min de cada lado. Sirva com o arroz, feijão e salada. Regue a salada com o azeite só na hora de comer.',
    ytId: '8K3wgrEpSr8',
  },
  {
    id: 'r4', nome: 'Lanche da tarde', horario: '16:00',
    kcal: 320, c: 38, p: 14, g: 10,
    ingredientes: [
      { nome: 'Pão integral', qtd: '2 fatias', c: 26, p: 6, g: 2 },
      { nome: 'Queijo branco light', qtd: '40g', c: 1, p: 6, g: 4 },
      { nome: 'Peito de peru', qtd: '40g', c: 1, p: 8, g: 1 },
      { nome: 'Castanha-do-pará', qtd: '2 un', c: 1, p: 1, g: 4 },
      { nome: 'Café preto sem açúcar', qtd: '200ml', c: 0, p: 0, g: 0 },
    ],
    preparo: 'Monte o sanduíche, esquente 20s no micro se preferir. As castanhas vão à parte — não exagere, 2 por dia já basta.',
    ytId: '',
  },
  {
    id: 'r5', nome: 'Pré-treino', horario: '18:30',
    kcal: 280, c: 50, p: 14, g: 2,
    ingredientes: [
      { nome: 'Tapioca', qtd: '40g (massa)', c: 32, p: 0, g: 0 },
      { nome: 'Banana prata', qtd: '1 un', c: 22, p: 1, g: 0 },
      { nome: 'Whey protein isolado', qtd: '20g', c: 1, p: 16, g: 0 },
      { nome: 'Mel', qtd: '1 cc', c: 6, p: 0, g: 0 },
    ],
    preparo: 'Faça a tapioca na frigideira (sem óleo). Recheie com a banana amassada e mel. Tome o whey com água 30min antes do treino.',
    ytId: 'd7zwlIuFQEM',
  },
  {
    id: 'r6', nome: 'Pós-treino / Jantar', horario: '21:00',
    kcal: 680, c: 60, p: 60, g: 18,
    ingredientes: [
      { nome: 'Batata-doce assada', qtd: '200g', c: 40, p: 3, g: 0 },
      { nome: 'Salmão grelhado', qtd: '150g', c: 0, p: 32, g: 12 },
      { nome: 'Brócolis no vapor', qtd: '150g', c: 10, p: 5, g: 0 },
      { nome: 'Ovo cozido', qtd: '2 un', c: 1, p: 12, g: 10 },
      { nome: 'Limão + ervas', qtd: 'a gosto', c: 0, p: 0, g: 0 },
    ],
    preparo: 'Asse a batata-doce em fatias com sal e azeite por 25min a 200°C. Grelhe o salmão temperado com limão, sal e ervas — 4min de cada lado. O brócolis cozinha 5min no vapor — não passa do ponto.',
    ytId: 'oUugWXVB6sc',
  },
]

function MacroBar({ value, target, color, label, unit = 'g' }: {
  value: number; target: number; color: string; label: string; unit?: string
}) {
  const pct = Math.min(1, value / Math.max(1, target))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color, fontWeight: 700 }}>{Math.round(value)}</span>
          <span style={{ color: 'var(--muted-3)' }}>/{target}{unit}</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 3, boxShadow: `0 0 6px ${color}80` }}/>
      </div>
    </div>
  )
}

function MacroSplit({ c, p, g, height = 5 }: { c: number; p: number; g: number; height?: number }) {
  const ck = c * 4, pk = p * 4, gk = g * 9
  const total = Math.max(1, ck + pk + gk)
  return (
    <div style={{ display: 'flex', height, background: 'rgba(255,255,255,0.06)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ width: `${(ck / total) * 100}%`, background: MACRO_COLORS.c }}/>
      <div style={{ width: `${(pk / total) * 100}%`, background: MACRO_COLORS.p }}/>
      <div style={{ width: `${(gk / total) * 100}%`, background: MACRO_COLORS.g }}/>
    </div>
  )
}

function MacroDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}/>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>
        {label} <span style={{ color: 'var(--text)', fontWeight: 700 }}>{value}g</span>
      </span>
    </div>
  )
}

function MealCard({ r, expanded, onToggle, eaten, onToggleEaten }: {
  r: Refeicao; expanded: boolean; onToggle: () => void; eaten: boolean; onToggleEaten: () => void
}) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: `1px solid ${eaten ? 'rgba(204,255,0,0.4)' : 'var(--border)'}`,
      borderRadius: 18, overflow: 'hidden', position: 'relative',
    }}>
      {/* Header */}
      <div className="tappable" onClick={onToggle}
        style={{ padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <button onClick={e => { e.stopPropagation(); onToggleEaten() }} className="tappable"
          style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0, border: 0, cursor: 'pointer',
            background: eaten ? 'var(--accent)' : 'var(--surface-2)',
            color: eaten ? 'var(--accent-ink)' : 'var(--muted)',
            outline: eaten ? 'none' : '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: eaten ? '0 0 10px rgba(204,255,0,0.4)' : 'none',
          }}>
          {eaten ? <Icon name="check" size={16} strokeWidth={2.6}/> : r.horario}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em',
            color: eaten ? 'var(--muted)' : 'var(--text)',
            textDecoration: eaten ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{r.nome}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>{r.kcal}</span> kcal
            </span>
            <span style={{ color: 'var(--muted-3)', fontSize: 10 }}>·</span>
            <MacroDot color={MACRO_COLORS.c} label="C" value={r.c}/>
            <MacroDot color={MACRO_COLORS.p} label="P" value={r.p}/>
            <MacroDot color={MACRO_COLORS.g} label="G" value={r.g}/>
          </div>
        </div>
        <div style={{
          width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted-2)', transition: 'transform 220ms cubic-bezier(.4,.2,.2,1)',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <Icon name="chevronDown" size={16}/>
        </div>
      </div>

      {expanded && (
        <div className="animate-fade-in">
          {/* Macro split */}
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <MacroSplit c={r.c} p={r.p} g={r.g}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>
              <span>{Math.round((r.c * 4 / r.kcal) * 100)}% carbo</span>
              <span>{Math.round((r.p * 4 / r.kcal) * 100)}% prot</span>
              <span>{Math.round((r.g * 9 / r.kcal) * 100)}% gord</span>
            </div>
          </div>

          {/* Ingredientes */}
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              INGREDIENTES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {r.ingredientes.map((ing, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8,
                  padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>{ing.nome}</div>
                    <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>{ing.qtd}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: MACRO_COLORS.c }}>{ing.c}<span style={{ color: 'var(--muted-3)' }}>c</span></span>
                    <span style={{ color: MACRO_COLORS.p }}>{ing.p}<span style={{ color: 'var(--muted-3)' }}>p</span></span>
                    <span style={{ color: MACRO_COLORS.g }}>{ing.g}<span style={{ color: 'var(--muted-3)' }}>g</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modo de preparo */}
          {r.preparo && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                MODO DE PREPARO
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{r.preparo}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '0 14px 14px' }}>
            {r.ytId ? (
              <a href={`https://www.youtube-nocookie.com/watch?v=${r.ytId}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  height: 38, borderRadius: 12, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 12.5, fontWeight: 600,
                }}>
                <Icon name="playCircle" size={15} color="var(--accent)"/>
                Ver tutorial em vídeo
              </a>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 38, borderRadius: 12,
                background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)',
                color: 'var(--muted-2)', fontSize: 12, fontStyle: 'italic',
              }}>Sem tutorial pra essa</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DietaPage() {
  const [expandedId, setExpandedId] = useState<string | null>(REFEICOES[0]?.id ?? null)
  const [eaten, setEaten] = useState<Set<string>>(new Set())

  const total = REFEICOES.reduce((a, r) => ({ kcal: a.kcal + r.kcal, c: a.c + r.c, p: a.p + r.p, g: a.g + r.g }), { kcal: 0, c: 0, p: 0, g: 0 })
  const kcalPct = Math.min(1, total.kcal / DIETA_ALVO.kcal)
  const eatenCount = eaten.size

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.16em' }}>
            DIETA · {hoje}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', marginTop: 2, lineHeight: 1 }}>
            Plano de hoje
          </div>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 21,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
          color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="calendar" size={18}/>
        </div>
      </div>

      {/* Macros card */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ padding: 18, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>CALORIAS</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, letterSpacing: '-0.04em', lineHeight: 1 }}>{total.kcal}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted-2)' }}>/{DIETA_ALVO.kcal} kcal</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
                {Math.round(kcalPct * 100)}% do alvo · {Math.abs(total.kcal - DIETA_ALVO.kcal)} kcal {total.kcal > DIETA_ALVO.kcal ? 'acima' : 'restantes'}
              </div>
            </div>
            <div style={{
              padding: '6px 10px',
              background: 'rgba(204,255,0,0.14)', border: '1px solid rgba(204,255,0,0.4)',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: 'var(--accent)', letterSpacing: '0.08em',
            }}>HIPERTROFIA</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <MacroSplit c={total.c} p={total.p} g={total.g} height={8}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MacroBar label="CARBOIDRATO" value={total.c} target={DIETA_ALVO.c} color={MACRO_COLORS.c}/>
            <MacroBar label="PROTEÍNA" value={total.p} target={DIETA_ALVO.p} color={MACRO_COLORS.p}/>
            <MacroBar label="GORDURA" value={total.g} target={DIETA_ALVO.g} color={MACRO_COLORS.g}/>
          </div>
        </div>
      </div>

      {/* Refeições */}
      <div style={{ padding: '0 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Refeições</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>{eatenCount}/{REFEICOES.length} feitas</div>
      </div>

      <div style={{ padding: '4px 20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {REFEICOES.map(r => (
          <MealCard key={r.id} r={r}
            expanded={expandedId === r.id}
            onToggle={() => setExpandedId(prev => prev === r.id ? null : r.id)}
            eaten={eaten.has(r.id)}
            onToggleEaten={() => {
              setEaten(prev => {
                const n = new Set(prev)
                if (n.has(r.id)) n.delete(r.id); else n.add(r.id)
                return n
              })
            }}
          />
        ))}
      </div>

      {/* Nutritionist card */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: '#6dffb0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="body" size={20} strokeWidth={1.8}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>NUTRICIONISTA</div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: 'var(--muted)' }}>
                Não vinculado
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            height: 46, background: 'var(--surface-2)',
            color: 'var(--muted-2)', fontWeight: 700, fontSize: 13.5,
            borderTop: '1px solid var(--border)', opacity: 0.5,
          }}>
            <Icon name="chat" size={16} strokeWidth={2}/>
            Entrar em contato
          </div>
        </div>
      </div>
    </div>
  )
}
