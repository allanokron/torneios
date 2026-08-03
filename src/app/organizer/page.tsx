"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

type User = { id: string; name: string; email: string; avatarUrl?: string }
type Tournament = {
  id: string
  name: string
  sport: string
  status: string
  startDate: string
  _count?: { members: number; matches: number }
}
type OrganizerStatus = {
  canCreateTournament: boolean
  reason: string
  ownedTournaments: number
  subscription: { status: string; monthlyValue: number; plan?: { name: string } | null } | null
  availableCredit: { id: string; value: number; status: string } | null
}

export default function OrganizerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<OrganizerStatus | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<{ qrCode?: string; pixPayload?: string; value?: number } | null>(null)
  const [actionLoading, setActionLoading] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    Promise.all([
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch("/api/organizer/status", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch("/api/tournaments?mine=1", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
    ])
      .then(([auth, organizer, tournamentData]) => {
        if (!auth.user) {
          router.push("/login")
          return
        }
        setUser(auth.user)
        setStatus(organizer)
        setTournaments((tournamentData.tournaments || []).filter((tournament: Tournament & { owner?: { id: string } }) => tournament.owner?.id === auth.user.id))
      })
      .finally(() => setLoading(false))
  }, [router])

  const startSubscription = async () => {
    const token = localStorage.getItem("token")
    setActionLoading("subscription")
    try {
      const res = await fetch("/api/organizer/checkout/subscription", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } finally {
      setActionLoading("")
    }
  }

  const buyCredit = async () => {
    const token = localStorage.getItem("token")
    setActionLoading("credit")
    try {
      const res = await fetch("/api/organizer/checkout/tournament-credit", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()
      setPaymentInfo(data)
    } finally {
      setActionLoading("")
    }
  }

  if (!user) {
    return <div className="min-h-screen" style={{ background: "var(--bg)" }} />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Header user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Área do Organizador</h1>
            <p className="text-sm" style={{ color: "var(--neutral-500)" }}>Crie, configure e acompanhe os torneios que você organiza.</p>
          </div>
          {status?.canCreateTournament && (
            <Link href="/tournaments/new" className="btn-primary text-sm">Criar torneio</Link>
          )}
        </div>

        {!loading && !status?.canCreateTournament && (
          <div className="mb-6 rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Libere sua área de organizador</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--neutral-500)" }}>
              Assine o plano mensal para criar torneios ilimitados ou compre uma abertura avulsa para criar um torneio.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={startSubscription} disabled={actionLoading === "subscription"} className="btn-primary text-sm disabled:opacity-50">
                {actionLoading === "subscription" ? "Abrindo..." : "Assinar mensal"}
              </button>
              <button onClick={buyCredit} disabled={actionLoading === "credit"} className="btn-secondary text-sm disabled:opacity-50">
                {actionLoading === "credit" ? "Gerando PIX..." : "Comprar abertura avulsa"}
              </button>
            </div>
            {paymentInfo?.qrCode && (
              <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--neutral-50)" }}>
                <p className="mb-3 text-sm font-medium" style={{ color: "var(--text)" }}>PIX da abertura avulsa</p>
                <img src={`data:image/png;base64,${paymentInfo.qrCode}`} alt="QR Code PIX" className="h-40 w-40 rounded-lg bg-white p-2" />
                <textarea readOnly value={paymentInfo.pixPayload || ""} className="input mt-3 h-24 text-xs" />
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Torneios criados</h2>
            {status?.canCreateTournament && <span className="text-xs" style={{ color: "var(--neutral-500)" }}>{status.reason === "active_subscription" ? "Assinatura ativa" : "Crédito disponível"}</span>}
          </div>
          {tournaments.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--neutral-500)" }}>Nenhum torneio criado ainda.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                  <h3 className="font-medium" style={{ color: "var(--text)" }}>{tournament.name}</h3>
                  <p className="mt-1 text-xs" style={{ color: "var(--neutral-500)" }}>{tournament.status} · {tournament._count?.members || 0} participantes · {tournament._count?.matches || 0} jogos</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/tournaments/${tournament.id}`} className="btn-secondary text-xs">Gerenciar</Link>
                    <Link href={`/public/tournaments/${tournament.id}`} className="btn-secondary text-xs">Link público</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
