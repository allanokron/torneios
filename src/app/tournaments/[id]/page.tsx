"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import TournamentSidebar from "@/components/layout/TournamentSidebar"
import SettingsTab from "@/components/tournament/SettingsTab"
import ScheduleProposalForm from "@/components/tournament/ScheduleProposalForm"
import ProposalCard from "@/components/tournament/ProposalCard"
import MatchResultForm from "@/components/tournament/MatchResultForm"

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
  hasTiebreak: boolean
  tiebreakScore: number
  hasSuperTiebreak: boolean
  superTiebreakScore: number
  defaultMatchDuration: number
  delayTolerance: number
  generalRules?: string
  woCriteria?: string
  isPublic: boolean
  maxParticipants?: number
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
    number?: number
    surfaceType?: string
    isCovered: boolean
  }>
  scoringConfig?: {
    winWithoutLosingSet: number
    winLosingOneSet: number
    lossWinningOneSet: number
    lossWithoutWinningSet: number
    winByWO: number
    lossByWO: number
    withdrawalPenalty: number
    delayPenalty: number
  }
  _count: {
    matches: number
    announcements: number
  }
}

interface Match {
  id: string
  scheduledAt: string | null
  status: string
  homeScore: number | null
  awayScore: number | null
  duration: number
  winnerId?: string | null
  homePlayer: { id: string; name: string; avatarUrl?: string }
  awayPlayer: { id: string; name: string; avatarUrl?: string }
  court: { id: string; name: string } | null
  sets: Array<{ setNumber: number; homeGames: number; awayGames: number }>
  startPhotoUrl?: string | null
  endPhotoUrl?: string | null
  scheduleProposals: Array<{
    id: string
    proposedDate: string
    proposedTime: string
    message?: string | null
    status: string
    responseMessage?: string | null
    sender: { id: string; name: string }
    receiver: { id: string; name: string }
    court: { id: string; name: string }
  }>
}

interface Ranking {
  position: number
  points: number
  wins: number
  losses: number
  setsWon: number
  setsLost: number
  user: { id: string; name: string; avatarUrl?: string }
}

export default function TournamentPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview")
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")
  const [drawing, setDrawing] = useState(false)

  // Scheduling state
  const [schedulingMatch, setSchedulingMatch] = useState<Match | null>(null)
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterCourtId, setFilterCourtId] = useState("")
  const [filterPlayerId, setFilterPlayerId] = useState("")
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null)
  const [matchSubTab, setMatchSubTab] = useState<"upcoming" | "completed">("upcoming")
  const [resultMatch, setResultMatch] = useState<Match | null>(null)

  // My Matches filters
  const [myFilterDateFrom, setMyFilterDateFrom] = useState("")
  const [myFilterDateTo, setMyFilterDateTo] = useState("")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const fetchTournament = useCallback(async () => {
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

  useEffect(() => {
    fetchTournament()
  }, [fetchTournament])

  // Fetch matches with filters
  const fetchMatches = useCallback(async () => {
    if (!tournament) return
    const token = localStorage.getItem("token")
    const params_arr = new URLSearchParams()
    if (filterDateFrom) params_arr.set("dateFrom", filterDateFrom)
    if (filterDateTo) params_arr.set("dateTo", filterDateTo)
    if (filterCourtId) params_arr.set("courtId", filterCourtId)
    const qs = params_arr.toString()
    fetch(`/api/tournaments/${tournament.id}/matches${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMatches(data.matches || []))
      .catch(() => {})
  }, [tournament, filterDateFrom, filterDateTo, filterCourtId])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  // Fetch rankings
  useEffect(() => {
    if (!tournament) return
    const token = localStorage.getItem("token")
    fetch(`/api/tournaments/${tournament.id}/ranking`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRankings(data.rankings || []))
      .catch(() => {})
  }, [tournament])

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

  const getMatchStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_scheduling: "Agendar",
      proposal_sent: "Proposta Enviada",
      awaiting_response: "Aguardando",
      scheduled: "Agendada",
      in_progress: "Em Jogo",
      awaiting_result: "Aguardando Resultado",
      finished: "Finalizada",
      cancelled: "Cancelada",
      wo: "W.O."
    }
    return labels[status] || status
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !tournament) return
    setInviting(true)
    setInviteError("")
    setInviteSuccess("")

    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error)
        return
      }
      setInviteSuccess(`Convite enviado para ${inviteEmail}`)
      setInviteEmail("")
      // Refresh tournament
      fetchTournament()
    } catch {
      setInviteError("Erro ao enviar convite")
    } finally {
      setInviting(false)
    }
  }

  const handleDrawMatches = async () => {
    if (!tournament) return
    setDrawing(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/elimination`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error)
        return
      }
      alert("Chaveamento gerado com sucesso!")
      fetchTournament()
    } catch {
      alert("Erro ao gerar chaveamento")
    } finally {
      setDrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
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
            <h2 className="text-lg font-medium text-gray-900 mb-2">Torneio não encontrado</h2>
            <Link href="/" className="text-sm text-green-600 hover:text-green-700">
              Voltar para o início
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const confirmedMembers = tournament.members.filter(m => m.status === "accepted")
  const pendingMembers = tournament.members.filter(m => m.status === "pending")
  const isOwner = user?.id === tournament.owner.id

  // Today and tomorrow matches
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfterTomorrow = new Date(tomorrow)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

  const todayMatches = matches.filter(m => {
    if (!m.scheduledAt) return false
    const d = new Date(m.scheduledAt)
    return d >= today && d < tomorrow && m.status !== "finished" && m.status !== "cancelled"
  })

  const tomorrowMatches = matches.filter(m => {
    if (!m.scheduledAt) return false
    const d = new Date(m.scheduledAt)
    return d >= tomorrow && d < dayAfterTomorrow && m.status !== "finished" && m.status !== "cancelled"
  })

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      {/* Tournament Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900">{tournament.name}</h1>
                <span className={`status-badge ${getStatusColor(tournament.status)}`}>
                  {getStatusLabel(tournament.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {tournament.location || "Local não informado"}
                {tournament.city && `, ${tournament.city}`}
                {tournament.state && ` - ${tournament.state}`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Organizado por {tournament.owner.name}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-semibold text-gray-900">{confirmedMembers.length}</p>
              <p className="text-xs text-gray-500">participantes</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <TournamentSidebar tournamentId={tournament.id} activeTab={activeTab} isOwner={isOwner} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* ===== OVERVIEW ===== */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-semibold text-gray-900">{tournament._count.matches}</p>
                    <p className="text-xs text-gray-500 mt-1">Partidas</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-semibold text-gray-900">{confirmedMembers.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Jogadores</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-semibold text-gray-900">{tournament.courts.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Quadras</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-2xl font-semibold text-gray-900">
                      {matches.filter(m => m.status === "finished").length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Finalizadas</p>
                  </div>
                </div>

                {/* Owner Actions */}
                {isOwner && tournament.status === "registration_closed" && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Ações do Organizador</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      As inscrições estão encerradas. Gere o chaveamento de eliminação quando estiver pronto.
                    </p>
                    <button
                      onClick={handleDrawMatches}
                      disabled={drawing}
                      className="btn-primary disabled:opacity-50"
                    >
                      {drawing ? "Gerando chaveamento..." : "Gerar Chaveamento (Top 12)"}
                    </button>
                  </div>
                )}

                {/* Today's Matches */}
                {todayMatches.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Jogos de Hoje</h3>
                    <div className="space-y-2">
                      {todayMatches.map(match => (
                        <div key={match.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                          <div className="text-center min-w-[50px]">
                            <div className="text-xs font-medium text-green-700">
                              {new Date(match.scheduledAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {match.homePlayer.name} vs {match.awayPlayer.name}
                            </p>
                          </div>
                          <span className={`status-badge match-${match.status}`}>
                            {getMatchStatusLabel(match.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tomorrow's Matches */}
                {tomorrowMatches.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Jogos de Amanhã</h3>
                    <div className="space-y-2">
                      {tomorrowMatches.map(match => (
                        <div key={match.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="text-center min-w-[50px]">
                            <div className="text-xs font-medium text-gray-900">
                              {new Date(match.scheduledAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {match.homePlayer.name} vs {match.awayPlayer.name}
                            </p>
                          </div>
                          <span className={`status-badge match-${match.status}`}>
                            {getMatchStatusLabel(match.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ranking Preview */}
                {rankings.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Ranking</h3>
                      <button onClick={() => setActiveTab("ranking")} className="text-sm text-green-600 hover:text-green-700">
                        Ver completo
                      </button>
                    </div>
                    <div className="space-y-1">
                      {rankings.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                          <span className="w-6 text-center text-sm font-medium text-gray-500">{r.position || i + 1}</span>
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-medium flex-shrink-0">
                            {r.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.user.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{r.points}</p>
                            <p className="text-xs text-gray-500">{r.wins}V {r.losses}D</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* About */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-medium text-gray-900 mb-3">Sobre</h3>
                  <p className="text-sm text-gray-600">
                    {tournament.description || "Sem descrição"}
                  </p>
                </div>
              </div>
            )}

            {/* ===== MATCHES ===== */}
            {activeTab === "matches" && (() => {
              const now = new Date()
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

              const completedStatuses = ["finished", "wo"]
              const completed = matches.filter(m => completedStatuses.includes(m.status))
              const upcoming = matches.filter(m => {
                if (completedStatuses.includes(m.status) || m.status === "cancelled") return false
                // No date = upcoming
                if (!m.scheduledAt) return true
                // Scheduled today or future = upcoming
                return new Date(m.scheduledAt) >= todayStart
              })

              const allMembers = tournament.members.filter(m => m.status === "accepted")

              const applyFilters = (list: Match[]) => {
                return list.filter(m => {
                  if (filterDateFrom || filterDateTo) {
                    if (!m.scheduledAt) return false
                    const d = new Date(m.scheduledAt)
                    if (filterDateFrom && d < new Date(filterDateFrom + "T00:00:00.000Z")) return false
                    if (filterDateTo && d > new Date(filterDateTo + "T23:59:59.999Z")) return false
                  }
                  if (filterCourtId && m.court?.id !== filterCourtId) return false
                  if (filterPlayerId && m.homePlayer.id !== filterPlayerId && m.awayPlayer.id !== filterPlayerId) return false
                  return true
                })
              }

              const filteredUpcoming = applyFilters(upcoming)
              const filteredCompleted = applyFilters(completed)

              return (
                <div className="space-y-4">
                  {/* Sub-tabs */}
                  <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
                    <button onClick={() => setMatchSubTab("upcoming")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${matchSubTab === "upcoming" ? "bg-green-50 text-green-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                      Próximos Jogos ({upcoming.length})
                    </button>
                    <button onClick={() => setMatchSubTab("completed")} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${matchSubTab === "completed" ? "bg-green-50 text-green-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                      Jogos Realizados ({completed.length})
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Filtros</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Data início</label>
                        <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="input w-full text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Data fim</label>
                        <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="input w-full text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Quadra</label>
                        <select value={filterCourtId} onChange={(e) => setFilterCourtId(e.target.value)} className="input w-full text-sm">
                          <option value="">Todas</option>
                          {tournament.courts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Jogador</label>
                        <select value={filterPlayerId} onChange={(e) => setFilterPlayerId(e.target.value)} className="input w-full text-sm">
                          <option value="">Todos</option>
                          {allMembers.map(m => (
                            <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {(filterDateFrom || filterDateTo || filterCourtId || filterPlayerId) && (
                      <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterCourtId(""); setFilterPlayerId("") }} className="text-xs text-gray-500 hover:text-gray-700 mt-2">
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  {/* Upcoming matches */}
                  {matchSubTab === "upcoming" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-medium text-gray-900 mb-3">Próximos Jogos ({filteredUpcoming.length})</h3>
                      {filteredUpcoming.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhum jogo próximo encontrado</p>
                      ) : (
                        <div className="space-y-3">
                          {filteredUpcoming.map(match => {
                            const isPlayer = user && (match.homePlayer.id === user.id || match.awayPlayer.id === user.id)
                            const canSchedule = isPlayer && (match.status === "pending_scheduling" || match.status === "proposal_sent" || match.status === "awaiting_response")
                            const canStart = isPlayer && match.status === "scheduled"
                            const canResult = isPlayer && match.status === "in_progress"
                            const hasPendingProposal = match.scheduleProposals.some(p => p.status === "pending")

                            return (
                              <div key={match.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                  <div className="text-center min-w-[50px]">
                                    {match.scheduledAt ? (
                                      <>
                                        <div className="text-xs font-medium text-gray-900">
                                          {new Date(match.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(match.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs text-gray-400">Sem data</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900">{match.homePlayer.name}</span>
                                      <span className="text-xs text-gray-400">vs</span>
                                      <span className="text-sm font-medium text-gray-900">{match.awayPlayer.name}</span>
                                    </div>
                                    {match.court && (
                                      <p className="text-xs text-gray-500 mt-0.5">{match.court.name}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`status-badge match-${match.status}`}>
                                      {getMatchStatusLabel(match.status)}
                                    </span>
                                    {canSchedule && !hasPendingProposal && (
                                      <button onClick={() => setSchedulingMatch(match)} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
                                        Agendar
                                      </button>
                                    )}
                                    {canStart && (
                                      <button onClick={() => setResultMatch(match)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                                        Iniciar
                                      </button>
                                    )}
                                    {canResult && (
                                      <button onClick={() => setResultMatch(match)} className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap">
                                        Placar
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {match.scheduleProposals.length > 0 && (
                                  <div className="px-3 pb-3 space-y-2">
                                    {match.scheduleProposals.map(proposal => (
                                      <ProposalCard
                                        key={proposal.id}
                                        proposal={proposal}
                                        currentUserId={user?.id || ""}
                                        matchId={match.id}
                                        matchStatus={match.status}
                                        courts={tournament.courts}
                                        onAction={fetchMatches}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed matches */}
                  {matchSubTab === "completed" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-medium text-gray-900 mb-3">Jogos Realizados ({filteredCompleted.length})</h3>
                      {filteredCompleted.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhum jogo realizado encontrado</p>
                      ) : (
                        <div className="space-y-3">
                          {filteredCompleted.map(match => {
                            const canEdit = user?.id === tournament.owner.id
                            return (
                              <div key={match.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                <div className="flex items-center gap-3 p-3">
                                  <div className="text-center min-w-[50px]">
                                    {match.scheduledAt ? (
                                      <>
                                        <div className="text-xs font-medium text-gray-900">
                                          {new Date(match.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(match.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs text-gray-400">Sem data</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900">{match.homePlayer.name}</span>
                                      {match.homeScore !== null && (
                                        <span className={`text-sm font-bold ${match.winnerId === match.homePlayer.id ? "text-green-600" : "text-red-500"}`}>
                                          {match.homeScore}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400">vs</span>
                                      {match.awayScore !== null && (
                                        <span className={`text-sm font-bold ${match.winnerId === match.awayPlayer.id ? "text-green-600" : "text-red-500"}`}>
                                          {match.awayScore}
                                        </span>
                                      )}
                                      <span className="text-sm font-medium text-gray-900">{match.awayPlayer.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {match.court && <p className="text-xs text-gray-500">{match.court.name}</p>}
                                      {match.sets.length > 0 && (
                                        <span className="text-xs text-gray-400">
                                          ({match.sets.map(s => `${s.homeGames}-${s.awayGames}`).join(", ")})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {match.winnerId && (
                                      <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    )}
                                    {canEdit && (
                                      <button onClick={() => setResultMatch(match)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                                        Editar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Schedule modal */}
                  {schedulingMatch && user && (
                    <ScheduleProposalForm
                      matchId={schedulingMatch.id}
                      opponentName={schedulingMatch.homePlayer.id === user.id ? schedulingMatch.awayPlayer.name : schedulingMatch.homePlayer.name}
                      courts={tournament.courts}
                      onSuccess={() => { setSchedulingMatch(null); fetchMatches() }}
                      onClose={() => setSchedulingMatch(null)}
                    />
                  )}

                  {/* Result modal */}
                  {resultMatch && user && (
                    <MatchResultForm
                      matchId={resultMatch.id}
                      matchStatus={resultMatch.status}
                      homePlayer={resultMatch.homePlayer}
                      awayPlayer={resultMatch.awayPlayer}
                      setsPerMatch={tournament.setsPerMatch}
                      isOwner={user.id === tournament.owner.id}
                      existingSets={resultMatch.sets.map(s => ({ homeGames: s.homeGames, awayGames: s.awayGames }))}
                      existingStartPhoto={resultMatch.startPhotoUrl}
                      existingEndPhoto={resultMatch.endPhotoUrl}
                      onSuccess={() => { setResultMatch(null); fetchMatches() }}
                      onClose={() => setResultMatch(null)}
                    />
                  )}
                </div>
              )
            })()}

            {/* ===== MY MATCHES ===== */}
            {activeTab === "my-matches" && user && (() => {
              const myMatches = matches.filter(m => m.homePlayer.id === user.id || m.awayPlayer.id === user.id)
              const now = new Date()
              const completed = myMatches.filter(m => m.status === "finished" || m.status === "wo")
              const upcoming = myMatches.filter(m => m.status !== "finished" && m.status !== "wo" && m.status !== "cancelled")

              const isWin = (m: Match) => {
                if (m.status === "wo") return m.winnerId === user.id
                if (m.homePlayer.id === user.id) return (m.homeScore ?? 0) > (m.awayScore ?? 0)
                return (m.awayScore ?? 0) > (m.homeScore ?? 0)
              }

              const filterByDate = (list: Match[]) => {
                return list.filter(m => {
                  if (!m.scheduledAt) return true
                  const d = new Date(m.scheduledAt)
                  if (myFilterDateFrom && d < new Date(myFilterDateFrom + "T00:00:00.000Z")) return false
                  if (myFilterDateTo && d > new Date(myFilterDateTo + "T23:59:59.999Z")) return false
                  return true
                })
              }

              const filteredCompleted = filterByDate(completed)
              const filteredUpcoming = filterByDate(upcoming)

              const winCount = completed.filter(isWin).length
              const lossCount = completed.length - winCount

              return (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Meus Jogos</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <p className="text-2xl font-bold text-gray-900">{myMatches.length}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <p className="text-2xl font-bold text-green-700">{winCount}</p>
                        <p className="text-xs text-green-600">Vitórias</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-50">
                        <p className="text-2xl font-bold text-red-600">{lossCount}</p>
                        <p className="text-xs text-red-500">Derrotas</p>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Filtros</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Data início</label>
                        <input type="date" value={myFilterDateFrom} onChange={(e) => setMyFilterDateFrom(e.target.value)} className="input w-full text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Data fim</label>
                        <input type="date" value={myFilterDateTo} onChange={(e) => setMyFilterDateTo(e.target.value)} className="input w-full text-sm" />
                      </div>
                    </div>
                    {(myFilterDateFrom || myFilterDateTo) && (
                      <button onClick={() => { setMyFilterDateFrom(""); setMyFilterDateTo("") }} className="text-xs text-gray-500 hover:text-gray-700 mt-2">
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  {/* Completed Games */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Jogos Realizados ({filteredCompleted.length})</h3>
                    {filteredCompleted.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum jogo realizado ainda</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredCompleted.map(match => {
                          const won = isWin(match)
                          const opponent = match.homePlayer.id === user.id ? match.awayPlayer : match.homePlayer
                          const myScore = match.homePlayer.id === user.id ? match.homeScore : match.awayScore
                          const theirScore = match.homePlayer.id === user.id ? match.awayScore : match.homeScore

                          return (
                            <div key={match.id} className={`flex items-center gap-3 p-3 rounded-lg border ${won ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                              <div className="flex-shrink-0">
                                {won ? (
                                  <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                ) : (
                                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  vs {opponent.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {match.scheduledAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(match.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                    </span>
                                  )}
                                  {match.court && (
                                    <span className="text-xs text-gray-400">{match.court.name}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <span className={`text-lg font-bold ${won ? "text-green-700" : "text-red-600"}`}>
                                    {myScore}
                                  </span>
                                  <span className="text-xs text-gray-400">x</span>
                                  <span className={`text-lg font-bold ${!won ? "text-green-700" : "text-red-600"}`}>
                                    {theirScore}
                                  </span>
                                </div>
                                <p className={`text-xs font-medium ${won ? "text-green-600" : "text-red-500"}`}>
                                  {won ? "Vitória" : "Derrota"}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Games */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Próximos Jogos ({filteredUpcoming.length})</h3>
                    {filteredUpcoming.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum jogo agendado</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredUpcoming.map(match => {
                          const opponent = match.homePlayer.id === user.id ? match.awayPlayer : match.homePlayer
                          const canSchedule = match.status === "pending_scheduling" || match.status === "proposal_sent" || match.status === "awaiting_response"
                          const hasPendingProposal = match.scheduleProposals.some(p => p.status === "pending")

                          return (
                            <div key={match.id} className="border border-gray-100 rounded-lg overflow-hidden">
                              <div className="flex items-center gap-3 p-3">
                                <div className="text-center min-w-[60px]">
                                  {match.scheduledAt ? (
                                    <>
                                      <div className="text-xs font-medium text-gray-900">
                                        {new Date(match.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(match.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-xs text-gray-400">Sem data</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">vs {opponent.name}</p>
                                  {match.court && (
                                    <p className="text-xs text-gray-500">{match.court.name}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`status-badge match-${match.status}`}>
                                    {getMatchStatusLabel(match.status)}
                                  </span>
                                  {canSchedule && !hasPendingProposal && (
                                    <button
                                      onClick={() => setSchedulingMatch(match)}
                                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                                    >
                                      Agendar
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Proposals */}
                              {match.scheduleProposals.length > 0 && (
                                <div className="px-3 pb-3 space-y-2">
                                  {match.scheduleProposals.map(proposal => (
                                    <ProposalCard
                                      key={proposal.id}
                                      proposal={proposal}
                                      currentUserId={user.id}
                                      matchId={match.id}
                                      matchStatus={match.status}
                                      courts={tournament.courts}
                                      onAction={fetchMatches}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Schedule modal */}
                  {schedulingMatch && (
                    <ScheduleProposalForm
                      matchId={schedulingMatch.id}
                      opponentName={schedulingMatch.homePlayer.id === user.id
                        ? schedulingMatch.awayPlayer.name
                        : schedulingMatch.homePlayer.name}
                      courts={tournament.courts}
                      onSuccess={() => { setSchedulingMatch(null); fetchMatches() }}
                      onClose={() => setSchedulingMatch(null)}
                    />
                  )}
                </div>
              )
            })()}

            {/* ===== RANKING ===== */}
            {activeTab === "ranking" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-gray-900 mb-3">Ranking</h3>
                {rankings.length === 0 ? (
                  <p className="text-sm text-gray-500">Aguardando resultados para gerar ranking</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">#</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Jogador</th>
                          <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Pts</th>
                          <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">V</th>
                          <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">D</th>
                          <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Sets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.map((r, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-2 font-medium text-gray-900">{r.position || i + 1}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-medium">
                                  {r.user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-900">{r.user.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-gray-900">{r.points}</td>
                            <td className="py-2 px-2 text-center text-green-600">{r.wins}</td>
                            <td className="py-2 px-2 text-center text-red-500">{r.losses}</td>
                            <td className="py-2 px-2 text-center text-gray-600">{r.setsWon}-{r.setsLost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ===== PARTICIPANTS ===== */}
            {activeTab === "participants" && (
              <div className="space-y-4">
                {/* Invite form (owner only, during registration) */}
                {isOwner && (tournament.status === "draft" || tournament.status === "registration_open") && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Convidar Participante</h3>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="E-mail do jogador"
                        className="input flex-1"
                        onKeyDown={e => e.key === "Enter" && handleInvite()}
                      />
                      <button
                        onClick={handleInvite}
                        disabled={inviting || !inviteEmail.trim()}
                        className="btn-primary disabled:opacity-50"
                      >
                        {inviting ? "Enviando..." : "Convidar"}
                      </button>
                    </div>
                    {inviteError && <p className="text-sm text-red-600 mt-2">{inviteError}</p>}
                    {inviteSuccess && <p className="text-sm text-green-600 mt-2">{inviteSuccess}</p>}
                  </div>
                )}

                {/* Confirmed participants */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Confirmados ({confirmedMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {confirmedMembers.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium flex-shrink-0">
                          {member.user.avatarUrl ? (
                            <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                          {member.user.city && <p className="text-xs text-gray-500">{member.user.city}</p>}
                        </div>
                        <span className={`status-badge ${member.role === "organizer" ? "bg-purple-50 text-purple-700" : "status-draft"}`}>
                          {member.role === "organizer" ? "Organizador" : "Jogador"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending invites */}
                {pendingMembers.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Pendentes ({pendingMembers.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-medium flex-shrink-0">
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                            <p className="text-xs text-amber-600">Convite pendente</p>
                          </div>
                          {isOwner && (
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem("token")
                                await fetch(`/api/tournaments/${tournament.id}/members`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ memberId: member.id, status: "accepted" })
                                })
                                fetchTournament()
                              }}
                              className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              Aceitar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== COURTS ===== */}
            {activeTab === "courts" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-medium text-gray-900 mb-3">Quadras</h3>
                  {tournament.courts.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma quadra cadastrada</p>
                  ) : (
                    <div className="space-y-2">
                      {tournament.courts.map(court => {
                        const courtMatches = matches.filter(m => m.court?.id === court.id)
                        const upcomingCount = courtMatches.filter(m => m.status === "scheduled" || m.status === "proposal_sent").length
                        const isSelected = selectedCourt === court.id

                        return (
                          <div key={court.id}>
                            <button
                              onClick={() => setSelectedCourt(isSelected ? null : court.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                                isSelected
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-100 hover:bg-gray-50"
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected ? "bg-blue-100" : "bg-blue-50"
                              }`}>
                                <svg className={`w-5 h-5 ${isSelected ? "text-blue-700" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{court.name}</p>
                                {court.surfaceType && <p className="text-xs text-gray-500 capitalize">{court.surfaceType}</p>}
                              </div>
                              <div className="text-right">
                                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
                                {upcomingCount > 0 && (
                                  <p className="text-xs text-gray-500">{upcomingCount} jogos</p>
                                )}
                              </div>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Court detail: upcoming matches */}
                            {isSelected && (
                              <div className="mt-2 ml-6 pl-4 border-l-2 border-blue-200">
                                {courtMatches.length === 0 ? (
                                  <p className="text-xs text-gray-500 py-2">Nenhum jogo agendado nesta quadra</p>
                                ) : (
                                  <div className="space-y-1 py-2">
                                    {courtMatches.map(m => (
                                      <div key={m.id} className="flex items-center gap-2 text-xs">
                                        {m.scheduledAt ? (
                                          <span className="text-gray-500 min-w-[80px]">
                                            {new Date(m.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}{" "}
                                            {new Date(m.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 min-w-[80px]">Sem data</span>
                                        )}
                                        <span className="text-gray-700">
                                          {m.homePlayer.name} vs {m.awayPlayer.name}
                                        </span>
                                        <span className={`status-badge match-${m.status} ml-auto`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                          {getMatchStatusLabel(m.status)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== RULES ===== */}
            {activeTab === "rules" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-gray-900 mb-4">Regras do Torneio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Formato</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>Todos contra todos + Mata-mata (Top 12)</li>
                      <li>Melhor de {tournament.setsPerMatch} sets</li>
                      <li>{tournament.setsToWin} sets para vencer</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pontuação</h4>
                    {tournament.scoringConfig ? (
                      <ul className="text-gray-600 space-y-1">
                        <li>Vitória sem perder sets: {tournament.scoringConfig.winWithoutLosingSet} pts</li>
                        <li>Vitória perdendo set: {tournament.scoringConfig.winLosingOneSet} pts</li>
                        <li>Derrota vencendo set: {tournament.scoringConfig.lossWinningOneSet} pts</li>
                        <li>Derrota sem vencer: {tournament.scoringConfig.lossWithoutWinningSet} pts</li>
                      </ul>
                    ) : (
                      <p className="text-gray-500">Configuração padrão</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== SETTINGS (Owner Only) ===== */}
            {activeTab === "settings" && isOwner && (
              <SettingsTab
                tournament={tournament}
                onTournamentUpdated={(updated) => setTournament(updated as Tournament)}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
