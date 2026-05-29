'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Ficha = {
  id: string; letra: string; nome: string; cor: string
  icone: string | null; duracao_min: number; ordem: number
  exercicios: { count: number }[]
}

const COR_PRESETS = ['#CCFF00', '#00E5FF', '#FF5E1F', '#FF3B5C', '#A78BFA', '#34D399']
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const OBJETIVOS: Record<string, string> = {
  hipertrofia: 'Hipertrofia', emagrecimento: 'Emagrecimento',
  forca: 'Força', condicionamento: 'Condicionamento',
}

interface Props {
  aluno: { id: string; nome: string; objetivo: string | null; streak: number }
  fichas: Ficha[]
  treinosTotal: number
  myRole: string
}

export default function AlunoDetail({ aluno, fichas: initialFichas, treinosTotal, myRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [fichas, setFichas] = useState(initialFichas)

  // Nova ficha modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editFicha, setEditFicha] = useState<Ficha | null>(null)
  const [fichaNome, setFichaNome] = useState('')
  const [fichaLetra, setFichaLetra] = useState('')
  const [fichaCor, setFichaCor] = useState(COR_PRESETS[0])
  const [fichaDuracao, setFichaDuracao] = useState(60)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Ficha | null>(null)

  const iniciais = aluno.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  function openNewFicha() {
    const usadas = new Set(fichas.map(f => f.letra))
    const proxima = LETRAS.split('').find(l => !usadas.has(l)) ?? 'A'
    setEditFicha(null)
    setFichaNome('')
    setFichaLetra(proxima)
    setFichaCor(COR_PRESETS[fichas.length % COR_PRESETS.length])
    setFichaDuracao(60)
    setModalOpen(true)
  }

  function openEditFicha(f: Ficha) {
    setEditFicha(f)
    setFichaNome(f.nome)
    setFichaLetra(f.letra)
    setFichaCor(f.cor)
    setFichaDuracao(f.duracao_min)
    setModalOpen(true)
  }

  async function saveFicha() {
    if (!fichaNome.trim() || !fichaLetra) return
    setSaving(true)
    if (editFicha) {
      const { data } = await supabase.from('fichas')
        .update({ nome: fichaNome.trim(), letra: fichaLetra.toUpperCase(), cor: fichaCor, duracao_min: fichaDuracao })
        .eq('id', editFicha.id)
        .select('id, letra, nome, cor, icone, duracao_min, ordem, exercicios(count)')
        .single()
      if (data) setFichas(prev => prev.map(f => f.id === editFicha.id ? data as Ficha : f))
    } else {
      const { data } = await supabase.from('fichas')
        .insert({
          user_id: aluno.id,
          nome: fichaNome.trim(),
          letra: fichaLetra.toUpperCase(),
          cor: fichaCor,
          duracao_min: fichaDuracao,
          ordem: fichas.length,
        })
        .select('id, letra, nome, cor, icone, duracao_min, ordem, exercicios(count)')
        .single()
      if (data) setFichas(prev => [...prev, data as Ficha])
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function deleteFicha(ficha: Ficha) {
    setDeletingId(ficha.id)
    await supabase.from('fichas').delete().eq('id', ficha.id)
    setFichas(prev => prev.filter(f => f.id !== ficha.id))
    setDeletingId(null)
    setConfirmDelete(null)
  }

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
          <Link href="/admin" style={{ textDecoration: 'none', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em' }}>
            ← VOLTAR
          </Link>
        </div>
        <div style={{ padding: '20px 20px', flex: 1 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-3)',
            border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            marginBottom: 12,
          }}>
            {iniciais}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{aluno.nome}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
            {aluno.objetivo ? (OBJETIVOS[aluno.objetivo] ?? aluno.objetivo).toUpperCase() : '—'}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
            <Stat label="STREAK" value={`${aluno.streak}d`} color="#ffb547" />
            <Stat label="TREINOS" value={String(treinosTotal)} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', margin: 0 }}>
            Fichas de treino
          </h1>
          <button onClick={openNewFicha} style={{
            height: 38, padding: '0 18px', borderRadius: 10,
            background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.25)',
            color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            + Nova ficha
          </button>
        </div>

        {fichas.length === 0 ? (
          <div style={{
            padding: '40px 24px', borderRadius: 16, textAlign: 'center',
            background: 'var(--surface-1)', border: '1px dashed var(--border-strong)',
            color: 'var(--muted-2)', fontSize: 14,
          }}>
            Nenhuma ficha criada ainda. Clique em "+ Nova ficha" para começar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fichas.map(f => {
              const exCount = f.exercicios?.[0]?.count ?? 0
              return (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 14,
                  background: 'var(--surface-1)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${f.cor}18`, color: f.cor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16,
                  }}>
                    {f.letra}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{f.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                      {exCount} EXERCÍCIO{exCount !== 1 ? 'S' : ''} · {f.duracao_min}MIN
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href={`/admin/alunos/${aluno.id}/fichas/${f.id}`} style={{
                      height: 34, padding: '0 14px', borderRadius: 8, display: 'flex', alignItems: 'center',
                      background: `${f.cor}18`, border: `1px solid ${f.cor}40`,
                      color: f.cor, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    }}>
                      Gerenciar
                    </Link>
                    <button onClick={() => openEditFicha(f)} style={iconBtn}>
                      ✏️
                    </button>
                    <button onClick={() => setConfirmDelete(f)} disabled={deletingId === f.id} style={{ ...iconBtn, opacity: deletingId === f.id ? 0.5 : 1 }}>
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Ficha modal */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title={editFicha ? 'Editar ficha' : 'Nova ficha'}>
          <Field label="Nome">
            <input
              autoFocus type="text" value={fichaNome}
              onChange={e => setFichaNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveFicha()}
              placeholder="ex: Push · Peito · Ombro · Tríceps"
              style={inputStyle}
            />
          </Field>
          <Field label="Letra">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LETRAS.slice(0, 10).split('').map(l => (
                <button key={l} onClick={() => setFichaLetra(l)} style={{
                  width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
                  background: fichaLetra === l ? `${fichaCor}25` : 'var(--surface-2)',
                  border: `1px solid ${fichaLetra === l ? fichaCor : 'var(--border)'}`,
                  color: fichaLetra === l ? fichaCor : 'var(--muted)',
                }}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Cor">
            <div style={{ display: 'flex', gap: 10 }}>
              {COR_PRESETS.map(cor => (
                <button key={cor} onClick={() => setFichaCor(cor)} style={{
                  width: 32, height: 32, borderRadius: '50%', background: cor, border: 0, cursor: 'pointer',
                  outline: fichaCor === cor ? `3px solid ${cor}` : 'none', outlineOffset: 2,
                  opacity: fichaCor === cor ? 1 : 0.4,
                }} />
              ))}
            </div>
          </Field>
          <Field label="Duração estimada (min)">
            <input
              type="number" min={1} max={300} value={fichaDuracao}
              onChange={e => setFichaDuracao(Number(e.target.value))}
              style={{ ...inputStyle, width: 100 }}
            />
          </Field>
          <button onClick={saveFicha} disabled={saving || !fichaNome.trim()} style={{
            width: '100%', height: 46, borderRadius: 12, fontWeight: 700, fontSize: 14,
            background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, cursor: 'pointer',
            opacity: (saving || !fichaNome.trim()) ? 0.5 : 1, marginTop: 8,
          }}>
            {saving ? 'Salvando…' : editFicha ? 'Salvar alterações' : 'Criar ficha'}
          </button>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title="Excluir ficha?">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
            Isso removerá permanentemente a ficha <strong style={{ color: 'var(--text)' }}>{confirmDelete.nome}</strong> e todos os seus exercícios. Essa ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmDelete(null)} style={{
              flex: 1, height: 44, borderRadius: 10, background: 'var(--surface-3)', border: '1px solid var(--border)',
              color: 'var(--muted)', fontWeight: 600, cursor: 'pointer',
            }}>
              Cancelar
            </button>
            <button onClick={() => deleteFicha(confirmDelete)} disabled={!!deletingId} style={{
              flex: 1, height: 44, borderRadius: 10,
              background: 'rgba(255,79,94,0.12)', border: '1px solid rgba(255,79,94,0.4)',
              color: 'var(--danger)', fontWeight: 700, cursor: 'pointer',
              opacity: deletingId ? 0.5 : 1,
            }}>
              {deletingId ? 'Excluindo…' : 'Sim, excluir'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Shared UI ──────────────────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface-2)', cursor: 'pointer', fontSize: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, borderRadius: 10, padding: '0 12px',
  background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
  color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 460,
        background: 'var(--surface-1)', borderRadius: 20,
        border: '1px solid var(--border-strong)', padding: '24px 24px 28px',
        animation: 'scale-in 200ms ease both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
