"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import TournamentCard from "@/components/ui/TournamentCard"

interface User {
  id: string
  name: string
  email: string
}

interface Tournament {
  id: string
  name: string
  description?: string
  sport: string
  format: string
  status: string
  startDate: string
  _count?: {
    members: number
    matches: number
  }
}

interface Match {
  id: string
  scheduledAt?: string
  status: string
  homePlayer: { name: string }
  awayPlayer: { name: string }
  tournament: { name: string; id: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [upcomingMatches] = useState<Match[]>([])
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
      .then(data => {
        setTournaments(data.tournaments?.slice(0, 5) || [])
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
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Olá, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500">Bem-vindo ao seu painel</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tournaments */}
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
                <div className="space-y-1">
                  {tournaments.map(tournament => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Matches */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-medium text-gray-900 mb-4">Próximas Partidas</h2>
              {upcomingMatches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Nenhuma partida agendada</p>
              ) : (
                <div className="space-y-2">
                  {upcomingMatches.map(match => (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center min-w-[50px]">
                        <div className="text-xs font-medium text-gray-900">
                          {new Date(match.scheduledAt!).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(match.scheduledAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {match.homePlayer.name} vs {match.awayPlayer.name}
                        </p>
                        <p className="text-xs text-gray-500">{match.tournament.name}</p>
                      </div>
                      <span className={`status-badge match-${match.status}`}>
                        {match.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
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

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-3">Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Torneios</span>
                  <span className="text-sm font-medium text-gray-900">{tournaments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Partidas</span>
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
