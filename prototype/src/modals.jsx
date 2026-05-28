// modals.jsx — video modal (3 variants), exercise editor, generic sheet

// Generic bottom sheet
function BottomSheet({ open, onClose, height = 'auto', children, title }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        animation: 'fade-in 200ms ease',
      }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--surface-1)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        padding: '12px 0 32px',
        maxHeight: '85%',
        overflow: 'auto',
        animation: 'slide-up 250ms cubic-bezier(.2,.7,.3,1)',
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)',
          margin: '0 auto 16px',
        }}/>
        {title && (
          <div style={{
            padding: '0 20px 12px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em',
          }}>{title}</div>
        )}
        <div style={{ padding: '0 20px' }}>{children}</div>
      </div>
    </div>
  );
}

// Center modal (for video popup variant)
function CenterModal({ open, onClose, children, padding = 20 }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        animation: 'fade-in 200ms ease',
      }}/>
      <div style={{
        position: 'absolute', top: '50%', left: 16, right: 16,
        transform: 'translateY(-50%)',
        background: 'var(--surface-1)',
        borderRadius: 24,
        border: '1px solid var(--border-strong)',
        overflow: 'hidden',
        animation: 'scale-in 250ms cubic-bezier(.2,.7,.3,1)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
      }}>
        {children}
      </div>
    </div>
  );
}

// Video modal — 3 variants depending on tweak
function VideoModal({ open, onClose, exercise, variant = 'modal', accent }) {
  if (!open || !exercise) return null;
  const acc = accent || 'var(--accent)';
  const ytEmbed = `https://www.youtube-nocookie.com/embed/${exercise.ytId}?autoplay=1&modestbranding=1&rel=0&controls=1`;

  const VideoFrame = (
    <div style={{
      position: 'relative',
      aspectRatio: '16/9',
      background: '#000',
    }}>
      <iframe
        src={ytEmbed}
        title={exercise.nome}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );

  const Header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '16px 18px 14px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <MonoLabel color={acc}>{exercise.videoLabel || 'EXECUÇÃO · YOUTUBE'}</MonoLabel>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.2 }}>{exercise.nome}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {exercise.tags
            ? exercise.tags.map((t, i) => <Pill key={i} mono>{t}</Pill>)
            : (
              <>
                {exercise.grupo && <Pill mono>{exercise.grupo}</Pill>}
                {exercise.series && exercise.reps && <Pill mono>{exercise.series}×{exercise.reps}</Pill>}
                {exercise.carga != null && exercise.carga > 0 && <Pill mono>{exercise.carga}kg</Pill>}
              </>
            )}
        </div>
      </div>
      <button onClick={onClose} className="tappable" style={{
        width: 36, height: 36, borderRadius: 18,
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
        color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name="x" size={16}/>
      </button>
    </div>
  );

  const tipsText = exercise.dicas
    || 'Mantenha a postura neutra · controle a fase excêntrica · respiração ritmada.';
  const tipsLabel = exercise.dicasLabel || 'DICAS DE EXECUÇÃO';

  // -- "modal" variant: center popup
  if (variant === 'modal') {
    return (
      <CenterModal open onClose={onClose} padding={0}>
        {VideoFrame}
        {Header}
      </CenterModal>
    );
  }
  // -- "fullscreen" variant: full bleed
  if (variant === 'fullscreen') {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: '#000', animation: 'fade-in 200ms ease' }}>
        <div style={{ paddingTop: 54 }}>{VideoFrame}</div>
        <div style={{ padding: 16, color: 'var(--text)' }}>
          {Header}
          <div style={{ padding: '0 18px 16px' }}>
            <MonoLabel>{tipsLabel}</MonoLabel>
            <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13, lineHeight: 1.55 }}>
              {tipsText}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // -- "sheet" variant: bottom sheet with video
  return (
    <BottomSheet open onClose={onClose}>
      <div style={{ marginBottom: 14 }}>{Header}</div>
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        {VideoFrame}
      </div>
      <div style={{ marginTop: 14, padding: '12px 4px' }}>
        <MonoLabel>{tipsLabel}</MonoLabel>
        <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13, lineHeight: 1.55 }}>
          {tipsText}
        </div>
      </div>
    </BottomSheet>
  );
}

// Exercise editor sheet
function ExerciseEditor({ open, onClose, exercise, onSave, onDelete, isNew, accent }) {
  const [draft, setDraft] = React.useState(exercise || {});
  React.useEffect(() => { if (exercise) setDraft({ ...exercise }); }, [exercise]);
  if (!open || !draft) return null;
  const update = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ marginBottom: 8 }}><MonoLabel>{label}</MonoLabel></div>
      {children}
    </div>
  );
  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    height: 46, padding: '0 14px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 12, color: 'var(--text)',
    fontSize: 15, fontFamily: 'var(--font-body)',
    outline: 'none',
  };

  return (
    <BottomSheet open onClose={onClose} title={isNew ? 'Novo exercício' : 'Editar exercício'}>
      <Field label="Nome do exercício">
        <input style={inputStyle} value={draft.nome || ''} onChange={e => update('nome', e.target.value)}
          placeholder="ex. Supino reto com barra"/>
      </Field>
      <Field label="Grupo muscular">
        <input style={inputStyle} value={draft.grupo || ''} onChange={e => update('grupo', e.target.value)}
          placeholder="Peito"/>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Field label="Séries">
          <input type="number" style={inputStyle} value={draft.series || ''}
            onChange={e => update('series', parseInt(e.target.value) || 0)}/>
        </Field>
        <Field label="Repetições">
          <input style={inputStyle} value={draft.reps || ''}
            onChange={e => update('reps', e.target.value)} placeholder="8-12"/>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Field label="Carga (kg)">
          <input type="number" step="0.5" style={inputStyle} value={draft.carga ?? 0}
            onChange={e => update('carga', parseFloat(e.target.value) || 0)}/>
        </Field>
        <Field label="Descanso (s)">
          <input type="number" style={inputStyle} value={draft.descanso ?? 60}
            onChange={e => update('descanso', parseInt(e.target.value) || 0)}/>
        </Field>
      </div>
      <Field label="ID do vídeo YouTube">
        <div style={{ position: 'relative' }}>
          <input style={{...inputStyle, paddingLeft: 40 }} value={draft.ytId || ''}
            onChange={e => update('ytId', e.target.value.trim())}
            placeholder="ex. rT7DgCr-3pg"/>
          <Icon name="youtube" size={18} color="var(--muted-2)" style={{ position: 'absolute', left: 12, top: 14 }}/>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted-2)' }}>
          Cole apenas o ID (depois de <span style={{ fontFamily: 'var(--font-mono)' }}>?v=</span>) ou a URL completa.
        </div>
      </Field>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {!isNew && (
          <Button variant="danger" icon="trash" onClick={() => { onDelete?.(); onClose(); }}>Remover</Button>
        )}
        <div style={{ flex: 1 }}/>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => { onSave?.(draft); onClose(); }}>
          {isNew ? 'Adicionar' : 'Salvar'}
        </Button>
      </div>
    </BottomSheet>
  );
}

// Toast (transient)
function Toast({ message, accent, onDone }) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDone?.(), 2400);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div style={{
      position: 'absolute', bottom: NAV_H + 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 80,
      padding: '10px 16px',
      background: 'rgba(20,22,28,0.96)',
      border: `1px solid ${accent || 'var(--accent)'}`,
      borderRadius: 999,
      color: 'var(--text)', fontSize: 13, fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'slide-up 250ms cubic-bezier(.2,.7,.3,1)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: accent || 'var(--accent)', marginRight: 8 }}>●</span>{message}
    </div>
  );
}

Object.assign(window, { BottomSheet, CenterModal, VideoModal, ExerciseEditor, Toast });
