'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const OBJETIVOS = [
  { id: 'hipertrofia', label: 'Hipertrofia', desc: 'Ganhar massa muscular', emoji: '💪' },
  { id: 'emagrecimento', label: 'Emagrecimento', desc: 'Perder gordura', emoji: '🔥' },
  { id: 'forca', label: 'Força', desc: 'Aumentar cargas e PRs', emoji: '🏋️' },
  { id: 'condicionamento', label: 'Condicionamento', desc: 'Resistência e saúde', emoji: '🫀' },
]

const FICHAS_TEMPLATE = [
  { letra: 'A', nome: 'Push · Peito · Ombro · Tríceps', cor: '#CCFF00' },
  { letra: 'B', nome: 'Pull · Costas · Bíceps', cor: '#00E5FF' },
  { letra: 'C', nome: 'Legs · Quadríceps · Posterior', cor: '#FF5E1F' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [objetivo, setObjetivo] = useState('hipertrofia')
  const [fichasSelecionadas, setFichasSelecionadas] = useState<string[]>(['A', 'B', 'C'])
  const [loading, setLoading] = useState(false)

  function toggleFicha(letra: string) {
    setFichasSelecionadas(prev =>
      prev.includes(letra) ? prev.filter(l => l !== letra) : [...prev, letra]
    )
  }

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Atualiza objetivo no perfil
    await supabase.from('profiles').update({ objetivo }).eq('id', user.id)

    // Cria fichas selecionadas
    const fichasToInsert = FICHAS_TEMPLATE
      .filter(f => fichasSelecionadas.includes(f.letra))
      .map((f, i) => ({ ...f, user_id: user.id, ordem: i }))

    if (fichasToInsert.length > 0) {
      await supabase.from('fichas').insert(fichasToInsert)
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-full bg-page flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(204,255,0,0.05), transparent 60%), #060608' }}>
      <div className="w-full max-w-sm">

        {/* Steps indicator */}
        <div className="flex gap-2 mb-10 justify-center">
          {[0, 1].map(i => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{
                width: step === i ? 32 : 8,
                background: step === i ? 'var(--accent)' : 'var(--surface-3)',
              }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 className="text-2xl font-bold mb-1">Qual é seu objetivo?</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Isso ajuda a personalizar o app pra você.
            </p>
            <div className="flex flex-col gap-3">
              {OBJETIVOS.map(o => (
                <button key={o.id} onClick={() => setObjetivo(o.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: objetivo === o.id ? 'rgba(204,255,0,0.08)' : 'var(--surface-1)',
                    border: `1px solid ${objetivo === o.id ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  <span className="text-2xl">{o.emoji}</span>
                  <div>
                    <div className="font-semibold text-sm">{o.label}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{o.desc}</div>
                  </div>
                  {objetivo === o.id && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--accent)' }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="#0a0b0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="w-full h-12 rounded-xl font-semibold text-sm mt-6"
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              Continuar
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold mb-1">Suas fichas de treino</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Selecione as que quer usar. Você pode editar depois.
            </p>
            <div className="flex flex-col gap-3">
              {FICHAS_TEMPLATE.map(f => {
                const sel = fichasSelecionadas.includes(f.letra)
                return (
                  <button key={f.letra} onClick={() => toggleFicha(f.letra)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                    style={{
                      background: sel ? `${f.cor}12` : 'var(--surface-1)',
                      border: `1px solid ${sel ? f.cor : 'var(--border)'}`,
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg font-mono"
                      style={{ background: `${f.cor}20`, color: f.cor }}>
                      {f.letra}
                    </div>
                    <div className="flex-1 text-sm font-medium">{f.nome}</div>
                    {sel && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: f.cor }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="#0a0b0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--muted-2)' }}>
              Você vai adicionar os exercícios dentro de cada ficha.
            </p>
            <button onClick={handleFinish} disabled={loading || fichasSelecionadas.length === 0}
              className="w-full h-12 rounded-xl font-semibold text-sm mt-6 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              {loading ? 'Criando…' : 'Começar →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
