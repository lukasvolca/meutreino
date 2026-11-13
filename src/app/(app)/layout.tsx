'use client'

import BottomNav from '@/components/BottomNav'
import { AuthGate } from '@/lib/session'

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
        <AuthGate>{children}</AuthGate>
      </div>
      <BottomNav />
    </div>
  )
}
