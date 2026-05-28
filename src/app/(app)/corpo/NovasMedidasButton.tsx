'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CAMPOS = [
  { key: 'peso', label: 'Peso (kg)', step: 0.1 },
  { key: 'gordura', label: '% Gordura', step: 0.1 },
  { key: 'peito', label: 'Peito (cm)', step: 0.5 },
  { key: 'cintura', label: 'Cintura (cm)', step: 0.5 },
  { key: 'quadril', label: 'Quadril (cm)', step: 0.5 },
  { key: 'braco_d', label: 'Braço D (cm)', step: 0.5 },
  { key: 'coxa_d', label: 'Coxa D (cm)', step: 0.5 },
  { key: 'panturrilha', label: 'Panturrilha (cm)', step: 0.5 },
] as const

export default function NovasMedidasButton({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const parsed = Object.fromEntries(
      CAMPOS.map(({ key }) => [key, parseFloat(values[key] ?? '')])
        .filter(([, v]) => !isNaN(v as number))
    ) as Partial<Record<typeof CAMPOS[number]['key'], number>>
    await supabase.from('medidas').insert({ user_id: userId, ...parsed })
    setOpen(false)
    setValues({})
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-xl text-xs font-semibold"
        style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
        + Nova medição
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-t-3xl px-4 pt-5 pb-8"
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-strong)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Nova medição</h2>
              <button onClick={() => setOpen(false)} className="text-sm" style={{ color: 'var(--muted)' }}>Cancelar</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {CAMPOS.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--muted-2)' }}>
                    {label}
                  </label>
                  <input type="number" step="0.1" inputMode="decimal"
                    value={values[key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))}
                    className="h-10 rounded-xl px-3 text-sm font-mono outline-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full h-12 rounded-xl font-semibold text-sm disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              {saving ? 'Salvando…' : 'Salvar medição'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
