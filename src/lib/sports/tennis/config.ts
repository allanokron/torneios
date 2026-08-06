import type { SportModule, SportConfig, SportRuleConfig, SidebarTab, MenuItem, ValidationResult } from "../types"

export const TENNIS_CONFIG: SportConfig = {
  id: "tennis",
  name: "Tênis",
  label: "Tênis",
  icon: "🎾",
}

export const TENNIS_FORMATS = [
  { value: "points_ranking", label: "Ranking Pontos Diretos" },
  { value: "ranking_elimination", label: "Ranking com Mata-Mata" },
] as const

export const TENNIS_COURT_SURFACES = [
  { value: "hard", label: "Quadra Dura" },
  { value: "clay", label: "Quadra de Saibro" },
  { value: "grass", label: "Quadra de Grama" },
] as const

export const TENNIS_TIEBREAKER_CRITERIA = [
  { value: "points", label: "Soma de Pontos" },
  { value: "set_balance", label: "Saldo de Sets" },
  { value: "games_balance", label: "Saldo de Games" },
  { value: "direct_confrontation", label: "Confronto Direto" },
  { value: "wins", label: "Vitórias" },
  { value: "sets_won", label: "Sets Vencidos" },
  { value: "games_won", label: "Games Ganhos" },
  { value: "fewer_wo", label: "Menos W.O." },
  { value: "draw", label: "Empate" },
] as const

export const TENNIS_DEFAULT_TIEBREAKER_ORDER = [
  "points",
  "set_balance",
  "games_balance",
  "direct_confrontation",
  "wins",
  "games_won",
  "fewer_wo",
  "draw",
]

export const TENNIS_RULES: SportRuleConfig = {
  setsPerMatch: [3, 5],
  setsPerMatchLabel: "Melhor de",
  hasTiebreakToggle: true,
  hasSuperTiebreakToggle: true,
  defaultTiebreakScore: 6,
  defaultSuperTiebreakScore: 10,
  scoringFields: [
    { key: "winWithoutLosingSet", label: "Vitória sem perder set", defaultValue: 3, min: 0, max: 10 },
    { key: "winLosingOneSet", label: "Vitória perdendo 1 set", defaultValue: 2, min: 0, max: 10 },
    { key: "lossWinningOneSet", label: "Derrota ganhando 1 set", defaultValue: 1, min: 0, max: 10 },
    { key: "lossWithoutWinningSet", label: "Derrota sem ganhar set", defaultValue: 0, min: 0, max: 10 },
    { key: "winByWO", label: "Vitória por W.O.", defaultValue: 3, min: 0, max: 10 },
    { key: "lossByWO", label: "Derrota por W.O.", defaultValue: 0, min: 0, max: 10 },
    { key: "winByForfeit", label: "Vitória por forfeit", defaultValue: 3, min: 0, max: 10 },
    { key: "lossByForfeit", label: "Derrota por forfeit", defaultValue: 0, min: 0, max: 10 },
    { key: "withdrawalPenalty", label: "Penalidade por desistência", defaultValue: -1, min: -10, max: 0 },
    { key: "delayPenalty", label: "Penalidade por atraso", defaultValue: -1, min: -10, max: 0 },
  ],
  tiebreakerCriteria: [...TENNIS_TIEBREAKER_CRITERIA],
}

export const TENNIS_SIDEBAR_TABS: SidebarTab[] = [
  { id: "overview", label: "Visão Geral", show: true },
  { id: "drawn", label: "Jogos Sorteados", show: true },
  { id: "matches", label: "Confrontos", show: true },
  { id: "my-matches", label: "Meus Jogos", show: true },
  { id: "ranking", label: "Ranking", show: true },
  { id: "knockout", label: "Mata-Mata", show: (ctx) => ctx.format === "ranking_elimination" || ctx.format === "elimination" },
  { id: "participants", label: "Participantes", show: true },
  { id: "courts", label: "Quadras", show: true },
  { id: "rules", label: "Regras", show: true },
  { id: "settings", label: "Configurações", show: (ctx) => ctx.isOwner },
]

export const TENNIS_ORGANIZER_MENU: MenuItem[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "drawn", label: "Jogos Sorteados" },
  { id: "matches", label: "Confrontos" },
  { id: "ranking", label: "Ranking" },
  { id: "knockout", label: "Mata-Mata" },
  { id: "participants", label: "Participantes" },
  { id: "courts", label: "Quadras" },
  { id: "rules", label: "Regras" },
  { id: "settings", label: "Configurações", requiresOwner: true },
]

export const TENNIS_PLAYER_MENU: MenuItem[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "drawn", label: "Jogos Sorteados" },
  { id: "matches", label: "Confrontos" },
  { id: "my-matches", label: "Meus Jogos" },
  { id: "ranking", label: "Ranking" },
  { id: "participants", label: "Participantes" },
  { id: "courts", label: "Quadras" },
  { id: "rules", label: "Regras" },
]

export const TENNIS_CREATION_STEPS = [
  { id: "info", label: "Informações", fields: ["name", "description", "location", "address", "city", "state", "startDate", "endDate", "registrationDeadline", "maxParticipants", "isPublic", "inviteCode"] },
  { id: "courts", label: "Quadras", fields: ["courts"] },
  { id: "rules", label: "Regras", fields: ["setsPerMatch", "setsToWin", "hasTiebreak", "tiebreakScore", "hasSuperTiebreak", "superTiebreakScore", "defaultMatchDuration", "delayTolerance", "woCriteria", "generalRules"] },
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
    winByForfeit: 3,
    lossByForfeit: 0,
    withdrawalPenalty: -1,
    delayPenalty: -1,
  }
}

function getDefaultTiebreakerConfig() {
  return {
    criteriaOrder: [...TENNIS_DEFAULT_TIEBREAKER_ORDER],
  }
}

function validateTennisConfig(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  const format = data.format as string
  if (format && !TENNIS_FORMATS.some(f => f.value === format)) {
    errors.push("Formato de torneio inválido para tênis")
  }

  const setsPerMatch = Number(data.setsPerMatch)
  if (setsPerMatch && ![3, 5].includes(setsPerMatch)) {
    errors.push("Sets por partida deve ser 3 ou 5")
  }

  const setsToWin = Number(data.setsToWin)
  const spt = Number(data.setsPerMatch)
  if (setsToWin && spt && setsToWin >= spt) {
    errors.push("Sets para vencer deve ser menor que sets por partida")
  }

  return { valid: errors.length === 0, errors }
}

export const tennisModule: SportModule = {
  config: TENNIS_CONFIG,
  rules: TENNIS_RULES,
  creationSteps: TENNIS_CREATION_STEPS,
  sidebarTabs: TENNIS_SIDEBAR_TABS,
  organizerMenu: TENNIS_ORGANIZER_MENU,
  playerMenu: TENNIS_PLAYER_MENU,
  validateTournamentConfig: validateTennisConfig,
  getDefaultTournamentConfig: () => ({
    format: "points_ranking",
    setsPerMatch: 3,
    setsToWin: 2,
    hasTiebreak: true,
    tiebreakScore: 6,
    hasSuperTiebreak: true,
    superTiebreakScore: 10,
    defaultMatchDuration: 120,
    delayTolerance: 15,
    woCriteria: "",
    generalRules: "",
    scoringConfig: getDefaultScoringConfig(),
    tiebreakerConfig: getDefaultTiebreakerConfig(),
  }),
}
