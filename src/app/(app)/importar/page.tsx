'use client'

// Importar ficha: o aluno manda foto, print ou PDF da ficha do personal, a API lê
// (api/importar.php) e ele confere tudo antes de salvar.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/session'
import { useLoad, refreshData } from '@/lib/load'
import { btn } from '../dieta/ui'
import Revisao from './Revisao'
import { paraRevisao, type FichaRev, type Leitura } from './tipos'

type Arquivo = { id: string; file: File; preview: string | null }
type Etapa = 'escolher' | 'lendo' | 'revisar'

const MAX_ARQUIVOS = 6
const MAX_LADO = 2000   // px: legível para tabelas e leve para enviar

/** Reduz fotos grandes para JPEG; PDFs passam como estão. */
async function prepararArquivo(f: File): Promise<File> {
  if (f.type === 'application/pdf') return f
  try {
    const bmp = await createImageBitmap(f)
    const escala = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height))
    if (escala === 1 && f.size < 1.5 * 1024 * 1024 && /jpe?g|png|webp/.test(f.type)) return f
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * escala)
    c.height = Math.round(bmp.height * escala)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.86))
    if (!blob) return f
    return new File([blob], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return f   // formato que o navegador não abre (ex.: HEIC): o servidor avisa se não aceitar
  }
}

const MENSAGENS = [
  'Enviando a ficha',
  'Lendo a tabela',
  'Separando os treinos',
  'Conferindo séries e repetições',
  'Desfazendo as abreviações',
  'Quase pronto',
]

export default function ImportarPage() {
  const user = useUser()
  const router = useRouter()
  const { data } = useLoad(async () => {
    const { data: fichas } = await createClient().from('fichas').select('id').eq('user_id', user.id)
    return { fichasAtuais: fichas?.length ?? 0 }
  })
  const fichasAtuais = data?.fichasAtuais ?? 0

  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [leitura, setLeitura] = useState<Leitura | null>(null)
  const [fichas, setFichas] = useState<FichaRev[]>([])
  const [salvando, setSalvando] = useState(false)
  const [segundos, setSegundos] = useState(0)

  // Libera as prévias ao sair
  const arquivosRef = useRef(arquivos)
  useEffect(() => { arquivosRef.current = arquivos }, [arquivos])
  useEffect(() => () => arquivosRef.current.forEach(a => a.preview && URL.revokeObjectURL(a.preview)), [])

  useEffect(() => {
    if (etapa !== 'lendo') return
    const t = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [etapa])

  function adicionar(lista: FileList | null) {
    if (!lista) return
    setErro(null)
    const novos: Arquivo[] = []
    for (const f of Array.from(lista)) {
      if (!f.type.startsWith('image/') && f.type !== 'application/pdf') { setErro('Use foto, print ou PDF.'); continue }
      novos.push({ id: crypto.randomUUID(), file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null })
    }
    setArquivos(a => {
      const todos = [...a, ...novos]
      if (todos.length > MAX_ARQUIVOS) setErro(`No máximo ${MAX_ARQUIVOS} arquivos por vez.`)
      return todos.slice(0, MAX_ARQUIVOS)
    })
  }

  function remover(id: string) {
    setArquivos(a => {
      const r = a.find(x => x.id === id)
      if (r?.preview) URL.revokeObjectURL(r.preview)
      return a.filter(x => x.id !== id)
    })
  }

  async function ler() {
    if (!arquivos.length) return
    setErro(null)
    setSegundos(0)
    setEtapa('lendo')
    try {
      const fd = new FormData()
      for (const a of arquivos) {
        const f = await prepararArquivo(a.file)
        fd.append('arquivos[]', f, f.name)
      }
      const res = await fetch('/api/importar', {
        method: 'POST', body: fd, credentials: 'same-origin', headers: { 'X-MT': '1' },
        signal: AbortSignal.timeout(290_000),
      })
      const json = await res.json().catch(() => null)
      if (res.status === 401) { window.dispatchEvent(new Event('mt:unauthorized')); return }
      if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? (res.status === 413 ? 'Arquivos grandes demais. Envie menos páginas.' : `Erro ${res.status}`))
      const l = json.data as Leitura
      if (!l.legivel || !l.fichas?.length) throw new Error(l.avisos?.[0] ?? 'Não encontramos uma ficha de treino nesses arquivos. Tente uma foto mais nítida.')
      setLeitura(l)
      setFichas(paraRevisao(l))
      setEtapa('revisar')
    } catch (e) {
      const abort = e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')
      setErro(abort ? 'A leitura demorou demais. Tente com menos páginas.' : e instanceof TypeError ? 'Sem conexão. Tente de novo.' : (e as Error).message)
      setEtapa('escolher')
    }
  }

  async function salvar(modo: 'adicionar' | 'substituir') {
    if (!leitura) return
    setSalvando(true)
    setErro(null)
    const corpo = {
      importacao_id: leitura.importacao_id,
      modo,
      fichas: fichas.map(f => ({
        letra: f.letra, nome: f.nome, cor: f.cor,
        exercicios: f.exercicios.filter(e => e.nome.trim()).map(e => ({
          nome: e.nome, grupo: e.grupo, tipo: e.tipo, is_biset: e.is_biset, series: e.series, reps: e.reps,
          ultima_ate_falha: e.ultima_ate_falha, duracao_seg: e.duracao_seg, duracao_min: e.duracao_min,
          descanso_seg: e.descanso_seg, carga: e.carga, carga_b: e.carga_b, observacao: e.observacao,
        })),
      })),
    }
    try {
      const res = await fetch('/api/importar/salvar', {
        method: 'POST', body: JSON.stringify(corpo), credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-MT': '1' }, signal: AbortSignal.timeout(30_000),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? `Erro ${res.status}`)
      refreshData()
      router.push('/perfil/')
    } catch (e) {
      setErro(e instanceof TypeError || (e instanceof DOMException) ? 'Sem conexão. Suas edições continuam aqui; tente de novo.' : (e as Error).message)
      setSalvando(false)
    }
  }

  // ── Revisão ────────────────────────────────────────────────────────────────
  if (etapa === 'revisar' && leitura) {
    return (
      <Revisao
        leitura={leitura} fichas={fichas} setFichas={setFichas} fichasAtuais={fichasAtuais}
        salvando={salvando} erro={erro} onSalvar={salvar}
        onRecomecar={() => { setEtapa('escolher'); setLeitura(null); setFichas([]) }}
      />
    )
  }

  // ── Lendo ──────────────────────────────────────────────────────────────────
  if (etapa === 'lendo') {
    const msg = MENSAGENS[Math.min(MENSAGENS.length - 1, Math.floor(segundos / 8))]
    return (
      <div style={{ minHeight: 'calc(100dvh - 200px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center', gap: 22 }}>
        <div style={{ position: 'relative', width: 96, height: 96 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(204,255,0,0.12)', borderTopColor: 'var(--accent)', animation: 'spin 1.1s linear infinite' }}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="scan" size={34}/>
          </div>
        </div>
        <div>
          <div key={msg} className="animate-fade-in" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>{msg}…</div>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--muted-2)', lineHeight: 1.5 }}>
            Costuma levar menos de um minuto. Pode deixar o celular parado aqui.
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-3)' }}>{segundos}s</div>
      </div>
    )
  }

  // ── Escolher arquivos ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 20px 28px' }}>
      <Link href="/perfil/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: 14, textDecoration: 'none', marginBottom: 14 }}>
        <Icon name="chevronLeft" size={16}/> Perfil
      </Link>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        Importar ficha
      </h1>
      <p style={{ marginTop: 8, fontSize: 15, color: 'var(--muted)', lineHeight: 1.5 }}>
        Mande a ficha do seu personal em foto, print ou PDF. O app lê e monta os treinos, e você confere tudo antes de salvar.
      </p>

      <input id="imp-cam" type="file" accept="image/*" capture="environment" hidden
        onChange={e => { adicionar(e.target.files); e.target.value = '' }}/>
      <input id="imp-arq" type="file" accept="image/*,application/pdf" multiple hidden
        onChange={e => { adicionar(e.target.files); e.target.value = '' }}/>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
        {[
          { icon: 'camera', titulo: 'Tirar foto', sub: 'da ficha impressa', input: 'imp-cam' },
          { icon: 'file', titulo: 'Escolher arquivo', sub: 'PDF ou print', input: 'imp-arq' },
        ].map(o => (
          <label key={o.titulo} htmlFor={o.input} aria-disabled={arquivos.length >= MAX_ARQUIVOS} className="tappable" style={{
            padding: '18px 14px', borderRadius: 18, textAlign: 'left', cursor: 'pointer',
            background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text)',
            display: 'flex', flexDirection: 'column', gap: 10, opacity: arquivos.length >= MAX_ARQUIVOS ? 0.4 : 1,
            pointerEvents: arquivos.length >= MAX_ARQUIVOS ? 'none' : undefined,
          }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(204,255,0,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={o.icon} size={20}/>
            </span>
            <span>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{o.titulo}</span>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--muted-2)', marginTop: 2 }}>{o.sub}</span>
            </span>
          </label>
        ))}
      </div>

      {arquivos.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            {arquivos.length} {arquivos.length === 1 ? 'arquivo' : 'arquivos'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {arquivos.map(a => (
              <div key={a.id} className="animate-scale-in" style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 14, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                {a.preview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={a.preview} alt={a.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, color: 'var(--muted)' }}>
                      <Icon name="file" size={26}/>
                      <span style={{ fontSize: 11, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3 }}>{a.file.name}</span>
                    </div>}
                <button onClick={() => remover(a.id)} aria-label={`Remover ${a.file.name}`} style={{
                  position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: 16, border: 0, cursor: 'pointer',
                  background: 'rgba(0,0,0,0.65)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon name="x" size={15}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          <Icon name="info" size={14}/> Para ler melhor
        </div>
        Enquadre a ficha inteira, com boa luz e sem cortar colunas. Se ela tiver mais de uma página ou parte, mande todas juntas (até {MAX_ARQUIVOS}).
      </div>

      {erro && (
        <div role="alert" style={{ marginTop: 14, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,79,94,0.12)', color: 'var(--danger)', fontSize: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="alert" size={16} style={{ flexShrink: 0, marginTop: 2 }}/> {erro}
        </div>
      )}

      <button onClick={ler} disabled={!arquivos.length} style={{ ...btn('primary'), width: '100%', marginTop: 18, opacity: arquivos.length ? 1 : 0.4 }}>
        <Icon name="sparkles" size={18}/> Ler ficha
      </button>
    </div>
  )
}
