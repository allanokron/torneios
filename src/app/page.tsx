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

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-court-gradient text-white overflow-hidden">
          {/* Court Lines Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-white rounded-2xl"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white"></div>
            <div className="absolute top-8 bottom-1/2 left-1/4 w-0.5 bg-white"></div>
            <div className="absolute top-1/2 bottom-8 left-1/4 w-0.5 bg-white"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Gestão de{" "}
                <span className="text-[var(--ball-yellow)]">Torneios</span>
                <br />
                Esportivos
              </h1>
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-lg">
                Crie, gerencie e acompanhe torneios de tênis com facilidade. 
                Organize competições, agende partidas e acompanhe rankings em tempo real.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <>
                    <Link href="/tournaments/new" className="btn-yellow text-lg px-8 py-3">
                      Criar Torneio
                    </Link>
                    <Link href="/tournaments" className="btn-outline border-white text-white hover:bg-white hover:text-[var(--court-green)] text-lg px-8 py-3">
                      Ver Torneios
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="btn-yellow text-lg px-8 py-3">
                      Comece Agora
                    </Link>
                    <Link href="/login" className="btn-outline border-white text-white hover:bg-white hover:text-[var(--court-green)] text-lg px-8 py-3">
                      Já tenho conta
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Floating Tennis Ball */}
            <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2">
              <div className="text-[200px] animate-bounce-slow opacity-20">🎾</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Tudo que você precisa para organizar torneios
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Ferramentas completas para criar e gerenciar competições esportivas
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-[var(--court-green-pale)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏆</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Crie Torneios</h3>
                <p className="text-gray-600">
                  Monte competições completas com regras, pontuação e grade de jogos automáticas.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📅</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Agende Partidas</h3>
                <p className="text-gray-600">
                  Jogadores negociam horários diretamente no app. Validação automática de conflitos.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ranking em Tempo Real</h3>
                <p className="text-gray-600">
                  Acompanhe a classificação atualizada a cada partida finalizada.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tournaments Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Torneios Disponíveis</h2>
                <p className="text-gray-600 mt-1">Encontre um torneio para participar</p>
              </div>
              <Link href="/tournaments" className="text-[var(--court-green)] hover:underline font-medium">
                Ver todos →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <div className="text-6xl mb-4">🎾</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum torneio encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Seja o primeiro a criar um torneio!
                </p>
                {user && (
                  <Link href="/tournaments/new" className="btn-primary">
                    Criar Torneio
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.slice(0, 6).map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="py-16 bg-[var(--court-green-dark)] text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Pronto para começar?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Crie sua conta gratuita e comece a organizar seus torneios de tênis hoje mesmo.
              </p>
              <Link href="/register" className="btn-yellow text-lg px-8 py-3">
                Criar Conta Grátis
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}