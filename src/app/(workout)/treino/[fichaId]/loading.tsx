import { SkeletonBlock } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div role="status" aria-label="Carregando treino" style={{ padding: '56px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonBlock h={28} w="55%" r={8}/>
      <SkeletonBlock h={6} r={3} style={{ marginBottom: 8 }}/>
      {Array.from({ length: 6 }, (_, i) => <SkeletonBlock key={i} h={78} r={18}/>)}
    </div>
  )
}
