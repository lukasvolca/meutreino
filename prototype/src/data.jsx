// data.jsx — sample data for MeuTreino prototype
// All weights in kg, "carga" = working weight.

const ALUNO = {
  nome: 'Tiago Lemos',
  iniciais: 'TL',
  desde: 'Mar 2025',
  desdeMeses: 14,
  email: 'tiago.lemos@email.com',
  objetivo: 'Hipertrofia',
  streak: 14,
  treinosSemana: 4,
  treinosMes: 17,
  treinosTotal: 186,
  personal: {
    nome: 'Lucas Andrade',
    telefone: '+55 11 98765-4321',
  },
  nutricionista: {
    nome: 'Dra. Marina Ribeiro',
    telefone: '+55 11 91234-5678',
  },
};

// Exercise YouTube IDs are real, well-known instructional videos.
const FICHAS = [
  {
    id: 'A',
    letra: 'A',
    icone: 'benchPress',
    nome: 'Push · Peito · Ombro · Tríceps',
    cor: '#CCFF00',
    duracaoMin: 62,
    foco: ['Peito', 'Ombros', 'Tríceps'],
    exercicios: [
      {
        id: 'ex-1', nome: 'Supino reto com barra', grupo: 'Peito',
        series: 4, reps: '8-10', carga: 72.5, descanso: 90,
        ytId: 'rT7DgCr-3pg',
        historico: [60, 62.5, 65, 67.5, 70, 72.5],
      },
      {
        id: 'ex-2', nome: 'Supino inclinado halter', grupo: 'Peito sup.',
        series: 3, reps: '10-12', carga: 26, descanso: 75,
        ytId: '8iPEnn-ltC8',
        historico: [20, 22, 22, 24, 26, 26],
      },
      {
        id: 'ex-3', nome: 'Desenvolvimento militar', grupo: 'Ombros',
        series: 4, reps: '6-8', carga: 50, descanso: 90,
        ytId: 'qEwKCR5JCog',
        historico: [42.5, 45, 45, 47.5, 47.5, 50],
      },
      {
        id: 'ex-4', nome: 'Elevação lateral', grupo: 'Ombros',
        series: 3, reps: '12-15', carga: 10, descanso: 60,
        ytId: '3VcKaXpzqRo',
        historico: [8, 8, 9, 9, 10, 10],
      },
      {
        id: 'ex-5', nome: 'Tríceps corda', grupo: 'Tríceps',
        series: 3, reps: '12-15', carga: 22, descanso: 60,
        ytId: 'kiuVA0gs3EI',
        historico: [16, 18, 20, 20, 22, 22],
      },
      {
        id: 'ex-6', nome: 'Tríceps francês', grupo: 'Tríceps',
        series: 3, reps: '10-12', carga: 14, descanso: 60,
        ytId: 'YbX7Wd8jQ-Q',
        historico: [10, 12, 12, 12, 14, 14],
      },
      {
        id: 'ex-6b', nome: 'Prancha isométrica', grupo: 'Core',
        tipo: 'iso',
        series: 3, duracaoSeg: 45, descanso: 45,
        ytId: 'ASdvN_XEl_c',
        historico: [30, 35, 40, 40, 45, 45], // segundos
      },
    ],
  },
  {
    id: 'B',
    letra: 'B',
    icone: 'bicep',
    nome: 'Pull · Costas · Bíceps',
    cor: '#00E5FF',
    duracaoMin: 58,
    foco: ['Costas', 'Bíceps', 'Posterior'],
    exercicios: [
      {
        id: 'ex-7', nome: 'Barra fixa pegada pronada', grupo: 'Dorsal',
        series: 4, reps: '6-10', carga: 0, descanso: 90,
        ytId: 'eGo4IYlbE5g',
        historico: [0, 0, 0, 5, 5, 0],
      },
      {
        id: 'ex-8', nome: 'Remada curvada barra', grupo: 'Costas',
        series: 4, reps: '8-10', carga: 60, descanso: 90,
        ytId: 'kBWAon7ItDw',
        historico: [50, 52.5, 55, 57.5, 60, 60],
      },
      {
        id: 'ex-9', nome: 'Pulldown pegada neutra', grupo: 'Dorsal',
        series: 3, reps: '10-12', carga: 55, descanso: 75,
        ytId: 'CAwf7n6Luuc',
        historico: [45, 47.5, 50, 50, 52.5, 55],
      },
      {
        id: 'ex-10', nome: 'Remada baixa cabo', grupo: 'Costas',
        series: 3, reps: '10-12', carga: 50, descanso: 75,
        ytId: 'GZbfZ033f74',
        historico: [40, 42.5, 45, 45, 47.5, 50],
      },
      {
        id: 'ex-11', nome: 'Rosca direta barra W', grupo: 'Bíceps',
        series: 3, reps: '10-12', carga: 22, descanso: 60,
        ytId: 'kwG2ipFRgfo',
        historico: [16, 18, 18, 20, 22, 22],
      },
      {
        id: 'ex-12', nome: 'Rosca martelo', grupo: 'Bíceps',
        series: 3, reps: '12-15', carga: 14, descanso: 60,
        ytId: 'TwD-YGVP4Bk',
        historico: [10, 12, 12, 12, 14, 14],
      },
    ],
  },
  {
    id: 'C',
    letra: 'C',
    icone: 'squat',
    nome: 'Legs · Quadríceps · Posterior · Glúteo',
    cor: '#FF5E1F',
    duracaoMin: 70,
    foco: ['Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha'],
    exercicios: [
      {
        id: 'ex-13', nome: 'Agachamento livre', grupo: 'Quadríceps',
        series: 5, reps: '5-8', carga: 100, descanso: 120,
        ytId: 'ultWZbUMPL8',
        historico: [80, 85, 90, 92.5, 95, 100],
      },
      {
        id: 'ex-14', nome: 'Stiff com halteres', grupo: 'Posterior',
        series: 4, reps: '8-10', carga: 30, descanso: 90,
        ytId: '7AcRGRMr_BU',
        historico: [22, 24, 26, 28, 28, 30],
      },
      {
        id: 'ex-15', nome: 'Leg press 45°', grupo: 'Quadríceps',
        series: 4, reps: '10-12', carga: 180, descanso: 90,
        ytId: 'IZxyjW7MPJQ',
        historico: [140, 150, 160, 170, 175, 180],
      },
      {
        id: 'ex-16', nome: 'Cadeira flexora', grupo: 'Posterior',
        series: 3, reps: '12-15', carga: 45, descanso: 60,
        ytId: '1Tq3QdYUuHs',
        historico: [35, 37.5, 40, 42.5, 45, 45],
      },
      {
        id: 'ex-17', nome: 'Panturrilha em pé', grupo: 'Panturrilha',
        series: 4, reps: '15-20', carga: 80, descanso: 45,
        ytId: '-M4-G8p8fmc',
        historico: [60, 65, 70, 75, 80, 80],
      },
      {
        id: 'ex-18', nome: 'Esteira · caminhada inclinada', grupo: 'Cardio',
        tipo: 'cardio',
        duracaoMin: 15, intensidade: '6 km/h · 8% incl.',
        ytId: 'kVnyY17VS9Y',
        historico: [10, 12, 12, 15, 15, 15], // minutos
      },
    ],
  },
];

const HOJE = 'A'; // ficha de hoje

// Histórico de treinos completados (últimas semanas)
// volume = total kg movidos (sets * reps médio * carga, simplificado)
const HISTORICO = [
  { data: '2026-05-19', ficha: 'A', dur: 64, volume: 8420, pr: 1 },
  { data: '2026-05-17', ficha: 'C', dur: 71, volume: 12600, pr: 0 },
  { data: '2026-05-15', ficha: 'B', dur: 56, volume: 7250, pr: 1 },
  { data: '2026-05-13', ficha: 'A', dur: 60, volume: 8080, pr: 0 },
  { data: '2026-05-10', ficha: 'C', dur: 68, volume: 12180, pr: 1 },
  { data: '2026-05-08', ficha: 'B', dur: 58, volume: 7100, pr: 0 },
  { data: '2026-05-06', ficha: 'A', dur: 62, volume: 7920, pr: 0 },
  { data: '2026-05-04', ficha: 'C', dur: 70, volume: 11900, pr: 0 },
  { data: '2026-05-02', ficha: 'B', dur: 54, volume: 6940, pr: 1 },
  { data: '2026-04-29', ficha: 'A', dur: 61, volume: 7780, pr: 0 },
  { data: '2026-04-27', ficha: 'C', dur: 69, volume: 11620, pr: 0 },
  { data: '2026-04-25', ficha: 'B', dur: 55, volume: 6800, pr: 0 },
  { data: '2026-04-23', ficha: 'A', dur: 60, volume: 7650, pr: 1 },
  { data: '2026-04-21', ficha: 'C', dur: 67, volume: 11400, pr: 0 },
  { data: '2026-04-19', ficha: 'B', dur: 53, volume: 6650, pr: 0 },
  { data: '2026-04-17', ficha: 'A', dur: 59, volume: 7480, pr: 0 },
];

// Medidas corporais — histórico
const MEDIDAS = [
  {
    data: '2026-05-15',
    peso: 78.4, altura: 178,
    gordura: 14.2,
    bracoD: 38.5, bracoE: 38.2,
    peito: 102, cintura: 82, quadril: 98,
    coxaD: 60, coxaE: 59.7,
    panturrilha: 38,
  },
  {
    data: '2026-04-15',
    peso: 77.8, altura: 178,
    gordura: 14.8,
    bracoD: 38.0, bracoE: 37.7,
    peito: 101, cintura: 83, quadril: 98,
    coxaD: 59.5, coxaE: 59.2,
    panturrilha: 37.8,
  },
  {
    data: '2026-03-15',
    peso: 76.5, altura: 178,
    gordura: 15.6,
    bracoD: 37.2, bracoE: 36.9,
    peito: 100, cintura: 84, quadril: 98,
    coxaD: 58.8, coxaE: 58.5,
    panturrilha: 37.5,
  },
  {
    data: '2026-02-15',
    peso: 75.6, altura: 178,
    gordura: 16.4,
    bracoD: 36.5, bracoE: 36.3,
    peito: 99, cintura: 85, quadril: 99,
    coxaD: 58.2, coxaE: 58.0,
    panturrilha: 37.2,
  },
  {
    data: '2026-01-15',
    peso: 75.0, altura: 178,
    gordura: 17.1,
    bracoD: 36.0, bracoE: 35.8,
    peito: 98, cintura: 86, quadril: 99,
    coxaD: 57.8, coxaE: 57.6,
    panturrilha: 37.0,
  },
];

// Mock weekly volume (last 12 weeks) - for dashboard mini chart
const VOLUME_SEMANAL = [22100, 23800, 24400, 25100, 26200, 25700, 27000, 27600, 28100, 28900, 29500, 30200];

// Média móvel da duração — usa as últimas N sessões da ficha em HISTORICO,
// opcionalmente combinada com sessões finalizadas dentro da sessão atual.
function avgDurationForFicha(letter, extras = [], windowSize = 5) {
  const past = HISTORICO.filter(h => h.ficha === letter).slice(0, windowSize).map(h => h.dur);
  const all = [...extras, ...past].slice(0, windowSize);
  if (!all.length) return null;
  return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
}

// Notificações
const NOTIFICACOES = [
  {
    id: 'n1', tipo: 'personal',
    titulo: 'Lucas atualizou sua ficha B',
    msg: 'Troquei rosca direta por rosca W e ajustei a carga. Bora!',
    quando: 'agora há pouco', lido: false,
  },
  {
    id: 'n2', tipo: 'pr',
    titulo: 'Novo PR no Supino reto',
    msg: 'Você bateu 72,5kg — antes 70kg. +2,5kg em 2 semanas.',
    quando: 'há 2h', lido: false,
  },
  {
    id: 'n3', tipo: 'streak',
    titulo: 'Streak de 14 dias',
    msg: 'Dia 14 sem falhar — não quebra essa hoje.',
    quando: 'ontem', lido: true,
  },
  {
    id: 'n4', tipo: 'nutri',
    titulo: 'Dra. Marina enviou o cardápio',
    msg: 'Plano atualizado pra fase de hipertrofia. Confere no WhatsApp.',
    quando: 'ontem', lido: true,
  },
  {
    id: 'n5', tipo: 'medida',
    titulo: 'Hora de medir o corpo',
    msg: 'Já faz 30 dias desde sua última avaliação. Tira 5min hoje.',
    quando: 'há 3 dias', lido: true,
  },
  {
    id: 'n6', tipo: 'sistema',
    titulo: 'Bem-vindo ao MeuTreino',
    msg: 'Conta criada — sua jornada começa agora.',
    quando: 'Mar 2025', lido: true,
  },
];

// formata segundos como mm:ss (ou s")
function fmtSec(s) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); const r = s % 60;
  return r ? `${m}:${String(r).padStart(2, '0')}` : `${m}min`;
}

// ── Dieta ─────────────────────────────────────────────────────────────────
// Plano alimentar do dia. Macros em gramas; kcal calculada.
const DIETA = {
  data: '2026-05-21',
  alvo: { kcal: 2800, c: 320, p: 200, g: 75 },
  refeicoes: [
    {
      id: 'r1', nome: 'Café da manhã', horario: '07:00', icone: 'sun',
      kcal: 520, c: 62, p: 32, g: 14,
      ingredientes: [
        { nome: 'Aveia em flocos finos', qtd: '60g', c: 36, p: 8, g: 4 },
        { nome: 'Leite desnatado',       qtd: '200ml', c: 10, p: 7, g: 0 },
        { nome: 'Banana nanica',         qtd: '1 un (100g)', c: 23, p: 1, g: 0 },
        { nome: 'Ovo inteiro',           qtd: '2 un',   c: 1,  p: 12, g: 10 },
        { nome: 'Pasta de amendoim',     qtd: '15g',    c: 3,  p: 4,  g: 8 },
      ],
      preparo:
        'Aqueça o leite e despeje sobre a aveia, mexa até engrossar (3min). '
        + 'Adicione a banana picada e a pasta de amendoim por cima. '
        + 'Os ovos vão mexidos numa frigideira antiaderente em fogo médio, sem óleo.',
      ytId: 'tH3ZN5FYKHs',
    },
    {
      id: 'r2', nome: 'Lanche da manhã', horario: '10:00', icone: 'apple',
      kcal: 280, c: 32, p: 18, g: 8,
      ingredientes: [
        { nome: 'Iogurte natural integral', qtd: '170g', c: 8, p: 10, g: 5 },
        { nome: 'Granola sem açúcar',       qtd: '30g',  c: 18, p: 4, g: 3 },
        { nome: 'Maçã fuji',                qtd: '1 un', c: 22, p: 0, g: 0 },
        { nome: 'Whey protein (opcional)',  qtd: '15g',  c: 1,  p: 12, g: 0 },
      ],
      preparo:
        'Monte uma tigela com o iogurte, jogue a granola por cima, '
        + 'fatias da maçã e — se for dia de treino — uma colher de whey misturada antes.',
      ytId: '',
    },
    {
      id: 'r3', nome: 'Almoço', horario: '12:30', icone: 'utensils',
      kcal: 720, c: 78, p: 55, g: 16,
      ingredientes: [
        { nome: 'Arroz integral cozido',  qtd: '150g', c: 35, p: 4, g: 1 },
        { nome: 'Feijão carioca',         qtd: '120g', c: 25, p: 9, g: 1 },
        { nome: 'Frango grelhado (peito)', qtd: '180g', c: 0, p: 42, g: 6 },
        { nome: 'Salada (folhas + tomate)', qtd: 'à vontade', c: 6, p: 2, g: 0 },
        { nome: 'Azeite extra virgem',    qtd: '1 cs',  c: 0, p: 0, g: 14 },
      ],
      preparo:
        'Tempere o frango com sal, alho e páprica e grelhe 4min de cada lado. '
        + 'Sirva com o arroz, feijão e salada. '
        + 'Regue a salada com o azeite só na hora de comer.',
      ytId: '8K3wgrEpSr8',
    },
    {
      id: 'r4', nome: 'Lanche da tarde', horario: '16:00', icone: 'cookie',
      kcal: 320, c: 38, p: 14, g: 10,
      ingredientes: [
        { nome: 'Pão integral',         qtd: '2 fatias', c: 26, p: 6, g: 2 },
        { nome: 'Queijo branco light',  qtd: '40g',     c: 1, p: 6, g: 4 },
        { nome: 'Peito de peru',        qtd: '40g',     c: 1, p: 8, g: 1 },
        { nome: 'Castanha-do-pará',     qtd: '2 un',    c: 1, p: 1, g: 4 },
        { nome: 'Café preto sem açúcar', qtd: '200ml',  c: 0, p: 0, g: 0 },
      ],
      preparo:
        'Monte o sanduíche, esquente 20s no micro se preferir. '
        + 'As castanhas vão à parte — não exagere, 2 por dia já basta.',
      ytId: '',
    },
    {
      id: 'r5', nome: 'Pré-treino', horario: '18:30', icone: 'bolt',
      kcal: 280, c: 50, p: 14, g: 2,
      ingredientes: [
        { nome: 'Tapioca',              qtd: '40g (massa)', c: 32, p: 0, g: 0 },
        { nome: 'Banana prata',         qtd: '1 un',        c: 22, p: 1, g: 0 },
        { nome: 'Whey protein isolado', qtd: '20g',         c: 1,  p: 16, g: 0 },
        { nome: 'Mel',                  qtd: '1 cc',        c: 6,  p: 0, g: 0 },
      ],
      preparo:
        'Faça a tapioca na frigideira (sem óleo). '
        + 'Recheie com a banana amassada e mel. '
        + 'Tome o whey com água 30min antes do treino.',
      ytId: 'd7zwlIuFQEM',
    },
    {
      id: 'r6', nome: 'Pós-treino / Jantar', horario: '21:00', icone: 'moon',
      kcal: 680, c: 60, p: 60, g: 18,
      ingredientes: [
        { nome: 'Batata-doce assada', qtd: '200g',   c: 40, p: 3, g: 0 },
        { nome: 'Salmão grelhado',    qtd: '150g',   c: 0, p: 32, g: 12 },
        { nome: 'Brócolis no vapor',  qtd: '150g',   c: 10, p: 5, g: 0 },
        { nome: 'Ovo cozido',         qtd: '2 un',   c: 1,  p: 12, g: 10 },
        { nome: 'Limão + ervas',      qtd: 'a gosto', c: 0, p: 0, g: 0 },
      ],
      preparo:
        'Asse a batata-doce em fatias com sal e azeite por 25min a 200°C. '
        + 'Grelhe o salmão tempera­do com limão, sal e ervas — 4min de cada lado. '
        + 'O brócolis cozinha 5min no vapor — não passa do ponto.',
      ytId: 'oUugWXVB6sc',
    },
  ],
};

// Soma macros do dia
function dietaTotal(d = DIETA) {
  return d.refeicoes.reduce((a, r) => ({
    kcal: a.kcal + r.kcal, c: a.c + r.c, p: a.p + r.p, g: a.g + r.g,
  }), { kcal: 0, c: 0, p: 0, g: 0 });
}

Object.assign(window, { ALUNO, FICHAS, HOJE, HISTORICO, MEDIDAS, VOLUME_SEMANAL, NOTIFICACOES, DIETA, avgDurationForFicha, fmtSec, dietaTotal });
