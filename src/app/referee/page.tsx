"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

type User = { id: string; name: string; email: string; platformRole?: string; status?: string }
type Assignment = { id: string; tournament: { id: string; name: string; location?: string | null; city?: string | null; state?: string | null } }
type Invite = { id: string; tournament: { id: string; name: string }; sender: { name: string } }
type Court = {
  id: string
  name: string
  matches: { id: string; status: string; homePlayer: { name: string }; awayPlayer: { name: string }; referee?: { name: string } | null }[]
  categoryMatches: { id: string; status: string; homeTeam: { name: string }; awayTeam: { name: string }; category: { name: string }; referee?: { name: string } | null }[]
}
type FinishTarget = { id: string; kind: "category" | "tournament"; title: string } | null

export default function RefereePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState("")
  const [courts, setCourts] = useState<Court[]>([])
  const [message, setMessage] = useState("")
  const [finishTarget, setFinishTarget] = useState<FinishTarget>(null)
  const [scorePhoto, setScorePhoto] = useState("")
  const [sets, setSets] = useState([{ home: "", away: "" }, { home: "", away: "" }, { home: "", away: "" }])

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token])

  const loadCourts = useCallback(async (tournamentId: string) => {
    if (!headers) return
    const data = await fetch(`/api/referee/tournaments/${tournamentId}/courts`, { headers }).then(res => res.json())
    setCourts(data.courts || [])
  }, [headers])

  const load = useCallback(async () => {
    if (!headers) {
      router.push("/login")
      return
    }
    const me = await fetch("/api/auth/me", { headers }).then(res => res.json())
    setUser(me.user || null)
    const data = await fetch("/api/referee/tournaments", { headers }).then(res => res.json())
    setAssignments(data.assignments || [])
    setInvites(data.invites || [])
    const first = selectedTournamentId || data.assignments?.[0]?.tournament?.id || ""
    setSelectedTournamentId(first)
    if (first) await loadCourts(first)
  }, [headers, loadCourts, router, selectedTournamentId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const acceptInvite = async (invite: Invite) => {
    if (!headers) return
    const res = await fetch(`/api/tournaments/${invite.tournament.id}/referees/invites/${invite.id}/accept`, { method: "POST", headers })
    setMessage(res.ok ? "Convite aceito." : "Não foi possível aceitar o convite.")
    await load()
  }

  const startMatch = async (id: string, kind: "category" | "tournament") => {
    if (!headers) return
    const res = await fetch(`/api/referee/matches/${id}/start`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    })
    const data = await res.json().catch(() => ({}))
    setMessage(res.ok ? "Partida iniciada." : data.error || "Não foi possível iniciar a partida.")
    if (selectedTournamentId) await loadCourts(selectedTournamentId)
  }

  const uploadScorePhoto = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setScorePhoto(String(reader.result || ""))
    reader.readAsDataURL(file)
  }

  const finishMatch = async () => {
    if (!headers || !finishTarget) return
    const filledSets = sets.filter(set => set.home !== "" && set.away !== "")
    const payloadSets = filledSets.map(set => finishTarget.kind === "category"
      ? { homePoints: Number(set.home), awayPoints: Number(set.away) }
      : { homeGames: Number(set.home), awayGames: Number(set.away) })
    const res = await fetch(`/api/referee/matches/${finishTarget.id}/finish`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: finishTarget.kind, endPhotoUrl: scorePhoto, sets: payloadSets }),
    })
    const data = await res.json().catch(() => ({}))
    setMessage(res.ok ? "Partida finalizada." : data.error || "Não foi possível finalizar a partida.")
    if (res.ok) {
      setFinishTarget(null)
      setScorePhoto("")
      setSets([{ home: "", away: "" }, { home: "", away: "" }, { home: "", away: "" }])
    }
    if (selectedTournamentId) await loadCourts(selectedTournamentId)
  }

  if (!user) return <main className="min-h-screen" style={{ background: "var(--bg)" }} />

  return <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
    <Header user={user} />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Modo árbitro</h1>
          <p className="text-sm" style={{ color: "var(--neutral-500)" }}>Acompanhe quadras e inicie partidas liberadas para arbitragem.</p>
        </div>
        <Link href="/dashboard" className="btn-secondary text-sm">Voltar</Link>
      </div>
      {message && <p className="mb-4 rounded-lg border px-3 py-2 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--neutral-600)" }}>{message}</p>}
      {invites.length > 0 && <section className="mb-6 space-y-3">
        <h2 className="font-semibold" style={{ color: "var(--text)" }}>Convites pendentes</h2>
        {invites.map(invite => <Panel key={invite.id}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium" style={{ color: "var(--text)" }}>{invite.tournament.name}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>Convidado por {invite.sender.name}</p></div><button className="btn-primary text-sm" onClick={() => acceptInvite(invite)}>Aceitar convite</button></div></Panel>)}
      </section>}
      <section className="mb-5">
        <select value={selectedTournamentId} onChange={e => { setSelectedTournamentId(e.target.value); void loadCourts(e.target.value) }} className="rounded-lg border px-3 py-2 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
          {assignments.map(item => <option key={item.id} value={item.tournament.id}>{item.tournament.name}</option>)}
        </select>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courts.map(court => {
          const activeMatches = [...court.matches.map(match => ({ ...match, kind: "tournament" as const, title: `${match.homePlayer.name} x ${match.awayPlayer.name}`, subtitle: "Ranking" })), ...court.categoryMatches.map(match => ({ ...match, kind: "category" as const, title: `${match.homeTeam.name} x ${match.awayTeam.name}`, subtitle: match.category.name }))]
          return <Panel key={court.id}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: "var(--text)" }}>{court.name}</h3>
              <span className="text-xs" style={{ color: "var(--neutral-500)" }}>{activeMatches.length ? "Com jogo" : "Disponível"}</span>
            </div>
            {activeMatches.length ? <div className="space-y-3">{activeMatches.map(match => <div key={`${match.kind}-${match.id}`} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}><p className="text-sm font-medium" style={{ color: "var(--text)" }}>{match.title}</p><p className="text-xs" style={{ color: "var(--neutral-500)" }}>{match.subtitle} · {match.status}</p>{["scheduled", "awaiting_start"].includes(match.status) && <button className="btn-primary mt-3 w-full justify-center text-sm" onClick={() => startMatch(match.id, match.kind)}>Entrar e iniciar</button>}{match.status === "in_progress" && <button className="btn-secondary mt-3 w-full justify-center text-sm" onClick={() => setFinishTarget({ id: match.id, kind: match.kind, title: match.title })}>Finalizar com placar</button>}</div>)}</div> : <p className="text-sm" style={{ color: "var(--neutral-500)" }}>Sem jogo planejado nesta quadra.</p>}
          </Panel>
        })}
      </section>
      {finishTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Finalizar partida</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--neutral-500)" }}>{finishTarget.title}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Foto do placar</label>
              <input type="file" accept="image/*" capture="environment" onChange={e => uploadScorePhoto(e.target.files?.[0])} className="input" />
              {scorePhoto && <p className="mt-1 text-xs" style={{ color: "var(--neutral-500)" }}>Foto carregada.</p>}
            </div>
            {sets.map((set, index) => <div key={index} className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
              <span className="text-sm" style={{ color: "var(--neutral-500)" }}>Set {index + 1}</span>
              <input value={set.home} onChange={e => setSets(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, home: e.target.value } : item))} placeholder="Casa" type="number" className="input" />
              <input value={set.away} onChange={e => setSets(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, away: e.target.value } : item))} placeholder="Fora" type="number" className="input" />
            </div>)}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-secondary text-sm" onClick={() => setFinishTarget(null)}>Cancelar</button>
            <button className="btn-primary text-sm" onClick={finishMatch}>Finalizar</button>
          </div>
        </div>
      </div>}
    </main>
    <Footer />
  </div>
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>{children}</div>
}
