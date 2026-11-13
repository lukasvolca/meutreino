'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/icons'
import { createClient, limite } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { type Alimento, type ItemPorcao, REFEICOES_PADRAO, alimentoDoUsuario, soma } from '@/lib/dieta'
import { addDays } from '@/lib/date'
import AddFoodSheet from './AddFoodSheet'
import MetaSheet from './MetaSheet'
import PlanoSheet, { itensDo, type PlanoRow } from './PlanoSheet'
import { MACRO_COLORS, MacroBar, MacroLine, btn, label } from './ui'

type Meta = Database['public']['Tables']['metas_nutricionais']['Row']
type Registro = Database['public']['Tables']['diario_alimentar']['Row']
type AlimentoUsuario = Database['public']['Tables']['alimentos_usuario']['Row']
type Recente = Pick<Registro, 'alimento_ref' | 'nome' | 'gramas' | 'kcal' | 'proteina' | 'carbo' | 'gordura'>

export type DietaProps = {
  userId: string
  data: string
  hoje: string
  meta: Meta | null
  plano: PlanoRow[]
  diario: Registro[]
  recentes: Recente[]
  alimentos: AlimentoUsuario[]
  pesoMedido: number | null
  alturaMedida: number | null
  objetivo: string | null
}

function rotuloData(data: string, hoje: string) {
  if (data === hoje) return 'Hoje'
  if (data === addDays(hoje, -1)) return 'Ontem'
  return new Date(data + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' })
}

export default function DietaClient(props: DietaProps) {
  const { userId, data, hoje } = props
  const supabase = createClient()
  const [meta, setMeta] = useState(props.meta)
  const [plano, setPlanoState] = useState(props.plano)
  const [diario, setDiario] = useState(props.diario)
  const [meus, setMeus] = useState<Alimento[]>(() => props.alimentos.map(alimentoDoUsuario))
  const [sheet, setSheet] = useState<null | { tipo: 'meta' } | { tipo: 'plano' } | { tipo: 'add'; refeicao: string }>(null)
  const [abertas, setAbertas] = useState<Set<string>>(() => new Set())
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const setPlano = (fn: (p: PlanoRow[]) => PlanoRow[]) => setPlanoState(fn)

  // Recentes: último uso de cada alimento, com valores por 100 g recalculados
  const recentes = useMemo<Alimento[]>(() => {
    const vistos = new Set<string>()
    const out: Alimento[] = []
    const fonte: Recente[] = [...[...diario].reverse(), ...props.recentes]
    for (const r of fonte) {
      const chave = r.alimento_ref ?? r.nome
      if (vistos.has(chave) || !r.gramas) continue
      vistos.add(chave)
      const f = 100 / Number(r.gramas)
      out.push({
        ref: r.alimento_ref ?? `livre:${r.nome}`, nome: r.nome, categoria: 'Recentes',
        por100: { kcal: r.kcal * f, proteina: r.proteina * f, carbo: r.carbo * f, gordura: r.gordura * f },
        medidas: [], porcaoPadrao: Number(r.gramas),
      })
      if (out.length >= 12) break
    }
    return out
  }, [diario, props.recentes])

  const total = soma(diario)
  const planoOrdenado = useMemo(() => [...plano].sort((a, b) => a.ordem - b.ordem), [plano])

  // Grupos do dia: refeições do plano (ou padrão) + o que foi registrado fora delas
  const grupos = useMemo(() => {
    const base = planoOrdenado.length
      ? planoOrdenado.map(p => ({ nome: p.nome, horario: p.horario, plano: p as PlanoRow | null }))
      : REFEICOES_PADRAO.map(nome => ({ nome, horario: null as string | null, plano: null as PlanoRow | null }))
    const nomes = new Set(base.map(b => b.nome))
    const extras = [...new Set(diario.map(d => d.refeicao))].filter(n => !nomes.has(n))
    return [...base, ...extras.map(nome => ({ nome, horario: null as string | null, plano: null as PlanoRow | null }))]
  }, [planoOrdenado, diario])

  const falhou = () => setErro('Não deu para salvar (sem conexão?). Tente de novo.')

  async function adicionar(refeicao: string, itens: ItemPorcao[], planoId: string | null = null): Promise<boolean> {
    setErro(null)
    const { data: rows, error } = await supabase.from('diario_alimentar').insert(itens.map(it => ({
      user_id: userId, data, refeicao, plano_refeicao_id: planoId,
      alimento_ref: it.ref?.startsWith('livre:') ? null : it.ref,
      nome: it.nome, gramas: it.gramas, kcal: it.kcal, proteina: it.proteina, carbo: it.carbo, gordura: it.gordura,
    }))).select().abortSignal(limite())
    if (error || !rows) { falhou(); return false }
    setDiario(d => [...d, ...rows])
    return true
  }

  async function comiPlano(p: PlanoRow) {
    const itens = itensDo(p)
    if (!itens.length) { setSheet({ tipo: 'plano' }); return }
    setOcupado(p.id)
    await adicionar(p.nome, itens, p.id)
    setOcupado(null)
  }

  async function remover(id: string) {
    const antes = diario
    setDiario(d => d.filter(r => r.id !== id))
    const { error } = await supabase.from('diario_alimentar').delete().eq('id', id).abortSignal(limite())
    if (error) { setDiario(antes); falhou() }
  }

  async function desfazerPlano(nome: string, planoId: string) {
    const ids = diario.filter(r => r.refeicao === nome && r.plano_refeicao_id === planoId).map(r => r.id)
    const antes = diario
    setDiario(d => d.filter(r => !ids.includes(r.id)))
    const { error } = await supabase.from('diario_alimentar').delete().in('id', ids).abortSignal(limite())
    if (error) { setDiario(antes); falhou() }
  }

  const toggle = (nome: string) => setAbertas(s => { const n = new Set(s); if (n.has(nome)) n.delete(nome); else n.add(nome); return n })

  const kcalMeta = meta?.kcal ?? 0
  const restante = kcalMeta - total.kcal
  const pct = kcalMeta ? Math.min(1, total.kcal / kcalMeta) : 0

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Cabeçalho com navegação entre dias */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px', gap: 12 }}>
        <div>
          <div style={{ ...label, letterSpacing: '0.16em' }}>Dieta</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', marginTop: 2, lineHeight: 1 }}>
            {rotuloData(data, hoje)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/dieta/?data=${addDays(data, -1)}`} aria-label="Dia anterior" style={navBtn}><Icon name="chevronLeft" size={18}/></Link>
          {data < hoje
            ? <Link href={data === addDays(hoje, -1) ? '/dieta/' : `/dieta/?data=${addDays(data, 1)}`} aria-label="Próximo dia" style={navBtn}><Icon name="chevronRight" size={18}/></Link>
            : <span style={{ ...navBtn, opacity: 0.3 }}><Icon name="chevronRight" size={18}/></span>}
        </div>
      </div>

      {/* Resumo do dia */}
      <div style={{ padding: '0 20px 18px' }}>
        {meta ? (
          <div style={{ padding: 18, borderRadius: 20, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={label}>Calorias</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em', lineHeight: 1 }}>{Math.round(total.kcal)}</span>
                  <span style={{ fontSize: 15, color: 'var(--muted)' }}>/ {kcalMeta} kcal</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 14, color: restante < 0 ? 'var(--warn)' : 'var(--muted)' }}>
                  {restante >= 0 ? `Faltam ${Math.round(restante)} kcal` : `${Math.round(-restante)} kcal acima da meta`}
                </div>
              </div>
              <button onClick={() => setSheet({ tipo: 'meta' })} style={{ ...btn('ghost'), height: 36, fontSize: 13, padding: '0 12px' }}>
                <Icon name="target" size={15}/> Meta
              </button>
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden', margin: '16px 0 18px' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', background: restante < 0 ? 'var(--warn)' : 'var(--accent)', borderRadius: 5, transition: 'width 300ms ease' }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MacroBar name="Proteína" value={total.proteina} target={meta.proteina} color={MACRO_COLORS.p}/>
              <MacroBar name="Carboidrato" value={total.carbo} target={meta.carbo} color={MACRO_COLORS.c}/>
              <MacroBar name="Gordura" value={total.gordura} target={meta.gordura} color={MACRO_COLORS.g}/>
            </div>
          </div>
        ) : (
          <button onClick={() => setSheet({ tipo: 'meta' })} className="tappable" style={{
            width: '100%', textAlign: 'left', padding: 18, borderRadius: 20, cursor: 'pointer',
            background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.4)', color: 'var(--text)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
              <Icon name="target" size={20}/> Defina sua meta diária
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
              O app calcula calorias e macros pelo seu peso, altura e objetivo. Você comeu {Math.round(total.kcal)} kcal até agora.
            </div>
          </button>
        )}
      </div>

      {/* Refeições */}
      <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Refeições</div>
        <button onClick={() => setSheet({ tipo: 'plano' })} style={{ background: 'none', border: 0, color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="edit" size={15}/> {plano.length ? 'Editar plano' : 'Montar plano'}
        </button>
      </div>

      {erro && <div role="alert" style={{ margin: '0 20px 10px', padding: '10px 14px', borderRadius: 14, background: 'rgba(255,79,94,0.12)', border: '1px solid rgba(255,79,94,0.35)', color: 'var(--danger)', fontSize: 14 }}>{erro}</div>}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {grupos.map(g => {
          const regs = diario.filter(r => r.refeicao === g.nome)
          const t = soma(regs)
          const itensPlano = g.plano ? itensDo(g.plano) : []
          const tPlano = soma(itensPlano)
          const feitoPeloPlano = !!g.plano && regs.some(r => r.plano_refeicao_id === g.plano!.id)
          const aberta = abertas.has(g.nome)
          const feito = regs.length > 0

          return (
            <div key={g.nome} style={{
              borderRadius: 18, background: 'var(--surface-1)', overflow: 'hidden',
              border: `1px solid ${feito ? 'rgba(204,255,0,0.35)' : 'var(--border)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 14px 16px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: feito ? 'var(--accent)' : 'var(--surface-2)', color: feito ? 'var(--accent-ink)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                }}>
                  {feito ? <Icon name="check" size={18} strokeWidth={2.6}/> : (g.horario || <Icon name="apple" size={18}/>)}
                </div>
                <button onClick={() => toggle(g.nome)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 0, color: 'var(--text)', cursor: 'pointer', padding: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{g.nome}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
                    {feito
                      ? <MacroLine kcal={t.kcal} p={t.proteina} c={t.carbo} g={t.gordura}/>
                      : itensPlano.length ? `Plano: ${Math.round(tPlano.kcal)} kcal · ${itensPlano.length} ${itensPlano.length === 1 ? 'item' : 'itens'}` : 'Nada registrado'}
                  </div>
                </button>
                {g.plano && itensPlano.length > 0 && !feitoPeloPlano && (
                  <button onClick={() => comiPlano(g.plano!)} disabled={ocupado === g.plano.id} className="tappable" style={{ ...btn('primary'), height: 40, fontSize: 14, padding: '0 16px' }}>
                    {ocupado === g.plano.id ? '…' : 'Comi'}
                  </button>
                )}
              </div>

              {(aberta || feito) && (
                <div style={{ padding: '0 16px 4px' }}>
                  {/* Itens do plano ainda não registrados (só mostra quando aberto) */}
                  {aberta && !feitoPeloPlano && itensPlano.map((it, k) => (
                    <div key={'p' + k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: 14 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.nome}</span>
                      <span style={{ flexShrink: 0 }}>{Math.round(it.gramas)} g · {Math.round(it.kcal)} kcal</span>
                    </div>
                  ))}
                  {regs.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{Math.round(r.gramas)} g · {Math.round(r.kcal)} kcal · P {Math.round(r.proteina)}</div>
                      </div>
                      <button aria-label={`Remover ${r.nome}`} onClick={() => remover(r.id)} style={{ width: 36, height: 36, borderRadius: 18, border: 0, background: 'transparent', color: 'var(--muted-2)', cursor: 'pointer', flexShrink: 0 }}>
                        <Icon name="x" size={16}/>
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, padding: '10px 0 12px', borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => setSheet({ tipo: 'add', refeicao: g.nome })} style={{ ...btn('ghost'), flex: 1, height: 40, fontSize: 14 }}>
                      <Icon name="plus" size={16}/> Alimento
                    </button>
                    {feitoPeloPlano && (
                      <button onClick={() => desfazerPlano(g.nome, g.plano!.id)} style={{ ...btn('ghost'), height: 40, fontSize: 13, color: 'var(--muted)' }}>
                        Desfazer
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!aberta && !feito && (
                <button onClick={() => setSheet({ tipo: 'add', refeicao: g.nome })} style={{
                  width: '100%', height: 40, border: 0, borderTop: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Icon name="plus" size={14}/> Adicionar alimento
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <button onClick={() => setSheet({ tipo: 'add', refeicao: 'Extra' })} style={{ ...btn('ghost'), width: '100%', height: 46, fontSize: 14 }}>
          <Icon name="plus" size={16}/> Registrar algo fora do plano
        </button>
        <p style={{ color: 'var(--muted-2)', fontSize: 11, lineHeight: 1.5, textAlign: 'center', marginTop: 14 }}>
          Valores nutricionais: Tabela TACO (NEPA/UNICAMP) e medidas caseiras do IBGE.
        </p>
      </div>

      {sheet?.tipo === 'add' && (
        <AddFoodSheet titulo={sheet.refeicao} userId={userId} recentes={recentes} meus={meus}
          onAlimentoCriado={a => setMeus(m => [a, ...m])}
          onAdd={item => adicionar(sheet.refeicao, [item])}
          onClose={() => setSheet(null)}/>
      )}
      {sheet?.tipo === 'meta' && (
        <MetaSheet userId={userId} atual={meta} pesoMedido={props.pesoMedido} alturaMedida={props.alturaMedida}
          objetivoPerfil={props.objetivo}
          onSaved={m => { setMeta(m); setSheet(null) }} onClose={() => setSheet(null)}/>
      )}
      {sheet?.tipo === 'plano' && (
        <PlanoSheet userId={userId} plano={plano} setPlano={setPlano} recentes={recentes} meus={meus}
          onAlimentoCriado={a => setMeus(m => [a, ...m])} onClose={() => setSheet(null)}/>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 21, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
  color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
}
