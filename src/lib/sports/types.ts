export type SportId = "tennis" | "beach_volley"

export interface SportConfig {
  id: SportId
  name: string
  label: string
  icon: string
}

export interface ScoringFieldConfig {
  key: string
  label: string
  defaultValue: number
  min: number
  max: number
  description?: string
}

export interface CreationStepConfig {
  id: string
  label: string
  fields: string[]
}

export interface MenuItem {
  id: string
  label: string
  href?: string
  icon?: string
  requiresOwner?: boolean
}

export interface SidebarTab {
  id: string
  label: string
  show: boolean | ((ctx: SidebarTabContext) => boolean)
}

export interface SidebarTabContext {
  isOwner: boolean
  format: string
  hasTeams: boolean
  hasCategories: boolean
}

export interface SportRuleConfig {
  setsPerMatch: number[]
  setsPerMatchLabel: string
  hasTiebreakToggle: boolean
  hasSuperTiebreakToggle: boolean
  defaultTiebreakScore: number
  defaultSuperTiebreakScore: number
  scoringFields: ScoringFieldConfig[]
  tiebreakerCriteria: { value: string; label: string }[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface TournamentCreationData {
  name: string
  description: string
  sport: SportId
  location: string
  address: string
  city: string
  state: string
  startDate: string
  endDate: string
  registrationDeadline: string
  maxParticipants: string
  isPublic: boolean
  inviteCode: string
  coverImage: string
}

export interface SportModule {
  config: SportConfig
  rules: SportRuleConfig
  creationSteps: CreationStepConfig[]
  sidebarTabs: SidebarTab[]
  organizerMenu: MenuItem[]
  playerMenu: MenuItem[]
  validateTournamentConfig: (data: Record<string, unknown>) => ValidationResult
  getDefaultTournamentConfig: () => Record<string, unknown>
}
