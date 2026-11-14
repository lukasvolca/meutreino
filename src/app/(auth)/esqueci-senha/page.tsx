'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const campo: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)' }

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    const { error } = await createClient().auth.recover(email.trim())
    setEnviando(false)
    if (error) { setErro(error.message); return }
    setEnviado(true)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="text-4xl font-bold tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Recuperar acesso</p>
      </div>

      {enviado ? (
        <div className="rounded-2xl p-5 text-sm leading-relaxed" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>Confira seu e-mail</p>
          <p>Se existir uma conta com <b style={{ color: 'var(--text)' }}>{email}</b>, enviamos um link para criar uma senha nova. Ele vale por 30 minutos.</p>
          <p className="mt-3">Não chegou? Olhe a caixa de spam ou promoções.</p>
          <p className="mt-3">Se você entra com o Google, não precisa de senha: use “Continuar com Google”.</p>
        </div>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Informe o e-mail da sua conta. Vamos mandar um link para você escolher uma senha nova.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl px-4 outline-none" style={campo}/>
          </div>
          {erro && <p role="alert" className="text-sm text-center" style={{ color: 'var(--danger)' }}>{erro}</p>}
          <button type="submit" disabled={enviando} className="w-full h-12 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
            {enviando ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
      )}

      <p className="text-center text-sm mt-6">
        <Link href="/login/" className="font-semibold" style={{ color: 'var(--accent)' }}>Voltar para entrar</Link>
      </p>
    </div>
  )
}
