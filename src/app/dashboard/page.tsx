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

        const tournamentsRes = await fetch("/api/tournaments", {
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
                  <Link href="/tournaments/new" className="btn-primary text-sm">
                    Criar Primeiro Torneio
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
                <Link href="/tournaments/new" className="btn-primary w-full justify-center text-sm">
                  Criar Torneio
                </Link>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
