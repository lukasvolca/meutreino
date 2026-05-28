// app.jsx — root app

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#CCFF00",
  "dark": true,
  "videoVariant": "modal"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState('hoje');
  const [activeFicha, setActiveFicha] = React.useState(null); // ficha id when inside treino detail
  const [overlay, setOverlay] = React.useState(null); // 'perfil' | 'notificacoes' | null
  const [finishedFichas, setFinishedFichas] = React.useState(() => new Map()); // id -> { durationMin }
  // Histórico de durações feito nesta sessão, alimenta a média móvel mostrada na dashboard
  // shape: { A: [60, 58, ...], B: [...], C: [...] } — mais recentes primeiro
  const [sessionDurations, setSessionDurations] = React.useState({});
  const [globalVideoEx, setGlobalVideoEx] = React.useState(null);
  const [globalToast, setGlobalToast] = React.useState(null);

  // Apply accent to CSS variables
  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', t.accent);
    // accent ink (dark text on accent) — keep dark
    r.style.setProperty('--accent-ink', '#0a0b0d');
    // glow color for shadows
    const hex = t.accent.replace('#', '');
    const r2 = parseInt(hex.slice(0,2), 16);
    const g2 = parseInt(hex.slice(2,4), 16);
    const b2 = parseInt(hex.slice(4,6), 16);
    r.style.setProperty('--accent-glow', `${r2}, ${g2}, ${b2}`);
  }, [t.accent]);

  // Light mode token swap
  React.useEffect(() => {
    const r = document.documentElement;
    if (t.dark) {
      r.style.setProperty('--bg-page', '#0a0b0d');
      r.style.setProperty('--bg-app', '#0d0e12');
      r.style.setProperty('--surface-1', '#14161c');
      r.style.setProperty('--surface-2', '#1a1d25');
      r.style.setProperty('--surface-3', '#232631');
      r.style.setProperty('--border', 'rgba(255,255,255,0.07)');
      r.style.setProperty('--border-strong', 'rgba(255,255,255,0.14)');
      r.style.setProperty('--text', '#ffffff');
      r.style.setProperty('--muted', 'rgba(255,255,255,0.62)');
      r.style.setProperty('--muted-2', 'rgba(255,255,255,0.38)');
      r.style.setProperty('--muted-3', 'rgba(255,255,255,0.18)');
    } else {
      r.style.setProperty('--bg-page', '#f6f6f4');
      r.style.setProperty('--bg-app', '#fafaf8');
      r.style.setProperty('--surface-1', '#ffffff');
      r.style.setProperty('--surface-2', '#f1f1ee');
      r.style.setProperty('--surface-3', '#e6e6e2');
      r.style.setProperty('--border', 'rgba(10,11,13,0.08)');
      r.style.setProperty('--border-strong', 'rgba(10,11,13,0.16)');
      r.style.setProperty('--text', '#0a0b0d');
      r.style.setProperty('--muted', 'rgba(10,11,13,0.62)');
      r.style.setProperty('--muted-2', 'rgba(10,11,13,0.42)');
      r.style.setProperty('--muted-3', 'rgba(10,11,13,0.22)');
    }
  }, [t.dark]);

  // Goto helpers
  const openFicha = (id) => {
    setActiveFicha(id);
    setTab('hoje');
  };
  const goto = (tabId) => {
    setActiveFicha(null);
    setTab(tabId);
  };

  // Show treino detail (overlay regardless of tab)
  const inTreino = activeFicha != null;
  const inOverlay = overlay != null;

  let body;
  if (inOverlay && overlay === 'perfil') {
    body = <ScreenPerfil accent={t.accent} onBack={() => setOverlay(null)}
             finishedCount={finishedFichas.size}/>;
  } else if (inOverlay && overlay === 'notificacoes') {
    body = <ScreenNotificacoes accent={t.accent} onBack={() => setOverlay(null)}/>;
  } else if (inTreino) {
    body = (
      <ScreenTreino
        fichaId={activeFicha}
        onBack={() => setActiveFicha(null)}
        onFinish={(id, minutes) => {
          setFinishedFichas(prev => {
            const next = new Map(prev);
            next.set(id, { durationMin: minutes });
            return next;
          });
          setSessionDurations(prev => ({
            ...prev,
            [id]: [minutes, ...(prev[id] || [])].slice(0, 10),
          }));
          setGlobalToast(`Ficha ${id} finalizada em ${minutes}min · bom trabalho`);
        }}
        accent={t.accent}
        videoVariant={t.videoVariant}
        onPlayVideo={(ex) => setGlobalVideoEx(ex)}
      />
    );
  } else if (tab === 'hoje') {
    body = <ScreenDashboard accent={t.accent} onOpenFicha={openFicha} onGoto={goto}
             finishedToday={finishedFichas.get(HOJE)} sessionDurations={sessionDurations}
             onOpenPerfil={() => setOverlay('perfil')}
             onOpenNotificacoes={() => setOverlay('notificacoes')}/>;
  } else if (tab === 'progresso') {
    body = <ScreenProgresso accent={t.accent}/>;
  } else if (tab === 'corpo') {
    body = <ScreenCorpo accent={t.accent}/>;
  } else if (tab === 'dieta') {
    body = <ScreenDieta accent={t.accent} onPlayVideo={(item) => setGlobalVideoEx(item)}/>;
  } else if (tab === 'historico') {
    body = <ScreenHistorico accent={t.accent} onOpenFicha={openFicha}/>;
  }

  return (
    <>
      <PhoneShell dark={t.dark}>
        {body}
        {!inTreino && !inOverlay && <BottomNav active={tab} onChange={setTab} accent={t.accent}/>}
        {/* Global video modal — overlays everything */}
        <VideoModal open={!!globalVideoEx} exercise={globalVideoEx}
          onClose={() => setGlobalVideoEx(null)}
          variant={t.videoVariant} accent={t.accent}/>
        <Toast message={globalToast} accent={t.accent} onDone={() => setGlobalToast(null)}/>
      </PhoneShell>

      <TweaksPanel>
        <TweakSection label="Aparência">
          <TweakColor label="Cor de destaque" value={t.accent}
            options={['#CCFF00', '#FF5E1F', '#00E5FF', '#B388FF']}
            onChange={(v) => setTweak('accent', v)}/>
          <TweakToggle label="Modo escuro" value={t.dark}
            onChange={(v) => setTweak('dark', v)}/>
        </TweakSection>
        <TweakSection label="Vídeo de execução">
          <TweakRadio label="Variante do player" value={t.videoVariant}
            options={[
              { value: 'modal', label: 'Modal' },
              { value: 'sheet', label: 'Sheet' },
              { value: 'fullscreen', label: 'Full' },
            ]}
            onChange={(v) => setTweak('videoVariant', v)}/>
        </TweakSection>
        <TweakSection label="Atalhos">
          <TweakButton label="Abrir treino de hoje" onClick={() => openFicha(HOJE)}/>
          <TweakButton label="Abrir Dieta" secondary onClick={() => { setActiveFicha(null); setOverlay(null); setTab('dieta'); }}/>
          <TweakButton label="Abrir Perfil" secondary onClick={() => { setActiveFicha(null); setOverlay('perfil'); }}/>
          <TweakButton label="Abrir Notificações" secondary onClick={() => { setActiveFicha(null); setOverlay('notificacoes'); }}/>
          <TweakButton label="Voltar pra Dashboard" secondary onClick={() => { setActiveFicha(null); setOverlay(null); setTab('hoje'); }}/>
          <TweakButton label="Resetar treinos finalizados" secondary onClick={() => { setFinishedFichas(new Map()); setSessionDurations({}); }}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
