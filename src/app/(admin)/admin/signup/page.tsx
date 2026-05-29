'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminSignupPage() {
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

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      // Mark as trainer_pending via secure RPC
      await supabase.rpc('request_trainer_role')
      await supabase.auth.signOut()
    }

    router.push('/admin/login?status=pending')
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', marginBottom: 4 }}>
            <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.14em' }}>
            CADASTRO DE PERSONAL TRAINER
          </div>
        </div>

        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(255,181,71,0.07)', border: '1px solid rgba(255,181,71,0.25)',
          color: 'var(--warn)', fontSize: 13, lineHeight: 1.5,
        }}>
          Seu cadastro ficará pendente até ser aprovado pelo administrador.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Seu nome', type: 'text', value: nome, set: setNome, placeholder: 'Nome completo' },
            { label: 'Email profissional', type: 'email', value: email, set: setEmail, placeholder: '' },
            { label: 'Senha', type: 'password', value: password, set: setPassword, placeholder: 'Mínimo 6 caracteres' },
          ].map(({ label, type, value, set, placeholder }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {label}
              </label>
              <input
                type={type}
                required
                minLength={type === 'password' ? 6 : 1}
                value={value}
                placeholder={placeholder}
                onChange={e => set(e.target.value)}
                style={{
                  height: 46, borderRadius: 12, padding: '0 14px',
                  background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
                  color: 'var(--text)', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          ))}

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 48, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              background: 'var(--accent)', color: 'var(--accent-ink)', border: 0,
              opacity: loading ? 0.5 : 1, marginTop: 4,
            }}
          >
            {loading ? 'Enviando…' : 'Solicitar cadastro'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 24 }}>
          Já tem conta?{' '}
          <Link href="/admin/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
