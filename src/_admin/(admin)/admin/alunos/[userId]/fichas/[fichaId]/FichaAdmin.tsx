'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Exercicio = Database['public']['Tables']['exercicios']['Row']
type FichaRow = { id: string; letra: string; nome: string; cor: string; duracao_min: number; ordem: number; user_id: string }

const GRUPOS = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Core', 'Cardio', 'Fullbody']
const TIPOS = [
  { id: 'forca', label: 'Força (séries × reps × carga)' },
  { id: 'iso', label: 'Isométrico (séries × duração)' },
  { id: 'cardio', label: 'Cardio (duração em minutos)' },
]

const EMPTY_FORM = (): Partial<Exercicio> => ({
  nome: '', grupo: null, tipo: 'forca',
  series: 3, reps: '10-12', carga: 0,
  is_biset: false, carga_b: 0,
  descanso: 60, duracao_seg: null, yt_id: null,
})

interface Props {
  ficha: FichaRow
  aluno: { id: string; nome: string }
  exercicios: Exercicio[]
}

export default function FichaAdmin({ ficha, aluno, exercicios: initialExercicios }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [exercicios, setExercicios] = useState(initialExercicios)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEx, setEditEx] = useState<Exercicio | null>(null)
  const [form, setForm] = useState<Partial<Exercicio>>(EMPTY_FORM())
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Exercicio | null>(null)
  const [moving, setMoving] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  function openNew() {
    setEditEx(null)
    setForm(EMPTY_FORM())
    setModalOpen(true)
  }

  function openEdit(ex: Exercicio) {
    setEditEx(ex)
    setForm({ ...ex })
    setModalOpen(true)
  }

  function setField<K extends keyof Exercicio>(key: K, value: Exercicio[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function saveExercicio() {
    if (!form.nome?.trim()) return
    setSaving(true)
    if (editEx) {
      const { data } = await supabase.from('exercicios')
        .update({
          nome: form.nome?.trim(),
          grupo: form.grupo ?? null,
          tipo: form.tipo ?? 'forca',
          series: form.series ?? 3,
          reps: form.reps ?? '10-12',
          carga: form.carga ?? 0,
          is_biset: form.is_biset ?? false,
          carga_b: form.is_biset ? (form.carga_b ?? 0) : 0,
          descanso: form.descanso ?? 60,
          duracao_seg: form.duracao_seg ?? null,
          yt_id: form.yt_id?.trim() || null,
        })
        .eq('id', editEx.id)
        .select('*')
        .single()
      if (data) setExercicios(prev => prev.map(e => e.id === editEx.id ? data : e))
    } else {
      const { data } = await supabase.from('exercicios')
        .insert({
          ficha_id: ficha.id,
          nome: form.nome!.trim(),
          grupo: form.grupo ?? null,
          tipo: form.tipo ?? 'forca',
          series: form.series ?? 3,
          reps: form.reps ?? '10-12',
          carga: form.carga ?? 0,
          is_biset: form.is_biset ?? false,
          carga_b: form.is_biset ? (form.carga_b ?? 0) : 0,
          descanso: form.descanso ?? 60,
          duracao_seg: form.duracao_seg ?? null,
          yt_id: form.yt_id?.trim() || null,
          ordem: exercicios.length,
        })
        .select('*')
        .single()
      if (data) setExercicios(prev => [...prev, data])
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function deleteExercicio(ex: Exercicio) {
    setDeletingId(ex.id)
    await supabase.from('exercicios').delete().eq('id', ex.id)
    setExercicios(prev => prev.filter(e => e.id !== ex.id))
    setDeletingId(null)
    setConfirmDelete(null)
  }

  async function duplicateExercicio(ex: Exercicio, idx: number) {
    setDuplicatingId(ex.id)
    const insertOrdem = idx + 1
    // Shift ordem of all exercises after insertion point
    const after = exercicios.slice(insertOrdem)
    await Promise.all(after.map((e, i) =>
      supabase.from('exercicios').update({ ordem: insertOrdem + 1 + i }).eq('id', e.id)
    ))
    const { data } = await supabase.from('exercicios').insert({
      ficha_id: ficha.id,
      nome: ex.nome + ' (cópia)',
      grupo: ex.grupo,
      tipo: ex.tipo,
      series: ex.series,
      reps: ex.reps,
      carga: ex.carga,
      descanso: ex.descanso,
      duracao_seg: ex.duracao_seg,
      yt_id: ex.yt_id,
      ordem: insertOrdem,
    }).select('*').single()
    if (data) {
      setExercicios(prev => {
        const next = [...prev]
        next.splice(insertOrdem, 0, data)
        return next
      })
    }
    setDuplicatingId(null)
  }

  async function moveExercicio(idx: number, dir: -1 | 1) {
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= exercicios.length) return
    const newList = [...exercicios]
    ;[newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]]
    setExercicios(newList)
    setMoving(newList[idx].id + newList[targetIdx].id)
    await Promise.all([
      supabase.from('exercicios').update({ ordem: idx }).eq('id', newList[targetIdx].id),
      supabase.from('exercicios').update({ ordem: targetIdx }).eq('id', newList[idx].id),
    ])
    setMoving(null)
  }

  const isForca = form.tipo === 'forca'
  const isIso = form.tipo === 'iso'
  const isCardio = form.tipo === 'cardio'

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--surface-1)',
        borderRight: '1px solid var(--border)', padding: '24px 0',
        position: 'sticky', top: 0, height: '100dvh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <Link href={`/admin/alunos/${aluno.id}`} style={{ textDecoration: 'none', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em' }}>
            ← VOLTAR
          </Link>
        </div>
        <div style={{ padding: '20px', flex: 1 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: `${ficha.cor}18`, color: ficha.cor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20,
            marginBottom: 12,
          }}>
            {ficha.letra}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, lineHeight: 1.3 }}>{ficha.nome}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.08em', marginBottom: 16 }}>
            ALUNO: {aluno.nome.split(' ')[0].toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
            {exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''} · {ficha.duracao_min}min
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', margin: 0 }}>
            Exercícios
          </h1>
          <button onClick={openNew} style={{
            height: 38, padding: '0 18px', borderRadius: 10,
            background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.25)',
            color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            + Adicionar exercício
          </button>
        </div>

        {exercicios.length === 0 ? (
          <div style={{
            padding: '40px 24px', borderRadius: 16, textAlign: 'center',
            background: 'var(--surface-1)', border: '1px dashed var(--border-strong)',
            color: 'var(--muted-2)', fontSize: 14,
          }}>
            Nenhum exercício. Clique em "+ Adicionar exercício" para começar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercicios.map((ex, idx) => (
              <ExercicioRow
                key={ex.id}
                ex={ex}
                idx={idx}
                total={exercicios.length}
                moving={!!moving}
                duplicating={duplicatingId === ex.id}
                onEdit={() => openEdit(ex)}
                onDelete={() => setConfirmDelete(ex)}
                onMove={dir => moveExercicio(idx, dir)}
                onDuplicate={() => duplicateExercicio(ex, idx)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Exercise form modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 540,
            background: 'var(--surface-1)', borderRadius: 20,
            border: '1px solid var(--border-strong)', padding: '24px 24px 28px',
            animation: 'scale-in 200ms ease both',
            maxHeight: '90dvh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', margin: 0 }}>
                {editEx ? 'Editar exercício' : 'Novo exercício'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Nome */}
            <Field label="Nome do exercício">
              <input
                autoFocus type="text" value={form.nome ?? ''} placeholder="ex: Supino Reto com Barra"
                onChange={e => setField('nome', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {/* Grupo muscular */}
              <Field label="Grupo muscular">
                <select value={form.grupo ?? ''} onChange={e => setField('grupo', e.target.value || null)} style={selectStyle}>
                  <option value="">— Nenhum —</option>
                  {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              {/* Tipo */}
              <Field label="Tipo">
                <select value={form.tipo ?? 'forca'} onChange={e => setField('tipo', e.target.value)} style={selectStyle}>
                  {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label.split(' (')[0]}</option>)}
                </select>
              </Field>
            </div>

            {/* Força fields */}
            {(isForca || isIso) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <Field label="Séries">
                  <input type="number" min={1} max={20} value={form.series ?? 3}
                    onChange={e => setField('series', Number(e.target.value))}
                    style={inputStyle} />
                </Field>
                {isForca ? (
                  <Field label="Repetições (ex: 10-12)">
                    <input type="text" value={form.reps ?? '10-12'}
                      onChange={e => setField('reps', e.target.value)}
                      style={inputStyle} />
                  </Field>
                ) : (
                  <Field label="Duração por série (seg)">
                    <input type="number" min={1} value={form.duracao_seg ?? 30}
                      onChange={e => setField('duracao_seg', Number(e.target.value))}
                      style={inputStyle} />
                  </Field>
                )}
              </div>
            )}

            {isCardio && (
              <Field label="Duração total (minutos)">
                <input type="number" min={1} max={300} value={form.duracao_seg ? Math.round(form.duracao_seg / 60) : 20}
                  onChange={e => setField('duracao_seg', Number(e.target.value) * 60)}
                  style={{ ...inputStyle, width: 120 }} />
              </Field>
            )}

            {isForca && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Field label={form.is_biset ? 'Carga A (kg)' : 'Carga inicial (kg)'}>
                    <input type="number" min={0} step={0.5} value={form.carga ?? 0}
                      onChange={e => setField('carga', Number(e.target.value))}
                      style={inputStyle} />
                  </Field>
                  <Field label="Descanso (seg)">
                    <input type="number" min={0} max={600} value={form.descanso ?? 60}
                      onChange={e => setField('descanso', Number(e.target.value))}
                      style={inputStyle} />
                  </Field>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => setField('is_biset', !form.is_biset)}
                    style={{
                      height: 34, padding: '0 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: form.is_biset ? 'rgba(167,139,250,0.15)' : 'var(--surface-2)',
                      border: `1px solid ${form.is_biset ? '#A78BFA' : 'var(--border)'}`,
                      color: form.is_biset ? '#A78BFA' : 'var(--muted)',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                      transition: 'all 150ms', flexShrink: 0,
                    }}
                  >
                    {form.is_biset ? '✓ BISET' : '+ BISET'}
                  </button>
                  {form.is_biset && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 4 }}>Carga B (kg)</div>
                      <input type="number" min={0} step={0.5} value={form.carga_b ?? 0}
                        onChange={e => setField('carga_b', Number(e.target.value))}
                        style={{ ...inputStyle, border: '1px solid #A78BFA60', background: 'rgba(167,139,250,0.08)' }} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* YouTube */}
            <Field label="YouTube video ID (opcional)">
              <input
                type="text" value={form.yt_id ?? ''} placeholder="ex: dQw4w9WgXcQ"
                onChange={e => setField('yt_id', e.target.value || null)}
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>
                Cole apenas o ID do vídeo (parte após v= na URL do YouTube)
              </div>
            </Field>

            <button onClick={saveExercicio} disabled={saving || !form.nome?.trim()} style={{
              width: '100%', height: 46, borderRadius: 12, fontWeight: 700, fontSize: 14,
              background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, cursor: 'pointer',
              opacity: (saving || !form.nome?.trim()) ? 0.5 : 1, marginTop: 8,
            }}>
              {saving ? 'Salvando…' : editEx ? 'Salvar alterações' : 'Adicionar exercício'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setConfirmDelete(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 400,
            background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-strong)',
            padding: '24px', animation: 'scale-in 200ms ease both',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>Excluir exercício?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Remover <strong style={{ color: 'var(--text)' }}>{confirmDelete.nome}</strong> permanentemente?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, height: 44, borderRadius: 10, background: 'var(--surface-3)',
                border: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={() => deleteExercicio(confirmDelete)} disabled={!!deletingId} style={{
                flex: 1, height: 44, borderRadius: 10,
                background: 'rgba(255,79,94,0.12)', border: '1px solid rgba(255,79,94,0.4)',
                color: 'var(--danger)', fontWeight: 700, cursor: 'pointer',
                opacity: deletingId ? 0.5 : 1,
              }}>
                {deletingId ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ExercicioRow ─────────────────────────────────────────────────────────────

function ExercicioRow({
  ex, idx, total, moving, duplicating, onEdit, onDelete, onMove, onDuplicate,
}: {
  ex: Exercicio; idx: number; total: number; moving: boolean; duplicating: boolean
  onEdit: () => void; onDelete: () => void; onMove: (dir: -1 | 1) => void; onDuplicate: () => void
}) {
  const isForca = ex.tipo === 'forca'
  const isIso = ex.tipo === 'iso'

  let meta = ''
  if (isForca) meta = ex.is_biset
    ? `${ex.series}×${ex.reps} · ${ex.carga}/${ex.carga_b}kg · descanso ${ex.descanso}s`
    : `${ex.series}×${ex.reps} · ${ex.carga}kg · descanso ${ex.descanso}s`
  else if (isIso) meta = `${ex.series}×${ex.duracao_seg}s`
  else meta = ex.duracao_seg ? `${Math.round(ex.duracao_seg / 60)}min` : '—'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', borderRadius: 12,
      background: 'var(--surface-1)', border: '1px solid var(--border)',
    }}>
      {/* Order */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: 'var(--surface-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', flexShrink: 0,
      }}>
        {idx + 1}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ex.nome}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {ex.is_biset && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(167,139,250,0.15)', color: '#A78BFA', letterSpacing: '0.08em' }}>
              BISET
            </span>
          )}
          {ex.grupo && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
              padding: '2px 7px', borderRadius: 5,
              background: 'var(--surface-3)', color: 'var(--muted-2)',
            }}>
              {ex.grupo.toUpperCase()}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>
            {meta}
          </span>
          {ex.yt_id && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.06em' }}>
              ▶ VIDEO
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        <button onClick={() => onMove(-1)} disabled={idx === 0 || moving} style={{ ...smallBtn, opacity: idx === 0 ? 0.25 : 1 }} title="Mover para cima">↑</button>
        <button onClick={() => onMove(1)} disabled={idx === total - 1 || moving} style={{ ...smallBtn, opacity: idx === total - 1 ? 0.25 : 1 }} title="Mover para baixo">↓</button>
        <button onClick={onDuplicate} disabled={duplicating} style={{ ...smallBtn, opacity: duplicating ? 0.4 : 1 }} title="Duplicar exercício">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button onClick={onEdit} style={smallBtn} title="Editar">✏️</button>
        <button onClick={onDelete} style={smallBtn} title="Excluir">🗑️</button>
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, borderRadius: 9, padding: '0 12px',
  background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
  color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none', cursor: 'pointer',
}

const smallBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface-2)', cursor: 'pointer', fontSize: 13,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--muted)', flexShrink: 0,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <label style={{
        display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--muted-2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}
