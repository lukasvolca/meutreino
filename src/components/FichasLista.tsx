'use client'

// Lista de fichas com "Importar" e "+ Nova" (usada na aba Treino e no Perfil)
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import Icon from '@/components/icons'
import { refreshData } from '@/lib/load'

export type FichaComContagem = Database['public']['Tables']['fichas']['Row'] & { exercicios: { count: number }[] }

const COR_PRESETS = ['#CCFF00', '#00E5FF', '#FF5E1F', '#FF3B5C', '#A78BFA', '#34D399']
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function FichasLista({ userId, fichas, titulo = 'Fichas de treino' }: {
  userId: string; fichas: FichaComContagem[]; titulo?: string | null
}) {
  const supabase = createClient()
  const [novaFichaOpen, setNovaFichaOpen] = useState(false)
  const [novaFichaNome, setNovaFichaNome] = useState('')
  const [novaFichaLetra, setNovaFichaLetra] = useState('')
  const [novaFichaCor, setNovaFichaCor] = useState(COR_PRESETS[0])
  const [savingFicha, setSavingFicha] = useState(false)

  function openNovaFicha() {
    const usadas = new Set(fichas.map(f => f.letra))
    const proxima = LETRAS.split('').find(l => !usadas.has(l)) ?? 'A'
    setNovaFichaLetra(proxima)
    setNovaFichaNome('')
    setNovaFichaCor(COR_PRESETS[fichas.length % COR_PRESETS.length])
    setNovaFichaOpen(true)
  }

  async function salvarNovaFicha() {
    if (!novaFichaNome.trim() || !novaFichaLetra) return
    setSavingFicha(true)
    await supabase.from('fichas').insert({
      user_id: userId,
      nome: novaFichaNome.trim(),
      letra: novaFichaLetra.toUpperCase(),
      cor: novaFichaCor,
      ordem: fichas.length,
    })
    setSavingFicha(false)
    setNovaFichaOpen(false)
    refreshData()
  }

  return (
    <>
      {/* Fichas */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{titulo}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link href="/importar/"
              style={{ height: 32, padding: '0 12px', borderRadius: 16, fontSize: 13, fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <Icon name="scan" size={14}/> Importar
            </Link>
            <button onClick={openNovaFicha}
              style={{ height: 32, padding: '0 12px', borderRadius: 16, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(204,255,0,0.1)', color: 'var(--accent)', border: 0 }}>
              + Nova
            </button>
          </div>
        </div>
        {fichas.length === 0 ? (
          <Link href="/importar/"
            style={{
              width: '100%', padding: 20, borderRadius: 18, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
              background: 'var(--surface-1)', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--muted)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
            <Icon name="scan" size={22} color="var(--accent)"/>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Tem a ficha do seu personal?</span>
            <span style={{ fontSize: 13 }}>Mande uma foto ou PDF e o app monta os treinos.</span>
          </Link>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fichas.map(f => (
              <Link key={f.id} href={`/treino/?id=${f.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16,
                  background: 'var(--surface-1)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit',
                }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${f.cor ?? '#CCFF00'}20`, color: f.cor ?? '#CCFF00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                }}>{f.letra}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    {f.exercicios?.[0]?.count ?? 0} exercícios
                  </div>
                </div>
                <Icon name="chevronRight" size={16} color="var(--muted-3)"/>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Nova Ficha modal */}
      {novaFichaOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ borderRadius: '24px 24px 0 0', padding: '20px 16px 40px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Nova ficha</h2>
              <button onClick={() => setNovaFichaOpen(false)} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 0, cursor: 'pointer' }}>Cancelar</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Nome</label>
              <input autoFocus type="text" placeholder="ex: Push · Peito · Ombro · Tríceps"
                value={novaFichaNome} onChange={e => setNovaFichaNome(e.target.value)}
                style={{ width: '100%', height: 44, borderRadius: 14, padding: '0 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Letra</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LETRAS.slice(0, 8).split('').map(l => (
                  <button key={l} onClick={() => setNovaFichaLetra(l)}
                    style={{
                      width: 40, height: 40, borderRadius: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      background: novaFichaLetra === l ? `${novaFichaCor}25` : 'var(--surface-2)',
                      border: `1px solid ${novaFichaLetra === l ? novaFichaCor : 'var(--border)'}`,
                      color: novaFichaLetra === l ? novaFichaCor : 'var(--muted)',
                    }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Cor</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {COR_PRESETS.map(cor => (
                  <button key={cor} onClick={() => setNovaFichaCor(cor)} style={{
                    width: 36, height: 36, borderRadius: '50%', background: cor, cursor: 'pointer',
                    outline: novaFichaCor === cor ? `3px solid ${cor}` : 'none', outlineOffset: 2,
                    opacity: novaFichaCor === cor ? 1 : 0.45, border: 0,
                  }}/>
                ))}
              </div>
            </div>
            <button onClick={salvarNovaFicha} disabled={savingFicha || !novaFichaNome.trim()}
              style={{ width: '100%', height: 48, borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, opacity: (savingFicha || !novaFichaNome.trim()) ? 0.4 : 1 }}>
              {savingFicha ? 'Criando…' : 'Criar ficha'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
