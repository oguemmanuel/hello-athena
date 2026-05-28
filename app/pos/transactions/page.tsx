"use client";
import React, { useEffect, useState } from "react";

type SaleItem = {
  quantity: number;
  price: number;
  product: { name: string; code?: string };
};
type Sale = {
  id: number;
  receiptNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
};

const paymentLabel = (m: string) => m === 'card' ? '💳 Card' : m === 'momo' ? '📱 Momo' : '💵 Cash';
const paymentStyle = (m: string) => ({
  card: { bg: '#1e3a5f', color: '#60a5fa' },
  momo: { bg: '#1a1a3f', color: '#a78bfa' },
  cash: { bg: '#14532d33', color: '#4ade80' },
} as any)[m] || { bg: '#1a1a1a', color: '#888' };

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const getDayKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export default function TransactionsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/sales").then((r) => r.json()).then(setSales);
  }, []);

  // Group sales by day
  const grouped: { label: string; dayTotal: number; sales: Sale[] }[] = [];
  const seen = new Map<string, number>();
  for (const sale of sales) {
    const key = getDayKey(sale.createdAt);
    if (!seen.has(key)) {
      seen.set(key, grouped.length);
      grouped.push({ label: formatDateLabel(sale.createdAt), dayTotal: 0, sales: [] });
    }
    const idx = seen.get(key)!;
    grouped[idx].sales.push(sale);
    grouped[idx].dayTotal += sale.total;
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#C9A84C", margin: 0 }}>Transaction History</h1>
          <p style={{ color: "#555", fontSize: 13, margin: "4px 0 0" }}>{sales.length} total transactions</p>
        </div>
        <a href="/pos" style={{
          padding: "8px 16px", backgroundColor: "#1A1A1A",
          border: "1px solid #2A2A2A", color: "#888",
          textDecoration: "none", borderRadius: 8,
          fontSize: 13, fontWeight: 500,
        }}>← Back to POS</a>
      </div>

      {sales.length === 0 && (
        <div style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: 12, padding: 48, textAlign: 'center', color: '#444' }}>
          No transactions yet.
        </div>
      )}

      {grouped.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          {/* Date divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {group.label}
            </div>
            <div style={{ flex: 1, height: 1, backgroundColor: '#1E1E1E' }} />
            <div style={{ fontSize: 11.5, color: '#555', whiteSpace: 'nowrap' }}>
              {group.sales.length} sale{group.sales.length !== 1 ? 's' : ''} · GHS {group.dayTotal.toFixed(2)}
            </div>
          </div>

          {/* Table for this day */}
          <div style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E1E1E', backgroundColor: '#0F0F0F' }}>
                  {['Receipt #', 'Time', 'Items', 'Payment', 'Total', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.sales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <tr
                      style={{ borderBottom: '1px solid #1A1A1A', cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#C9A84C', fontSize: 12 }}>
                        {sale.receiptNumber}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#666', fontSize: 13 }}>
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>
                        {sale.items.reduce((s, i) => s + i.quantity, 0)} items
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: 12,
                          backgroundColor: paymentStyle(sale.paymentMethod).bg,
                          color: paymentStyle(sale.paymentMethod).color,
                        }}>
                          {paymentLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#F0F0F0' }}>
                        GHS {sale.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#444', fontSize: 11 }}>
                        {expanded === sale.id ? '▲' : '▼'}
                      </td>
                    </tr>
                    {expanded === sale.id && (
                      <tr style={{ backgroundColor: '#0F0F0F' }}>
                        <td colSpan={6} style={{ padding: '12px 24px' }}>
                          {sale.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1A1A1A', fontSize: 13 }}>
                              <span style={{ color: '#aaa' }}>
                                {item.product.code
                                  ? <span style={{ fontFamily: 'monospace', color: '#555', marginRight: 6 }}>[{item.product.code}]</span>
                                  : null}
                                {item.product.name} <span style={{ color: '#555' }}>× {item.quantity}</span>
                              </span>
                              <span style={{ color: '#C9A84C', fontWeight: 600 }}>
                                GHS {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
