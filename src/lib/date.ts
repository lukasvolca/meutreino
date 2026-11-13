// Datas do app sempre no fuso de Brasília. O servidor (Vercel) roda em UTC,
// então `toISOString()` virava o dia às 21h no horário local.
const TZ = 'America/Sao_Paulo'

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
})

/** Data (YYYY-MM-DD) de um instante, no fuso de Brasília. */
export function isoDateBR(d: Date = new Date()): string {
  return fmt.format(d)
}

/** Hoje (YYYY-MM-DD) no fuso de Brasília. */
export function todayBR(): string {
  return isoDateBR()
}

/** Soma dias a uma data YYYY-MM-DD (aritmética de calendário, sem fuso). */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Segunda-feira da semana de uma data YYYY-MM-DD. */
export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const day = d.getUTCDay()
  return addDays(dateStr, day === 0 ? -6 : 1 - day)
}
