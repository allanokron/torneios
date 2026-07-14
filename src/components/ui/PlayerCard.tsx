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
        className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-black/5"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'rgba(184, 224, 0, 0.12)', color: 'var(--accent-dark)' }}
        >
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{player.name}</p>
          {player.city && (
            <p className="text-xs truncate" style={{ color: 'var(--neutral-400)' }}>{player.city}</p>
          )}
        </div>
        {stats?.position && (
          <span className="text-xs font-semibold" style={{ color: 'var(--neutral-400)' }}>
            #{stats.position}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={`/profile/${player.id}`}
      className="block transition-all"
      style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '16px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0"
          style={{ background: 'rgba(184, 224, 0, 0.12)', color: 'var(--accent-dark)' }}
        >
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate" style={{ color: 'var(--text)' }}>{player.name}</h4>
          
          {player.city && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--neutral-400)' }}>
              {player.city}{player.state && ` - ${player.state}`}
            </p>
          )}

          {/* Stats */}
          {showStats && stats && (
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {stats.position !== undefined && (
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>#{stats.position}</p>
                  <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>Posição</p>
                </div>
              )}
              {stats.points !== undefined && (
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{stats.points}</p>
                  <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>Pontos</p>
                </div>
              )}
              {stats.wins !== undefined && (
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--accent-dark)' }}>{stats.wins}</p>
                  <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>Vitórias</p>
                </div>
              )}
              {stats.losses !== undefined && (
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--danger)' }}>{stats.losses}</p>
                  <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>Derrotas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
