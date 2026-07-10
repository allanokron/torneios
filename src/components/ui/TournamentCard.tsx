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
      registration_closed: "Encerradas",
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

  if (compact) {
    return (
      <Link
        href={`/tournaments/${tournament.id}`}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{tournament.name}</h4>
          <p className="text-xs text-gray-500">
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
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow block"
    >
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-green-500 to-green-600 relative">
        {tournament.coverImage ? (
          <img src={tournament.coverImage} alt={tournament.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        {showStatus && (
          <div className="absolute top-2 right-2">
            <span className={`status-badge ${getStatusColor(tournament.status)}`}>
              {getStatusLabel(tournament.status)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 truncate">{tournament.name}</h3>
        <p className="text-sm text-gray-500 mb-3">
          {tournament.format === "round_robin" ? "Todos contra todos" : 
           tournament.format === "elimination" ? "Eliminatório" : "Grupos + Mata-mata"}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{tournament._count?.members || 0} participantes</span>
          <span>{tournament._count?.matches || 0} partidas</span>
        </div>

        {tournament.location && (
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {tournament.location}
          </div>
        )}
      </div>
    </Link>
  )
}
