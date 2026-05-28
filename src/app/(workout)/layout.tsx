import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WorkoutLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{
      position: 'relative',
      margin: '0 auto',
      maxWidth: 430,
      height: '100dvh',
      overflow: 'hidden',
      background: 'var(--bg-app)',
    }}>
      {children}
    </div>
  )
}
