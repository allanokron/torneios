"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import TournamentSidebar from "@/components/layout/TournamentSidebar"
import ScoreDisplay from "@/components/ui/ScoreDisplay"

interface Tournament {
  id: string
  name: string
  description?: string
  location?: string
  city?: string
  state?: string
  startDate: string
  endDate?: string
  status: string
  setsPerMatch: number
  setsToWin: number
  owner: {
    id: string
    name: string
    avatarUrl?: string
  }
  members: Array<{
    id: string
    status: string
    role: string
    user: {
      id: string
      name: string
      avatarUrl?: string
      city?: string
      gameLevel?: string
    }
  }>
  courts: Array<{
    id: string
    name: string
    surfaceType?: string
  }>
  scoringConfig?: {
    winWithoutLosingSet: number
    winLosingOneSet: number
    lossWinningOneSet: number
    lossWithoutWinningSet: number
  }
  _count: {
    matches: number
    announcements: number
  }
}

export default function TournamentPage() {
  const router = useRouter()
  const params = useParams()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})

    fetch(`/api/tournaments/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTournament(data.tournament)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [params.id, router])

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--court-green)]"></div>
        </main>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎾</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Torneio não encontrado</h2>
            <Link href="/" className="text-[var(--court-green)] hover:underline">
              Voltar para o início
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const confirmedMembers = tournament.members.filter(m => m.status === "accepted")

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      {/* Tournament Header */}
      <div className="bg-court-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white rounded-xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{tournament.name}</h1>
                <span className={`status-badge ${getStatusColor(tournament.status)}`}>
                  {getStatusLabel(tournament.status)}
                </span>
              </div>
              <p className="text-lg opacity-90 mb-2">
                {tournament.location || "Local não informado"}
                {tournament.city && `, ${tournament.city}`}
                {tournament.state && ` - ${tournament.state}`}
              </p>
              <p className="text-sm opacity-75">
                Organizado por {tournament.owner.name}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm opacity-75">Participantes</p>
              <p className="text-3xl font-bold">{confirmedMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <TournamentSidebar tournamentId={tournament.id} activeTab={activeTab} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-[var(--court-green)]">{tournament._count.matches}</div>
                    <div className="text-sm text-gray-500">Partidas</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-[var(--ball-yellow-dark)]">{confirmedMembers.length}</div>
                    <div className="text-sm text-gray-500">Jogadores</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-blue-600">{tournament.courts.length}</div>
                    <div className="text-sm text-gray-500">Quadras</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-500">Finalizadas</div>
                  </div>
                </div>

                {/* About */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sobre o Torneio</h3>
                  <p className="text-gray-600">
                    {tournament.description || "Sem descrição"}
                  </p>
                </div>

                {/* Rules Summary */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Regras</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Formato</p>
                      <p className="font-medium">Todos contra todos</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sets</p>
                      <p className="font-medium">Melhor de {tournament.setsPerMatch}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sets para vencer</p>
                      <p className="font-medium">{tournament.setsToWin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pontuação</p>
                      <p className="font-medium">
                        {tournament.scoringConfig?.winWithoutLosingSet || 3} pts (vitória)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === "matches" && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Confrontos</h3>
                <p className="text-gray-500">Nenhum confronto gerado ainda</p>
              </div>
            )}

            {/* Ranking Tab */}
            {activeTab === "ranking" && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ranking</h3>
                <p className="text-gray-500">Aguardando resultados para gerar ranking</p>
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Participantes ({confirmedMembers.length})
                </h3>
                <div className="space-y-3">
                  {confirmedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-[var(--court-green)] rounded-xl flex items-center justify-center text-white font-bold">
                        {member.user.avatarUrl ? (
                          <img
                            src={member.user.avatarUrl}
                            alt={member.user.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          member.user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{member.user.name}</p>
                        {member.user.city && (
                          <p className="text-sm text-gray-500">{member.user.city}</p>
                        )}
                      </div>
                      <span className={`status-badge ${
                        member.role === "organizer" ? "bg-purple-100 text-purple-700" : "status-draft"
                      }`}>
                        {member.role === "organizer" ? "Organizador" : "Jogador"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courts Tab */}
            {activeTab === "courts" && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quadras</h3>
                {tournament.courts.length === 0 ? (
                  <p className="text-gray-500">Nenhuma quadra cadastrada</p>
                ) : (
                  <div className="space-y-3">
                    {tournament.courts.map(court => (
                      <div
                        key={court.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-gray-100"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🎾</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{court.name}</p>
                          {court.surfaceType && (
                            <p className="text-sm text-gray-500 capitalize">{court.surfaceType}</p>
                          )}
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === "rules" && (
              <div className="card space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Regras do Torneio</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Formato</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Todos contra todos</li>
                      <li>Melhor de {tournament.setsPerMatch} sets</li>
                      <li>{tournament.setsToWin} sets para vencer</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Pontuação</h4>
                    {tournament.scoringConfig ? (
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>Vitória sem perder sets: {tournament.scoringConfig.winWithoutLosingSet} pts</li>
                        <li>Vitória perdendo set: {tournament.scoringConfig.winLosingOneSet} pts</li>
                        <li>Derrota vencendo set: {tournament.scoringConfig.lossWinningOneSet} pts</li>
                        <li>Derrota sem vencer: {tournament.scoringConfig.lossWithoutWinningSet} pts</li>
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Configuração padrão</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}