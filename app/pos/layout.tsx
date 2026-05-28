export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ padding: 32, minHeight: '100vh' }}>
      {children}
    </main>
  )
}
