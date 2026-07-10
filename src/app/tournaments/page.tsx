"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import TournamentCard from "@/components/ui/TournamentCard"

interface Tournament {
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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user)
        })
        .catch(() => {})
    }

    fetch("/api/tournaments")
      .then(res => res.json())
      .then(data => {
        setTournaments(data.tournaments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredTournaments = filter === "all" 
    ? tournaments 
    : tournaments.filter(t => t.status === filter)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Torneios</h1>
            <p className="text-sm text-gray-500 mt-1">Encontre ou crie um torneio</p>
          </div>
          {user && (
            <Link href="/tournaments/new" className="btn-primary text-sm">
              Criar Torneio
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "all", label: "Todos" },
            { value: "registration_open", label: "Inscrições Abertas" },
            { value: "in_progress", label: "Em Andamento" },
            { value: "finished", label: "Finalizados" }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 mb-4">Nenhum torneio encontrado</p>
            {user && (
              <Link href="/tournaments/new" className="btn-primary text-sm">
                Criar Torneio
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
