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
            {tab === "payments" && <Payments payments={payments} />}
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

function Payments({ payments }: { payments: Payment[] }) {
  return <div className="space-y-2">{payments.map(payment => <Panel key={payment.id}><div className="flex items-center justify-between gap-3"><div><p className="font-medium" style={{ color: "var(--text)" }}>{payment.user.name}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{payment.type} · {payment.status} · {payment.tournament?.name || "Sem torneio"}</p></div><p className="font-semibold" style={{ color: "var(--text)" }}>R$ {(payment.value / 100).toFixed(2)}</p></div></Panel>)}</div>
}

function Audit({ logs }: { logs: AuditLog[] }) {
  return <div className="space-y-2">{logs.map(log => <Panel key={log.id}><p className="font-medium" style={{ color: "var(--text)" }}>{log.action}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{log.user.name} · {log.entityType} · {new Date(log.createdAt).toLocaleString("pt-BR")}</p></Panel>)}</div>
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>{children}</div>
}
