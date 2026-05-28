// screen-notificacoes.jsx — Tela de Notificações

const NOTIF_META = {
  personal:  { icon: 'dumbbell', color: '#CCFF00', tag: 'PERSONAL' },
  nutri:     { icon: 'body',     color: '#6dffb0', tag: 'NUTRI' },
  pr:        { icon: 'trophy',   color: '#ffb547', tag: 'PR' },
  streak:    { icon: 'flame',    color: '#ff5e1f', tag: 'STREAK' },
  medida:    { icon: 'target',   color: '#00E5FF', tag: 'MEDIDAS' },
  sistema:   { icon: 'info',     color: 'var(--muted)', tag: 'SISTEMA' },
};

function ScreenNotificacoes({ accent, onBack }) {
  const acc = accent || 'var(--accent)';
  const [items, setItems] = React.useState(() => [...NOTIFICACOES]);
  const unread = items.filter(n => !n.lido).length;

  const markAllRead = () => setItems(items.map(n => ({ ...n, lido: true })));
  const toggleRead = (id) => setItems(items.map(n => n.id === id ? { ...n, lido: !n.lido } : n));

  return (
    <ScreenWrap hideNav>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px 8px',
      }}>
        <button onClick={onBack} className="tappable" style={{
          width: 40, height: 40, borderRadius: 20,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
          color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="chevronLeft" size={18}/>
        </button>
        <MonoLabel color="var(--muted)" size={11}>NOTIFICAÇÕES</MonoLabel>
        <div style={{ width: 40 }}/>
      </div>

      {/* Header */}
      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1 }}>
              Caixa de entrada
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted)' }}>
              {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}
            </div>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="tappable" style={{
              height: 32, padding: '0 12px',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 16, color: acc,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            }}>Marcar lidas</button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 && (
          <div style={{
            padding: '40px 20px', textAlign: 'center',
            color: 'var(--muted-2)', fontSize: 13,
          }}>Sem notificações.</div>
        )}
        {items.map(n => {
          const meta = NOTIF_META[n.tipo] || NOTIF_META.sistema;
          return (
            <div key={n.id} className="tappable" onClick={() => toggleRead(n.id)}
                 style={{
                   position: 'relative',
                   background: n.lido ? 'var(--surface-1)' : 'rgba(20,22,28,0.95)',
                   border: `1px solid ${n.lido ? 'var(--border)' : 'rgba(255,255,255,0.16)'}`,
                   borderRadius: 16,
                   padding: '14px 14px 14px 16px',
                   display: 'flex', gap: 12,
                   overflow: 'hidden',
                 }}>
              {!n.lido && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: 3, background: meta.color,
                  boxShadow: `0 0 8px ${meta.color}`,
                }}/>
              )}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${meta.color}18`,
                border: `1px solid ${meta.color}40`,
                color: meta.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={meta.icon} size={18} strokeWidth={1.9}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.1em', color: meta.color, textTransform: 'uppercase',
                  }}>{meta.tag}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-3)' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>{n.quando}</span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                  letterSpacing: '-0.01em', lineHeight: 1.25,
                  color: n.lido ? 'var(--muted)' : 'var(--text)',
                }}>{n.titulo}</div>
                <div style={{
                  marginTop: 4, fontSize: 12.5, color: 'var(--muted)',
                  lineHeight: 1.5,
                }}>{n.msg}</div>
              </div>
              {!n.lido && (
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: meta.color, marginTop: 6, flexShrink: 0,
                  boxShadow: `0 0 6px ${meta.color}`,
                }}/>
              )}
            </div>
          );
        })}
      </div>
    </ScreenWrap>
  );
}

Object.assign(window, { ScreenNotificacoes });
