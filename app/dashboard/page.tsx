import { mockMembers, mockExpenses, mockBudgets } from '@/lib/data/mock'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'

export default function DashboardPage() {
  const balances = getBalances(mockExpenses as any)
  const reimbursements = getSuggestedReimbursements(balances)
  
  const totalSpent = mockBudgets.reduce((s, b) => s + b.spent, 0)
  const totalBudget = mockBudgets.reduce((s, b) => s + b.amount, 0)
  const remaining = totalBudget - totalSpent
  const pct = Math.round((totalSpent / totalBudget) * 100)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>
      
      {/* HERO */}
      <div style={{ background: 'var(--ink)', padding: '28px 20px 24px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 20 }}>
          Abril 2026
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>Presupuesto restante</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 46, fontWeight: 800, color: '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>
              <span style={{ fontSize: 20, opacity: .6 }}>$</span>{remaining.toFixed(0)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
              de ${totalBudget} · {pct}% usado
            </div>
          </div>
          <div style={{ position: 'relative', width: 70, height: 70 }}>
            <svg width="70" height="70" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3.5"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#b8f04a" strokeWidth="3.5"
                strokeDasharray={`${(pct/100)*88} 88`} strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {pct}%
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {mockMembers.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, padding: '6px 12px 6px 6px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1a1814' }}>
                {m.initial}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>{m.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{m.defaultShare}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '14px 20px' }}>
        {[
          { icon: '💳', val: `$${totalSpent}`, lbl: 'Gastado', color: 'var(--coral)' },
          { icon: '⚖️', val: `$${reimbursements.reduce((s,r) => s + r.amount, 0).toFixed(0)}`, lbl: 'Por liquidar', color: 'var(--coral)' },
          { icon: '📊', val: `${mockBudgets.filter(b => b.spent <= b.amount).length}/${mockBudgets.length}`, lbl: 'Cats. OK', color: 'var(--ink)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 12px' }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 19, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 500 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* PRESUPUESTO */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 10px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700 }}>Presupuesto</div>
          <a href="/presupuesto" style={{ fontSize: 12, color: 'var(--ink3)', textDecoration: 'none' }}>Ver todo →</a>
        </div>
        <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {mockBudgets.map((b, i) => {
            const pctB = Math.min(Math.round((b.spent / b.amount) * 100), 100)
            const over = b.spent > b.amount
            return (
              <div key={b.id} style={{ background: 'var(--surface)', padding: '13px 16px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 18 }}>{b.icon}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{b.name}</div>
                  <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: over ? 'var(--coral)' : b.color, width: `${pctB}%` }}/>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 700, color: over ? 'var(--coral)' : 'var(--ink)' }}>${b.spent}</div>
                  <div style={{ fontSize: 10, color: over ? 'var(--coral)' : 'var(--ink3)' }}>{over ? `⚠ +$${b.spent - b.amount}` : `/ $${b.amount}`}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ULTIMOS GASTOS */}
      <div style={{ padding: '0 20px', marginTop: 8, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 10px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700 }}>Ultimos gastos</div>
          <a href="/gastos" style={{ fontSize: 12, color: 'var(--ink3)', textDecoration: 'none' }}>Ver todos →</a>
        </div>
        <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {mockExpenses.map((exp, i) => {
            const payer = mockMembers.find(m => m.id === exp.paidById)
            const mySplit = exp.splits.find(s => s.memberId === 'member-l')
            const iOwe = exp.paidById !== 'member-l'
            const icons = ['🛒', '⚡', '🎬']
            return (
              <div key={exp.id} style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {icons[i]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{exp.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: payer?.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#1a1814' }}>{payer?.initial}</span>
                    {payer?.name} pago
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700 }}>${exp.amount}</div>
                  <div style={{ fontSize: 11, marginTop: 1, color: iOwe ? 'var(--coral)' : 'var(--lime-dk)' }}>
                    {iOwe ? `debes $${mySplit?.amount}` : `te deben $${mySplit?.amount}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}