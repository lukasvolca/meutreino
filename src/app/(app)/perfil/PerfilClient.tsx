'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'
import Icon from '@/components/icons'

type Profile = Database['public']['Tables']['profiles']['Row']
type Ficha = Database['public']['Tables']['fichas']['Row'] & { exercicios: { count: number }[] }

const OBJETIVOS = [
  { id: 'hipertrofia', label: 'Hipertrofia' },
  { id: 'emagrecimento', label: 'Emagrecimento' },
  { id: 'forca', label: 'Força' },
  { id: 'condicionamento', label: 'Condicionamento' },
]

const COR_PRESETS = ['#CCFF00', '#00E5FF', '#FF5E1F', '#FF3B5C', '#A78BFA', '#34D399']
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function PerfilClient({ profile, fichas, treinosTotal }: {
  profile: Profile; fichas: Ficha[]; treinosTotal: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const [editingNome, setEditingNome] = useState(false)
  const [nome, setNome] = useState(profile.nome)
  const [savingNome, setSavingNome] = useState(false)
  const [novaFichaOpen, setNovaFichaOpen] = useState(false)
  const [novaFichaNome, setNovaFichaNome] = useState('')
  const [novaFichaLetra, setNovaFichaLetra] = useState('')
  const [novaFichaCor, setNovaFichaCor] = useState(COR_PRESETS[0])
  const [savingFicha, setSavingFicha] = useState(false)

  const iniciais = profile.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const objLabel = OBJETIVOS.find(o => o.id === profile.objetivo)?.label ?? profile.objetivo ?? '—'

  function openNovaFicha() {
    const usadas = new Set(fichas.map(f => f.letra))
    const proxima = LETRAS.split('').find(l => !usadas.has(l)) ?? 'A'
    setNovaFichaLetra(proxima)
    setNovaFichaNome('')
    setNovaFichaCor(COR_PRESETS[fichas.length % COR_PRESETS.length])
    setNovaFichaOpen(true)
  }

  async function salvarNovaFicha() {
    if (!novaFichaNome.trim() || !novaFichaLetra) return
    setSavingFicha(true)
    await supabase.from('fichas').insert({
      user_id: profile.id,
      nome: novaFichaNome.trim(),
      letra: novaFichaLetra.toUpperCase(),
      cor: novaFichaCor,
      ordem: fichas.length,
    })
    setSavingFicha(false)
    setNovaFichaOpen(false)
    router.refresh()
  }

  async function saveNome() {
    setSavingNome(true)
    await supabase.from('profiles').update({ nome }).eq('id', profile.id)
    setSavingNome(false)
    setEditingNome(false)
    router.refresh()
  }

  async function updateObjetivo(obj: string) {
    await supabase.from('profiles').update({ objetivo: obj }).eq('id', profile.id)
    router.refresh()
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
              { label: 'OBJETIVO', value: objLabel.slice(0, 4).toUpperCase(), unit: '.', color: 'var(--accent)', small: true },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '14px 12px', textAlign: 'center',
                borderLeft: s.border ? '1px solid var(--border)' : undefined,
                borderRight: s.border ? '1px solid var(--border)' : undefined,
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: s.small ? 18 : 26, letterSpacing: '-0.02em', color: s.color ?? 'var(--text)', lineHeight: 1 }}>{s.value}</span>
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

      {/* Fichas */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Fichas de treino</div>
          <button onClick={openNovaFicha}
            style={{ height: 28, padding: '0 12px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(204,255,0,0.1)', color: 'var(--accent)', border: 0 }}>
            + Nova ficha
          </button>
        </div>
        {fichas.length === 0 ? (
          <button onClick={openNovaFicha}
            style={{
              width: '100%', padding: 20, borderRadius: 18, textAlign: 'center', cursor: 'pointer',
              background: 'var(--surface-1)', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--muted)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
            <span style={{ fontSize: 13 }}>Nenhuma ficha ainda</span>
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fichas.map(f => (
              <Link key={f.id} href={`/treino/${f.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16,
                  background: 'var(--surface-1)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit',
                }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${f.cor ?? '#CCFF00'}20`, color: f.cor ?? '#CCFF00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                }}>{f.letra}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    {f.exercicios?.[0]?.count ?? 0} exercícios
                  </div>
                </div>
                <Icon name="chevronRight" size={16} color="var(--muted-3)"/>
              </Link>
            ))}
          </div>
        )}
      </div>

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

      {/* Nova Ficha modal */}
      {novaFichaOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ borderRadius: '24px 24px 0 0', padding: '20px 16px 40px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Nova ficha</h2>
              <button onClick={() => setNovaFichaOpen(false)} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 0, cursor: 'pointer' }}>Cancelar</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Nome</label>
              <input autoFocus type="text" placeholder="ex: Push · Peito · Ombro · Tríceps"
                value={novaFichaNome} onChange={e => setNovaFichaNome(e.target.value)}
                style={{ width: '100%', height: 44, borderRadius: 14, padding: '0 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Letra</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LETRAS.slice(0, 8).split('').map(l => (
                  <button key={l} onClick={() => setNovaFichaLetra(l)}
                    style={{
                      width: 40, height: 40, borderRadius: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      background: novaFichaLetra === l ? `${novaFichaCor}25` : 'var(--surface-2)',
                      border: `1px solid ${novaFichaLetra === l ? novaFichaCor : 'var(--border)'}`,
                      color: novaFichaLetra === l ? novaFichaCor : 'var(--muted)',
                    }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Cor</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {COR_PRESETS.map(cor => (
                  <button key={cor} onClick={() => setNovaFichaCor(cor)} style={{
                    width: 36, height: 36, borderRadius: '50%', background: cor, cursor: 'pointer',
                    outline: novaFichaCor === cor ? `3px solid ${cor}` : 'none', outlineOffset: 2,
                    opacity: novaFichaCor === cor ? 1 : 0.45, border: 0,
                  }}/>
                ))}
              </div>
            </div>
            <button onClick={salvarNovaFicha} disabled={savingFicha || !novaFichaNome.trim()}
              style={{ width: '100%', height: 48, borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, opacity: (savingFicha || !novaFichaNome.trim()) ? 0.4 : 1 }}>
              {savingFicha ? 'Criando…' : 'Criar ficha'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
