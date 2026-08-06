import type { SportId, SportModule } from "./types"
import { tennisModule } from "./tennis/config"
import { beachVolleyballModule } from "./beach-volleyball/config"

export const sportsRegistry: Record<SportId, SportModule> = {
  tennis: tennisModule,
  beach_volley: beachVolleyballModule,
}

export function getSportModule(sport: SportId): SportModule {
  const mod = sportsRegistry[sport]
  if (!mod) {
    throw new Error(`Sport module not found: ${sport}`)
  }
  return mod
}

export function isValidSport(sport: string): sport is SportId {
  return sport in sportsRegistry
}

export function getSportLabel(sport: SportId): string {
  return sportsRegistry[sport]?.config.label ?? sport
}

export function getSportIcon(sport: SportId): string {
  return sportsRegistry[sport]?.config.icon ?? "🏅"
}

export function getAllSports(): { id: SportId; name: string; label: string; icon: string }[] {
  return Object.values(sportsRegistry).map(mod => ({
    id: mod.config.id,
    name: mod.config.name,
    label: mod.config.label,
    icon: mod.config.icon,
  }))
}
