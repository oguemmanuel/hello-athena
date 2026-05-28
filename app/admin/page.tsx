'use client'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — manage your store below</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { href: '/admin/products', icon: '◫', label: 'Products', desc: 'Add, edit & manage inventory', color: '#C9A84C' },
          { href: '/admin/sales', icon: '◈', label: 'Sales History', desc: 'View all transactions', color: '#60a5fa' },
          { href: '/admin/reports', icon: '◉', label: 'Reports', desc: 'Monthly analytics & insights', color: '#4ade80' },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            style={{
              backgroundColor: '#141414',
              border: '1px solid #222',
              borderRadius: 14,
              padding: '24px 22px',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'block',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = item.color + '55'
              el.style.backgroundColor = '#181818'
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = `0 8px 24px ${item.color}15`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = '#222'
              el.style.backgroundColor = '#141414'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              backgroundColor: item.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginBottom: 16, color: item.color,
            }}>{item.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#F0F0F0', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.4 }}>{item.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
