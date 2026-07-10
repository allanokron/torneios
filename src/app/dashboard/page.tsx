"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import TournamentCard from "@/components/ui/TournamentCard"
import PlayerCard from "@/components/ui/PlayerCard"

interface User {
  id: string
  name: string
  email: string
}

interface Tournament {
  id: string
  name: string
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
  homePlayer: { name: string; avatarUrl?: string }
  awayPlayer: { name: string; avatarUrl?: string }
  tournament: { name: string; id: string }
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--court-green)]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Welcome Section */}
        <div className="bg-court-gradient rounded-2xl p-6 sm:p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white rounded-xl"></div>
          </div>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Olá, {user.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-white/80 mb-6">
              Bem-vindo ao seu painel de torneios
            </p>
            <Link href="/tournaments/new" className="btn-yellow">
              + Criar Novo Torneio
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tournaments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Meus Torneios</h2>
                <Link href="/tournaments" className="text-sm text-[var(--court-green)] hover:underline font-medium">
                  Ver todos
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎾</div>
                  <p className="text-gray-500 mb-4">Você ainda não participa de nenhum torneio</p>
                  <Link href="/tournaments/new" className="btn-primary">
                    Criar Primeiro Torneio
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
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

            {/* Upcoming Matches */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Próximas Partidas</h2>
              </div>

              {upcomingMatches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-500">Nenhuma partida agendada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMatches.map(match => (
                    <div
                      key={match.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-bold text-gray-900">
                          {new Date(match.scheduledAt!).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </div>
                        <div className="text-xs text-[var(--court-green)] font-medium">
                          {new Date(match.scheduledAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.homePlayer.name}</span>
                          <span className="text-gray-400 text-sm">vs</span>
                          <span className="font-medium">{match.awayPlayer.name}</span>
                        </div>
                        <p className="text-sm text-gray-500">{match.tournament.name}</p>
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
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Link href="/tournaments/new" className="btn-primary w-full justify-center">
                  + Criar Torneio
                </Link>
                <Link href="/tournaments" className="btn-secondary w-full justify-center">
                  Buscar Torneios
                </Link>
              </div>
            </div>

            {/* Notifications */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Notificações</h3>
                <button className="text-sm text-[var(--court-green)] hover:underline">
                  Marcar como lidas
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-gray-500 text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg ${notification.isRead ? "bg-gray-50" : "bg-blue-50"}`}
                    >
                      <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600">✓</span>
                  </div>
                  <div>
                    <p className="text-gray-700">Partida finalizada</p>
                    <p className="text-gray-400 text-xs">Há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600">📅</span>
                  </div>
                  <div>
                    <p className="text-gray-700">Partida agendada</p>
                    <p className="text-gray-400 text-xs">Há 5 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600">🏆</span>
                  </div>
                  <div>
                    <p className="text-gray-700">Inscrição em torneio</p>
                    <p className="text-gray-400 text-xs">Ontem</p>
                  </div>
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