// screen-perfil.jsx — Tela de Perfil
// Editar nome/foto, contatos do personal e nutricionista, info básica da conta.

// Avatar grande com câmera overlay
function ProfileAvatar({ initials, photo, onChange, size = 96 }) {
  const inputRef = React.useRef(null);
  const pickFile = () => inputRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(f);
  };
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: photo
          ? `center/cover no-repeat url("${photo}")`
          : 'linear-gradient(135deg, #2a2d36, #14161c)',
        border: '1px solid var(--border-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.36,
        color: 'var(--text)', letterSpacing: '-0.02em',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}>{!photo && initials}</div>
      <button onClick={pickFile} className="tappable" style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 32, height: 32, borderRadius: 16,
        background: 'var(--accent)', color: 'var(--accent-ink)',
        border: '3px solid var(--bg-app)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}>
        <Icon name="camera" size={14} strokeWidth={2.2}/>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile}
             style={{ display: 'none' }}/>
    </div>
  );
}

// Editable text inline
function InlineText({ value, onChange, fontSize = 22, fontWeight = 700, font = 'display', placeholder }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value || '');
  const ref = React.useRef(null);
  React.useEffect(() => { if (!editing) setDraft(value || ''); }, [value, editing]);
  React.useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);
  const commit = () => { onChange(draft); setEditing(false); };

  if (editing) {
    return (
      <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '4px 8px',
          background: 'var(--surface-2)', border: '1px solid var(--accent)',
          borderRadius: 8, color: 'var(--text)',
          fontFamily: font === 'display' ? 'var(--font-display)' : (font === 'mono' ? 'var(--font-mono)' : 'var(--font-body)'),
          fontSize, fontWeight, letterSpacing: '-0.02em',
          outline: 'none', boxSizing: 'border-box',
        }}/>
    );
  }
  return (
    <span className="tappable" onClick={() => setEditing(true)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: font === 'display' ? 'var(--font-display)' : (font === 'mono' ? 'var(--font-mono)' : 'var(--font-body)'),
      fontSize, fontWeight, letterSpacing: '-0.02em',
      color: value ? 'var(--text)' : 'var(--muted-2)',
      borderRadius: 6, padding: '2px 4px', margin: '-2px -4px',
    }}>
      {value || placeholder}
      <Icon name="edit" size={fontSize * 0.55} color="var(--muted-3)"/>
    </span>
  );
}

// Card de contato (personal / nutricionista)
function ContatoCard({ tipo, label, nome, telefone, onChangeNome, onChangeTel, accent }) {
  const acc = accent || 'var(--accent)';
  const whatsappOk = telefone && telefone.replace(/\D/g, '').length >= 10;
  const whatsappUrl = whatsappOk
    ? `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent('Oi! Tudo bem?')}`
    : '#';
  const whatsappGreen = '#25D366';

  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          color: acc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={tipo === 'personal' ? 'dumbbell' : 'body'} size={20} strokeWidth={1.8}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MonoLabel>{label.toUpperCase()}</MonoLabel>
          <div style={{ marginTop: 2 }}>
            <InlineText value={nome} onChange={onChangeNome}
              fontSize={15} fontWeight={700} font="display"
              placeholder={`Nome do ${label.toLowerCase()}`}/>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <MonoLabel>NÚMERO DO WHATSAPP</MonoLabel>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="phone" size={16} color="var(--muted-2)"/>
          <input value={telefone || ''} onChange={e => onChangeTel(e.target.value)}
            placeholder="+55 11 99999-9999"
            inputMode="tel"
            style={{
              flex: 1, height: 38, padding: '0 10px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)',
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
              letterSpacing: '0.02em',
              outline: 'none', boxSizing: 'border-box',
            }}/>
        </div>
      </div>

      <a href={whatsappUrl}
         target="_blank" rel="noopener noreferrer"
         onClick={e => { if (!whatsappOk) e.preventDefault(); }}
         style={{
           display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
           height: 48,
           background: whatsappOk ? whatsappGreen : 'var(--surface-2)',
           color: whatsappOk ? '#fff' : 'var(--muted-2)',
           fontWeight: 700, fontSize: 14,
           textDecoration: 'none',
           borderTop: '1px solid var(--border)',
           opacity: whatsappOk ? 1 : 0.6,
           cursor: whatsappOk ? 'pointer' : 'not-allowed',
         }}>
        <Icon name="chat" size={17} strokeWidth={2}/>
        Falar com {nome ? nome.split(' ')[0] : (tipo === 'personal' ? 'o personal' : 'a nutricionista')} no WhatsApp
      </a>
    </Card>
  );
}

function ScreenPerfil({ accent, onBack, finishedCount = 0 }) {
  const acc = accent || 'var(--accent)';
  const [nome, setNome] = React.useState(ALUNO.nome);
  const [photo, setPhoto] = React.useState(null);
  const [personalNome, setPersonalNome] = React.useState(ALUNO.personal.nome);
  const [personalTel, setPersonalTel] = React.useState(ALUNO.personal.telefone);
  const [nutriNome, setNutriNome] = React.useState(ALUNO.nutricionista.nome);
  const [nutriTel, setNutriTel] = React.useState(ALUNO.nutricionista.telefone);

  const iniciais = nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

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
        <MonoLabel color="var(--muted)" size={11}>PERFIL</MonoLabel>
        <div style={{ width: 40 }}/>
      </div>

      {/* Hero */}
      <div style={{
        padding: '14px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        textAlign: 'center',
      }}>
        <ProfileAvatar initials={iniciais} photo={photo} onChange={setPhoto} size={92}/>
        <div style={{ width: '100%', maxWidth: 280 }}>
          <InlineText value={nome} onChange={setNome} fontSize={24} fontWeight={800} font="display"
            placeholder="Seu nome"/>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
            CONTA ATIVA DESDE {ALUNO.desde.toUpperCase()} · {ALUNO.desdeMeses} MESES
          </div>
        </div>
      </div>

      {/* Stats minimalistas */}
      <div style={{ padding: '0 20px 18px' }}>
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <StatCell label="STREAK" value={ALUNO.streak} unit="d" color="#ffb547"/>
            <StatCell label="TREINOS" value={ALUNO.treinosTotal} unit="" border/>
            <StatCell label="OBJETIVO" value={ALUNO.objetivo.slice(0, 4)} unit="." color={acc} small/>
          </div>
        </Card>
      </div>

      {/* Section: Contatos */}
      <SectionTitle><span>Seus profissionais</span></SectionTitle>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ContatoCard
          tipo="personal" label="Personal trainer"
          nome={personalNome} telefone={personalTel}
          onChangeNome={setPersonalNome} onChangeTel={setPersonalTel}
          accent={acc}
        />
        <ContatoCard
          tipo="nutricionista" label="Nutricionista"
          nome={nutriNome} telefone={nutriTel}
          onChangeNome={setNutriNome} onChangeTel={setNutriTel}
          accent={acc}
        />
      </div>

      {/* Section: Conta */}
      <div style={{ height: 20 }}/>
      <SectionTitle><span>Conta</span></SectionTitle>
      <div style={{ padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <RowLink icon="bell" label="Notificações" hint="ligadas"/>
        <RowLink icon="info" label="Sobre o app" hint="v1.0.4"/>
        <RowLink icon="logout" label="Sair" danger/>
      </div>

      <div style={{ height: 20 }}/>
    </ScreenWrap>
  );
}

function StatCell({ label, value, unit, color, border, small }) {
  return (
    <div style={{
      padding: '14px 12px',
      borderLeft: border ? '1px solid var(--border)' : 'none',
      borderRight: border ? '1px solid var(--border)' : 'none',
      textAlign: 'center',
    }}>
      <MonoLabel>{label}</MonoLabel>
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: small ? 18 : 26, letterSpacing: '-0.02em',
          color: color || 'var(--text)', lineHeight: 1,
        }}>{value}</span>
        {unit && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function RowLink({ icon, label, hint, danger }) {
  return (
    <div className="tappable" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        color: danger ? 'var(--danger)' : 'var(--muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16}/>
      </div>
      <span style={{
        flex: 1, fontWeight: 600, fontSize: 14,
        color: danger ? 'var(--danger)' : 'var(--text)',
      }}>{label}</span>
      {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-2)' }}>{hint}</span>}
      <Icon name="chevronRight" size={16} color="var(--muted-3)"/>
    </div>
  );
}

Object.assign(window, { ScreenPerfil });
