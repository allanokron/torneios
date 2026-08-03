"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

type User = {
  id: string
  name: string
  email: string
  platformRole: string
  status: string
  manualOrganizerAccess?: { enabled: boolean } | null
  organizerCredits?: { status: string }[]
  _count?: { ownedTournaments: number; memberships: number; payments: number }
}
type Tournament = {
  id: string
  name: string
  status: string
  visibilityStatus: string
  owner: { name: string; email: string }
  _count: { members: number; matches: number; categories: number; payments: number }
}
type Payment = {
  id: string
  type: string
  status: string
  value: number
  createdAt: string
  user: { name: string; email: string }
  tournament?: { name: string } | null
  category?: { name: string } | null
  team?: { name: string } | null
  teamMember?: { name?: string | null; email?: string | null; paymentStatus?: string | null } | null
}
type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId?: string | null
  createdAt: string
  user: { name: string; email: string }
  tournament?: { name: string } | null
}

const tabs = [
  { id: "overview", label: "Visão geral" },
  { id: "users", label: "Usuários" },
  { id: "tournaments", label: "Torneios" },
  { id: "payments", label: "Pagamentos" },
  { id: "audit", label: "Auditoria" },
]

export default function AdminPage() {
  const router = useRouter()
  const [me, setMe] = useState<User | null>(null)
  const [tab, setTab] = useState("overview")
  const [overview, setOverview] = useState<Record<string, number> | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token])

  const loadAll = async () => {
    if (!headers) {
      router.push("/login")
      return
    }

    setLoading(true)
    const auth = await fetch("/api/auth/me", { headers }).then(res => res.json())
    if (!auth.user || !["ADMIN", "OWNER"].includes(auth.user.platformRole)) {
      router.push("/dashboard")
      return
    }
    setMe(auth.user)

    const [overviewData, usersData, tournamentsData, paymentsData, auditData] = await Promise.all([
      fetch("/api/admin/overview", { headers }).then(res => res.json()),
      fetch("/api/admin/users", { headers }).then(res => res.json()),
      fetch("/api/admin/tournaments", { headers }).then(res => res.json()),
      fetch("/api/admin/payments", { headers }).then(res => res.json()),
      fetch("/api/admin/audit", { headers }).then(res => res.json()),
    ])
    setOverview(overviewData.stats || null)
    setUsers(usersData.users || [])
    setTournaments(tournamentsData.tournaments || [])
    setPayments(paymentsData.payments || [])
    setAudit(auditData.logs || [])
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const postAction = async (url: string, body?: Record<string, unknown>) => {
    if (!headers) return
    setMessage("")
    const res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    })
    const data = await res.json().catch(() => ({}))
    setMessage(res.ok ? "Ação executada com sucesso." : data.error || "Erro ao executar ação.")
    await loadAll()
  }

  const patchAction = async (url: string, body: Record<string, unknown>) => {
    if (!headers) return
    setMessage("")
    const res = await fetch(url, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setMessage(res.ok ? "Registro atualizado com sucesso." : data.error || "Erro ao atualizar.")
    await loadAll()
  }

  if (!me) {
    return <div className="min-h-screen" style={{ background: "var(--bg)" }} />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Header user={me} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Admin Torneio+</h1>
          <p className="text-sm" style={{ color: "var(--neutral-500)" }}>Monitoramento e controle geral da plataforma.</p>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto">
          {tabs.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className="rounded-lg px-3 py-2 text-sm font-medium" style={tab === item.id ? { background: "var(--accent)", color: "var(--primary)" } : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--neutral-600)" }}>
              {item.label}
            </button>
          ))}
        </div>
        {message && <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface)", color: "var(--neutral-600)", border: "1px solid var(--border)" }}>{message}</p>}

        {loading ? <Panel>Carregando...</Panel> : (
          <>
            {tab === "overview" && overview && <Overview stats={overview} />}
            {tab === "users" && <Users users={users} postAction={postAction} patchAction={patchAction} />}
            {tab === "tournaments" && <Tournaments tournaments={tournaments} postAction={postAction} patchAction={patchAction} />}
            {tab === "payments" && <Payments payments={payments} tournaments={tournaments} headers={headers} />}
            {tab === "audit" && <Audit logs={audit} />}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

function Overview({ stats }: { stats: Record<string, number> }) {
  const cards = [
    ["Usuários", stats.totalUsers],
    ["Ativos", stats.activeUsers],
    ["Desativados", stats.disabledUsers],
    ["Torneios", stats.totalTournaments],
    ["Torneios ativos", stats.activeTournaments],
    ["Organizadores manuais", stats.manualOrganizers],
    ["Assinaturas ativas", stats.activeSubscriptions],
    ["Créditos disponíveis", stats.availableCredits],
    ["Pagamentos pagos", stats.paidPayments],
    ["Pagamentos pendentes", stats.pendingPayments],
  ]
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label, value]) => <Panel key={label as string}><p className="text-xs" style={{ color: "var(--neutral-500)" }}>{label}</p><p className="mt-2 text-2xl font-semibold" style={{ color: "var(--text)" }}>{value}</p></Panel>)}</div>
}

function Users({ users, postAction, patchAction }: { users: User[]; postAction: (url: string, body?: Record<string, unknown>) => Promise<void>; patchAction: (url: string, body: Record<string, unknown>) => Promise<void> }) {
  return <div className="space-y-3">{users.map(user => <Panel key={user.id}><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-medium" style={{ color: "var(--text)" }}>{user.name}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{user.email} · {user.platformRole} · {user.status}</p><p className="text-xs" style={{ color: "var(--neutral-400)" }}>{user._count?.ownedTournaments || 0} torneios · {user.organizerCredits?.filter(c => c.status === "AVAILABLE").length || 0} créditos · {user.manualOrganizerAccess?.enabled ? "Organizador manual" : "Sem liberação manual"}</p></div><div className="flex flex-wrap gap-2"><button className="btn-secondary text-xs" onClick={() => patchAction(`/api/admin/users/${user.id}`, { platformRole: user.platformRole === "USER" ? "ADMIN" : "USER" })}>{user.platformRole === "USER" ? "Promover admin" : "Remover admin"}</button><button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/users/${user.id}/organizer-access`, { action: user.manualOrganizerAccess?.enabled ? "disable_manual" : "enable_manual" })}>{user.manualOrganizerAccess?.enabled ? "Remover organizador" : "Liberar ilimitado"}</button><button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/users/${user.id}/organizer-access`, { action: "add_credit", quantity: 1 })}>+1 crédito</button><button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/users/${user.id}/${user.status === "DISABLED" ? "enable" : "disable"}`)}>{user.status === "DISABLED" ? "Reativar" : "Desativar"}</button></div></div></Panel>)}</div>
}

function Tournaments({ tournaments, postAction, patchAction }: { tournaments: Tournament[]; postAction: (url: string, body?: Record<string, unknown>) => Promise<void>; patchAction: (url: string, body: Record<string, unknown>) => Promise<void> }) {
  return <div className="space-y-3">{tournaments.map(tournament => <Panel key={tournament.id}><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-medium" style={{ color: "var(--text)" }}>{tournament.name}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{tournament.owner.name} · {tournament.status} · {tournament.visibilityStatus}</p><p className="text-xs" style={{ color: "var(--neutral-400)" }}>{tournament._count.members} participantes · {tournament._count.matches} jogos · {tournament._count.categories} categorias</p></div><div className="flex flex-wrap gap-2"><Link className="btn-secondary text-xs" href={`/tournaments/${tournament.id}`}>Gerenciar</Link><Link className="btn-secondary text-xs" href={`/public/tournaments/${tournament.id}`}>Público</Link><button className="btn-secondary text-xs" onClick={() => patchAction(`/api/admin/tournaments/${tournament.id}`, { status: tournament.status === "finished" ? "in_progress" : "finished" })}>Alternar status</button><button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/tournaments/${tournament.id}/${tournament.visibilityStatus === "DISABLED" ? "enable" : "disable"}`)}>{tournament.visibilityStatus === "DISABLED" ? "Reativar" : "Desativar"}</button></div></div></Panel>)}</div>
}

function Payments({ payments, tournaments, headers }: { payments: Payment[]; tournaments: Tournament[]; headers?: { Authorization: string } }) {
  const [mode, setMode] = useState<"organizers" | "athletes">("organizers")
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id || "")
  const [detail, setDetail] = useState<null | {
    name: string
    members: { id: string; paymentStatus?: string | null; amountPaid?: number | null; user: { name: string; email: string } }[]
    categories: { id: string; name: string; teams: { id: string; name: string; members: { id: string; name?: string | null; email?: string | null; paymentStatus?: string | null; amountPaid?: number | null; user?: { name: string; email: string } | null }[] }[] }[]
  }>(null)

  const organizerPayments = payments.filter(payment => payment.type === "SUBSCRIPTION" || payment.type === "TOURNAMENT_EXTRA")
  const athletePayments = payments.filter(payment => payment.type === "REGISTRATION")

  useEffect(() => {
    if (mode !== "athletes" || !selectedTournamentId || !headers) return
    fetch(`/api/admin/tournaments/${selectedTournamentId}/athlete-payments`, { headers })
      .then(res => res.json())
      .then(data => setDetail(data.tournament || null))
      .catch(() => setDetail(null))
  }, [headers, mode, selectedTournamentId])

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <button className="rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setMode("organizers")} style={mode === "organizers" ? { background: "var(--accent)", color: "var(--primary)" } : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--neutral-600)" }}>Organizadores</button>
      <button className="rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setMode("athletes")} style={mode === "athletes" ? { background: "var(--accent)", color: "var(--primary)" } : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--neutral-600)" }}>Atletas por torneio</button>
    </div>
    {mode === "organizers" && <div className="space-y-2">{organizerPayments.map(payment => <PaymentRow key={payment.id} payment={payment} />)}</div>}
    {mode === "athletes" && <div className="space-y-4">
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium" style={{ color: "var(--text)" }}>Pagamentos de atletas</p>
            <p className="text-sm" style={{ color: "var(--neutral-500)" }}>{athletePayments.length} pagamentos de inscrição registrados na plataforma.</p>
          </div>
          <select value={selectedTournamentId} onChange={e => setSelectedTournamentId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
            {tournaments.map(tournament => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}
          </select>
        </div>
      </Panel>
      {detail && <div className="space-y-3">
        <Panel>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{detail.name}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {detail.members.map(member => <PaymentStatusCard key={member.id} name={member.user.name} email={member.user.email} status={member.paymentStatus || "NONE"} amount={member.amountPaid} />)}
          </div>
        </Panel>
        {detail.categories.map(category => <Panel key={category.id}>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{category.name}</p>
          <div className="mt-3 space-y-3">{category.teams.map(team => <div key={team.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}><p className="text-sm font-medium" style={{ color: "var(--text)" }}>{team.name}</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{team.members.map(member => <PaymentStatusCard key={member.id} name={member.user?.name || member.name || "Atleta"} email={member.user?.email || member.email || ""} status={member.paymentStatus || "NONE"} amount={member.amountPaid} />)}</div></div>)}</div>
        </Panel>)}
      </div>}
    </div>}
  </div>
}

function PaymentRow({ payment }: { payment: Payment }) {
  return <Panel><div className="flex items-center justify-between gap-3"><div><p className="font-medium" style={{ color: "var(--text)" }}>{payment.user.name}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{payment.type} · {payment.status} · {payment.tournament?.name || payment.category?.name || "Sem torneio"}</p></div><p className="font-semibold" style={{ color: "var(--text)" }}>R$ {(payment.value / 100).toFixed(2)}</p></div></Panel>
}

function PaymentStatusCard({ name, email, status, amount }: { name: string; email: string; status: string; amount?: number | null }) {
  return <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--neutral-50)" }}><p className="font-medium" style={{ color: "var(--text)" }}>{name}</p><p className="text-xs" style={{ color: "var(--neutral-500)" }}>{email}</p><p className="mt-2 text-xs font-semibold" style={{ color: "var(--neutral-600)" }}>{status}{amount ? ` · R$ ${(amount / 100).toFixed(2)}` : ""}</p></div>
}

function Audit({ logs }: { logs: AuditLog[] }) {
  return <div className="space-y-2">{logs.map(log => <Panel key={log.id}><p className="font-medium" style={{ color: "var(--text)" }}>{log.action}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{log.user.name} · {log.entityType} · {new Date(log.createdAt).toLocaleString("pt-BR")}</p></Panel>)}</div>
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>{children}</div>
}
