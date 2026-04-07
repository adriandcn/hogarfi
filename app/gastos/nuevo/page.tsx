'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Member = {
  id: string
  name: string
  defaultShare: number
}

export default function NuevoGastoPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)

  const [householdId, setHouseholdId] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [paidById, setPaidById] = useState('')

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Comida')
  const [categoryIcon, setCategoryIcon] = useState('🛒')
  const [useDefaultShares, setUseDefaultShares] = useState(true)
  const [customShares, setCustomShares] = useState<{memberId: string; percentage: number}[]>([])
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  const categories = [
    { name: 'Comida', icon: '🛒' },
    { name: 'Servicios', icon: '⚡' },
    { name: 'Entretenimiento', icon: '🎬' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Salud', icon: '💊' },
    { name: 'Hogar', icon: '🏠' },
    { name: 'Otro', icon: '📦' },
  ]

  useEffect(() => {
    fetch('/api/household/me')
      .then(r => r.json())
      .then(data => {
        if (data.householdId) {
          setHouseholdId(data.householdId)
          setMembers(data.members)
          setPaidById(data.myMemberId)
          setCustomShares(data.members.map((m: Member) => ({
            memberId: m.id,
            percentage: m.defaultShare,
          })))
        }
      })
  }, [])

  async function handleReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      setReceiptPreview(reader.result as string)

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
      } catch (err) {
        console.error('Receipt scan error:', err)
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function updateCustomShare(memberId: string, percentage: number) {
    setCustomShares(prev =>
      prev.map(s => s.memberId === memberId ? { ...s, percentage } : s)
    )
  }

  const totalCustomShare = customShares.reduce((s, m) => s + m.percentage, 0)
  const sharesOk = useDefaultShares || Math.abs(totalCustomShare - 100) < 0.5

  async function handleSubmit() {
    if (!description || !amount || !paidById || !sharesOk) return
    setSaving(true)
    try {
      const res = await fetch('/api/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          paidById,
          description,
          amount: parseFloat(amount),
          categoryName: category,
          icon: categoryIcon,
          useDefaultShares,
          customShares: useDefaultShares ? [] : customShares,
        }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        alert('Error guardando el gasto')
        setSaving(false)
      }
    } catch {
      alert('Error de conexión')
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>

      {/* HEADER */}
      <div style={{ background: 'var(--ink)', padding: '20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 17, fontWeight: 700, color: '#fff' }}>
          Nuevo gasto
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 120 }}>

        {/* SCANNER AI */}
        <div
          onClick={() => !scanning && fileRef.current?.click()}
          style={{ background: scanning ? 'rgba(184,240,74,.06)' : 'var(--surface)', border: `2px dashed ${scanning ? '#7ab830' : 'var(--border)'}`, borderRadius: 16, padding: '20px', textAlign: 'center', cursor: scanning ? 'default' : 'pointer', transition: 'all .2s' }}>
          {scanning ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #7ab830', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#7ab830' }}>
                🤖 Analizando recibo con AI...
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', animation: 'pulse 1.5s ease infinite' }}>
                Extrayendo monto, descripción y categoría
              </div>
            </div>
          ) : receiptPreview ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={receiptPreview} alt="receipt" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}/>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>✅ Recibo analizado</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Toca para cambiar</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Escanear recibo con AI</div>
              <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Toma una foto y AI extrae el monto automáticamente</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleReceipt} style={{ display: 'none' }}/>

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
            placeholder="ej. Supermercado, luz eléctrica..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-instrument)' }}
          />
        </div>

        {/* QUIEN PAGO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>¿Quién pagó?</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setPaidById(m.id)}
                style={{ flex: 1, padding: '10px 8px', background: paidById === m.id ? 'var(--ink)' : 'var(--surface)', border: `1.5px solid ${paidById === m.id ? 'var(--ink)' : 'var(--border)'}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#b8f04a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1a1814' }}>
                  {m.name[0]}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: paidById === m.id ? '#fff' : 'var(--ink)' }}>
                  {m.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* CATEGORIA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Categoría</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => { setCategory(c.name); setCategoryIcon(c.icon) }}
                style={{ padding: '8px 14px', background: category === c.name ? 'var(--ink)' : 'var(--surface)', border: `1.5px solid ${category === c.name ? 'var(--ink)' : 'var(--border)'}`, borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: category === c.name ? '#fff' : 'var(--ink)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* SPLIT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>División</label>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 3, gap: 2 }}>
            <button
              onClick={() => setUseDefaultShares(true)}
              style={{ flex: 1, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: useDefaultShares ? 'var(--surface)' : 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-instrument)', boxShadow: useDefaultShares ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
              % Default del hogar
            </button>
            <button
              onClick={() => setUseDefaultShares(false)}
              style={{ flex: 1, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: !useDefaultShares ? 'var(--surface)' : 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-instrument)', boxShadow: !useDefaultShares ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
              Porcentajes custom
            </button>
          </div>

          <div style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {members.map((m, i) => {
              const share = useDefaultShares
                ? m.defaultShare
                : customShares.find(s => s.memberId === m.id)?.percentage ?? 0
              const splitAmount = amount ? (parseFloat(amount) * share / 100).toFixed(2) : '0.00'
              return (
                <div key={m.id} style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#b8f04a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1a1814', flexShrink: 0 }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 1 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)' }}>${splitAmount}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      value={share}
                      disabled={useDefaultShares}
                      onChange={e => updateCustomShare(m.id, Number(e.target.value))}
                      style={{ width: 52, background: 'var(--surface2)', border: `1.5px solid ${useDefaultShares ? 'transparent' : 'var(--border)'}`, borderRadius: 8, padding: '6px 4px', fontSize: 16, fontWeight: 700, textAlign: 'center', fontFamily: 'var(--font-syne)', color: 'var(--ink)', outline: 'none' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink3)' }}>%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {!useDefaultShares && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 800, color: sharesOk ? '#7ab830' : 'var(--coral)' }}>
                {totalCustomShare}% {sharesOk ? '✓' : '⚠'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 30px', background: 'linear-gradient(to top, var(--bg) 70%, transparent)', maxWidth: 430, margin: '0 auto' }}>
        <button
          onClick={handleSubmit}
          disabled={!description || !amount || !sharesOk || saving}
          style={{ width: '100%', background: saving ? '#555' : 'var(--ink)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: !description || !amount || !sharesOk ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background .2s' }}>
          {saving ? (
            <>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }}/>
              Guardando...
            </>
          ) : 'Guardar gasto'}
        </button>
      </div>
    </div>
  )
}