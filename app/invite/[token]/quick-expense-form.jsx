'use client'
import { useState } from 'react'

export default function QuickExpenseForm({ token, householdId, householdName, memberName, memberId, allMembers }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [category, setCategory] = useState('Comida')

  const cats = [
    { name: 'Comida', emoji: '🛒' },
    { name: 'Servicios', emoji: '⚡' },
    { name: 'Transporte', emoji: '🚗' },
    { name: 'Salud', emoji: '💊' },
    { name: 'Otro', emoji: '📦' },
  ]

  async function handleSubmit() {
    if (!amount || !description) return
    setSaving(true)
    try {
      const res = await fetch('/api/expense/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          householdId,
          paidById: memberId,
          description,
          amount: parseFloat(amount),
          categoryName: category,
          icon: cats.find(c => c.name === category)?.emoji ?? '📦',
        }),
      })
      if (res.ok) {
        setSaved(true)
      } else {
        alert('Error guardando el gasto')
      }
    } catch (e) {
      alert('Error de conexion')
    }
    setSaving(false)
  }

  if (saved) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', maxWidth: 430, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Gasto guardado</div>
          <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 32 }}>Agregado a {householdName}</div>
          <button
            onClick={() => { setSaved(false); setAmount(''); setDescription('') }}
            style={{ width: '100%', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
            Agregar otro gasto
          </button>
          <button
  onClick={() => window.location.href = '/login?callbackUrl=/invite/' + token}
  style={{ width: '100%', background: 'transparent', color: 'var(--ink3)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
  Registrarme para ver todo
</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>
      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {householdName}
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Hola, {memberName}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
          Agrega un gasto al hogar
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 120 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Monto</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: 'var(--ink3)' }}>$</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 16px 16px 36px', fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Descripcion</label>
          <input
            type="text"
            placeholder="ej. Supermercado, gasolina..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: 'var(--ink)', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Categoria</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                style={{ padding: '8px 14px', background: category === c.name ? 'var(--ink)' : 'var(--surface)', border: '1.5px solid ' + (category === c.name ? 'var(--ink)' : 'var(--border)'), borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: category === c.name ? '#fff' : 'var(--ink)' }}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(184,240,74,.06)', border: '1px solid rgba(184,240,74,.2)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lime-dk)', marginBottom: 4 }}>Division automatica</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
            {allMembers.map(m => m.name.split(' ')[0] + ' ' + m.defaultShare + '%').join(' - ')}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 30px', background: 'linear-gradient(to top, var(--bg) 70%, transparent)', maxWidth: 430, margin: '0 auto' }}>
        <button
          onClick={handleSubmit}
          disabled={!amount || !description || saving}
          style={{ width: '100%', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: (!amount || !description || saving) ? 0.5 : 1 }}>
          {saving ? 'Guardando...' : 'Agregar gasto al hogar'}
        </button>
      </div>
    </div>
  )
}