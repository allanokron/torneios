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
        {/* Hero */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Gerencie seus torneios de tênis
              </h1>
              <p className="text-gray-500 text-lg mb-8">
                Crie, organize e acompanhe competições de forma simples e moderna.
              </p>
              
              <div className="flex flex-wrap gap-3">
                {user ? (
                  <>
                    <Link href="/tournaments/new" className="btn-primary">
                      Criar Torneio
                    </Link>
                    <Link href="/tournaments" className="btn-secondary">
                      Ver Torneios
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="btn-primary">
                      Comece Grátis
                    </Link>
                    <Link href="/login" className="btn-secondary">
                      Entrar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Crie Torneios</h3>
                <p className="text-sm text-gray-500">
                  Monte competições com regras, pontuação e grade de jogos automáticas.
                </p>
              </div>
              
              <div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Agende Partidas</h3>
                <p className="text-sm text-gray-500">
                  Negocie horários diretamente no app com validação automática.
                </p>
              </div>
              
              <div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Ranking em Tempo Real</h3>
                <p className="text-sm text-gray-500">
                  Acompanhe a classificação atualizada a cada partida.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tournaments */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Torneios Disponíveis</h2>
                <p className="text-sm text-gray-500 mt-1">Encontre um torneio para participar</p>
              </div>
              <Link href="/tournaments" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Ver todos
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="h-32 bg-gray-100 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 mb-4">Nenhum torneio encontrado</p>
                {user && (
                  <Link href="/tournaments/new" className="btn-primary text-sm">
                    Criar Primeiro Torneio
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.slice(0, 6).map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="py-16 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Pronto para começar?
              </h2>
              <p className="text-gray-500 mb-6">
                Crie sua conta gratuita e comece a organizar seus torneios.
              </p>
              <Link href="/register" className="btn-primary">
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
