'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const campo: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)' }

export default function NovaSenhaPage() {
  return <Suspense fallback={null}><NovaSenha/></Suspense>
}

function NovaSenha() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''
  const [senha, setSenha] = useState('')
  const [conf, setConf] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const tokenOk = /^[a-f0-9]{64}$/.test(token)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== conf) { setErro('As senhas não são iguais.'); return }
    setSalvando(true)
    const { error } = await createClient().auth.reset(token, senha)
    setSalvando(false)
    if (error) { setErro(error.message); return }
    router.replace('/dashboard/')
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="text-4xl font-bold tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Escolha sua nova senha</p>
      </div>

      {!tokenOk ? (
        <div className="rounded-2xl p-5 text-sm" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          Este link está incompleto ou é antigo.{' '}
          <Link href="/esqueci-senha/" style={{ color: 'var(--accent)', fontWeight: 600 }}>Pedir um novo link</Link>
        </div>
      ) : (
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>Nova senha</label>
            <input id="senha" type="password" required minLength={6} autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)}
              className="w-full h-12 rounded-xl px-4 outline-none" style={campo}/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="conf" className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>Repita a nova senha</label>
            <input id="conf" type="password" required minLength={6} autoComplete="new-password" value={conf} onChange={e => setConf(e.target.value)}
              className="w-full h-12 rounded-xl px-4 outline-none" style={campo}/>
          </div>
          {erro && (
            <p role="alert" className="text-sm text-center" style={{ color: 'var(--danger)' }}>
              {erro}{erro.includes('expirou') && <> <Link href="/esqueci-senha/" style={{ color: 'var(--accent)' }}>Pedir outro</Link></>}
            </p>
          )}
          <button type="submit" disabled={salvando} className="w-full h-12 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
            {salvando ? 'Salvando…' : 'Salvar e entrar'}
          </button>
        </form>
      )}
    </div>
  )
}
