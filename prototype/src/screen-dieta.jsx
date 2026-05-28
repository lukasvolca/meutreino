// screen-dieta.jsx — Tela da Dieta: refeições, ingredientes, macros, modo de preparo

// Macro colors (estáveis, independentes do accent tweak)
const MACRO_COLORS = {
  c: '#ffb547', // carboidratos (amarelo)
  p: '#ff5e1f', // proteína (laranja)
  g: '#6dadff', // gordura (azul)
  kcal: '#CCFF00',
};

function MacroBar({ value, target, color, label, unit = 'g' }) {
  const pct = Math.min(1, value / Math.max(1, target));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color, fontWeight: 700 }}>{Math.round(value)}</span>
          <span style={{ color: 'var(--muted-3)' }}>/{target}{unit}</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: color, borderRadius: 3,
          boxShadow: `0 0 6px ${color}80`,
          transition: 'width 300ms',
        }}/>
      </div>
    </div>
  );
}

// Stacked bar mostrando proporção C/P/G em uma refeição
function MacroSplit({ c, p, g, height = 5, label }) {
  const ck = c * 4, pk = p * 4, gk = g * 9;
  const total = Math.max(1, ck + pk + gk);
  return (
    <div>
      {label && <MonoLabel>{label}</MonoLabel>}
      <div style={{
        display: 'flex', height, marginTop: label ? 6 : 0,
        background: 'rgba(255,255,255,0.06)', borderRadius: height / 2, overflow: 'hidden',
      }}>
        <div style={{ width: `${(ck / total) * 100}%`, background: MACRO_COLORS.c }}/>
        <div style={{ width: `${(pk / total) * 100}%`, background: MACRO_COLORS.p }}/>
        <div style={{ width: `${(gk / total) * 100}%`, background: MACRO_COLORS.g }}/>
      </div>
    </div>
  );
}

function MacroDot({ color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }}/>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>
        {label} <span style={{ color: 'var(--text)', fontWeight: 700 }}>{value}g</span>
      </span>
    </div>
  );
}

function MealCard({ refeicao, expanded, onToggle, onPlayVideo, accent, eaten, onToggleEaten }) {
  const r = refeicao;
  const acc = accent || 'var(--accent)';

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: `1px solid ${eaten ? `${acc}40` : 'var(--border)'}`,
      borderRadius: 18,
      overflow: 'hidden',
      transition: 'border-color 200ms',
      position: 'relative',
    }}>
      {/* Header */}
      <div className="tappable" onClick={onToggle}
           style={{ padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none' }}>
        {/* Check + horário */}
        <button onClick={(e) => { e.stopPropagation(); onToggleEaten?.(); }} className="tappable" style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: eaten ? acc : 'var(--surface-2)',
          color: eaten ? 'var(--accent-ink)' : 'var(--muted)',
          border: eaten ? 'none' : '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
          boxShadow: eaten ? `0 0 10px ${acc}40` : 'none',
        }}>
          {eaten ? <Icon name="check" size={16} strokeWidth={2.6}/> : r.horario}
        </button>

        {/* Name + macros */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em',
            color: eaten ? 'var(--muted)' : 'var(--text)',
            textDecoration: eaten ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {r.nome}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>{r.kcal}</span> kcal
            </span>
            <span style={{ color: 'var(--muted-3)', fontSize: 10 }}>·</span>
            <MacroDot color={MACRO_COLORS.c} label="C" value={r.c}/>
            <MacroDot color={MACRO_COLORS.p} label="P" value={r.p}/>
            <MacroDot color={MACRO_COLORS.g} label="G" value={r.g}/>
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted-2)',
          transition: 'transform 220ms cubic-bezier(.4,.2,.2,1)',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <Icon name="chevronDown" size={16}/>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ animation: 'fade-in 200ms ease' }}>
          {/* Macro split bar */}
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <MacroSplit c={r.c} p={r.p} g={r.g}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)' }}>
              <span>{Math.round((r.c * 4 / r.kcal) * 100)}% carbo</span>
              <span>{Math.round((r.p * 4 / r.kcal) * 100)}% prot</span>
              <span>{Math.round((r.g * 9 / r.kcal) * 100)}% gord</span>
            </div>
          </div>

          {/* Ingredientes */}
          <div style={{ padding: '0 16px 12px' }}>
            <MonoLabel>INGREDIENTES</MonoLabel>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
              {r.ingredientes.map((ing, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  alignItems: 'center', gap: 8,
                  padding: '8px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>
                      {ing.nome}
                    </div>
                    <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)' }}>
                      {ing.qtd}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: MACRO_COLORS.c }}>{ing.c}<span style={{ color: 'var(--muted-3)' }}>c</span></span>
                    <span style={{ color: MACRO_COLORS.p }}>{ing.p}<span style={{ color: 'var(--muted-3)' }}>p</span></span>
                    <span style={{ color: MACRO_COLORS.g }}>{ing.g}<span style={{ color: 'var(--muted-3)' }}>g</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modo de preparo */}
          {r.preparo && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <MonoLabel>MODO DE PREPARO</MonoLabel>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                {r.preparo}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
            {r.ytId ? (
              <button className="tappable" onClick={(e) => { e.stopPropagation(); onPlayVideo(r); }} style={{
                flex: 1, height: 38, padding: '0 14px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                borderRadius: 12, color: 'var(--text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 12.5, fontWeight: 600,
              }}>
                <Icon name="playCircle" size={15} color={acc}/>
                Ver tutorial em vídeo
              </button>
            ) : (
              <div style={{
                flex: 1, height: 38, padding: '0 14px',
                background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)',
                borderRadius: 12, color: 'var(--muted-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 12, fontStyle: 'italic',
              }}>
                Sem tutorial pra essa
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenDieta({ accent, onPlayVideo }) {
  const acc = accent || 'var(--accent)';
  const [expandedId, setExpandedId] = React.useState(DIETA.refeicoes[0]?.id || null);
  const [eaten, setEaten] = React.useState(() => new Set());

  const total = dietaTotal(DIETA);
  const alvo = DIETA.alvo;
  const kcalPct = Math.min(1, total.kcal / alvo.kcal);

  const playVideo = (refeicao) => {
    if (!refeicao.ytId) return;
    onPlayVideo?.({
      nome: refeicao.nome,
      ytId: refeicao.ytId,
      videoLabel: 'TUTORIAL · RECEITA',
      tags: [refeicao.horario, `${refeicao.kcal} kcal`, `C ${refeicao.c}g`, `P ${refeicao.p}g`],
      dicasLabel: 'NOTAS DA NUTRICIONISTA',
      dicas: refeicao.preparo,
    });
  };

  const eatenCount = eaten.size;
  const eatenKcal = DIETA.refeicoes.filter(r => eaten.has(r.id)).reduce((a, r) => a + r.kcal, 0);

  return (
    <ScreenWrap>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.16em' }}>
            DIETA · QUI 21 MAI
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', marginTop: 2, lineHeight: 1 }}>
            Plano de hoje
          </div>
        </div>
        <button className="tappable" style={{
          width: 42, height: 42, borderRadius: 21,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
          color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="calendar" size={18}/>
        </button>
      </div>

      {/* Card de macros totais */}
      <div style={{ padding: '0 20px 18px' }}>
        <Card padding={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <MonoLabel>CALORIAS</MonoLabel>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38,
                  letterSpacing: '-0.04em', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>{total.kcal}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted-2)' }}>
                  /{alvo.kcal} kcal
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
                {Math.round(kcalPct * 100)}% do alvo · {total.kcal - alvo.kcal > 0 ? `+${total.kcal - alvo.kcal}` : alvo.kcal - total.kcal} kcal {total.kcal > alvo.kcal ? 'acima' : 'restantes'}
              </div>
            </div>
            <div style={{
              padding: '6px 10px',
              background: `${acc}18`, border: `1px solid ${acc}40`,
              borderRadius: 10,
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: acc, letterSpacing: '0.08em',
            }}>
              HIPERTROFIA
            </div>
          </div>

          {/* Stacked overall split */}
          <div style={{ marginBottom: 16 }}>
            <MacroSplit c={total.c} p={total.p} g={total.g} height={8}/>
          </div>

          {/* Macros bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MacroBar label="CARBOIDRATO" value={total.c} target={alvo.c} color={MACRO_COLORS.c}/>
            <MacroBar label="PROTEÍNA"    value={total.p} target={alvo.p} color={MACRO_COLORS.p}/>
            <MacroBar label="GORDURA"     value={total.g} target={alvo.g} color={MACRO_COLORS.g}/>
          </div>
        </Card>
      </div>

      {/* Refeições */}
      <SectionTitle action={`${eatenCount}/${DIETA.refeicoes.length} feitas`}>
        <span>Refeições</span>
      </SectionTitle>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DIETA.refeicoes.map(r => (
          <MealCard key={r.id}
            refeicao={r}
            expanded={expandedId === r.id}
            onToggle={() => setExpandedId(prev => prev === r.id ? null : r.id)}
            onPlayVideo={playVideo}
            accent={acc}
            eaten={eaten.has(r.id)}
            onToggleEaten={() => {
              setEaten(prev => {
                const n = new Set(prev);
                if (n.has(r.id)) n.delete(r.id); else n.add(r.id);
                return n;
              });
            }}
          />
        ))}
      </div>

      {/* Crédito + contato direto com a nutri */}
      <div style={{ padding: '18px 20px 12px' }}>
        {(() => {
          const nutri = ALUNO.nutricionista;
          const telDigits = (nutri.telefone || '').replace(/\D/g, '');
          const ok = telDigits.length >= 10;
          const url = ok
            ? `https://wa.me/${telDigits}?text=${encodeURIComponent('Oi Dra. Marina! Tenho uma dúvida sobre o plano alimentar.')}`
            : '#';
          return (
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 14px 12px',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: '#6dffb0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="body" size={20} strokeWidth={1.8}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <MonoLabel>NUTRICIONISTA</MonoLabel>
                  <div style={{
                    marginTop: 2,
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                    letterSpacing: '-0.01em',
                  }}>{nutri.nome}</div>
                </div>
              </div>
              <a href={url}
                 target="_blank" rel="noopener noreferrer"
                 onClick={e => { if (!ok) e.preventDefault(); }}
                 style={{
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                   height: 46,
                   background: ok ? '#25D366' : 'var(--surface-2)',
                   color: ok ? '#fff' : 'var(--muted-2)',
                   fontWeight: 700, fontSize: 13.5,
                   textDecoration: 'none',
                   borderTop: '1px solid var(--border)',
                   opacity: ok ? 1 : 0.6,
                   cursor: ok ? 'pointer' : 'not-allowed',
                 }}>
                <Icon name="chat" size={16} strokeWidth={2}/>
                Entrar em contato
              </a>
            </Card>
          );
        })()}
      </div>

      <div style={{ height: 8 }}/>
    </ScreenWrap>
  );
}

Object.assign(window, { ScreenDieta, MealCard, MacroBar, MacroSplit, MACRO_COLORS });
