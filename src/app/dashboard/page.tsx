"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface Tournament {
  id: string
  name: string
  description?: string
  status: string
  startDate: string
  city?: string
  state?: string
  coverImage?: string
  _count?: {
    members: number
    matches: number
  }
}

interface PendingInvitation {
  id: string
  tournament: {
    id: string
    name: string
    status: string
    startDate: string
    registrationFee: number | null
    owner: {
      id: string
      name: string
    }
  }
  joinedAt: string
}

interface UpcomingMatch {
  id: string
  scheduledAt: string
  status: string
  homePlayer: { id: string; name: string }
  awayPlayer: { id: string; name: string }
  court?: { name: string } | null
  tournament: { name: string; id: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [canCreateTournament, setCanCreateTournament] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    async function loadData() {
      try {
        const authRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const authData = await authRes.json()
        if (!authData.user) {
          router.push("/login")
          return
        }
        setUser(authData.user)

        const organizerRes = await fetch("/api/organizer/status", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const organizerData = await organizerRes.json()
        setCanCreateTournament(Boolean(organizerData.canCreateTournament))

        const tournamentsRes = await fetch("/api/tournaments?mine=1", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const tournamentsData = await tournamentsRes.json()
        const myTournaments = tournamentsData.tournaments || []
        setTournaments(myTournaments.slice(0, 5))

        const now = new Date()
        const allMatches: UpcomingMatch[] = []

        for (const t of myTournaments) {
          try {
            const res = await fetch(`/api/tournaments/${t.id}/matches`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            const mData = await res.json()
            const matches = mData.matches || []
            for (const m of matches) {
              const isMyMatch = m.homePlayer.id === authData.user.id || m.awayPlayer.id === authData.user.id
              if (
                isMyMatch &&
                m.status !== "finished" &&
                m.status !== "wo" &&
                m.status !== "cancelled" &&
                m.scheduledAt &&
                new Date(m.scheduledAt) >= now
              ) {
                allMatches.push({
                  ...m,
                  tournament: { name: t.name, id: t.id }
                })
              }
            }
          } catch {}
        }

        allMatches.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        setUpcomingMatches(allMatches.slice(0, 10))

        const invitationsRes = await fetch("/api/invitations", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const invitationsData = await invitationsRes.json()
        setInvitations(invitationsData.invitations || [])
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  const handleInvitation = async (invitationId: string, action: "accepted" | "rejected", tournamentId: string, hasFee: boolean) => {
    const token = localStorage.getItem("token")
    if (!token) return

    if (action === "rejected") {
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}/members`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ memberId: invitationId, status: "rejected" }),
        })
        if (res.ok) {
          setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        }
      } catch (error) {
        console.error("Erro ao recusar convite:", error)
      }
      return
    }

    // Aceitar convite de torneio pago → ir para pagamento
    if (hasFee) {
      router.push(`/tournaments/${tournamentId}?pay Invitation=${invitationId}`)
      return
    }

    // Torneio gratuito → aceitar direto
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/members`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: invitationId, status: "accepted" }),
      })
      if (res.ok) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      }
    } catch (error) {
      console.error("Erro ao aceitar convite:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Olá, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>Bem-vindo ao Torneio+</p>
        </div>

        {invitations.length > 0 && (
          <div className="mb-6 rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2 className="font-medium" style={{ color: 'var(--text)' }}>
                Convites Pendentes ({invitations.length})
              </h2>
            </div>
            <div className="space-y-3">
              {invitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(184, 224, 0, 0.12)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4zm0 8h16M9 4v16M15 4v16" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {invitation.tournament.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                      Convite de {invitation.tournament.owner.name}
                      {invitation.tournament.registrationFee && (
                        <span className="ml-1" style={{ color: 'var(--accent-dark)' }}>
                          · R$ {(invitation.tournament.registrationFee / 100).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInvitation(invitation.id, "accepted", invitation.tournament.id, !!invitation.tournament.registrationFee)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'var(--accent)', color: 'var(--accent-dark)' }}
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleInvitation(invitation.id, "rejected", invitation.tournament.id, false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'var(--neutral-100)', color: 'var(--neutral-400)' }}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium" style={{ color: 'var(--text)' }}>Meus Torneios</h2>
                <Link href="/tournaments" className="text-sm" style={{ color: 'var(--accent-dark)' }}>
                  Ver todos
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="h-10 w-10 rounded-lg" style={{ background: 'rgba(184, 224, 0, 0.12)' }}></div>
                      <div className="flex-1">
                        <div className="h-3 rounded w-1/3 mb-2" style={{ background: 'var(--neutral-200)' }}></div>
                        <div className="h-3 rounded w-1/4" style={{ background: 'var(--neutral-200)' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm mb-3" style={{ color: 'var(--neutral-400)' }}>Você ainda não participa de nenhum torneio</p>
                  <Link href="/tournaments" className="btn-primary text-sm">
                    Buscar torneios
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {tournaments.map(tournament => (
                    <Link
                      key={tournament.id}
                      href={`/tournaments/${tournament.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-100)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(184, 224, 0, 0.12)' }}>
                        <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4zm0 8h16M9 4v16M15 4v16" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{tournament.name}</p>
                        <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                          {tournament.status === "in_progress" ? "Em andamento" :
                           tournament.status === "registration_open" ? "Inscrições abertas" :
                           tournament.status === "registration_closed" ? "Inscrições encerradas" :
                           tournament.status === "finished" ? "Finalizado" : tournament.status}
                          {tournament._count ? ` · ${tournament._count.members} jogadores` : ""}
                        </p>
                      </div>
                      <svg className="w-4 h-4" style={{ color: 'var(--neutral-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium" style={{ color: 'var(--text)' }}>Próximas Partidas</h2>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="h-10 w-12 rounded" style={{ background: 'var(--neutral-200)' }}></div>
                      <div className="flex-1">
                        <div className="h-3 rounded w-1/2 mb-2" style={{ background: 'var(--neutral-200)' }}></div>
                        <div className="h-3 rounded w-1/3" style={{ background: 'var(--neutral-200)' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingMatches.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--neutral-400)' }}>Nenhuma partida agendada</p>
              ) : (
                <div className="space-y-2">
                  {upcomingMatches.map(match => {
                    const isHome = match.homePlayer.id === user.id
                    const opponent = isHome ? match.awayPlayer : match.homePlayer
                    return (
                      <Link
                        key={match.id}
                        href={`/tournaments/${match.tournament.id}?tab=matches`}
                        className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-100)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="text-center min-w-[55px]">
                          <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                            {new Date(match.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                            {new Date(match.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                            vs {opponent.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--neutral-400)' }}>{match.tournament.name}</p>
                        </div>
                        {match.court && (
                          <span className="text-xs hidden sm:block" style={{ color: 'var(--neutral-300)' }}>{match.court.name}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-medium mb-3" style={{ color: 'var(--text)' }}>Ações Rápidas</h3>
              <div className="space-y-2">
                {canCreateTournament ? (
                  <Link href="/tournaments/new" className="btn-primary w-full justify-center text-sm">
                    Criar Torneio
                  </Link>
                ) : (
                  <Link href="/organizer" className="btn-primary w-full justify-center text-sm">
                    Virar organizador
                  </Link>
                )}
                <Link href="/tournaments" className="btn-secondary w-full justify-center text-sm">
                  Buscar Torneios
                </Link>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-medium mb-3" style={{ color: 'var(--text)' }}>Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--neutral-400)' }}>Torneios</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tournaments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--neutral-400)' }}>Próximas partidas</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{upcomingMatches.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-medium mb-3" style={{ color: 'var(--text)' }}>Assinatura</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--neutral-400)' }}>Status</span>
                  <span className="text-sm font-medium" style={{ color: canCreateTournament ? 'var(--accent-dark)' : 'var(--neutral-400)' }}>
                    {canCreateTournament ? "Organizador" : "Gratuito"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                  {canCreateTournament ? "Sua área de criação e gestão de torneios está liberada." : "Assine ou compre uma abertura avulsa para criar torneios."}
                </p>
                <Link href="/organizer" className="btn-secondary w-full justify-center text-sm">
                  {canCreateTournament ? "Abrir área do organizador" : "Ver opções"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
