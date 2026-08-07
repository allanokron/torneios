import Link from "next/link"
import Image from "next/image"

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
    isPublic?: boolean
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
        className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-black/5"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(184, 224, 0, 0.12)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{tournament.name}</h4>
          <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
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
      className="overflow-hidden transition-all block"
      style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
    >
      {/* Cover */}
      <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }}>
        {tournament.coverImage ? (
          <img src={tournament.coverImage} alt={tournament.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-12 h-12 opacity-20">
              <Image src="/images/logo.png" alt="" fill className="object-contain" />
            </div>
          </div>
        )}
        {showStatus && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {!tournament.isPublic && (
              <span className="status-badge bg-[var(--neutral-700)] text-white">
                <svg className="w-3 h-3 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Privado
              </span>
            )}
            <span className={`status-badge ${getStatusColor(tournament.status)}`}>
              {getStatusLabel(tournament.status)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold mb-1 truncate" style={{ color: 'var(--text)' }}>{tournament.name}</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--neutral-400)' }}>
          {tournament.format === "ranking_elimination" || tournament.format === "elimination"
            ? "Ranking + Mata-mata"
            : "Ranking Pontos Diretos"}
        </p>
        
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--neutral-400)' }}>
          <span>{tournament._count?.members || 0} participantes</span>
          <span>{tournament._count?.matches || 0} partidas</span>
        </div>

        {tournament.location && (
          <div className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--neutral-300)' }}>
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
