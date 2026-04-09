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
    } catch {
      alert('Error de conexion')
    }
    setSaving(false)
  }

  if (saved) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(201,242,106,.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 36 }}>
          ✅
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 8 }}>
          Gasto guardado
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', marginBottom: 48, lineHeight: 1.5 }}>
          {'$' + parseFloat(amount).toFixed(2) + ' agregado a ' + householdName}
        </div>
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => { setSaved(false); setAmount(''); setDescription('') }}
            style={{ height: 52, background: 'var(--green)', color: 'var(--title)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            Agregar otro gasto
          </button>
          <button
            onClick={() => window.location.href = '/login?callbackUrl=/invite/' + token}
            style={{ height: 52, background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            Registrarme para ver todo el hogar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)' }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          {householdName}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 4 }}>
          {'Hola, ' + memberName}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', marginBottom: 20 }}>
          Agrega un gasto al hogar
        </div>

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 24, color: 'rgba(255,255,255,.35)' }}>$</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '16px 16px 16px 44px', fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 500, color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 120 }}>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Descripcion</div>
          <input
            type="text"
            placeholder="ej. Supermercado, gasolina..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', height: 50, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 15, color: 'var(--title)', outline: 'none', fontFamily: 'var(--font)' }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Categoria</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                style={{ padding: '7px 14px', background: category === c.name ? 'var(--title)' : 'var(--white)', color: category === c.name ? '#fff' : 'var(--body)', border: '1.5px solid ' + (category === c.name ? 'var(--title)' : 'var(--border)'), borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font)' }}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(201,242,106,.08)', border: '1px solid rgba(201,242,106,.25)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', marginBottom: 4 }}>
            Division automatica
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {allMembers.map(m => m.name.split(' ')[0] + ' ' + m.defaultShare + '%').join(' · ')}
          </div>
        </div>

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 36px', background: 'linear-gradient(to top, var(--off) 70%, transparent)', maxWidth: 430, margin: '0 auto' }}>
        <button
          onClick={handleSubmit}
          disabled={!amount || !description || saving}
          style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', opacity: (!amount || !description || saving) ? 0.4 : 1 }}>
          {saving ? 'Guardando...' : 'Agregar gasto al hogar'}
        </button>
      </div>
    </div>
  )
}