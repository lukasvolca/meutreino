// ui.jsx — shared UI primitives & layout

const FRAME_W = 402;
const FRAME_H = 874;
const NAV_H = 86;
const TOP_PAD = 56; // status bar + dynamic island clearance

// ----- Logo mark
function LogoMark({ size = 24, accent }) {
  const c = accent || 'var(--accent)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M3 6h3l3 6 3-12 3 18 3-12 3 6h2" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ----- Pill (chip)
function Pill({ children, color, dark, style, onClick, mono }) {
  return (
    <span onClick={onClick} className={onClick ? 'tappable' : ''} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      background: color || 'rgba(255,255,255,0.06)',
      color: dark ? 'var(--accent-ink)' : 'var(--text)',
      fontSize: 11, fontWeight: 600,
      letterSpacing: mono ? '0.06em' : 0,
      fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      textTransform: mono ? 'uppercase' : 'none',
      border: dark ? '0' : '1px solid var(--border)',
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</span>
  );
}

// ----- Surface card
function Card({ children, style, onClick, padding = 16, accent }) {
  return (
    <div onClick={onClick} className={onClick ? 'tappable' : ''} style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding,
      position: 'relative',
      overflow: 'hidden',
      ...(accent ? { boxShadow: '0 0 0 1px rgba(var(--accent-glow), 0.25), 0 8px 24px rgba(var(--accent-glow), 0.08)' } : {}),
      ...style,
    }}>{children}</div>
  );
}

// ----- Section header (in-screen)
function SectionTitle({ children, action, mono }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '8px 20px 12px',
    }}>
      <h3 style={{
        margin: 0,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
        fontWeight: mono ? 500 : 600,
        fontSize: mono ? 12 : 17,
        letterSpacing: mono ? '0.12em' : '-0.01em',
        textTransform: mono ? 'uppercase' : 'none',
        color: mono ? 'var(--muted-2)' : 'var(--text)',
      }}>{children}</h3>
      {action && (
        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{action}</div>
      )}
    </div>
  );
}

// ----- Mono label
function MonoLabel({ children, color, size = 10 }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: size,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: color || 'var(--muted-2)',
      fontWeight: 500,
    }}>{children}</span>
  );
}

// ----- Big metric number
function MetricNumber({ value, unit, color, size = 48, decimals }) {
  let display = value;
  if (typeof value === 'number' && decimals != null) display = value.toFixed(decimals);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        color: color || 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}>{display}</span>
      {unit && <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: Math.max(11, size * 0.22),
        color: 'var(--muted-2)',
        fontWeight: 500,
      }}>{unit}</span>}
    </div>
  );
}

// ----- Button (primary / secondary / ghost)
function Button({ children, variant = 'primary', icon, size = 'md', onClick, style, disabled, fullWidth }) {
  const sizes = {
    sm: { h: 32, fs: 12, px: 12, gap: 6, ic: 14 },
    md: { h: 44, fs: 14, px: 18, gap: 8, ic: 16 },
    lg: { h: 56, fs: 15, px: 24, gap: 10, ic: 18 },
  };
  const sz = sizes[size];
  const variants = {
    primary: { bg: 'var(--accent)', fg: 'var(--accent-ink)', bd: 'none' },
    secondary: { bg: 'var(--surface-2)', fg: 'var(--text)', bd: '1px solid var(--border)' },
    ghost: { bg: 'transparent', fg: 'var(--text)', bd: '1px solid var(--border)' },
    danger: { bg: 'rgba(255,79,94,0.12)', fg: 'var(--danger)', bd: '1px solid rgba(255,79,94,0.3)' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled} className="tappable" style={{
      height: sz.h,
      padding: `0 ${sz.px}px`,
      background: v.bg, color: v.fg, border: v.bd,
      borderRadius: sz.h / 2,
      fontFamily: 'var(--font-body)',
      fontSize: sz.fs,
      fontWeight: 600,
      letterSpacing: '-0.005em',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: sz.gap,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style,
    }}>
      {icon && <Icon name={icon} size={sz.ic} color="currentColor"/>}
      {children}
    </button>
  );
}

// ----- Status bar + Dynamic island (light/dark aware)
function StatusBar({ time = '9:41' }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 54, padding: '20px 30px 0', zIndex: 30,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      <span style={{
        fontFamily: '-apple-system, "SF Pro", system-ui',
        fontWeight: 600, fontSize: 16, color: 'var(--text)',
      }}>{time}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: 0.85 }}>
        <svg width="18" height="11" viewBox="0 0 18 11">
          <rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor"/>
          <rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="currentColor"/>
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill="currentColor"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.6" fill="currentColor"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor"/>
          <path d="M23 4v4c0.7-0.3 1.2-1 1.2-2s-0.5-1.7-1.2-2z" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

// ----- Phone shell (handles dark frame, dynamic island, home indicator)
function PhoneShell({ children, dark }) {
  return (
    <div style={{
      width: FRAME_W, height: FRAME_H, borderRadius: 52,
      background: dark ? 'var(--bg-app)' : '#F2F2F7',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 50px 100px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.04), 0 0 0 11px #0b0b0e, 0 0 0 12px rgba(255,255,255,0.08)',
      color: 'var(--text)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
      }}/>
      <StatusBar/>
      <div style={{ position: 'absolute', inset: 0, paddingTop: 0 }}>
        {children}
      </div>
      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 60,
      }}>
        <div style={{
          width: 134, height: 5, borderRadius: 100,
          background: 'rgba(255,255,255,0.85)',
        }}/>
      </div>
    </div>
  );
}

// ----- Bottom nav
function BottomNav({ active, onChange, accent }) {
  const items = [
    { id: 'hoje', label: 'Hoje', icon: 'home' },
    { id: 'progresso', label: 'Progresso', icon: 'chart' },
    { id: 'dieta', label: 'Dieta', icon: 'apple' },
    { id: 'corpo', label: 'Corpo', icon: 'body' },
    { id: 'historico', label: 'Histórico', icon: 'history' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: NAV_H, zIndex: 40,
      background: 'linear-gradient(to top, rgba(10,11,13,0.98) 60%, rgba(10,11,13,0))',
      paddingTop: 12,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '0 8px 24px', pointerEvents: 'auto',
      }}>
        {items.map(it => {
          const on = active === it.id;
          return (
            <button key={it.id} className="tappable" onClick={() => onChange(it.id)} style={{
              flex: 1, height: 50, background: 'transparent', border: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: on ? (accent || 'var(--accent)') : 'var(--muted-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              fontWeight: 600,
              position: 'relative',
            }}>
              {on && <div style={{
                position: 'absolute', top: -12, width: 28, height: 3, borderRadius: 2,
                background: accent || 'var(--accent)',
                boxShadow: `0 0 12px ${accent || 'var(--accent)'}`,
              }}/>}
              <Icon name={it.icon} size={22} color="currentColor"/>
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ----- Avatar
function Avatar({ initials, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2a2d36, #14161c)',
      border: '1px solid var(--border-strong)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.4,
      color: 'var(--text)',
      letterSpacing: '-0.02em',
    }}>{initials}</div>
  );
}

// ----- Streak chip
function StreakChip({ days }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px',
      background: 'linear-gradient(135deg, rgba(255,94,31,0.18), rgba(255,181,71,0.08))',
      border: '1px solid rgba(255,94,31,0.32)',
      borderRadius: 999,
      fontFamily: 'var(--font-mono)',
      fontSize: 11, fontWeight: 600,
      color: '#ffb547',
      letterSpacing: '0.04em',
    }}>
      <Icon name="flame" size={13} color="currentColor" strokeWidth={2}/>
      {days}d streak
    </div>
  );
}

// ----- Screen wrapper: scrollable content area within phone, with safe paddings
function ScreenWrap({ children, hideNav, accent }) {
  return (
    <div className="app-scroll" style={{
      position: 'absolute', inset: 0,
      overflow: 'auto',
      paddingTop: TOP_PAD,
      paddingBottom: hideNav ? 40 : NAV_H,
    }}>
      {children}
    </div>
  );
}

Object.assign(window, {
  FRAME_W, FRAME_H, NAV_H, TOP_PAD,
  LogoMark, Pill, Card, SectionTitle, MonoLabel, MetricNumber, Button,
  PhoneShell, BottomNav, Avatar, StreakChip, ScreenWrap,
});
