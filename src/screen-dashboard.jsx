// screen-dashboard.jsx — Tela "Hoje" (Dashboard + lista de fichas)

function ScreenDashboard({ accent, onOpenFicha, onGoto, finishedToday, sessionDurations, onOpenPerfil, onOpenNotificacoes }) {
  const fichaHoje = FICHAS.find(f => f.id === HOJE);
  const semanaPct = Math.min(1, ALUNO.treinosSemana / 5);
  const acc = accent || 'var(--accent)';
  const allCompleted = !!finishedToday;
  const actualDuration = finishedToday?.durationMin;
  // Estimativa = média dos últimos 5 resultados (HISTORICO + sessões desta execução)
  const avgHoje = avgDurationForFicha(fichaHoje.letra, sessionDurations?.[fichaHoje.letra] || []) ?? fichaHoje.duracaoMin;

  return (
    <ScreenWrap>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px' }}>
        <div className="tappable" onClick={onOpenPerfil}
             style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '-6px -8px', padding: '6px 8px', borderRadius: 12 }}>
          <Avatar initials={ALUNO.iniciais} size={42}/>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.16em' }}>QUI · 21 MAI</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', marginTop: 1 }}>
              Olá, {ALUNO.nome.split(' ')[0]}
            </div>
          </div>
        </div>
        <button onClick={onOpenNotificacoes} className="tappable" style={{
          width: 42, height: 42, borderRadius: 21,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
          color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Icon name="bell" size={18}/>
          <div style={{ position: 'absolute', top: 9, right: 11, width: 7, height: 7, borderRadius: '50%', background: acc, boxShadow: `0 0 6px ${acc}` }}/>
        </button>
      </div>

      {/* Hero: Treino de hoje */}
      <div style={{ padding: '0 20px 18px' }}>
        <Card padding={0} accent style={{ background: 'linear-gradient(135deg, rgba(20,22,28,0.95), rgba(26,29,37,0.95))' }}>
          <div style={{ padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: acc, boxShadow: `0 0 8px ${acc}`,
                    animation: 'pulse 2s infinite',
                  }}/>
                  <MonoLabel color={acc}>TREINO DE HOJE</MonoLabel>
                  {allCompleted && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px 3px 6px',
                      background: acc, color: 'var(--accent-ink)',
                      borderRadius: 6, fontFamily: 'var(--font-mono)',
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                      boxShadow: `0 0 16px ${acc}60`,
                      animation: 'scale-in 280ms cubic-bezier(.2,.7,.3,1)',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12l5 5 11-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      FEITO!
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  Ficha {fichaHoje.letra}
                </div>
                <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>
                  {fichaHoje.foco.join(' · ')}
                </div>
              </div>
              <div style={{
                width: 58, height: 58, borderRadius: 16,
                background: acc, color: 'var(--accent-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 20px ${acc}40`,
              }}>
                <Icon name={fichaHoje.icone} size={34} strokeWidth={1.9}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em' }}>EXERCÍCIOS</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginTop: 1 }}>{fichaHoje.exercicios.length}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }}/>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em' }}>
                  DURAÇÃO{actualDuration != null && <span style={{ color: acc }}> ✓</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginTop: 1,
                              color: actualDuration != null ? acc : 'var(--text)' }}>
                  {actualDuration != null ? actualDuration : `~${avgHoje}`}
                  <span style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 500, marginLeft: 2 }}>min</span>
                </div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }}/>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.12em' }}>VOLUME EST.</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginTop: 1 }}>8.4<span style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 500, marginLeft: 2 }}>k kg</span></div>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 14px 14px' }}>
            <Button variant={allCompleted ? 'secondary' : 'primary'} fullWidth icon={allCompleted ? 'check' : 'play'} size="lg"
              onClick={() => onOpenFicha(fichaHoje.id)}
              style={allCompleted ? { borderColor: `${acc}40`, color: acc } : { background: acc }}>
              {allCompleted
                ? `Treino concluído (${actualDuration}min) · revisar`
                : 'Iniciar treino'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Métricas */}
      <div style={{ padding: '0 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <MonoLabel>STREAK</MonoLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1, color: '#ffb547' }}>{ALUNO.streak}</span>
            <span style={{ fontSize: 12, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>dias</span>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 1, background: i < ALUNO.streak ? `linear-gradient(180deg, #ff5e1f, #ffb547)` : 'rgba(255,255,255,0.06)' }}/>
            ))}
          </div>
        </Card>
        <Card padding={14}>
          <MonoLabel>SEMANA</MonoLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1 }}>{ALUNO.treinosSemana}<span style={{ color: 'var(--muted-3)', fontSize: 22 }}>/5</span></span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {['S','T','Q','Q','S','S','D'].map((d, i) => {
              const done = i < 4; const today = i === 3;
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 18, borderRadius: 4,
                    background: today ? acc : (done ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'),
                    boxShadow: today ? `0 0 8px ${acc}80` : 'none',
                  }}/>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted-2)', marginTop: 3 }}>{d}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Volume chart */}
      <div style={{ padding: '0 20px 18px' }}>
        <Card padding={16} onClick={() => onGoto('progresso')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <MonoLabel>VOLUME · 12 SEMANAS</MonoLabel>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <MetricNumber value="30.2" unit="k kg" size={28}/>
                <Pill mono color="rgba(109,255,176,0.14)" style={{ color: '#6dffb0', border: '1px solid rgba(109,255,176,0.28)' }}>
                  ↑ 36% vs 12s
                </Pill>
              </div>
            </div>
            <Icon name="chevronRight" size={18} color="var(--muted-2)"/>
          </div>
          <BarChart data={VOLUME_SEMANAL} width={340} height={90} color={acc}
            labels={['12s','11s','10s','9s','8s','7s','6s','5s','4s','3s','2s','1s']}/>
        </Card>
      </div>

      {/* Fichas */}
      <SectionTitle action="Editar"><span>Suas fichas</span></SectionTitle>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FICHAS.map(f => {
          const avgMin = avgDurationForFicha(f.letra, sessionDurations?.[f.letra] || []) ?? f.duracaoMin;
          return (
          <Card key={f.id} padding={14} onClick={() => onOpenFicha(f.id)} style={{
            borderColor: f.id === HOJE ? 'rgba(255,255,255,0.12)' : 'var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: f.id === HOJE ? acc : 'var(--surface-2)',
                color: f.id === HOJE ? 'var(--accent-ink)' : 'var(--muted)',
                border: f.id === HOJE ? 'none' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={f.icone} size={26} strokeWidth={1.8}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
                    Ficha {f.letra}
                  </span>
                  {f.id === HOJE && !allCompleted && <Pill mono color="rgba(204,255,0,0.14)" style={{ color: acc, border: `1px solid ${acc}40` }}>HOJE</Pill>}
                  {f.id === HOJE && allCompleted && (
                    <span style={{
                      padding: '2px 7px',
                      background: acc, color: 'var(--accent-ink)',
                      borderRadius: 4, fontFamily: 'var(--font-mono)',
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                    }}>✓ FEITO</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.foco.join(' · ')}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                  <span>{f.exercicios.length} EXS</span>
                  <span>·</span>
                  <span>~{avgMin}MIN</span>
                </div>
              </div>
              <Icon name="chevronRight" size={18} color="var(--muted-2)"/>
            </div>
          </Card>
          );
        })}
        <Card padding={14} style={{ borderStyle: 'dashed', background: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
            <Icon name="plus" size={16}/>
            Nova ficha
          </div>
        </Card>
      </div>

      <div style={{ height: 20 }}/>
    </ScreenWrap>
  );
}

Object.assign(window, { ScreenDashboard });
