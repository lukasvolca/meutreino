// icons.jsx — simple stroke icons, all 24x24 viewBox.

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const s = strokeWidth;
  const c = color;
  const common = { fill: 'none', stroke: c, strokeWidth: s, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z" {...common}/></>,
    dumbbell: <>
      <rect x="2" y="9" width="3" height="6" rx="1" {...common}/>
      <rect x="19" y="9" width="3" height="6" rx="1" {...common}/>
      <rect x="5" y="7" width="2" height="10" rx="1" {...common}/>
      <rect x="17" y="7" width="2" height="10" rx="1" {...common}/>
      <path d="M7 12h10" {...common}/>
    </>,
    chart: <>
      <path d="M4 19V5M4 19h16" {...common}/>
      <path d="M7 15l4-5 3 3 5-7" {...common}/>
      <circle cx="7" cy="15" r="1.2" fill={c}/>
      <circle cx="11" cy="10" r="1.2" fill={c}/>
      <circle cx="14" cy="13" r="1.2" fill={c}/>
      <circle cx="19" cy="6" r="1.2" fill={c}/>
    </>,
    body: <>
      <circle cx="12" cy="5" r="2.4" {...common}/>
      <path d="M9 9h6l1 5-2 1v6h-2v-5h-2v5H8v-6l-2-1z" {...common}/>
    </>,
    history: <>
      <path d="M3 12a9 9 0 1 0 3-6.7" {...common}/>
      <path d="M3 4v4h4" {...common}/>
      <path d="M12 8v5l3 2" {...common}/>
    </>,
    play: <><path d="M7 5l12 7-12 7z" fill={c} stroke="none"/></>,
    playCircle: <>
      <circle cx="12" cy="12" r="9" {...common}/>
      <path d="M10 8l6 4-6 4z" fill={c} stroke="none"/>
    </>,
    check: <><path d="M4 12l5 5 11-12" {...common}/></>,
    plus: <><path d="M12 4v16M4 12h16" {...common}/></>,
    minus: <><path d="M4 12h16" {...common}/></>,
    x: <><path d="M5 5l14 14M19 5L5 19" {...common}/></>,
    chevronRight: <><path d="M9 5l7 7-7 7" {...common}/></>,
    chevronLeft: <><path d="M15 5l-7 7 7 7" {...common}/></>,
    chevronDown: <><path d="M5 9l7 7 7-7" {...common}/></>,
    settings: <>
      <circle cx="12" cy="12" r="3" {...common}/>
      <path d="M19 12a7 7 0 0 0-.2-1.5l2-1.5-2-3.5-2.4.8a7 7 0 0 0-2.6-1.5L13.5 2h-3l-.3 2.8a7 7 0 0 0-2.6 1.5L5.2 5.5l-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .5.1 1 .2 1.5l-2 1.5 2 3.5 2.4-.8a7 7 0 0 0 2.6 1.5l.3 2.8h3l.3-2.8a7 7 0 0 0 2.6-1.5l2.4.8 2-3.5-2-1.5c.1-.5.2-1 .2-1.5z" {...common}/>
    </>,
    timer: <>
      <circle cx="12" cy="13" r="8" {...common}/>
      <path d="M12 9v4l2 2M9 2h6M12 5V2" {...common}/>
    </>,
    flame: <>
      <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 1-6 1-9z" {...common}/>
    </>,
    drag: <>
      <circle cx="9" cy="6" r="1.4" fill={c}/>
      <circle cx="9" cy="12" r="1.4" fill={c}/>
      <circle cx="9" cy="18" r="1.4" fill={c}/>
      <circle cx="15" cy="6" r="1.4" fill={c}/>
      <circle cx="15" cy="12" r="1.4" fill={c}/>
      <circle cx="15" cy="18" r="1.4" fill={c}/>
    </>,
    trash: <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...common}/>
    </>,
    edit: <>
      <path d="M4 20h4l11-11-4-4L4 16z" {...common}/>
      <path d="M14 5l4 4" {...common}/>
    </>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" {...common}/></>,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7" {...common}/></>,
    bolt: <><path d="M13 2L4 13h6l-1 9 9-11h-6z" {...common}/></>,
    target: <>
      <circle cx="12" cy="12" r="9" {...common}/>
      <circle cx="12" cy="12" r="5" {...common}/>
      <circle cx="12" cy="12" r="1.5" fill={c}/>
    </>,
    camera: <>
      <path d="M3 8h4l2-3h6l2 3h4v11H3z" {...common}/>
      <circle cx="12" cy="13" r="3.5" {...common}/>
    </>,
    youtube: <>
      <rect x="2" y="6" width="20" height="12" rx="3" {...common}/>
      <path d="M10 9l5 3-5 3z" fill={c} stroke="none"/>
    </>,
    search: <>
      <circle cx="11" cy="11" r="6" {...common}/>
      <path d="M16 16l4 4" {...common}/>
    </>,
    swap: <>
      <path d="M7 4v12m0 0l-3-3m3 3l3-3M17 20V8m0 0l3 3m-3-3l-3 3" {...common}/>
    </>,
    more: <>
      <circle cx="6" cy="12" r="1.5" fill={c}/>
      <circle cx="12" cy="12" r="1.5" fill={c}/>
      <circle cx="18" cy="12" r="1.5" fill={c}/>
    </>,
    pause: <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill={c} stroke="none"/>
      <rect x="14" y="5" width="4" height="14" rx="1" fill={c} stroke="none"/>
    </>,
    bell: <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7z" {...common}/>
      <path d="M10 19a2 2 0 0 0 4 0" {...common}/>
    </>,
    chat: <>
      <path d="M4 5h16v11H8l-4 4z" {...common}/>
    </>,
    phone: <>
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" {...common}/>
    </>,
    user: <>
      <circle cx="12" cy="8" r="4" {...common}/>
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" {...common}/>
    </>,
    logout: <>
      <path d="M14 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3" {...common}/>
      <path d="M10 12h11m0 0l-3-3m3 3l-3 3" {...common}/>
    </>,
    info: <>
      <circle cx="12" cy="12" r="9" {...common}/>
      <path d="M12 11v6M12 7.5v.5" {...common}/>
    </>,
    trophy: <>
      <path d="M8 4h8v4a4 4 0 0 1-8 0z" {...common}/>
      <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" {...common}/>
      <path d="M10 14h4l-1 4h-2z" {...common}/>
      <path d="M8 21h8" {...common}/>
    </>,
    calendar: <>
      <rect x="4" y="6" width="16" height="14" rx="2" {...common}/>
      <path d="M8 4v4M16 4v4M4 11h16" {...common}/>
    </>,
    apple: <>
      <path d="M12 7c-1-3 1-5 3-5 0 2-1 4-3 5z" {...common}/>
      <path d="M16 8c-2-1-3 0-4 0s-2-1-4 0c-3 1-4 6-2 10 1 2 2 3 3 3s2-1 3-1 2 1 3 1 2-1 3-3c2-4 1-9-2-10z" {...common}/>
    </>,
    flame2: <>
      <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 1-6 1-9z" {...common}/>
    </>,
    // ── fitness icons — bold filled silhouettes for ficha badges (24x24)
    // Push (peito/ombro/tríceps): vista lateral de supino — barra com anilhas, braços empurrando, corpo deitado
    benchPress: <>
      {/* Barra com anilhas (topo) */}
      <rect x="2" y="3" width="2.6" height="5.5" rx="0.8" fill={c}/>
      <rect x="19.4" y="3" width="2.6" height="5.5" rx="0.8" fill={c}/>
      <rect x="4.6" y="5" width="14.8" height="1.6" rx="0.8" fill={c}/>
      {/* Braços */}
      <rect x="10.4" y="6.6" width="1.5" height="6.8" rx="0.75" fill={c}/>
      <rect x="12.1" y="6.6" width="1.5" height="6.8" rx="0.75" fill={c}/>
      {/* Corpo deitado: cabeça + torso */}
      <circle cx="3.6" cy="16.6" r="2" fill={c}/>
      <rect x="5.2" y="15.1" width="13.6" height="3" rx="1.5" fill={c}/>
      {/* Banco */}
      <rect x="3.5" y="20" width="17" height="1.6" rx="0.6" fill={c} opacity="0.55"/>
      <rect x="5.5" y="21.6" width="2" height="1.2" rx="0.3" fill={c} opacity="0.55"/>
      <rect x="16.5" y="21.6" width="2" height="1.2" rx="0.3" fill={c} opacity="0.55"/>
    </>,
    // Pull (costas/bíceps): barra fixa + figura pendurada
    bicep: <>
      {/* Barra */}
      <rect x="2.5" y="2.4" width="19" height="2.4" rx="1" fill={c}/>
      <rect x="1.5" y="1.4" width="2.4" height="4.4" rx="0.7" fill={c}/>
      <rect x="20.1" y="1.4" width="2.4" height="4.4" rx="0.7" fill={c}/>
      {/* Mãos */}
      <rect x="7" y="4.8" width="2.2" height="2.4" rx="0.5" fill={c}/>
      <rect x="14.8" y="4.8" width="2.2" height="2.4" rx="0.5" fill={c}/>
      {/* Braços */}
      <path d="M8.1 6.8 L10.6 13.2 M15.9 6.8 L13.4 13.2"
            stroke={c} strokeWidth="1.9" strokeLinecap="round" fill="none"/>
      {/* Cabeça */}
      <circle cx="12" cy="13.8" r="2.4" fill={c}/>
      {/* Torso/pernas */}
      <path d="M9.4 16.2 Q10.2 21.6 11.6 22.5 L12.4 22.5 Q13.8 21.6 14.6 16.2 Z" fill={c}/>
    </>,
    // Legs (quadríceps/posterior/glúteo): vista frontal das pernas + pés
    squat: <>
      {/* Quadril */}
      <rect x="4" y="2.4" width="16" height="3.2" rx="1.5" fill={c}/>
      {/* Coxa esq */}
      <path d="M6 5.6 L6.5 13.6 L10.4 13.6 L10.8 5.6 Z" fill={c}/>
      {/* Coxa dir */}
      <path d="M13.2 5.6 L13.6 13.6 L17.5 13.6 L18 5.6 Z" fill={c}/>
      {/* Joelhos (detalhe sutil) */}
      <rect x="6.3" y="13.4" width="4.4" height="0.9" rx="0.3" fill={c} opacity="0.3"/>
      <rect x="13.3" y="13.4" width="4.4" height="0.9" rx="0.3" fill={c} opacity="0.3"/>
      {/* Panturrilha esq */}
      <rect x="7.2" y="14.3" width="2.8" height="5.8" rx="1.1" fill={c}/>
      {/* Panturrilha dir */}
      <rect x="14" y="14.3" width="2.8" height="5.8" rx="1.1" fill={c}/>
      {/* Pés */}
      <rect x="5" y="20.2" width="6" height="2.4" rx="0.9" fill={c}/>
      <rect x="13" y="20.2" width="6" height="2.4" rx="0.9" fill={c}/>
    </>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {paths[name] || null}
    </svg>
  );
}

Object.assign(window, { Icon });
