// Blocos de carregamento: aparecem na hora em que você toca numa aba,
// enquanto os dados chegam do servidor.
export function SkeletonBlock({ h, w = '100%', r = 16, style }: {
  h: number; w?: number | string; r?: number; style?: React.CSSProperties
}) {
  return (
    <div aria-hidden style={{
      position: 'relative', overflow: 'hidden',
      height: h, width: w, borderRadius: r,
      background: 'var(--surface-1)',
      ...style,
    }}>
      <div className="animate-shimmer" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
      }}/>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Carregando" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SkeletonBlock h={12} w={90} r={6}/>
      <SkeletonBlock h={30} w="60%" r={8} style={{ marginBottom: 6 }}/>
      <SkeletonBlock h={170} r={24}/>
      <div style={{ display: 'flex', gap: 10 }}>
        <SkeletonBlock h={84} style={{ flex: 1 }}/>
        <SkeletonBlock h={84} style={{ flex: 1 }}/>
        <SkeletonBlock h={84} style={{ flex: 1 }}/>
      </div>
      <SkeletonBlock h={140} r={20}/>
      <SkeletonBlock h={64}/>
      <SkeletonBlock h={64}/>
    </div>
  )
}
