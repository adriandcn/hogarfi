export const mockHousehold = {
  id: 'household-1',
  name: 'Hogar Martínez',
  currency: 'USD',
}

export const mockMembers = [
  { id: 'member-a', name: 'Adrián',  defaultShare: 68, color: '#b8f04a', initial: 'A' },
  { id: 'member-l', name: 'Lucía',   defaultShare: 30, color: '#4a9eff', initial: 'L' },
  { id: 'member-t', name: 'Theo',    defaultShare: 2,  color: '#ff6b4a', initial: 'T' },
]

export const mockExpenses = [
  {
    id: 'exp-1',
    description: 'Supermercado El Rey',
    amount: 120.00,
    categoryId: 'cat-1',
    paidById: 'member-a',
    createdAt: new Date(),
    splits: [
      { memberId: 'member-a', percentage: 68, amount: 81.60 },
      { memberId: 'member-l', percentage: 30, amount: 36.00 },
      { memberId: 'member-t', percentage: 2,  amount: 2.40  },
    ]
  },
  {
    id: 'exp-2',
    description: 'Factura luz',
    amount: 124.00,
    categoryId: 'cat-2',
    paidById: 'member-l',
    createdAt: new Date(Date.now() - 86400000),
    splits: [
      { memberId: 'member-a', percentage: 68, amount: 84.32 },
      { memberId: 'member-l', percentage: 30, amount: 37.20 },
      { memberId: 'member-t', percentage: 2,  amount: 2.48  },
    ]
  },
  {
    id: 'exp-3',
    description: 'Netflix',
    amount: 15.99,
    categoryId: 'cat-3',
    paidById: 'member-a',
    createdAt: new Date(Date.now() - 86400000),
    splits: [
      { memberId: 'member-a', percentage: 68, amount: 10.87 },
      { memberId: 'member-l', percentage: 30, amount: 4.80  },
      { memberId: 'member-t', percentage: 2,  amount: 0.32  },
    ]
  },
]

export const mockBudgets = [
  { id: 'bud-1', categoryId: 'cat-1', name: 'Comida',          icon: '🛒', color: '#b8f04a', amount: 500,  spent: 420 },
  { id: 'bud-2', categoryId: 'cat-2', name: 'Servicios',       icon: '⚡', color: '#4a9eff', amount: 300,  spent: 180 },
  { id: 'bud-3', categoryId: 'cat-3', name: 'Entretenimiento', icon: '🎬', color: '#ff6b4a', amount: 150,  spent: 195 },
  { id: 'bud-4', categoryId: 'cat-4', name: 'Transporte',      icon: '🚗', color: '#9b7fe8', amount: 150,  spent: 62  },
  { id: 'bud-5', categoryId: 'cat-5', name: 'Salud',           icon: '💊', color: '#f5a623', amount: 150,  spent: 32  },
]