export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0A0A0A' }}>
      {/* Top Header Bar */}
      <header style={{
        height: 52,
        backgroundColor: '#111',
        borderBottom: '1px solid #1E1E1E',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#000',
          }}>H</div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#E8C96A', letterSpacing: 0.5 }}>HELLO ATHENA</span>
            <span style={{ fontSize: 11, color: '#444', marginLeft: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Point of Sale</span>
          </div>
        </div>
      </header>
      <main style={{ padding: '20px 28px', flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
