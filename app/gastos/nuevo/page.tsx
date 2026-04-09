'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Member = { id: string; name: string; defaultShare: number }

export default function NuevoGastoPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [householdId, setHouseholdId] = useState('')
  const [payerId, setPayerId] = useState('')
  const [multiPago, setMultiPago] = useState(false)
  const [memberAmounts, setMemberAmounts] = useState<Record<string, number>>({})
  const [category, setCategory] = useState('Comida')
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)
  const [loadingMembers, setLoadingMembers] = useState(true)

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

  useEffect(() => {
    fetch('/api/household/me')
      .then(r => r.json())
      .then(data => {
        if (data.members) {
          setMembers(data.members)
          setHouseholdId(data.householdId)
          setPayerId(data.myMemberId)
          const amounts: Record<string, number> = {}
          data.members.forEach((m: Member) => { amounts[m.id] = 0 })
          setMemberAmounts(amounts)
        }
        setLoadingMembers(false)
      })
      .catch(() => setLoadingMembers(false))
  }, [])

  const amountNum = parseFloat(amount) || 0
  const totalMonto = Object.values(memberAmounts).reduce((s, v) => s + v, 0)
  const montoOk = Math.abs(totalMonto - amountNum) < 0.5

  const isDisabled = !amount || !description || saving ||
    (multiPago && !montoOk)

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
        if (data.category) setCategory(data.category)
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!amount || !description) return
    setSaving(true)

    let splits
    let finalPayerId = payerId

    if (multiPago) {
      // Varios pagaron — splits basados en montos ingresados
      splits = members.map(m => {
        const pct = amountNum > 0 ? Math.round((memberAmounts[m.id] ?? 0) / amountNum * 100) : 0
        return {
          memberId: m.id,
          percentage: m.defaultShare, // el acuerdo del hogar siempre aplica al liquidar
          amount: amountNum * m.defaultShare / 100,
        }
      })
      // El que mas puso es el pagador principal
      const maxEntry = Object.entries(memberAmounts).sort((a, b) => b[1] - a[1])[0]
      if (maxEntry) finalPayerId = maxEntry[0]
    } else {
      // Un solo pagador — splits por porcentaje del hogar
      splits = members.map(m => ({
        memberId: m.id,
        percentage: m.defaultShare,
        amount: amountNum * m.defaultShare / 100,
      }))
    }

    const catIcon = cats.find(c => c.name === category)?.icon ?? '📦'

    const res = await fetch('/api/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdId,
        paidById: finalPayerId,
        description,
        amount: amountNum,
        categoryName: category,
        icon: catIcon,
        splits,
      }),
    })

    setSaving(false)
    if (res.ok) router.push('/gastos')
    else alert('Error guardando el gasto')
  }

  if (loadingMembers) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando...</div>
    </div>
  )

  const payerName = members.find(m => m.id === payerId)?.name?.split(' ')[0] ?? 'alguien'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)' }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ←
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Nuevo gasto</div>
          <div style={{ width: 36 }} />
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 24, color: 'rgba(255,255,255,.35)' }}>$</span>
          <input
            type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '16px 16px 16px 44px', fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 500, color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 160 }}>

        {/* SCANNER */}
        <div onClick={() => document.getElementById('receipt-input')?.click()}
          style={{ border: '1.5px dashed var(--border)', borderRadius: 'var(--r-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: receipt ? 'rgba(201,242,106,.04)' : 'transparent' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {scanning ? '⏳' : receipt ? '✅' : '📸'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              {scanning ? 'Analizando con AI...' : receipt ? 'Recibo analizado' : 'Escanear recibo con AI'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {scanning ? 'Extrayendo datos...' : 'Extrae monto y descripcion automaticamente'}
            </div>
          </div>
        </div>
        <input id="receipt-input" type="file" accept="image/*" capture="environment" onChange={handleReceipt} style={{ display: 'none' }} />

        {/* DESCRIPCION */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Descripcion</div>
          <input
            type="text" placeholder="ej. Supermercado, gasolina..." value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', height: 50, background: 'var(--white)', border: '1.5px solid ' + (description ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 15, color: 'var(--title)', outline: 'none' }}
          />
        </div>

        {/* CATEGORIA */}
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

        {/* QUIEN PAGO — solo si es un pagador */}
        {!multiPago && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Quien pago?</div>
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
        )}

        {/* TODOS PUSIERON ALGO */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Todos pusieron algo?</div>
          <div style={{ display: 'flex', background: 'var(--soft)', borderRadius: 10, padding: 3, gap: 2 }}>
            <button onClick={() => setMultiPago(false)}
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: !multiPago ? 'var(--white)' : 'transparent', color: !multiPago ? 'var(--title)' : 'var(--muted)', fontSize: 13, fontWeight: !multiPago ? 600 : 400, cursor: 'pointer' }}>
              No, solo uno pago
            </button>
            <button onClick={() => setMultiPago(true)}
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: multiPago ? 'var(--white)' : 'transparent', color: multiPago ? 'var(--title)' : 'var(--muted)', fontSize: 13, fontWeight: multiPago ? 600 : 400, cursor: 'pointer' }}>
              Si, varios pusieron
            </button>
          </div>
        </div>

        {/* MULTI PAGO */}
        {multiPago && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Cuanto puso cada uno?</div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden', marginBottom: 8 }}>
              {members.map((m, i) => {
                const c = colors[i % colors.length]
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                      {m.name[0]}
                    </div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{m.name.split(' ')[0]}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>$</span>
                      <input
                        type="number" value={memberAmounts[m.id] || ''} placeholder="0"
                        onChange={e => setMemberAmounts(prev => ({ ...prev, [m.id]: Number(e.target.value) }))}
                        style={{ width: 80, height: 38, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 15, fontWeight: 600, textAlign: 'right', paddingRight: 10, color: 'var(--title)', outline: 'none', fontFamily: 'var(--mono)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: montoOk ? 'rgba(201,242,106,.1)' : 'rgba(255,90,60,.06)', border: '1px solid ' + (montoOk ? 'rgba(201,242,106,.3)' : 'rgba(255,90,60,.15)'), borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: montoOk ? 'var(--green-dk)' : 'var(--red)' }}>Total ingresado</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: montoOk ? 'var(--green-dk)' : 'var(--red)' }}>
                ${totalMonto.toFixed(2)} / ${amountNum.toFixed(2)} {montoOk ? '✓' : ''}
              </span>
            </div>
          </div>
        )}

        {/* NOTA */}
        <div style={{ background: 'var(--soft)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          {multiPago
            ? 'Cada uno puso lo suyo ahora. Al liquidar al final del mes se ajusta segun el acuerdo del hogar.'
            : payerName + ' pago $' + (amountNum > 0 ? amountNum.toFixed(0) : '0') + ' ahora. Al liquidar al final del mes se calcula quien debe que segun el acuerdo del hogar.'
          }
        </div>

      </div>

      <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 20px', background: 'linear-gradient(to top, var(--off) 70%, transparent)' }}>
        <button onClick={handleSave} disabled={isDisabled}
          style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: isDisabled ? .4 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar gasto'}
        </button>
      </div>
    </div>
  )
}