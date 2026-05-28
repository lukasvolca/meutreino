// screen-historico.jsx — Histórico de treinos

function ScreenHistorico({ accent, onOpenFicha }) {
  const acc = accent || 'var(--accent)';

  // Build heatmap data: 12 weeks * 7 days = 84 cells
  const today = new Date('2026-05-21');
  const cells = Array.from({ length: 84 }, () => 0);
  HISTORICO.forEach(h => {
    const d = new Date(h.data + 'T00:00:00');
    const days = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    if (days < 84) {
      const week = Math.floor(days / 7);
      const dow = (d.getDay() + 6) % 7; // 0..6 mon..sun
      const col = 11 - week;
      const i = col * 7 + dow;
      cells[i] = 0.6 + (h.pr ? 0.4 : 0);
    }
  });

  const totalVolume = HISTORICO.reduce((a, h) => a + h.volume, 0);
  const totalSessions = HISTORICO.length;
  const totalPRs = HISTORICO.reduce((a, h) => a + h.pr, 0);
  const totalMinutes = HISTORICO.reduce((a, h) => a + h.dur, 0);

  return (
    <ScreenWrap>
      <div style={{ padding: '0 20px 4px' }}>
        <MonoLabel>{'> SEÇÃO 04'}</MonoLabel>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4 }}>
          Histórico
        </div>
        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
          {totalSessions} treinos · últimas 12 semanas
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ padding: '16px 20px 16px' }}>
        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <MonoLabel>ATIVIDADE</MonoLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>
              MENOS
              <div style={{ display: 'flex', gap: 2 }}>
                {[0.2, 0.4, 0.6, 0.85, 1].map((v, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: acc, opacity: 0.25 + v * 0.75 }}/>
                ))}
              </div>
              MAIS
            </div>
          </div>
          <Heatmap data={cells} weeks={12} color={acc}/>
        </Card>
      </div>

      {/* Aggregate stats */}
      <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <MonoLabel>VOLUME TOTAL</MonoLabel>
          <MetricNumber value={(totalVolume/1000).toFixed(1)} unit="ton" size={28}/>
          <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)' }}>kg movidos</div>
        </Card>
        <Card padding={14}>
          <MonoLabel>TEMPO TOTAL</MonoLabel>
          <MetricNumber value={Math.floor(totalMinutes/60)} unit={`h ${totalMinutes%60}m`} size={28}/>
          <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)' }}>nas barras</div>
        </Card>
        <Card padding={14}>
          <MonoLabel>SESSÕES</MonoLabel>
          <MetricNumber value={totalSessions} size={28}/>
          <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)' }}>completas</div>
        </Card>
        <Card padding={14}>
          <MonoLabel>PRS QUEBRADOS</MonoLabel>
          <MetricNumber value={totalPRs} size={28} color={acc}/>
          <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)' }}>recordes</div>
        </Card>
      </div>

      {/* Session list */}
      <SectionTitle>Sessões recentes</SectionTitle>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {HISTORICO.map(h => {
          const ficha = FICHAS.find(f => f.id === h.ficha);
          return (
            <Card key={h.data} padding={12} onClick={() => onOpenFicha(h.ficha)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--muted)',
                  flexShrink: 0,
                }}>
                  <Icon name={ficha.icone} size={22} strokeWidth={1.8}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
                      {h.data.split('-').reverse().slice(0,2).join('/')}
                    </span>
                    {h.pr > 0 && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                        padding: '1px 5px', borderRadius: 3, background: `${acc}24`, color: acc, letterSpacing: '0.08em',
                      }}>★ PR</span>
                    )}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600 }}>{ficha.nome.split('·')[0].trim()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>{(h.volume/1000).toFixed(1)}<span style={{ color: 'var(--muted-2)', fontSize: 10, fontWeight: 500, marginLeft: 1 }}>k</span></div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', marginTop: 1 }}>{h.dur}min</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ height: 20 }}/>
    </ScreenWrap>
  );
}

Object.assign(window, { ScreenHistorico });
