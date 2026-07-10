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
  if (compact) {
    return (
      <Link
        href={`/profile/${player.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-sm font-medium flex-shrink-0">
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
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
          <span className="text-xs font-medium text-gray-500">
            #{stats.position}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={`/profile/${player.id}`}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow block"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium flex-shrink-0">
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{player.name}</h4>
          
          {player.city && (
            <p className="text-sm text-gray-500 mt-0.5">
              {player.city}{player.state && ` - ${player.state}`}
            </p>
          )}

          {/* Stats */}
          {showStats && stats && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
              {stats.position !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-900">#{stats.position}</p>
                  <p className="text-xs text-gray-500">Posição</p>
                </div>
              )}
              {stats.points !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-900">{stats.points}</p>
                  <p className="text-xs text-gray-500">Pontos</p>
                </div>
              )}
              {stats.wins !== undefined && (
                <div>
                  <p className="text-sm font-medium text-green-600">{stats.wins}</p>
                  <p className="text-xs text-gray-500">Vitórias</p>
                </div>
              )}
              {stats.losses !== undefined && (
                <div>
                  <p className="text-sm font-medium text-red-500">{stats.losses}</p>
                  <p className="text-xs text-gray-500">Derrotas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
