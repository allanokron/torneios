import Link from "next/link"

interface TournamentCardProps {
  tournament: {
    id: string
    name: string
    description?: string
    coverImage?: string
    sport: string
    format: string
    location?: string
    city?: string
    state?: string
    startDate: string
    endDate?: string
    status: string
    _count?: {
      members: number
      matches: number
    }
  }
  showStatus?: boolean
  compact?: boolean
}

export default function TournamentCard({ tournament, showStatus = true, compact = false }: TournamentCardProps) {
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      registration_open: "Inscrições Abertas",
      registration_closed: "Inscrições Encerradas",
      in_progress: "Em Andamento",
      finished: "Finalizado"
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "status-draft",
      registration_open: "status-registration_open",
      registration_closed: "status-registration_closed",
      in_progress: "status-in_progress",
      finished: "status-finished"
    }
    return colors[status] || "status-draft"
  }

  const getSportEmoji = (sport: string) => {
    const emojis: Record<string, string> = {
      tennis: "🎾",
      padel: "🏓",
      pickleball: "🥒"
    }
    return emojis[sport] || "🏆"
  }

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      round_robin: "Todos contra todos",
      elimination: "Eliminatório",
      groups: "Grupos + Mata-mata"
    }
    return labels[format] || format
  }

  if (compact) {
    return (
      <Link
        href={`/tournaments/${tournament.id}`}
        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-[var(--court-green)] to-[var(--court-green-dark)] rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl">{getSportEmoji(tournament.sport)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{tournament.name}</h4>
          <p className="text-sm text-gray-500">
            {tournament._count?.members || 0} participantes
          </p>
        </div>
        {showStatus && (
          <span className={`status-badge ${getStatusColor(tournament.status)}`}>
            {getStatusLabel(tournament.status)}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="card group hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-[var(--court-green)] via-[var(--court-green-light)] to-[var(--court-blue)] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4">
        {tournament.coverImage ? (
          <img
            src={tournament.coverImage}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center court-lines">
            <span className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300">
              {getSportEmoji(tournament.sport)}
            </span>
          </div>
        )}
        
        {/* Status Badge */}
        {showStatus && (
          <div className="absolute top-3 right-3">
            <span className={`status-badge ${getStatusColor(tournament.status)}`}>
              {getStatusLabel(tournament.status)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-[var(--court-green)] transition-colors line-clamp-1">
            {tournament.name}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <span>{getSportEmoji(tournament.sport)}</span>
            {getFormatLabel(tournament.format)}
          </p>
        </div>

        {tournament.location && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <span>📍</span>
            {tournament.location}
            {tournament.city && `, ${tournament.city}`}
          </p>
        )}

        <div className="text-sm text-gray-500 flex items-center gap-1">
          <span>📅</span>
          {new Date(tournament.startDate).toLocaleDateString("pt-BR")}
          {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString("pt-BR")}`}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{tournament._count?.members || 0}</span> participantes
            </span>
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{tournament._count?.matches || 0}</span> partidas
            </span>
          </div>
          
          <span className="text-[var(--court-green)] group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}