'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <div className="text-4xl font-bold tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Crie sua conta gratuita</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { label: 'Seu nome', type: 'text', value: nome, set: setNome, placeholder: 'Como quer ser chamado' },
          { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: '' },
          { label: 'Senha', type: 'password', value: password, set: setPassword, placeholder: 'Mínimo 6 caracteres' },
        ].map(({ label, type, value, set, placeholder }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>
              {label}
            </label>
            <input
              type={type}
              required
              minLength={type === 'password' ? 6 : 1}
              value={value}
              placeholder={placeholder}
              onChange={e => set(e.target.value)}
              className="w-full h-12 rounded-xl px-4 text-sm outline-none placeholder:opacity-30"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
            />
          </div>
        ))}

        {error && (
          <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl font-semibold text-sm mt-2 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          {loading ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
          Entrar
        </Link>
      </p>
    </div>
  )
}
