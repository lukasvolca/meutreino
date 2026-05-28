'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/icons'
import { getActiveSession, clearActiveSession } from '@/lib/activeSession'

interface Props {
  fichaId: string
  cor: string
  isCompleted: boolean
  duracaoMin: number | null
}

export default function DashboardHeroButton({ fichaId, cor, isCompleted, duracaoMin }: Props) {
  const router = useRouter()
  const [active, setActive] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const s = getActiveSession()
    if (s?.fichaId === fichaId && !isCompleted) {
      setActive(true)
      setElapsed(Math.floor((Date.now() - s.startTime) / 1000))
    }
  }, [fichaId, isCompleted])

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      const s = getActiveSession()
      if (s) setElapsed(Math.floor((Date.now() - s.startTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [active])

  function handleEnd() {
    clearActiveSession()
    setActive(false)
    router.refresh()
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  // Workout completed today
  if (isCompleted) {
    return (
      <Link href={`/treino/${fichaId}`} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', height: 56, borderRadius: 28,
        background: 'var(--surface-2)',
        color: cor,
        border: '1px solid rgba(204,255,0,0.4)',
        fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
        letterSpacing: '-0.005em', textDecoration: 'none',
      }}>
        <Icon name="check" size={18} color="currentColor"/>
        {`Treino concluído (${duracaoMin}min) · revisar`}
      </Link>
    )
  }

  // Active session in progress
  if (active) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: cor, boxShadow: `0 0 8px ${cor}` }}/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>
            EM ANDAMENTO ·{' '}
            <span style={{ color: cor, fontWeight: 700 }}>{mm}:{ss}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/treino/${fichaId}`} style={{
            flex: 1, height: 52, borderRadius: 26,
            background: cor, color: 'var(--accent-ink)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
            letterSpacing: '-0.005em', textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            <Icon name="play" size={15} color="currentColor"/>
            Pausar treino
          </Link>
          <button onClick={handleEnd} style={{
            flex: 1, height: 52, borderRadius: 26,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-strong)',
            color: 'var(--muted)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            <Icon name="x" size={16} color="currentColor"/>
            Encerrar treino
          </button>
        </div>
      </div>
    )
  }

  // Default: start workout
  return (
    <Link href={`/treino/${fichaId}`} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', height: 56, borderRadius: 28,
      background: cor,
      color: 'var(--accent-ink)',
      fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
      letterSpacing: '-0.005em', textDecoration: 'none',
    }}>
      <Icon name="play" size={18} color="currentColor"/>
      Iniciar treino
    </Link>
  )
}
