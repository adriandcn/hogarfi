'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SettleButton({ fromMemberId, toMemberId, amount, householdId, label }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSettle() {
    if (!confirm('Marcar como pagado?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromMemberId, toMemberId, amount, householdId }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Error al liquidar')
      }
    } catch {
      alert('Error de conexion')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleSettle}
      disabled={loading}
      style={{ width: '100%', background: loading ? '#555' : 'var(--ink)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: loading ? 0.6 : 1 }}>
      {loading ? 'Procesando...' : label}
    </button>
  )
} 
