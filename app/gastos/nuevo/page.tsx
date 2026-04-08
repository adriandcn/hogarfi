'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Member = { id: string; name: string; defaultShare: number }

export default function NuevoGastoPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [myMemberId, setMyMemberId] = useState('')
  const [householdId, setHouseholdId] = useState('')
  const [tab, setTab] = useState<'uno' | 'default' | 'custom'>('uno')
  const [payerId, setPayerId] = useState('')
  const [customShares, setCustomShares] = useState<Record<string, number>>({})
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

  useEffect(() => {
    fetch('/api/household/me')
      .then(r => r.json())
      .then(data => {
        if (data.members) {
          setMembers(data.members)
          setMyMemberId(data.myMemberId)
          setHouseholdId(data.householdId)
          setPayerId(data.myMemberId)
          const shares: Record<string, number> = {}
          data.members.forEach((m: Member) => { shares[m.id] = m.defaultShare })
          setCustomShares(shares)
        }
        setLoadingMembers(false)
      })
      .catch(() => setLoadingMembers(false))
  }, [])

  const amountNum = parseFloat(amount) || 0
  const totalCustom = Object.values(customShares).reduce((s, v) => s + v, 0)
  const customOk = Math.abs(totalCustom - 100) < 0.5

  const colors = [
    { bg: '#c9f26a', color: '#1a1814' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
  ]

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
    if (!amount || !description || !payerId) return
    setSaving(true)

    let splits = members.map(m => ({
      memberId: m.id,
      percentage: tab === 'custom' ? (customShares[m.id] ?? 0) : m.defaultShare,
      amount: amountNum * (tab === 'custom' ? (customShares[m.id] ?? 0) : m.defaultShare) / 100,
    }))

    const catIcon = cats.find(c => c.name === category)?.icon ?? '📦'

    const res = await fetch('/api/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdId,
        paidById: payerId,
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)' }}>

      {/* HEADER */}
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
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '16px 16px 16px 44px', fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 500, color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 120 }}>

        {/* DESCRIPCION */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Descripcion</div>
          <input
            type="text"
            placeholder="ej. Supermercado, gasolina..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', height: 50, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 15, color: 'var(--title)', outline: 'none' }}
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

        {/* DIVISION */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Division del gasto</div>

          <div style={{ display: 'flex', background: 'var(--soft)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 14 }}>
            {(['uno', 'default', 'custom'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', background: tab === t ? 'var(--white)' : 'transparent', color: tab === t ? 'var(--title)' : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t === 'uno' ? 'Uno pago' : t === 'default' ? 'Por defecto' : 'Personalizado'}
              </button>
            ))}
          </div>

          {/* TAB UNO */}
          {tab === 'uno' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 4 }}>
                Una persona pago el total. El balance se calcula automaticamente segun los porcentajes del hogar.
              </div>
              {members.map((m, i) => {
                const c = colors[i % colors.length]
                const selected = payerId === m.id
                const recover = amountNum * (1 - m.defaultShare / 100)
                return (
                  <div key={m.id} onClick={() => setPayerId(m.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--r-sm)', border: selected ? '2px solid var(--title)' : '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: selected ? 'var(--title)' : 'transparent', border: selected ? 'none' : '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />}
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                      {m.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {amountNum > 0 ? 'Recupera $' + recover.toFixed(2) : 'Pago el 100%'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB DEFAULT */}
          {tab === 'default' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
                Cada miembro paga su porcentaje acordado. Refleja la distribucion justa segun los ingresos de cada uno.
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Quien pago</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {members.map((m, i) => {
                  const c = colors[i % colors.length]
                  return (
                    <button key={m.id} onClick={() => setPayerId(m.id)}
                      style={{ flex: 1, padding: '10px 8px', background: payerId === m.id ? 'var(--title)' : 'var(--white)', border: '1.5px solid ' + (payerId === m.id ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: payerId === m.id ? 'rgba(255,255,255,.15)' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: payerId === m.id ? '#fff' : c.color }}>
                        {m.name[0]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: payerId === m.id ? '#fff' : 'var(--body)' }}>{m.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
                {members.map((m, i) => {
                  const c = colors[i % colors.length]
                  const share = amountNum * m.defaultShare / 100
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                        {m.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.defaultShare}% del hogar</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500 }}>${share.toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>le corresponde</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB CUSTOM */}
          {tab === 'custom' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
                Ajusta los porcentajes para este gasto. Deben sumar 100%.
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Quien pago</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {members.map((m, i) => {
                  const c = colors[i % colors.length]
                  return (
                    <button key={m.id} onClick={() => setPayerId(m.id)}
                      style={{ flex: 1, padding: '10px 8px', background: payerId === m.id ? 'var(--title)' : 'var(--white)', border: '1.5px solid ' + (payerId === m.id ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: payerId === m.id ? 'rgba(255,255,255,.15)' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: payerId === m.id ? '#fff' : c.color }}>
                        {m.name[0]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: payerId === m.id ? '#fff' : 'var(--body)' }}>{m.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden', marginBottom: 10 }}>
                {members.map((m, i) => {
                  const c = colors[i % colors.length]
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                        {m.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          ${((customShares[m.id] ?? 0) * amountNum / 100).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" value={customShares[m.id] ?? 0} min={0} max={100}
                          onChange={e => setCustomShares(prev => ({ ...prev, [m.id]: Number(e.target.value) }))}
                          style={{ width: 52, height: 38, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 16, fontWeight: 600, textAlign: 'center', color: 'var(--title)', outline: 'none', fontFamily: 'var(--mono)' }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: customOk ? 'rgba(201,242,106,.1)' : 'rgba(255,90,60,.06)', border: '1px solid ' + (customOk ? 'rgba(201,242,106,.35)' : 'rgba(255,90,60,.2)'), borderRadius: 'var(--r-sm)' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 500, color: customOk ? 'var(--green-dk)' : 'var(--red)' }}>
                  {totalCustom}% {customOk ? '✓' : '— faltan ' + (100 - totalCustom) + '%'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* AI SCANNER */}
        <div onClick={() => document.getElementById('receipt-input')?.click()}
          style={{ border: '1.5px dashed var(--border)', borderRadius: 'var(--r-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: scanning ? 'default' : 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {scanning ? '⏳' : receipt ? '✅' : '📸'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              {scanning ? 'Analizando con AI...' : receipt ? 'Recibo analizado' : 'Escanear recibo con AI'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {scanning ? 'Extrayendo datos...' : 'Opcional — extrae datos automaticamente'}
            </div>
          </div>
        </div>
        <input id="receipt-input" type="file" accept="image/*" capture="environment" onChange={handleReceipt} style={{ display: 'none' }} />

      </div>

      {/* SUBMIT */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 20px 36px', background: 'linear-gradient(to top, var(--off) 70%, transparent)' }}>
        <button onClick={handleSave}
          disabled={!amount || !description || saving || (tab === 'custom' && !customOk)}
          style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (!amount || !description || saving || (tab === 'custom' && !customOk)) ? .4 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar gasto'}
        </button>
      </div>
    </div>
  )
}