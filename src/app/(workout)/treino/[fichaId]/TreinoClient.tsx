'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/icons'
import { Sparkline, LineChart } from '@/components/charts'
import type { Database } from '@/lib/supabase/types'
import { getActiveSession, setActiveSession, clearActiveSession } from '@/lib/activeSession'

type Ficha = Database['public']['Tables']['fichas']['Row']
type Exercicio = Database['public']['Tables']['exercicios']['Row']

interface SetState {
  done: boolean
  carga: number
  carga_b: number
  reps: number
  duracaoSeg: number
  duracaoMin: number
}

function buildInitialSets(ex: Exercicio): SetState[] {
  if (ex.tipo === 'cardio') {
    return [{ done: false, carga: 0, carga_b: 0, reps: 0, duracaoSeg: 0, duracaoMin: ex.duracao_min ?? 10 }]
  }
  if (ex.tipo === 'iso') {
    return Array.from({ length: ex.series }, () => ({
      done: false, carga: 0, carga_b: 0, reps: 0, duracaoSeg: ex.duracao_seg ?? 30, duracaoMin: 0,
    }))
  }
  const reps = parseInt(String(ex.reps ?? '10').split('-')[0]) || 10
  return Array.from({ length: ex.series }, () => ({
    done: false, carga: ex.carga, carga_b: ex.carga_b ?? 0, reps, duracaoSeg: 0, duracaoMin: 0,
  }))
}

// ── InlineNumber ──────────────────────────────────────────────────────────────
function InlineNumber({ value, onChange, suffix, width = 56, color, fontSize = 17 }: {
  value: number, onChange: (v: number) => void, suffix?: string,
  width?: number, color?: string, fontSize?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!editing) setDraft(String(value)) }, [value, editing])
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])

  function commit() {
    const n = parseFloat(draft.replace(',', '.'))
    if (!isNaN(n)) onChange(n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input ref={inputRef} type="text" inputMode="decimal" value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        style={{
          width, height: 30, padding: '0 6px',
          background: 'var(--surface-3)', border: `1px solid ${color || 'var(--accent)'}`,
          borderRadius: 8, color: 'var(--text)',
          fontFamily: 'var(--font-mono)', fontSize, fontWeight: 600,
          textAlign: 'center', outline: 'none',
        }}
      />
    )
  }
  return (
    <span onClick={() => setEditing(true)} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2,
      minWidth: width, height: 30, padding: '0 6px',
      background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)',
      borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize, fontWeight: 600,
      color: color || 'var(--text)', cursor: 'pointer', fontVariantNumeric: 'tabular-nums',
    }}>
      {value}{suffix && <span style={{ color: 'var(--muted-2)', fontSize: 11, marginLeft: 2 }}>{suffix}</span>}
    </span>
  )
}

// ── SetRow ─────────────────────────────────────────────────────────────────────
function SetRow({ idx, set, tipo, accent, isBiset, onToggle, onUpdate }: {
  idx: number, set: SetState, tipo: string, accent: string, isBiset: boolean,
  onToggle: () => void, onUpdate: (patch: Partial<SetState>) => void,
}) {
  const done = set.done
  const checkBtn = (
    <button onClick={onToggle} style={{
      width: 30, height: 30, borderRadius: 8,
      background: done ? accent : 'rgba(255,255,255,0.05)',
      border: done ? 'none' : '1px solid var(--border-strong)',
      color: done ? 'var(--accent-ink)' : 'var(--muted-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: done ? `0 0 12px ${accent}40` : 'none', cursor: 'pointer',
    }}>
      <Icon name="check" size={16} strokeWidth={2.6} color="currentColor"/>
    </button>
  )
  const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.06em', fontWeight: 600 }
  const unitStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }
  const base: React.CSSProperties = { display: 'grid', alignItems: 'center', padding: '8px 0', gap: 8, opacity: done ? 0.55 : 1, transition: 'opacity 180ms' }

  if (tipo === 'iso') return (
    <div style={{ ...base, gridTemplateColumns: '28px 1fr 36px' }}>
      <div style={labelStyle}>S{idx + 1}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineNumber value={set.duracaoSeg} onChange={v => onUpdate({ duracaoSeg: v })} width={56} fontSize={14}/>
        <span style={unitStyle}>seg</span>
      </div>
      {checkBtn}
    </div>
  )

  if (tipo === 'cardio') return (
    <div style={{ ...base, gridTemplateColumns: '28px 1fr 36px' }}>
      <div style={labelStyle}><Icon name="timer" size={13} color="var(--muted-2)"/></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineNumber value={set.duracaoMin} onChange={v => onUpdate({ duracaoMin: v })} width={56} fontSize={14}/>
        <span style={unitStyle}>min</span>
      </div>
      {checkBtn}
    </div>
  )

  if (isBiset) return (
    <div style={{ ...base, gridTemplateColumns: '28px 1fr auto auto 36px' }}>
      <div style={labelStyle}>S{idx + 1}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineNumber value={set.reps} onChange={v => onUpdate({ reps: Math.round(v) })} width={42} fontSize={14}/>
        <span style={unitStyle}>reps</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ ...unitStyle, fontSize: 9, letterSpacing: '0.1em' }}>A</span>
        <InlineNumber value={set.carga} onChange={v => onUpdate({ carga: v })} width={46} fontSize={14}/>
        <span style={unitStyle}>kg</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ ...unitStyle, fontSize: 9, letterSpacing: '0.1em' }}>B</span>
        <InlineNumber value={set.carga_b} onChange={v => onUpdate({ carga_b: v })} width={46} fontSize={14}/>
        <span style={unitStyle}>kg</span>
      </div>
      {checkBtn}
    </div>
  )

  return (
    <div style={{ ...base, gridTemplateColumns: '28px 1fr 1fr 36px' }}>
      <div style={labelStyle}>S{idx + 1}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineNumber value={set.reps} onChange={v => onUpdate({ reps: Math.round(v) })} width={42} fontSize={14}/>
        <span style={unitStyle}>reps</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineNumber value={set.carga} onChange={v => onUpdate({ carga: v })} width={50} fontSize={14}/>
        <span style={unitStyle}>kg</span>
      </div>
      {checkBtn}
    </div>
  )
}

const cardActionBtn: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.04)', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--muted-2)',
}

// ── ExerciseCard ───────────────────────────────────────────────────────────────
function ExerciseCard({ ex, idx, sets, expanded, accent, historico,
  isDragging, translateY, shiftY,
  onDragHandleDown, cardRef,
  onToggleExpanded, onUpdateSet, onAddSet, onRemoveSet, onPlayVideo, onEdit, onDuplicate, onDelete, isDuplicating, onNote, onStartRest, onOpenChart,
}: {
  ex: Exercicio, idx: number, sets: SetState[], expanded: boolean, accent: string,
  historico: number[],
  isDragging: boolean, translateY: number, shiftY: number,
  onDragHandleDown: (e: React.PointerEvent) => void,
  cardRef: (el: HTMLDivElement | null) => void,
  onToggleExpanded: () => void,
  onUpdateSet: (i: number, patch: Partial<SetState>) => void,
  onAddSet: () => void, onRemoveSet: () => void,
  onPlayVideo: () => void, onEdit: () => void,
  onDuplicate: () => void, onDelete: () => void, isDuplicating: boolean,
  onNote: () => void,
  onStartRest: (sec: number) => void,
  onOpenChart: () => void,
}) {
  const [showActions, setShowActions] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  useEffect(() => { if (expanded) setShowActions(false) }, [expanded])

  function startLongPress() {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setShowActions(s => !s)
      navigator.vibrate?.(30)
    }, 450)
  }
  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }

  const completedSets = sets.filter(s => s.done).length
  const allDone = completedSets === sets.length && sets.length > 0
  const tipo = ex.tipo ?? 'forca'
  const isCardio = tipo === 'cardio'
  const isIso = tipo === 'iso'

  // Delta from last historic carga
  const prevCarga = historico.length > 0 ? historico[historico.length - 1] : null
  const currentCarga = sets[0]?.carga ?? ex.carga
  const delta = (prevCarga != null && !isCardio && !isIso) ? +(currentCarga - prevCarga).toFixed(1) : null

  let metaSummary: React.ReactNode
  if (isCardio) {
    metaSummary = <span>{ex.duracao_min}min{ex.intensidade ? ` · ${ex.intensidade}` : ''}</span>
  } else if (isIso) {
    metaSummary = <span>{ex.series}×{ex.duracao_seg}s</span>
  } else {
    const lastCarga = sets[0]?.carga ?? ex.carga
    const lastCargaB = sets[0]?.carga_b ?? ex.carga_b
    metaSummary = (
      <>
        {ex.is_biset && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(167,139,250,0.18)', color: '#A78BFA', letterSpacing: '0.06em', marginRight: 2 }}>BISET</span>}
        <span>{ex.series}×{ex.reps}</span>
        <span style={{ color: 'var(--muted-3)' }}> · </span>
        {ex.is_biset
          ? <span>{lastCarga}/{lastCargaB}kg</span>
          : <><span>{lastCarga}kg</span>{delta != null && delta !== 0 && (<><span style={{ color: 'var(--muted-3)' }}> · </span><span style={{ color: delta > 0 ? '#6dffb0' : '#ff5e5e', fontWeight: 700 }}>{delta > 0 ? '+' : ''}{delta}</span></>)}</>
        }
      </>
    )
  }

  const transform = `translateY(${translateY + shiftY}px)`

  return (
    <div
      ref={cardRef}
      style={{
        background: 'var(--surface-1)',
        border: `1px solid ${allDone ? `${accent}40` : 'var(--border)'}`,
        borderRadius: 20, overflow: 'hidden', transition: isDragging ? 'none' : 'border-color 200ms, transform 180ms',
        position: 'relative', flexShrink: 0,
        transform,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.96 : 1,
        boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)' : 'none',
        willChange: isDragging ? 'transform' : undefined,
      }}
    >
      {allDone && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, boxShadow: `0 0 12px ${accent}` }}/>}

      {/* Header */}
      <div
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onClick={() => {
          if (didLongPress.current) { didLongPress.current = false; return }
          if (showActions) { setShowActions(false); return }
          onToggleExpanded()
        }}
        style={{ padding: '12px 14px 12px 8px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Drag handle — captures pointer events, stops card expand/collapse */}
        <div
          onPointerDown={e => { e.stopPropagation(); cancelLongPress(); onDragHandleDown(e) }}
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted-3)', cursor: 'grab', padding: '4px 4px',
            touchAction: 'none',
          }}
        >
          <Icon name="drag" size={16} color="var(--muted-3)"/>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: allDone ? accent : 'var(--surface-2)',
          color: allDone ? 'var(--accent-ink)' : 'var(--text)',
          border: allDone ? 'none' : '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
        }}>
          {allDone ? <Icon name="check" size={15} strokeWidth={2.8} color="currentColor"/> : String(idx + 1).padStart(2, '0')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.2, ...(!expanded && { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>{ex.nome}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
            {ex.grupo && <><span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ex.grupo}</span><span style={{ color: 'var(--muted-3)' }}>·</span></>}
            {metaSummary}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          {/* Top area: action buttons on long press, sparkline otherwise */}
          {!expanded && showActions ? (
            <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
              <button onClick={e => { e.stopPropagation(); onNote(); setShowActions(false) }} title="Observação" style={cardActionBtn}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button onClick={e => { e.stopPropagation(); onDuplicate(); setShowActions(false) }} disabled={isDuplicating} title="Duplicar" style={{ ...cardActionBtn, opacity: isDuplicating ? 0.4 : 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button onClick={e => { e.stopPropagation(); onEdit(); setShowActions(false) }} title="Editar" style={cardActionBtn}>
                <Icon name="edit" size={12} color="currentColor"/>
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(); setShowActions(false) }} title="Excluir" style={{ ...cardActionBtn, color: 'var(--danger)' }}>
                <Icon name="trash" size={12} color="currentColor"/>
              </button>
            </div>
          ) : (
            historico.length > 1 ? (
              <button
                onClick={e => { e.stopPropagation(); onOpenChart() }}
                onPointerDown={e => e.stopPropagation()}
                style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', display: 'block', borderRadius: 6 }}
                title="Ver gráfico de progresso"
              >
                <Sparkline data={historico} width={46} height={18} color={accent}/>
              </button>
            ) : (
              <Sparkline data={historico.length ? historico : [ex.carga, ex.carga]} width={46} height={18} color={accent}/>
            )
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {completedSets > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: allDone ? `${accent}24` : 'rgba(109,255,176,0.14)', color: allDone ? accent : '#6dffb0', letterSpacing: '0.04em' }}>
                {completedSets}/{sets.length}
              </span>
            )}
            <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-2)', transition: 'transform 220ms', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <Icon name="chevronDown" size={14} color="var(--muted-2)"/>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <>
          {/* Action buttons row */}
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6, padding: '0 14px 10px 14px', borderTop: '1px solid var(--border)' }}>
            <button onClick={e => { e.stopPropagation(); onNote() }} title="Observação" style={{ ...cardActionBtn, width: 'auto', height: 30, padding: '0 10px', gap: 5, fontSize: 12, fontWeight: 600 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Obs.
            </button>
            <button onClick={e => { e.stopPropagation(); onDuplicate() }} disabled={isDuplicating} title="Duplicar" style={{ ...cardActionBtn, width: 'auto', height: 30, padding: '0 10px', gap: 5, fontSize: 12, fontWeight: 600, opacity: isDuplicating ? 0.4 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Duplicar
            </button>
            <button onClick={e => { e.stopPropagation(); onEdit() }} title="Editar" style={{ ...cardActionBtn, width: 'auto', height: 30, padding: '0 10px', gap: 5, fontSize: 12, fontWeight: 600 }}>
              <Icon name="edit" size={12} color="currentColor"/>
              Editar
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }} title="Excluir" style={{ ...cardActionBtn, width: 'auto', height: 30, padding: '0 10px', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>
              <Icon name="trash" size={12} color="currentColor"/>
              Excluir
            </button>
          </div>
          <div style={{ padding: '0 16px 4px', animation: 'fade-in 200ms ease' }}>
            <div style={{
              display: 'grid', gap: 8,
              gridTemplateColumns: isCardio || isIso ? '28px 1fr 36px'
                : ex.is_biset ? '28px 1fr auto auto 36px'
                : '28px 1fr 1fr 36px',
              borderTop: '1px solid var(--border)', paddingTop: 8, paddingBottom: 6,
            }}>
              {isCardio ? (
                <><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>—</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>DURAÇÃO</div><div/></>
              ) : isIso ? (
                <><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>SET</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>TEMPO</div><div/></>
              ) : ex.is_biset ? (
                <><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>SET</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>REPS</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>CARGA A</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>CARGA B</div><div/></>
              ) : (
                <><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>SET</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>REPS</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>CARGA</div><div/></>
              )}
            </div>
            {sets.map((s, i) => (
              <SetRow key={i} idx={i} set={s} tipo={tipo} accent={accent} isBiset={!!ex.is_biset}
                onToggle={() => {
                  onUpdateSet(i, { done: !s.done })
                  if (!s.done && !isCardio) onStartRest(ex.descanso ?? 60)
                }}
                onUpdate={patch => onUpdateSet(i, patch)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '10px 14px 14px', borderTop: '1px solid var(--border)' }}>
            <button onClick={e => { e.stopPropagation(); onPlayVideo() }} style={{
              flex: 1, height: 36, padding: '0 12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
            }}>
              <Icon name="playCircle" size={14} color={accent}/>
              Ver execução
            </button>
            <button onClick={e => { e.stopPropagation(); onEdit() }} style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="edit" size={14} color="currentColor"/>
            </button>
            {!isCardio && (
              <>
                <button onClick={e => { e.stopPropagation(); onAddSet() }} style={{ height: 36, padding: '0 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  <Icon name="plus" size={13} color="currentColor"/> 1 set
                </button>
                <button onClick={e => { e.stopPropagation(); if (sets.length > 1) onRemoveSet() }} style={{ height: 36, padding: '0 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, opacity: sets.length > 1 ? 1 : 0.4 }}>
                  <Icon name="minus" size={13} color="currentColor"/> 1 set
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── RestTimer ──────────────────────────────────────────────────────────────────
function RestTimer({ duration, accent, onDone, onCancel }: {
  duration: number, accent: string, onDone: () => void, onCancel: () => void
}) {
  const [remaining, setRemaining] = useState(duration)
  const durationRef = useRef(duration)

  useEffect(() => {
    durationRef.current = duration
    setRemaining(duration)
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); onDone(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [duration]) // eslint-disable-line

  const pct = durationRef.current > 0 ? remaining / durationRef.current : 0
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const C = 2 * Math.PI * 19

  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 12, zIndex: 70,
      background: 'rgba(10,11,13,0.96)', backdropFilter: 'blur(12px)',
      border: `1px solid ${accent}60`,
      borderRadius: 16, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: `0 8px 28px rgba(0,0,0,0.45), 0 0 20px ${accent}20`,
      animation: 'slide-up 260ms cubic-bezier(.2,.7,.3,1)',
    }}>
      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
        <svg width="44" height="44">
          <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
          <circle cx="22" cy="22" r="19" fill="none" stroke={accent} strokeWidth="3"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${accent})` }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="timer" size={16} color={accent}/>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.14em' }}>DESCANSO</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginTop: 2 }}>
          {mm}:{ss}
        </div>
      </div>
      <button onClick={() => setRemaining(r => Math.min(durationRef.current, r + 15))} style={{
        height: 32, padding: '0 12px',
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
        borderRadius: 16, color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>+15s</button>
      <button onClick={onCancel} style={{
        width: 32, height: 32, borderRadius: 16,
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
        color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <Icon name="x" size={14} color="currentColor"/>
      </button>
    </div>
  )
}

// ── VideoModal ─────────────────────────────────────────────────────────────────
function VideoModal({ ex, onClose }: { ex: Exercicio, onClose: () => void }) {
  const ytUrl = `https://www.youtube-nocookie.com/embed/${ex.yt_id}?autoplay=1&modestbranding=1&rel=0`
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', animation: 'fade-in 200ms ease' }}/>
      <div style={{
        position: 'absolute', top: '50%', left: 16, right: 16,
        transform: 'translateY(-50%)',
        background: 'var(--surface-1)', borderRadius: 24,
        border: '1px solid var(--border-strong)', overflow: 'hidden',
        animation: 'scale-in 250ms cubic-bezier(.2,.7,.3,1)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
          <iframe src={ytUrl} title={ex.nome} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '16px 18px 14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 500 }}>EXECUÇÃO · YOUTUBE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.2 }}>{ex.nome}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {ex.grupo && <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{ex.grupo}</span>}
              {ex.series && ex.reps && <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>{ex.series}×{ex.reps}</span>}
              {ex.carga > 0 && <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>{ex.carga}kg</span>}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 18,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <Icon name="x" size={16} color="currentColor"/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ChartModal ─────────────────────────────────────────────────────────────────
function ChartModal({ nome, data, labels, accent, onClose }: {
  nome: string, data: number[], labels: string[], accent: string, onClose: () => void
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const delta = data.length > 1 ? +(data[data.length - 1] - data[0]).toFixed(1) : null
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', animation: 'fade-in 200ms ease' }}/>
      <div style={{
        position: 'absolute', top: '50%', left: 16, right: 16,
        transform: 'translateY(-50%)',
        background: 'var(--surface-1)', borderRadius: 24,
        border: '1px solid var(--border-strong)',
        animation: 'scale-in 250ms cubic-bezier(.2,.7,.3,1)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '18px 18px 12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, fontWeight: 500 }}>PROGRESSO DE CARGA</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', marginTop: 3, lineHeight: 1.2 }}>{nome}</div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 18, flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon name="x" size={16} color="currentColor"/>
          </button>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, padding: '0 18px 16px' }}>
          {[
            { label: 'Mínimo', value: `${min}kg` },
            { label: 'Máximo', value: `${max}kg` },
            { label: 'Atual', value: `${data[data.length - 1]}kg` },
            ...(delta != null ? [{ label: 'Evolução', value: `${delta > 0 ? '+' : ''}${delta}kg`, color: delta > 0 ? '#6dffb0' : delta < 0 ? '#ff5e5e' : 'var(--muted)' }] : []),
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: s.color ?? 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{ padding: '0 18px 20px' }}>
          <LineChart data={data} labels={labels} color={accent} unit="kg" chartId="chart-modal" responsive height={180}/>
        </div>
        {data.length < 2 && (
          <div style={{ padding: '0 18px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-2)', textAlign: 'center' }}>
            Complete mais treinos para ver a evolução
          </div>
        )}
      </div>
    </div>
  )
}

// ── ExerciseEditor (BottomSheet) ───────────────────────────────────────────────
function ExerciseEditor({ ex, fichaId, onClose, onSaved }: {
  ex: Partial<Exercicio> | null, fichaId: string,
  onClose: () => void, onSaved: (saved: Exercicio) => void
}) {
  const supabase = createClient()
  const [nome, setNome] = useState(ex?.nome ?? '')
  const [grupo, setGrupo] = useState(ex?.grupo ?? '')
  const [series, setSeries] = useState(String(ex?.series ?? 3))
  const [reps, setReps] = useState(ex?.reps ?? '10-12')
  const [carga, setCarga] = useState(String(ex?.carga ?? 0))
  const [isBiset, setIsBiset] = useState(ex?.is_biset ?? false)
  const [cargaB, setCargaB] = useState(String(ex?.carga_b ?? 0))
  const [descanso, setDescanso] = useState(String(ex?.descanso ?? 60))
  const [ytId, setYtId] = useState(ex?.yt_id ?? '')
  const [tipo, setTipo] = useState(ex?.tipo ?? 'forca')
  const [duracaoSeg, setDuracaoSeg] = useState(String(ex?.duracao_seg ?? 30))
  const [duracaoMin, setDuracaoMin] = useState(String(ex?.duracao_min ?? 10))
  const [intensidade, setIntensidade] = useState(ex?.intensidade ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!nome.trim()) return
    setSaving(true)
    const updatePayload = {
      nome: nome.trim(), grupo: grupo.trim() || null,
      tipo,
      series: parseInt(series) || 3,
      reps: tipo === 'forca' ? reps : '0',
      carga: tipo === 'forca' ? (parseFloat(carga.replace(',', '.')) || 0) : 0,
      is_biset: tipo === 'forca' && isBiset,
      carga_b: tipo === 'forca' && isBiset ? (parseFloat(cargaB.replace(',', '.')) || 0) : 0,
      descanso: parseInt(descanso) || 60,
      yt_id: ytId.trim() || null,
      duracao_seg: tipo === 'iso' ? (parseInt(duracaoSeg) || 30) : null,
      duracao_min: tipo === 'cardio' ? (parseInt(duracaoMin) || 10) : null,
      intensidade: tipo === 'cardio' ? (intensidade.trim() || null) : null,
    }
    let data: Exercicio | null = null
    if (ex?.id) {
      const res = await supabase.from('exercicios').update(updatePayload).eq('id', ex.id).select().single()
      data = res.data
    } else {
      const res = await supabase.from('exercicios').insert({ ...updatePayload, ficha_id: fichaId, ordem: 999 }).select().single()
      data = res.data
    }
    if (data) onSaved(data)
    setSaving(false)
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', animation: 'fade-in 200ms ease' }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--surface-1)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        padding: '12px 0 32px', maxHeight: '85%', overflow: 'auto',
        animation: 'slide-up 250ms cubic-bezier(.2,.7,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '0 auto 16px' }}/>
        <div style={{ padding: '0 20px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
          {ex?.id ? 'Editar exercício' : 'Novo exercício'}
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Nome', value: nome, set: setNome, placeholder: 'Ex: Supino reto com barra' },
            { label: 'Grupo muscular', value: grupo, set: setGrupo, placeholder: 'Ex: Peito' },
            { label: 'YouTube ID', value: ytId, set: setYtId, placeholder: 'Ex: rT7DgCr-3pg' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>{label}</div>
              <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{ width: '100%', height: 44, padding: '0 14px', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          {/* Tipo selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {([['forca', 'FORÇA · KG'], ['iso', 'ISO · SEG'], ['cardio', 'CARDIO · MIN']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => setTipo(val)}
                style={{
                  flex: 1, height: 34, borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  background: tipo === val ? 'rgba(255,255,255,0.08)' : 'var(--surface-2)',
                  border: `1px solid ${tipo === val ? 'var(--accent)' : 'var(--border)'}`,
                  color: tipo === val ? 'var(--text)' : 'var(--muted)',
                  transition: 'all 150ms',
                }}
              >{lbl}</button>
            ))}
          </div>
          {tipo === 'forca' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {([
                { label: 'Séries', value: series, set: setSeries, mode: 'numeric' },
                { label: 'Reps', value: reps, set: setReps, mode: undefined },
                { label: isBiset ? 'Carga A kg' : 'Carga kg', value: carga, set: setCarga, mode: 'decimal' },
                { label: 'Descanso s', value: descanso, set: setDescanso, mode: 'numeric' },
              ] as { label: string; value: string; set: (v: string) => void; mode: React.HTMLAttributes<HTMLInputElement>['inputMode'] }[]).map(({ label, value, set, mode }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>{label}</div>
                  <input type="text" inputMode={mode} value={value} onChange={e => set(e.target.value)}
                    style={{ width: '100%', height: 40, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
          )}
          {tipo === 'iso' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {([
                { label: 'Séries', value: series, set: setSeries, mode: 'numeric' },
                { label: 'Duração seg', value: duracaoSeg, set: setDuracaoSeg, mode: 'numeric' },
                { label: 'Descanso s', value: descanso, set: setDescanso, mode: 'numeric' },
              ] as { label: string; value: string; set: (v: string) => void; mode: React.HTMLAttributes<HTMLInputElement>['inputMode'] }[]).map(({ label, value, set, mode }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>{label}</div>
                  <input type="text" inputMode={mode} value={value} onChange={e => set(e.target.value)}
                    style={{ width: '100%', height: 40, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
          )}
          {tipo === 'cardio' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {([
                { label: 'Duração min', value: duracaoMin, set: setDuracaoMin, mode: 'numeric' },
                { label: 'Intensidade', value: intensidade, set: setIntensidade, mode: undefined },
                { label: 'Descanso s', value: descanso, set: setDescanso, mode: 'numeric' },
              ] as { label: string; value: string; set: (v: string) => void; mode: React.HTMLAttributes<HTMLInputElement>['inputMode'] }[]).map(({ label, value, set, mode }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>{label}</div>
                  <input type="text" inputMode={mode} value={value} onChange={e => set(e.target.value)}
                    style={{ width: '100%', height: 40, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
          )}
          {/* Biset toggle + Carga B — only for forca */}
          {tipo === 'forca' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setIsBiset(b => !b)}
              style={{
                height: 36, padding: '0 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: isBiset ? 'rgba(167,139,250,0.15)' : 'var(--surface-2)',
                border: `1px solid ${isBiset ? '#A78BFA' : 'var(--border)'}`,
                color: isBiset ? '#A78BFA' : 'var(--muted)',
                fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                transition: 'all 150ms', flexShrink: 0,
              }}
            >
              {isBiset ? '✓ BISET' : '+ BISET'}
            </button>
            {isBiset && (
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 4 }}>Carga B kg</div>
                <input
                  type="text" inputMode="decimal" value={cargaB}
                  onChange={e => setCargaB(e.target.value)}
                  style={{ width: '100%', height: 40, textAlign: 'center', background: 'rgba(167,139,250,0.08)', border: '1px solid #A78BFA60', borderRadius: 10, color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 48, borderRadius: 14, background: 'var(--surface-3)', color: 'var(--muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none' }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !nome.trim()} style={{
              flex: 1, height: 48, borderRadius: 14,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              fontWeight: 600, fontSize: 14, cursor: saving ? 'wait' : 'pointer',
              border: 'none', opacity: saving || !nome.trim() ? 0.5 : 1,
            }}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── NoteModal ─────────────────────────────────────────────────────────────────
function NoteModal({ ex, ficha, userId, trainerId, onClose, onSaved }: {
  ex: Exercicio, ficha: { id: string; nome: string }, userId: string,
  trainerId: string | null,
  onClose: () => void, onSaved: () => void,
}) {
  const supabase = createClient()
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const hasTrainer = !!trainerId

  async function handleSave() {
    if (!texto.trim()) return
    setSaving(true)
    await supabase.from('exercise_notes').insert({
      user_id: userId,
      trainer_id: trainerId ?? null,
      exercicio_id: ex.id,
      exercicio_nome: ex.nome,
      ficha_id: ficha.id,
      texto: texto.trim(),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', animation: 'fade-in 200ms ease' }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--surface-1)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        padding: '12px 0 32px',
        animation: 'slide-up 250ms cubic-bezier(.2,.7,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '0 auto 16px' }}/>
        <div style={{ padding: '0 20px 4px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>
              Observação
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 3, letterSpacing: '0.04em' }}>
              {ex.nome}
            </div>
          </div>
          {hasTrainer && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              borderRadius: 8, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: '#00E5FF', letterSpacing: '0.06em', flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
              ENVIARÁ AO PERSONAL
            </div>
          )}
        </div>
        <div style={{ padding: '14px 20px 0' }}>
          <textarea
            autoFocus
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder={hasTrainer
              ? 'Ex: Sinto dor no ombro nesse exercício, posso substituir?'
              : 'Ex: Lembrar de ajustar a posição do banco...'}
            rows={4}
            style={{
              width: '100%', padding: '12px 14px', boxSizing: 'border-box',
              background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
              borderRadius: 14, color: 'var(--text)', fontSize: 14, lineHeight: 1.6,
              outline: 'none', resize: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, height: 48, borderRadius: 14, background: 'var(--surface-3)',
              border: 'none', color: 'var(--muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving || !texto.trim()} style={{
              flex: 2, height: 48, borderRadius: 14,
              background: hasTrainer ? '#00E5FF' : 'var(--accent)',
              color: 'var(--accent-ink)', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: saving || !texto.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !texto.trim() ? 0.5 : 1,
            }}>
              {saving ? 'Enviando…' : hasTrainer ? 'Enviar ao personal' : 'Salvar anotação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 90, whiteSpace: 'nowrap',
      background: 'rgba(10,11,13,0.95)', border: '1px solid var(--border-strong)',
      borderRadius: 999, padding: '10px 18px',
      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
      color: 'var(--text)', letterSpacing: '0.04em',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'slide-up 220ms cubic-bezier(.2,.7,.3,1)',
    }}>
      {message}
    </div>
  )
}

const ICONES_TREINO = ['💪','🏋️','🔥','⚡','🎯','🏃','🦵','🤸','🧘','🚴','🥊','🏆','🌟','💯','⚽','🏊','🧗','🎽','🦾','🧠','❤️','🌊','🏔️','🎖️','🥗','🫀','⏱️','🎪','🩺','🏇']
const LETRAS_TREINO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const SVG_ICONES = ['dumbbell','benchPress','bicep','squat','flame','bolt','target','trophy','timer','body','chart','history','calendar','apple']
function isSvgIcone(icone: string) { return SVG_ICONES.includes(icone) }

// ── Drag state types ───────────────────────────────────────────────────────────
interface DragInfo {
  id: string
  srcIdx: number
  startClientY: number
  draggedHeight: number // card height at drag start
}

// ── Main TreinoClient ──────────────────────────────────────────────────────────
export default function TreinoClient({ ficha, exercicios, userId, historicoMap }: {
  ficha: Ficha, exercicios: Exercicio[], userId: string,
  historicoMap: Record<string, { carga: number, date: string }[]>
}) {
  const router = useRouter()
  const supabase = createClient()

  const [exList, setExList] = useState(exercicios)
  const [setsByEx, setSetsByEx] = useState<Record<string, SetState[]>>(() => {
    const m: Record<string, SetState[]> = {}
    for (const ex of exercicios) m[ex.id] = buildInitialSets(ex)
    if (typeof window !== 'undefined') {
      try {
        const session = getActiveSession()
        if (session?.fichaId === ficha.id) {
          const saved = localStorage.getItem(`meutreino_sets_${ficha.id}`)
          if (saved) {
            const parsed = JSON.parse(saved) as Record<string, SetState[]>
            for (const ex of exercicios) {
              if (parsed[ex.id]) m[ex.id] = parsed[ex.id]
            }
          }
        }
      } catch {}
    }
    return m
  })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  const [restDuration, setRestDuration] = useState(0)
  const [restKey, setRestKey] = useState(0)
  const [videoEx, setVideoEx] = useState<Exercicio | null>(null)
  const [editorEx, setEditorEx] = useState<Partial<Exercicio> | null>(null)
  const [showNewEx, setShowNewEx] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [confirmDeleteEx, setConfirmDeleteEx] = useState<Exercicio | null>(null)
  const [deletingExId, setDeletingExId] = useState<string | null>(null)
  const [duplicatingExId, setDuplicatingExId] = useState<string | null>(null)
  const [noteEx, setNoteEx] = useState<Exercicio | null>(null)
  const [trainerId, setTrainerId] = useState<string | null>(null)
  const [chartModal, setChartModal] = useState<{ nome: string, data: number[], labels: string[], accent: string } | null>(null)

  const [fichaLocal, setFichaLocal] = useState({ nome: ficha.nome, icone: ficha.icone ?? '', letra: ficha.letra ?? '' })
  const [editingName, setEditingName] = useState(false)
  const [editNameDraft, setEditNameDraft] = useState(ficha.nome)
  const [showIconPicker, setShowIconPicker] = useState(false)

  async function saveFichaField(patch: { nome?: string; icone?: string | null; letra?: string }) {
    setFichaLocal(prev => ({ ...prev, ...patch, icone: patch.icone ?? (patch.icone === null ? '' : prev.icone) }))
    await supabase.from('fichas').update(patch).eq('id', ficha.id)
    router.refresh()
  }

  const startTimeRef = useRef(Date.now())
  const [elapsedSec, setElapsedSec] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Init active session — preserve pause state instead of auto-resuming
  useEffect(() => {
    const existing = getActiveSession()
    if (existing?.fichaId === ficha.id) {
      if (existing.pausedAt) {
        startTimeRef.current = existing.startTime
        setElapsedSec(Math.floor((existing.pausedAt - existing.startTime) / 1000))
        setIsPaused(true)
      } else {
        startTimeRef.current = existing.startTime
      }
    } else {
      const t = Date.now()
      startTimeRef.current = t
      setActiveSession({ fichaId: ficha.id, fichaLetra: ficha.letra ?? '', cor: ficha.cor ?? '', startTime: t })
    }
  }, []) // eslint-disable-line

  // Fetch linked trainer (if any)
  useEffect(() => {
    supabase.from('trainer_student_links')
      .select('trainer_id')
      .eq('student_id', userId)
      .eq('status', 'approved')
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setTrainerId(data.trainer_id) })
  }, []) // eslint-disable-line

  // Drag state
  const dragInfoRef = useRef<DragInfo | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragDeltaY, setDragDeltaY] = useState(0)
  const [dragTargetIdx, setDragTargetIdx] = useState<number | null>(null)
  const cardElMap = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (isPaused) return
    const id = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [isPaused])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(id)
  }, [toast])

  // Persist set progress so a page refresh doesn't lose work
  useEffect(() => {
    localStorage.setItem(`meutreino_sets_${ficha.id}`, JSON.stringify(setsByEx))
  }, [setsByEx]) // eslint-disable-line

  const allSets = Object.values(setsByEx).flat()
  const totalSets = allSets.length
  const doneSets = allSets.filter(s => s.done).length
  const progress = totalSets > 0 ? doneSets / totalSets : 0
  const accent = ficha.cor ?? 'var(--accent)'

  const doneExCount = exList.filter(ex => {
    const sets = setsByEx[ex.id] ?? []
    return sets.length > 0 && sets.every(s => s.done)
  }).length

  const gruposList = [...new Set(exList.map(e => e.grupo).filter(Boolean))].join(' · ')

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function updateSet(exId: string, idx: number, patch: Partial<SetState>) {
    setSetsByEx(prev => {
      const next = { ...prev, [exId]: prev[exId].map((s, i) => i === idx ? { ...s, ...patch } : s) }
      if (patch.done) {
        const allSetsDone = next[exId].every(s => s.done)
        if (allSetsDone) {
          setTimeout(() => setExpandedIds(p => { const n = new Set(p); n.delete(exId); return n }), 600)
        }
      }
      return next
    })
    if (patch.done) setToast('Série marcada · descanso iniciado')
  }

  function startRest(sec: number) {
    setRestDuration(sec)
    setRestKey(k => k + 1)
  }

  // ── Drag handlers ────────────────────────────────────────────────────────────
  function handleDragHandleDown(id: string, e: React.PointerEvent) {
    const el = cardElMap.current.get(id)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const srcIdx = exList.findIndex(ex => ex.id === id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragInfoRef.current = {
      id, srcIdx,
      startClientY: e.clientY,
      draggedHeight: rect.height,
    }
    setDragId(id)
    setDragDeltaY(0)
    setDragTargetIdx(srcIdx)
  }

  function computeTargetIdx(pointerClientY: number, srcIdx: number): number {
    let target = srcIdx
    for (let i = 0; i < exList.length; i++) {
      const el = cardElMap.current.get(exList[i].id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      // Use natural rect — during drag the dragged card is translated, but others aren't yet
      const mid = rect.top + rect.height / 2
      if (pointerClientY < mid) {
        target = i
        break
      }
      target = i
    }
    return target
  }

  function handleListPointerMove(e: React.PointerEvent) {
    const info = dragInfoRef.current
    if (!info) return
    const delta = e.clientY - info.startClientY
    setDragDeltaY(delta)
    const t = computeTargetIdx(e.clientY, info.srcIdx)
    setDragTargetIdx(t)
  }

  async function handleListPointerUp(e: React.PointerEvent) {
    const info = dragInfoRef.current
    if (!info) { setDragId(null); return }
    dragInfoRef.current = null

    const targetIdx = dragTargetIdx ?? info.srcIdx
    setDragId(null)
    setDragDeltaY(0)
    setDragTargetIdx(null)

    if (info.srcIdx !== targetIdx) {
      const newList = [...exList]
      const [moved] = newList.splice(info.srcIdx, 1)
      newList.splice(targetIdx, 0, moved)
      setExList(newList)
      // Persist order to Supabase
      await Promise.all(newList.map((ex, i) =>
        supabase.from('exercicios').update({ ordem: i }).eq('id', ex.id)
      ))
    }
  }

  // ── Duplicate / Delete exercise ──────────────────────────────────────────────
  async function duplicateEx(ex: Exercicio) {
    setDuplicatingExId(ex.id)
    const idx = exList.findIndex(e => e.id === ex.id)
    const insertOrdem = idx + 1
    const after = exList.slice(insertOrdem)
    await Promise.all(after.map((e, i) =>
      supabase.from('exercicios').update({ ordem: insertOrdem + 1 + i }).eq('id', e.id)
    ))
    const { data } = await supabase.from('exercicios').insert({
      ficha_id: ex.ficha_id, nome: ex.nome + ' (cópia)',
      grupo: ex.grupo, tipo: ex.tipo,
      series: ex.series, reps: ex.reps, carga: ex.carga,
      descanso: ex.descanso, duracao_seg: ex.duracao_seg,
      yt_id: ex.yt_id, ordem: insertOrdem,
    }).select('*').single()
    if (data) {
      setExList(prev => { const n = [...prev]; n.splice(insertOrdem, 0, data); return n })
      setSetsByEx(prev => ({ ...prev, [data.id]: buildInitialSets(data) }))
    }
    setDuplicatingExId(null)
  }

  async function deleteEx(ex: Exercicio) {
    setDeletingExId(ex.id)
    await supabase.from('exercicios').delete().eq('id', ex.id)
    setExList(prev => prev.filter(e => e.id !== ex.id))
    setSetsByEx(prev => { const n = { ...prev }; delete n[ex.id]; return n })
    setConfirmDeleteEx(null)
    setDeletingExId(null)
  }

  // ── Pause / Resume ────────────────────────────────────────────────────────────
  function pauseTreino() {
    const session = getActiveSession()
    if (!session) return
    const now = Date.now()
    setActiveSession({ ...session, pausedAt: now })
    setElapsedSec(Math.floor((now - session.startTime) / 1000))
    setIsPaused(true)
  }

  function resumeTreino() {
    const session = getActiveSession()
    if (!session) return
    const pausedElapsed = (session.pausedAt ?? Date.now()) - session.startTime
    const newStart = Date.now() - pausedElapsed
    startTimeRef.current = newStart
    setActiveSession({ ...session, startTime: newStart, pausedAt: undefined })
    setIsPaused(false)
  }

  // ── Finalize ──────────────────────────────────────────────────────────────────
  async function finalizarTreino() {
    clearActiveSession()
    localStorage.removeItem(`meutreino_sets_${ficha.id}`)
    setFinishing(true)
    const durMin = Math.max(1, Math.round(elapsedSec / 60))
    let volume = 0
    for (const ex of exList) {
      for (const s of setsByEx[ex.id] ?? []) {
        if (s.done && (ex.tipo ?? 'forca') === 'forca') volume += s.carga * s.reps
      }
    }
    const { data: treino } = await supabase.from('treinos').insert({
      user_id: userId, ficha_id: ficha.id, ficha_letra: ficha.letra,
      data: new Date().toISOString().split('T')[0],
      duracao_min: durMin, volume_total: Math.round(volume),
    }).select().single()

    if (treino) {
      const logs = exList.flatMap(ex => (setsByEx[ex.id] ?? []).map((s, i) => ({
        treino_id: treino.id, exercicio_id: ex.id, exercicio_nome: ex.nome,
        serie_num: i + 1, carga: s.carga, reps: (ex.tipo ?? 'forca') === 'forca' ? s.reps : null,
        duracao_seg: ex.tipo === 'iso' ? s.duracaoSeg : null, done: s.done,
      })))
      if (logs.length > 0) await supabase.from('sets_log').insert(logs)

      for (const ex of exList) {
        const doneS = (setsByEx[ex.id] ?? []).filter(s => s.done)
        if (doneS.length > 0 && (ex.tipo ?? 'forca') === 'forca') {
          const avg = doneS.reduce((a, s) => a + s.carga, 0) / doneS.length
          await supabase.from('exercicios').update({ carga: avg }).eq('id', ex.id)
        }
      }
    }
    router.push('/dashboard')
    router.refresh()
  }

  const elMin = String(Math.floor(elapsedSec / 60)).padStart(2, '0')
  const elSec = String(elapsedSec % 60).padStart(2, '0')

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '12px 16px 14px', background: 'var(--bg-app)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {/* Top bar: back · status label · timer pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={() => router.back()} style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <Icon name="chevronLeft" size={18} color="var(--text)"/>
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: isPaused ? 'var(--warn)' : 'var(--muted-2)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            FICHA {ficha.letra} · {isPaused ? 'PAUSADO' : 'EM ANDAMENTO'}
          </div>
          <button
            onClick={isPaused ? resumeTreino : pauseTreino}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
              background: isPaused ? 'rgba(255,181,71,0.12)' : 'var(--surface-2)',
              border: `1px solid ${isPaused ? 'rgba(255,181,71,0.4)' : 'var(--border)'}`,
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
              color: isPaused ? 'var(--warn)' : 'var(--text)',
              transition: 'all 180ms',
            }}
          >
            <Icon name={isPaused ? 'play' : 'pause'} size={12} color="currentColor"/>
            {elMin}:{elSec}
          </button>
        </div>

        {/* Ficha identity row: icon + name + groups */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <button onClick={() => setShowIconPicker(true)} style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: `${accent}1a`, border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            {fichaLocal.icone
              ? isSvgIcone(fichaLocal.icone)
                ? <Icon name={fichaLocal.icone} size={26} color={accent}/>
                : <span style={{ fontSize: 26, lineHeight: 1 }}>{fichaLocal.icone}</span>
              : <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: accent }}>{fichaLocal.letra}</span>
            }
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editingName ? (
              <input
                autoFocus
                value={editNameDraft}
                onChange={e => setEditNameDraft(e.target.value)}
                onBlur={() => {
                  setEditingName(false)
                  const trimmed = editNameDraft.trim()
                  if (trimmed && trimmed !== fichaLocal.nome) saveFichaField({ nome: trimmed })
                  else setEditNameDraft(fichaLocal.nome)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') { setEditNameDraft(fichaLocal.nome); setEditingName(false) }
                }}
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', borderBottom: `1px solid ${accent}`,
                  color: 'var(--text)', outline: 'none',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26,
                  letterSpacing: '-0.02em', lineHeight: 1.1, padding: '0 0 2px',
                }}
              />
            ) : (
              <div
                onClick={() => { setEditingName(true); setEditNameDraft(fichaLocal.nome) }}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.1, cursor: 'text' }}
              >
                {fichaLocal.nome}
              </div>
            )}
            {gruposList && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {gruposList}
              </div>
            )}
          </div>
        </div>

        {/* Progress row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.1em', fontWeight: 600 }}>
            PROGRESSO · {doneExCount}/{exList.length} EXERCÍCIOS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: accent }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, background: accent,
            width: `${progress * 100}%`, transition: 'width 400ms ease',
            boxShadow: progress > 0 ? `0 0 8px ${accent}60` : 'none',
          }}/>
        </div>
      </div>

      {/* ── Exercise list (scrollable) ── */}
      <div
        style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
        onPointerMove={dragId ? handleListPointerMove : undefined}
        onPointerUp={dragId ? handleListPointerUp : undefined}
        onPointerCancel={dragId ? handleListPointerUp : undefined}
      >
        {exList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontSize: 14 }}>Nenhum exercício nessa ficha.</div>
        ) : (
          exList.map((ex, idx) => {
            const isDragging = dragId === ex.id
            const info = dragInfoRef.current
            let translateY = 0
            let shiftY = 0

            if (isDragging) {
              translateY = dragDeltaY
            } else if (dragId && info && dragTargetIdx !== null) {
              const srcIdx = info.srcIdx
              const draggedH = info.draggedHeight + 12 // card height + gap
              if (srcIdx < dragTargetIdx) {
                // dragging down: cards between src+1..target shift up
                if (idx > srcIdx && idx <= dragTargetIdx) shiftY = -draggedH
              } else if (srcIdx > dragTargetIdx) {
                // dragging up: cards between target..src-1 shift down
                if (idx >= dragTargetIdx && idx < srcIdx) shiftY = draggedH
              }
            }

            return (
              <ExerciseCard key={ex.id} ex={ex} idx={idx}
                sets={setsByEx[ex.id] ?? []}
                expanded={expandedIds.has(ex.id)}
                accent={accent}
                historico={(historicoMap[ex.id] ?? []).map(h => h.carga)}
                onOpenChart={() => {
                  const h = historicoMap[ex.id] ?? []
                  setChartModal({
                    nome: ex.nome,
                    data: h.map(x => x.carga),
                    labels: h.map(x => {
                      const d = new Date(x.date)
                      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
                    }),
                    accent,
                  })
                }}
                isDragging={isDragging}
                translateY={translateY}
                shiftY={shiftY}
                onDragHandleDown={e => handleDragHandleDown(ex.id, e)}
                cardRef={el => {
                  if (el) cardElMap.current.set(ex.id, el)
                  else cardElMap.current.delete(ex.id)
                }}
                onToggleExpanded={() => toggleExpanded(ex.id)}
                onUpdateSet={(i, patch) => updateSet(ex.id, i, patch)}
                onAddSet={() => setSetsByEx(prev => { const last = prev[ex.id]?.slice(-1)[0]; return { ...prev, [ex.id]: [...(prev[ex.id] ?? []), { ...(last ?? { done: false, carga: 0, reps: 10, duracaoSeg: 30, duracaoMin: 10 }), done: false }] } })}
                onRemoveSet={() => setSetsByEx(prev => { const cur = prev[ex.id] ?? []; if (cur.length <= 1) return prev; return { ...prev, [ex.id]: cur.slice(0, -1) } })}
                onPlayVideo={() => setVideoEx(ex)}
                onEdit={() => setEditorEx(ex)}
                onDuplicate={() => duplicateEx(ex)}
                onDelete={() => setConfirmDeleteEx(ex)}
                isDuplicating={duplicatingExId === ex.id}
                onNote={() => setNoteEx(ex)}
                onStartRest={startRest}
              />
            )
          })
        )}

        {/* Novo exercício */}
        <button onClick={() => setShowNewEx(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          height: 48, borderRadius: 20, cursor: 'pointer',
          background: 'transparent', border: '1px dashed var(--border-strong)',
          color: 'var(--muted)', fontSize: 13, fontWeight: 600,
        }}>
          <Icon name="plus" size={16} color="var(--muted)"/>
          Adicionar exercício
        </button>
      </div>

      {/* ── Footer: RestTimer + Finalizar ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {restDuration > 0 && (
          <RestTimer key={restKey} duration={restDuration} accent={accent}
            onDone={() => setRestDuration(0)}
            onCancel={() => setRestDuration(0)}
          />
        )}
        {doneSets > 0 && (
          <div style={{ padding: `${restDuration > 0 ? 88 : 10}px 16px 16px`, background: 'linear-gradient(to top, var(--bg-app) 60%, transparent)', transition: 'padding 300ms' }}>
            <button onClick={finalizarTreino} disabled={finishing} style={{
              width: '100%', height: 56, borderRadius: 28,
              background: accent, color: 'var(--accent-ink)',
              fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em',
              border: 'none', cursor: finishing ? 'wait' : 'pointer',
              opacity: finishing ? 0.7 : 1,
            }}>
              {finishing ? 'Salvando…' : `Finalizar treino · ${Math.max(1, Math.round(elapsedSec / 60))}min`}
            </button>
          </div>
        )}
      </div>

      {/* ── Overlays ── */}
      {noteEx && (
        <NoteModal
          ex={noteEx}
          ficha={{ id: ficha.id, nome: fichaLocal.nome }}
          userId={userId}
          trainerId={trainerId}
          onClose={() => setNoteEx(null)}
          onSaved={() => { setNoteEx(null); setToast(trainerId ? 'Observação enviada ao personal ✓' : 'Anotação salva ✓') }}
        />
      )}
      {videoEx && <VideoModal ex={videoEx} onClose={() => setVideoEx(null)}/>}
      {chartModal && <ChartModal {...chartModal} onClose={() => setChartModal(null)}/>}
      {(showNewEx || editorEx) && (
        <ExerciseEditor
          ex={editorEx ?? {}}
          fichaId={ficha.id}
          onClose={() => { setEditorEx(null); setShowNewEx(false) }}
          onSaved={saved => {
            if (editorEx?.id) {
              setExList(prev => prev.map(e => e.id === saved.id ? saved : e))
              // Rebuild sets: keep done sets as-is, update undone sets with new values
              setSetsByEx(prev => {
                const existing = prev[saved.id] ?? []
                const baseReps = parseInt(String(saved.reps ?? '10').split('-')[0]) || 10
                const newSets: SetState[] = Array.from({ length: saved.series }, (_, i) => {
                  const cur = existing[i]
                  if (cur?.done) return cur
                  return {
                    done: false,
                    carga: saved.carga,
                    carga_b: saved.carga_b ?? 0,
                    reps: baseReps,
                    duracaoSeg: saved.duracao_seg ?? 30,
                    duracaoMin: saved.duracao_min ?? 10,
                  }
                })
                return { ...prev, [saved.id]: newSets }
              })
            } else {
              setExList(prev => [...prev, saved])
              setSetsByEx(prev => ({ ...prev, [saved.id]: buildInitialSets(saved) }))
            }
            setEditorEx(null)
            setShowNewEx(false)
          }}
        />
      )}
      {toast && <Toast message={toast}/>}

      {/* ── Icon picker ── */}
      {showIconPicker && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={() => setShowIconPicker(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', animation: 'fade-in 180ms ease' }}/>
          <div style={{
            position: 'relative', width: '100%', background: 'var(--surface-1)',
            borderRadius: '24px 24px 0 0', border: '1px solid var(--border-strong)',
            padding: '16px 20px 32px', maxHeight: '70vh', overflowY: 'auto',
            animation: 'slide-up 240ms cubic-bezier(.2,.7,.3,1)',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }}/>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 14 }}>Ícone da ficha</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted-2)', marginBottom: 8 }}>ÍCONES DO APP</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
              {SVG_ICONES.map(name => {
                const active = fichaLocal.icone === name
                return (
                  <button key={name} onClick={() => { saveFichaField({ icone: name }); setShowIconPicker(false) }} style={{
                    height: 48, borderRadius: 12,
                    background: active ? `${accent}22` : 'var(--surface-2)',
                    border: `1px solid ${active ? accent : 'var(--border)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={name} size={22} color={active ? accent : 'var(--muted)'}/>
                  </button>
                )
              })}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted-2)', marginBottom: 8 }}>EMOJIS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
              {ICONES_TREINO.map(ic => (
                <button key={ic} onClick={() => { saveFichaField({ icone: ic }); setShowIconPicker(false) }} style={{
                  height: 48, borderRadius: 12, fontSize: 24,
                  background: fichaLocal.icone === ic ? `${accent}22` : 'var(--surface-2)',
                  border: `1px solid ${fichaLocal.icone === ic ? accent : 'var(--border)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{ic}</button>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted-2)', marginBottom: 8 }}>LETRA</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {LETRAS_TREINO.map(l => {
                const active = !fichaLocal.icone && fichaLocal.letra === l
                return (
                  <button key={l} onClick={() => { saveFichaField({ icone: null, letra: l }); setShowIconPicker(false) }} style={{
                    height: 40, borderRadius: 10,
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                    background: active ? `${accent}22` : 'var(--surface-2)',
                    border: `1px solid ${active ? accent : 'var(--border)'}`,
                    color: active ? accent : 'var(--text)', cursor: 'pointer',
                  }}>{l}</button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete exercise confirm ── */}
      {confirmDeleteEx && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', padding: '0 0 32px' }}>
          <div onClick={() => setConfirmDeleteEx(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', animation: 'fade-in 180ms ease' }}/>
          <div style={{
            position: 'relative', width: '100%', background: 'var(--surface-1)',
            borderRadius: '20px 20px 0 0', border: '1px solid var(--border-strong)',
            padding: '20px 20px 8px', animation: 'slide-up 220ms cubic-bezier(.2,.7,.3,1)',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }}/>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Excluir exercício?</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
              <strong style={{ color: 'var(--text)' }}>{confirmDeleteEx.nome}</strong> será removido permanentemente desta ficha.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeleteEx(null)} style={{
                flex: 1, height: 48, borderRadius: 14, background: 'var(--surface-3)',
                border: 'none', color: 'var(--muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={() => deleteEx(confirmDeleteEx)} disabled={!!deletingExId} style={{
                flex: 1, height: 48, borderRadius: 14,
                background: 'rgba(255,79,94,0.12)', border: '1px solid rgba(255,79,94,0.4)',
                color: 'var(--danger)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: deletingExId ? 0.5 : 1,
              }}>
                {deletingExId ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
