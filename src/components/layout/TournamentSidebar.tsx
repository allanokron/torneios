"use client"

import Link from "next/link"

interface TournamentSidebarProps {
  tournamentId: string
  activeTab: string
  isOwner?: boolean
  showKnockout?: boolean
}

export default function TournamentSidebar({ tournamentId, activeTab, isOwner = false, showKnockout = false }: TournamentSidebarProps) {
  const tabs = [
    { id: "overview", label: "Visão Geral", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { id: "drawn", label: "Jogos Sorteados", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { id: "matches", label: "Confrontos", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "my-matches", label: "Meus Jogos", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "ranking", label: "Ranking", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    ...(showKnockout ? [{ id: "knockout", label: "Mata-Mata", icon: "M7 7h10M7 12h6m-6 5h10M4 7h.01M4 12h.01M4 17h.01M20 7h.01M16 12h4m0 5h.01" }] : []),
    { id: "participants", label: "Participantes", icon: "M12 4.354a4 4 0 110 7.292 4 4 0 010-7.292zM15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "courts", label: "Quadras", icon: "M4 4h16v16H4V4zm0 8h16M9 4v16M15 4v16" },
    { id: "rules", label: "Regras", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ...(isOwner ? [{ id: "settings", label: "Configurações", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }] : []),
  ]

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <nav
        className="rounded-2xl p-2"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <ul className="space-y-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <li key={tab.id}>
                <Link
                  href={`/tournaments/${tournamentId}?tab=${tab.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={isActive ? {
                    background: 'rgba(184, 224, 0, 0.1)',
                    color: 'var(--accent-dark)',
                  } : {
                    color: 'var(--neutral-500)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--neutral-50)';
                      e.currentTarget.style.color = 'var(--neutral-700)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '';
                      e.currentTarget.style.color = 'var(--neutral-500)';
                    }
                  }}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--neutral-400)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
