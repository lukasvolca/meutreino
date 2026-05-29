import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

export interface Professional { id: string; nome: string; role: string }
export interface StudentLink {
  id: string; nome: string; objetivo: string | null
  status: string; linkId?: string; trainerId?: string
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: myProfile } = await supabase
    .from('profiles').select('id, nome, role').eq('id', user.id).single()

  const role = myProfile?.role ?? 'user'
  if (!['admin', 'trainer', 'nutritionist'].includes(role)) redirect('/admin/pendente')

  let pendingProfessionals: Professional[] = []
  let trainers: Professional[] = []
  let nutritionists: Professional[] = []
  let myStudents: StudentLink[] = []

  if (role === 'admin') {
    const { data: allProfs } = await supabase
      .from('profiles')
      .select('id, nome, role')
      .in('role', ['trainer_pending', 'trainer', 'nutritionist_pending', 'nutritionist'])
      .order('nome')

    pendingProfessionals = ((allProfs ?? []) as Professional[]).filter(p =>
      p.role === 'trainer_pending' || p.role === 'nutritionist_pending'
    )
    trainers = ((allProfs ?? []) as Professional[]).filter(p => p.role === 'trainer')
    nutritionists = ((allProfs ?? []) as Professional[]).filter(p => p.role === 'nutritionist')

    // Pending student link requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingLinks } = await (supabase as any)
      .from('trainer_student_links')
      .select('id, trainer_id, student_id, profiles!trainer_student_links_student_id_fkey(nome, objetivo)')
      .eq('status', 'pending')

    myStudents = ((pendingLinks ?? []) as Array<{
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
  } else {
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
      pendingProfessionals={pendingProfessionals}
      trainers={trainers}
      nutritionists={nutritionists}
      students={myStudents}
    />
  )
}
