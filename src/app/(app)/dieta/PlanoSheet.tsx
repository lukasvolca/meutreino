'use client'

import { useState } from 'react'
import Icon from '@/components/icons'
import { createClient, limite } from '@/lib/supabase/client'
import type { Database, Json } from '@/lib/supabase/types'
import { type Alimento, type ItemPorcao, REFEICOES_PADRAO, soma } from '@/lib/dieta'
import AddFoodSheet from './AddFoodSheet'
import { Sheet, input, btn, label, MacroLine } from './ui'

export type PlanoRow = Database['public']['Tables']['plano_refeicoes']['Row']

export function itensDo(r: PlanoRow): ItemPorcao[] {
  return Array.isArray(r.itens) ? (r.itens as unknown as ItemPorcao[]) : []
}

const HORARIOS_PADRAO = ['07:00', '12:30', '16:00', '20:00']

export default function PlanoSheet({ userId, plano, setPlano, recentes, meus, onAlimentoCriado, onClose }: {
  userId: string
  plano: PlanoRow[]
  setPlano: (fn: (p: PlanoRow[]) => PlanoRow[]) => void
  recentes: Alimento[]
  meus: Alimento[]
  onAlimentoCriado: (a: Alimento) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [addEm, setAddEm] = useState<PlanoRow | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const falhou = () => setErro('Não deu para salvar. Confira a conexão e tente de novo.')

  async function criarPadrao() {
    setOcupado(true)
    const { data, error } = await supabase.from('plano_refeicoes').insert(
      REFEICOES_PADRAO.map((nome, i) => ({ user_id: userId, nome, horario: HORARIOS_PADRAO[i], ordem: i }))
    ).select().abortSignal(limite())
    setOcupado(false)
    if (error || !data) return falhou()
    setPlano(() => data)
  }

  async function novaRefeicao() {
    setOcupado(true)
    const ordem = plano.length ? Math.max(...plano.map(p => p.ordem)) + 1 : 0
    const { data, error } = await supabase.from('plano_refeicoes')
      .insert({ user_id: userId, nome: 'Nova refeição', ordem }).select().abortSignal(limite()).single()
    setOcupado(false)
    if (error || !data) return falhou()
    setPlano(p => [...p, data])
  }

  async function atualizar(id: string, patch: Partial<Pick<PlanoRow, 'nome' | 'horario'>> & { itens?: ItemPorcao[] }) {
    const antes = plano
    const dbPatch = { ...patch, itens: patch.itens as unknown as Json | undefined }
    setPlano(p => p.map(r => r.id === id ? { ...r, ...dbPatch, itens: dbPatch.itens ?? r.itens } : r))
    const { error } = await supabase.from('plano_refeicoes').update(dbPatch).eq('id', id).abortSignal(limite())
    if (error) { setPlano(() => antes); falhou(); return false }
    return true
  }

  async function remover(id: string) {
    if (!confirm('Remover esta refeição do plano? O que já foi registrado no diário continua lá.')) return
    const antes = plano
    setPlano(p => p.filter(r => r.id !== id))
    const { error } = await supabase.from('plano_refeicoes').delete().eq('id', id).abortSignal(limite())
    if (error) { setPlano(() => antes); falhou() }
  }

  async function mover(id: string, dir: -1 | 1) {
    const ord = [...plano].sort((a, b) => a.ordem - b.ordem)
    const i = ord.findIndex(r => r.id === id), j = i + dir
    if (j < 0 || j >= ord.length) return
    ;[ord[i], ord[j]] = [ord[j], ord[i]]
    const novo = ord.map((r, k) => ({ ...r, ordem: k }))
    setPlano(() => novo)
    await Promise.all(novo.map(r => supabase.from('plano_refeicoes').update({ ordem: r.ordem }).eq('id', r.id)))
  }

  if (addEm) {
    return <AddFoodSheet titulo={`Plano · ${addEm.nome}`} userId={userId} recentes={recentes} meus={meus}
      onAlimentoCriado={onAlimentoCriado} onClose={() => setAddEm(null)}
      onAdd={item => atualizar(addEm.id, { itens: [...itensDo(plano.find(p => p.id === addEm.id) ?? addEm), item] })}/>
  }

  const ordenado = [...plano].sort((a, b) => a.ordem - b.ordem)
  const total = soma(ordenado.flatMap(itensDo))

  return (
    <Sheet title="Meu plano de refeições" onClose={onClose} footer={
      ordenado.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={label}>Total do plano</div>
            <MacroLine kcal={total.kcal} p={total.proteina} c={total.carbo} g={total.gordura} size={13}/>
          </div>
          <button onClick={onClose} style={{ ...btn('primary'), height: 44 }}>Pronto</button>
        </div>
      ) : undefined
    }>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, marginTop: 0 }}>
        Monte uma vez o que você costuma comer. No dia a dia, um toque em “Comi” registra a refeição inteira.
      </p>

      {ordenado.length === 0 && (
        <button onClick={criarPadrao} disabled={ocupado} style={{ ...btn('primary'), width: '100%', marginBottom: 10 }}>
          Começar com café, almoço, lanche e jantar
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ordenado.map((r, i) => {
          const itens = itensDo(r)
          const t = soma(itens)
          return (
            <div key={r.id} style={{ padding: 14, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input defaultValue={r.horario ?? ''} placeholder="--:--" type="time" aria-label="Horário"
                  onBlur={e => e.target.value !== (r.horario ?? '') && atualizar(r.id, { horario: e.target.value || null })}
                  style={{ ...input, width: 104, flexShrink: 0, padding: '0 10px' }}/>
                <input defaultValue={r.nome} aria-label="Nome da refeição"
                  onBlur={e => e.target.value.trim() && e.target.value !== r.nome && atualizar(r.id, { nome: e.target.value.trim() })}
                  style={{ ...input, fontWeight: 700 }}/>
              </div>

              {itens.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {itens.map((it, k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{Math.round(it.gramas)} g · {Math.round(it.kcal)} kcal</div>
                      </div>
                      <button aria-label={`Remover ${it.nome}`} onClick={() => atualizar(r.id, { itens: itens.filter((_, x) => x !== k) })}
                        style={{ width: 36, height: 36, borderRadius: 18, border: 0, background: 'transparent', color: 'var(--muted-2)', cursor: 'pointer' }}>
                        <Icon name="x" size={16}/>
                      </button>
                    </div>
                  ))}
                  <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <MacroLine kcal={t.kcal} p={t.proteina} c={t.carbo} g={t.gordura}/>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setAddEm(r)} style={{ ...btn('ghost'), flex: 1, height: 42, fontSize: 14 }}>
                  <Icon name="plus" size={16}/> Alimento
                </button>
                <button aria-label="Subir" disabled={i === 0} onClick={() => mover(r.id, -1)} style={{ ...btn('ghost'), width: 42, height: 42, padding: 0, opacity: i === 0 ? 0.3 : 1 }}>
                  <Icon name="arrowUp" size={16}/>
                </button>
                <button aria-label="Descer" disabled={i === ordenado.length - 1} onClick={() => mover(r.id, 1)} style={{ ...btn('ghost'), width: 42, height: 42, padding: 0, opacity: i === ordenado.length - 1 ? 0.3 : 1 }}>
                  <Icon name="arrowDown" size={16}/>
                </button>
                <button aria-label="Remover refeição" onClick={() => remover(r.id)} style={{ ...btn('danger'), width: 42, height: 42, padding: 0 }}>
                  <Icon name="trash" size={16}/>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {ordenado.length > 0 && (
        <button onClick={novaRefeicao} disabled={ocupado} style={{ ...btn('ghost'), width: '100%', marginTop: 12, height: 46, fontSize: 14 }}>
          <Icon name="plus" size={16}/> Nova refeição
        </button>
      )}
      {erro && <p role="alert" style={{ color: 'var(--danger)', fontSize: 14 }}>{erro}</p>}
    </Sheet>
  )
}
