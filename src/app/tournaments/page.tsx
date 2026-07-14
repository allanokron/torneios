"use client"

import { useState, useEffect, useMemo } from "react"
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
  isPublic: boolean
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
  const [searchState, setSearchState] = useState("")
  const [searchCity, setSearchCity] = useState("")

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

  const states = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO"
  ]

  const availableCities = useMemo(() => {
    if (!searchState) return []
    const cities = new Set<string>()
    tournaments.forEach(t => {
      if (t.state === searchState && t.city) cities.add(t.city)
    })
    return Array.from(cities).sort()
  }, [searchState, tournaments])

  const filteredTournaments = tournaments.filter(t => {
    if (filter !== "all" && t.status !== filter) return false
    if (searchState && t.state !== searchState) return false
    if (searchCity && t.city !== searchCity) return false
    return true
  })

  const hasLocationFilter = searchState || searchCity

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Torneios</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--neutral-400)' }}>Encontre ou crie um torneio</p>
          </div>
          {user && (
            <Link href="/tournaments/new" className="btn-primary text-sm">
              Criar Torneio
            </Link>
          )}
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" style={{ color: 'var(--neutral-400)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--neutral-600)' }}>Buscar por região</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--neutral-400)' }}>Estado</label>
              <select
                value={searchState}
                onChange={e => {
                  setSearchState(e.target.value)
                  setSearchCity("")
                }}
                className="input w-full text-sm"
              >
                <option value="">Todos os estados</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--neutral-400)' }}>Cidade</label>
              <select
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                disabled={!searchState}
                className="input w-full text-sm"
              >
                <option value="">{searchState ? "Todas as cidades" : "Selecione o estado primeiro"}</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {hasLocationFilter && (
            <button
              onClick={() => { setSearchState(""); setSearchCity("") }}
              className="text-xs mt-2"
              style={{ color: 'var(--neutral-400)' }}
            >
              Limpar filtro de região
            </button>
          )}
        </div>

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
              className="px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors"
              style={filter === f.value
                ? { background: 'var(--accent)', color: 'var(--primary)' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--neutral-600)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="h-32 rounded-lg mb-4" style={{ background: 'var(--neutral-100)' }}></div>
                <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--neutral-100)' }}></div>
                <div className="h-3 rounded w-1/2" style={{ background: 'var(--neutral-100)' }}></div>
              </div>
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="mb-4" style={{ color: 'var(--neutral-400)' }}>Nenhum torneio encontrado</p>
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
