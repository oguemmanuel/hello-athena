"use client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  size?: string;
  code?: string;
};
type CartItem = Product & { quantity: number };

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "momo">("cash");
  const [lastSale, setLastSale] = useState<{
    receiptNumber: string;
    total: number;
    items: CartItem[];
    paymentMethod: string;
    date: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [outOfStockProduct, setOutOfStockProduct] = useState<Product | null>(
    null,
  );
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase())),
  );

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      setOutOfStockProduct(product);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }
    const product = products.find((p) => p.id === id);
    if (product && qty > product.stock) return;
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    );
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            price: i.price,
          })),
          paymentMethod,
        }),
      });
      const sale = await res.json();
      if (sale.error) {
        toast.error(sale.error);
        setLoading(false);
        return;
      }
      toast.success("Order completed successfully!");
      setLastSale({
        receiptNumber: sale.receiptNumber,
        total: sale.total,
        items: [...cart],
        paymentMethod,
        date: new Date().toLocaleString(),
      });
      setCart([]);
      fetch("/api/products")
        .then((r) => r.json())
        .then(setProducts);
    } catch {
      toast.error("Checkout failed. Try again.");
    }
    setLoading(false);
  };

  const handleAdminLogin = () => {
    if (adminPassword === "REDACTED") {
      localStorage.setItem("adminAuth", "true");
      window.location.href = "/admin";
    } else {
      toast.error("Incorrect admin password");
      setAdminPassword("");
    }
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const win = window.open("", "_blank", "width=300,height=600");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page { margin: 0; size: 58mm auto; }
            * { box-sizing: border-box; }
            body { font-family: monospace; font-size: 11px; width: 54mm; margin: 0; padding: 4px; color: #000; background: #fff; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: 24,
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Admin & History Buttons */}
      <div style={{ position: "fixed", top: 16, right: 16, display: "flex", gap: 8, zIndex: 40 }}>
        <a
          href="/pos/transactions"
          style={{
            padding: "6px 12px",
            backgroundColor: "transparent",
            border: "1px solid #C9A84C88",
            color: "#C9A84C",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          📋 History
        </a>
        <button
          onClick={() => setShowAdminLogin(true)}
          style={{
            padding: "6px 12px",
            backgroundColor: "transparent",
            border: "1px solid #C9A84C88",
            color: "#C9A84C",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          🔐 Admin
        </button>
      </div>

      {/* LEFT: Product Grid */}
      <div style={{ overflow: "auto" }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#C9A84C",
            marginBottom: 16,
          }}
        >
          Point of Sale
        </h1>
        <input
          className="input-field"
          placeholder="🔍 Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                backgroundColor: "#1A1A1A",
                border: `1px solid ${p.stock === 0 ? "#3A1A1A" : "#2A2A2A"}`,
                borderRadius: 10,
                padding: 14,
                cursor: p.stock === 0 ? "not-allowed" : "pointer",
                opacity: p.stock === 0 ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (p.stock > 0)
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "#C9A84C";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  p.stock === 0 ? "#3A1A1A" : "#2A2A2A";
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#888",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {p.category}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                {p.name}
              </div>
              {p.size && (
                <div style={{ fontSize: 11, color: "#666" }}>
                  Size: {p.size}
                </div>
              )}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#C9A84C", fontWeight: 700 }}>
                  GHS {p.price.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 20,
                    backgroundColor: p.stock <= 5 ? "#7f1d1d44" : "#14532d44",
                    color: p.stock <= 5 ? "#f87171" : "#4ade80",
                  }}
                >
                  {p.stock === 0 ? "Out" : `${p.stock} left`}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1/-1",
                padding: 40,
                textAlign: "center",
                color: "#555",
              }}
            >
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div
        style={{
          backgroundColor: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{ padding: "16px 20px", borderBottom: "1px solid #2A2A2A" }}
        >
          <h2 style={{ margin: 0, fontSize: 16, color: "#C9A84C" }}>
            🛒 Cart ({cart.length})
          </h2>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
          {cart.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "#555",
                fontSize: 14,
              }}
            >
              Click products to add them
            </div>
          )}
          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #222",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#C9A84C" }}>
                  GHS {item.price.toFixed(2)} each
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  style={{
                    width: 26,
                    height: 26,
                    backgroundColor: "#2A2A2A",
                    border: "none",
                    color: "white",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  −
                </button>
                <span
                  style={{ fontSize: 14, minWidth: 20, textAlign: "center" }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  style={{
                    width: 26,
                    height: 26,
                    backgroundColor: "#2A2A2A",
                    border: "none",
                    color: "white",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  +
                </button>
              </div>
              <div
                style={{
                  minWidth: 70,
                  textAlign: "right",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                GHS {(item.price * item.quantity).toFixed(2)}
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #2A2A2A" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "#888" }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#C9A84C" }}>
              GHS {total.toFixed(2)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["cash", "card", "momo"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: paymentMethod === m ? "#C9A84C" : "#2A2A2A",
                  color: paymentMethod === m ? "black" : "#aaa",
                  border: "none",
                  transition: "all 0.15s",
                }}
              >
                {m === "cash" ? "💵 Cash" : m === "card" ? "💳 Card" : "📱 Momo"}
              </button>
            ))}
          </div>
          <button
            className="btn-gold"
            style={{ width: "100%", padding: "12px", fontSize: 15 }}
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
          >
            {loading ? "Processing..." : "✓ Complete Sale"}
          </button>
        </div>
      </div>

      {/* Out of Stock Modal */}
      {outOfStockProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "#000000cc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setOutOfStockProduct(null)}
        >
          <div
            style={{
              backgroundColor: "#1A1A1A",
              border: "1px solid #7f1d1d44",
              borderRadius: 16,
              padding: 32,
              width: 380,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#f87171", marginTop: 0, fontSize: 20 }}>
              ⚠ Out of Stock
            </h2>
            <p style={{ color: "#888", marginBottom: 24 }}>
              <strong>{outOfStockProduct.name}</strong> is currently out of
              stock.
            </p>
            <button
              className="btn-gold"
              style={{ width: "100%", padding: "12px" }}
              onClick={() => setOutOfStockProduct(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {lastSale && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "#000000cc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setLastSale(null)}
        >
          <div
            style={{
              backgroundColor: "#1A1A1A",
              border: "1px solid #C9A84C44",
              borderRadius: 16,
              padding: 32,
              width: 380,
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#C9A84C", marginTop: 0, textAlign: "center" }}>
              ✓ Sale Complete!
            </h2>
            <div
              ref={receiptRef}
              style={{
                backgroundColor: "white",
                color: "black",
                padding: 12,
                borderRadius: 8,
                fontFamily: "monospace",
                fontSize: 11,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 14,
                  marginBottom: 2,
                }}
              >
                HELLO ATHENA
              </div>
              <div
                style={{ textAlign: "center", fontSize: 9, marginBottom: 2 }}
              >
                Timeless sophistication, modern style
              </div>
              <div
                style={{ textAlign: "center", fontSize: 9, marginBottom: 2 }}
              >
                for men, women & Kids.
              </div>
              <div
                style={{ textAlign: "center", fontSize: 9, marginBottom: 2 }}
              >
                Tel: 0502146152
              </div>
              <div
                style={{ textAlign: "center", fontSize: 9, marginBottom: 6 }}
              >
                @helloathenagh
              </div>
              <div
                style={{ borderTop: "1px dashed #000", margin: "4px 0" }}
              ></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                  fontSize: 10,
                }}
              >
                <span>Receipt:</span>
                <span>{lastSale.receiptNumber}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 10,
                }}
              >
                <span>Date:</span>
                <span>{lastSale.date}</span>
              </div>
              <div
                style={{ borderTop: "1px dashed #000", margin: "4px 0" }}
              ></div>
              {lastSale.items.map((item, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 11 }}>
                    {item.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                    }}
                  >
                    <span>
                      {item.quantity} x GHS {item.price.toFixed(2)}
                    </span>
                    <span>GHS {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div
                style={{ borderTop: "1px dashed #000", margin: "4px 0" }}
              ></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: 12,
                }}
              >
                <span>TOTAL</span>
                <span>GHS {lastSale.total.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 2,
                  fontSize: 10,
                }}
              >
                <span>Payment</span>
                <span>
                  {lastSale.paymentMethod === "card" ? "Card" : lastSale.paymentMethod === "momo" ? "Momo" : "Cash"}
                </span>
              </div>
              <div
                style={{ borderTop: "1px dashed #000", margin: "6px 0" }}
              ></div>
              <div style={{ textAlign: "center", fontSize: 10 }}>
                Thank you for shopping at
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 11,
                }}
              >
                Hello Athena!
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                className="btn-gold"
                style={{ flex: 1 }}
                onClick={handlePrint}
              >
                🖨 Print Receipt
              </button>
              <button
                onClick={() => setLastSale(null)}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: "#2A2A2A",
                  border: "none",
                  color: "white",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "#000000cc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowAdminLogin(false)}
        >
          <div
            style={{
              backgroundColor: "#1A1A1A",
              border: "1px solid #C9A84C44",
              borderRadius: 12,
              padding: 32,
              width: 380,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#C9A84C", marginTop: 0, marginBottom: 8 }}>
              Admin Access
            </h2>
            <p style={{ color: "#888", marginBottom: 24 }}>
              Enter password to continue
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdminLogin();
              }}
            >
              <input
                type="password"
                className="input-field"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
                style={{ marginBottom: 16, width: "100%" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  className="btn-gold"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Enter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#2A2A2A",
                    border: "none",
                    color: "white",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
