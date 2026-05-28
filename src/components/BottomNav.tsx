'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard', label: 'Hoje',      icon: HomeIcon },
  { href: '/progresso', label: 'Progresso', icon: ChartIcon },
  { href: '/dieta',     label: 'Dieta',     icon: AppleIcon },
  { href: '/corpo',     label: 'Corpo',     icon: BodyIcon },
  { href: '/historico', label: 'Histórico', icon: HistIcon },
]

export default function BottomNav() {
  const path = usePathname()
  const active = TABS.find(t => path.startsWith(t.href))?.href ?? '/dashboard'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{ background: 'var(--bg-app)', borderTop: '1px solid var(--border)' }}>
      <div className="flex h-14">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = active === href
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-60">
              <Icon active={isActive} />
              <span className="text-[10px] font-semibold font-mono tracking-wide"
                style={{ color: isActive ? 'var(--accent)' : 'var(--muted-2)' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity="0.15"/>
      <path d="M9 21V12h6v9" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function ChartIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h16M4 20V14m0-6v6m4 6V10m0-2v2m4 10V6m0-2v2m4 10V12m0-4v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function AppleIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 6C12 6 10 3 7 4c0 3 2 5 5 5s5-2 5-5c-3-1-5 2-5 2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M5 12c0-2.8 3-5 7-5s7 2.2 7 5c0 4-2.5 8-7 8S5 16 5 12z" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity="0.15"/>
    </svg>
  )
}

function BodyIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity="0.3"/>
      <path d="M6 9h12M8 9l-2 5h3l1 6m6-11l2 5h-3l-1 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function HistIcon({ active }: { active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--muted-2)'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8" fill={active ? c : 'none'} fillOpacity="0.1"/>
      <path d="M3 9h18M8 4V3M16 4V3M7 13h4M7 16.5h6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
