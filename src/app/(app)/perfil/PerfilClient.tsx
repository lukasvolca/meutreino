'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'
import FichasLista, { type FichaComContagem } from '@/components/FichasLista'
import Icon from '@/components/icons'
import { refreshData } from '@/lib/load'

type Profile = Database['public']['Tables']['profiles']['Row']
type Ficha = FichaComContagem

const OBJETIVOS = [
  { id: 'hipertrofia', label: 'Hipertrofia' },
  { id: 'emagrecimento', label: 'Emagrecimento' },
  { id: 'forca', label: 'Força' },
  { id: 'condicionamento', label: 'Condicionamento' },
]


export default function PerfilClient({ profile, fichas, treinosTotal }: {
  profile: Profile; fichas: Ficha[]; treinosTotal: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const [editingNome, setEditingNome] = useState(false)
  const [nome, setNome] = useState(profile.nome)
  const [savingNome, setSavingNome] = useState(false)
  const iniciais = profile.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const objLabel = OBJETIVOS.find(o => o.id === profile.objetivo)?.label ?? profile.objetivo ?? '—'

  async function saveNome() {
    setSavingNome(true)
    await supabase.from('profiles').update({ nome }).eq('id', profile.id)
    setSavingNome(false)
    setEditingNome(false)
    refreshData()
  }

  async function updateObjetivo(obj: string) {
    await supabase.from('profiles').update({ objetivo: obj }).eq('id', profile.id)
    refreshData()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div>
      {/* Hero: avatar + name */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', width: 92, height: 92 }}>
          <div style={{
            width: 92, height: 92, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a2d36, #14161c)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 33,
            color: 'var(--text)', letterSpacing: '-0.02em',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>{iniciais}</div>
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 32, height: 32, borderRadius: 16,
            background: 'var(--accent)', color: 'var(--accent-ink)',
            border: '3px solid var(--bg-app)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            <Icon name="camera" size={14} strokeWidth={2.2}/>
          </div>
        </div>

        {/* Name editing */}
        <div style={{ width: '100%', maxWidth: 280 }}>
          {editingNome ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input autoFocus value={nome} onChange={e => setNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveNome(); if (e.key === 'Escape') setEditingNome(false) }}
                style={{
                  flex: 1, padding: '4px 10px',
                  background: 'var(--surface-2)', border: '1px solid var(--accent)',
                  borderRadius: 8, color: 'var(--text)',
                  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                  letterSpacing: '-0.02em', outline: 'none',
                }}/>
              <button onClick={saveNome} disabled={savingNome}
                style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 700, border: 0, cursor: 'pointer' }}>
                {savingNome ? '…' : 'OK'}
              </button>
            </div>
          ) : (
            <div className="tappable" onClick={() => setEditingNome(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>
                {profile.nome}
              </span>
              <Icon name="edit" size={13} color="var(--muted-3)"/>
            </div>
          )}
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
            {treinosTotal} TREINOS · {objLabel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats 3-col */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ borderRadius: 18, background: 'var(--surface-1)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'STREAK', value: profile.streak ?? 0, unit: 'd', color: '#ffb547' },
              { label: 'TREINOS', value: treinosTotal, unit: '', border: true },
              { label: 'FICHAS', value: fichas.length, unit: '', color: 'var(--accent)' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '14px 12px', textAlign: 'center',
                borderLeft: s.border ? '1px solid var(--border)' : undefined,
                borderRight: s.border ? '1px solid var(--border)' : undefined,
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: s.color ?? 'var(--text)', lineHeight: 1 }}>{s.value}</span>
                  {s.unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Objetivo */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>OBJETIVO</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {OBJETIVOS.map(o => (
            <button key={o.id} onClick={() => updateObjetivo(o.id)} className="tappable"
              style={{
                padding: 12, borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                background: profile.objetivo === o.id ? 'rgba(204,255,0,0.08)' : 'var(--surface-1)',
                border: `1px solid ${profile.objetivo === o.id ? 'var(--accent)' : 'var(--border)'}`,
                color: profile.objetivo === o.id ? 'var(--accent)' : 'var(--text)',
                fontSize: 13, fontWeight: 600,
              }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <FichasLista userId={profile.id} fichas={fichas}/>

      {/* Conta section */}
      <div style={{ padding: '0 20px 6px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Conta</div>
      <div style={{ padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { icon: 'bell', label: 'Notificações', hint: 'ligadas', href: '/notificacoes' },
          { icon: 'info', label: 'Sobre o app', hint: 'v1.0.0', href: null },
        ].map(row => (
          row.href ? (
            <Link key={row.label} href={row.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 14,
                textDecoration: 'none', color: 'inherit',
              }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={row.icon} size={16}/>
              </div>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{row.label}</span>
              {row.hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>{row.hint}</span>}
              <Icon name="chevronRight" size={16} color="var(--muted-3)"/>
            </Link>
          ) : (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={row.icon} size={16}/>
              </div>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{row.label}</span>
              {row.hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>{row.hint}</span>}
              <Icon name="chevronRight" size={16} color="var(--muted-3)"/>
            </div>
          )
        ))}
        <button onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="logout" size={16}/>
          </div>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--danger)' }}>Sair</span>
          <Icon name="chevronRight" size={16} color="var(--muted-3)"/>
        </button>
      </div>

    </div>
  )
}
