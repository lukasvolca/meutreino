import { createClient } from '@/lib/supabase/server'
import CorpoClient from './CorpoClient'
import NovasMedidasButton from './NovasMedidasButton'

export default async function CorpoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: medidas } = await supabase
    .from('medidas')
    .select('*')
    .eq('user_id', user!.id)
    .order('data', { ascending: false })
    .limit(12)

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Nova medição button — fixed top right */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', padding: '8px 20px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <NovasMedidasButton userId={user!.id}/>
        </div>
      </div>
      <div style={{ marginTop: -52 }}>
        <CorpoClient medidas={medidas ?? []} userId={user!.id}/>
      </div>
    </div>
  )
}
