'use client'

// Sessão no navegador: confere quem está logado na API e protege as telas.
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type AuthUser } from '@/lib/supabase/client'
import { PageSkeleton } from '@/components/Skeleton'

const UserCtx = createContext<AuthUser | null>(null)

/** Usuário logado (só dentro de <AuthGate>). */
export function useUser(): AuthUser {
  const u = useContext(UserCtx)
  if (!u) throw new Error('useUser fora do AuthGate')
  return u
}

export function AuthGate({ children, onboarding = true }: { children: React.ReactNode; onboarding?: boolean }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [offline, setOffline] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let vivo = true
    createClient().auth.getUser().then(({ data, error }) => {
      if (!vivo) return
      if (!data.user) {
        if (error?.code === 'network') { setOffline(true); return }
        router.replace('/login/')
        return
      }
      const p = data.user.profile
      if (onboarding && p && !p.objetivo && p.role === 'user') { router.replace('/onboarding/'); return }
      setOffline(false)
      setUser(data.user)
    })
    const sair = () => router.replace('/login/')
    window.addEventListener('mt:unauthorized', sair)
    return () => { vivo = false; window.removeEventListener('mt:unauthorized', sair) }
  }, [router, onboarding, tentativa])

  if (offline) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>Sem conexão</div>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>Não deu para falar com o servidor. Confira a internet e tente de novo.</p>
        <button onClick={() => setTentativa(t => t + 1)} style={{
          height: 48, padding: '0 24px', borderRadius: 24, border: 0, background: 'var(--accent)',
          color: 'var(--accent-ink)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}>Tentar de novo</button>
      </div>
    )
  }
  if (!user) return <div style={{ paddingTop: 56 }}><PageSkeleton/></div>
  return <UserCtx.Provider value={user}>{children}</UserCtx.Provider>
}
