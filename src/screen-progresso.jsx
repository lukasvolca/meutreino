// screen-progresso.jsx — Progressão de carga, PRs, volume

function ScreenProgresso({ accent }) {
  const acc = accent || 'var(--accent)';
  // All exercises from all fichas — flat list
  const allExs = React.useMemo(() => FICHAS.flatMap(f => f.exercicios.map(e => ({ ...e, ficha: f.letra }))), []);
  const [selectedId, setSelectedId] = React.useState(allExs[0].id);
  const selected = allExs.find(e => e.id === selectedId) || allExs[0];
  const [period, setPeriod] = React.useState('12s');

  const labelsForData = ['s1','s2','s3','s4','s5','s6'];
  const data = selected.historico;
  const first = data[0], last = data[data.length - 1];
  const delta = last - first;
  const deltaPct = first > 0 ? (delta / first) * 100 : 0;

  // PRs roundup
  const prs = allExs.map(e => ({
    id: e.id, nome: e.nome, ficha: e.ficha, grupo: e.grupo,
    pr: e.historico[e.historico.length - 1],
    delta: e.historico[e.historico.length - 1] - e.historico[0],
  })).sort((a, b) => b.delta - a.delta).slice(0, 4);

  // Volume per week aggregated (use VOLUME_SEMANAL)
  const vol12 = VOLUME_SEMANAL;
  const vol4 = vol12.slice(-4);
  const vol24 = [...vol12.map(v => Math.round(v*0.9)), ...vol12]; // simulate longer history

  return (
    <ScreenWrap>
      {/* Top */}
      <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <MonoLabel>{'> SEÇÃO 02'}</MonoLabel>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4 }}>
            Progresso
          </div>
        </div>
        <Pill mono color="rgba(109,255,176,0.14)" style={{ color: '#6dffb0', border: '1px solid rgba(109,255,176,0.28)' }}>
          ↑ {deltaPct.toFixed(0)}%
        </Pill>
      </div>

      {/* Exercise selector */}
      <div style={{ padding: '14px 20px 12px' }}>
        <MonoLabel>EXERCÍCIO</MonoLabel>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 4, marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20 }} className="app-scroll">
          {allExs.map(e => (
            <button key={e.id} className="tappable" onClick={() => setSelectedId(e.id)} style={{
              padding: '8px 12px', borderRadius: 10,
              background: e.id === selectedId ? acc : 'var(--surface-1)',
              color: e.id === selectedId ? 'var(--accent-ink)' : 'var(--text)',
              border: e.id === selectedId ? 'none' : '1px solid var(--border)',
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                padding: '1px 4px', borderRadius: 3,
                background: e.id === selectedId ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)',
              }}>{e.ficha}</span>
              {e.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart card */}
      <div style={{ padding: '0 20px 14px' }}>
        <Card padding={16} accent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <MonoLabel color={acc}>CARGA · 1RM EFETIVO</MonoLabel>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginTop: 4, lineHeight: 1.1 }}>
                {selected.nome}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <MetricNumber value={last} unit="kg" size={32} color={acc}/>
              {delta > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6dffb0', marginTop: 2, fontWeight: 600 }}>
                  +{delta.toFixed(1)}kg desde início
                </div>
              )}
            </div>
          </div>

          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, marginBottom: 12, padding: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
            {['4s', '12s', '6m', '1a'].map(p => (
              <button key={p} className="tappable" onClick={() => setPeriod(p)} style={{
                flex: 1, height: 28, border: 0,
                background: period === p ? 'var(--surface-3)' : 'transparent',
                color: period === p ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                borderRadius: 7,
              }}>{p}</button>
            ))}
          </div>

          <LineChart data={data} labels={labelsForData} width={324} height={180} accent={acc}/>
        </Card>
      </div>

      {/* PRs */}
      <SectionTitle action="Ver todos">Recordes recentes</SectionTitle>
      <div style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {prs.map(p => (
          <Card key={p.id} padding={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                padding: '1px 5px', borderRadius: 3,
                background: 'rgba(255,255,255,0.06)', color: 'var(--muted)',
              }}>{p.ficha} · {p.grupo}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, lineHeight: 1.2, height: 32, overflow: 'hidden' }}>
              {p.nome}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
              <MetricNumber value={p.pr} unit="kg" size={22}/>
              <Pill mono color="rgba(109,255,176,0.12)" style={{ color: '#6dffb0', border: '1px solid rgba(109,255,176,0.24)', fontSize: 10 }}>
                +{p.delta.toFixed(1)}
              </Pill>
            </div>
          </Card>
        ))}
      </div>

      {/* Volume bars */}
      <SectionTitle>Volume semanal</SectionTitle>
      <div style={{ padding: '0 20px 14px' }}>
        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <MetricNumber value="30.2" unit="k kg · esta semana" size={26}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>kg movidos</span>
          </div>
          <BarChart data={VOLUME_SEMANAL} width={324} height={120} color={acc}
            labels={Array.from({length:12},(_,i)=>`${12-i}s`)}/>
        </Card>
      </div>

      {/* Sessions / consistency */}
      <div style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <MonoLabel>SESSÕES · MÊS</MonoLabel>
          <MetricNumber value={ALUNO.treinosMes} size={36}/>
          <div style={{ marginTop: 4, fontSize: 11, color: '#6dffb0', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+2 vs mês ant.</div>
        </Card>
        <Card padding={14}>
          <MonoLabel>FREQ. SEMANAL</MonoLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <MetricNumber value="4.2" unit="× / sem" size={36}/>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>últimas 12 sem.</div>
        </Card>
      </div>

      <div style={{ height: 20 }}/>
    </ScreenWrap>
  );
}

Object.assign(window, { ScreenProgresso });
