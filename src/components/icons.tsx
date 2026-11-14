// Ícones do app: conjunto Lucide (traço fino, cantos arredondados) com os mesmos
// nomes usados no código desde o protótipo. Supino e agachamento não existem no
// Lucide e foram desenhados aqui no mesmo grid de 24px e traço.
import {
  Accessibility, Activity, Apple, ArrowDown, ArrowLeftRight, ArrowUp, Award, Bell, BicepsFlexed, Bike, Brain,
  Calendar, Camera, ChartLine, Check, ChevronDown, ChevronLeft, ChevronRight, CirclePlay, Crown, Dumbbell,
  Ellipsis, Flame, Footprints, Gauge, Goal, GripVertical, Heart, HeartPulse, History, Hourglass, House, Info,
  LogOut, Medal, MessageCircle, Minus, MonitorPlay, Mountain, Pause, Pencil, PersonStanding, Phone, Play, Plus,
  Rocket, Search, Settings, Shield, Star, Swords, Target, Timer, Trash2, Trophy, User, Waves, Weight, X, Zap,
  type LucideIcon,
} from 'lucide-react'

interface IconProps {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
}

const LUCIDE: Record<string, LucideIcon> = {
  home: House, dumbbell: Dumbbell, chart: ChartLine, body: PersonStanding, history: History,
  play: Play, playCircle: CirclePlay, check: Check, plus: Plus, minus: Minus, x: X,
  chevronRight: ChevronRight, chevronLeft: ChevronLeft, chevronDown: ChevronDown,
  settings: Settings, timer: Timer, flame: Flame, drag: GripVertical, trash: Trash2, edit: Pencil,
  arrowUp: ArrowUp, arrowDown: ArrowDown, bolt: Zap, target: Target, camera: Camera, youtube: MonitorPlay,
  search: Search, swap: ArrowLeftRight, more: Ellipsis, pause: Pause, bell: Bell, chat: MessageCircle,
  phone: Phone, user: User, logout: LogOut, info: Info, trophy: Trophy, calendar: Calendar, apple: Apple,
  bicep: BicepsFlexed,
  // Extras para as fichas
  heartPulse: HeartPulse, activity: Activity, bike: Bike, footprints: Footprints, mountain: Mountain,
  waves: Waves, medal: Medal, award: Award, swords: Swords, gauge: Gauge, weight: Weight, rocket: Rocket,
  star: Star, crown: Crown, shield: Shield, brain: Brain, heart: Heart, goal: Goal, hourglass: Hourglass,
  mobility: Accessibility,
}

// Desenhos próprios (grid 24, traço arredondado, mesma espessura do Lucide)
function Custom({ name, size, color, strokeWidth, style }: Required<Omit<IconProps, 'style'>> & { style?: React.CSSProperties }) {
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'benchPress') return (
    // Supino: barra com anilhas sobre o banco, atleta deitado
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
      <path d="M3 6h18" {...p}/>
      <rect x="4" y="3.5" width="2.5" height="5" rx="1" {...p}/>
      <rect x="17.5" y="3.5" width="2.5" height="5" rx="1" {...p}/>
      <path d="M9 6v4M15 6v4" {...p}/>
      <circle cx="6.5" cy="12.5" r="1.5" {...p}/>
      <path d="M8.5 13h9" {...p}/>
      <path d="M3 16.5h18M6 16.5V20M18 16.5V20" {...p}/>
    </svg>
  )
  if (name === 'squat') return (
    // Agachamento: barra nas costas, quadril para trás, joelhos à frente
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
      <path d="M4 7h16" {...p}/>
      <rect x="2.5" y="4.5" width="2" height="5" rx="1" {...p}/>
      <rect x="19.5" y="4.5" width="2" height="5" rx="1" {...p}/>
      <circle cx="13" cy="3.6" r="1.4" {...p}/>
      <path d="M12.5 7.5 10 12.5l5 2-1 6.5" {...p}/>
      <path d="M10 12.5l-1.5 3.5 1 4.5" {...p}/>
    </svg>
  )
  return null
}

export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }: IconProps) {
  const L = LUCIDE[name]
  if (L) return <L size={size} color={color} strokeWidth={strokeWidth} style={style} aria-hidden/>
  return <Custom name={name} size={size} color={color} strokeWidth={strokeWidth} style={style}/>
}

/** Ícones que podem ser escolhidos para uma ficha (ordem do seletor). */
export const FICHA_ICONES = [
  'dumbbell', 'benchPress', 'bicep', 'squat', 'weight', 'flame', 'bolt',
  'heartPulse', 'activity', 'target', 'trophy', 'medal', 'award', 'crown',
  'timer', 'hourglass', 'gauge', 'body', 'mobility', 'footprints', 'bike',
  'waves', 'mountain', 'swords', 'shield', 'rocket', 'star', 'heart',
  'brain', 'goal', 'chart', 'calendar', 'apple', 'history',
]

/** Fichas antigas podem ter emoji salvo; esses passam a mostrar o halter. */
export function iconeDaFicha(icone: string | null | undefined): string | null {
  if (!icone) return null
  return FICHA_ICONES.includes(icone) ? icone : 'dumbbell'
}
