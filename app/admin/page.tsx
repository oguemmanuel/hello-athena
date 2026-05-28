'use client'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#C9A84C', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: '#666', fontSize: 14, margin: '8px 0 0' }}>Manage your store</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('adminAuth')
            router.push('/pos')
          }}
          style={{
            padding: '10px 16px',
            backgroundColor: '#ef4444',
            border: 'none',
            color: 'white',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ← Back to POS
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { href: '/admin/products', icon: '👗', label: 'Products', desc: 'Add, edit, delete items' },
          { href: '/admin/sales', icon: '💰', label: 'Sales', desc: 'View all transactions' },
          { href: '/admin/reports', icon: '📊', label: 'Reports', desc: 'Monthly analytics' },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: 12,
              padding: 24,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = '#C9A84C'
              el.style.boxShadow = '0 4px 12px rgba(201, 168, 76, 0.1)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = '#2A2A2A'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#C9A84C', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{item.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
