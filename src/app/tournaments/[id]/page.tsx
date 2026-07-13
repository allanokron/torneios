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
import MatchEditForm from "@/components/tournament/MatchEditForm"

interface Tournament {
  id: string
  name: string
  description?: string
  coverImage?: string
  location?: string
  city?: string
  state?: string
  startDate: string
  endDate?: string
  status: string
  format: string
  knockoutQualifiers?: number | null
  rankingPhaseStatus?: string
  knockoutLockedAt?: string | null
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
    woWinSets: number
    woLossSets: number
    woWinGames: number
    woLossGames: number
    winByForfeit: number
    lossByForfeit: number
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
  phase?: string
  winnerId?: string | null
  round?: string | null
  month?: string | null
  homePlayer: { id: string; name: string; avatarUrl?: string }
  awayPlayer: { id: string; name: string; avatarUrl?: string }
  court: { id: string; name: string } | null
  sets: Array<{ setNumber: number; homeGames: number; awayGames: number }>
  startPhotoUrl?: string | null
  endPhotoUrl?: string | null
  endReason?: string | null
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
  gamesWon: number
  gamesLost: number
  setBalance: number
  gamesBalance: number
  user: { id: string; name: string; avatarUrl?: string }
}

interface KnockoutEntry {
  round: number
  position: number
  roundName: string
  status: string
  homeSeed: number | null
  awaySeed: number | null
  homePlayerId: string | null
  awayPlayerId: string | null
  homeName: string | null
  awayName: string | null
  homeSourceLabel: string | null
  awaySourceLabel: string | null
  winnerId: string | null
  nextRound: number | null
  nextPosition: number | null
  nextSlot: "home" | "away" | null
  matchId?: string | null
  matchStatus?: string | null
}

interface KnockoutState {
  format: string
  locked: boolean
  isRankingComplete: boolean
  qualifiers: number
  validationError: string | null
  players: Ranking[]
  bracket: KnockoutEntry[]
}

const formatSupportsKnockout = (format?: string) =>
  format === "ranking_elimination" || format === "elimination"

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
  const [knockout, setKnockout] = useState<KnockoutState | null>(null)
  const [lockingKnockout, setLockingKnockout] = useState(false)
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
  const [drawnSubTab, setDrawnSubTab] = useState<"month" | "future">("month")
  const [drawnFilterPlayer, setDrawnFilterPlayer] = useState("")
  const [rankingMonth, setRankingMonth] = useState("")
  const [resultMatch, setResultMatch] = useState<Match | null>(null)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null)
  const [showNewMatch, setShowNewMatch] = useState(false)
  const [newMatchOpponent, setNewMatchOpponent] = useState("")
  const [creatingMatch, setCreatingMatch] = useState(false)
  const [newMatchError, setNewMatchError] = useState("")
  const [requestingJoin, setRequestingJoin] = useState(false)
  const [joinMessage, setJoinMessage] = useState("")

  // My Matches filters
  const [myFilterDateFrom, setMyFilterDateFrom] = useState("")
  const [myFilterDateTo, setMyFilterDateTo] = useState("")

  useEffect(() => {
    const tab = searchParams.get("tab")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const fetchTournament = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const [authRes, tournamentRes] = await Promise.all([
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).catch(() => null),
      fetch(`/api/tournaments/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).catch(() => null)
    ])

    if (authRes?.user) setUser(authRes.user)
    if (tournamentRes?.tournament) {
      setTournament(tournamentRes.tournament)
    }
    setLoading(false)
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

  const handleDeleteMatch = useCallback(async (matchId: string) => {
    if (!confirm("Tem certeza que deseja apagar esta partida? Esta ação não pode ser desfeita.")) return

    setDeletingMatchId(matchId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao apagar partida")
        return
      }
      fetchMatches()
      // Refresh rankings
      if (tournament) {
        fetch(`/api/tournaments/${tournament.id}/ranking`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setRankings(data.ranking || []))
      }
    } catch {
      alert("Erro de conexão")
    } finally {
      setDeletingMatchId(null)
    }
  }, [fetchMatches, tournament])

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
      .then(data => setRankings(data.ranking || []))
      .catch(() => {})
  }, [tournament])

  const fetchKnockout = useCallback(async () => {
    if (!tournament || !formatSupportsKnockout(tournament.format)) {
      setKnockout(null)
      return
    }
    const token = localStorage.getItem("token")
    fetch(`/api/tournaments/${tournament.id}/knockout`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setKnockout(data.error ? null : data))
      .catch(() => {})
  }, [tournament])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKnockout()
  }, [fetchKnockout])

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

  const handleLockKnockout = async () => {
    if (!tournament) return
    setLockingKnockout(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tournaments/${tournament.id}/knockout/lock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Erro ao travar mata-mata")
        return
      }
      setKnockout(data)
      fetchMatches()
      fetchTournament()
    } catch {
      alert("Erro de conexão")
    } finally {
      setLockingKnockout(false)
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
  const isMember = user ? tournament.members.some(m => m.user.id === user.id) : false
  const canRequestJoin = user && !isMember && !isOwner && tournament.isPublic && 
    (tournament.status === "registration_open" || tournament.status === "draft")

  const handleRequestJoin = async () => {
    if (!user) return
    setRequestingJoin(true)
    setJoinMessage("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tournaments/${tournament.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "join" })
      })
      const data = await res.json()
      setJoinMessage(data.message || data.error)
      if (res.ok) fetchTournament()
    } catch {
      setJoinMessage("Erro ao enviar solicitação")
    } finally {
      setRequestingJoin(false)
    }
  }

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

  // Pending proposals I received
  const pendingProposals = user ? matches
    .filter(m => m.scheduleProposals.some(p => p.receiver.id === user.id && p.status === "pending"))
    .map(m => ({
      match: m,
      proposal: m.scheduleProposals.find(p => p.receiver.id === user.id && p.status === "pending")!
    })) : []

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
                {!tournament.isPublic && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Privado
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canRequestJoin && (
                <div>
                  <button
                    onClick={handleRequestJoin}
                    disabled={requestingJoin}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {requestingJoin ? "Enviando..." : "Solicitar Participação"}
                  </button>
                  {joinMessage && (
                    <p className={`text-xs mt-1 ${joinMessage.includes("Erro") || joinMessage.includes("não") ? "text-red-600" : "text-green-600"}`}>
                      {joinMessage}
                    </p>
                  )}
                </div>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-2xl font-semibold text-gray-900">{confirmedMembers.length}</p>
                <p className="text-xs text-gray-500">participantes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <TournamentSidebar
            tournamentId={tournament.id}
            activeTab={activeTab}
            isOwner={isOwner}
            showKnockout={formatSupportsKnockout(tournament.format)}
          />

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

                {/* Pending Invitations */}
                {pendingProposals.length > 0 && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-medium text-amber-800">Convites de Jogo Pendentes ({pendingProposals.length})</h3>
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                      Você tem {pendingProposals.length} {pendingProposals.length === 1 ? "convite" : "convites"} de agendamento aguardando sua resposta.
                    </p>
                    <button
                      onClick={() => setActiveTab("my-matches")}
                      className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                    >
                      Responder convites
                    </button>
                  </div>
                )}

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
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-medium flex-shrink-0 overflow-hidden">
                            {r.user.avatarUrl ? (
                              <img src={r.user.avatarUrl} alt={r.user.name} className="w-full h-full object-cover" />
                            ) : (
                              r.user.name.charAt(0).toUpperCase()
                            )}
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

            {/* ===== DRAWN MATCHES ===== */}
            {activeTab === "drawn" && (() => {
              const pendingMatches = matches.filter(m =>
                m.status === "pending_scheduling" || m.status === "proposal_sent" || m.status === "awaiting_response"
              )
              const scheduledMatches = matches.filter(m => m.status === "scheduled")
              const now = new Date()
              const currentMonth = now.getMonth() + 1
              const currentYear = now.getFullYear()
              const currentDay = now.getDate()
              const canScheduleNextMonth = currentDay === 1

              const currentMonthStr = `${String(currentMonth).padStart(2, "0")}/${currentYear}`
              const allPendingMonth = pendingMatches.filter(m => m.month === currentMonthStr)
              const allPendingFuture = pendingMatches.filter(m => {
                if (!m.month) return false
                const [fm, fy] = m.month.split("/").map(Number)
                return fy > currentYear || (fy === currentYear && fm > currentMonth)
              })

              const filterByPlayer = (list: typeof pendingMatches) => {
                if (!drawnFilterPlayer) return list
                return list.filter(m => m.homePlayer.id === drawnFilterPlayer || m.awayPlayer.id === drawnFilterPlayer)
              }

              const drawnPendingMonth = filterByPlayer(allPendingMonth)
              const drawnPendingFuture = filterByPlayer(allPendingFuture)
              const allMembers = tournament?.members.filter(m => m.status === "accepted") || []

              return (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Jogos Sorteados</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Confrontos aguardando agendamento de data.
                    </p>

                    {/* Player filter */}
                    {allMembers.length > 0 && (
                      <div className="mb-4">
                        <select
                          value={drawnFilterPlayer}
                          onChange={e => setDrawnFilterPlayer(e.target.value)}
                          className="w-full sm:w-64 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Todos os jogadores</option>
                          {allMembers.map(m => (
                            <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Real tabs - underline style */}
                    <div className="flex border-b border-gray-200 mb-4">
                      <button
                        onClick={() => setDrawnSubTab("month")}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                          drawnSubTab === "month"
                            ? "border-green-600 text-green-700"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Jogos do Mês ({drawnPendingMonth.length})
                      </button>
                      <button
                        onClick={() => setDrawnSubTab("future")}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                          drawnSubTab === "future"
                            ? "border-green-600 text-green-700"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Jogos Futuros ({drawnPendingFuture.length})
                      </button>
                    </div>

                    {/* MONTH sub-tab */}
                    {drawnSubTab === "month" && (
                      <>
                        {/* Month block notice */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                          <div className="flex gap-2">
                            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-amber-800">Regra de agendamento por mês</p>
                              <p className="text-sm text-amber-700">
                                Jogos de meses futuros só podem ser agendados a partir do dia 1º de cada mês.
                                {!canScheduleNextMonth && " Aguardando liberação."}
                                {canScheduleNextMonth && " Mês liberado para agendamento!"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Scheduled matches for this month */}
                        {scheduledMatches.filter(m => {
                          if (!m.month) return false
                          return m.month === currentMonthStr
                        }).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Já Agendados este Mês ({scheduledMatches.filter(m => m.month === currentMonthStr).length})
                            </h4>
                            <div className="space-y-2">
                              {scheduledMatches.filter(m => m.month === currentMonthStr).map(m => (
                                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200">
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                      <div className="w-8 h-8 rounded-full bg-white border-2 border-green-200 flex items-center justify-center text-xs font-medium text-green-700">
                                        {m.homePlayer.name.charAt(0)}
                                      </div>
                                      <div className="w-8 h-8 rounded-full bg-white border-2 border-green-200 flex items-center justify-center text-xs font-medium text-green-700">
                                        {m.awayPlayer.name.charAt(0)}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {m.homePlayer.name} vs {m.awayPlayer.name}
                                      </p>
                                      <p className="text-xs text-green-600">
                                        {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString('pt-BR') : ""}
                                        {m.court && ` • ${m.court.name}`}
                                      </p>
                                    </div>
                                  </div>
                                  {isOwner && (
                                    <button
                                      onClick={() => setEditingMatch(m)}
                                      className="text-gray-700 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
                                      title="Editar partida"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending matches for this month */}
                        {drawnPendingMonth.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Aguardando Agendamento ({drawnPendingMonth.length})
                            </h4>
                            <div className="space-y-2">
                              {drawnPendingMonth.map(m => {
                                const isPostponed = m.round?.startsWith("Adiado")
                                return (
                                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPostponed ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className="flex -space-x-2">
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${isPostponed ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-gray-100 border-white text-gray-600'}`}>
                                          {m.homePlayer.name.charAt(0)}
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${isPostponed ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-gray-100 border-white text-gray-600'}`}>
                                          {m.awayPlayer.name.charAt(0)}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {m.homePlayer.name} vs {m.awayPlayer.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {m.round || "Rodada"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isPostponed && (
                                        <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                          </svg>
                                          ADIADO
                                        </span>
                                      )}
                                      {isOwner && (
                                        <button
                                          onClick={() => handleDeleteMatch(m.id)}
                                          disabled={deletingMatchId === m.id}
                                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                          title="Apagar partida"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {drawnPendingMonth.length === 0 && scheduledMatches.filter(m => m.month === currentMonthStr).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-8">
                            {drawnFilterPlayer ? "Nenhum jogo deste jogador para agendar este mês." : "Nenhum jogo para agendar este mês."}
                          </p>
                        )}
                      </>
                    )}

                    {/* FUTURE sub-tab */}
                    {drawnSubTab === "future" && (
                      <>
                        {drawnPendingFuture.length > 0 ? (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Jogos Futuros ({drawnPendingFuture.length})
                            </h4>
                            <div className="space-y-2">
                              {drawnPendingFuture.map(m => {
                                const fm = (m.month || "").split("/")[0]
                                const monthNames: Record<string, string> = {
                                  "08": "Agosto", "09": "Setembro", "10": "Outubro"
                                }
                                const monthLabel = monthNames[fm] || m.month
                                const isPostponed = m.round?.startsWith("Adiado")
                                return (
                                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPostponed ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className="flex -space-x-2">
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${isPostponed ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-gray-100 border-white text-gray-600'}`}>
                                          {m.homePlayer.name.charAt(0)}
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${isPostponed ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-gray-100 border-white text-gray-600'}`}>
                                          {m.awayPlayer.name.charAt(0)}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {m.homePlayer.name} vs {m.awayPlayer.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {monthLabel} • Aguardando liberação
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isPostponed && (
                                        <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                          </svg>
                                          ADIADO
                                        </span>
                                      )}
                                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                        Bloqueado até dia 1º
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-8">
                            {drawnFilterPlayer ? "Nenhum jogo futuro deste jogador encontrado." : "Nenhum jogo futuro encontrado."}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* ===== MATCHES ===== */}
            {activeTab === "matches" && (() => {
              const now = new Date()
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

              const completedStatuses = ["finished", "wo"]
              const completed = matches.filter(m => completedStatuses.includes(m.status))
              const upcoming = matches.filter(m => {
                if (completedStatuses.includes(m.status) || m.status === "cancelled") return false
                if (!m.scheduledAt) return false
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
                            const canSchedule = (isPlayer || isOwner) && (match.status === "pending_scheduling" || match.status === "proposal_sent" || match.status === "awaiting_response")
                            const canStart = (isPlayer || isOwner) && match.status === "scheduled"
                            const canResult = (isPlayer || isOwner) && match.status === "in_progress"
                            const hasPendingProposal = match.scheduleProposals.some(p => p.status === "pending")

                            return (
                              <div key={match.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                <div className="flex flex-wrap items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
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
                                  <div className="flex flex-wrap items-center gap-2">
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
                                    {isOwner && (
                                      <button
                                        onClick={() => setEditingMatch(match)}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                      >
                                        Editar
                                      </button>
                                    )}
                                    {isOwner && (
                                      <button
                                        onClick={() => handleDeleteMatch(match.id)}
                                        disabled={deletingMatchId === match.id}
                                        className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                                      >
                                        Apagar
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
                                    {canEdit && (
                                      <button
                                        onClick={() => handleDeleteMatch(match.id)}
                                        disabled={deletingMatchId === match.id}
                                        className="px-2 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Apagar partida"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
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

                  {/* Edit modal */}
                  {editingMatch && (
                    <MatchEditForm
                      matchId={editingMatch.id}
                      homePlayer={editingMatch.homePlayer}
                      awayPlayer={editingMatch.awayPlayer}
                      scheduledAt={editingMatch.scheduledAt}
                      courtId={editingMatch.court?.id || null}
                      status={editingMatch.status}
                      duration={editingMatch.duration}
                      members={tournament.members.filter(m => m.status === "accepted")}
                      courts={tournament.courts}
                      onSuccess={() => { setEditingMatch(null); fetchMatches() }}
                      onClose={() => setEditingMatch(null)}
                    />
                  )}
                </div>
              )
            })()}

            {/* ===== MY MATCHES ===== */}
            {activeTab === "my-matches" && user && (() => {
              const myMatches = matches.filter(m => m.homePlayer.id === user.id || m.awayPlayer.id === user.id)
              const now = new Date()
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
              const completed = myMatches.filter(m => m.status === "finished" || m.status === "wo")
              const upcoming = myMatches.filter(m => {
                if (m.status === "finished" || m.status === "wo" || m.status === "cancelled") return false
                if (!m.scheduledAt) return true
                return new Date(m.scheduledAt) >= todayStart
              })

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

              const allMembers = tournament.members.filter(m => m.status === "accepted" && m.user.id !== user.id)

              const handleCreateMatch = async () => {
                if (!newMatchOpponent) { setNewMatchError("Selecione um adversário"); return }
                setCreatingMatch(true); setNewMatchError("")
                try {
                  const token = localStorage.getItem("token")
                  const res = await fetch(`/api/tournaments/${tournament.id}/matches`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ action: "create_match", opponentId: newMatchOpponent })
                  })
                  const data = await res.json()
                  if (!res.ok) { setNewMatchError(data.error || "Erro ao criar partida"); return }
                  setShowNewMatch(false); setNewMatchOpponent(""); fetchMatches()
                } catch { setNewMatchError("Erro de conexão") }
                finally { setCreatingMatch(false) }
              }

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

                  {/* Marcar Partida button */}
                  <button onClick={() => setShowNewMatch(true)} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Marcar Partida
                  </button>

                  {/* New match modal */}
                  {showNewMatch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNewMatch(false)}>
                      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Marcar Partida</h3>
                        <p className="text-sm text-gray-600 mb-4">Selecione o adversário para criar a partida:</p>
                        <select value={newMatchOpponent} onChange={e => setNewMatchOpponent(e.target.value)} className="input w-full mb-3">
                          <option value="">Selecione um jogador</option>
                          {allMembers.map(m => (
                            <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                          ))}
                        </select>
                        {newMatchError && <p className="text-sm text-red-600 mb-3">{newMatchError}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => setShowNewMatch(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                          <button onClick={handleCreateMatch} disabled={creatingMatch || !newMatchOpponent} className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {creatingMatch ? "Criando..." : "Criar Partida"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending Invitations */}
                  {pendingProposals.length > 0 && (
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <h3 className="font-medium text-amber-800">Convites Pendentes ({pendingProposals.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {pendingProposals.map(({ match: m, proposal }) => (
                          <ProposalCard
                            key={proposal.id}
                            proposal={proposal}
                            currentUserId={user.id}
                            matchId={m.id}
                            matchStatus={m.status}
                            courts={tournament.courts}
                            onAction={fetchMatches}
                          />
                        ))}
                      </div>
                    </div>
                  )}

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

                  {/* Upcoming Games */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-3">Próximos Jogos ({filteredUpcoming.length})</h3>
                    {filteredUpcoming.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum jogo agendado</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredUpcoming.map(match => {
                          const isPlayer = user && (match.homePlayer.id === user.id || match.awayPlayer.id === user.id)
                          const canSchedule = (isPlayer || isOwner) && (match.status === "pending_scheduling" || match.status === "proposal_sent" || match.status === "awaiting_response")
                          const canStart = (isPlayer || isOwner) && match.status === "scheduled"
                          const canResult = (isPlayer || isOwner) && match.status === "in_progress"
                          const hasPendingProposal = match.scheduleProposals.some(p => p.status === "pending")

                          return (
                            <div key={match.id} className="border border-gray-100 rounded-lg overflow-hidden">
                              <div className="flex flex-wrap items-center gap-3 p-3">
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
                                  <p className="text-sm font-medium text-gray-900">vs {(match.homePlayer.id === user.id ? match.awayPlayer : match.homePlayer).name}</p>
                                  {match.court && <p className="text-xs text-gray-500">{match.court.name}</p>}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
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
                                  {isOwner && (
                                    <button
                                      onClick={() => setEditingMatch(match)}
                                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                    >
                                      Editar
                                    </button>
                                  )}
                                  {isOwner && (
                                    <button
                                      onClick={() => handleDeleteMatch(match.id)}
                                      disabled={deletingMatchId === match.id}
                                      className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                                    >
                                      Apagar
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
                                <p className="text-sm font-medium text-gray-900">vs {opponent.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {match.scheduledAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(match.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                    </span>
                                  )}
                                  {match.court && <span className="text-xs text-gray-400">{match.court.name}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <span className={`text-lg font-bold ${won ? "text-green-700" : "text-red-600"}`}>{myScore}</span>
                                  <span className="text-xs text-gray-400">x</span>
                                  <span className={`text-lg font-bold ${!won ? "text-green-700" : "text-red-600"}`}>{theirScore}</span>
                                </div>
                                <p className={`text-xs font-medium ${won ? "text-green-600" : "text-red-500"}`}>
                                  {won ? "Vitória" : "Derrota"}
                                  {match.endReason === "forfeit" && " (Desistência)"}
                                  {match.endReason === "wo" && " (W.O.)"}
                                </p>
                              </div>
                              {isOwner && (
                                <button
                                  onClick={() => setEditingMatch(match)}
                                  className="flex-shrink-0 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                  title="Editar partida"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {isOwner && (
                                <button
                                  onClick={() => handleDeleteMatch(match.id)}
                                  disabled={deletingMatchId === match.id}
                                  className="flex-shrink-0 px-2 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Apagar partida"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
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
                      opponentName={schedulingMatch.homePlayer.id === user.id ? schedulingMatch.awayPlayer.name : schedulingMatch.homePlayer.name}
                      courts={tournament.courts}
                      onSuccess={() => { setSchedulingMatch(null); fetchMatches() }}
                      onClose={() => setSchedulingMatch(null)}
                    />
                  )}

                  {/* Result modal */}
                  {resultMatch && (
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

                  {/* Edit modal */}
                  {editingMatch && (
                    <MatchEditForm
                      matchId={editingMatch.id}
                      homePlayer={editingMatch.homePlayer}
                      awayPlayer={editingMatch.awayPlayer}
                      scheduledAt={editingMatch.scheduledAt}
                      courtId={editingMatch.court?.id || null}
                      status={editingMatch.status}
                      duration={editingMatch.duration}
                      members={tournament.members.filter(m => m.status === "accepted")}
                      courts={tournament.courts}
                      onSuccess={() => { setEditingMatch(null); fetchMatches() }}
                      onClose={() => setEditingMatch(null)}
                    />
                  )}
                </div>
              )
            })()}

            {/* ===== RANKING ===== */}
            {activeTab === "ranking" && (() => {
              const monthNames: Record<string, string> = {
                "02/2026": "Fevereiro", "03/2026": "Março", "04/2026": "Abril",
                "05/2026": "Maio", "06/2026": "Junho", "07/2026": "Julho",
                "08/2026": "Agosto", "09/2026": "Setembro"
              }

              const handleMonthChange = async (month: string) => {
                setRankingMonth(month)
                if (!tournament) return
                const token = localStorage.getItem("token")
                const qs = month ? `?month=${encodeURIComponent(month)}` : ""
                try {
                  const res = await fetch(`/api/tournaments/${tournament.id}/ranking${qs}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  const data = await res.json()
                  setRankings(data.ranking || [])
                } catch {}
              }

              return (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <h3 className="font-medium text-gray-900">Ranking</h3>
                    <select
                      value={rankingMonth}
                      onChange={e => handleMonthChange(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Geral (todos os meses)</option>
                      {Object.entries(monthNames).map(([key, label]) => (
                        <option key={key} value={key}>{label} {key}</option>
                      ))}
                    </select>
                  </div>
                  {rankingMonth && (
                    <p className="text-xs text-gray-500 mb-3">
                      Mostrando ranking acumulado até {monthNames[rankingMonth]} {rankingMonth}
                    </p>
                  )}
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
                            <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Saldo Sets</th>
                            <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Games</th>
                            <th className="text-center py-2 px-2 text-xs font-medium text-gray-500">Saldo Games</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((r, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 px-2 font-medium text-gray-900">{r.position || i + 1}</td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-medium overflow-hidden flex-shrink-0">
                                    {r.user.avatarUrl ? (
                                      <img src={r.user.avatarUrl} alt={r.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                      r.user.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <span className="font-medium text-gray-900">{r.user.name}</span>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center font-semibold text-gray-900">{r.points}</td>
                              <td className="py-2 px-2 text-center text-green-600">{r.wins}</td>
                              <td className="py-2 px-2 text-center text-red-500">{r.losses}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{r.setsWon}-{r.setsLost}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{r.setBalance}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{r.gamesWon}-{r.gamesLost}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{r.gamesBalance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ===== KNOCKOUT ===== */}
            {activeTab === "knockout" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Mata-Mata</h3>
                      <p className="text-sm text-gray-500">
                        {knockout?.locked ? "Chaveamento travado" : "Projeção baseada no ranking atual"}
                      </p>
                    </div>
                    {isOwner && knockout && !knockout.locked && (
                      <button
                        onClick={handleLockKnockout}
                        disabled={lockingKnockout || !knockout.isRankingComplete || Boolean(knockout.validationError)}
                        className="btn-primary disabled:opacity-50"
                      >
                        {lockingKnockout ? "Travando..." : "Travar Mata-Mata"}
                      </button>
                    )}
                  </div>

                  {!knockout ? (
                    <p className="text-sm text-gray-500">Mata-mata disponível apenas para torneios Ranking com Mata-Mata.</p>
                  ) : knockout.validationError ? (
                    <p className="text-sm text-red-600">{knockout.validationError}</p>
                  ) : (
                    <>
                      {!knockout.isRankingComplete && !knockout.locked && (
                        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                          O chaveamento ainda é uma projeção. O agendamento será liberado depois que todos os jogos do ranking forem finalizados e o organizador travar o mata-mata.
                        </div>
                      )}
                      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-xs text-gray-500">Classificados</p>
                          <p className="text-lg font-semibold text-gray-900">{knockout.qualifiers}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-xs text-gray-500">Status ranking</p>
                          <p className="text-sm font-medium text-gray-900">{knockout.isRankingComplete ? "Encerrado" : "Em andamento"}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-xs text-gray-500">Chave</p>
                          <p className="text-sm font-medium text-gray-900">{knockout.locked ? "Travada" : "Projetada"}</p>
                        </div>
                      </div>
                      <KnockoutBracketView knockout={knockout} getMatchStatusLabel={getMatchStatusLabel} />
                    </>
                  )}
                </div>
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
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-medium flex-shrink-0 overflow-hidden">
                            {member.user.avatarUrl ? (
                              <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              member.user.name.charAt(0).toUpperCase()
                            )}
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4zm0 8h16M9 4v16M15 4v16" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{court.name}</p>
                                {court.surfaceType && <p className="text-xs text-gray-500">{court.surfaceType === "hard" ? "Quadra Dura" : court.surfaceType === "clay" ? "Quadra de Saibro" : court.surfaceType === "grass" ? "Quadra de Grama" : court.surfaceType}</p>}
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
                        <li>Vitória por desistência: {tournament.scoringConfig.winByForfeit} pts</li>
                        <li>Derrota por desistência: {tournament.scoringConfig.lossByForfeit} pts</li>
                        <li>Vitória por W.O.: {tournament.scoringConfig.winByWO} pts</li>
                        <li>Derrota por W.O.: {tournament.scoringConfig.lossByWO} pts</li>
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

const BRACKET_CARD_WIDTH = 280
const BRACKET_CARD_HEIGHT = 126
const BRACKET_COLUMN_GAP = 88
const BRACKET_BASE_GAP = 26
const BRACKET_HEADER_HEIGHT = 42
const BRACKET_PADDING = 18

type BracketLayoutItem = {
  entry: KnockoutEntry
  x: number
  y: number
}

type BracketLayoutLine = {
  id: string
  path: string
}

type BracketLayout = {
  rounds: number[]
  items: BracketLayoutItem[]
  lines: BracketLayoutLine[]
  width: number
  height: number
}

function KnockoutBracketView({
  knockout,
  getMatchStatusLabel,
}: {
  knockout: KnockoutState
  getMatchStatusLabel: (status: string) => string
}) {
  const layout = buildBracketLayout(knockout.bracket)

  if (layout.items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">Nenhum jogo de mata-mata disponível.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/70">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Chaveamento</p>
          <p className="text-xs text-gray-500">Acompanhe o caminho de cada vencedor até a final.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-green-700">Vencedor</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">Chapéu</span>
          <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-500">A definir</span>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <div
          className="relative min-w-max"
          style={{
            width: layout.width,
            height: layout.height,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 z-0"
            width={layout.width}
            height={layout.height}
            aria-hidden="true"
          >
            {layout.lines.map(line => (
              <path
                key={line.id}
                d={line.path}
                fill="none"
                stroke="#d1d5db"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {layout.lines.map(line => {
              const match = line.path.match(/H ([\d.]+)$/)
              if (!match) return null
              const endX = Number(match[1])
              const endY = Number(line.path.match(/V ([\d.]+)/)?.[1] ?? 0)
              return <circle key={`${line.id}-dot`} cx={endX} cy={endY} r="3.5" fill="#10b981" />
            })}
          </svg>

          {layout.rounds.map((round, index) => {
            const x = BRACKET_PADDING + index * (BRACKET_CARD_WIDTH + BRACKET_COLUMN_GAP)
            const roundName = knockout.bracket.find(entry => entry.round === round)?.roundName ?? `Rodada ${round}`

            return (
              <div
                key={round}
                className="absolute top-0 z-10"
                style={{ left: x, width: BRACKET_CARD_WIDTH }}
              >
                <div className="flex h-8 items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{roundName}</h4>
                  <span className="text-xs text-gray-400">
                    {knockout.bracket.filter(entry => entry.round === round).length} jogos
                  </span>
                </div>
              </div>
            )
          })}

          {layout.items.map(item => (
            <KnockoutMatchCard
              key={`${item.entry.round}-${item.entry.position}`}
              entry={item.entry}
              getMatchStatusLabel={getMatchStatusLabel}
              style={{
                left: item.x,
                top: item.y,
                width: BRACKET_CARD_WIDTH,
                height: BRACKET_CARD_HEIGHT,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function KnockoutMatchCard({
  entry,
  getMatchStatusLabel,
  style,
}: {
  entry: KnockoutEntry
  getMatchStatusLabel: (status: string) => string
  style: React.CSSProperties
}) {
  const statusLabel =
    entry.status === "bye"
      ? "Chapéu"
      : entry.matchStatus
        ? getMatchStatusLabel(entry.matchStatus)
        : entry.status === "ready"
          ? "Pronto"
          : "Aguardando"

  return (
    <div
      className="absolute z-10 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      style={style}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">Jogo {entry.position}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getBracketStatusClass(entry.status)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2">
        <KnockoutPlayerSlot
          seed={entry.homeSeed}
          name={entry.homeName}
          sourceLabel={entry.homeSourceLabel}
          playerId={entry.homePlayerId}
          winnerId={entry.winnerId}
        />
        <KnockoutPlayerSlot
          seed={entry.awaySeed}
          name={entry.awayName}
          sourceLabel={entry.awaySourceLabel}
          playerId={entry.awayPlayerId}
          winnerId={entry.winnerId}
        />
      </div>
    </div>
  )
}

function KnockoutPlayerSlot({
  seed,
  name,
  sourceLabel,
  playerId,
  winnerId,
}: {
  seed: number | null
  name: string | null
  sourceLabel: string | null
  playerId: string | null
  winnerId: string | null
}) {
  const label = name || sourceLabel || "A definir"
  const isWinner = Boolean(playerId && winnerId === playerId)
  const isSource = Boolean(!name && sourceLabel)

  return (
    <div
      className={`flex h-9 items-center gap-2 rounded-md border px-2 text-sm ${
        isWinner
          ? "border-green-200 bg-green-50 text-green-800"
          : isSource
            ? "border-gray-200 bg-gray-50 text-gray-500"
            : "border-gray-200 bg-white text-gray-800"
      }`}
    >
      {seed ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-500">
          {seed}
        </span>
      ) : (
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-300" />
      )}
      <span className={`min-w-0 flex-1 truncate ${isSource ? "italic" : "font-medium"}`}>{label}</span>
      {isWinner && <span className="text-xs font-semibold text-green-600">Venceu</span>}
    </div>
  )
}

function buildBracketLayout(bracket: KnockoutEntry[]): BracketLayout {
  const rounds = Array.from(new Set(bracket.map(entry => entry.round))).sort((a, b) => a - b)
  const byKey = new Map(bracket.map(entry => [getBracketKey(entry.round, entry.position), entry]))
  const positionByKey = new Map<string, { x: number; y: number }>()
  const pitch = BRACKET_CARD_HEIGHT + BRACKET_BASE_GAP

  rounds.forEach((round, roundIndex) => {
    const entries = bracket
      .filter(entry => entry.round === round)
      .sort((a, b) => a.position - b.position)

    entries.forEach(entry => {
      const x = BRACKET_PADDING + roundIndex * (BRACKET_CARD_WIDTH + BRACKET_COLUMN_GAP)
      const sources = bracket.filter(source => source.nextRound === entry.round && source.nextPosition === entry.position)
      const sourcePositions = sources
        .map(source => positionByKey.get(getBracketKey(source.round, source.position)))
        .filter((position): position is { x: number; y: number } => Boolean(position))

      const computedY = sourcePositions.length > 0
        ? sourcePositions.reduce((sum, position) => sum + position.y + BRACKET_CARD_HEIGHT / 2, 0) / sourcePositions.length - BRACKET_CARD_HEIGHT / 2
        : (entry.position - 1) * pitch * Math.max(1, Math.pow(2, round - 1))

      positionByKey.set(getBracketKey(entry.round, entry.position), {
        x,
        y: BRACKET_HEADER_HEIGHT + BRACKET_PADDING + computedY,
      })
    })
  })

  const items = bracket
    .map(entry => {
      const position = positionByKey.get(getBracketKey(entry.round, entry.position))
      if (!position) return null

      return {
        entry,
        x: position.x,
        y: position.y,
      }
    })
    .filter((item): item is BracketLayoutItem => Boolean(item))

  const lines = bracket
    .map(entry => {
      if (!entry.nextRound || !entry.nextPosition) return null

      const from = positionByKey.get(getBracketKey(entry.round, entry.position))
      const targetEntry = byKey.get(getBracketKey(entry.nextRound, entry.nextPosition))
      const to = positionByKey.get(getBracketKey(entry.nextRound, entry.nextPosition))
      if (!from || !to || !targetEntry) return null

      const x1 = from.x + BRACKET_CARD_WIDTH
      const y1 = from.y + BRACKET_CARD_HEIGHT / 2
      const x2 = to.x
      const targetSlotOffset = entry.nextSlot === "away" ? 88 : 48
      const y2 = to.y + targetSlotOffset
      const midX = x1 + (x2 - x1) / 2

      return {
        id: `${entry.round}-${entry.position}-${entry.nextRound}-${entry.nextPosition}`,
        path: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
      }
    })
    .filter((line): line is BracketLayoutLine => Boolean(line))

  const maxRight = Math.max(...items.map(item => item.x + BRACKET_CARD_WIDTH), BRACKET_CARD_WIDTH)
  const maxBottom = Math.max(...items.map(item => item.y + BRACKET_CARD_HEIGHT), BRACKET_CARD_HEIGHT)

  return {
    rounds,
    items,
    lines,
    width: maxRight + BRACKET_PADDING,
    height: maxBottom + BRACKET_PADDING,
  }
}

function getBracketKey(round: number, position: number) {
  return `${round}-${position}`
}

function getBracketStatusClass(status: string) {
  if (status === "completed") return "bg-green-50 text-green-700"
  if (status === "ready") return "bg-blue-50 text-blue-700"
  if (status === "bye") return "bg-amber-50 text-amber-700"
  return "bg-gray-100 text-gray-500"
}
