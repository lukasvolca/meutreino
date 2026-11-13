'use client'

import { useState } from 'react'
import { createClient, limite } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { ATIVIDADES, calcularMeta, type Macros } from '@/lib/dieta'
import { Sheet, input, btn, label, Chip } from './ui'

type Meta = Database['public']['Tables']['metas_nutricionais']['Row']

const OBJETIVOS = [
  { id: 'hipertrofia', label: 'Hipertrofia', desc: '+10% de calorias' },
  { id: 'forca', label: 'Força', desc: '+5%' },
  { id: 'emagrecimento', label: 'Emagrecer', desc: '−20%' },
]

export default function MetaSheet({ userId, atual, pesoMedido, alturaMedida, objetivoPerfil, onSaved, onClose }: {
  userId: string
  atual: Meta | null
  pesoMedido: number | null
  alturaMedida: number | null
  objetivoPerfil: string | null
  onSaved: (m: Meta) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [sexo, setSexo] = useState<'m' | 'f'>(atual?.sexo ?? 'm')
  const [idade, setIdade] = useState(String(atual?.idade ?? ''))
  // Altura em medidas pode estar em metros (1.78) ou cm (178)
  const alturaIni = atual?.altura_cm ?? (alturaMedida ? (alturaMedida < 3 ? alturaMedida * 100 : alturaMedida) : null)
  const [altura, setAltura] = useState(alturaIni ? String(Math.round(Number(alturaIni))) : '')
  const [peso, setPeso] = useState(String(atual?.peso_kg ?? pesoMedido ?? '').replace('.', ','))
  const [atividade, setAtividade] = useState(atual?.atividade ?? 'moderado')
  const [objetivo, setObjetivo] = useState(objetivoPerfil ?? 'hipertrofia')
  const [manual, setManual] = useState<Macros | null>(atual ? {
    kcal: atual.kcal, proteina: atual.proteina, carbo: atual.carbo, gordura: atual.gordura,
  } : null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const n = (s: string) => parseFloat(s.replace(',', '.'))
  const dadosOk = n(idade) > 0 && n(altura) > 0 && n(peso) > 0
  const sugerida = dadosOk ? calcularMeta({
    sexo, idade: n(idade), alturaCm: n(altura), pesoKg: n(peso), atividade, objetivo,
  }) : null
  const meta = manual ?? sugerida

  async function salvar() {
    if (!meta) { setErro('Preencha idade, altura e peso.'); return }
    setSalvando(true)
    const row = {
      user_id: userId, kcal: Math.round(meta.kcal), proteina: Math.round(meta.proteina),
      carbo: Math.round(meta.carbo), gordura: Math.round(meta.gordura),
      sexo, idade: dadosOk ? Math.round(n(idade)) : null,
      altura_cm: dadosOk ? n(altura) : null, peso_kg: dadosOk ? n(peso) : null,
      atividade, updated_at: new Date().toISOString(),
    }
    const [{ data, error }] = await Promise.all([
      supabase.from('metas_nutricionais').upsert(row).select().abortSignal(limite()).single(),
      objetivo !== objetivoPerfil
        ? supabase.from('profiles').update({ objetivo }).eq('id', userId).abortSignal(limite())
        : Promise.resolve(null),
    ])
    setSalvando(false)
    if (error || !data) { setErro('Não deu para salvar. Confira a conexão e tente de novo.'); return }
    onSaved(data)
  }

  const campoMacro = (k: keyof Macros, nome: string, unidade: string) => (
    <label style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...label, marginBottom: 6 }}>{nome}</div>
      <div style={{ position: 'relative' }}>
        <input inputMode="numeric" value={meta ? String(Math.round(meta[k])) : ''}
          onChange={e => {
            const v = parseInt(e.target.value) || 0
            setManual({ ...(meta ?? { kcal: 0, proteina: 0, carbo: 0, gordura: 0 }), [k]: v })
          }}
          style={{ ...input, paddingRight: 40 }}/>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)', fontSize: 13 }}>{unidade}</span>
      </div>
    </label>
  )

  return (
    <Sheet title="Minha meta diária" onClose={onClose} footer={
      <button onClick={salvar} disabled={salvando || !meta} style={{ ...btn('primary'), width: '100%', opacity: meta ? 1 : 0.6 }}>
        {salvando ? 'Salvando…' : 'Salvar meta'}
      </button>
    }>
      <div style={{ ...label, marginBottom: 8 }}>Objetivo</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OBJETIVOS.map(o => <Chip key={o.id} active={objetivo === o.id} onClick={() => { setObjetivo(o.id); setManual(null) }}>{o.label} · {o.desc}</Chip>)}
      </div>

      <div style={{ ...label, margin: '18px 0 8px' }}>Sexo</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Chip active={sexo === 'm'} onClick={() => { setSexo('m'); setManual(null) }}>Masculino</Chip>
        <Chip active={sexo === 'f'} onClick={() => { setSexo('f'); setManual(null) }}>Feminino</Chip>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        {([['Idade', idade, setIdade, 'anos'], ['Altura', altura, setAltura, 'cm'], ['Peso', peso, setPeso, 'kg']] as const).map(([nome, val, set, un]) => (
          <label key={nome} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...label, marginBottom: 6 }}>{nome}</div>
            <div style={{ position: 'relative' }}>
              <input inputMode="decimal" value={val} onChange={e => { set(e.target.value); setManual(null) }} style={{ ...input, paddingRight: 38 }}/>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)', fontSize: 12 }}>{un}</span>
            </div>
          </label>
        ))}
      </div>

      <div style={{ ...label, margin: '18px 0 8px' }}>Nível de atividade</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ATIVIDADES.map(a => (
          <button key={a.id} type="button" onClick={() => { setAtividade(a.id); setManual(null) }} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            background: atividade === a.id ? 'rgba(204,255,0,0.08)' : 'var(--surface-1)',
            border: `1px solid ${atividade === a.id ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--text)',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>{a.desc}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 22, padding: 16, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={label}>{manual ? 'Meta ajustada por você' : 'Meta sugerida'}</div>
          {manual && sugerida && (
            <button type="button" onClick={() => setManual(null)} style={{ background: 'none', border: 0, color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Voltar à sugestão
            </button>
          )}
        </div>
        {meta ? (
          <>
            <div style={{ display: 'flex', gap: 10 }}>{campoMacro('kcal', 'Calorias', 'kcal')}{campoMacro('proteina', 'Proteína', 'g')}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>{campoMacro('carbo', 'Carbo', 'g')}{campoMacro('gordura', 'Gordura', 'g')}</div>
            <p style={{ color: 'var(--muted-2)', fontSize: 12, lineHeight: 1.5, margin: '12px 0 0' }}>
              Cálculo: Mifflin-St Jeor × atividade, ajustado pelo objetivo. Proteína ~2 g/kg. Pode editar qualquer número.
              É uma estimativa, não substitui um nutricionista.
            </p>
          </>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Preencha idade, altura e peso para ver a sugestão.</p>
        )}
      </div>
      {erro && <p role="alert" style={{ color: 'var(--danger)', fontSize: 14 }}>{erro}</p>}
    </Sheet>
  )
}
