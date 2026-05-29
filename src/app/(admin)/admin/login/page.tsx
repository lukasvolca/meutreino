'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const statusMsg = params.get('status') === 'pending'
    ? 'Conta criada! Aguardando aprovação do administrador.'
    : params.get('status') === 'unauthorized'
    ? 'Acesso não autorizado. Entre em contato com o administrador.'
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      const role = profile?.role ?? 'user'
      if (role === 'trainer_pending') {
        router.push('/admin/pendente')
      } else if (role === 'trainer' || role === 'admin') {
        router.push('/admin')
      } else {
        await supabase.auth.signOut()
        setError('Conta sem permissão de acesso ao painel.')
        setLoading(false)
      }
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', marginBottom: 4 }}>
            <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.14em' }}>
            PAINEL ADMIN
          </div>
        </div>

        {statusMsg && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, marginBottom: 20,
            background: params.get('status') === 'pending' ? 'rgba(109,255,176,0.08)' : 'rgba(255,79,94,0.08)',
            border: `1px solid ${params.get('status') === 'pending' ? 'rgba(109,255,176,0.3)' : 'rgba(255,79,94,0.3)'}`,
            color: params.get('status') === 'pending' ? 'var(--ok)' : 'var(--danger)',
            fontSize: 13, fontWeight: 500, textAlign: 'center',
          }}>
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Email', type: 'email', value: email, set: setEmail },
            { label: 'Senha', type: 'password', value: password, set: setPassword },
          ].map(({ label, type, value, set }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {label}
              </label>
              <input
                type={type}
                required
                value={value}
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
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 24 }}>
          Personal trainer?{' '}
          <Link href="/admin/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Solicitar cadastro
          </Link>
        </p>
      </div>
    </div>
  )
}
