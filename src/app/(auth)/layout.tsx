export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-page px-4"
      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(204,255,0,0.06), transparent 60%), #060608' }}>
      {children}
    </div>
  )
}
