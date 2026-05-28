'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/products', label: 'Products', icon: '◫' },
  { href: '/admin/sales', label: 'Sales History', icon: '◈' },
  { href: '/admin/reports', label: 'Reports', icon: '◉' },
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
      width: 230, minHeight: '100vh', backgroundColor: '#0D0D0D',
      borderRight: '1px solid #1E1E1E', display: 'flex',
      flexDirection: 'column', position: 'fixed', top: 0, left: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #1E1E1E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#000', flexShrink: 0,
          }}>H</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E8C96A', letterSpacing: 0.5 }}>Hello Athena</div>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, color: '#333', letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 10px 8px', fontWeight: 600 }}>Navigation</div>
        {links.map(link => {
          const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', marginBottom: 2,
              borderRadius: 8, textDecoration: 'none', fontSize: 13.5,
              fontWeight: active ? 600 : 400,
              color: active ? '#E8C96A' : '#888',
              backgroundColor: active ? '#C9A84C14' : 'transparent',
              borderLeft: active ? '2px solid #C9A84C' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 14, opacity: active ? 1 : 0.5 }}>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #1E1E1E' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '9px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #2A2A2A',
            color: '#888', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#C9A84C44'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#C9A84C'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A2A'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#888'
          }}
        >
          <span>←</span> Back to POS
        </button>
      </div>
    </aside>
  )
}
