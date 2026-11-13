'use client'

import { useState } from 'react'
import Icon from '@/components/icons'

export const MACRO_COLORS = {
  c: '#ffb547',
  p: '#ff5e1f',
  g: '#6dadff',
}

export const label: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)',
  letterSpacing: '0.12em', textTransform: 'uppercase',
}

export const input: React.CSSProperties = {
  width: '100%', height: 48, padding: '0 14px', borderRadius: 14,
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text)', fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none',
  boxSizing: 'border-box',
}

export function btn(kind: 'primary' | 'ghost' | 'danger' = 'primary'): React.CSSProperties {
  return {
    height: 50, borderRadius: 25, border: kind === 'ghost' ? '1px solid var(--border-strong)' : 0,
    background: kind === 'primary' ? 'var(--accent)' : kind === 'danger' ? 'rgba(255,79,94,0.14)' : 'transparent',
    color: kind === 'primary' ? 'var(--accent-ink)' : kind === 'danger' ? 'var(--danger)' : 'var(--text)',
    fontWeight: 700, fontSize: 15, cursor: 'pointer', padding: '0 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }
}

/** Painel que sobe de baixo, por cima do app. */
export function Sheet({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div role="dialog" aria-modal aria-label={title} onClick={onClose} className="animate-fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} className="animate-slide-up" style={{
        width: '100%', maxWidth: 430, maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-app)', borderTop: '1px solid var(--border-strong)',
        borderRadius: '24px 24px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px 20px', flexShrink: 0 }}>
          <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>{title}</div>
          <button onClick={onClose} aria-label="Fechar" style={{
            width: 40, height: 40, borderRadius: 20, border: 0, cursor: 'pointer',
            background: 'var(--surface-2)', color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '0 20px 16px', flex: 1 }}>{children}</div>
        {footer && <div className="pb-safe" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  )
}

export function MacroBar({ value, target, color, name }: {
  value: number; target: number; color: string; name: string
}) {
  const pct = Math.min(1, value / Math.max(1, target))
  const over = value > target * 1.05
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{name}</span>
        <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: over ? 'var(--warn)' : 'var(--text)', fontWeight: 700 }}>{Math.round(value)}</span>
          <span style={{ color: 'var(--muted-2)' }}> / {target} g</span>
        </span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 300ms ease' }}/>
      </div>
    </div>
  )
}

export function MacroLine({ kcal, p, c, g, size = 12 }: { kcal: number; p: number; c: number; g: number; size?: number }) {
  return (
    <span style={{ fontSize: size, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      <b style={{ color: 'var(--text)' }}>{Math.round(kcal)}</b> kcal
      <span style={{ color: MACRO_COLORS.p, marginLeft: 8 }}>P {Math.round(p)}</span>
      <span style={{ color: MACRO_COLORS.c, marginLeft: 6 }}>C {Math.round(c)}</span>
      <span style={{ color: MACRO_COLORS.g, marginLeft: 6 }}>G {Math.round(g)}</span>
    </span>
  )
}

/** Campo numérico com − / + grandes, bom de usar com uma mão. */
export function Stepper({ value, onChange, step, min = 0, suffix }: {
  value: number; onChange: (v: number) => void; step: number; min?: number; suffix?: string
}) {
  const round = (v: number) => Math.round(v * 100) / 100
  // Enquanto digita, mostra o texto cru (para "1," virar "1,5" sem sumir a vírgula)
  const [draft, setDraft] = useState<string | null>(null)
  const b: React.CSSProperties = {
    width: 56, height: 56, borderRadius: 18, border: 0, cursor: 'pointer',
    background: 'var(--surface-2)', color: 'var(--text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" aria-label="Diminuir" style={b} onClick={() => { setDraft(null); onChange(Math.max(min, round(value - step))) }}>
        <Icon name="minus" size={22} strokeWidth={2.4}/>
      </button>
      <div style={{ flex: 1, position: 'relative' }}>
        <input inputMode="decimal" value={draft ?? (Number.isFinite(value) ? String(value).replace('.', ',') : '')}
          onChange={e => {
            setDraft(e.target.value)
            const v = parseFloat(e.target.value.replace(',', '.'))
            onChange(Number.isFinite(v) ? Math.max(min, v) : 0)
          }}
          onFocus={e => e.target.select()}
          onBlur={() => setDraft(null)}
          style={{ ...input, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', paddingRight: suffix ? 44 : 14 }}/>
        {suffix && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)', fontSize: 14 }}>{suffix}</span>}
      </div>
      <button type="button" aria-label="Aumentar" style={b} onClick={() => { setDraft(null); onChange(round(value + step)) }}>
        <Icon name="plus" size={22} strokeWidth={2.4}/>
      </button>
    </div>
  )
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      height: 36, padding: '0 14px', borderRadius: 18, cursor: 'pointer', flexShrink: 0,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'rgba(204,255,0,0.12)' : 'var(--surface-1)',
      color: active ? 'var(--accent)' : 'var(--muted)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}
