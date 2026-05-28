'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="text-4xl font-bold tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Seu treino. Seu ritmo.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl px-4 text-sm outline-none focus:ring-2"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>
            Senha
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl px-4 text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
          />
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl font-semibold text-sm mt-2 disabled:opacity-50 transition-opacity"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
        Não tem conta?{' '}
        <Link href="/signup" className="font-semibold" style={{ color: 'var(--accent)' }}>
          Criar conta
        </Link>
      </p>
    </div>
  )
}
