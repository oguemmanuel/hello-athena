'use client'
import { useState } from 'react'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuth', 'true')
      onSuccess()
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000000cc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid #C9A84C44',
        borderRadius: 12,
        padding: 32,
        width: 400,
      }}>
        <h2 style={{ color: '#C9A84C', marginTop: 0, marginBottom: 8 }}>Admin Access</h2>
        <p style={{ color: '#888', marginBottom: 24 }}>Enter password to continue</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="input-field"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            autoFocus
            style={{ marginBottom: error ? 8 : 16, width: '100%' }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button
            type="submit"
            className="btn-gold"
            style={{ width: '100%', padding: '10px' }}
          >
            Enter Admin
          </button>
        </form>
      </div>
    </div>
  )
}
