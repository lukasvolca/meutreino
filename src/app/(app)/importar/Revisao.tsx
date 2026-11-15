'use client'

// Revisão da ficha lida: um treino por aba, cada exercício abre para editar.
// Os itens que a leitura marcou como duvidosos pedem um "Está certo" antes de salvar.

import { useMemo, useState } from 'react'
import Icon from '@/components/icons'
import { btn, input, label } from '../dieta/ui'
import { exVazio, novaKey, resumoEx, CORES, type ExRev, type FichaRev, type Leitura, type TipoEx } from './tipos'

const DIAS: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' }
const ORDEM_DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

export default function Revisao({ leitura, fichas, setFichas, fichasAtuais, salvando, erro, onSalvar, onRecomecar }: {
  leitura: Leitura
  fichas: FichaRev[]
  setFichas: React.Dispatch<React.SetStateAction<FichaRev[]>>
  fichasAtuais: number
  salvando: boolean
  erro: string | null
  onSalvar: (modo: 'adicionar' | 'substituir') => void
  onRecomecar: () => void
}) {
  const [aba, setAba] = useState(fichas[0]?.key ?? '')
  const [aberto, setAberto] = useState<string | null>(null)
  const [modo, setModo] = useState<'adicionar' | 'substituir'>('adicionar')
  const ficha = fichas.find(f => f.key === aba) ?? fichas[0]

  const totalEx = fichas.reduce((s, f) => s + f.exercicios.length, 0)
  const pendentes = useMemo(
    () => fichas.flatMap(f => f.exercicios.filter(e => !e.conferido).map(e => ({ ficha: f.key, ex: e.key }))),
    [fichas],
  )

  function mudarFicha(key: string, patch: Partial<FichaRev>) {
    setFichas(fs => fs.map(f => f.key === key ? { ...f, ...patch } : f))
  }
  function mudarEx(fKey: string, eKey: string, patch: Partial<ExRev>) {
    setFichas(fs => fs.map(f => f.key !== fKey ? f : { ...f, exercicios: f.exercicios.map(e => e.key === eKey ? { ...e, ...patch } : e) }))
  }
  function removerEx(fKey: string, eKey: string) {
    setFichas(fs => fs.map(f => f.key !== fKey ? f : { ...f, exercicios: f.exercicios.filter(e => e.key !== eKey) }))
    setAberto(null)
  }
  function moverEx(fKey: string, eKey: string, dir: -1 | 1) {
    setFichas(fs => fs.map(f => {
      if (f.key !== fKey) return f
      const i = f.exercicios.findIndex(e => e.key === eKey)
      const j = i + dir
      if (i < 0 || j < 0 || j >= f.exercicios.length) return f
      const ex = [...f.exercicios];
      [ex[i], ex[j]] = [ex[j], ex[i]]
      return { ...f, exercicios: ex }
    }))
  }
  function adicionarEx(fKey: string) {
    const novo = exVazio()
    setFichas(fs => fs.map(f => f.key === fKey ? { ...f, exercicios: [...f.exercicios, novo] } : f))
    setAberto(novo.key)
  }
  function removerFicha(fKey: string) {
    const resto = fichas.filter(f => f.key !== fKey)
    setFichas(resto)
    setAba(resto[0]?.key ?? '')
  }
  function adicionarFicha() {
    const usadas = new Set(fichas.map(f => f.letra))
    const letra = 'ABCDEFGHIJKL'.split('').find(l => !usadas.has(l)) ?? 'X'
    const nova: FichaRev = { key: novaKey(), letra, nome: `Treino ${letra}`, cor: CORES[fichas.length % CORES.length], exercicios: [] }
    setFichas(fs => [...fs, nova])
    setAba(nova.key)
  }
  function irParaPendente() {
    const p = pendentes[0]
    if (!p) return
    setAba(p.ficha)
    setAberto(p.ex)
    requestAnimationFrame(() => document.getElementById(`ex-${p.ex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const prog = leitura.programa
  const temPrograma = prog && (prog.semanas.length > 0 || prog.cardio || prog.observacoes.length > 0)
  const vazio = fichas.length === 0 || fichas.every(f => f.exercicios.length === 0)

  return (
    <div style={{ padding: '0 20px 28px' }}>
      <button onClick={onRecomecar} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: 14, background: 'none', border: 0, padding: 0, cursor: 'pointer', marginBottom: 14 }}>
        <Icon name="chevronLeft" size={16}/> Enviar outra
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Confira a ficha</h1>
      <p style={{ marginTop: 8, fontSize: 15, color: 'var(--muted)', lineHeight: 1.5 }}>
        Encontramos {fichas.length} {fichas.length === 1 ? 'treino' : 'treinos'} e {totalEx} exercícios. Toque num exercício para corrigir.
      </p>

      {pendentes.length > 0 && (
        <button onClick={irParaPendente} className="tappable" style={{
          marginTop: 14, width: '100%', padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
          background: 'rgba(255,181,71,0.1)', border: '1px solid rgba(255,181,71,0.35)', color: 'var(--warn)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600,
        }}>
          <Icon name="alert" size={18}/>
          <span style={{ flex: 1 }}>{pendentes.length} {pendentes.length === 1 ? 'item pede' : 'itens pedem'} sua conferência</span>
          <Icon name="chevronRight" size={16}/>
        </button>
      )}

      {leitura.avisos.length > 0 && (
        <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
          {leitura.avisos.map((a, i) => <div key={i} style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--warn)' }}>•</span>{a}</div>)}
        </div>
      )}

      {/* Abas dos treinos */}
      <div role="tablist" style={{ display: 'flex', gap: 8, marginTop: 20, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {fichas.map(f => {
          const sel = f.key === ficha?.key
          const pend = f.exercicios.some(e => !e.conferido)
          return (
            <button key={f.key} role="tab" aria-selected={sel} onClick={() => { setAba(f.key); setAberto(null) }} style={{
              position: 'relative', flexShrink: 0, minWidth: 56, height: 52, padding: '0 14px', borderRadius: 16, cursor: 'pointer',
              background: sel ? `${f.cor}22` : 'var(--surface-1)', border: `1px solid ${sel ? f.cor : 'var(--border)'}`,
              color: sel ? f.cor : 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>{f.letra}</span>
              <span style={{ fontSize: 10, color: sel ? f.cor : 'var(--muted-2)' }}>{f.exercicios.length} ex.</span>
              {pend && <span aria-label="tem itens para conferir" style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, background: 'var(--warn)' }}/>}
            </button>
          )
        })}
        <button onClick={adicionarFicha} aria-label="Adicionar treino" style={{
          flexShrink: 0, width: 52, height: 52, borderRadius: 16, cursor: 'pointer', background: 'transparent',
          border: '1px dashed var(--border-strong)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="plus" size={18}/></button>
      </div>

      {ficha && (
        <div key={ficha.key} className="animate-fade-in" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input aria-label="Letra do treino" value={ficha.letra} maxLength={2}
              onChange={e => mudarFicha(ficha.key, { letra: e.target.value.toUpperCase() })}
              style={{ ...input, width: 56, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: ficha.cor, padding: 0 }}/>
            <input aria-label="Nome do treino" value={ficha.nome} maxLength={120}
              onChange={e => mudarFicha(ficha.key, { nome: e.target.value })} style={{ ...input, fontWeight: 600 }}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {ficha.exercicios.map((e, i) => (
              <LinhaEx key={e.key} ex={e} idx={i} total={ficha.exercicios.length} cor={ficha.cor}
                aberto={aberto === e.key}
                onToggle={() => {
                  if (aberto === e.key) { mudarEx(ficha.key, e.key, { conferido: true }); setAberto(null) }
                  else setAberto(e.key)
                }}
                onChange={p => mudarEx(ficha.key, e.key, p)}
                onRemover={() => removerEx(ficha.key, e.key)}
                onMover={d => moverEx(ficha.key, e.key, d)}
              />
            ))}
          </div>

          <button onClick={() => adicionarEx(ficha.key)} style={{ ...btn('ghost'), width: '100%', marginTop: 10, height: 46, fontSize: 14 }}>
            <Icon name="plus" size={16}/> Adicionar exercício
          </button>
          <button onClick={() => removerFicha(ficha.key)} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 0, color: 'var(--muted-2)', fontSize: 13, cursor: 'pointer', padding: 8 }}>
            Remover o treino {ficha.letra}
          </button>
        </div>
      )}

      {temPrograma && <ProgramaCard programa={prog}/>}

      {/* Salvar */}
      <div style={{ marginTop: 24 }}>
        {fichasAtuais > 0 && (
          <div role="radiogroup" aria-label="O que fazer com as fichas atuais" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <div style={label}>Você já tem {fichasAtuais} {fichasAtuais === 1 ? 'ficha' : 'fichas'}</div>
            {([
              { id: 'adicionar', titulo: 'Adicionar às minhas fichas', sub: 'As fichas atuais continuam.' },
              { id: 'substituir', titulo: 'Substituir as fichas atuais', sub: 'As fichas antigas saem. Seu histórico de treinos continua.' },
            ] as const).map(o => (
              <button key={o.id} role="radio" aria-checked={modo === o.id} onClick={() => setModo(o.id)} style={{
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center',
                background: modo === o.id ? 'rgba(204,255,0,0.07)' : 'var(--surface-1)',
                border: `1px solid ${modo === o.id ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--text)',
              }}>
                <span style={{ width: 20, height: 20, borderRadius: 10, flexShrink: 0, border: `2px solid ${modo === o.id ? 'var(--accent)' : 'var(--muted-3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {modo === o.id && <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)' }}/>}
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{o.titulo}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{o.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {erro && (
          <div role="alert" style={{ marginBottom: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,79,94,0.12)', color: 'var(--danger)', fontSize: 14 }}>{erro}</div>
        )}

        {pendentes.length > 0 ? (
          <>
            <button onClick={irParaPendente} style={{ ...btn('primary'), width: '100%' }}>
              Conferir {pendentes.length} {pendentes.length === 1 ? 'item' : 'itens'}
            </button>
            <button onClick={() => onSalvar(modo)} disabled={salvando || vazio} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 0, color: 'var(--muted)', fontSize: 14, cursor: 'pointer', padding: 10, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {salvando ? 'Salvando…' : 'Salvar mesmo assim'}
            </button>
          </>
        ) : (
          <button onClick={() => onSalvar(modo)} disabled={salvando || vazio} style={{ ...btn('primary'), width: '100%', opacity: salvando || vazio ? 0.5 : 1 }}>
            <Icon name="check" size={18}/> {salvando ? 'Salvando…' : `Salvar ${fichas.length} ${fichas.length === 1 ? 'treino' : 'treinos'}`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Um exercício (fechado = resumo; aberto = edição) ─────────────────────────

function LinhaEx({ ex, idx, total, cor, aberto, onToggle, onChange, onRemover, onMover }: {
  ex: ExRev; idx: number; total: number; cor: string; aberto: boolean
  onToggle: () => void; onChange: (p: Partial<ExRev>) => void; onRemover: () => void; onMover: (d: -1 | 1) => void
}) {
  const duvida = !ex.conferido
  return (
    <div id={`ex-${ex.key}`} style={{
      borderRadius: 16, background: 'var(--surface-1)', overflow: 'hidden',
      border: `1px solid ${duvida ? 'rgba(255,181,71,0.45)' : aberto ? 'var(--border-strong)' : 'var(--border)'}`,
    }}>
      <button onClick={onToggle} aria-expanded={aberto} style={{
        width: '100%', padding: '12px 14px', background: 'none', border: 0, cursor: 'pointer', color: 'var(--text)',
        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
      }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: `${cor}1a`, color: cor, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{ex.nome || <span style={{ color: 'var(--muted-2)' }}>Sem nome</span>}</span>
          <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: 'var(--muted-2)' }}>
            {ex.is_biset && ex.tipo === 'forca' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: 'rgba(167,139,250,0.18)', color: '#A78BFA', letterSpacing: '0.06em' }}>BISET</span>}
            {resumoEx(ex)}
          </span>
        </span>
        {duvida
          ? <Icon name="alert" size={18} color="var(--warn)"/>
          : <Icon name={aberto ? 'chevronDown' : 'chevronRight'} size={16} color="var(--muted-3)"/>}
      </button>

      {aberto && (
        <div className="animate-fade-in" style={{ padding: '2px 14px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {duvida && (
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,181,71,0.1)', fontSize: 13, lineHeight: 1.5, color: 'var(--text)' }}>
              {ex.motivo_duvida && <div><b style={{ color: 'var(--warn)' }}>Confira:</b> {ex.motivo_duvida}</div>}
              {ex.texto_original && <div style={{ color: 'var(--muted)', marginTop: ex.motivo_duvida ? 4 : 0 }}>Na ficha: “{ex.texto_original}”</div>}
            </div>
          )}
          {!duvida && ex.texto_original && (
            <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>Na ficha: “{ex.texto_original}”</div>
          )}

          <div>
            <div style={{ ...label, marginBottom: 6 }}>Nome</div>
            <input value={ex.nome} maxLength={160} onChange={e => onChange({ nome: e.target.value })} style={input} placeholder="ex.: Supino reto (barra)"/>
          </div>

          <div>
            <div style={{ ...label, marginBottom: 6 }}>Tipo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {([['forca', 'Séries'], ['iso', 'Por tempo'], ['cardio', 'Cardio']] as [TipoEx, string][]).map(([t, nome]) => (
                <button key={t} onClick={() => onChange({
                  tipo: t,
                  duracao_seg: t === 'iso' ? (ex.duracao_seg ?? 30) : ex.duracao_seg,
                  duracao_min: t === 'cardio' ? (ex.duracao_min ?? 10) : ex.duracao_min,
                })} style={{
                  height: 40, borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: ex.tipo === t ? 'rgba(204,255,0,0.1)' : 'var(--surface-2)',
                  border: `1px solid ${ex.tipo === t ? 'var(--accent)' : 'var(--border)'}`,
                  color: ex.tipo === t ? 'var(--accent)' : 'var(--muted)',
                }}>{nome}</button>
              ))}
            </div>
          </div>

          {ex.tipo === 'forca' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Campo nome="Séries"><Stepper value={ex.series} min={1} max={20} onChange={v => onChange({ series: v })}/></Campo>
                <Campo nome="Repetições">
                  <input value={ex.reps} maxLength={14} onChange={e => onChange({ reps: e.target.value })} style={{ ...input, textAlign: 'center' }} placeholder="8 a 12"/>
                </Campo>
              </div>
              <Chave ligado={ex.is_biset} onChange={v => onChange({ is_biset: v })} titulo="Bi-set" sub="Dois exercícios seguidos, sem descanso entre eles"/>
              <Chave ligado={ex.ultima_ate_falha} onChange={v => onChange({ ultima_ate_falha: v })} titulo="Última série até a falha" sub="Faz repetições até não conseguir mais"/>
            </>
          )}
          {ex.tipo === 'iso' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Campo nome="Séries"><Stepper value={ex.series} min={1} max={20} onChange={v => onChange({ series: v })}/></Campo>
              <Campo nome="Segundos"><Stepper value={ex.duracao_seg ?? 30} min={5} max={600} step={5} onChange={v => onChange({ duracao_seg: v })}/></Campo>
            </div>
          )}
          {ex.tipo === 'cardio' && (
            <Campo nome="Minutos"><Stepper value={ex.duracao_min ?? 10} min={1} max={180} onChange={v => onChange({ duracao_min: v })}/></Campo>
          )}
          {ex.tipo !== 'cardio' && (
            <Campo nome="Descanso (segundos)"><Stepper value={ex.descanso_seg ?? 60} min={0} max={600} step={5} onChange={v => onChange({ descanso_seg: v })}/></Campo>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => onMover(-1)} disabled={idx === 0} aria-label="Subir" style={iconBtn(idx === 0)}><Icon name="arrowUp" size={16}/></button>
            <button onClick={() => onMover(1)} disabled={idx === total - 1} aria-label="Descer" style={iconBtn(idx === total - 1)}><Icon name="arrowDown" size={16}/></button>
            <button onClick={onRemover} aria-label="Remover exercício" style={{ ...iconBtn(false), color: 'var(--danger)' }}><Icon name="trash" size={16}/></button>
            <button onClick={onToggle} style={{ ...btn('primary'), height: 42, flex: 1, fontSize: 14, padding: '0 14px' }}>
              <Icon name="check" size={16}/> {duvida ? 'Está certo' : 'Pronto'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const iconBtn = (off: boolean): React.CSSProperties => ({
  width: 42, height: 42, borderRadius: 21, flexShrink: 0, cursor: off ? 'default' : 'pointer',
  background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)', opacity: off ? 0.35 : 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})

function Campo({ nome, children }: { nome: string; children: React.ReactNode }) {
  return <div><div style={{ ...label, marginBottom: 6 }}>{nome}</div>{children}</div>
}

function Stepper({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  const b = (off: boolean): React.CSSProperties => ({
    width: 44, height: 48, border: 0, background: 'transparent', color: off ? 'var(--muted-3)' : 'var(--text)', cursor: off ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 48, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="Diminuir" style={b(value <= min)}><Icon name="minus" size={16}/></button>
      <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="Aumentar" style={b(value >= max)}><Icon name="plus" size={16}/></button>
    </div>
  )
}

function Chave({ ligado, onChange, titulo, sub }: { ligado: boolean; onChange: (v: boolean) => void; titulo: string; sub: string }) {
  return (
    <button role="switch" aria-checked={ligado} onClick={() => onChange(!ligado)} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 0, background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', color: 'var(--text)',
    }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{titulo}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ width: 46, height: 28, borderRadius: 14, flexShrink: 0, position: 'relative', transition: 'background 150ms', background: ligado ? 'var(--accent)' : 'var(--surface-3)' }}>
        <span style={{ position: 'absolute', top: 3, left: ligado ? 21 : 3, width: 22, height: 22, borderRadius: 11, transition: 'left 150ms', background: ligado ? 'var(--accent-ink)' : 'var(--muted)' }}/>
      </span>
    </button>
  )
}

// ── O que veio além dos exercícios (rotação, metodologia, cardio) ────────────

function ProgramaCard({ programa }: { programa: Leitura['programa'] }) {
  const cardio = programa.cardio
  return (
    <div style={{ marginTop: 24, padding: 16, borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
        <Icon name="calendar" size={18} color="var(--accent)"/> Também encontramos
      </div>
      <p style={{ marginTop: 6, fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.5 }}>
        Isso fica guardado com a importação. Em breve o app vai usar para mostrar o treino do dia, a progressão de carga e o cardio.
      </p>

      {programa.semanas.length > 0 && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 3, fontSize: 12, textAlign: 'center' }}>
            <thead>
              <tr style={{ color: 'var(--muted-2)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                <th></th>{ORDEM_DIAS.map(d => <th key={d} style={{ fontWeight: 500 }}>{DIAS[d]}</th>)}
              </tr>
            </thead>
            <tbody>
              {programa.semanas.map(s => (
                <tr key={s.semana}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-2)', paddingRight: 4 }}>S{s.semana}</td>
                  {ORDEM_DIAS.map(d => {
                    const l = s.dias.find(x => x.dia === d)?.letra
                    return <td key={d} style={{ height: 30, borderRadius: 8, background: l ? 'var(--surface-2)' : 'transparent', fontFamily: 'var(--font-mono)', fontWeight: 700, color: l ? 'var(--text)' : 'var(--muted-3)' }}>{l ?? '–'}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {programa.semanas.some(s => s.metodologia || s.progressao_carga) && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              {programa.semanas.map(s => (s.metodologia || s.progressao_carga) && (
                <div key={s.semana} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-2)', width: 24 }}>S{s.semana}</span>
                  <span>{[s.metodologia, s.progressao_carga].filter(Boolean).join(' · ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cardio && (
        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55 }}>
          <div style={{ fontWeight: 600 }}>
            Cardio{cardio.antes_min ? ` · ${cardio.antes_min} min antes` : ''}{cardio.depois_min ? ` · ${cardio.depois_min} min depois` : ''}
          </div>
          {cardio.semanas.map(s => (
            <div key={s.semana} style={{ color: 'var(--muted)' }}>
              S{s.semana}: {[s.minutos ? `${s.minutos} min` : null, s.metodo, s.bpm].filter(Boolean).join(' · ')}
            </div>
          ))}
          {cardio.observacao && <div style={{ color: 'var(--muted)' }}>{cardio.observacao}</div>}
        </div>
      )}

      {programa.observacoes.length > 0 && (
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
          {programa.observacoes.map((o, i) => <div key={i}>• {o}</div>)}
        </div>
      )}
    </div>
  )
}
