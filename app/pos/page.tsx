"use client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getDiscountPercent, getDiscountedPrice } from "@/lib/discount";
import { printHtmlDocument } from "@/lib/print";

type Product = { id: number; name: string; category: string; price: number; stock: number; size?: string; code?: string };
type CartItem = Product & { quantity: number; unitPrice: number; discountPercent: number };

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "momo">("cash");
  const [lastSale, setLastSale] = useState<{ receiptNumber: string; total: number; items: CartItem[]; paymentMethod: string; date: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [outOfStockProduct, setOutOfStockProduct] = useState<Product | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(setProducts);
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    if (product.stock === 0) { setOutOfStockProduct(product); return; }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      const discountPercent = getDiscountPercent(product.category, product.code);
      const unitPrice = getDiscountedPrice(product.price, discountPercent);
      return [...prev, { ...product, quantity: 1, unitPrice, discountPercent }];
    });
    toast.success(`${product.name} added`, { duration: 1500 });
  };

  const updateQty = (id: number, qty: number) => {
    if (qty < 1) { removeFromCart(id); return; }
    const product = products.find(p => p.id === id);
    if (product && qty > product.stock) return;
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));
  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.unitPrice, originalPrice: i.price, discountPercent: i.discountPercent })),
          paymentMethod,
        }),
      });
      const sale = await res.json();
      if (sale.error) { toast.error(sale.error); setLoading(false); return; }
      toast.success("Sale completed!");
      setLastSale({ receiptNumber: sale.receiptNumber, total: sale.total, items: [...cart], paymentMethod, date: new Date().toLocaleString() });
      setCart([]);
      fetch("/api/products").then(r => r.json()).then(setProducts);
    } catch { toast.error("Checkout failed. Try again."); }
    setLoading(false);
  };

  const handleAdminLogin = () => {
    if (adminPassword === "REDACTED") {
      localStorage.setItem("adminAuth", "true");
      window.location.href = "/admin";
    } else {
      toast.error("Incorrect password");
      setAdminPassword("");
    }
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const styles = `@page{margin:0;size:58mm auto}*{box-sizing:border-box}body{font-family:monospace;font-size:11px;width:54mm;margin:0;padding:4px;color:#000;background:#fff}.center{text-align:center}.bold{font-weight:bold}.divider{border-top:1px dashed #000;margin:4px 0}.row{display:flex;justify-content:space-between;margin:2px 0}`;
    printHtmlDocument("Receipt", styles, content);
  };

  const paymentOptions = [
    { key: 'cash', label: '💵 Cash' },
    { key: 'card', label: '💳 Card' },
    { key: 'momo', label: '📱 Momo' },
  ] as const;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, height: 'calc(100vh - 92px)' }}>

      {/* TOP RIGHT BUTTONS */}
      <div style={{ position: 'fixed', top: 10, right: 20, display: 'flex', gap: 8, zIndex: 40 }}>
        <a href="/pos/transactions" style={{
          padding: '5px 14px', backgroundColor: 'transparent',
          border: '1px solid #2A2A2A', color: '#888', borderRadius: 6,
          cursor: 'pointer', fontSize: 12, fontWeight: 500, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
        }}>📋 History</a>
        <button onClick={() => setShowAdminLogin(true)} style={{
          padding: '5px 14px', backgroundColor: 'transparent',
          border: '1px solid #2A2A2A', color: '#888', borderRadius: 6,
          cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}>🔐 Admin</button>
      </div>

      {/* LEFT: Product Grid */}
      <div style={{ overflow: 'auto', paddingRight: 4 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#E8C96A', margin: '0 0 12px', letterSpacing: -0.3 }}>Point of Sale</h1>
          <input
            className="input-field"
            placeholder="🔍  Search by name, code or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 13 }}
          />
        </div>

        {/* Category summary */}
        {search === '' && (
          <div style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>
            {filtered.length} products · {products.filter(p => p.stock === 0).length} out of stock
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
          {filtered.map(p => {
            const discountPercent = getDiscountPercent(p.category, p.code);
            const discountedPrice = getDiscountedPrice(p.price, discountPercent);
            return (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                backgroundColor: '#141414',
                border: `1px solid ${p.stock === 0 ? '#2A1A1A' : '#222'}`,
                borderRadius: 10,
                padding: '12px 14px',
                cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                opacity: p.stock === 0 ? 0.45 : 1,
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (p.stock > 0) {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = '#C9A84C66'
                  el.style.backgroundColor = '#181818'
                  el.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = p.stock === 0 ? '#2A1A1A' : '#222'
                el.style.backgroundColor = '#141414'
                el.style.transform = 'translateY(0)'
              }}
            >
              {/* Category + Code */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{
                  fontSize: 10, color: '#C9A84C', textTransform: 'uppercase',
                  letterSpacing: 0.8, fontWeight: 600, opacity: 0.8,
                }}>{p.category}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {discountPercent > 0 && <span style={{
                    fontSize: 10, color: '#000', fontWeight: 700,
                    backgroundColor: '#4ade80', padding: '1px 6px', borderRadius: 4,
                  }}>-{discountPercent}%</span>}
                  {p.code && <span style={{
                    fontSize: 10, color: '#888', fontFamily: 'monospace',
                    backgroundColor: '#1E1E1E', padding: '1px 6px', borderRadius: 4,
                  }}>{p.code}</span>}
                </div>
              </div>

              {/* Name */}
              <div style={{ fontWeight: 600, fontSize: 13, color: '#E0E0E0', marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>

              {/* Size */}
              {p.size && <div style={{ fontSize: 11, color: '#777', marginBottom: 6 }}>Size: {p.size}</div>}

              {/* Price + Stock */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {discountPercent > 0 ? (
                  <span>
                    <span style={{ color: '#666', fontSize: 11, textDecoration: 'line-through', marginRight: 5 }}>GHS {p.price.toFixed(2)}</span>
                    <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 14 }}>GHS {discountedPrice.toFixed(2)}</span>
                  </span>
                ) : (
                  <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 14 }}>GHS {p.price.toFixed(2)}</span>
                )}
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                  backgroundColor: p.stock === 0 ? '#7f1d1d33' : p.stock <= 5 ? '#78350f33' : '#14532d22',
                  color: p.stock === 0 ? '#f87171' : p.stock <= 5 ? '#fbbf24' : '#4ade80',
                }}>
                  {p.stock === 0 ? 'Out' : `${p.stock}`}
                </span>
              </div>
            </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '48px 0', textAlign: 'center', color: '#444', fontSize: 14 }}>
              No products found for "{search}"
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div style={{
        backgroundColor: '#111', border: '1px solid #1E1E1E', borderRadius: 12,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Cart header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1E1E1E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E0E0E0' }}>
            Cart <span style={{ color: '#555', fontWeight: 400 }}>({cart.length})</span>
          </h2>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} style={{
              background: 'none', border: 'none', color: '#555', cursor: 'pointer',
              fontSize: 11, fontFamily: 'inherit', padding: '2px 6px',
            }}>Clear all</button>
          )}
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
          {cart.length === 0 && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#333', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
              Tap products to add them
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 6px', borderBottom: '1px solid #1A1A1A',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#D0D0D0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                {item.discountPercent > 0 ? (
                  <div style={{ fontSize: 11, marginTop: 1 }}>
                    <span style={{ color: '#666', textDecoration: 'line-through', marginRight: 5 }}>GHS {item.price.toFixed(2)}</span>
                    <span style={{ color: '#4ade80' }}>GHS {item.unitPrice.toFixed(2)} (-{item.discountPercent}%)</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#C9A84C', marginTop: 1 }}>GHS {item.unitPrice.toFixed(2)}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{
                  width: 24, height: 24, backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A',
                  color: '#aaa', borderRadius: 5, cursor: 'pointer', fontSize: 15, lineHeight: 1,
                }}>−</button>
                <span style={{ fontSize: 13, minWidth: 22, textAlign: 'center', color: '#E0E0E0' }}>{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{
                  width: 24, height: 24, backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A',
                  color: '#aaa', borderRadius: 5, cursor: 'pointer', fontSize: 15, lineHeight: 1,
                }}>+</button>
              </div>
              <div style={{ minWidth: 64, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#E0E0E0', flexShrink: 0 }}>
                GHS {(item.unitPrice * item.quantity).toFixed(2)}
              </div>
              <button onClick={() => removeFromCart(item.id)} style={{
                background: 'none', border: 'none', color: '#3A3A3A', cursor: 'pointer',
                fontSize: 14, padding: '0 2px', flexShrink: 0, transition: 'color 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#3A3A3A'}
              >✕</button>
            </div>
          ))}
        </div>

        {/* Checkout */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1E1E1E' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ color: '#666', fontSize: 13 }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#E8C96A', letterSpacing: -0.5 }}>GHS {total.toFixed(2)}</span>
          </div>

          {/* Payment method */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {paymentOptions.map(m => (
              <button key={m.key} onClick={() => setPaymentMethod(m.key)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 7, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                backgroundColor: paymentMethod === m.key ? '#C9A84C' : '#1A1A1A',
                color: paymentMethod === m.key ? '#000' : '#666',
                border: `1px solid ${paymentMethod === m.key ? '#C9A84C' : '#282828'}`,
                transition: 'all 0.15s',
              }}>
                {m.label}
              </button>
            ))}
          </div>

          <button
            className="btn-gold"
            style={{ width: '100%', padding: '12px', fontSize: 14, borderRadius: 9 }}
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
          >
            {loading ? 'Processing...' : '✓  Complete Sale'}
          </button>
        </div>
      </div>

      {/* Out of Stock Modal */}
      {outOfStockProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setOutOfStockProduct(null)}>
          <div style={{ backgroundColor: '#161616', border: '1px solid #2A1A1A', borderRadius: 14, padding: 32, width: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: '#f87171', marginTop: 0, fontSize: 18, marginBottom: 8 }}>Out of Stock</h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}><strong style={{ color: '#aaa' }}>{outOfStockProduct.name}</strong> is currently out of stock.</p>
            <button className="btn-gold" style={{ width: '100%', padding: '10px' }} onClick={() => setOutOfStockProduct(null)}>OK</button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {lastSale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setLastSale(null)}>
          <div style={{ backgroundColor: '#161616', border: '1px solid #C9A84C33', borderRadius: 14, padding: 28, width: 380, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              <h2 style={{ color: '#E8C96A', margin: 0, fontSize: 18 }}>Sale Complete!</h2>
            </div>
            <div ref={receiptRef} style={{ backgroundColor: 'white', color: 'black', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 11 }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>HELLO ATHENA</div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>Timeless sophistication, modern style</div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>for men, women & Kids.</div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>Tel: 0502146152</div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 6 }}>@helloathenagh</div>
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 10 }}><span>Receipt:</span><span>{lastSale.receiptNumber}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 10 }}><span>Date:</span><span>{lastSale.date}</span></div>
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
              {lastSale.items.map((item, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 11 }}>{item.name}</div>
                  {item.discountPercent > 0 && (
                    <div style={{ fontSize: 9 }}>Was GHS {item.price.toFixed(2)} (-{item.discountPercent}%)</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span>{item.quantity} x GHS {item.unitPrice.toFixed(2)}</span>
                    <span>GHS {(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 12 }}><span>TOTAL</span><span>GHS {lastSale.total.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 10 }}><span>Payment</span><span>{lastSale.paymentMethod === 'card' ? 'Card' : lastSale.paymentMethod === 'momo' ? 'Momo' : 'Cash'}</span></div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}>*** ALL SALES ARE FINAL - NO REFUNDS ***</div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 10 }}>Thank you for shopping at</div>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 11 }}>Hello Athena!</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-gold" style={{ flex: 1 }} onClick={handlePrint}>🖨 Print Receipt</button>
              <button onClick={() => setLastSale(null)} style={{ flex: 1, padding: '9px', backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A', color: '#aaa', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>New Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowAdminLogin(false)}>
          <div style={{ backgroundColor: '#161616', border: '1px solid #C9A84C33', borderRadius: 14, padding: 32, width: 360 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#E8C96A', marginTop: 0, marginBottom: 4, fontSize: 18 }}>Admin Access</h2>
            <p style={{ color: '#555', marginBottom: 24, fontSize: 13 }}>Enter your password to continue</p>
            <form onSubmit={e => { e.preventDefault(); handleAdminLogin(); }}>
              <input type="password" className="input-field" placeholder="Password" value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)} autoFocus style={{ marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-gold" style={{ flex: 1, padding: '10px' }}>Enter</button>
                <button type="button" onClick={() => { setShowAdminLogin(false); setAdminPassword(''); }}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#1E1E1E', border: '1px solid #2A2A2A', color: '#aaa', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>
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
