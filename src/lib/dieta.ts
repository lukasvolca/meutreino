// Lógica da dieta: meta diária, busca de alimentos (TACO) e cálculo de porções.

export type Macros = { kcal: number; proteina: number; carbo: number; gordura: number }

export type Alimento = {
  ref: string            // "taco:123" | "u:<uuid>"
  nome: string
  categoria: string
  por100: Macros
  medidas: [string, number][]   // [rótulo, gramas]
  porcaoPadrao?: number
}

/** Item de um plano de refeição ou de um registro: valores já calculados para a porção. */
export type ItemPorcao = Macros & { ref: string | null; nome: string; gramas: number }

export const ZERO: Macros = { kcal: 0, proteina: 0, carbo: 0, gordura: 0 }

export function soma(itens: Macros[]): Macros {
  return itens.reduce((a, i) => ({
    kcal: a.kcal + Number(i.kcal),
    proteina: a.proteina + Number(i.proteina),
    carbo: a.carbo + Number(i.carbo),
    gordura: a.gordura + Number(i.gordura),
  }), { ...ZERO })
}

const r1 = (v: number) => Math.round(v * 10) / 10

export function porcao(a: Alimento, gramas: number): ItemPorcao {
  const f = gramas / 100
  return {
    ref: a.ref, nome: a.nome, gramas: r1(gramas),
    kcal: r1(a.por100.kcal * f), proteina: r1(a.por100.proteina * f),
    carbo: r1(a.por100.carbo * f), gordura: r1(a.por100.gordura * f),
  }
}

// ── Meta diária ───────────────────────────────────────────────────────────────

export const ATIVIDADES = [
  { id: 'sedentario', label: 'Sedentário', desc: 'Pouco movimento fora do treino', fator: 1.2 },
  { id: 'leve', label: 'Leve', desc: 'Treina 1–3x por semana', fator: 1.375 },
  { id: 'moderado', label: 'Moderado', desc: 'Treina 3–5x por semana', fator: 1.55 },
  { id: 'intenso', label: 'Intenso', desc: 'Treina 6–7x por semana', fator: 1.725 },
  { id: 'atleta', label: 'Atleta', desc: 'Treino pesado + trabalho físico', fator: 1.9 },
] as const

export type PerfilMeta = {
  sexo: 'm' | 'f'
  idade: number
  alturaCm: number
  pesoKg: number
  atividade: string
  objetivo: string | null   // hipertrofia | emagrecimento | forca
}

/**
 * Mifflin-St Jeor × fator de atividade, ajustado pelo objetivo.
 * Proteína por kg de peso, gordura ~0,9 g/kg (mín. 20% das kcal), carbo no restante.
 */
export function calcularMeta(p: PerfilMeta): Macros {
  const tmb = 10 * p.pesoKg + 6.25 * p.alturaCm - 5 * p.idade + (p.sexo === 'm' ? 5 : -161)
  const fator = ATIVIDADES.find(a => a.id === p.atividade)?.fator ?? 1.55
  const gasto = tmb * fator
  const ajuste = p.objetivo === 'emagrecimento' ? 0.8 : p.objetivo === 'hipertrofia' ? 1.1 : 1.05
  const kcal = Math.round(gasto * ajuste / 10) * 10

  const proteina = Math.round(p.pesoKg * (p.objetivo === 'emagrecimento' ? 2.2 : 2.0))
  const gordura = Math.round(Math.max(p.pesoKg * 0.9, (kcal * 0.2) / 9))
  const carbo = Math.max(0, Math.round((kcal - proteina * 4 - gordura * 9) / 4))
  return { kcal, proteina, carbo, gordura }
}

// ── Busca de alimentos ────────────────────────────────────────────────────────

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

type TacoData = {
  foods: [number, string, string, number, number, number, number][]
  medidas: Record<string, [string, number][]>
}

// Variedades mais consumidas: sobem na busca
const COMUNS = ['tipo 1', 'peito, sem pele', 'carioca', 'inteiro, cozido', 'prata', 'nanica', 'frances', 'patinho', 'de vaca']

let tacoCache:{ lista: Alimento[]; idx: string[] } | null = null

/** Carrega a TACO sob demanda (chunk separado, fica em cache no app). */
export async function carregarTaco(): Promise<Alimento[]> {
  if (tacoCache) return tacoCache.lista
  const data = (await import('./taco-data.json')).default as unknown as TacoData
  const lista: Alimento[] = data.foods.map(([id, nome, categoria, kcal, proteina, carbo, gordura]) => ({
    ref: `taco:${id}`, nome, categoria,
    por100: { kcal, proteina, carbo, gordura },
    medidas: data.medidas[String(id)] ?? [],
  }))
  tacoCache = { lista, idx: lista.map(a => normalizar(a.nome)) }
  return lista
}

/**
 * Busca por palavras (todas precisam aparecer, em qualquer ordem, sem acento).
 * "frango grelhado" acha "Frango, peito, sem pele, grelhado".
 */
export function buscar(lista: Alimento[], termo: string, limite = 40): Alimento[] {
  const palavras = normalizar(termo).split(/[\s,]+/).filter(Boolean)
  if (palavras.length === 0) return []
  const out: { a: Alimento; score: number }[] = []
  for (const a of lista) {
    const n = normalizar(a.nome)
    if (!palavras.every(p => n.includes(p))) continue
    // Prioriza: nome principal igual ao termo ("Arroz, …" antes de "Arroz carreteiro"),
    // versões mais comuns no dia a dia, nomes curtos e preparos prontos para comer
    let score = n.length
    if (n.startsWith(palavras[0])) score -= 100
    if (n.split(',')[0].trim() === palavras[0]) score -= 60
    if (COMUNS.some(c => n.includes(c))) score -= 25
    if (/\bcru[as]?\b/.test(n)) score += 15
    out.push({ a, score })
  }
  return out.sort((x, y) => x.score - y.score).slice(0, limite).map(x => x.a)
}

/** Converte um alimento cadastrado pelo usuário para o formato de busca. */
export function alimentoDoUsuario(u: {
  id: string; nome: string; kcal: number; proteina: number; carbo: number; gordura: number; porcao_g: number | null
}): Alimento {
  return {
    ref: `u:${u.id}`, nome: u.nome, categoria: 'Meus alimentos',
    por100: { kcal: Number(u.kcal), proteina: Number(u.proteina), carbo: Number(u.carbo), gordura: Number(u.gordura) },
    medidas: u.porcao_g ? [['porção', Number(u.porcao_g)]] : [],
    porcaoPadrao: u.porcao_g ? Number(u.porcao_g) : undefined,
  }
}

/** Primeira palavra-chave do nome TACO para exibição curta: "Frango, peito, grelhado" → "Frango · peito, grelhado". */
export function nomeCurto(nome: string): { titulo: string; detalhe: string } {
  const [titulo, ...resto] = nome.split(', ')
  return { titulo, detalhe: resto.join(', ') }
}

export const REFEICOES_PADRAO = ['Café da manhã', 'Almoço', 'Lanche da tarde', 'Jantar']
