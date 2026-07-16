"use client";
import React, { useEffect, useState } from "react";
import { printReceipt } from "@/lib/receipt";

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
  voided: boolean;
  voidedAt: string | null;
  voidReason: string | null;
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

const isSameDayAsNow = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

export default function TransactionsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [voiding, setVoiding] = useState<number | null>(null);
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState("");

  useEffect(() => {
    fetch("/api/sales").then((r) => r.json()).then(setSales);
  }, []);

  const handleReprint = (sale: Sale) => {
    printReceipt({
      receiptNumber: sale.receiptNumber,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt,
      voided: sale.voided,
      items: sale.items.map(i => ({ name: i.product.name, price: i.price, quantity: i.quantity })),
    });
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    const sale = voidTarget;
    setVoiding(sale.id);
    try {
      const res = await fetch(`/api/sales/${sale.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to void transaction'); return; }
      setSales(prev => prev.map(s => s.id === sale.id ? data : s));
      setVoidTarget(null);
      setVoidReason("");
    } catch {
      alert('Failed to void transaction. Please try again.');
    } finally {
      setVoiding(null);
    }
  };

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
    if (!sale.voided) grouped[idx].dayTotal += sale.total;
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
                  {['Receipt #', 'Time', 'Items', 'Payment', 'Total', '', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.sales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <tr
                      style={{ borderBottom: '1px solid #1A1A1A', cursor: 'pointer', opacity: sale.voided ? 0.55 : 1 }}
                      onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#C9A84C', fontSize: 12 }}>
                        {sale.receiptNumber}
                        {sale.voided && (
                          <span style={{ marginLeft: 8, padding: '1px 8px', borderRadius: 20, fontSize: 10, backgroundColor: '#3a1a1a', color: '#ef4444', fontFamily: 'sans-serif' }}>
                            VOIDED
                          </span>
                        )}
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
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleReprint(sale)}
                          style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 11, padding: '3px 10px' }}
                        >
                          🖨 Reprint
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        {!sale.voided && (
                          isSameDayAsNow(sale.createdAt) ? (
                            <button
                              onClick={() => { setVoidTarget(sale); setVoidReason(""); }}
                              disabled={voiding === sale.id}
                              style={{ background: 'none', border: '1px solid #3a1a1a', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: '3px 10px', opacity: voiding === sale.id ? 0.5 : 1 }}
                            >
                              {voiding === sale.id ? '...' : 'Void'}
                            </button>
                          ) : (
                            <span style={{ fontSize: 10, color: '#444' }} title="Only today's sales can be voided">—</span>
                          )
                        )}
                      </td>
                    </tr>
                    {expanded === sale.id && (
                      <tr style={{ backgroundColor: '#0F0F0F' }}>
                        <td colSpan={7} style={{ padding: '12px 24px' }}>
                          {sale.voided && (
                            <div style={{ marginBottom: 10, fontSize: 12, color: '#ef4444' }}>
                              Voided {sale.voidedAt ? new Date(sale.voidedAt).toLocaleString() : ''}
                              {sale.voidReason ? ` — reason: ${sale.voidReason}` : ''}
                            </div>
                          )}
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

      {/* Void Modal */}
      {voidTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setVoidTarget(null)}>
          <div style={{ backgroundColor: '#161616', border: '1px solid #3a1a1a', borderRadius: 14, padding: 28, width: 380 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#ef4444', marginTop: 0, marginBottom: 4, fontSize: 18 }}>Void Transaction</h2>
            <p style={{ color: '#888', marginBottom: 4, fontSize: 13 }}>
              {voidTarget.receiptNumber} · GHS {voidTarget.total.toFixed(2)}
            </p>
            <p style={{ color: '#555', marginBottom: 16, fontSize: 12.5 }}>
              This restores stock for all items and marks the sale as voided. It stays on record, flagged, for the admin to see. This cannot be undone.
            </p>
            <textarea
              className="input-field"
              placeholder="Reason for voiding (optional)"
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              autoFocus
              rows={3}
              style={{ width: '100%', resize: 'none', marginBottom: 16, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmVoid}
                disabled={voiding === voidTarget.id}
                style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13, opacity: voiding === voidTarget.id ? 0.6 : 1 }}
              >
                {voiding === voidTarget.id ? 'Voiding...' : 'Void Transaction'}
              </button>
              <button
                onClick={() => setVoidTarget(null)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A', color: '#aaa', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
