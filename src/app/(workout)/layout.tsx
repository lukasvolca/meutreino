'use client'

import { AuthGate } from '@/lib/session'

export default function WorkoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      margin: '0 auto',
      maxWidth: 430,
      height: '100dvh',
      overflow: 'hidden',
      background: 'var(--bg-app)',
    }}>
      <AuthGate>{children}</AuthGate>
    </div>
  )
}
