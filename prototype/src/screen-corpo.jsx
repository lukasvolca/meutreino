// screen-corpo.jsx — Ficha de medidas corporais

function ScreenCorpo({ accent }) {
  const acc = accent || 'var(--accent)';
  const current = MEDIDAS[0];
  const previous = MEDIDAS[1];
  const imc = (current.peso / ((current.altura / 100) ** 2));
  const imcPrev = (previous.peso / ((previous.altura / 100) ** 2));
  const [tab, setTab] = React.useState('atual'); // 'atual' | 'historico' | 'foto'

  const deltaOf = (key) => current[key] - previous[key];

  const pesoHist = [...MEDIDAS].reverse().map(m => m.peso);
  const gorduraHist = [...MEDIDAS].reverse().map(m => m.gordura);
  const labels = [...MEDIDAS].reverse().map(m => m.data.slice(5).replace('-', '/'));

  const SilhouetteAnnotation = () => (
    <Card padding={0} style={{ background: 'linear-gradient(135deg, var(--surface-1), var(--surface-2))' }}>
      <div style={{ position: 'relative', height: 260, padding: 16 }}>
        {/* Body silhouette */}
        <svg width="100%" height="100%" viewBox="0 0 200 240" style={{ display: 'block', margin: '0 auto', maxWidth: 160 }}>
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={acc} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={acc} stopOpacity="0.15"/>
            </linearGradient>
          </defs>
          {/* head */}
          <circle cx="100" cy="22" r="14" fill="none" stroke={acc} strokeWidth="1.5" opacity="0.85"/>
          {/* torso */}
          <path d="M75 42 Q72 50 78 56 L72 90 Q70 110 75 130 L88 175 L82 220 L92 222 L95 180 L100 175 L105 180 L108 222 L118 220 L112 175 L125 130 Q130 110 128 90 L122 56 Q128 50 125 42 Q113 38 100 38 Q87 38 75 42 Z"
                fill="url(#bodyGrad)" stroke={acc} strokeWidth="1.5" opacity="0.9"/>
          {/* arms */}
          <path d="M75 50 L62 70 L56 100 L50 120" fill="none" stroke={acc} strokeWidth="1.5" opacity="0.85" strokeLinecap="round"/>
          <path d="M125 50 L138 70 L144 100 L150 120" fill="none" stroke={acc} strokeWidth="1.5" opacity="0.85" strokeLinecap="round"/>
        </svg>

        {/* Annotation lines + labels */}
        {[
          { top: '20%', side: 'left', label: 'BRAÇO', val: `${current.bracoD}cm`, target: { x: 56, y: 90 } },
          { top: '38%', side: 'right', label: 'PEITO', val: `${current.peito}cm`, target: { x: 125, y: 60 } },
          { top: '54%', side: 'left', label: 'CINTURA', val: `${current.cintura}cm`, target: { x: 72, y: 100 } },
          { top: '72%', side: 'right', label: 'COXA', val: `${current.coxaD}cm`, target: { x: 110, y: 175 } },
        ].map((a, i) => (
          <div key={i} style={{
            position: 'absolute',
            [a.side]: 8,
            top: a.top,
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${acc}40`,
            borderRadius: 8,
            padding: '4px 8px',
            display: 'flex', flexDirection: 'column', gap: 1,
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>{a.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: acc, fontWeight: 700 }}>{a.val}</span>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <ScreenWrap>
      {/* Header */}
      <div style={{ padding: '0 20px 4px' }}>
        <MonoLabel>{'> SEÇÃO 03'}</MonoLabel>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4 }}>
          Corpo
        </div>
        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
          última medição · {current.data.split('-').reverse().join('/')}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 20px 10px', display: 'flex', gap: 4 }}>
        {[
          { id: 'atual', label: 'Atual' },
          { id: 'historico', label: 'Histórico' },
          { id: 'foto', label: 'Fotos' },
        ].map(t => (
          <button key={t.id} className="tappable" onClick={() => setTab(t.id)} style={{
            flex: 1, height: 36,
            background: tab === t.id ? 'var(--surface-2)' : 'transparent',
            border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--muted)',
            borderRadius: 10, fontSize: 12, fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'atual' && (
        <>
          {/* Top metrics */}
          <div style={{ padding: '4px 20px 14px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
            <Card padding={14}>
              <MonoLabel>PESO</MonoLabel>
              <MetricNumber value={current.peso} unit="kg" size={42} decimals={1}/>
              <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                <Pill mono color={deltaOf('peso') > 0 ? 'rgba(109,255,176,0.14)' : 'rgba(255,79,94,0.14)'}
                      style={{ color: deltaOf('peso') > 0 ? '#6dffb0' : '#ff4f5e', border: '1px solid currentColor', fontSize: 10 }}>
                  {deltaOf('peso') > 0 ? '↑' : '↓'} {Math.abs(deltaOf('peso')).toFixed(1)}kg
                </Pill>
                <span style={{ fontSize: 10, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>30d</span>
              </div>
            </Card>
            <Card padding={14}>
              <MonoLabel>IMC</MonoLabel>
              <MetricNumber value={imc} size={42} decimals={1}/>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Pill mono color={`${acc}24`} style={{ color: acc, fontSize: 10, border: `1px solid ${acc}40` }}>
                  {imc < 25 ? 'NORMAL' : 'SOBREP.'}
                </Pill>
              </div>
            </Card>
          </div>

          <div style={{ padding: '0 20px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Card padding={14}>
              <MonoLabel>% GORDURA</MonoLabel>
              <MetricNumber value={current.gordura} unit="%" size={32} decimals={1}/>
              <div style={{ marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                <Pill mono color="rgba(109,255,176,0.14)" style={{ color: '#6dffb0', border: '1px solid rgba(109,255,176,0.28)', fontSize: 10 }}>
                  ↓ {Math.abs(deltaOf('gordura')).toFixed(1)}pp
                </Pill>
              </div>
            </Card>
            <Card padding={14}>
              <MonoLabel>ALTURA</MonoLabel>
              <MetricNumber value={current.altura} unit="cm" size={32}/>
              <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-2)' }}>fixa</div>
            </Card>
          </div>

          {/* Silhouette annotated */}
          <div style={{ padding: '0 20px 14px' }}>
            <SilhouetteAnnotation/>
          </div>

          {/* Measurements list */}
          <SectionTitle action="+ Nova medição">Circunferências</SectionTitle>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'bracoD', label: 'Braço direito', unit: 'cm' },
              { key: 'bracoE', label: 'Braço esquerdo', unit: 'cm' },
              { key: 'peito', label: 'Peito', unit: 'cm' },
              { key: 'cintura', label: 'Cintura', unit: 'cm' },
              { key: 'quadril', label: 'Quadril', unit: 'cm' },
              { key: 'coxaD', label: 'Coxa direita', unit: 'cm' },
              { key: 'coxaE', label: 'Coxa esquerda', unit: 'cm' },
              { key: 'panturrilha', label: 'Panturrilha', unit: 'cm' },
            ].map(m => {
              const d = deltaOf(m.key);
              const pos = m.key === 'cintura' ? d < 0 : d > 0;
              return (
                <Card key={m.key} padding={12} style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {current[m.key]}<span style={{ color: 'var(--muted-2)', fontSize: 11, fontWeight: 500, marginLeft: 2 }}>{m.unit}</span>
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                        color: pos ? '#6dffb0' : '#ff4f5e', minWidth: 38, textAlign: 'right' }}>
                        {d > 0 ? '+' : ''}{d.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {tab === 'historico' && (
        <>
          <div style={{ padding: '4px 20px 14px' }}>
            <Card padding={16}>
              <MonoLabel>PESO · 5 MESES</MonoLabel>
              <MetricNumber value={current.peso} unit="kg" size={32} decimals={1}/>
              <div style={{ marginTop: 10 }}>
                <LineChart data={pesoHist} labels={labels} width={324} height={170} accent={acc} unit="kg"/>
              </div>
            </Card>
          </div>
          <div style={{ padding: '0 20px 14px' }}>
            <Card padding={16}>
              <MonoLabel>% GORDURA</MonoLabel>
              <MetricNumber value={current.gordura} unit="%" size={32} decimals={1}/>
              <div style={{ marginTop: 10 }}>
                <LineChart data={gorduraHist} labels={labels} width={324} height={150} accent="#ffb547" unit="%"/>
              </div>
            </Card>
          </div>
          <SectionTitle>Medições anteriores</SectionTitle>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MEDIDAS.map((m, i) => (
              <Card key={m.data} padding={12} style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
                      {m.data.split('-').reverse().join('/')}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 13, color: 'var(--muted)' }}>
                      Peso · gordura · medidas completas
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>KG</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{m.peso}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>% GORD</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: acc }}>{m.gordura}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'foto' && (
        <>
          <div style={{ padding: '4px 20px 14px' }}>
            <Card padding={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <MonoLabel>COMPARAÇÃO · ANTES / DEPOIS</MonoLabel>
                <MonoLabel color={acc}>5 MESES</MonoLabel>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                {[
                  { label: '15/01/2026', peso: 75.0, hue: 0 },
                  { label: '15/05/2026', peso: 78.4, hue: 1 },
                ].map((p, i) => (
                  <div key={i} style={{
                    aspectRatio: '3/4',
                    borderRadius: 12,
                    background: `repeating-linear-gradient(${i ? 135 : 45}deg, rgba(255,255,255,0.04) 0 4px, rgba(255,255,255,0.02) 4px 12px)`,
                    border: '1px dashed rgba(255,255,255,0.12)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <Icon name="camera" size={28} color="rgba(255,255,255,0.18)"/>
                    <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
                      ARRASTE A FOTO
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{p.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i ? acc : 'var(--muted)', fontWeight: 700 }}>{p.peso}kg</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" fullWidth icon="camera" style={{ marginTop: 14 }}>
                Tirar nova foto
              </Button>
            </Card>
          </div>

          <SectionTitle>Linha do tempo</SectionTitle>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MEDIDAS.map((m, i) => (
              <Card key={m.data} padding={12}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 64, height: 80, borderRadius: 8,
                    background: `repeating-linear-gradient(${45 + i*15}deg, rgba(255,255,255,0.05) 0 3px, rgba(255,255,255,0.02) 3px 8px)`,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name="camera" size={16} color="rgba(255,255,255,0.18)"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
                      {m.data.split('-').reverse().join('/')}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, fontWeight: 500 }}>{m.peso}kg · {m.gordura}% gordura</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted-2)' }}>Cintura {m.cintura}cm · Braço {m.bracoD}cm</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div style={{ height: 20 }}/>
    </ScreenWrap>
  );
}

Object.assign(window, { ScreenCorpo });
