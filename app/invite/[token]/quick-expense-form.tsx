'use client'
import { useState } from 'react'

type Member = { id: string; name: string; defaultShare: number }

export default function QuickExpenseForm({
  token,
  householdId,
  householdName,
  memberName,
  memberId,
  allMembers,
}: {
  token: string
  householdId: string
  householdName: string
  memberName: string
  memberId: string
  allMembers: Member[]
}) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)

  const categories = [
    { name: 'Comida', icon: '🛒' },
    { name: 'Servicios', icon: '⚡' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Salud', icon: '💊' },
    { name: 'Otro', icon: '📦' },
  ]
  const [category, setCategory] = useState('Comida')
  const [categoryIcon, setCategoryIcon] = useState('🛒')

  async function handleReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      setReceipt(reader.result as string)
      try {
        const res = await fetch('/api/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        })
        const data = await res.json()
        if (data.description) setDescription(data.description)
        if (data.amount && data.amount > 0) setAmount(data.amount.toString())
        if (data.category) {
          setCategory(data.category)
          const cat = categories.find(c => c.name === data.category)
          if (cat) setCategoryIcon(cat.icon)
        }
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

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
          icon: categoryIcon,
        }),
      })
      if (res.ok) setSaved(true)
      else alert('Error guardando el gasto')
    } finally {
      setSaving(false)
    }
  }

  if (saved) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', maxWidth: 430, margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Gasto guardado
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 8 }}>
          ${parseFloat(amount).toFixed(2)} agregado a {householdName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 32 }}>
          El admin puede verlo en el dashboard
        </div>
        <button
          onClick={() => { setSaved(false); setAmount(''); setDescription('') }}
          style={{ background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-syne)', marginBottom: 12, display: 'block', width: '100%' }}>
          Agregar otro gasto
        </button>
        
          href={`/login?callbackUrl=/invite/${token}`}
          style={{ display: 'block', background: 'transparent', color: 'var(--ink3)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
          Registrarme para ver todo el hogar
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HEADER */}
      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {householdName}
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Hola, {memberName} 👋
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
          Agrega un gasto al hogar
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 120 }}>

        {/* SCANNER */}
        <div
          onClick={() => document.getElementById('receipt-input')?.click()}
          style={{ background: scanning ? 'rgba(184,240,74,.06)' : 'var(--surface)', border: `2px dashed ${scanning ? '#7ab830' : 'var(--border)'}`, borderRadius: 16, padding: '16px', textAlign: 'center', cursor: scanning ? 'default' : 'pointer' }}>
          {scanning ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #7ab830', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#7ab830' }}>Analizando con AI...</div>
            </div>
          ) : receipt ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={receipt} alt="receipt" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}/>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Recibo analizado</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Toca para cambiar</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 28, marginBottom: 4 }}>📸</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Escanear recibo con AI</div>
              <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Opcional — extrae monto automáticamente</div>
            </div>
          )}
        </div>
        <input id="receipt-input" type="file" accept="image/*" capture="environment" onChange={handleReceipt} style={{ display: 'none' }}/>

        {/* MONTO */}
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

        {/* DESCRIPCION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Descripción</label>
          <input
            type="text"
            placeholder="ej. Supermercado, gasolina..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-instrument)' }}
          />
        </div>

        {/* CATEGORIA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Categoría</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => { setCategory(c.name); setCategoryIcon(c.icon) }}
                style={{ padding: '8px 14px', background: category === c.name ? 'var(--ink)' : 'var(--surface)', border: `1.5px solid ${category === c.name ? 'var(--ink)' : 'var(--border)'}`, borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: category === c.name ? '#fff' : 'var(--ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* SPLIT INFO */}
        <div style={{ background: 'rgba(184,240,74,.06)', border: '1px solid rgba(184,240,74,.2)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lime-dk)', marginBottom: 4 }}>
            División automática
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
            {allMembers.map(m => `${m.name.split(' ')[0]} ${m.defaultShare}%`).join(' · ')}
          </div>
        </div>

      </div>

      {/* SUBMIT */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 30px', background: 'linear-gradient(to top, var(--bg) 70%, transparent)', maxWidth: 430, margin: '0 auto' }}>
        <button
          onClick={handleSubmit}
          disabled={!amount || !description || saving}
          style={{ width: '100%', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: !amount || !description || saving ? .5 : 1 }}>
          {saving ? 'Guardando...' : 'Agregar gasto al hogar'}
        </button>
      </div>
    </div>
  )
}