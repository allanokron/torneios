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

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          router.push("/login")
        }
      })
      .catch(() => router.push("/login"))

    fetch("/api/tournaments", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(async (data) => {
        const myTournaments = data.tournaments || []
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
              if (
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
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Olá, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500">Bem-vindo ao TennisPro</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Meus Torneios</h2>
                <Link href="/tournaments" className="text-sm text-green-600 hover:text-green-700">
                  Ver todos
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">Você ainda não participa de nenhum torneio</p>
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
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4zm0 8h16M9 4v16M15 4v16" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{tournament.name}</p>
                        <p className="text-xs text-gray-500">
                          {tournament.status === "in_progress" ? "Em andamento" :
                           tournament.status === "registration_open" ? "Inscrições abertas" :
                           tournament.status === "registration_closed" ? "Inscrições encerradas" :
                           tournament.status === "finished" ? "Finalizado" : tournament.status}
                          {tournament._count ? ` · ${tournament._count.members} jogadores` : ""}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Próximas Partidas</h2>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="h-10 w-12 bg-gray-100 rounded"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingMatches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Nenhuma partida agendada</p>
              ) : (
                <div className="space-y-2">
                  {upcomingMatches.map(match => {
                    const isHome = match.homePlayer.id === user.id
                    const opponent = isHome ? match.awayPlayer : match.homePlayer
                    return (
                      <Link
                        key={match.id}
                        href={`/tournaments/${match.tournament.id}?tab=matches`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-center min-w-[55px]">
                          <div className="text-xs font-medium text-gray-900">
                            {new Date(match.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(match.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            vs {opponent.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{match.tournament.name}</p>
                        </div>
                        {match.court && (
                          <span className="text-xs text-gray-400 hidden sm:block">{match.court.name}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-3">Ações Rápidas</h3>
              <div className="space-y-2">
                <Link href="/tournaments/new" className="btn-primary w-full justify-center text-sm">
                  Criar Torneio
                </Link>
                <Link href="/tournaments" className="btn-secondary w-full justify-center text-sm">
                  Buscar Torneios
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-3">Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Torneios</span>
                  <span className="text-sm font-medium text-gray-900">{tournaments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Próximas partidas</span>
                  <span className="text-sm font-medium text-gray-900">{upcomingMatches.length}</span>
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
