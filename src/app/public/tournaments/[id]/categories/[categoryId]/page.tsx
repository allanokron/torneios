"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CATEGORY_FORMATS, getCategoryLabel } from "@/lib/category-config"

type PublicCategory = {
  id: string
  tournamentId: string
  name: string
  format: string
  status: string
  tournament: { id: string; name: string; startDate: string; location?: string | null; city?: string | null; state?: string | null }
  groups: { id: string; name: string; entries: { team: { id: string; name: string } }[] }[]
  standings: { id: string; position: number; series: string | null; points: number; wins: number; losses: number; setsWon: number; setsLost: number; team: { id: string; name: string } }[]
  matches: { id: string; phase: string; status: string; round: string | null; position: number | null; homeScore: number | null; awayScore: number | null; winnerTeamId: string | null; homeTeam: { id: string; name: string }; awayTeam: { id: string; name: string } }[]
  bracketMatches: { id: string; round: number; position: number; roundName: string; status: string; series: string | null; bracketSide: string | null; homeSeed: number | null; awaySeed: number | null; homeTeam?: { name: string } | null; awayTeam?: { name: string } | null; winnerTeam?: { name: string } | null; homeSourceLabel: string | null; awaySourceLabel: string | null }[]
}

const tabs = [
  { id: "groups", label: "Grupos" },
  { id: "matches", label: "Jogos" },
  { id: "bracket", label: "Mata-Mata" },
  { id: "ranking", label: "Ranking" },
]

export default function PublicCategoryPage({ params }: { params: Promise<{ id: string; categoryId: string }> }) {
  const [ids, setIds] = useState<{ id: string; categoryId: string } | null>(null)
  const [category, setCategory] = useState<PublicCategory | null>(null)
  const [activeTab, setActiveTab] = useState("groups")

  useEffect(() => {
    params.then(setIds)
  }, [params])

  useEffect(() => {
    if (!ids) return
    fetch(`/api/public/tournaments/${ids.id}/categories/${ids.categoryId}`)
      .then(res => res.json())
      .then(data => setCategory(data.category || null))
      .catch(() => setCategory(null))
  }, [ids])

  const podium = useMemo(() => {
    if (category?.status !== "finished") return []
    return category.standings.slice(0, 3)
  }, [category])

  if (!category) {
    return <main className="min-h-screen p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>Carregando categoria...</main>
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link href={`/public/tournaments/${category.tournament.id}`} className="text-sm" style={{ color: "var(--accent-dark)" }}>
            Voltar ao torneio
          </Link>
          <h1 className="mt-3 text-2xl font-semibold" style={{ color: "var(--text)" }}>{category.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--neutral-500)" }}>
            {category.tournament.name} · {getCategoryLabel(CATEGORY_FORMATS, category.format)}
          </p>

          {podium.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {podium.map((row, index) => (
                <div key={row.id} className="rounded-xl border p-4 text-center" style={{ background: "var(--neutral-50)", borderColor: "var(--border)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--neutral-500)" }}>{index + 1}º lugar</p>
                  <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>{row.team.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={activeTab === tab.id ? { background: "var(--accent)", color: "var(--primary)" } : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--neutral-600)" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "groups" && <Groups groups={category.groups} />}
        {activeTab === "matches" && <Matches matches={category.matches} />}
        {activeTab === "bracket" && <Bracket matches={category.bracketMatches} format={category.format} />}
        {activeTab === "ranking" && <Ranking standings={category.standings.filter(row => row.series === "main" || row.series === null)} />}
      </section>
    </main>
  )
}

function Groups({ groups }: { groups: PublicCategory["groups"] }) {
  if (!groups.length) return <Empty text="Nenhum grupo gerado ainda." />
  return <div className="grid gap-4 md:grid-cols-2">{groups.map(group => <div key={group.id} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><h3 className="font-semibold" style={{ color: "var(--text)" }}>{group.name}</h3><div className="mt-3 space-y-2">{group.entries.map(entry => <p key={entry.team.id} className="text-sm" style={{ color: "var(--neutral-600)" }}>{entry.team.name}</p>)}</div></div>)}</div>
}

function Matches({ matches }: { matches: PublicCategory["matches"] }) {
  if (!matches.length) return <Empty text="Nenhum jogo gerado ainda." />
  return <div className="space-y-2">{matches.map(match => <div key={match.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><span style={{ color: "var(--text)" }}>{match.homeTeam.name} x {match.awayTeam.name}</span><span style={{ color: "var(--neutral-500)" }}>{match.status}{match.homeScore !== null ? ` · ${match.homeScore}-${match.awayScore}` : ""}</span></div>)}</div>
}

function Ranking({ standings }: { standings: PublicCategory["standings"] }) {
  if (!standings.length) return <Empty text="Ranking ainda não disponível." />
  return <div className="overflow-x-auto rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><table className="w-full min-w-[560px] text-sm"><thead style={{ color: "var(--neutral-500)" }}><tr className="text-left"><th className="p-3">#</th><th>Equipe</th><th>Pts</th><th>V</th><th>D</th><th>Sets</th></tr></thead><tbody>{standings.map(row => <tr key={row.id} className="border-t" style={{ borderColor: "var(--border)", color: "var(--text)" }}><td className="p-3">{row.position}</td><td>{row.team.name}</td><td>{row.points}</td><td>{row.wins}</td><td>{row.losses}</td><td>{row.setsWon}-{row.setsLost}</td></tr>)}</tbody></table></div>
}

function Bracket({ matches, format }: { matches: PublicCategory["bracketMatches"]; format: string }) {
  if (!matches.length) return <Empty text="Mata-mata ainda não gerado." />
  const groups = Array.from(new Set(matches.map(match => format === "double_elimination" ? match.bracketSide || "main" : match.series || "main")))
  return <div className="space-y-5">{groups.map(group => <div key={group}><h3 className="mb-3 font-semibold" style={{ color: "var(--text)" }}>{getBracketGroupLabel(group, format)}</h3><div className="flex gap-3 overflow-x-auto pb-2">{Array.from(new Set(matches.filter(match => (format === "double_elimination" ? match.bracketSide || "main" : match.series || "main") === group).map(match => match.round))).map(round => { const roundMatches = matches.filter(match => (format === "double_elimination" ? match.bracketSide || "main" : match.series || "main") === group && match.round === round); return <div key={`${group}-${round}`} className="min-w-[230px]"><p className="mb-2 text-xs font-semibold uppercase" style={{ color: "var(--neutral-500)" }}>{roundMatches[0]?.roundName}</p><div className="space-y-3">{roundMatches.map(match => <div key={match.id} className="rounded-xl border p-3 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p style={{ color: "var(--text)" }}>{match.homeSeed ? `${match.homeSeed}. ` : ""}{match.homeTeam?.name || match.homeSourceLabel || "A definir"}</p><p className="my-1 text-xs" style={{ color: "var(--neutral-400)" }}>x</p><p style={{ color: "var(--text)" }}>{match.awaySeed ? `${match.awaySeed}. ` : ""}{match.awayTeam?.name || match.awaySourceLabel || "A definir"}</p><p className="mt-2 text-xs" style={{ color: "var(--neutral-500)" }}>{match.winnerTeam?.name ? `Vencedor: ${match.winnerTeam.name}` : match.status}</p></div>)}</div></div>})}</div></div>)}</div>
}

function getBracketGroupLabel(group: string, format: string) {
  if (format === "double_elimination") {
    if (group === "winners") return "Chave dos Vencedores"
    if (group === "losers") return "Chave dos Perdedores"
  }
  if (group === "gold") return "Série Ouro"
  if (group === "silver") return "Série Prata"
  return "Chave Principal"
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{text}</p></div>
}
