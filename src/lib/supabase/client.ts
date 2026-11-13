/* eslint-disable @typescript-eslint/no-explicit-any */
// Cliente de dados do MeuTreino. Fala com a API PHP em /api (HostGator) e imita a
// parte da interface do supabase-js que o app usa — assim as telas quase não mudam.
//   createClient().from('fichas').select('*').eq('user_id', id).order('ordem')
//   createClient().auth.signInWithPassword({ email, password })

import type { Database } from './types'

type Tables = Database['public']['Tables']
type TableName = keyof Tables
export type ApiError = { message: string; code?: string }
export type Result<T = any> = { data: T; error: ApiError | null }

const API = '/api'

async function call(path: string, init: RequestInit & { signal?: AbortSignal } = {}): Promise<Result> {
  try {
    const res = await fetch(API + path, {
      ...init,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-MT': '1', ...(init.headers ?? {}) },
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mt:unauthorized'))
    }
    if (!json) return { data: null, error: { message: `Erro ${res.status}`, code: String(res.status) } }
    return { data: json.data ?? null, error: json.error ?? null }
  } catch (e) {
    const abort = e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')
    return { data: null, error: { message: abort ? 'Tempo esgotado (sem conexão?)' : 'Sem conexão', code: 'network' } }
  }
}

type Payload = {
  table: string
  op: 'select' | 'insert' | 'upsert' | 'update' | 'delete'
  select?: string
  values?: unknown
  filters: [string, string, unknown][]
  order: [string, boolean][]
  limit?: number
  single?: 'one' | 'maybe'
}

class Query<Row = any, R = Row[]> implements PromiseLike<Result<R | null>> {
  private p: Payload
  private signal?: AbortSignal

  constructor(table: string) {
    this.p = { table, op: 'select', filters: [], order: [] }
  }

  select(cols = '*') { this.p.select = cols; return this }
  insert(values: Partial<Row> | Partial<Row>[] | Record<string, unknown> | Record<string, unknown>[]) { this.p.op = 'insert'; this.p.values = values; return this }
  upsert(values: Partial<Row> | Record<string, unknown>) { this.p.op = 'upsert'; this.p.values = values; return this }
  update(values: Partial<Row> | Record<string, unknown>) { this.p.op = 'update'; this.p.values = values; return this }
  delete() { this.p.op = 'delete'; return this }

  private f(col: string, op: string, v: unknown) { this.p.filters.push([col, op, v]); return this }
  eq(col: string, v: unknown) { return this.f(col, 'eq', v) }
  neq(col: string, v: unknown) { return this.f(col, 'neq', v) }
  gt(col: string, v: unknown) { return this.f(col, 'gt', v) }
  gte(col: string, v: unknown) { return this.f(col, 'gte', v) }
  lt(col: string, v: unknown) { return this.f(col, 'lt', v) }
  lte(col: string, v: unknown) { return this.f(col, 'lte', v) }
  in(col: string, v: unknown[]) { return this.f(col, 'in', v) }
  is(col: string, v: null) { void v; return this.f(col, 'is', null) }
  not(col: string, op: 'is', v: null) { void op; void v; return this.f(col, 'not_is', null) }

  order(col: string, opts: { ascending?: boolean } = {}) { this.p.order.push([col, opts.ascending ?? true]); return this }
  limit(n: number) { this.p.limit = n; return this }
  single(): Query<Row, Row> { this.p.single = 'one'; return this as unknown as Query<Row, Row> }
  maybeSingle(): Query<Row, Row | null> { this.p.single = 'maybe'; return this as unknown as Query<Row, Row | null> }
  abortSignal(s: AbortSignal) { this.signal = s; return this }

  then<A = Result<R | null>, B = never>(ok?: ((v: Result<R | null>) => A | PromiseLike<A>) | null, err?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    const body = { ...this.p }
    if (body.op === 'select' && body.select === undefined) body.select = '*'
    return (call('/q', { method: 'POST', body: JSON.stringify(body), signal: this.signal }) as Promise<Result<R | null>>).then(ok, err)
  }
}

export type AuthUser = {
  id: string
  email: string
  profile?: { nome: string; objetivo: string | null; role: string }
}

const auth = {
  async getUser(): Promise<Result<{ user: AuthUser | null }>> {
    const r = await call('/auth/me', { method: 'GET' })
    return { data: { user: r.data?.user ?? null }, error: r.error }
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    return call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { nome?: string } } }) {
    return call('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, nome: options?.data?.nome ?? '' }) })
  },
  async signOut() {
    return call('/auth/logout', { method: 'POST', body: '{}' })
  },
}

const client = {
  from<K extends TableName>(table: K) { return new Query<Tables[K]['Row']>(table) },
  auth,
}

export function createClient() {
  return client
}

/**
 * Limite de tempo para gravações. Com sinal ruim a conexão pode ficar pendurada
 * sem nunca falhar; assim o erro aparece e dá para tentar de novo.
 * Uso: supabase.from('x').insert(...).abortSignal(limite())
 */
export const limite = (ms = 15000) => AbortSignal.timeout(ms)
