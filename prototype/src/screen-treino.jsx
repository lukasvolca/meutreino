// screen-treino.jsx — Detalhe da ficha de treino com execução

// Inline-editable numeric value
function InlineNumber({ value, onChange, suffix, width = 56, color, fontSize = 17, mono = true }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value));
  const inputRef = React.useRef(null);
  React.useEffect(() => { if (!editing) setDraft(String(value)); }, [value, editing]);
  React.useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  const commit = () => {
    const n = parseFloat(draft.replace(',', '.'));
    if (!isNaN(n)) onChange(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{
          width, height: 30,
          padding: '0 6px',
          background: 'var(--surface-3)', border: `1px solid ${color || 'var(--accent)'}`,
          borderRadius: 8, color: 'var(--text)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize, fontWeight: 600,
          textAlign: 'center', outline: 'none',
        }}
      />
    );
  }

  return (
    <span className="tappable" onClick={() => setEditing(true)} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2,
      minWidth: width, height: 30, padding: '0 6px',
      background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)',
      borderRadius: 8,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      fontSize, fontWeight: 600, color: color || 'var(--text)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {value}{suffix && <span style={{ color: 'var(--muted-2)', fontSize: 11, marginLeft: 2 }}>{suffix}</span>}
    </span>
  );
}

// Set row — varia por tipo de exercício (forca | iso | cardio)
function SetRow({ idx, set, tipo, onToggle, onUpdate, accent }) {
  const acc = accent || 'var(--accent)';
  const done = set.done;

  const checkBtn = (
    <button onClick={onToggle} className="tappable" style={{
      width: 30, height: 30, borderRadius: 8,
      background: done ? acc : 'rgba(255,255,255,0.05)',
      border: done ? 'none' : '1px solid var(--border-strong)',
      color: done ? 'var(--accent-ink)' : 'var(--muted-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: done ? `0 0 12px ${acc}40` : 'none',
    }}>
      <Icon name="check" size={16} strokeWidth={2.6}/>
    </button>
  );

  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.06em', fontWeight: 600 };
  const unitStyle = { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' };

  // ── ISOMETRIA: SET / TEMPO / check ────────────────────────────────
  if (tipo === 'iso') {
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '28px 1fr 36px',
        alignItems: 'center', padding: '8px 0', gap: 8,
        opacity: done ? 0.55 : 1, transition: 'opacity 180ms',
      }}>
        <div style={labelStyle}>S{idx + 1}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <InlineNumber value={set.duracaoSeg} onChange={(v) => onUpdate({ duracaoSeg: v })} width={56} fontSize={14}/>
          <span style={unitStyle}>seg</span>
        </div>
        {checkBtn}
      </div>
    );
  }

  // ── CARDIO: bloco único, TEMPO em min ─────────────────────────────
  if (tipo === 'cardio') {
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '28px 1fr 36px',
        alignItems: 'center', padding: '8px 0', gap: 8,
        opacity: done ? 0.55 : 1, transition: 'opacity 180ms',
      }}>
        <div style={labelStyle}><Icon name="timer" size={13} color="var(--muted-2)"/></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <InlineNumber value={set.duracaoMin} onChange={(v) => onUpdate({ duracaoMin: v })} width={56} fontSize={14}/>
          <span style={unitStyle}>min</span>
        </div>
        {checkBtn}
      </div>
    );
  }

  // ── FORÇA (default): SET / REPS / CARGA / check ───────────────────
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '28px 1fr 1fr 36px',
      alignItems: 'center', padding: '8px 0', gap: 8,
      opacity: done ? 0.55 : 1, transition: 'opacity 180ms',
    }}>
      <div style={labelStyle}>S{idx + 1}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineNumber value={set.reps} onChange={(v) => onUpdate({ reps: v })} width={42} fontSize={14}/>
        <span style={unitStyle}>reps</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <InlineNumber value={set.carga} onChange={(v) => onUpdate({ carga: v })} width={50} fontSize={14}/>
        <span style={unitStyle}>kg</span>
      </div>
      {checkBtn}
    </div>
  );
}

// Single exercise card with sets, drag handle, video btn
function ExerciseCard({
  ex, idx, sets, expanded, onToggleExpanded,
  onUpdateSet, onAddSet, onRemoveSet,
  onPlayVideo, onEdit, onStartRest, onDelete, onDragStart, accent,
}) {
  const acc = accent || 'var(--accent)';
  const completedSets = sets.filter(s => s.done).length;
  const allDone = completedSets === sets.length && sets.length > 0;
  const last = ex.historico[ex.historico.length - 1];
  const prev = ex.historico[ex.historico.length - 2];
  const delta = prev != null ? last - prev : 0;
  const tipo = ex.tipo || 'forca';
  const isCardio = tipo === 'cardio';
  const isIso = tipo === 'iso';

  // Texto resumido no header (linha abaixo do grupo)
  let metaSummary;
  if (isCardio) {
    metaSummary = (
      <>
        <span>{ex.duracaoMin}min</span>
        {ex.intensidade && <>
          <span style={{ color: 'var(--muted-3)' }}>·</span>
          <span>{ex.intensidade}</span>
        </>}
      </>
    );
  } else if (isIso) {
    metaSummary = (
      <>
        <span>{ex.series}×{fmtSec(ex.duracaoSeg)}</span>
        {delta > 0 && <>
          <span style={{ color: 'var(--muted-3)' }}>·</span>
          <span style={{ color: '#6dffb0', fontWeight: 600 }}>+{delta}s</span>
        </>}
      </>
    );
  } else {
    metaSummary = (
      <>
        <span>{ex.series}×{ex.reps}</span>
        <span style={{ color: 'var(--muted-3)' }}>·</span>
        <span>{ex.carga}kg</span>
        {delta > 0 && <>
          <span style={{ color: 'var(--muted-3)' }}>·</span>
          <span style={{ color: '#6dffb0', fontWeight: 600 }}>+{delta}</span>
        </>}
      </>
    );
  }

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: `1px solid ${allDone ? `${acc}40` : 'var(--border)'}`,
      borderRadius: 20,
      overflow: 'hidden',
      transition: 'border-color 200ms',
      position: 'relative',
    }}>
      {allDone && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: acc, boxShadow: `0 0 12px ${acc}`,
        }}/>
      )}

      {/* Header (always tappable to expand) */}
      <div className="tappable" onClick={onToggleExpanded}
           style={{ padding: '12px 14px 12px 8px', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
        {/* Drag handle */}
        <div onMouseDown={(e) => { e.stopPropagation(); onDragStart?.(e); }}
             onClick={(e) => e.stopPropagation()}
             style={{
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               color: 'var(--muted-3)', cursor: 'grab',
               padding: '4px 2px',
             }}
             title="Arraste para reordenar">
          <Icon name="drag" size={16}/>
        </div>
        {/* Number badge */}
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: allDone ? acc : 'var(--surface-2)',
          color: allDone ? 'var(--accent-ink)' : 'var(--text)',
          border: allDone ? 'none' : '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
        }}>
          {allDone ? <Icon name="check" size={15} strokeWidth={2.8}/> : String(idx + 1).padStart(2, '0')}
        </div>
        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ex.nome}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ex.grupo}</span>
            <span style={{ color: 'var(--muted-3)' }}>·</span>
            {metaSummary}
          </div>
        </div>
        {/* Right indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <Sparkline data={ex.historico} width={46} height={18} color={acc}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {completedSets > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                padding: '1px 5px', borderRadius: 4,
                background: allDone ? `${acc}24` : 'rgba(109,255,176,0.14)',
                color: allDone ? acc : '#6dffb0',
                letterSpacing: '0.04em',
              }}>{completedSets}/{sets.length}</span>
            )}
            <div style={{
              width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted-2)',
              transition: 'transform 220ms cubic-bezier(.4,.2,.2,1)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              <Icon name="chevronDown" size={14}/>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Sets table */}
          <div style={{ padding: '0 16px 4px', animation: 'fade-in 200ms ease' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: (isCardio || isIso) ? '28px 1fr 36px' : '28px 1fr 1fr 36px',
              gap: 8, paddingBottom: 6,
              borderTop: '1px solid var(--border)',
              paddingTop: 8,
            }}>
              {isCardio ? (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>—</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>DURAÇÃO</div>
                  <div/>
                </>
              ) : isIso ? (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>SET</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>TEMPO</div>
                  <div/>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>SET</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>REPS</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>CARGA</div>
                  <div/>
                </>
              )}
            </div>
            {sets.map((s, i) => (
              <SetRow key={i} idx={i} set={s} accent={acc} tipo={tipo}
                onToggle={() => { onUpdateSet(i, { done: !s.done }); if (!s.done && !isCardio) onStartRest(ex.descanso); }}
                onUpdate={(patch) => onUpdateSet(i, patch)}
              />
            ))}
          </div>

          {/* Footer actions */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 14px 14px',
            borderTop: '1px solid var(--border)',
          }}>
            <button className="tappable" onClick={(e) => { e.stopPropagation(); onPlayVideo(); }} style={{
              flex: 1, height: 36, padding: '0 12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
            }}>
              <Icon name="playCircle" size={14} color={acc}/>
              Ver execução
            </button>
            <button className="tappable" onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="edit" size={14}/>
            </button>
            {!isCardio && (
              <>
                <button className="tappable" onClick={(e) => { e.stopPropagation(); onAddSet(); }} style={{
                  height: 36, padding: '0 12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                }}>
                  <Icon name="plus" size={13}/> 1 set
                </button>
                <button className="tappable" onClick={(e) => { e.stopPropagation(); sets.length > 1 && onRemoveSet(sets.length - 1); }} style={{
                  height: 36, padding: '0 12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                  opacity: sets.length > 1 ? 1 : 0.4,
                }}>
                  <Icon name="minus" size={13}/> 1 set
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Rest timer floating bar
function RestTimer({ duration, onCancel, onDone, accent }) {
  const [remaining, setRemaining] = React.useState(duration);
  const acc = accent || 'var(--accent)';
  React.useEffect(() => {
    setRemaining(duration);
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); onDone?.(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [duration]);

  const pct = duration > 0 ? remaining / duration : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: NAV_H + 12, zIndex: 70,
      background: 'rgba(10,11,13,0.96)', backdropFilter: 'blur(12px)',
      border: `1px solid ${acc}60`,
      borderRadius: 16, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: `0 8px 28px rgba(0,0,0,0.45), 0 0 20px ${acc}20`,
      animation: 'slide-up 260ms cubic-bezier(.2,.7,.3,1)',
    }}>
      {/* circular */}
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <svg width="44" height="44">
          <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
          <circle cx="22" cy="22" r="19" fill="none" stroke={acc} strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={(2 * Math.PI * 19) * (1 - pct)}
                  transform="rotate(-90 22 22)"
                  style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${acc})` }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="timer" size={16} color={acc}/>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.14em' }}>DESCANSO</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginTop: 2,
        }}>{mm}:{ss}</div>
      </div>
      <button onClick={() => setRemaining(r => Math.min(duration, r + 15))} className="tappable" style={{
        height: 32, padding: '0 12px',
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
        borderRadius: 16, color: 'var(--text)', fontSize: 12, fontWeight: 600,
      }}>+15s</button>
      <button onClick={onCancel} className="tappable" style={{
        width: 32, height: 32, borderRadius: 16,
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
        color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="x" size={14}/>
      </button>
    </div>
  );
}

// Sets state initializer — varia por tipo
function initSets(ex) {
  if (ex.tipo === 'cardio') {
    // Cardio é um bloco único — sem séries/repetições, apenas duração total.
    return [{ duracaoMin: ex.duracaoMin || 10, done: false }];
  }
  if (ex.tipo === 'iso') {
    return Array.from({ length: ex.series }, () => ({
      duracaoSeg: ex.duracaoSeg || 30, done: false,
    }));
  }
  const reps = parseInt(String(ex.reps).split('-')[0], 10) || 10;
  return Array.from({ length: ex.series }, () => ({
    reps, carga: ex.carga, done: false,
  }));
}

// Main treino screen
function ScreenTreino({ fichaId, onBack, onFinish, accent, videoVariant, onCompleteSet, onPlayVideo }) {
  const ficha = FICHAS.find(f => f.id === fichaId);
  const [exercises, setExercises] = React.useState(() => ficha.exercicios.map(e => ({ ...e })));
  const [setsByEx, setSetsByEx] = React.useState(() => {
    const m = {};
    ficha.exercicios.forEach(e => { m[e.id] = initSets(e); });
    return m;
  });
  const [expandedIds, setExpandedIds] = React.useState(() => new Set());
  const [draggingIdx, setDraggingIdx] = React.useState(null);
  const [targetIdx, setTargetIdx] = React.useState(null);
  const [dragY, setDragY] = React.useState(0);
  const [dragSlotH, setDragSlotH] = React.useState(0);
  const [videoEx, setVideoEx] = React.useState(null);
  const [editorEx, setEditorEx] = React.useState(null);
  const [isNew, setIsNew] = React.useState(false);
  const [restDuration, setRestDuration] = React.useState(0);
  const [restKey, setRestKey] = React.useState(0);
  const [toast, setToast] = React.useState(null);
  const acc = accent || 'var(--accent)';

  // Live session timer
  const startTimeRef = React.useRef(Date.now());
  const [elapsedSec, setElapsedSec] = React.useState(0);
  React.useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedSec(0);
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [fichaId]);
  const formatElapsed = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allCompleted = exercises.length > 0 && exercises.every(e => {
    const sets = setsByEx[e.id]; return sets && sets.length > 0 && sets.every(s => s.done);
  });

  const startRest = (sec) => {
    setRestDuration(sec);
    setRestKey(k => k + 1);
  };

  const updateSet = (exId, idx, patch) => {
    setSetsByEx(prev => {
      const next = { ...prev };
      next[exId] = next[exId].map((s, i) => i === idx ? { ...s, ...patch } : s);
      // If this completes all sets, auto-collapse the card after a short delay
      if (patch.done) {
        const allSetsDone = next[exId].every(s => s.done);
        if (allSetsDone) {
          setTimeout(() => {
            setExpandedIds(prev2 => {
              const n = new Set(prev2);
              n.delete(exId);
              return n;
            });
          }, 600);
        }
      }
      return next;
    });
    if (patch.done) {
      setToast({ message: 'Série marcada · descanso iniciado' });
      onCompleteSet?.();
    }
  };
  const addSet = (exId) => {
    setSetsByEx(prev => {
      const cur = prev[exId];
      const last = cur[cur.length - 1];
      return { ...prev, [exId]: [...cur, { ...last, done: false }] };
    });
  };
  const removeSet = (exId, idx) => {
    setSetsByEx(prev => ({ ...prev, [exId]: prev[exId].filter((_, i) => i !== idx) }));
  };

  // Drag-to-reorder
  const exRefs = React.useRef({});
  const onDragStart = (idx) => (e) => {
    e.preventDefault();
    const cardEl = exRefs.current[idx];
    const cardH = cardEl ? cardEl.offsetHeight : 80;
    const gap = 12;
    const slotH = cardH + gap;
    setDraggingIdx(idx);
    setTargetIdx(idx);
    setDragSlotH(slotH);
    const startY = e.clientY;

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      setDragY(dy);
      const shift = Math.round(dy / slotH);
      const newIdx = Math.max(0, Math.min(exercises.length - 1, idx + shift));
      setTargetIdx(newIdx);
    };
    const onUp = (ev) => {
      const dy = ev.clientY - startY;
      const shift = Math.round(dy / slotH);
      const newIdx = Math.max(0, Math.min(exercises.length - 1, idx + shift));
      if (newIdx !== idx) {
        setExercises(prev => {
          const arr = [...prev];
          const [moved] = arr.splice(idx, 1);
          arr.splice(newIdx, 0, moved);
          return arr;
        });
      }
      setDraggingIdx(null);
      setTargetIdx(null);
      setDragY(0);
      setDragSlotH(0);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const completedCount = exercises.reduce((acc, e) => {
    const sets = setsByEx[e.id] || [];
    if (sets.length > 0 && sets.every(s => s.done)) return acc + 1;
    return acc;
  }, 0);

  return (
    <ScreenWrap>
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
        <MonoLabel color={acc} size={11}>FICHA {ficha.letra} · EM ANDAMENTO</MonoLabel>
        {/* Live elapsed timer */}
        <div style={{
          height: 32, padding: '0 10px', borderRadius: 16,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${acc}30`,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
          color: acc, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: acc,
            boxShadow: `0 0 6px ${acc}`, animation: 'pulse 1.8s infinite',
          }}/>
          {formatElapsed(elapsedSec)}
        </div>
      </div>

      {/* Title section */}
      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 18,
            background: acc, color: 'var(--accent-ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 16px ${acc}40`,
          }}>
            <Icon name={ficha.icone} size={34} strokeWidth={1.9}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Ficha {ficha.letra}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{ficha.foco.join(' · ')}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>
              PROGRESSO · {completedCount}/{exercises.length} EXERCÍCIOS
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: acc, fontWeight: 700 }}>
              {Math.round((completedCount / exercises.length) * 100)}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(completedCount / exercises.length) * 100}%`,
              background: acc, transition: 'width 300ms',
              boxShadow: `0 0 8px ${acc}`,
            }}/>
          </div>
        </div>
      </div>

      {/* Exercise cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {exercises.map((ex, idx) => {
          const isDragging = draggingIdx === idx;
          let translateY = 0;
          if (isDragging) {
            translateY = dragY;
          } else if (draggingIdx != null && targetIdx != null && dragSlotH > 0) {
            if (targetIdx > draggingIdx && idx > draggingIdx && idx <= targetIdx) {
              translateY = -dragSlotH;
            } else if (targetIdx < draggingIdx && idx < draggingIdx && idx >= targetIdx) {
              translateY = dragSlotH;
            }
          }
          return (
            <div key={ex.id}
                 ref={el => { exRefs.current[idx] = el; }}
                 style={{
                   transform: `translateY(${translateY}px)${isDragging ? ' scale(1.025)' : ''}`,
                   transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(.2,.7,.3,1)',
                   zIndex: isDragging ? 5 : 1,
                   position: 'relative',
                   boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' : 'none',
                   borderRadius: 20,
                 }}>
              <ExerciseCard
                ex={ex} idx={idx} sets={setsByEx[ex.id] || []}
                expanded={expandedIds.has(ex.id)}
                onToggleExpanded={() => toggleExpanded(ex.id)}
                accent={acc}
                onUpdateSet={(i, patch) => updateSet(ex.id, i, patch)}
                onAddSet={() => addSet(ex.id)}
                onRemoveSet={(i) => removeSet(ex.id, i)}
                onPlayVideo={() => { onPlayVideo ? onPlayVideo(ex) : setVideoEx(ex); }}
                onEdit={() => { setEditorEx(ex); setIsNew(false); }}
                onStartRest={startRest}
                onDragStart={onDragStart(idx)}
              />
            </div>
          );
        })}

        {/* Add exercise */}
        <Card padding={14} style={{ borderStyle: 'dashed', background: 'transparent' }}
              onClick={() => { setEditorEx({ id: `new-${Date.now()}`, nome: '', grupo: '', series: 3, reps: '10-12', carga: 0, descanso: 60, ytId: '', historico: [] }); setIsNew(true); }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
            <Icon name="plus" size={16}/>
            Adicionar exercício
          </div>
        </Card>
      </div>

      {/* Finalize button */}
      <div style={{ padding: '20px 20px 20px' }}>
        <Button variant="primary" fullWidth size="lg"
                icon={allCompleted ? 'check' : 'bolt'}
                style={{ background: acc }}
                onClick={() => {
                  const minutes = Math.max(1, Math.round(elapsedSec / 60));
                  onFinish?.(fichaId, minutes);
                  onBack();
                }}>
          {allCompleted ? `Finalizar treino · ${formatElapsed(elapsedSec)}` :
            (completedCount > 0
              ? `Finalizar agora (${completedCount}/${exercises.length}) · ${formatElapsed(elapsedSec)}`
              : `Finalizar treino · ${formatElapsed(elapsedSec)}`)}
        </Button>
        {completedCount < exercises.length && (
          <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>
            você pode finalizar a qualquer momento
          </div>
        )}
      </div>

      {/* Rest timer */}
      {restDuration > 0 && (
        <RestTimer key={restKey} duration={restDuration} accent={acc}
          onCancel={() => setRestDuration(0)}
          onDone={() => setRestDuration(0)}/>
      )}

      {/* Modals */}
      <VideoModal open={!!videoEx} exercise={videoEx} onClose={() => setVideoEx(null)} variant={videoVariant} accent={acc}/>
      <ExerciseEditor open={!!editorEx} exercise={editorEx} isNew={isNew}
        onClose={() => setEditorEx(null)}
        onSave={(d) => {
          if (isNew) {
            setExercises(prev => [...prev, { ...d, historico: [d.carga || 0] }]);
            setSetsByEx(prev => ({ ...prev, [d.id]: initSets(d) }));
          } else {
            setExercises(prev => prev.map(e => e.id === d.id ? { ...e, ...d } : e));
            setSetsByEx(prev => ({ ...prev, [d.id]: initSets(d) }));
          }
        }}
        onDelete={() => {
          setExercises(prev => prev.filter(e => e.id !== editorEx.id));
          setSetsByEx(prev => { const n = { ...prev }; delete n[editorEx.id]; return n; });
        }}
        accent={acc}
      />
      <Toast message={toast?.message} onDone={() => setToast(null)} accent={acc}/>
    </ScreenWrap>
  );
}

Object.assign(window, { ScreenTreino, RestTimer, ExerciseCard, InlineNumber });
