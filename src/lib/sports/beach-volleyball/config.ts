import type { SportModule, SportConfig, SportRuleConfig, SidebarTab, MenuItem, ValidationResult } from "../types"

export const BV_CONFIG: SportConfig = {
  id: "beach_volley",
  name: "Vôlei de Praia",
  label: "Vôlei de Praia",
  icon: "🏐",
}

export const BV_FORMATS = [
  { value: "group_ranking_knockout", label: "Grupo + Ranking + Mata-Mata" },
  { value: "group_knockout", label: "Grupo + Mata-Mata" },
  { value: "double_elimination", label: "Dupla Eliminatória" },
  { value: "ranking_knockout", label: "Ranking + Mata-Mata" },
] as const

export const BV_COURT_SURFACES = [
  { value: "sand", label: "Areia" },
] as const

export const BV_TEAM_SIZES = [
  { value: "double", label: "Dupla", size: 2 },
  { value: "trio", label: "Trio", size: 3 },
  { value: "quartet", label: "Quarteto", size: 4 },
] as const

export const BV_GENDERS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "mixed", label: "Misto" },
] as const

export const BV_LEVELS = [
  { value: "estreante", label: "Estreante" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
  { value: "open", label: "Open" },
] as const

export const BV_ODD_GROUP_POLICIES = [
  { value: "ranking_byes", label: "Ranking com chapéu" },
  { value: "fill_with_best_next_position", label: "Completar com melhores próximos colocados" },
] as const

type BVCategory = { gender: string; level: string; teamSize: string }

function buildBVCategories(): BVCategory[] {
  const categories: BVCategory[] = []
  for (const gender of BV_GENDERS.map(g => g.value)) {
    for (const level of BV_LEVELS.map(l => l.value)) {
      for (const teamSize of BV_TEAM_SIZES.map(t => t.value)) {
        categories.push({ gender, level, teamSize })
      }
    }
  }
  return categories
}

export const BV_CATEGORIES: BVCategory[] = buildBVCategories()

export const BV_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BV_CATEGORIES.map(cat => {
    const key = `${cat.gender}_${cat.level}_${cat.teamSize}`
    const gender = BV_GENDERS.find(g => g.value === cat.gender)?.label ?? cat.gender
    const level = BV_LEVELS.find(l => l.value === cat.level)?.label ?? cat.level
    const teamSize = BV_TEAM_SIZES.find(t => t.value === cat.teamSize)?.label ?? cat.teamSize
    return [key, `${teamSize} ${gender} ${level}`]
  })
)

export function formatBVCategoryName(gender: string, level: string, teamSize: string): string {
  const key = `${gender}_${level}_${teamSize}`
  return BV_CATEGORY_LABELS[key] ?? `${teamSize} ${gender} ${level}`
}

export const BV_RULES: SportRuleConfig = {
  setsPerMatch: [1, 3],
  setsPerMatchLabel: "Melhor de",
  hasTiebreakToggle: false,
  hasSuperTiebreakToggle: false,
  defaultTiebreakScore: 15,
  defaultSuperTiebreakScore: 0,
  scoringFields: [
    { key: "winWithoutLosingSet", label: "Vitória sem perder set", defaultValue: 3, min: 0, max: 10 },
    { key: "winLosingOneSet", label: "Vitória perdendo 1 set", defaultValue: 2, min: 0, max: 10 },
    { key: "lossWinningOneSet", label: "Derrota ganhando 1 set", defaultValue: 1, min: 0, max: 10 },
    { key: "lossWithoutWinningSet", label: "Derrota sem ganhar set", defaultValue: 0, min: 0, max: 10 },
    { key: "winByWO", label: "Vitória por W.O.", defaultValue: 3, min: 0, max: 10 },
    { key: "lossByWO", label: "Derrota por W.O.", defaultValue: 0, min: 0, max: 10 },
  ],
  tiebreakerCriteria: [
    { value: "points", label: "Soma de Pontos" },
    { value: "sets_won", label: "Sets Vencidos" },
    { value: "set_balance", label: "Saldo de Sets" },
    { value: "points_balance", label: "Saldo de Pontos" },
    { value: "direct_confrontation", label: "Confronto Direto" },
    { value: "wins", label: "Vitórias" },
    { value: "fewer_wo", label: "Menos W.O." },
    { value: "draw", label: "Empate" },
  ],
}

export const BV_SIDEBAR_TABS: SidebarTab[] = [
  { id: "overview", label: "Visão Geral", show: true },
  { id: "categories", label: "Categorias", show: true },
  { id: "matches", label: "Confrontos", show: true },
  { id: "my-matches", label: "Meus Jogos", show: true },
  { id: "participants", label: "Participantes", show: true },
  { id: "courts", label: "Quadras", show: true },
  { id: "rules", label: "Regras", show: true },
  { id: "settings", label: "Configurações", show: (ctx) => ctx.isOwner },
]

export const BV_ORGANIZER_MENU: MenuItem[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "categories", label: "Categorias" },
  { id: "matches", label: "Confrontos" },
  { id: "participants", label: "Participantes" },
  { id: "courts", label: "Quadras" },
  { id: "rules", label: "Regras" },
  { id: "settings", label: "Configurações", requiresOwner: true },
]

export const BV_PLAYER_MENU: MenuItem[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "categories", label: "Categorias" },
  { id: "matches", label: "Confrontos" },
  { id: "my-matches", label: "Meus Jogos" },
  { id: "participants", label: "Participantes" },
  { id: "courts", label: "Quadras" },
  { id: "rules", label: "Regras" },
]

export const BV_CREATION_STEPS = [
  { id: "info", label: "Informações", fields: ["name", "description", "location", "address", "city", "state", "startDate", "endDate", "registrationDeadline", "maxParticipants", "isPublic", "inviteCode"] },
  { id: "courts", label: "Quadras", fields: ["courts"] },
  { id: "rules", label: "Regras", fields: ["setsPerMatch", "normalSetPoints", "delayTolerance"] },
  { id: "categories", label: "Categorias", fields: ["selectedCategories"] },
  { id: "scoring", label: "Pontuação", fields: ["scoringConfig"] },
  { id: "review", label: "Revisão", fields: [] },
]

function getDefaultScoringConfig() {
  return {
    winWithoutLosingSet: 3,
    winLosingOneSet: 2,
    lossWinningOneSet: 1,
    lossWithoutWinningSet: 0,
    winByWO: 3,
    lossByWO: 0,
    winByForfeit: 0,
    lossByForfeit: 0,
    withdrawalPenalty: 0,
    delayPenalty: 0,
  }
}

function validateBVConfig(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  const format = data.categoryFormat as string
  if (format && !BV_FORMATS.some(f => f.value === format)) {
    errors.push("Formato de torneio inválido para vôlei de praia")
  }

  const setsPerMatch = Number(data.setsPerMatch)
  if (setsPerMatch && ![1, 3].includes(setsPerMatch)) {
    errors.push("Sets por partida deve ser 1 ou 3 para vôlei de praia")
  }

  return { valid: errors.length === 0, errors }
}

export const beachVolleyballModule: SportModule = {
  config: BV_CONFIG,
  rules: BV_RULES,
  creationSteps: BV_CREATION_STEPS,
  sidebarTabs: BV_SIDEBAR_TABS,
  organizerMenu: BV_ORGANIZER_MENU,
  playerMenu: BV_PLAYER_MENU,
  validateTournamentConfig: validateBVConfig,
  getDefaultTournamentConfig: () => ({
    categoryFormat: "group_ranking_knockout",
    setsPerMatch: 3,
    setsToWin: 2,
    hasTiebreak: true,
    tiebreakScore: 15,
    hasSuperTiebreak: false,
    superTiebreakScore: 0,
    defaultMatchDuration: 60,
    delayTolerance: 0,
    normalSetPoints: 21,
    tiebreakSetPoints: 15,
    minPointDifference: 2,
    generalRules: "",
    scoringConfig: getDefaultScoringConfig(),
  }),
}
