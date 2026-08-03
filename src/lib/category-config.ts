export const CATEGORY_SPORTS = [
  { value: "tennis", label: "Tênis" },
  { value: "beach_volley", label: "Vôlei de Praia" },
] as const

export const CATEGORY_GENDERS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "mixed", label: "Misto" },
] as const

export const CATEGORY_TEAM_SIZES = [
  { value: "individual", label: "Individual", size: 1 },
  { value: "double", label: "Dupla", size: 2 },
  { value: "trio", label: "Trio", size: 3 },
  { value: "quartet", label: "Quarteto", size: 4 },
] as const

export const CATEGORY_LEVELS = [
  { value: "estreante", label: "Estreante" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
  { value: "open", label: "Open" },
] as const

export const CATEGORY_FORMATS = [
  { value: "group_ranking_knockout", label: "Grupo + Ranking + Mata-Mata" },
  { value: "group_knockout", label: "Grupo + Mata-Mata" },
  { value: "double_elimination", label: "Dupla Eliminatória" },
  { value: "ranking_knockout", label: "Ranking + Mata-Mata" },
] as const

export const ODD_GROUP_POLICIES = [
  { value: "ranking_byes", label: "Ranking com chapéu" },
  { value: "fill_with_best_next_position", label: "Completar com melhores próximos colocados" },
] as const

type Option = { value: string; label: string }

function hasValue(options: readonly Option[], value: unknown) {
  return typeof value === "string" && options.some(option => option.value === value)
}

export function getCategoryLabel(options: readonly Option[], value?: string | null) {
  return options.find(option => option.value === value)?.label ?? value ?? "Não definido"
}

export function getTeamSizeValue(teamSize: string) {
  return CATEGORY_TEAM_SIZES.find(option => option.value === teamSize)?.size ?? 1
}

export function buildCategoryName(input: {
  gender: string
  level: string
  teamSize: string
}) {
  const teamSize = getCategoryLabel(CATEGORY_TEAM_SIZES, input.teamSize)
  const gender = getCategoryLabel(CATEGORY_GENDERS, input.gender)
  const level = getCategoryLabel(CATEGORY_LEVELS, input.level)

  if (input.teamSize === "individual") {
    return `${gender} ${level}`
  }

  return `${teamSize} ${gender} ${level}`
}

export function validateCategoryPayload(body: Record<string, unknown>) {
  if (!hasValue(CATEGORY_SPORTS, body.sport ?? "beach_volley")) {
    return "Modalidade esportiva inválida"
  }

  if (!hasValue(CATEGORY_GENDERS, body.gender)) {
    return "Selecione Feminino, Masculino ou Misto"
  }

  if (!hasValue(CATEGORY_TEAM_SIZES, body.teamSize)) {
    return "Selecione o tipo da equipe"
  }

  if (!hasValue(CATEGORY_LEVELS, body.level)) {
    return "Selecione o nível"
  }

  if (!hasValue(CATEGORY_FORMATS, body.format)) {
    return "Selecione um tipo de torneio válido"
  }

  const format = body.format as string
  const groupSize = Number(body.groupSize)
  const hasGroupPhase = format === "group_ranking_knockout" || format === "group_knockout"

  if (hasGroupPhase && (!Number.isInteger(groupSize) || groupSize < 2)) {
    return "Informe pelo menos 2 equipes por grupo"
  }

  const registrationFee = body.registrationFee === "" || body.registrationFee === null || body.registrationFee === undefined
    ? null
    : Number(body.registrationFee)

  if (registrationFee !== null && (!Number.isInteger(registrationFee) || registrationFee < 0)) {
    return "Valor da inscrição inválido"
  }

  const setsPerMatch = Number(body.setsPerMatch ?? 3)
  const normalSetPoints = Number(body.normalSetPoints ?? 21)
  const tiebreakSetPoints = Number(body.tiebreakSetPoints ?? 15)
  const minPointDifference = Number(body.minPointDifference ?? 2)

  if (!Number.isInteger(setsPerMatch) || setsPerMatch < 1) return "Quantidade de sets inválida"
  if (!Number.isInteger(normalSetPoints) || normalSetPoints < 1) return "Pontuação do set normal inválida"
  if (!Number.isInteger(tiebreakSetPoints) || tiebreakSetPoints < 1) return "Pontuação do tie-break inválida"
  if (!Number.isInteger(minPointDifference) || minPointDifference < 1) return "Diferença mínima inválida"

  return null
}
