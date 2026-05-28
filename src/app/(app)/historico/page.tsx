import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: treinosRaw } = await supabase
    .from('treinos')
    .select('*, fichas(nome, cor)')
    .eq('user_id', user!.id)
    .order('data', { ascending: false })
    .limit(50)

  const treinos = treinosRaw as Array<{
    id: string; ficha_letra: string | null; data: string
    duracao_min: number | null; volume_total: number; teve_pr: boolean
    fichas: { nome: string; cor: string } | null
  }> | null

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Histórico</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {treinos?.length ?? 0} treinos registrados
      </p>

      {(!treinos || treinos.length === 0) ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--muted)' }}>
          Nenhum treino registrado ainda.<br/>
          <Link href="/dashboard" style={{ color: 'var(--accent)' }}>Começar agora →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {treinos.map(t => {
            const ficha = t.fichas as { nome: string; cor: string } | null
            return (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold font-mono text-base flex-shrink-0"
                  style={{ background: `${ficha?.cor ?? '#CCFF00'}20`, color: ficha?.cor ?? '#CCFF00' }}>
                  {t.ficha_letra ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{ficha?.nome ?? `Ficha ${t.ficha_letra}`}</div>
                  <div className="text-xs mt-0.5 flex gap-2" style={{ color: 'var(--muted-2)' }}>
                    <span>{new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                    {t.duracao_min && <span>· {t.duracao_min}min</span>}
                    {t.volume_total > 0 && <span>· {(t.volume_total / 1000).toFixed(1)}t</span>}
                  </div>
                </div>
                {t.teve_pr && (
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(204,255,0,0.1)', color: 'var(--accent)' }}>PR</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
