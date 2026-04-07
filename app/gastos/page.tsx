import { getHouseholdExpenses, getHouseholdMembers } from '@/lib/api'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'

// ID hardcodeado para el MVP — después viene de la sesión del usuario
const HOUSEHOLD_ID = 'demo-household'

export default async function GastosPage() {
  // Por ahora usamos mock hasta conectar auth
  const { mockMembers, mockExpenses } = await import('@/lib/data/mock')
  const balances = getBalances(mockExpenses as any)
  const reimbursements = getSuggestedReimbursements(balances)

  const myMemberId = 'member-l' // Lucía — después viene de sesión

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          Abril 2026
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Gastos del hogar
        </div>

        {/* Balance chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {mockMembers.map(m => {
            const bal = balances[m.id]
            const total = bal?.total ?? 0
            return (
              <div key={m.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, padding: '7px 14px 7px 8px' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1a1814' }}>
                  {m.initial}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>{m.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: total >= 0 ? '#b8f04a' : '#ff6b4a' }}>
                  {total >= 0 ? '+' : ''}{total.toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* LIQUIDAR SUGGESTION */}
      {reimbursements.length > 0 && (
        <div style={{ margin: '14px 20px 0', background: 'rgba(255,107,74,.08)', border: '1px solid rgba(255,107,74,.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--coral)', marginBottom: 2 }}>
              {reimbursements.length} transferencia{reimbursements.length > 1 ? 's' : ''} pendiente{reimbursements.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
              {reimbursements.map(r => {
                const from = mockMembers.find(m => m.id === r.from)
                const to = mockMembers.find(m => m.id === r.to)
                return `${from?.name} → ${to?.name} $${r.amount.toFixed(0)}`
              }).join(' · ')}
            </div>
          </div>
          <a href="/liquidar" style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)', textDecoration: 'none', flexShrink: 0, marginLeft: 12 }}>
            Ver →
          </a>
        </div>
      )}

      {/* LISTA DE GASTOS */}
      <div style={{ padding: '16px 20px', paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700 }}>Todos los gastos</div>
          <a href="/gastos/nuevo" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            + Agregar
          </a>
        </div>

        <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {mockExpenses.map((exp, i) => {
            const payer = mockMembers.find(m => m.id === exp.paidById)
            const mySplit = exp.splits.find(s => s.memberId === myMemberId)
            const iOwe = exp.paidById !== myMemberId
            const icons = ['🛒', '⚡', '🎬']

            return (
              <div key={exp.id} style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid var(--border)' : 'none', borderRadius: i === 0 ? '14px 14px 0 0' : i === mockExpenses.length - 1 ? '0 0 14px 14px' : 0 }}>
                
                {/* Icono */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {icons[i % icons.length]}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {exp.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: payer?.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#1a1814', flexShrink: 0 }}>
                      {payer?.initial}
                    </span>
                    {payer?.name} pagó
                    <span style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
                      {exp.splits.map(s => {
                        const member = mockMembers.find(m => m.id === s.memberId)
                        return (
                          <span key={s.memberId} style={{ background: 'var(--surface2)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 600 }}>
                            {member?.initial}{s.percentage}%
                          </span>
                        )
                      })}
                    </span>
                  </div>
                </div>

                {/* Monto */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700 }}>
                    ${exp.amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: iOwe ? 'var(--coral)' : 'var(--lime-dk)', fontWeight: 600 }}>
                    {iOwe ? `debes $${mySplit?.amount.toFixed(2)}` : `te deben $${mySplit?.amount.toFixed(2)}`}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      <a href="/gastos/nuevo" style={{ position: 'fixed', bottom: 84, right: 20, width: 52, height: 52, background: 'var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, textDecoration: 'none', boxShadow: '0 4px 20px rgba(26,24,20,.25)' }}>
        +
      </a>

    </div>
  )
}