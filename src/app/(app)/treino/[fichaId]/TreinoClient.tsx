'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Ficha = Database['public']['Tables']['fichas']['Row']
type Exercicio = Database['public']['Tables']['exercicios']['Row']

interface SetState {
  done: boolean
  carga: number
  reps: number
}

function buildInitialSets(exercicios: Exercicio[]): Record<string, SetState[]> {
  const sets: Record<string, SetState[]> = {}
  for (const ex of exercicios) {
    sets[ex.id] = Array.from({ length: ex.series }, () => ({
      done: false,
      carga: ex.carga,
      reps: parseInt(ex.reps?.split('-')[0] ?? '10') || 10,
    }))
  }
  return sets
}

export default function TreinoClient({
  ficha, exercicios, userId,
}: { ficha: Ficha; exercicios: Exercicio[]; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [sets, setSets] = useState(() => buildInitialSets(exercicios))
  const [startTime] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [showAddEx, setShowAddEx] = useState(false)
  const [newEx, setNewEx] = useState({ nome: '', series: 3, reps: '10-12', carga: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startTime])

  const totalSets = Object.values(sets).flat().length
  const doneSets = Object.values(sets).flat().filter(s => s.done).length
  const progress = totalSets > 0 ? doneSets / totalSets : 0
  const elapsed_min = Math.floor(elapsed / 60)
  const elapsed_sec = elapsed % 60

  function toggleSet(exId: string, idx: number) {
    setSets(prev => {
      const next = { ...prev, [exId]: [...prev[exId]] }
      next[exId][idx] = { ...next[exId][idx], done: !next[exId][idx].done }
      return next
    })
  }

  function updateSet(exId: string, idx: number, field: 'carga' | 'reps', val: number) {
    setSets(prev => {
      const next = { ...prev, [exId]: [...prev[exId]] }
      next[exId][idx] = { ...next[exId][idx], [field]: val }
      return next
    })
  }

  async function addExercicio() {
    if (!newEx.nome.trim()) return
    setSaving(true)
    const { data } = await supabase.from('exercicios').insert({
      ficha_id: ficha.id,
      nome: newEx.nome.trim(),
      series: newEx.series,
      reps: newEx.reps,
      carga: newEx.carga,
      ordem: exercicios.length,
    }).select().single()

    if (data) {
      setSets(prev => ({
        ...prev,
        [data.id]: Array.from({ length: data.series }, () => ({
          done: false, carga: data.carga, reps: parseInt(data.reps?.split('-')[0] ?? '10') || 10,
        })),
      }))
      exercicios.push(data)
    }
    setNewEx({ nome: '', series: 3, reps: '10-12', carga: 0 })
    setShowAddEx(false)
    setSaving(false)
  }

  async function finalizarTreino() {
    setFinishing(true)
    const durMin = Math.max(1, Math.round(elapsed / 60))

    let volume = 0
    for (const ex of exercicios) {
      for (const s of (sets[ex.id] ?? [])) {
        if (s.done && ex.tipo === 'forca') volume += s.carga * s.reps
      }
    }

    const { data: treino } = await supabase.from('treinos').insert({
      user_id: userId,
      ficha_id: ficha.id,
      ficha_letra: ficha.letra,
      data: new Date().toISOString().split('T')[0],
      duracao_min: durMin,
      volume_total: volume,
    }).select().single()

    if (treino) {
      const logsToInsert = []
      for (const ex of exercicios) {
        for (let i = 0; i < (sets[ex.id] ?? []).length; i++) {
          const s = sets[ex.id][i]
          logsToInsert.push({
            treino_id: treino.id,
            exercicio_id: ex.id,
            exercicio_nome: ex.nome,
            serie_num: i + 1,
            carga: s.carga,
            reps: ex.tipo === 'forca' ? s.reps : null,
            done: s.done,
          })
        }
      }
      if (logsToInsert.length > 0) {
        await supabase.from('sets_log').insert(logsToInsert)
      }

      // Atualiza cargas dos exercícios com o que foi usado
      for (const ex of exercicios) {
        const doneSetsForEx = (sets[ex.id] ?? []).filter(s => s.done)
        if (doneSetsForEx.length > 0) {
          const avgCarga = doneSetsForEx.reduce((a, s) => a + s.carga, 0) / doneSetsForEx.length
          await supabase.from('exercicios').update({ carga: avgCarga }).eq('id', ex.id)
        }
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-12 pb-3"
        style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg active:opacity-60"
            style={{ background: 'var(--surface-2)' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7l6 6" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-bold text-base">{ficha.nome}</div>
            <div className="text-xs font-mono" style={{ color: 'var(--muted-2)' }}>
              {String(elapsed_min).padStart(2,'0')}:{String(elapsed_sec).padStart(2,'0')} · {doneSets}/{totalSets} séries
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm"
            style={{ background: `${ficha.cor}20`, color: ficha.cor }}>
            {ficha.letra}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%`, background: ficha.cor }} />
        </div>
      </div>

      {/* Exercícios */}
      <div className="flex flex-col gap-4 px-4 py-4">
        {exercicios.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>
            Nenhum exercício nessa ficha ainda.
          </div>
        ) : (
          exercicios.map(ex => (
            <ExercicioCard key={ex.id} ex={ex} sets={sets[ex.id] ?? []}
              fichaColor={ficha.cor}
              onToggle={(idx) => toggleSet(ex.id, idx)}
              onUpdate={(idx, field, val) => updateSet(ex.id, idx, field, val)}
            />
          ))
        )}

        {/* Adicionar exercício */}
        {showAddEx ? (
          <div className="p-4 rounded-2xl flex flex-col gap-3"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-strong)' }}>
            <input
              type="text" placeholder="Nome do exercício"
              value={newEx.nome} onChange={e => setNewEx(p => ({ ...p, nome: e.target.value }))}
              className="w-full h-11 rounded-xl px-3 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
            />
            <div className="flex gap-2">
              {[
                { label: 'Séries', field: 'series' as const, type: 'number' },
                { label: 'Reps', field: 'reps' as const, type: 'text' },
                { label: 'Carga (kg)', field: 'carga' as const, type: 'number' },
              ].map(({ label, field, type }) => (
                <div key={field} className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>{label}</span>
                  <input type={type}
                    value={newEx[field]}
                    onChange={e => setNewEx(p => ({ ...p, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full h-10 rounded-xl px-2 text-sm text-center outline-none font-mono"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddEx(false)}
                className="flex-1 h-10 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}>
                Cancelar
              </button>
              <button onClick={addExercicio} disabled={saving}
                className="flex-1 h-10 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: ficha.cor, color: 'var(--accent-ink)' }}>
                {saving ? '…' : 'Adicionar'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddEx(true)}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-semibold active:opacity-60"
            style={{ background: 'var(--surface-1)', border: '1px dashed var(--border-strong)', color: 'var(--muted)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Adicionar exercício
          </button>
        )}

        {/* Finalizar */}
        {doneSets > 0 && (
          <button onClick={finalizarTreino} disabled={finishing}
            className="w-full h-14 rounded-2xl font-bold text-base mt-2 disabled:opacity-50 transition-opacity active:opacity-70"
            style={{ background: ficha.cor, color: 'var(--accent-ink)' }}>
            {finishing ? 'Salvando…' : `Finalizar treino · ${elapsed_min}min`}
          </button>
        )}
      </div>
    </div>
  )
}

function ExercicioCard({ ex, sets, fichaColor, onToggle, onUpdate }: {
  ex: Exercicio
  sets: SetState[]
  fichaColor: string
  onToggle: (idx: number) => void
  onUpdate: (idx: number, field: 'carga' | 'reps', val: number) => void
}) {
  const doneSets = sets.filter(s => s.done).length
  const allDone = doneSets === sets.length && sets.length > 0

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface-1)',
        border: `1px solid ${allDone ? fichaColor + '50' : 'var(--border)'}`,
        transition: 'border-color 0.3s',
      }}>
      {/* Exercise header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="flex-1">
          <div className="font-semibold text-sm">{ex.nome}</div>
          {ex.grupo && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>{ex.grupo}</div>
          )}
        </div>
        <div className="text-xs font-mono font-semibold" style={{ color: allDone ? fichaColor : 'var(--muted-2)' }}>
          {doneSets}/{sets.length}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_88px_88px_36px] gap-1 px-4 pb-1">
        {['', 'SÉRIE', 'KG', 'REPS', ''].map((h, i) => (
          <div key={i} className="text-[10px] font-mono font-semibold tracking-widest text-center"
            style={{ color: 'var(--muted-3)' }}>{h}</div>
        ))}
      </div>

      {/* Sets */}
      <div className="flex flex-col pb-2">
        {sets.map((s, idx) => (
          <SetRow key={idx} idx={idx} set={s} fichaColor={fichaColor}
            onToggle={() => onToggle(idx)}
            onCarga={v => onUpdate(idx, 'carga', v)}
            onReps={v => onUpdate(idx, 'reps', v)}
          />
        ))}
      </div>

      {/* YouTube link */}
      {ex.yt_id && (
        <div className="px-4 pb-3">
          <a href={`https://youtube.com/watch?v=${ex.yt_id}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono"
            style={{ color: 'var(--muted-2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z" fill="var(--danger)"/>
              <path d="M10 8l6 4-6 4V8z" fill="white"/>
            </svg>
            Ver execução
          </a>
        </div>
      )}
    </div>
  )
}

function SetRow({ idx, set, fichaColor, onToggle, onCarga, onReps }: {
  idx: number; set: SetState; fichaColor: string
  onToggle: () => void; onCarga: (v: number) => void; onReps: (v: number) => void
}) {
  const [editCarga, setEditCarga] = useState(false)
  const [editReps, setEditReps] = useState(false)
  const [draftCarga, setDraftCarga] = useState(String(set.carga))
  const [draftReps, setDraftReps] = useState(String(set.reps))

  function commitCarga() {
    const n = parseFloat(draftCarga.replace(',', '.'))
    if (!isNaN(n)) onCarga(n)
    setEditCarga(false)
  }
  function commitReps() {
    const n = parseInt(draftReps)
    if (!isNaN(n)) onReps(n)
    setEditReps(false)
  }

  return (
    <div className="grid grid-cols-[28px_1fr_88px_88px_36px] gap-1 items-center px-4 py-1.5"
      style={{ opacity: set.done ? 0.7 : 1 }}>
      {/* Set number */}
      <div className="text-xs font-mono text-center" style={{ color: 'var(--muted-2)' }}>
        {idx + 1}
      </div>
      {/* Divider visual */}
      <div />

      {/* Carga */}
      <div className="flex justify-center">
        {editCarga ? (
          <input autoFocus type="text" inputMode="decimal"
            value={draftCarga}
            onChange={e => setDraftCarga(e.target.value)}
            onBlur={commitCarga}
            onKeyDown={e => { if (e.key === 'Enter') commitCarga() }}
            className="w-full h-9 rounded-lg text-center text-sm font-mono font-semibold outline-none"
            style={{ background: 'var(--surface-3)', border: `1px solid ${fichaColor}`, color: 'var(--text)' }}
          />
        ) : (
          <button onClick={() => { setDraftCarga(String(set.carga)); setEditCarga(true) }}
            className="w-full h-9 rounded-lg text-sm font-mono font-semibold"
            style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', color: set.done ? fichaColor : 'var(--text)' }}>
            {set.carga}
            <span className="text-[10px] ml-0.5" style={{ color: 'var(--muted-2)' }}>kg</span>
          </button>
        )}
      </div>

      {/* Reps */}
      <div className="flex justify-center">
        {editReps ? (
          <input autoFocus type="text" inputMode="numeric"
            value={draftReps}
            onChange={e => setDraftReps(e.target.value)}
            onBlur={commitReps}
            onKeyDown={e => { if (e.key === 'Enter') commitReps() }}
            className="w-full h-9 rounded-lg text-center text-sm font-mono font-semibold outline-none"
            style={{ background: 'var(--surface-3)', border: `1px solid ${fichaColor}`, color: 'var(--text)' }}
          />
        ) : (
          <button onClick={() => { setDraftReps(String(set.reps)); setEditReps(true) }}
            className="w-full h-9 rounded-lg text-sm font-mono font-semibold"
            style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', color: set.done ? fichaColor : 'var(--text)' }}>
            {set.reps}
            <span className="text-[10px] ml-0.5" style={{ color: 'var(--muted-2)' }}>rep</span>
          </button>
        )}
      </div>

      {/* Check */}
      <div className="flex justify-center">
        <button onClick={onToggle}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
          style={{
            background: set.done ? fichaColor : 'var(--surface-2)',
            border: set.done ? 'none' : '1px solid var(--border-strong)',
            boxShadow: set.done ? `0 0 12px ${fichaColor}40` : 'none',
          }}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
            <path d="M1.5 6L5.5 10L12.5 1.5" stroke={set.done ? '#0a0b0d' : 'var(--muted-2)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
