import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
      {/* Scrollable content area */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        overscrollBehavior: 'none',
        scrollbarWidth: 'none',
        paddingTop: 56,
        paddingBottom: 86,
      }}>
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
