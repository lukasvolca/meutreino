'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_H = 86

const TABS = [
  { href: '/dashboard', label: 'Hoje', icon: HomeIcon },
  { href: '/progresso', label: 'Progresso', icon: ChartIcon },
  { href: '/dieta', label: 'Dieta', icon: AppleIcon },
  { href: '/corpo', label: 'Corpo', icon: BodyIcon },
  { href: '/historico', label: 'Histórico', icon: HistIcon },
]

export default function BottomNav() {
  const path = usePathname()
  const active = TABS.find(t => path.startsWith(t.href))?.href ?? '/dashboard'

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: NAV_H,
      zIndex: 50,
      background: 'linear-gradient(to top, rgba(10,11,13,0.98) 60%, rgba(10,11,13,0))',
      paddingTop: 12,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 8px 24px',
        pointerEvents: 'auto',
      }}>
        {TABS.map(({ href, label, icon: Icon }) => {
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
              letterSpacing: '0.08em',
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
              <Icon active={isActive} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  const common = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" {...common} />
    </svg>
  )
}

function ChartIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  const common = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M4 19V5M4 19h16" {...common} />
      <path d="M7 15l4-5 3 3 5-7" {...common} />
      <circle cx="7" cy="15" r="1.2" fill={c} />
      <circle cx="11" cy="10" r="1.2" fill={c} />
      <circle cx="14" cy="13" r="1.2" fill={c} />
      <circle cx="19" cy="6" r="1.2" fill={c} />
    </svg>
  )
}

function AppleIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  const common = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M12 7c-1-3 1-5 3-5 0 2-1 4-3 5z" {...common} />
      <path d="M16 8c-2-1-3 0-4 0s-2-1-4 0c-3 1-4 6-2 10 1 2 2 3 3 3s2-1 3-1 2 1 3 1 2-1 3-3c2-4 1-9-2-10z" {...common} />
    </svg>
  )
}

function BodyIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  const common = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2.4" {...common} />
      <path d="M9 9h6l1 5-2 1v6h-2v-5h-2v5H8v-6l-2-1z" {...common} />
    </svg>
  )
}

function HistIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  const common = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 3-6.7" {...common} />
      <path d="M3 4v4h4" {...common} />
      <path d="M12 8v5l3 2" {...common} />
    </svg>
  )
}
