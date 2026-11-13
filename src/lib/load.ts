'use client'

// Carrega os dados de uma tela no navegador e recarrega quando alguém chama refreshData()
// (substitui o router.refresh() da época em que as telas rodavam no servidor).
import { useEffect, useState } from 'react'

export function refreshData() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('mt:refresh'))
}

export function useLoad<T>(loader: () => Promise<T>, key: string = ''): { data: T | undefined; erro: boolean } {
  const [state, setState] = useState<{ data: T | undefined; erro: boolean; key: string }>({ data: undefined, erro: false, key })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const h = () => setTick(t => t + 1)
    window.addEventListener('mt:refresh', h)
    return () => window.removeEventListener('mt:refresh', h)
  }, [])

  useEffect(() => {
    let vivo = true
    loader()
      .then(d => { if (vivo) setState({ data: d, erro: false, key }) })
      .catch(() => { if (vivo) setState(s => ({ ...s, erro: true })) })
    return () => { vivo = false }
  }, [tick, key]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ao trocar de chave (ex.: outro dia na dieta), não mostra os dados antigos
  return { data: state.key === key ? state.data : undefined, erro: state.erro }
}
