'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type Ficha = Database['public']['Tables']['fichas']['Row'] & { exercicios: { count: number }[] }

const OBJETIVOS = [
  { id: 'hipertrofia', label: 'Hipertrofia', emoji: '💪' },
  { id: 'emagrecimento', label: 'Emagrecimento', emoji: '🔥' },
  { id: 'forca', label: 'Força', emoji: '🏋️' },
  { id: 'condicionamento', label: 'Condicionamento', emoji: '🫀' },
]

export default function PerfilClient({ profile, fichas, treinosTotal }: {
  profile: Profile; fichas: Ficha[]; treinosTotal: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const [editingNome, setEditingNome] = useState(false)
  const [nome, setNome] = useState(profile.nome)
  const [savingNome, setSavingNome] = useState(false)

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

  const obj = OBJETIVOS.find(o => o.id === profile.objetivo)

  return (
    <div className="px-4 pt-12 pb-4 flex flex-col gap-5">
      {/* Avatar + nome */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
          {profile.nome.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          {editingNome ? (
            <div className="flex gap-2">
              <input autoFocus value={nome} onChange={e => setNome(e.target.value)}
                className="flex-1 h-9 rounded-xl px-3 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--accent)', color: 'var(--text)' }}
              />
              <button onClick={saveNome} disabled={savingNome}
                className="h-9 px-3 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
                {savingNome ? '…' : 'OK'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingNome(true)} className="flex items-center gap-2 text-left">
              <span className="font-bold text-lg">{profile.nome}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {obj?.emoji} {obj?.label} · {treinosTotal} treinos
          </p>
        </div>
      </div>

      {/* Objetivo */}
      <div>
        <p className="text-xs font-mono font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-2)' }}>
          Objetivo
        </p>
        <div className="grid grid-cols-2 gap-2">
          {OBJETIVOS.map(o => (
            <button key={o.id} onClick={() => updateObjetivo(o.id)}
              className="flex items-center gap-2 p-3 rounded-xl text-sm text-left transition-all"
              style={{
                background: profile.objetivo === o.id ? 'rgba(204,255,0,0.08)' : 'var(--surface-1)',
                border: `1px solid ${profile.objetivo === o.id ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              <span>{o.emoji}</span>
              <span className={`font-medium text-xs ${profile.objetivo === o.id ? '' : ''}`}
                style={{ color: profile.objetivo === o.id ? 'var(--accent)' : 'var(--text)' }}>
                {o.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Fichas */}
      <div>
        <p className="text-xs font-mono font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--muted-2)' }}>
          Fichas de treino
        </p>
        <div className="flex flex-col gap-2">
          {fichas.map(f => (
            <Link key={f.id} href={`/treino/${f.id}`}
              className="flex items-center gap-3 p-3 rounded-xl transition-opacity active:opacity-70"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold font-mono text-sm"
                style={{ background: `${f.cor}20`, color: f.cor }}>{f.letra}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.nome}</div>
                <div className="text-xs" style={{ color: 'var(--muted-2)' }}>
                  {f.exercicios?.[0]?.count ?? 0} exercícios
                </div>
              </div>
              <svg width="6" height="12" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={logout}
        className="w-full h-12 rounded-xl text-sm font-semibold mt-2"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--danger)' }}>
        Sair da conta
      </button>
    </div>
  )
}
