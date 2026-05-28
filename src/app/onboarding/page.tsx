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
  { letra: 'A', nome: 'Push · Peito · Ombro · Tríceps', cor: '#CCFF00', icone: 'benchPress', duracao_min: 62 },
  { letra: 'B', nome: 'Pull · Costas · Bíceps', cor: '#00E5FF', icone: 'bicep', duracao_min: 58 },
  { letra: 'C', nome: 'Legs · Quadríceps · Posterior · Glúteo', cor: '#FF5E1F', icone: 'squat', duracao_min: 70 },
]

// Seed exercises from prototype data — keyed by ficha letra
const EXERCICIOS_SEED: Record<string, Array<{
  nome: string, grupo: string, series: number, reps: string,
  carga: number, descanso: number, tipo: string,
  duracao_seg?: number, duracao_min?: number, intensidade?: string,
  yt_id: string, ordem: number
}>> = {
  A: [
    { nome: 'Supino reto com barra', grupo: 'Peito', series: 4, reps: '8-10', carga: 72.5, descanso: 90, tipo: 'forca', yt_id: 'rT7DgCr-3pg', ordem: 0 },
    { nome: 'Supino inclinado halter', grupo: 'Peito sup.', series: 3, reps: '10-12', carga: 26, descanso: 75, tipo: 'forca', yt_id: '8iPEnn-ltC8', ordem: 1 },
    { nome: 'Desenvolvimento militar', grupo: 'Ombros', series: 4, reps: '6-8', carga: 50, descanso: 90, tipo: 'forca', yt_id: 'qEwKCR5JCog', ordem: 2 },
    { nome: 'Elevação lateral', grupo: 'Ombros', series: 3, reps: '12-15', carga: 10, descanso: 60, tipo: 'forca', yt_id: '3VcKaXpzqRo', ordem: 3 },
    { nome: 'Tríceps corda', grupo: 'Tríceps', series: 3, reps: '12-15', carga: 22, descanso: 60, tipo: 'forca', yt_id: 'kiuVA0gs3EI', ordem: 4 },
    { nome: 'Tríceps francês', grupo: 'Tríceps', series: 3, reps: '10-12', carga: 14, descanso: 60, tipo: 'forca', yt_id: 'YbX7Wd8jQ-Q', ordem: 5 },
    { nome: 'Prancha isométrica', grupo: 'Core', series: 3, reps: '', carga: 0, descanso: 45, tipo: 'iso', duracao_seg: 45, yt_id: 'ASdvN_XEl_c', ordem: 6 },
  ],
  B: [
    { nome: 'Barra fixa pegada pronada', grupo: 'Dorsal', series: 4, reps: '6-10', carga: 0, descanso: 90, tipo: 'forca', yt_id: 'eGo4IYlbE5g', ordem: 0 },
    { nome: 'Remada curvada barra', grupo: 'Costas', series: 4, reps: '8-10', carga: 60, descanso: 90, tipo: 'forca', yt_id: 'kBWAon7ItDw', ordem: 1 },
    { nome: 'Pulldown pegada neutra', grupo: 'Dorsal', series: 3, reps: '10-12', carga: 55, descanso: 75, tipo: 'forca', yt_id: 'CAwf7n6Luuc', ordem: 2 },
    { nome: 'Remada baixa cabo', grupo: 'Costas', series: 3, reps: '10-12', carga: 50, descanso: 75, tipo: 'forca', yt_id: 'GZbfZ033f74', ordem: 3 },
    { nome: 'Rosca direta barra W', grupo: 'Bíceps', series: 3, reps: '10-12', carga: 22, descanso: 60, tipo: 'forca', yt_id: 'kwG2ipFRgfo', ordem: 4 },
    { nome: 'Rosca martelo', grupo: 'Bíceps', series: 3, reps: '12-15', carga: 14, descanso: 60, tipo: 'forca', yt_id: 'TwD-YGVP4Bk', ordem: 5 },
  ],
  C: [
    { nome: 'Agachamento livre', grupo: 'Quadríceps', series: 5, reps: '5-8', carga: 100, descanso: 120, tipo: 'forca', yt_id: 'ultWZbUMPL8', ordem: 0 },
    { nome: 'Stiff com halteres', grupo: 'Posterior', series: 4, reps: '8-10', carga: 30, descanso: 90, tipo: 'forca', yt_id: '7AcRGRMr_BU', ordem: 1 },
    { nome: 'Leg press 45°', grupo: 'Quadríceps', series: 4, reps: '10-12', carga: 180, descanso: 90, tipo: 'forca', yt_id: 'IZxyjW7MPJQ', ordem: 2 },
    { nome: 'Cadeira flexora', grupo: 'Posterior', series: 3, reps: '12-15', carga: 45, descanso: 60, tipo: 'forca', yt_id: '1Tq3QdYUuHs', ordem: 3 },
    { nome: 'Panturrilha em pé', grupo: 'Panturrilha', series: 4, reps: '15-20', carga: 80, descanso: 45, tipo: 'forca', yt_id: '-M4-G8p8fmc', ordem: 4 },
    { nome: 'Esteira · caminhada inclinada', grupo: 'Cardio', series: 1, reps: '', carga: 0, descanso: 0, tipo: 'cardio', duracao_min: 15, intensidade: '6 km/h · 8% incl.', yt_id: 'kVnyY17VS9Y', ordem: 5 },
  ],
}

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

    await supabase.from('profiles').update({ objetivo }).eq('id', user.id)

    const fichasToInsert = FICHAS_TEMPLATE
      .filter(f => fichasSelecionadas.includes(f.letra))
      .map((f, i) => ({ ...f, user_id: user.id, ordem: i }))

    if (fichasToInsert.length > 0) {
      const { data: fichasCriadas } = await supabase
        .from('fichas')
        .insert(fichasToInsert)
        .select('id, letra')

      // Seed exercises for each created ficha
      if (fichasCriadas) {
        const exerciciosToInsert = fichasCriadas.flatMap(ficha => {
          const exs = EXERCICIOS_SEED[ficha.letra] ?? []
          return exs.map(ex => ({ ...ex, ficha_id: ficha.id }))
        })
        if (exerciciosToInsert.length > 0) {
          await supabase.from('exercicios').insert(exerciciosToInsert)
        }
      }
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-full bg-page flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(204,255,0,0.05), transparent 60%), #060608' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
          </div>
        </div>

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
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all tappable"
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
              className="w-full h-12 rounded-xl font-semibold text-sm mt-6 tappable"
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
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all tappable"
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
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
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
              Os exercícios já estarão prontos em cada ficha.
            </p>
            <button onClick={handleFinish} disabled={loading || fichasSelecionadas.length === 0}
              className="w-full h-12 rounded-xl font-semibold text-sm mt-6 disabled:opacity-50 tappable"
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              {loading ? 'Criando…' : 'Começar →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
