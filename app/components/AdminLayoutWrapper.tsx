'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import AdminLogin from '@/app/components/AdminLogin'

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth') === 'true'
    setAuthenticated(auth)
    setLoading(false)
  }, [])

  if (loading) return null

  if (!authenticated) {
    return <AdminLogin onSuccess={() => { setAuthenticated(true); window.location.reload(); }} />
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: 32, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
