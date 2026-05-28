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

export default function TransactionsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then(setSales);
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1
          style={{ fontSize: 24, fontWeight: 700, color: "#C9A84C", margin: 0 }}
        >
          Transaction History
        </h1>
        <a
          href="/pos"
          style={{
            padding: "8px 16px",
            backgroundColor: "#2A2A2A",
            color: "#C9A84C",
            textDecoration: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Back to POS
        </a>
      </div>

      <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
        {sales.length} total transactions
      </p>

      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid #2A2A2A",
                backgroundColor: "#111",
              }}
            >
              {["Receipt #", "Date", "Items", "Payment", "Total", ""].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      color: "#C9A84C",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <React.Fragment key={sale.id}>
                <tr
                  style={{
                    borderBottom: "1px solid #1f1f1f",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpanded(expanded === sale.id ? null : sale.id)
                  }
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "monospace",
                      color: "#C9A84C",
                      fontSize: 13,
                    }}
                  >
                    {sale.receiptNumber}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "#888",
                      fontSize: 13,
                    }}
                  >
                    {new Date(sale.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#ccc" }}>
                    {sale.items.reduce((s, i) => s + i.quantity, 0)} items
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        backgroundColor:
                          sale.paymentMethod === "card"
                            ? "#1e3a5f"
                            : sale.paymentMethod === "momo"
                              ? "#1a2e4f"
                              : "#1a2e1a",
                        color:
                          sale.paymentMethod === "card"
                            ? "#60a5fa"
                            : sale.paymentMethod === "momo"
                              ? "#93c5fd"
                              : "#4ade80",
                      }}
                    >
                      {sale.paymentMethod === "card"
                        ? "💳 Card"
                        : sale.paymentMethod === "momo"
                          ? "📱 Momo"
                          : "💵 Cash"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    GHS {sale.total.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "#555",
                      fontSize: 12,
                    }}
                  >
                    {expanded === sale.id ? "▲" : "▼"}
                  </td>
                </tr>
                {expanded === sale.id && (
                  <tr style={{ backgroundColor: "#111" }}>
                    <td colSpan={6} style={{ padding: "12px 24px" }}>
                      <div style={{ fontSize: 13, color: "#aaa" }}>
                        {sale.items.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "4px 0",
                              borderBottom: "1px solid #1f1f1f",
                            }}
                          >
                            <span>
                              {item.product.code
                                ? `[${item.product.code}] `
                                : ""}
                              {item.product.name} × {item.quantity}
                            </span>
                            <span style={{ color: "#C9A84C" }}>
                              GHS {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {sales.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: 40, textAlign: "center", color: "#555" }}
                >
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
