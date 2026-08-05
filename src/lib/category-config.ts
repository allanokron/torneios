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

export const BEACH_VOLLEY_TEAM_SIZES = [
  { value: "double", label: "Dupla", size: 2 },
  { value: "trio", label: "Trio", size: 3 },
  { value: "quartet", label: "Quarteto", size: 4 },
] as const

type BeachVolleyCategory = {
  gender: string
  level: string
  teamSize: string
}

function buildBeachVolleyCategories(): BeachVolleyCategory[] {
  const genders = CATEGORY_GENDERS.map(g => g.value)
  const levels = CATEGORY_LEVELS.map(l => l.value)
  const teamSizes = BEACH_VOLLEY_TEAM_SIZES.map(t => t.value)

  const categories: BeachVolleyCategory[] = []
  for (const gender of genders) {
    for (const level of levels) {
      for (const teamSize of teamSizes) {
        categories.push({ gender, level, teamSize })
      }
    }
  }
  return categories
}

export const BEACH_VOLLEY_CATEGORIES: BeachVolleyCategory[] = buildBeachVolleyCategories()

export const BEACH_VOLLEY_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BEACH_VOLLEY_CATEGORIES.map(cat => {
    const key = `${cat.gender}_${cat.level}_${cat.teamSize}`
    const gender = CATEGORY_GENDERS.find(g => g.value === cat.gender)?.label ?? cat.gender
    const level = CATEGORY_LEVELS.find(l => l.value === cat.level)?.label ?? cat.level
    const teamSize = BEACH_VOLLEY_TEAM_SIZES.find(t => t.value === cat.teamSize)?.label ?? cat.teamSize
    return [key, `${teamSize} ${gender} ${level}`]
  })
)

export function formatBeachVolleyCategoryName(gender: string, level: string, teamSize: string): string {
  const key = `${gender}_${level}_${teamSize}`
  return BEACH_VOLLEY_CATEGORY_LABELS[key] ?? buildCategoryName({ gender, level, teamSize })
}

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
