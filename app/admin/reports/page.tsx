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

  const fetchReport = async () => {
    const res = await fetch(`/api/reports?month=${month}&year=${year}`)
    setReport(await res.json())
  }

  useEffect(() => { fetchReport() }, [month, year])

  const stat = (label: string, value: string, sub?: string) => (
    <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#C9A84C' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#C9A84C', margin: 0 }}>Monthly Report</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="input-field" style={{ width: 'auto' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        Report for {MONTHS[month - 1]} {year}
      </p>

      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {stat('Total Revenue', `GHS ${report.totalRevenue.toFixed(2)}`)}
            {stat('Transactions', String(report.totalTransactions), 'sales completed')}
            {stat('Items Sold', String(report.totalItemsSold), 'pieces')}
          </div>

          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
              <h2 style={{ margin: 0, fontSize: 16, color: '#C9A84C' }}>Top Selling Products</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#111' }}>
                  {['#', 'Product', 'Qty Sold', 'Revenue'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#666', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #1f1f1f' }}>
                    <td style={{ padding: '12px 16px', color: '#555', fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>[{p.code}] {p.name}</td>
                    <td style={{ padding: '12px 16px', color: '#ccc' }}>{p.quantity}</td>
                    <td style={{ padding: '12px 16px', color: '#C9A84C', fontWeight: 600 }}>GHS {p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {report.topProducts.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#555' }}>No sales this month yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
