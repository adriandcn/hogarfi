'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Member = {
  id: string
  name: string
  defaultShare: number
  isMe: boolean
  hasAccount: boolean
}
type Household = { id: string; name: string; isActive: boolean; memberCount: number }

export default function ConfigClient({
  householdId,
  householdName,
  members: initialMembers,
  isAdmin,
  myHouseholds,
}: {
  householdId: string
  householdName: string
  members: Member[]
  isAdmin: boolean
  myHouseholds: Household[]
})

export default function ConfigClient({
  householdId,
  householdName,
  members: initialMembers,
  isAdmin,
}: {
  householdId: string
  householdName: string
  members: Member[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [shares, setShares] = useState<Record<string, number>>(
    Object.fromEntries(initialMembers.map(m => [m.id, m.defaultShare]))
  )
  const [name, setName] = useState(householdName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberShare, setNewMemberShare] = useState(0)
  const [addingMember, setAddingMember] = useState(false)

  const allShares = { ...shares, ...(newMemberName ? { new: newMemberShare } : {}) }
  const total = Object.values(shares).reduce((s, v) => s + v, 0) + (newMemberName ? newMemberShare : 0)
  const sharesOk = Math.abs(total - 100) < 0.5

  const colors = [
    { bg: '#c9f26a', color: '#1a1814' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
    { bg: '#fce7f3', color: '#9d174d' },
  ]

  async function addMember() {
    if (!newMemberName || newMemberShare <= 0) return
    setAddingMember(true)
    try {
      const res = await fetch('/api/household/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, name: newMemberName, share: newMemberShare }),
      })
      const data = await res.json()
      if (res.ok) {
        setMembers(prev => [...prev, { id: data.id, name: newMemberName, defaultShare: newMemberShare, isMe: false, hasAccount: false }])
        setShares(prev => ({ ...prev, [data.id]: newMemberShare }))
        setNewMemberName('')
        setNewMemberShare(0)
      } else {
        alert('Error agregando miembro')
      }
    } finally {
      setAddingMember(false)
    }
  }

  async function saveChanges() {
    if (!sharesOk) return
    setSaving(true)
    try {
      const res = await fetch('/api/household/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, name, shares }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      } else {
        alert('Error guardando cambios')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ←
          </button>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>
            Configuracion
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* NOMBRE */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Nombre del hogar</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', height: 48, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 14px', fontSize: 15, fontWeight: 500, color: 'var(--title)', outline: 'none' }}
          />
        </div>

        {/* MIEMBROS Y PORCENTAJES */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Miembros del hogar</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Define cuanto le corresponde pagar a cada miembro del total mensual
            </div>
          </div>

          {members.map((m, i) => {
            const c = colors[i % colors.length]
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                  {m.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {m.name.split(' ')[0]}
                    {m.isMe && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>(tu)</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {m.hasAccount ? 'Cuenta activa' : 'Sin cuenta aun'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    value={shares[m.id] ?? 0}
                    min={0} max={100}
                    onChange={e => setShares(prev => ({ ...prev, [m.id]: Number(e.target.value) }))}
                    style={{ width: 56, height: 40, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 17, fontWeight: 600, textAlign: 'center', color: 'var(--title)', outline: 'none', fontFamily: 'var(--mono)' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>%</span>
                </div>
              </div>
            )
          })}

          {/* AGREGAR MIEMBRO */}
          {isAdmin && (
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--muted)', flexShrink: 0, fontWeight: 700 }}>
                +
              </div>
              <input
                placeholder="Nombre del miembro"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: 'var(--title)', outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={newMemberShare}
                  min={0} max={100}
                  onChange={e => setNewMemberShare(Number(e.target.value))}
                  style={{ width: 56, height: 40, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 17, fontWeight: 600, textAlign: 'center', color: 'var(--title)', outline: 'none', fontFamily: 'var(--mono)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>%</span>
              </div>
              <button
                onClick={addMember}
                disabled={!newMemberName || newMemberShare <= 0 || addingMember}
                style={{ height: 38, padding: '0 14px', background: newMemberName && newMemberShare > 0 ? 'var(--title)' : 'var(--soft)', color: newMemberName && newMemberShare > 0 ? '#fff' : 'var(--muted)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                {addingMember ? '...' : 'Add'}
              </button>
            </div>
          )}

          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: sharesOk ? 'rgba(201,242,106,.06)' : 'rgba(255,90,60,.04)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 500, color: sharesOk ? 'var(--green-dk)' : 'var(--red)' }}>
              {total}% {sharesOk ? '✓' : '— faltan ' + (100 - total) + '%'}
            </span>
          </div>
        </div>

        {/* MIS HOGARES */}
<div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
    <div style={{ fontSize: 13, fontWeight: 700 }}>Mis hogares</div>
  </div>
  {myHouseholds.map((h, i) => (
    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{h.memberCount} miembros</div>
      </div>
      {h.isActive ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', background: 'rgba(201,242,106,.15)', padding: '4px 10px', borderRadius: 999 }}>
          Activo
        </div>
      ) : (
        <button
          onClick={async () => {
            await fetch('/api/household/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ householdId: h.id }),
            })
            window.location.href = '/dashboard'
          }}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--body)', background: 'var(--soft)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 999, cursor: 'pointer' }}>
          Cambiar
        </button>
      )}
    </div>
  ))}
  <div style={{ padding: '13px 18px', borderTop: '1px solid var(--border)' }}>
    <a href="/onboarding"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40, background: 'var(--soft)', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600, color: 'var(--body)', textDecoration: 'none', border: '1.5px solid var(--border)' }}>
      + Crear otro hogar
    </a>
  </div>
</div>

        {/* INVITAR */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Invitar miembros</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
            Comparte links para que los miembros puedan unirse o agregar gastos sin registrarse.
          </div>
          <a href="/invitar"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, background: 'var(--title)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
            Ver links de invitacion
          </a>
        </div>

        {saved && (
          <div style={{ background: 'rgba(201,242,106,.1)', border: '1px solid rgba(201,242,106,.3)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--green-dk)' }}>
            Cambios guardados ✓
          </div>
        )}

        <button
          onClick={saveChanges}
          disabled={!sharesOk || saving}
          style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: !sharesOk || saving ? .4 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}