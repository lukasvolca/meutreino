'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/session'
import { useLoad } from '@/lib/load'
import { todayBR } from '@/lib/date'
import { PageSkeleton } from '@/components/Skeleton'
import DietaClient from './DietaClient'

export default function DietaPage() {
  return <Suspense fallback={<PageSkeleton/>}><Dieta/></Suspense>
}

function Dieta() {
  const user = useUser()
  const hoje = todayBR()
  const pedida = useSearchParams().get('data') ?? ''
  const data = /^\d{4}-\d{2}-\d{2}$/.test(pedida) && pedida <= hoje ? pedida : hoje
  const { data: d } = useLoad(() => carregar(user.id, data), data)

  if (!d) return <PageSkeleton/>
  return (
    <DietaClient key={data}
      userId={user.id} data={data} hoje={hoje}
      meta={d.meta} plano={d.plano} diario={d.diario} recentes={d.recentes} alimentos={d.alimentos}
      pesoMedido={d.medida?.peso ?? null} alturaMedida={d.medida?.altura ?? null}
      objetivo={d.objetivo}
    />
  )
}

async function carregar(uid: string, data: string) {
  const supabase = createClient()
  const [profile, meta, plano, diario, recentes, alimentos, medida] = await Promise.all([
    supabase.from('profiles').select('objetivo').eq('id', uid).maybeSingle(),
    supabase.from('metas_nutricionais').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('plano_refeicoes').select('*').eq('user_id', uid).order('ordem'),
    supabase.from('diario_alimentar').select('*').eq('user_id', uid).eq('data', data).order('created_at'),
    supabase.from('diario_alimentar').select('alimento_ref, nome, gramas, kcal, proteina, carbo, gordura')
      .eq('user_id', uid).neq('data', data).order('created_at', { ascending: false }).limit(80),
    supabase.from('alimentos_usuario').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('medidas').select('peso, altura').eq('user_id', uid).not('peso', 'is', null)
      .order('data', { ascending: false }).limit(1).maybeSingle(),
  ])
  return {
    objetivo: profile.data?.objetivo ?? null,
    meta: meta.data ?? null,
    plano: plano.data ?? [],
    diario: diario.data ?? [],
    recentes: recentes.data ?? [],
    alimentos: alimentos.data ?? [],
    medida: medida.data ?? null,
  }
}
