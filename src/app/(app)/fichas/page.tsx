'use client'

// Aba Treino: só as fichas, para escolher e começar o treino
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/session'
import { useLoad } from '@/lib/load'
import { PageSkeleton } from '@/components/Skeleton'
import FichasLista, { type FichaComContagem } from '@/components/FichasLista'

export default function FichasPage() {
  const user = useUser()
  const { data } = useLoad(async () => {
    const { data: fichas } = await createClient()
      .from('fichas').select('*, exercicios(count)').eq('user_id', user.id).order('ordem')
    return { fichas: (fichas ?? []) as unknown as FichaComContagem[] }
  })
  if (!data) return <PageSkeleton/>
  const n = data.fichas.length

  return (
    <div>
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {'> FICHAS'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1 }}>
          Treino
        </div>
        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
          {n === 0 ? 'Nenhuma ficha ainda' : `${n} ${n === 1 ? 'ficha' : 'fichas'} · toque para começar`}
        </div>
      </div>
      <FichasLista userId={user.id} fichas={data.fichas} titulo="Suas fichas"/>
    </div>
  )
}
