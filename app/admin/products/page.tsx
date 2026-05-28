'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type Product = {
  id: number; name: string; category: string; price: number;
  stock: number; size?: string; code?: string;
}

const empty = { name: '', category: '', price: '', stock: '', size: '', code: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    setProducts(await res.json())
  }

  useEffect(() => { fetchProducts() }, [])

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error('Product name is required')
      return false
    }
    if (!form.category.trim()) {
      toast.error('Category is required')
      return false
    }
    if (!form.price || parseFloat(form.price) < 0) {
      toast.error('Price must be a positive number')
      return false
    }
    if (!form.stock || parseInt(form.stock) < 0) {
      toast.error('Stock must be a non-negative number')
      return false
    }
    if (form.code && form.code.trim()) {
      const codeExists = products.some(p => p.code === form.code && p.id !== editing)
      if (codeExists) {
        toast.error('This product code already exists')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/api/products/${editing}` : '/api/products'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Save failed')
      }
      const action = editing ? 'updated' : 'added'
      toast.success(`Product ${action} successfully`)
      setForm(empty); setEditing(null); setShowForm(false)
      await fetchProducts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product')
    }
    setLoading(false)
  }

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), size: p.size || '', code: p.code || '' })
    setEditing(p.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Product deleted successfully')
      setDeleteModal(null)
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  )

  const s = { label: { fontSize: 12, color: '#888', marginBottom: 4, display: 'block' } as React.CSSProperties }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#C9A84C', margin: 0 }}>Products</h1>
          <p style={{ color: '#666', fontSize: 14, margin: '4px 0 0' }}>{filtered.length} of {products.length} items</p>
        </div>
        <button className="btn-gold" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(empty) }}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        className="input-field"
        placeholder="🔍 Search by name, category, or code..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, width: '100%' }}
      />

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }} onClick={() => { setShowForm(false); setEditing(null); setForm(empty) }}>
          <div style={{
            backgroundColor: '#1A1A1A', border: '1px solid #C9A84C44', borderRadius: 12, padding: 32, width: 600, maxHeight: '90vh', overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#C9A84C', marginTop: 0, fontSize: 18, marginBottom: 20 }}>{editing ? 'Edit Product' : 'Add New Product'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                ['Product Name *', 'name', 'text'],
                ['Product Code', 'code', 'text'],
                ['Category *', 'category', 'text'],
                ['Price (GHS) *', 'price', 'number'],
                ['Stock Qty *', 'stock', 'number'],
                ['Size', 'size', 'text'],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label style={s.label}>{label}</label>
                  <input
                    type={type}
                    className="input-field"
                    value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-gold" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editing ? 'Update' : 'Save'}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty) }} style={{ flex: 1, padding: '10px', backgroundColor: '#2A2A2A', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }} onClick={() => setDeleteModal(null)}>
          <div style={{
            backgroundColor: '#1A1A1A', border: '1px solid #ef444444', borderRadius: 12, padding: 32, width: 400
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#fff', marginTop: 0 }}>Delete Product?</h2>
            <p style={{ color: '#888', marginBottom: 24 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => handleDelete(deleteModal)} style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Delete
              </button>
              <button onClick={() => setDeleteModal(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#2A2A2A', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A', backgroundColor: '#111' }}>
              {['Product', 'Code', 'Category', 'Price', 'Stock', 'Size', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#C9A84C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1f1f1f', backgroundColor: idx % 2 === 0 ? 'transparent' : '#0A0A0A' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: 13, fontFamily: 'monospace' }}>{p.code || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{p.category}</td>
                <td style={{ padding: '12px 16px', color: '#C9A84C', fontWeight: 600 }}>GHS {p.price.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    backgroundColor: p.stock <= 5 ? '#7f1d1d44' : '#14532d44',
                    color: p.stock <= 5 ? '#f87171' : '#4ade80'
                  }}>
                    {p.stock <= 5 && '⚠ '}{p.stock}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{p.size || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleEdit(p)} style={{ marginRight: 8, background: 'none', border: '1px solid #C9A84C', color: '#C9A84C', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button onClick={() => setDeleteModal(p.id)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                {search ? 'No products found. Try a different search.' : 'No products yet. Add your first product above.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

