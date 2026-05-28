import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifica se o onboarding foi feito (perfil tem objetivo)
  const { data: profile } = await supabase
    .from('profiles')
    .select('objetivo')
    .eq('id', user.id)
    .single()

  // Se perfil não tem objetivo, onboarding incompleto
  if (!profile?.objetivo) redirect('/onboarding')

  return (
    <div className="h-full flex flex-col bg-app">
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: '4rem' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
