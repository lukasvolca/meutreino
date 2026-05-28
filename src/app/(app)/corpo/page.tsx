import { createClient } from '@/lib/supabase/server'
import NovasMedidasButton from './NovasMedidasButton'

export default async function CorpoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: medidas } = await supabase
    .from('medidas')
    .select('*')
    .eq('user_id', user!.id)
    .order('data', { ascending: false })
    .limit(12)

  const ultima = medidas?.[0]
  const anterior = medidas?.[1]

  function diff(curr: number | null | undefined, prev: number | null | undefined) {
    if (!curr || !prev) return null
    const d = curr - prev
    return d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)
  }

  const campos = [
    { label: 'Peso', key: 'peso', unit: 'kg' },
    { label: '% Gordura', key: 'gordura', unit: '%' },
    { label: 'Peito', key: 'peito', unit: 'cm' },
    { label: 'Cintura', key: 'cintura', unit: 'cm' },
    { label: 'Quadril', key: 'quadril', unit: 'cm' },
    { label: 'Braço D', key: 'braco_d', unit: 'cm' },
    { label: 'Coxa D', key: 'coxa_d', unit: 'cm' },
    { label: 'Panturrilha', key: 'panturrilha', unit: 'cm' },
  ] as const

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Corpo</h1>
          {ultima && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Última medição: {new Date(ultima.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          )}
        </div>
        <NovasMedidasButton userId={user!.id} />
      </div>

      {!ultima ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>
          Nenhuma medida registrada ainda.<br/>Toque em "Nova medição" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {campos.map(({ label, key, unit }) => {
            const val = ultima[key]
            const d = diff(ultima[key], anterior?.[key])
            if (!val) return null
            return (
              <div key={key} className="p-4 rounded-2xl"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-mono font-semibold tracking-widest uppercase mb-1"
                  style={{ color: 'var(--muted-2)' }}>{label}</div>
                <div className="text-xl font-bold">{val}<span className="text-sm font-normal ml-1" style={{ color: 'var(--muted-2)' }}>{unit}</span></div>
                {d && (
                  <div className="text-xs font-mono mt-0.5"
                    style={{ color: d.startsWith('+') ? 'var(--ok)' : 'var(--danger)' }}>
                    {d} vs anterior
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Histórico resumido */}
      {medidas && medidas.length > 1 && (
        <div className="mt-6">
          <p className="text-xs font-mono font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-2)' }}>
            Histórico de peso
          </p>
          <div className="flex flex-col gap-2">
            {medidas.slice(0, 6).map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                </span>
                <span className="font-bold font-mono text-sm">{m.peso} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
