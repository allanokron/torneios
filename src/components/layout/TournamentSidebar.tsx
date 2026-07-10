"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface TournamentSidebarProps {
  tournamentId: string
  activeTab: string
}

export default function TournamentSidebar({ tournamentId, activeTab }: TournamentSidebarProps) {
  const pathname = usePathname()
  
  const tabs = [
    { id: "overview", label: "Visão Geral", icon: "📊" },
    { id: "matches", label: "Confrontos", icon: "⚔️" },
    { id: "ranking", label: "Ranking", icon: "🏆" },
    { id: "participants", label: "Participantes", icon: "👥" },
    { id: "courts", label: "Quadras", icon: "🎾" },
    { id: "rules", label: "Regras", icon: "📋" },
    { id: "chat", label: "Conversas", icon: "💬" },
    { id: "settings", label: "Configurações", icon: "⚙️" },
  ]

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      {/* Tournament Info Card */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[var(--court-green)] rounded-xl flex items-center justify-center court-lines">
            <span className="text-white text-2xl">🎾</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">Liga de Tênis 2026</h3>
            <p className="text-xs text-gray-500">Todos contra todos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="status-badge status-in_progress">
            Em Andamento
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="card p-2">
        <ul className="space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <li key={tab.id}>
                <Link
                  href={`/tournaments/${tournamentId}?tab=${tab.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--court-green)] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Quick Stats */}
      <div className="card mt-4">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Estatísticas Rápidas</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Partidas</span>
            <span className="font-bold text-[var(--court-green)]">28</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Finalizadas</span>
            <span className="font-bold text-green-600">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Agendadas</span>
            <span className="font-bold text-blue-600">8</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Pendentes</span>
            <span className="font-bold text-amber-600">8</span>
          </div>
        </div>
      </div>

      {/* Court Status */}
      <div className="card mt-4">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Status das Quadras</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Quadra 1 - Livre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Quadra 2 - Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Quadra 3 - Livre</span>
          </div>
        </div>
      </div>
    </aside>
  )
}