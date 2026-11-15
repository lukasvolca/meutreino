// Formato que a API devolve ao ler uma ficha (api/importar.php → importar_schema).

export type TipoEx = 'forca' | 'iso' | 'cardio'

export type ExLido = {
  nome: string
  texto_original: string
  grupo: string | null
  tipo: TipoEx
  is_biset: boolean
  series: number
  reps: string
  ultima_ate_falha: boolean
  duracao_seg: number | null
  duracao_min: number | null
  descanso_seg: number | null
  carga: number | null
  carga_b: number | null
  observacao: string | null
  confianca: 'alta' | 'baixa'
  motivo_duvida: string | null
}

export type FichaLida = { letra: string; nome: string; exercicios: ExLido[] }

export type Programa = {
  nome: string | null
  duracao_dias: number | null
  semanas: { semana: number; dias: { dia: string; letra: string | null }[]; metodologia: string | null; progressao_carga: string | null }[]
  cardio: {
    antes_min: number | null
    depois_min: number | null
    semanas: { semana: number; minutos: number | null; bpm: string | null; metodo: string | null }[]
    observacao: string | null
  } | null
  observacoes: string[]
}

export type Leitura = {
  importacao_id: string
  legivel: boolean
  fichas: FichaLida[]
  programa: Programa
  avisos: string[]
}

/** Exercício em revisão: o que veio da leitura + chave local e se o aluno já conferiu. */
export type ExRev = ExLido & { key: string; conferido: boolean }
export type FichaRev = { key: string; letra: string; nome: string; cor: string; exercicios: ExRev[] }

export const CORES = ['#CCFF00', '#00E5FF', '#FF5E1F', '#FF3B5C', '#A78BFA', '#34D399']

let seq = 0
export const novaKey = () => `k${++seq}`

export function paraRevisao(l: Leitura): FichaRev[] {
  return l.fichas.map((f, i) => ({
    key: novaKey(),
    letra: (f.letra || String.fromCharCode(65 + i)).slice(0, 4).toUpperCase(),
    nome: f.nome,
    cor: CORES[i % CORES.length],
    exercicios: f.exercicios.flatMap(separarBiset).map(e => ({ ...e, key: novaKey(), conferido: e.confianca === 'alta' })),
  }))
}

/** Bi-set ("Rosca Alternada + Rosca Concentrada") vira dois exercícios seguidos: o primeiro
 *  sem descanso (vai direto para o próximo) e o segundo com o descanso da ficha. */
function separarBiset(e: ExLido): ExLido[] {
  if (!e.is_biset || e.tipo !== 'forca') return [e]
  const partes = e.nome.split(/\s*\+\s*/).map(p => p.trim()).filter(Boolean)
  if (partes.length !== 2) return [{ ...e, is_biset: false }]
  return [
    { ...e, nome: partes[0], is_biset: false, carga_b: null, descanso_seg: 0 },
    { ...e, nome: partes[1], is_biset: false, carga: e.carga_b, carga_b: null },
  ]
}

export function exVazio(): ExRev {
  return {
    key: novaKey(), conferido: true, nome: '', texto_original: '', grupo: null, tipo: 'forca', is_biset: false,
    series: 3, reps: '10', ultima_ate_falha: false, duracao_seg: null, duracao_min: null, descanso_seg: 60,
    carga: null, carga_b: null, observacao: null, confianca: 'alta', motivo_duvida: null,
  }
}

/** Resumo curto de um exercício: "3 × 8 a 12 · falha · 40 s". */
export function resumoEx(e: ExLido): string {
  const partes: string[] = []
  if (e.tipo === 'iso') partes.push(`${e.series} × ${e.duracao_seg ?? '?'} s`)
  else if (e.tipo === 'cardio') partes.push(`${e.duracao_min ?? '?'} min`)
  else partes.push(`${e.series} × ${e.reps || '?'}`)
  if (e.tipo === 'forca' && e.ultima_ate_falha) partes.push('última até a falha')
  if (e.descanso_seg === 0) partes.push("sem descanso, vai direto ao próximo")
  else if (e.descanso_seg) partes.push(`${e.descanso_seg} s de descanso`)
  return partes.join(' · ')
}
