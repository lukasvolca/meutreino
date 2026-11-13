'use client'

import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/session'
import { useLoad } from '@/lib/load'
import { PageSkeleton } from '@/components/Skeleton'
import CorpoClient from './CorpoClient'
import NovasMedidasButton from './NovasMedidasButton'

export default function CorpoPage() {
  const user = useUser()
  const { data: medidas } = useLoad(async () => {
    const { data } = await createClient().from('medidas').select('*')
      .eq('user_id', user.id).order('data', { ascending: false }).limit(12)
    return data ?? []
  })
  if (!medidas) return <PageSkeleton/>

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Nova medição button — fixed top right */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', padding: '8px 20px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <NovasMedidasButton userId={user.id}/>
        </div>
      </div>
      <div style={{ marginTop: -52 }}>
        <CorpoClient medidas={medidas} userId={user.id}/>
      </div>
    </div>
  )
}
