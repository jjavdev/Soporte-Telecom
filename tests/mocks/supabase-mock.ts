import { vi } from 'vitest'

export type QueryResult = { data?: unknown; error?: { message: string } | null }
export type TableOps = Partial<Record<'select' | 'insert' | 'update' | 'delete', QueryResult>>

const tableResults: Record<string, TableOps> = {}

export function setTableResults(table: string, ops: TableOps) {
  tableResults[table] = { ...tableResults[table], ...ops }
}

export function resetTableResults() {
  for (const key of Object.keys(tableResults)) delete tableResults[key]
  mockSupabase.from.mockClear()
}

const CHAIN_METHODS = [
  'select', 'insert', 'update', 'delete',
  'eq', 'neq', 'in', 'order', 'ilike', 'like',
  'limit', 'single', 'maybeSingle', 'range',
] as const

function makeChain(table: string) {
  let op: string | null = null
  const chain: Record<string, unknown> = {}

  for (const method of CHAIN_METHODS) {
    chain[method] = vi.fn(() => {
      if (op === null && ['select', 'insert', 'update', 'delete'].includes(method)) {
        op = method
      }
      return chain
    })
  }

  chain.then = (resolve: (v: QueryResult) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(tableResults[table]?.[op ?? 'select'] ?? { data: null, error: null })
      .then(resolve, reject)

  return chain
}

export const mockSupabase = {
  from: vi.fn((table: string) => makeChain(table)),
  auth: {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
}
