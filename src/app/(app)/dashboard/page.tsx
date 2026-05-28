import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: fichas }, { data: treinos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('fichas').select('*').eq('user_id', user!.id).order('ordem'),
    supabase.from('treinos').select('*').eq('user_id', user!.id).order('data', { ascending: false }).limit(5),
  ])

  const hoje = new Date().toISOString().split('T')[0]
  const treinoHoje = treinos?.find(t => t.data === hoje)
  const firstName = profile?.nome?.split(' ')[0] ?? 'você'
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="px-4 pt-12 pb-4 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>
            {saudacao}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{firstName} 👋</h1>
        </div>
        <Link href="/perfil" className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
          {profile?.nome?.slice(0, 2).toUpperCase() ?? '?'}
        </Link>
      </div>

      {/* Streak */}
      {(profile?.streak ?? 0) > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <span className="text-2xl">🔥</span>
          <div>
            <div className="font-bold text-sm">{profile?.streak} dias seguidos</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Não quebra essa sequência hoje!</div>
          </div>
        </div>
      )}

      {/* Treino de hoje */}
      <div>
        <p className="text-xs font-mono font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-2)' }}>
          Treino de hoje
        </p>
        {treinoHoje ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(109,255,176,0.08)', border: '1px solid var(--ok)' }}>
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--ok)' }}>Treino concluído!</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                Ficha {treinoHoje.ficha_letra} · {treinoHoje.duracao_min}min
              </div>
            </div>
          </div>
        ) : (fichas && fichas.length > 0) ? (
          <Link href={`/treino/${fichas[0].id}`}
            className="flex items-center gap-4 p-4 rounded-2xl transition-opacity active:opacity-70"
            style={{ background: 'rgba(204,255,0,0.06)', border: '1px solid var(--accent)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl font-mono"
              style={{ background: `${fichas[0].cor}20`, color: fichas[0].cor }}>
              {fichas[0].letra}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{fichas[0].nome}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Toque para iniciar</div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1l6 6-6 6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : (
          <div className="p-4 rounded-2xl text-sm text-center" style={{ color: 'var(--muted)', background: 'var(--surface-1)' }}>
            Nenhuma ficha criada ainda.{' '}
            <Link href="/perfil" style={{ color: 'var(--accent)' }}>Criar ficha</Link>
          </div>
        )}
      </div>

      {/* Todas as fichas */}
      {fichas && fichas.length > 1 && (
        <div>
          <p className="text-xs font-mono font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-2)' }}>
            Suas fichas
          </p>
          <div className="flex flex-col gap-2">
            {fichas.map(f => (
              <Link key={f.id} href={`/treino/${f.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl transition-opacity active:opacity-70"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base font-mono"
                  style={{ background: `${f.cor}20`, color: f.cor }}>
                  {f.letra}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{f.nome}</div>
                </div>
                <svg width="6" height="12" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1l6 6-6 6" stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Histórico recente */}
      {treinos && treinos.length > 0 && (
        <div>
          <p className="text-xs font-mono font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-2)' }}>
            Treinos recentes
          </p>
          <div className="flex flex-col gap-2">
            {treinos.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono"
                  style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}>
                  {t.ficha_letra ?? '?'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Ficha {t.ficha_letra}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-2)' }}>
                    {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    {t.duracao_min ? ` · ${t.duracao_min}min` : ''}
                  </div>
                </div>
                {t.teve_pr && <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>PR</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
