'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Professional, StudentLink } from './page'

interface Props {
  myProfile: { id: string; nome: string; role: string }
  pendingProfessionals: Professional[]
  trainers: Professional[]
  nutritionists: Professional[]
  students: StudentLink[]
}

const OBJETIVOS: Record<string, string> = {
  hipertrofia: 'Hipertrofia', emagrecimento: 'Emagrecimento',
  forca: 'Força', condicionamento: 'Condicionamento',
}

const ROLE_LABEL: Record<string, string> = {
  trainer_pending: 'Personal Trainer (pendente)',
  nutritionist_pending: 'Nutricionista (pendente)',
  trainer: 'Personal Trainer',
  nutritionist: 'Nutricionista',
}

type AddModalState = { type: 'trainer' | 'nutritionist' } | null
type EditModalState = { prof: Professional } | null
type AddStudentModalState = { trainerId: string } | null

export default function AdminDashboard({ myProfile, pendingProfessionals, trainers, nutritionists, students }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = myProfile.role === 'admin'

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Add professional modal
  const [addModal, setAddModal] = useState<AddModalState>(null)
  const [addEmail, setAddEmail] = useState('')
  const [addSearchResult, setAddSearchResult] = useState<{ id: string; nome: string } | null>(null)
  const [addSearched, setAddSearched] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit professional modal
  const [editModal, setEditModal] = useState<EditModalState>(null)
  const [editNome, setEditNome] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<Professional | null>(null)

  // Student link request (trainer form)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')

  // Add student modal
  const [addStudentModal, setAddStudentModal] = useState<AddStudentModalState>(null)
  const [addStudentSearch, setAddStudentSearch] = useState('')
  const [addStudentList, setAddStudentList] = useState<{ id: string; nome: string; email: string; objetivo: string | null }[]>([])
  const [addStudentSelected, setAddStudentSelected] = useState<{ id: string; nome: string } | null>(null)
  const [addStudentLoading, setAddStudentLoading] = useState(false)
  const [addStudentSaving, setAddStudentSaving] = useState(false)
  const [addStudentError, setAddStudentError] = useState('')
  const [addStudentTrainerId, setAddStudentTrainerId] = useState('')

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // ── Approve / reject pending professional ────────────────────────────────────
  async function approveProfessional(prof: Professional) {
    setActionLoading(prof.id)
    const newRole = prof.role === 'trainer_pending' ? 'trainer' : 'nutritionist'
    await supabase.from('profiles').update({ role: newRole }).eq('id', prof.id)
    setActionLoading(null)
    router.refresh()
  }

  async function rejectProfessional(prof: Professional) {
    setActionLoading(prof.id)
    await supabase.from('profiles').update({ role: 'user' }).eq('id', prof.id)
    setActionLoading(null)
    router.refresh()
  }

  // ── Add professional by email ─────────────────────────────────────────────────
  function openAdd(type: 'trainer' | 'nutritionist') {
    setAddModal({ type })
    setAddEmail('')
    setAddSearchResult(null)
    setAddSearched(false)
    setAddError('')
  }

  async function searchUser() {
    if (!addEmail.trim()) return
    setAddLoading(true)
    setAddError('')
    setAddSearchResult(null)
    setAddSearched(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc('get_profile_by_email', { email_input: addEmail.trim() })
    const found = Array.isArray(data) ? data[0] : data
    setAddSearched(true)
    if (!found) { setAddError('Nenhum usuário encontrado com esse e-mail.'); setAddLoading(false); return }
    if (['trainer', 'nutritionist', 'admin'].includes(found.role)) {
      setAddError(`${found.nome} já é ${ROLE_LABEL[found.role] ?? found.role}.`)
      setAddLoading(false); return
    }
    setAddSearchResult({ id: found.id, nome: found.nome })
    setAddLoading(false)
  }

  async function confirmAdd() {
    if (!addSearchResult || !addModal) return
    setAddLoading(true)
    const newRole = addModal.type === 'trainer' ? 'trainer' : 'nutritionist'
    await supabase.from('profiles').update({ role: newRole }).eq('id', addSearchResult.id)
    setAddModal(null)
    setAddLoading(false)
    router.refresh()
  }

  // ── Edit professional ────────────────────────────────────────────────────────
  function openEdit(prof: Professional) {
    setEditModal({ prof })
    setEditNome(prof.nome)
  }

  async function saveEdit() {
    if (!editModal || !editNome.trim()) return
    setEditLoading(true)
    await supabase.from('profiles').update({ nome: editNome.trim() }).eq('id', editModal.prof.id)
    setEditModal(null)
    setEditLoading(false)
    router.refresh()
  }

  // ── Delete professional (revoke access) ──────────────────────────────────────
  async function deleteProfessional(prof: Professional) {
    setActionLoading(prof.id)
    await supabase.from('profiles').update({ role: 'user' }).eq('id', prof.id)
    setDeleteConfirm(null)
    setActionLoading(null)
    router.refresh()
  }

  // ── Approve / reject student link ────────────────────────────────────────────
  async function approveLink(linkId: string) {
    setActionLoading(linkId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('trainer_student_links').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', linkId)
    setActionLoading(null)
    router.refresh()
  }

  async function rejectLink(linkId: string) {
    setActionLoading(linkId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('trainer_student_links').update({ status: 'rejected' }).eq('id', linkId)
    setActionLoading(null)
    router.refresh()
  }

  // ── Trainer: request student access ──────────────────────────────────────────
  async function requestStudentAccess() {
    if (!linkEmail.trim()) return
    setLinkLoading(true)
    setLinkError('')
    setLinkSuccess('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc('get_profile_by_email', { email_input: linkEmail.trim() })
    const found = Array.isArray(data) ? data[0] : data
    if (!found) { setLinkError('Nenhum usuário encontrado com esse e-mail.'); setLinkLoading(false); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('trainer_student_links').insert({ trainer_id: myProfile.id, student_id: found.id })
    if (error) {
      setLinkError(error.code === '23505' ? 'Já existe uma solicitação para esse aluno.' : error.message)
    } else {
      setLinkSuccess(`Solicitação enviada para ${found.nome}. Aguarde aprovação.`)
      setLinkEmail('')
    }
    setLinkLoading(false)
  }

  // ── Add student modal ─────────────────────────────────────────────────────────
  async function openAddStudent(trainerId?: string) {
    const tid = trainerId ?? myProfile.id
    setAddStudentModal({ trainerId: tid })
    setAddStudentSearch('')
    setAddStudentSelected(null)
    setAddStudentError('')
    setAddStudentTrainerId(tid)
    setAddStudentLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc('get_available_students', { search_text: '' })
    const linkedIds = new Set(students.filter(s => s.status === 'approved' || s.status === 'pending_link').map(s => s.id))
    setAddStudentList(((data ?? []) as { id: string; nome: string; email: string; objetivo: string | null }[]).filter(u => !linkedIds.has(u.id)))
    setAddStudentLoading(false)
  }

  async function searchStudents(q: string) {
    setAddStudentSearch(q)
    setAddStudentLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc('get_available_students', { search_text: q })
    const linkedIds = new Set(students.filter(s => s.status === 'approved' || s.status === 'pending_link').map(s => s.id))
    setAddStudentList(((data ?? []) as { id: string; nome: string; email: string; objetivo: string | null }[]).filter(u => !linkedIds.has(u.id)))
    setAddStudentLoading(false)
  }

  async function confirmAddStudent() {
    if (!addStudentSelected) return
    setAddStudentSaving(true)
    setAddStudentError('')
    const tid = isAdmin ? addStudentTrainerId : myProfile.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('trainer_student_links').insert({
      trainer_id: tid,
      student_id: addStudentSelected.id,
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    if (error) {
      setAddStudentError(error.code === '23505' ? 'Esse aluno já está vinculado.' : error.message)
      setAddStudentSaving(false)
    } else {
      setAddStudentModal(null)
      setAddStudentSaving(false)
      router.refresh()
    }
  }

  const approvedStudents = students.filter(s => s.status === 'approved')
  const pendingLinks = students.filter(s => s.status === 'pending')
  const pendingStudentLinks = students.filter(s => s.status === 'pending_link')

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--surface-1)',
        borderRight: '1px solid var(--border)', padding: '24px 0',
        position: 'sticky', top: 0, height: '100dvh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--accent)' }}>Meu</span>Treino
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.14em', marginTop: 2 }}>
            {isAdmin ? 'ADMINISTRADOR' : ROLE_LABEL[myProfile.role]?.toUpperCase() ?? 'PROFISSIONAL'}
          </div>
        </div>
        <div style={{ padding: '16px 12px', flex: 1 }}>
          <NavItem href="/admin" label="Dashboard" icon="⊞" />
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {myProfile.nome}
          </div>
          <button onClick={logout} style={{
            fontSize: 11, color: 'var(--danger)', background: 'none', border: 0,
            cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
          }}>SAIR</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', maxWidth: 900 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', marginBottom: 32 }}>
          {isAdmin ? 'Painel Administrativo' : 'Meu Painel'}
        </h1>

        {/* Pending approvals */}
        {isAdmin && pendingProfessionals.length > 0 && (
          <Section title={`Aguardando aprovação (${pendingProfessionals.length})`} accent="warn">
            {pendingProfessionals.map(p => (
              <ProfRow key={p.id}>
                <Avatar name={p.nome} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warn)', letterSpacing: '0.08em' }}>
                    {ROLE_LABEL[p.role]}
                  </div>
                </div>
                <ActionBtn label="Aprovar" color="var(--ok)" loading={actionLoading === p.id} onClick={() => approveProfessional(p)} />
                <ActionBtn label="Recusar" color="var(--danger)" loading={actionLoading === p.id} onClick={() => rejectProfessional(p)} />
              </ProfRow>
            ))}
          </Section>
        )}

        {/* Pending student link requests */}
        {isAdmin && pendingStudentLinks.length > 0 && (
          <Section title={`Solicitações de vínculo com aluno (${pendingStudentLinks.length})`} accent="warn">
            {pendingStudentLinks.map(s => (
              <ProfRow key={s.linkId}>
                <Avatar name={s.nome} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                    {s.objetivo ? OBJETIVOS[s.objetivo] ?? s.objetivo : '—'}
                  </div>
                </div>
                <ActionBtn label="Aprovar" color="var(--ok)" loading={actionLoading === s.linkId} onClick={() => approveLink(s.linkId!)} />
                <ActionBtn label="Recusar" color="var(--danger)" loading={actionLoading === s.linkId} onClick={() => rejectLink(s.linkId!)} />
              </ProfRow>
            ))}
          </Section>
        )}

        {/* Trainers */}
        {isAdmin && (
          <Section
            title={`Personal Trainers (${trainers.length})`}
            action={{ label: '+ Adicionar trainer', onClick: () => openAdd('trainer') }}
          >
            {trainers.length === 0
              ? <EmptyRow text="Nenhum personal trainer ativo. Clique em '+ Adicionar' para promover um usuário." />
              : trainers.map(p => (
                <ProfRow key={p.id} hoverable>
                  <Avatar name={p.nome} color="#00E5FF" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', letterSpacing: '0.08em' }}>ATIVO</div>
                  </div>
                  <IconBtn title="Editar" onClick={() => openEdit(p)}>✏️</IconBtn>
                  <IconBtn title="Revogar acesso" onClick={() => setDeleteConfirm(p)}>🗑️</IconBtn>
                </ProfRow>
              ))
            }
          </Section>
        )}

        {/* Nutritionists */}
        {isAdmin && (
          <Section
            title={`Nutricionistas (${nutritionists.length})`}
            action={{ label: '+ Adicionar nutricionista', onClick: () => openAdd('nutritionist') }}
          >
            {nutritionists.length === 0
              ? <EmptyRow text="Nenhum nutricionista ativo. Clique em '+ Adicionar' para promover um usuário." />
              : nutritionists.map(p => (
                <ProfRow key={p.id} hoverable>
                  <Avatar name={p.nome} color="#A78BFA" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', letterSpacing: '0.08em' }}>ATIVO</div>
                  </div>
                  <IconBtn title="Editar" onClick={() => openEdit(p)}>✏️</IconBtn>
                  <IconBtn title="Revogar acesso" onClick={() => setDeleteConfirm(p)}>🗑️</IconBtn>
                </ProfRow>
              ))
            }
          </Section>
        )}

        {/* Non-admin: request student access */}
        {!isAdmin && (
          <Section title="Solicitar vínculo com aluno">
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <input
                  type="email" placeholder="E-mail do aluno" value={linkEmail}
                  onChange={e => setLinkEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && requestStudentAccess()}
                  style={{
                    flex: 1, height: 40, borderRadius: 9, padding: '0 12px',
                    background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
                    color: 'var(--text)', fontSize: 14, outline: 'none',
                  }}
                />
                <button onClick={requestStudentAccess} disabled={linkLoading || !linkEmail.trim()} style={{
                  height: 40, padding: '0 16px', borderRadius: 9,
                  background: 'var(--accent)', color: 'var(--accent-ink)',
                  fontWeight: 700, fontSize: 13, border: 0, cursor: 'pointer',
                  opacity: linkLoading ? 0.5 : 1,
                }}>
                  {linkLoading ? '…' : 'Solicitar'}
                </button>
              </div>
              {linkError && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{linkError}</p>}
              {linkSuccess && <p style={{ fontSize: 12, color: 'var(--ok)', margin: 0 }}>{linkSuccess}</p>}
            </div>
          </Section>
        )}

        {/* Approved students */}
        <Section
          title={`Meus alunos (${approvedStudents.length})`}
          action={{ label: '+ Adicionar aluno', onClick: () => openAddStudent() }}
        >
          {approvedStudents.length === 0
            ? <EmptyRow text="Nenhum aluno vinculado ainda." />
            : approvedStudents.map(s => (
              <Link key={`${s.id}-${s.linkId}`} href={`/admin/alunos/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ProfRow hoverable>
                  <Avatar name={s.nome} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                      {s.objetivo ? (OBJETIVOS[s.objetivo] ?? s.objetivo).toUpperCase() : '—'}
                    </div>
                  </div>
                  <span style={{ color: 'var(--muted-3)', fontSize: 20 }}>›</span>
                </ProfRow>
              </Link>
            ))
          }
        </Section>

        {/* Pending student links (non-admin) */}
        {!isAdmin && pendingLinks.length > 0 && (
          <Section title={`Solicitações pendentes (${pendingLinks.length})`}>
            {pendingLinks.map(s => (
              <ProfRow key={s.id}>
                <Avatar name={s.nome} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nome}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warn)', letterSpacing: '0.08em' }}>AGUARDANDO APROVAÇÃO</div>
                </div>
              </ProfRow>
            ))}
          </Section>
        )}
      </main>

      {/* ── Add professional modal ─────────────────────────────────────────────── */}
      {addModal && (
        <Modal title={`Adicionar ${addModal.type === 'trainer' ? 'Personal Trainer' : 'Nutricionista'}`} onClose={() => setAddModal(null)}>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 18 }}>
            Digite o e-mail do usuário que já tem conta no MeuTreino e deseja se tornar {addModal.type === 'trainer' ? 'personal trainer' : 'nutricionista'}.
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              type="email" placeholder="E-mail do usuário" value={addEmail}
              onChange={e => { setAddEmail(e.target.value); setAddSearched(false); setAddSearchResult(null); setAddError('') }}
              onKeyDown={e => e.key === 'Enter' && searchUser()}
              style={{
                flex: 1, height: 42, borderRadius: 10, padding: '0 12px',
                background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
                color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            />
            <button onClick={searchUser} disabled={addLoading || !addEmail.trim()} style={{
              height: 42, padding: '0 16px', borderRadius: 10,
              background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
              color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              opacity: addLoading ? 0.5 : 1,
            }}>
              {addLoading ? '…' : 'Buscar'}
            </button>
          </div>

          {addError && <p style={{ fontSize: 12, color: 'var(--danger)', margin: '0 0 12px' }}>{addError}</p>}

          {addSearchResult && (
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 16,
              background: 'rgba(109,255,176,0.06)', border: '1px solid rgba(109,255,176,0.25)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Avatar name={addSearchResult.nome} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{addSearchResult.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--ok)' }}>Usuário encontrado</div>
              </div>
            </div>
          )}

          {addSearchResult && (
            <button onClick={confirmAdd} disabled={addLoading} style={{
              width: '100%', height: 46, borderRadius: 12, fontWeight: 700, fontSize: 14,
              background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, cursor: 'pointer',
              opacity: addLoading ? 0.5 : 1,
            }}>
              {addLoading ? 'Salvando…' : `Tornar ${addModal.type === 'trainer' ? 'Personal Trainer' : 'Nutricionista'}`}
            </button>
          )}
        </Modal>
      )}

      {/* ── Edit professional modal ───────────────────────────────────────────── */}
      {editModal && (
        <Modal title="Editar profissional" onClose={() => setEditModal(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
              Nome
            </label>
            <input
              autoFocus type="text" value={editNome}
              onChange={e => setEditNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
              style={{
                width: '100%', height: 42, borderRadius: 10, padding: '0 12px',
                background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
                color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => setEditModal(null)} style={{
              height: 44, borderRadius: 10, background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={saveEdit} disabled={editLoading || !editNome.trim()} style={{
              height: 44, borderRadius: 10, background: 'var(--accent)', color: 'var(--accent-ink)',
              fontWeight: 700, border: 0, cursor: 'pointer', opacity: (editLoading || !editNome.trim()) ? 0.5 : 1,
            }}>
              {editLoading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Add student modal ────────────────────────────────────────────────── */}
      {addStudentModal && (
        <Modal title="Adicionar aluno" onClose={() => setAddStudentModal(null)}>
          {isAdmin && trainers.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                Personal trainer
              </label>
              <select
                value={addStudentTrainerId}
                onChange={e => setAddStudentTrainerId(e.target.value)}
                style={{
                  width: '100%', height: 40, borderRadius: 10, padding: '0 12px',
                  background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
                  color: 'var(--text)', fontSize: 14, outline: 'none', cursor: 'pointer',
                }}
              >
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
          )}

          <input
            autoFocus
            type="text"
            placeholder="Buscar por nome ou e-mail…"
            value={addStudentSearch}
            onChange={e => searchStudents(e.target.value)}
            style={{
              width: '100%', height: 42, borderRadius: 10, padding: '0 12px',
              background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
              color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              marginBottom: 10,
            }}
          />

          <div style={{
            borderRadius: 12, border: '1px solid var(--border)',
            overflow: 'hidden', maxHeight: 280, overflowY: 'auto',
            marginBottom: 14,
          }}>
            {addStudentLoading ? (
              <div style={{ padding: '18px 16px', color: 'var(--muted-2)', fontSize: 13, textAlign: 'center' }}>Carregando…</div>
            ) : addStudentList.length === 0 ? (
              <div style={{ padding: '18px 16px', color: 'var(--muted-2)', fontSize: 13 }}>
                {addStudentSearch ? 'Nenhum usuário encontrado.' : 'Nenhum aluno disponível para vincular.'}
              </div>
            ) : addStudentList.map(u => {
              const isSelected = addStudentSelected?.id === u.id
              return (
                <div
                  key={u.id}
                  onClick={() => setAddStudentSelected(isSelected ? null : { id: u.id, nome: u.nome })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    background: isSelected ? 'rgba(204,255,0,0.07)' : 'transparent',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <Avatar name={u.nome} color={isSelected ? 'var(--accent)' : undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{u.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  {isSelected && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
                </div>
              )
            })}
          </div>

          {addStudentError && <p style={{ fontSize: 12, color: 'var(--danger)', margin: '0 0 12px' }}>{addStudentError}</p>}

          <button
            onClick={confirmAddStudent}
            disabled={!addStudentSelected || addStudentSaving}
            style={{
              width: '100%', height: 46, borderRadius: 12, fontWeight: 700, fontSize: 14,
              background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, cursor: 'pointer',
              opacity: (!addStudentSelected || addStudentSaving) ? 0.4 : 1,
              transition: 'opacity 120ms',
            }}
          >
            {addStudentSaving ? 'Adicionando…' : addStudentSelected ? `Adicionar ${addStudentSelected.nome}` : 'Selecione um aluno'}
          </button>
        </Modal>
      )}

      {/* ── Delete confirm modal ──────────────────────────────────────────────── */}
      {deleteConfirm && (
        <Modal title="Revogar acesso?" onClose={() => setDeleteConfirm(null)}>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
            <strong style={{ color: 'var(--text)' }}>{deleteConfirm.nome}</strong> perderá o acesso ao painel e voltará a ser um usuário comum. Essa ação pode ser desfeita adicionando-o novamente.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => setDeleteConfirm(null)} style={{
              height: 44, borderRadius: 10, background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={() => deleteProfessional(deleteConfirm)} disabled={actionLoading === deleteConfirm.id} style={{
              height: 44, borderRadius: 10,
              background: 'rgba(255,79,94,0.12)', border: '1px solid rgba(255,79,94,0.4)',
              color: 'var(--danger)', fontWeight: 700, cursor: 'pointer',
              opacity: actionLoading === deleteConfirm.id ? 0.5 : 1,
            }}>
              {actionLoading === deleteConfirm.id ? 'Removendo…' : 'Sim, revogar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
      background: 'rgba(204,255,0,0.08)', color: 'var(--accent)',
      textDecoration: 'none', fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>{label}
    </Link>
  )
}

function Section({ title, children, accent, action }: {
  title: string; children: React.ReactNode
  accent?: 'warn' | 'ok'; action?: { label: string; onClick: () => void }
}) {
  const borderColor = accent === 'warn' ? 'rgba(255,181,71,0.2)' : accent === 'ok' ? 'rgba(109,255,176,0.2)' : 'var(--border)'
  const labelColor = accent === 'warn' ? 'var(--warn)' : accent === 'ok' ? 'var(--ok)' : 'var(--muted-2)'
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: labelColor, textTransform: 'uppercase' }}>
          {title}
        </div>
        {action && (
          <button onClick={action.onClick} style={{
            height: 30, padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.2)', color: 'var(--accent)',
          }}>
            {action.label}
          </button>
        )}
      </div>
      <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${borderColor}`, background: 'var(--surface-1)' }}>
        {children}
      </div>
    </div>
  )
}

function ProfRow({ children, hoverable }: { children: React.ReactNode; hoverable?: boolean }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--border)' }}
      onMouseEnter={hoverable ? e => (e.currentTarget.style.background = 'var(--surface-2)') : undefined}
      onMouseLeave={hoverable ? e => (e.currentTarget.style.background = '') : undefined}
    >
      {children}
    </div>
  )
}

function Avatar({ name, color }: { name: string; color?: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: color ? `${color}18` : 'var(--surface-3)',
      border: `1px solid ${color ? `${color}40` : 'var(--border-strong)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
      color: color ?? 'var(--text)',
    }}>
      {initials}
    </div>
  )
}

function ActionBtn({ label, color, loading, onClick }: { label: string; color: string; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      height: 30, padding: '0 12px', borderRadius: 8,
      background: `${color}15`, border: `1px solid ${color}40`,
      color, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1,
    }}>
      {loading ? '…' : label}
    </button>
  )
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
      background: 'var(--surface-2)', cursor: 'pointer', fontSize: 13,
    }}>
      {children}
    </button>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <div style={{ padding: '18px 16px', color: 'var(--muted-2)', fontSize: 13 }}>{text}</div>
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 440,
        background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-strong)',
        padding: '24px', animation: 'scale-in 200ms ease both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
