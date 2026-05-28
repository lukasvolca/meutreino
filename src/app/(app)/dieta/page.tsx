export default function DietaPage() {
  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Dieta</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Em breve</p>

      <div className="flex flex-col gap-3">
        <div className="p-5 rounded-2xl text-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">🥗</div>
          <h2 className="font-bold mb-1">Plano alimentar</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            A tela de dieta com macros e refeições está sendo desenvolvida.<br/>
            Em breve você poderá registrar sua alimentação aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
