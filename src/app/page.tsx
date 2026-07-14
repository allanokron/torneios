"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />
      
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 50%, var(--primary-light) 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full" style={{ background: 'var(--accent)' }} />
            <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full" style={{ background: 'var(--accent)' }} />
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden" style={{ background: 'var(--accent)' }}>
                  <Image src="/images/logo.png" alt="Torneio+" fill className="object-cover" />
                </div>
                <span className="text-xl font-bold text-white">
                  Torneio<span style={{ color: 'var(--accent)' }}>+</span>
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight" style={{ letterSpacing: '-0.02em' }}>
                Gerencie seus torneios de tênis
              </h1>
              <p className="text-lg mb-8" style={{ color: '#A3B1C6' }}>
                Crie, organize e acompanhe competições de forma simples e moderna.
              </p>
              
              <div className="flex flex-wrap gap-3">
                {user ? (
                  <>
                    <Link href="/tournaments/new" className="btn-primary">
                      Criar Torneio
                    </Link>
                    <Link href="/tournaments" className="btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      Ver Torneios
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="btn-primary">
                      Comece Grátis
                    </Link>
                    <Link href="/login" className="btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      Entrar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ background: 'var(--surface)' }} className="py-16 border-b" >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(184, 224, 0, 0.12)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Crie Torneios</h3>
                <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>
                  Monte competições com regras, pontuação e grade de jogos automáticas.
                </p>
              </div>
              
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(59, 130, 246, 0.12)' }}
                >
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Agende Partidas</h3>
                <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>
                  Negocie horários diretamente no app com validação automática.
                </p>
              </div>
              
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(139, 92, 246, 0.12)' }}
                >
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Ranking em Tempo Real</h3>
                <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>
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
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Torneios Disponíveis</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--neutral-400)' }}>Encontre um torneio para participar</p>
              </div>
              <Link href="/tournaments" className="text-sm font-semibold" style={{ color: 'var(--accent-dark)' }}>
                Ver todos
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 animate-pulse"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="h-32 rounded-xl mb-4" style={{ background: 'var(--neutral-100)' }}></div>
                    <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--neutral-100)' }}></div>
                    <div className="h-3 rounded w-1/2" style={{ background: 'var(--neutral-100)' }}></div>
                  </div>
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="mb-4" style={{ color: 'var(--neutral-400)' }}>Nenhum torneio encontrado</p>
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
          <section className="py-16" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>
                Pronto para começar?
              </h2>
              <p className="mb-6" style={{ color: 'var(--neutral-400)' }}>
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
