import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

interface TrainerRow { id: string; nome: string; role: string }
interface StudentItem { id: string; nome: string; objetivo: string | null; status: string; linkId?: string; trainerId?: string }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, nome, role')
    .eq('id', user.id)
    .single()

  const role = myProfile?.role ?? 'user'
  if (role !== 'admin' && role !== 'trainer') redirect('/admin/pendente')

  let pendingTrainers: TrainerRow[] = []
  let allTrainers: TrainerRow[] = []
  let myStudents: StudentItem[] = []

  if (role === 'admin') {
    const { data: trainers } = await supabase
      .from('profiles')
      .select('id, nome, role')
      .in('role', ['trainer_pending', 'trainer'])
      .order('role')

    pendingTrainers = ((trainers ?? []) as TrainerRow[]).filter(t => t.role === 'trainer_pending')
    allTrainers = ((trainers ?? []) as TrainerRow[]).filter(t => t.role === 'trainer')

    // Pending student link requests (any trainer requesting access)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingLinks } = await (supabase as any)
      .from('trainer_student_links')
      .select('id, trainer_id, student_id, status, requested_at, profiles!trainer_student_links_student_id_fkey(nome, objetivo)')
      .eq('status', 'pending')

    if (pendingLinks) {
      myStudents = (pendingLinks as Array<{
        id: string; trainer_id: string; student_id: string
        profiles: { nome: string; objetivo: string | null } | null
      }>).map(l => ({
        id: l.student_id,
        nome: l.profiles?.nome ?? '—',
        objetivo: l.profiles?.objetivo ?? null,
        status: 'pending_link',
        linkId: l.id,
        trainerId: l.trainer_id,
      }))
    }
  } else {
    // Trainer: load their students
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: links } = await (supabase as any)
      .from('trainer_student_links')
      .select('id, student_id, status, profiles!trainer_student_links_student_id_fkey(nome, objetivo)')
      .eq('trainer_id', user.id)
      .order('requested_at')

    myStudents = ((links ?? []) as Array<{
      id: string; student_id: string; status: string
      profiles: { nome: string; objetivo: string | null } | null
    }>).map(l => ({
      id: l.student_id,
      nome: l.profiles?.nome ?? '—',
      objetivo: l.profiles?.objetivo ?? null,
      status: l.status,
    }))
  }

  return (
    <AdminDashboard
      myProfile={{ id: myProfile!.id, nome: myProfile!.nome, role }}
      pendingTrainers={pendingTrainers}
      allTrainers={allTrainers}
      students={myStudents}
    />
  )
}
