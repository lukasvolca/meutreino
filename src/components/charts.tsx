// Mirrors prototype/src/charts.jsx — pure SVG charts, no dependencies

// ----- Sparkline (inline mini chart used in exercise cards)
export function Sparkline({ data, width = 70, height = 28, color, fill = true }: {
  data: number[], width?: number, height?: number, color?: string, fill?: boolean
}) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2
  const points = data.map((v, i) => ({
    x: pad + (i / Math.max(1, data.length - 1)) * w,
    y: pad + h - ((v - min) / range) * h,
  }))
  const d = points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x},${p.y}` : ` L ${p.x},${p.y}`), '')
  const c = color || 'var(--accent)'
  const last = points[points.length - 1]
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && (
        <path d={`${d} L ${last.x},${height} L ${points[0].x},${height} Z`} fill={c} opacity="0.12"/>
      )}
      <path d={d} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last.x} cy={last.y} r="2.2" fill={c}/>
    </svg>
  )
}

// ----- Bar chart (volume per week)
export function BarChart({ data, labels, width = 360, height = 90, color, responsive }: {
  data: number[], labels?: string[], width?: number, height?: number, color?: string, responsive?: boolean
}) {
  const c = color || 'var(--accent)'
  const padL = 0, padR = 0, padT = 16, padB = 20
  const w = width - padL - padR
  const h = height - padT - padB
  const max = (Math.max(...data) || 1) * 1.1
  const barW = (w / data.length) * 0.65
  const gap = (w / data.length) * 0.35
  const svgProps = responsive
    ? { viewBox: `0 0 ${width} ${height}`, style: { display: 'block', overflow: 'visible', width: '100%', height: 'auto' } as React.CSSProperties }
    : { width, height, style: { display: 'block', overflow: 'visible' } as React.CSSProperties }
  return (
    <svg {...svgProps}>
      <line x1={padL} y1={padT + h} x2={padL + w} y2={padT + h} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      {data.map((v, i) => {
        const bh = (v / max) * h
        const x = padL + (w / data.length) * i + gap / 2
        const y = padT + h - bh
        const last = i === data.length - 1
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="3"
              fill={last ? c : 'rgba(255,255,255,0.22)'}
              style={last ? { filter: `drop-shadow(0 0 6px ${c}60)` } : {}}/>
            {last && v > 0 && (
              <text x={x + barW / 2} y={y - 5} fill={c} fontSize="9" fontWeight="700"
                textAnchor="middle" fontFamily="var(--font-mono)">{(v / 1000).toFixed(1)}k</text>
            )}
          </g>
        )
      })}
      {labels && [0, Math.floor((labels.length - 1) / 2), labels.length - 1].map(i => {
        const x = padL + (w / data.length) * i + (w / data.length) / 2
        return <text key={i} x={x} y={padT + h + 13} fill="rgba(255,255,255,0.4)" fontSize="9"
          textAnchor="middle" fontFamily="var(--font-mono)">{labels[i]}</text>
      })}
    </svg>
  )
}

// ----- Large line chart with axes (used in Progresso, Corpo)
export function LineChart({ data, labels, width = 340, height = 180, color, unit = 'kg', chartId = 'chart', responsive }: {
  data: number[], labels?: string[], width?: number, height?: number,
  color?: string, unit?: string, chartId?: string, responsive?: boolean
}) {
  if (!data.length) return null
  const acc = color || 'var(--accent)'
  const padL = 36, padR = 16, padT = 16, padB = 28
  const w = width - padL - padR
  const h = height - padT - padB
  const min = Math.floor(Math.min(...data) * 0.95)
  const max = Math.ceil(Math.max(...data) * 1.05)
  const range = max - min || 1
  const points = data.map((v, i) => ({
    x: padL + (i / Math.max(1, data.length - 1)) * w,
    y: padT + h - ((v - min) / range) * h,
    v,
  }))
  const d = points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x},${p.y}` : ` L ${p.x},${p.y}`), '')
  const lastP = points[points.length - 1]
  const firstP = points[0]
  const gridY = 4
  const gradId = `grad-${chartId}`

  const svgLineProps = responsive
    ? { viewBox: `0 0 ${width} ${height}`, style: { display: 'block', overflow: 'visible', width: '100%', height: 'auto' } as React.CSSProperties }
    : { width, height, style: { display: 'block', overflow: 'visible' } as React.CSSProperties }
  return (
    <svg {...svgLineProps}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={acc} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={acc} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {Array.from({ length: gridY + 1 }, (_, i) => {
        const y = padT + (h / gridY) * i
        const v = Math.round(max - (range / gridY) * i)
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + w} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
              strokeDasharray={i === gridY ? '0' : '2,4'}/>
            <text x={padL - 8} y={y + 3} fill="rgba(255,255,255,0.32)" fontSize="9"
              textAnchor="end" fontFamily="var(--font-mono)">{v}</text>
          </g>
        )
      })}
      <path d={`${d} L ${lastP.x},${padT + h} L ${firstP.x},${padT + h} Z`}
        fill={`url(#${gradId})`}/>
      <path d={d} fill="none" stroke={acc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${acc}80)` }}/>
      {points.map((p, i) => (
        <g key={i}>
          {i === points.length - 1 && <circle cx={p.x} cy={p.y} r="8" fill={acc} opacity="0.18"/>}
          <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5}
            fill={i === points.length - 1 ? acc : 'var(--bg-app)'}
            stroke={acc} strokeWidth="1.5"/>
        </g>
      ))}
      <text x={lastP.x + 10} y={lastP.y + 4}
        fill={acc} fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">{lastP.v}{unit}</text>
      {labels && labels.length > 1 && [0, Math.floor((labels.length - 1) / 2), labels.length - 1].map(i => (
        <text key={i} x={points[i].x} y={padT + h + 16} fill="rgba(255,255,255,0.42)" fontSize="9"
          textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
          fontFamily="var(--font-mono)">{labels[i]}</text>
      ))}
    </svg>
  )
}

// ----- Ring progress
export function Ring({ size = 120, stroke = 10, value = 0.7, color, label, sublabel }: {
  size?: number, stroke?: number, value?: number, color?: string, label?: string, sublabel?: string
}) {
  const c = color || 'var(--accent)'
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  const off = C * (1 - value)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}/>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${c}70)` }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: '-0.02em' }}>{label}</div>
        {sublabel && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-2)', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{sublabel}</div>}
      </div>
    </div>
  )
}

// ----- Heatmap (calendar style for histórico)
export function Heatmap({ data, weeks = 12, color }: {
  data: number[], weeks?: number, color?: string
}) {
  const c = color || 'var(--accent)'
  const cellSize = 12, gap = 3, cols = weeks, rows = 7
  const w = cols * (cellSize + gap)
  const h = rows * (cellSize + gap)
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
  return (
    <svg width={w + 16} height={h + 4} style={{ display: 'block' }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const col = Math.floor(i / rows)
        const row = i % rows
        const v = data[i] || 0
        return (
          <rect key={i}
            x={col * (cellSize + gap) + 16}
            y={row * (cellSize + gap)}
            width={cellSize} height={cellSize} rx="3"
            fill={v > 0 ? c : 'rgba(255,255,255,0.06)'}
            opacity={v > 0 ? 0.25 + v * 0.75 : 1}/>
        )
      })}
      {[1, 3, 5].map(r => (
        <text key={r} x={0} y={r * (cellSize + gap) + 9}
          fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="var(--font-mono)">{days[r]}</text>
      ))}
    </svg>
  )
}
