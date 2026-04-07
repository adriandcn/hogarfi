import { getBalances, getSuggestedReimbursements } from '@/lib/balances'
import { mockMembers, mockExpenses } from '@/lib/data/mock'

export default function LiquidarPage() {
  const balances = getBalances(mockExpenses as any)
  const reimbursements = getSuggestedReimbursements(balances)

  const totalSpent = mockExpenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          Abril 2026
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Liquidar cuentas
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          {reimbursements.length} transferencia{reimbursements.length !== 1 ? 's' : ''} para quedar en cero
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 100 }}>

        {/* TRANSFERENCIAS */}
        {reimbursements.map((r, i) => {
          const from = mockMembers.find(m => m.id === r.from)
          const to = mockMembers.find(m => m.id === r.to)
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: from?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#1a1814' }}>
                    {from?.initial}
                  </div>
                  <span style={{ fontSize: 16, color: 'var(--ink3)' }}>→</span>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: to?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#1a1814' }}>
                    {to?.initial}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{from?.name} → {to?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Saldo pendiente del mes</div>
                </div>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 800, color: 'var(--coral)' }}>
                  ${r.amount.toFixed(2)}
                </div>
              </div>
              <button style={{ marginTop: 14, width: '100%', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)' }}>
                ✓ Marcar como pagado
              </button>
            </div>
          )
        })}

        {/* RESUMEN */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: 'var(--surface2)', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Resumen del mes
          </div>
          {mockMembers.map((m, i) => {
            const bal = balances[m.id]
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1a1814' }}>
                    {m.initial}
                  </div>
                  {m.name} pagó
                </div>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700 }}>
                  ${(bal?.paid ?? 0).toFixed(2)}
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderTop: '1px solid var(--border)', background: 'rgba(184,240,74,.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Total gastado</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 800 }}>${totalSpent.toFixed(2)}</div>
          </div>
        </div>

        {/* PORCENTAJES */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: 'var(--surface2)', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Corresponde a cada uno
          </div>
          {mockMembers.map((m, i) => {
            const corresponds = totalSpent * m.defaultShare / 100
            const bal = balances[m.id]
            const diff = (bal?.paid ?? 0) - corresponds
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ color: 'var(--ink3)', marginLeft: 6 }}>{m.defaultShare}%</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 700 }}>${corresponds.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: diff >= 0 ? 'var(--lime-dk)' : 'var(--coral)', fontWeight: 600 }}>
                    {diff >= 0 ? `pagó $${diff.toFixed(2)} extra` : `debe $${Math.abs(diff).toFixed(2)}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* SHARE */}
        <button style={{ width: '100%', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          📤 Compartir resumen por WhatsApp
        </button>

      </div>
    </div>
  )
}