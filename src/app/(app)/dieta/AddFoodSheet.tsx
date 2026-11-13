'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '@/components/icons'
import { createClient, limite } from '@/lib/supabase/client'
import {
  type Alimento, type ItemPorcao, alimentoDoUsuario, buscar, carregarTaco, nomeCurto, porcao, normalizar,
} from '@/lib/dieta'
import { Sheet, input, btn, label, MacroLine, Stepper, Chip } from './ui'

type Props = {
  titulo: string
  userId: string
  recentes: Alimento[]
  meus: Alimento[]
  onAdd: (item: ItemPorcao) => Promise<boolean> | boolean
  onClose: () => void
  onAlimentoCriado: (a: Alimento) => void
}

export default function AddFoodSheet({ titulo, userId, recentes, meus, onAdd, onClose, onAlimentoCriado }: Props) {
  const [taco, setTaco] = useState<Alimento[] | null>(null)
  const [termo, setTermo] = useState('')
  const [sel, setSel] = useState<Alimento | null>(null)
  const [criando, setCriando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vivo = true
    carregarTaco().then(l => { if (vivo) setTaco(l) })
    return () => { vivo = false }
  }, [])

  const resultados = useMemo(() => {
    if (!termo.trim()) return []
    const n = normalizar(termo)
    const proprios = meus.filter(a => n.split(/\s+/).every(p => normalizar(a.nome).includes(p)))
    return [...proprios, ...(taco ? buscar(taco, termo) : [])]
  }, [termo, taco, meus])

  if (criando) {
    return <NovoAlimento userId={userId} nomeInicial={termo} onClose={() => setCriando(false)}
      onCriado={a => { onAlimentoCriado(a); setCriando(false); setSel(a) }}/>
  }

  if (sel) {
    return <Quantidade alimento={sel} titulo={titulo} onVoltar={() => setSel(null)} onAdd={onAdd} onClose={onClose}/>
  }

  const vazio = !termo.trim()

  return (
    <Sheet title={titulo} onClose={onClose}>
      <div style={{ position: 'sticky', top: 0, background: 'var(--bg-app)', paddingBottom: 12, zIndex: 1 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)' }}>
            <Icon name="search" size={18}/>
          </span>
          <input ref={inputRef} autoFocus value={termo} onChange={e => setTermo(e.target.value)}
            placeholder="Buscar alimento (ex.: arroz, frango grelhado)"
            style={{ ...input, paddingLeft: 42 }}/>
        </div>
      </div>

      {vazio && recentes.length > 0 && (
        <Secao titulo="Recentes">
          {recentes.map(a => <Linha key={a.ref + a.nome} a={a} onClick={() => setSel(a)} sub={a.porcaoPadrao ? `última vez: ${Math.round(a.porcaoPadrao)} g` : undefined}/>)}
        </Secao>
      )}
      {vazio && meus.length > 0 && (
        <Secao titulo="Meus alimentos">
          {meus.map(a => <Linha key={a.ref} a={a} onClick={() => setSel(a)}/>)}
        </Secao>
      )}
      {vazio && recentes.length === 0 && meus.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, margin: '8px 0 16px' }}>
          Digite o nome do alimento. A base é a Tabela TACO (UNICAMP), com quase 600 alimentos brasileiros.
        </p>
      )}

      {!vazio && !taco && <p style={{ color: 'var(--muted)', fontSize: 14 }}>Carregando tabela…</p>}
      {!vazio && taco && resultados.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nada encontrado para “{termo}”. Tente outra palavra ou cadastre o alimento.</p>
      )}
      {resultados.length > 0 && (
        <Secao titulo={`${resultados.length}${resultados.length === 40 ? '+' : ''} resultados`}>
          {resultados.map(a => <Linha key={a.ref} a={a} onClick={() => setSel(a)}/>)}
        </Secao>
      )}

      <button onClick={() => setCriando(true)} style={{ ...btn('ghost'), width: '100%', marginTop: 8, height: 46, fontSize: 14 }}>
        <Icon name="plus" size={16}/> Cadastrar alimento (rótulo / marca)
      </button>
    </Sheet>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...label, marginBottom: 6 }}>{titulo}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  )
}

function Linha({ a, onClick, sub }: { a: Alimento; onClick: () => void; sub?: string }) {
  const { titulo, detalhe } = nomeCurto(a.nome)
  return (
    <button onClick={onClick} className="tappable" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', textAlign: 'left',
      background: 'transparent', border: 0, borderBottom: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
          {titulo}{detalhe && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>, {detalhe}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 3 }}>
          {sub ?? `${Math.round(a.por100.kcal)} kcal · P ${a.por100.proteina} · C ${a.por100.carbo} · G ${a.por100.gordura} por 100 g`}
        </div>
      </div>
      <Icon name="chevronRight" size={16} color="var(--muted-2)"/>
    </button>
  )
}

// ── Passo 2: quanto comeu ─────────────────────────────────────────────────────

function unidadeInicial(a: Alimento): { idx: number; qtd: number } {
  if (a.porcaoPadrao) return { idx: -1, qtd: Math.round(a.porcaoPadrao) }
  const u = a.medidas.findIndex(([m]) => m === 'unidade' || m.startsWith('fatia') || m.startsWith('scoop'))
  if (u >= 0) return { idx: u, qtd: 1 }
  return { idx: -1, qtd: 100 }
}

function Quantidade({ alimento, titulo, onVoltar, onAdd, onClose }: {
  alimento: Alimento; titulo: string; onVoltar: () => void
  onAdd: Props['onAdd']; onClose: () => void
}) {
  const ini = unidadeInicial(alimento)
  const [idx, setIdx] = useState(ini.idx)
  const [qtd, setQtd] = useState(ini.qtd)
  const [salvando, setSalvando] = useState(false)
  const [falhou, setFalhou] = useState(false)

  const gramasPorUnidade = idx >= 0 ? alimento.medidas[idx][1] : 1
  const gramas = qtd * gramasPorUnidade
  const item = porcao(alimento, gramas)
  const { titulo: t, detalhe } = nomeCurto(alimento.nome)

  function trocarUnidade(novo: number) {
    // Mantém a quantidade em gramas aproximada ao trocar de unidade
    if (novo === -1) setQtd(Math.round(gramas))
    else setQtd(Math.max(0.5, Math.round((gramas / alimento.medidas[novo][1]) * 2) / 2))
    setIdx(novo)
  }

  async function adicionar() {
    if (gramas <= 0 || salvando) return
    setSalvando(true)
    setFalhou(false)
    const ok = await onAdd(item)
    setSalvando(false)
    if (ok) onClose()
    else setFalhou(true)
  }

  return (
    <Sheet title={titulo} onClose={onClose} footer={
      <button onClick={adicionar} disabled={gramas <= 0 || salvando} style={{ ...btn('primary'), width: '100%', opacity: gramas <= 0 || salvando ? 0.6 : 1 }}>
        {salvando ? 'Salvando…' : `Adicionar · ${Math.round(item.kcal)} kcal`}
      </button>
    }>
      <button onClick={onVoltar} style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: 14, padding: '4px 0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon name="chevronLeft" size={16}/> Voltar à busca
      </button>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}>{t}</div>
      {detalhe && <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{detalhe}</div>}

      <div style={{ ...label, margin: '20px 0 8px' }}>Medida</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <Chip active={idx === -1} onClick={() => trocarUnidade(-1)}>gramas</Chip>
        {alimento.medidas.map(([m, g], i) => (
          <Chip key={m} active={idx === i} onClick={() => trocarUnidade(i)}>{m} · {Math.round(g)} g</Chip>
        ))}
      </div>

      <div style={{ ...label, margin: '18px 0 8px' }}>Quantidade</div>
      <Stepper value={qtd} onChange={setQtd} step={idx === -1 ? 10 : 0.5} suffix={idx === -1 ? 'g' : '×'}/>
      {idx >= 0 && <div style={{ color: 'var(--muted-2)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>= {Math.round(gramas)} g</div>}

      <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <MacroLine kcal={item.kcal} p={item.proteina} c={item.carbo} g={item.gordura} size={15}/>
      </div>
      {falhou && (
        <p role="alert" style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>
          Não deu para salvar (sem conexão?). Toque em Adicionar para tentar de novo.
        </p>
      )}
    </Sheet>
  )
}

// ── Cadastro de alimento próprio (valores do rótulo) ──────────────────────────

function NovoAlimento({ userId, nomeInicial, onClose, onCriado }: {
  userId: string; nomeInicial: string; onClose: () => void; onCriado: (a: Alimento) => void
}) {
  const supabase = createClient()
  const [nome, setNome] = useState(nomeInicial)
  const [porcaoG, setPorcaoG] = useState('100')
  const [v, setV] = useState({ kcal: '', proteina: '', carbo: '', gordura: '' })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const n = (s: string) => parseFloat(s.replace(',', '.')) || 0

  async function salvar() {
    const pg = n(porcaoG)
    if (!nome.trim() || pg <= 0 || n(v.kcal) <= 0) { setErro('Preencha o nome, a porção e as calorias.'); return }
    setSalvando(true)
    const f = 100 / pg
    const r1 = (x: number) => Math.round(x * f * 10) / 10
    const { data, error } = await supabase.from('alimentos_usuario').insert({
      user_id: userId, nome: nome.trim(), porcao_g: pg,
      kcal: r1(n(v.kcal)), proteina: r1(n(v.proteina)), carbo: r1(n(v.carbo)), gordura: r1(n(v.gordura)),
    }).select().abortSignal(limite()).single()
    setSalvando(false)
    if (error || !data) { setErro('Não deu para salvar. Confira a conexão e tente de novo.'); return }
    onCriado(alimentoDoUsuario(data))
  }

  const campo = (k: keyof typeof v, nomeCampo: string) => (
    <label style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...label, marginBottom: 6 }}>{nomeCampo}</div>
      <input inputMode="decimal" value={v[k]} onChange={e => setV(p => ({ ...p, [k]: e.target.value }))} style={input} placeholder="0"/>
    </label>
  )

  return (
    <Sheet title="Novo alimento" onClose={onClose} footer={
      <button onClick={salvar} disabled={salvando} style={{ ...btn('primary'), width: '100%' }}>{salvando ? 'Salvando…' : 'Salvar alimento'}</button>
    }>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, marginTop: 0 }}>
        Copie os valores da tabela nutricional do rótulo. Ele fica salvo em “Meus alimentos”.
      </p>
      <label>
        <div style={{ ...label, marginBottom: 6 }}>Nome</div>
        <input value={nome} onChange={e => setNome(e.target.value)} style={input} placeholder="Ex.: Whey Max Titanium baunilha"/>
      </label>
      <label style={{ display: 'block', marginTop: 14 }}>
        <div style={{ ...label, marginBottom: 6 }}>Porção do rótulo (g ou ml)</div>
        <input inputMode="decimal" value={porcaoG} onChange={e => setPorcaoG(e.target.value)} style={input}/>
      </label>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>{campo('kcal', 'Kcal')}{campo('proteina', 'Proteína')}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>{campo('carbo', 'Carbo')}{campo('gordura', 'Gordura')}</div>
      {erro && <p role="alert" style={{ color: 'var(--danger)', fontSize: 14 }}>{erro}</p>}
    </Sheet>
  )
}
