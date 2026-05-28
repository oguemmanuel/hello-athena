'use client'
import { useEffect, useState } from 'react'

type Report = {
  month: number; year: number; totalRevenue: number;
  totalTransactions: number; totalItemsSold: number;
  topProducts: { name: string; code?: string; quantity: number; revenue: number }[]
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    fetch(`/api/reports?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(setReport)
  }, [month, year])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Report</h1>
          <p className="page-subtitle">{MONTHS[month - 1]} {year}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input-field" style={{ width: 'auto' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Revenue', value: `GHS ${report.totalRevenue.toFixed(2)}`, icon: '◈', color: '#C9A84C' },
              { label: 'Transactions', value: String(report.totalTransactions), sub: 'sales completed', icon: '◉', color: '#60a5fa' },
              { label: 'Items Sold', value: String(report.totalItemsSold), sub: 'pieces', icon: '◫', color: '#4ade80' },
            ].map(s => (
              <div key={s.label} style={{
                backgroundColor: '#141414', border: '1px solid #222',
                borderRadius: 12, padding: '20px 22px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</span>
                  <span style={{ fontSize: 16, color: s.color, opacity: 0.7 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 11.5, color: '#444', marginTop: 4 }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F0F0F0' }}>Top Selling Products</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  {['#', 'Product', 'Code', 'Qty Sold', 'Revenue'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: '#444', width: 40 }}>{i + 1}</td>
                    <td style={{ fontWeight: 500, color: '#E0E0E0' }}>{p.name}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>{p.code || '—'}</span></td>
                    <td>{p.quantity}</td>
                    <td style={{ color: '#C9A84C', fontWeight: 600 }}>GHS {p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {report.topProducts.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#444' }}>No sales recorded this month.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
