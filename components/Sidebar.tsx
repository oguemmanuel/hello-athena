'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/products', label: '👗 Products' },
  { href: '/admin/sales', label: '💰 Sales History' },
  { href: '/admin/reports', label: '📈 Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    router.push('/pos')
  }

  return (
    <aside style={{
      width: 220, minHeight: '100vh', backgroundColor: '#111',
      borderRight: '1px solid #2A2A2A', padding: '24px 0', display: 'flex',
      flexDirection: 'column', position: 'fixed', top: 0, left: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 32px', borderBottom: '1px solid #2A2A2A' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Admin</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C', letterSpacing: 1 }}>Hello Athena</div>
      </div>

      {/* Nav Links */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {links.map(link => {
          const active = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'block', padding: '10px 12px', marginBottom: 4,
              borderRadius: 8, textDecoration: 'none', fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? '#C9A84C' : '#ccc',
              backgroundColor: active ? '#C9A84C18' : 'transparent',
              borderLeft: active ? '3px solid #C9A84C' : '3px solid transparent',
              transition: 'all 0.15s'
            }}>
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid #2A2A2A' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #ef4444',
            color: '#ef4444',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Back to POS
        </button>
      </div>
    </aside>
  )
}
