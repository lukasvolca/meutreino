'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  myProfile: { id: string; nome: string; role: string }
  pendingTrainers: { id: string; nome: string; role: string }[]
  allTrainers: { id: string; nome: string; role: string }[]
  students: { id: string; nome: string; objetivo: string | null; status: string; linkId?: string; trainerId?: string }[]
}

const OBJETIVOS: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  forca: 'Força',
  condicionamento: 'Condicionamento',
}

export default function AdminDashboard({ myProfile, pendingTrainers, allTrainers, students }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = myProfile.role === 'admin'

  const [linkEmail, setLinkEmail] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  async function approveTrainer(trainerId: string) {
    setActionLoading(trainerId)
    await supabase.from('profiles').update({ role: 'trainer' }).eq('id', trainerId)
    setActionLoading(null)
    router.refresh()
  }

  async function rejectTrainer(trainerId: string) {
    setActionLoading(trainerId)
    await supabase.from('profiles').update({ role: 'user' }).eq('id', trainerId)
    setActionLoading(null)
    router.refresh()
  }

  async function approveLink(linkId: string) {
    setActionLoading(linkId)
    await supabase.from('trainer_student_links').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', linkId)
    setActionLoading(null)
    router.refresh()
  }

  async function rejectLink(linkId: string) {
    setActionLoading(linkId)
    await supabase.from('trainer_student_links').update({ status: 'rejected' }).eq('id', linkId)
    setActionLoading(null)
    router.refresh()
  }

  async function requestStudentAccess() {
    if (!linkEmail.trim()) return
    setLinkLoading(true)
    setLinkError('')
    setLinkSuccess('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (supabase as any).rpc('get_profile_by_email', { email_input: linkEmail.trim() })
    const found = Array.isArray(profiles) ? profiles[0] : profiles

    if (!found) {
      setLinkError('Nenhum usuário encontrado com esse e-mail.')
      setLinkLoading(false)
      return
    }

    const { error } = await supabase.from('trainer_student_links').insert({
      trainer_id: myProfile.id,
      student_id: found.id,
    })

    if (error) {
      setLinkError(error.code === '23505' ? 'Já existe uma solicitação para esse aluno.' : error.message)
    } else {
      setLinkSuccess(`Solicitação enviada para ${found.nome}. Aguarde aprovação.`)
      setLinkEmail('')
    }
    setLinkLoading(false)
  }

  const approvedStudents = students.filter(s => s.status === 'approved')
  const pendingLinks = students.filter(s => s.status === 'pending' || s.status === 'pending_link')

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--surface-1)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        position: 'sticky', top: 0, height: '100dvh',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.14em', marginTop: 2 }}>
            {isAdmin ? 'ADMINISTRADOR' : 'PERSONAL TRAINER'}
          </div>
        </div>

        <div style={{ padding: '16px 12px', flex: 1 }}>
          <NavItem href="/admin" label="Dashboard" icon="⊞" active />
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {myProfile.nome}
          </div>
          <button onClick={logout} style={{
            fontSize: 11, color: 'var(--danger)', background: 'none', border: 0,
            cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
          }}>
            SAIR
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', marginBottom: 28 }}>
          {isAdmin ? 'Painel do Administrador' : 'Meu Painel'}
        </h1>

        {/* Admin: pending trainer requests */}
        {isAdmin && pendingTrainers.length > 0 && (
          <Section title={`Trainers aguardando aprovação (${pendingTrainers.length})`} accent>
            {pendingTrainers.map(t => (
              <Row key={t.id}>
                <Avatar name={t.nome} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warn)', letterSpacing: '0.08em' }}>PENDENTE</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionBtn
                    label="Aprovar"
                    color="var(--ok)"
                    loading={actionLoading === t.id}
                    onClick={() => approveTrainer(t.id)}
                  />
                  <ActionBtn
                    label="Recusar"
                    color="var(--danger)"
                    loading={actionLoading === t.id}
                    onClick={() => rejectTrainer(t.id)}
                  />
                </div>
              </Row>
            ))}
          </Section>
        )}

        {/* Admin: pending student link requests */}
        {isAdmin && pendingLinks.length > 0 && (
          <Section title={`Solicitações de acesso a alunos (${pendingLinks.length})`} accent>
            {pendingLinks.map(s => (
              <Row key={s.id + s.status}>
                <Avatar name={s.nome} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                    {s.objetivo ? OBJETIVOS[s.objetivo] ?? s.objetivo : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionBtn
                    label="Aprovar"
                    color="var(--ok)"
                    loading={actionLoading === (s as { linkId?: string }).linkId}
                    onClick={() => approveLink((s as { linkId?: string }).linkId!)}
                  />
                  <ActionBtn
                    label="Recusar"
                    color="var(--danger)"
                    loading={actionLoading === (s as { linkId?: string }).linkId}
                    onClick={() => rejectLink((s as { linkId?: string }).linkId!)}
                  />
                </div>
              </Row>
            ))}
          </Section>
        )}

        {/* Admin: approved trainers */}
        {isAdmin && (
          <Section title={`Trainers ativos (${allTrainers.length})`}>
            {allTrainers.length === 0 ? (
              <Empty text="Nenhum trainer aprovado ainda." />
            ) : allTrainers.map(t => (
              <Row key={t.id}>
                <Avatar name={t.nome} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', letterSpacing: '0.08em' }}>ATIVO</div>
                </div>
              </Row>
            ))}
          </Section>
        )}

        {/* Trainer: request access to student */}
        {!isAdmin && (
          <Section title="Solicitar acesso a aluno">
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <input
                type="email"
                placeholder="E-mail do aluno"
                value={linkEmail}
                onChange={e => setLinkEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && requestStudentAccess()}
                style={{
                  flex: 1, height: 42, borderRadius: 10, padding: '0 14px',
                  background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
                  color: 'var(--text)', fontSize: 14, outline: 'none',
                }}
              />
              <button onClick={requestStudentAccess} disabled={linkLoading || !linkEmail.trim()} style={{
                height: 42, padding: '0 18px', borderRadius: 10,
                background: 'var(--accent)', color: 'var(--accent-ink)',
                fontWeight: 700, fontSize: 13, border: 0, cursor: 'pointer',
                opacity: linkLoading ? 0.5 : 1,
              }}>
                {linkLoading ? '…' : 'Solicitar'}
              </button>
            </div>
            {linkError && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{linkError}</p>}
            {linkSuccess && <p style={{ fontSize: 12, color: 'var(--ok)', margin: 0 }}>{linkSuccess}</p>}
          </Section>
        )}

        {/* Students list */}
        <Section title={`Meus alunos (${approvedStudents.length})`}>
          {approvedStudents.length === 0 ? (
            <Empty text={isAdmin ? 'Nenhum aluno vinculado ainda.' : 'Nenhum aluno aprovado ainda. Solicite acesso acima.'} />
          ) : approvedStudents.map(s => (
            <Link key={s.id} href={`/admin/alunos/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Row hoverable>
                <Avatar name={s.nome} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                    {s.objetivo ? (OBJETIVOS[s.objetivo] ?? s.objetivo).toUpperCase() : '—'}
                  </div>
                </div>
                <span style={{ fontSize: 18, color: 'var(--muted-3)' }}>›</span>
              </Row>
            </Link>
          ))}
        </Section>

        {/* Trainer: show pending link requests */}
        {!isAdmin && pendingLinks.length > 0 && (
          <Section title={`Solicitações pendentes (${pendingLinks.length})`}>
            {pendingLinks.map(s => (
              <Row key={s.id}>
                <Avatar name={s.nome} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warn)', letterSpacing: '0.08em' }}>AGUARDANDO APROVAÇÃO</div>
                </div>
              </Row>
            ))}
          </Section>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 10,
      background: active ? 'rgba(204,255,0,0.08)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--muted)',
      textDecoration: 'none', fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </Link>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
        color: accent ? 'var(--warn)' : 'var(--muted-2)',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        {title}
      </div>
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${accent ? 'rgba(255,181,71,0.2)' : 'var(--border)'}`,
        background: 'var(--surface-1)',
      }}>
        {children}
      </div>
    </div>
  )
}

function Row({ children, hoverable }: { children: React.ReactNode; hoverable?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      transition: hoverable ? 'background 120ms' : undefined,
    }}
    onMouseEnter={hoverable ? e => (e.currentTarget.style.background = 'var(--surface-2)') : undefined}
    onMouseLeave={hoverable ? e => (e.currentTarget.style.background = '') : undefined}
    >
      {children}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
    }}>
      {initials}
    </div>
  )
}

function ActionBtn({ label, color, loading, onClick }: { label: string; color: string; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      height: 32, padding: '0 14px', borderRadius: 8,
      background: `${color}15`, border: `1px solid ${color}40`,
      color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
      opacity: loading ? 0.5 : 1,
    }}>
      {loading ? '…' : label}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: '20px 18px', color: 'var(--muted-2)', fontSize: 13 }}>
      {text}
    </div>
  )
}
