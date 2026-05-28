'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import { getActiveSession, setActiveSession, clearActiveSession } from '@/lib/activeSession'
import type { ActiveSession } from '@/lib/activeSession'

interface Props {
  fichaId: string
  fichaLetra: string
  cor: string
  isCompleted: boolean
  duracaoMin: number | null
}

function calcElapsed(s: ActiveSession): number {
  if (s.pausedAt) return Math.floor((s.pausedAt - s.startTime) / 1000)
  return Math.floor((Date.now() - s.startTime) / 1000)
}

export default function DashboardHeroButton({ fichaId, fichaLetra, cor, isCompleted, duracaoMin }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [session, setSession] = useState<ActiveSession | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    const s = getActiveSession()
    if (s?.fichaId === fichaId && !isCompleted) {
      setSession(s)
      setElapsed(calcElapsed(s))
    }
  }, [fichaId, isCompleted])

  // Tick only when session is running (not paused)
  useEffect(() => {
    if (!session || session.pausedAt) return
    const id = setInterval(() => {
      const s = getActiveSession()
      if (s && !s.pausedAt) setElapsed(Math.floor((Date.now() - s.startTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [!!session, !!session?.pausedAt]) // eslint-disable-line

  function handlePause() {
    if (!session) return
    const updated: ActiveSession = { ...session, pausedAt: Date.now() }
    setActiveSession(updated)
    setSession(updated)
    setElapsed(calcElapsed(updated))
  }

  function handleResume() {
    if (!session?.pausedAt) return
    // Re-anchor startTime so elapsed continues seamlessly
    const pausedElapsed = session.pausedAt - session.startTime
    const updated: ActiveSession = { ...session, startTime: Date.now() - pausedElapsed, pausedAt: undefined }
    setActiveSession(updated)
    setSession(updated)
  }

  async function handleEnd() {
    if (!session) return
    setSaving(true)
    const durMin = Math.max(1, Math.round(elapsed / 60))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('treinos').insert({
        user_id: user.id,
        ficha_id: fichaId,
        ficha_letra: fichaLetra,
        data: new Date().toISOString().split('T')[0],
        duracao_min: durMin,
        volume_total: 0,
      })
    }
    clearActiveSession()
    setSession(null)
    setSaving(false)
    router.refresh()
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const isPaused = !!session?.pausedAt

  // ── Completed today ──────────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <Link href={`/treino/${fichaId}`} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', height: 56, borderRadius: 28,
        background: 'var(--surface-2)', color: cor,
        border: '1px solid rgba(204,255,0,0.4)',
        fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
        letterSpacing: '-0.005em', textDecoration: 'none',
      }}>
        <Icon name="check" size={18} color="currentColor"/>
        {`Treino concluído (${duracaoMin}min) · revisar`}
      </Link>
    )
  }

  // ── Active session ───────────────────────────────────────────────────────────
  if (session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isPaused ? 'var(--muted-2)' : cor,
            boxShadow: isPaused ? 'none' : `0 0 8px ${cor}`,
          }}/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>
            {isPaused ? 'PAUSADO' : 'EM ANDAMENTO'} ·{' '}
            <span style={{ color: isPaused ? 'var(--muted)' : cor, fontWeight: 700 }}>{mm}:{ss}</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isPaused ? (
            <button onClick={handleResume} style={{
              flex: 1, height: 52, borderRadius: 26,
              background: cor, color: 'var(--accent-ink)',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <Icon name="play" size={15} color="currentColor"/>
              Retomar treino
            </button>
          ) : (
            <button onClick={handlePause} style={{
              flex: 1, height: 52, borderRadius: 26,
              background: cor, color: 'var(--accent-ink)',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <Icon name="pause" size={15} color="currentColor"/>
              Pausar treino
            </button>
          )}

          <button onClick={() => setConfirmOpen(true)} disabled={saving} style={{
            flex: 1, height: 52, borderRadius: 26,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-strong)',
            color: 'var(--muted)', cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            opacity: saving ? 0.6 : 1,
          }}>
            <Icon name="x" size={16} color="currentColor"/>
            {saving ? 'Salvando…' : 'Encerrar treino'}
          </button>

          {/* Confirmation modal */}
          {confirmOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div onClick={() => setConfirmOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}/>
              <div style={{
                position: 'relative', width: '100%', maxWidth: 480,
                background: 'var(--surface-1)', borderRadius: '24px 24px 0 0',
                border: '1px solid var(--border)', borderBottom: 'none',
                padding: '28px 20px 40px',
                animation: 'slide-up 240ms cubic-bezier(.2,.7,.3,1)',
              }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 22px' }}/>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Encerrar treino?
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
                  O tempo acumulado será salvo no histórico. Exercícios e séries não finalizados não serão registrados.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmOpen(false)} style={{
                    flex: 1, height: 52, borderRadius: 26,
                    background: 'var(--surface-3)', border: 'none',
                    color: 'var(--muted)', fontFamily: 'var(--font-body)',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Cancelar
                  </button>
                  <button onClick={() => { setConfirmOpen(false); handleEnd() }} disabled={saving} style={{
                    flex: 1, height: 52, borderRadius: 26,
                    background: '#ff5e5e22', border: '1px solid #ff5e5e60',
                    color: '#ff7b7b', fontFamily: 'var(--font-body)',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  }}>
                    Sim, encerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Default: start ───────────────────────────────────────────────────────────
  return (
    <Link href={`/treino/${fichaId}`} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', height: 56, borderRadius: 28,
      background: cor, color: 'var(--accent-ink)',
      fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
      letterSpacing: '-0.005em', textDecoration: 'none',
    }}>
      <Icon name="play" size={18} color="currentColor"/>
      Iniciar treino
    </Link>
  )
}
