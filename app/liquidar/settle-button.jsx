'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SettleButton({ fromMemberId, toMemberId, amount, householdId, label }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSettle() {
    if (!confirm('Confirmar pago de $' + amount.toFixed(2) + '?')) return
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
      style={{ width: '100%', height: 44, background: loading ? 'var(--soft)' : 'var(--title)', color: loading ? 'var(--muted)' : '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font)', transition: 'all .2s' }}>
      {loading ? 'Procesando...' : label}
    </button>
  )
}