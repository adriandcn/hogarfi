'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Member = { id: string; name: string; defaultShare: number }
type Split = { memberId: string; percentage: number; amount: number }

export default function EditarGastoClient({
  expense,
  members,
  householdId,
}: {
  expense: {
    id: string
    description: string
    amount: number
    paidById: string
    categoryName: string
    date: string
    splits: Split[]
  }
  members: Member[]
  householdId: string
}) {
  const router = useRouter()
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(expense.amount.toString())
  const [payerId, setPayerId] = useState(expense.paidById)
  const [date, setDate] = useState(expense.date)
  const [category, setCategory] = useState(expense.categoryName)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cats = [
    { name: 'Comida', icon: '🛒' },
    { name: 'Servicios', icon: '⚡' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Entretenimiento', icon: '🎬' },
    { name: 'Salud', icon: '💊' },
    { name: 'Hogar', icon: '🏠' },
    { name: 'Otro', icon: '📦' },
  ]

  const colors = [
    { bg: '#c9f26a', color: '#1a1814' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
  ]

  async function handleSave() {
    if (!amount || !description) return
    setSaving(true)

    const amountNum = parseFloat(amount)
    const splits = members.map(m => ({
      memberId: m.id,
      percentage: m.defaultShare,
      amount: amountNum * m.defaultShare / 100,
    }))

    const catIcon = cats.find(c => c.name === category)?.icon ?? '📦'

    const res = await fetch('/api/expense/' + expense.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        amount: amountNum,
        paidById: payerId,
        categoryName: category,
        icon: catIcon,
        date,
        splits,
        householdId,
      }),
    })

    setSaving(false)
    if (res.ok) router.push('/gastos')
    else alert('Error guardando el gasto')
  }

  async function handleDelete() {
    if (!confirm('Eliminar este gasto?')) return
    setDeleting(true)
    const res = await fetch('/api/expense/' + expense.id, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) router.push('/gastos')
    else alert('Error eliminando el gasto')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)' }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ←
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Editar gasto</div>
          <button onClick={handleDelete} disabled={deleting} style={{ background: 'rgba(255,90,60,.2)', border: 'none', color: '#ff8a70', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {deleting ? '...' : 'Eliminar'}
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 24, color: 'rgba(255,255,255,.35)' }}>$</span>
          <input
            type="number" value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '16px 16px 16px 44px', fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 500, color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 160 }}>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Descripcion</div>
          <input
            type="text" value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', height: 50, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 15, color: 'var(--title)', outline: 'none' }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Fecha</div>
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%', height: 50, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 15, color: 'var(--title)', outline: 'none' }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Quien pago</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {members.map((m, i) => {
              const c = colors[i % colors.length]
              const selected = payerId === m.id
              return (
                <button key={m.id} onClick={() => setPayerId(m.id)}
                  style={{ flex: 1, padding: '10px 8px', background: selected ? 'var(--title)' : 'var(--white)', border: '1.5px solid ' + (selected ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: selected ? 'rgba(255,255,255,.15)' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: selected ? '#fff' : c.color }}>
                    {m.name[0]}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: selected ? '#fff' : 'var(--body)' }}>{m.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Categoria</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button key={c.name} onClick={() => setCategory(c.name)}
                style={{ padding: '7px 14px', background: category === c.name ? 'var(--title)' : 'var(--white)', color: category === c.name ? '#fff' : 'var(--body)', border: '1.5px solid ' + (category === c.name ? 'var(--title)' : 'var(--border)'), borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 20px', background: 'linear-gradient(to top, var(--off) 70%, transparent)' }}>
        <button onClick={handleSave} disabled={!amount || !description || saving}
          style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: !amount || !description || saving ? .4 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}