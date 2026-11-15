'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/icons'

const NAV_H = 86

const TABS: { href: string; label: string; icon: string; tambem?: string[] }[] = [
  { href: '/dashboard', label: 'Hoje', icon: 'home' },
  { href: '/fichas', label: 'Treino', icon: 'dumbbell', tambem: ['/treino', '/importar'] },
  { href: '/progresso', label: 'Progresso', icon: 'chart' },
  { href: '/dieta', label: 'Dieta', icon: 'apple' },
  { href: '/corpo', label: 'Corpo', icon: 'body' },
  { href: '/historico', label: 'Histórico', icon: 'history' },
]

export default function BottomNav() {
  const path = usePathname()
  // Telas fora das abas (ex.: Perfil) não acendem nenhuma
  const active = TABS.find(t => [t.href, ...(t.tambem ?? [])].some(h => path.startsWith(h)))?.href

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: NAV_H,
      zIndex: 50,
      background: 'rgba(10,11,13,0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      paddingTop: 12,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 4px 24px',
        pointerEvents: 'auto',
      }}>
        {TABS.map(({ href, label, icon }) => {
          const isActive = active === href
          return (
            <Link key={href} href={href} style={{
              flex: 1,
              height: 50,
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: isActive ? 'var(--accent)' : 'var(--muted-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: 600,
              position: 'relative',
              textDecoration: 'none',
              justifyContent: 'center',
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  width: 28,
                  height: 3,
                  borderRadius: 2,
                  background: 'var(--accent)',
                  boxShadow: '0 0 12px var(--accent)',
                }} />
              )}
              <Icon name={icon} size={22} color={isActive ? 'var(--accent)' : 'var(--muted-2)'} strokeWidth={isActive ? 2.2 : 1.8}/>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

