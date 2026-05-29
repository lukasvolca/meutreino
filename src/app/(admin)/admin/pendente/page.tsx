import Link from 'next/link'

export default function PendentePage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: 'rgba(255,181,71,0.1)',
          border: '1px solid rgba(255,181,71,0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          fontSize: 28,
        }}>
          ⏳
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', marginBottom: 12 }}>
          Aguardando aprovação
        </div>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>
          Seu cadastro foi recebido. O administrador irá analisar sua solicitação em breve.
          Você receberá acesso ao painel assim que aprovado.
        </p>
        <Link href="/admin/login" style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 10,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          color: 'var(--muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          Voltar ao login
        </Link>
      </div>
    </div>
  )
}
