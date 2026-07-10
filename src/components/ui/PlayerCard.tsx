import Link from "next/link"

interface PlayerCardProps {
  player: {
    id: string
    name: string
    avatarUrl?: string
    city?: string
    state?: string
    gameLevel?: string
  }
  stats?: {
    wins?: number
    losses?: number
    points?: number
    position?: number
  }
  showStats?: boolean
  compact?: boolean
}

export default function PlayerCard({ player, stats, showStats = true, compact = false }: PlayerCardProps) {
  const getLevelBadge = (level?: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      beginner: { color: "bg-blue-100 text-blue-700", label: "Iniciante" },
      intermediate: { color: "bg-amber-100 text-amber-700", label: "Intermediário" },
      advanced: { color: "bg-purple-100 text-purple-700", label: "Avançado" },
      professional: { color: "bg-red-100 text-red-700", label: "Profissional" }
    }
    return badges[level || ""] || null
  }

  const levelBadge = getLevelBadge(player.gameLevel)

  if (compact) {
    return (
      <Link
        href={`/profile/${player.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-[var(--court-green)] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{player.name}</p>
          {player.city && (
            <p className="text-xs text-gray-500 truncate">{player.city}</p>
          )}
        </div>
        {stats?.position && (
          <span className="text-xs font-bold text-[var(--court-green)]">
            #{stats.position}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={`/profile/${player.id}`}
      className="card hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 bg-[var(--court-green)] rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate group-hover:text-[var(--court-green)] transition-colors">
              {player.name}
            </h4>
            {levelBadge && (
              <span className={`status-badge text-[10px] ${levelBadge.color}`}>
                {levelBadge.label}
              </span>
            )}
          </div>
          
          {player.city && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <span>📍</span>
              {player.city}{player.state && ` - ${player.state}`}
            </p>
          )}

          {/* Stats */}
          {showStats && stats && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
              {stats.position !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-[var(--court-green)]">#{stats.position}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Posição</p>
                </div>
              )}
              {stats.points !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-[var(--ball-yellow-dark)]">{stats.points}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Pontos</p>
                </div>
              )}
              {stats.wins !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{stats.wins}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Vitórias</p>
                </div>
              )}
              {stats.losses !== undefined && (
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">{stats.losses}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Derrotas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}