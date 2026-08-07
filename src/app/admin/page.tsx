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
  phone?: string | null
  city?: string | null
  state?: string | null
  gameLevel?: string | null
  dominantHand?: string | null
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
  _count: { members: number; matches: number; payments: number }
}
type Payment = {
  id: string
  type: string
  status: string
  value: number
  createdAt: string
  user: { name: string; email: string }
  tournament?: { name: string } | null
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
  { id: "create_tournament", label: "Criar Torneio" },
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
            <button key={item.id} onClick={() => setTab(item.id)} className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap" style={tab === item.id ? { background: "var(--accent)", color: "var(--primary)" } : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--neutral-600)" }}>
              {item.label}
            </button>
          ))}
        </div>
        {message && <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface)", color: "var(--neutral-600)", border: "1px solid var(--border)" }}>{message}</p>}

        {loading ? <Panel>Carregando...</Panel> : (
          <>
            {tab === "overview" && overview && <Overview stats={overview} />}
            {tab === "create_tournament" && <CreateTournament headers={headers} setMessage={setMessage} onCreated={() => { setTab("tournaments"); void loadAll() }} />}
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

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO"
]

const AVAILABLE_FORMATS = [
  { value: "points_ranking", label: "Ranking Pontos Diretos" },
  { value: "ranking_elimination", label: "Ranking com Mata-Mata" },
]

function CreateTournament({ headers, setMessage, onCreated }: { headers?: { Authorization: string }; setMessage: (msg: string) => void; onCreated: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [courts, setCourts] = useState<{ name: string; surfaceType: string; isCovered: boolean }[]>([])

  const [form, setForm] = useState({
    name: "",
    description: "",
    format: "points_ranking",
    location: "",
    address: "",
    city: "",
    state: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxParticipants: "",
    knockoutQualifiers: "",
    isPublic: true,
    inviteCode: "",
    setsPerMatch: 3,
    setsToWin: 2,
    hasTiebreak: true,
    tiebreakScore: 6,
    hasSuperTiebreak: true,
    superTiebreakScore: 10,
    defaultMatchDuration: 120,
    courtAssignmentMode: "manual",
    delayTolerance: 15,
    generalRules: "",
    woCriteria: "",
    scoringConfig: {
      winWithoutLosingSet: 3,
      winLosingOneSet: 2,
      lossWinningOneSet: 1,
      lossWithoutWinningSet: 0,
      winByWO: 3,
      lossByWO: 0,
      winByForfeit: 3,
      lossByForfeit: 0,
      withdrawalPenalty: -1,
      delayPenalty: -1,
    },
  })

  const totalSteps = 4

  const stepLabels = ["Informações", "Quadras", "Regras", "Pontuação"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleScoringChange = (field: string, value: number) => {
    setForm(prev => ({
      ...prev,
      scoringConfig: { ...prev.scoringConfig, [field]: value },
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      if (!headers) { router.push("/login"); return }

      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          format: form.format,
          knockoutQualifiers: form.format === "ranking_elimination" && form.knockoutQualifiers ? parseInt(form.knockoutQualifiers) : undefined,
          location: form.location || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          registrationDeadline: form.registrationDeadline || undefined,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
          isPublic: form.isPublic,
          inviteCode: form.inviteCode || undefined,
          setsPerMatch: parseInt(String(form.setsPerMatch)),
          setsToWin: parseInt(String(form.setsToWin)),
          hasTiebreak: form.hasTiebreak,
          tiebreakScore: parseInt(String(form.tiebreakScore)),
          hasSuperTiebreak: form.hasSuperTiebreak,
          superTiebreakScore: parseInt(String(form.superTiebreakScore)),
          defaultMatchDuration: parseInt(String(form.defaultMatchDuration)),
          courtAssignmentMode: form.courtAssignmentMode,
          delayTolerance: parseInt(String(form.delayTolerance)),
          generalRules: form.generalRules || undefined,
          woCriteria: form.woCriteria || undefined,
          scoringConfig: {
            winWithoutLosingSet: parseInt(String(form.scoringConfig.winWithoutLosingSet)),
            winLosingOneSet: parseInt(String(form.scoringConfig.winLosingOneSet)),
            lossWinningOneSet: parseInt(String(form.scoringConfig.lossWinningOneSet)),
            lossWithoutWinningSet: parseInt(String(form.scoringConfig.lossWithoutWinningSet)),
            winByWO: parseInt(String(form.scoringConfig.winByWO)),
            lossByWO: parseInt(String(form.scoringConfig.lossByWO)),
            winByForfeit: parseInt(String(form.scoringConfig.winByForfeit)),
            lossByForfeit: parseInt(String(form.scoringConfig.lossByForfeit)),
            withdrawalPenalty: parseInt(String(form.scoringConfig.withdrawalPenalty)),
            delayPenalty: parseInt(String(form.scoringConfig.delayPenalty)),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao criar torneio")
        return
      }

      const tournamentId = data.tournament.id

      for (const court of courts) {
        await fetch(`/api/tournaments/${tournamentId}/courts`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            ...court,
            surfaceType: court.surfaceType,
          }),
        })
      }

      setMessage("Torneio criado com sucesso!")
      onCreated()
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Panel>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Criar Torneio (Admin)</h3>
        <p className="text-sm mt-1" style={{ color: "var(--neutral-500)" }}>Crie torneios diretamente como administrador, sem necessidade de assinatura.</p>
      </Panel>

      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div key={s} className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={step >= s ? { background: "var(--accent)", color: "var(--primary)" } : { background: "var(--neutral-200)", color: "var(--neutral-600)" }}>{s}</div>
            {s < totalSteps && <div className="h-1 w-12 sm:w-16" style={{ background: step > s ? "var(--accent)" : "var(--neutral-200)" }} />}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs mb-6" style={{ color: "var(--neutral-400)" }}>
        {stepLabels.map(label => <span key={label}>{label}</span>)}
      </div>

      {error && <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>{error}</div>}

      {step === 1 && (
        <Panel>
          <div className="space-y-4">
            <div>
              <label className="label">Nome do Torneio *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="input" placeholder="Ex: Liga de Tênis 2026" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Formato do Torneio *</label>
                <select name="format" value={form.format} onChange={handleChange} className="input">
                  {AVAILABLE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              {form.format === "ranking_elimination" && (
                <div>
                  <label className="label">Classificados para o mata-mata</label>
                  <input type="number" name="knockoutQualifiers" min={2} value={form.knockoutQualifiers} onChange={handleChange} className="input" placeholder="Ex: 8" />
                </div>
              )}
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={2} placeholder="Descreva o torneio..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Local</label>
                <input type="text" name="location" value={form.location} onChange={handleChange} className="input" placeholder="Ex: CT de Tênis" />
              </div>
              <div>
                <label className="label">Endereço</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} className="input" placeholder="Rua, número" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Cidade</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} className="input" placeholder="Sua cidade" />
              </div>
              <div>
                <label className="label">Estado</label>
                <select name="state" value={form.state} onChange={handleChange} className="input">
                  <option value="">UF</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Data de Início *</label>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input" required />
              </div>
              <div>
                <label className="label">Data de Término</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Prazo Inscrições</label>
                <input type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={handleChange} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Máximo de Participantes</label>
                <input type="number" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} className="input" placeholder="Ilimitado" min="2" />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} className="w-4 h-4 rounded" style={{ accentColor: "var(--accent)" }} />
                  <span className="text-sm" style={{ color: "var(--neutral-600)" }}>Torneio Público</span>
                </label>
                {!form.isPublic && <input type="text" name="inviteCode" value={form.inviteCode} onChange={handleChange} className="input flex-1" placeholder="Código de convite" />}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {step === 2 && (
        <Panel>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium" style={{ color: "var(--text)" }}>Quadras</h4>
            <button onClick={() => setCourts(prev => [...prev, { name: `Quadra ${prev.length + 1}`, surfaceType: "", isCovered: false }])} className="btn-secondary text-sm">+ Adicionar Quadra</button>
          </div>
          {courts.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--neutral-400)" }}>Nenhuma quadra adicionada. Pular etapa ou adicionar quadras.</p>
          ) : (
            <div className="space-y-3">
              {courts.map((court, i) => (
                <div key={i} className="p-3 rounded-lg flex flex-col sm:flex-row gap-3 items-start" style={{ border: "1px solid var(--border)" }}>
                  <input type="text" value={court.name} onChange={e => setCourts(prev => prev.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))} className="input flex-1" placeholder="Nome da quadra" />
                  <select value={court.surfaceType} onChange={e => setCourts(prev => prev.map((c, idx) => idx === i ? { ...c, surfaceType: e.target.value } : c))} className="input">
                    <option value="">Tipo de piso</option>
                    <option value="hard">Quadra Dura</option>
                    <option value="clay">Saibro</option>
                    <option value="grass">Grama</option>
                    <option value="sand">Areia</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={court.isCovered} onChange={e => setCourts(prev => prev.map((c, idx) => idx === i ? { ...c, isCovered: e.target.checked } : c))} className="w-4 h-4" style={{ accentColor: "var(--accent)" }} /> Coberta</label>
                  <button onClick={() => setCourts(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-sm hover:text-red-700">Remover</button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {step === 3 && (
        <Panel>
          <div className="space-y-4">
            <h4 className="font-medium" style={{ color: "var(--text)" }}>Regras da Competição</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Sets por Partida</label>
                <select name="setsPerMatch" value={form.setsPerMatch} onChange={handleChange} className="input">
                  <option value={3}>Melhor de 3</option>
                  <option value={5}>Melhor de 5</option>
                </select>
              </div>
              <div>
                <label className="label">Sets para Vencer</label>
                <select name="setsToWin" value={form.setsToWin} onChange={handleChange} className="input">
                  <option value={1}>1 set</option>
                  <option value={2}>2 sets</option>
                </select>
              </div>
              <div>
                <label className="label">Duração Padrão (min)</label>
                <input type="number" name="defaultMatchDuration" value={form.defaultMatchDuration} onChange={handleChange} className="input" min="60" max="240" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" name="hasTiebreak" checked={form.hasTiebreak} onChange={handleChange} className="w-4 h-4 rounded" style={{ accentColor: "var(--accent)" }} />
                <span className="text-sm" style={{ color: "var(--neutral-600)" }}>Tiebreak</span>
              </div>
              {form.hasTiebreak && <div><label className="label">Placar do Tiebreak</label><input type="number" name="tiebreakScore" value={form.tiebreakScore} onChange={handleChange} className="input" min="5" max="10" /></div>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" name="hasSuperTiebreak" checked={form.hasSuperTiebreak} onChange={handleChange} className="w-4 h-4 rounded" style={{ accentColor: "var(--accent)" }} />
                <span className="text-sm" style={{ color: "var(--neutral-600)" }}>Super Tiebreak</span>
              </div>
              {form.hasSuperTiebreak && <div><label className="label">Pontos Super Tiebreak</label><input type="number" name="superTiebreakScore" value={form.superTiebreakScore} onChange={handleChange} className="input" min="7" max="15" /></div>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Tolerância para Atraso (min)</label>
                <input type="number" name="delayTolerance" value={form.delayTolerance} onChange={handleChange} className="input" min="5" max="60" />
              </div>
              <div>
                <label className="label">Distribuição de quadras</label>
                <select name="courtAssignmentMode" value={form.courtAssignmentMode} onChange={handleChange} className="input">
                  <option value="manual">Manual/agendamento</option>
                  <option value="automatic">Automático assistido</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Critérios de W.O.</label>
              <textarea name="woCriteria" value={form.woCriteria} onChange={handleChange} className="input" rows={2} placeholder="Descreva os critérios para W.O..." />
            </div>
            <div>
              <label className="label">Regras Gerais</label>
              <textarea name="generalRules" value={form.generalRules} onChange={handleChange} className="input" rows={2} placeholder="Regras adicionais do torneio..." />
            </div>
          </div>
        </Panel>
      )}

      {step === 4 && (
        <Panel>
          <div className="space-y-4">
            <h4 className="font-medium" style={{ color: "var(--text)" }}>Pontuação</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["winWithoutLosingSet", "Vitória sem perder sets"],
                ["winLosingOneSet", "Vitória perdendo um set"],
                ["lossWinningOneSet", "Derrota vencendo um set"],
                ["lossWithoutWinningSet", "Derrota sem vencer sets"],
                ["winByWO", "Vitória por W.O."],
                ["lossByWO", "Derrota por W.O."],
                ["winByForfeit", "Vitória por desistência"],
                ["lossByForfeit", "Derrota por desistência"],
                ["withdrawalPenalty", "Penalidade desistência"],
                ["delayPenalty", "Penalidade atraso"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="number" value={form.scoringConfig[key as keyof typeof form.scoringConfig]} onChange={e => handleScoringChange(key, parseInt(e.target.value) || 0)} className="input" />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <div className="flex justify-between">
        {step > 1 ? <button onClick={() => setStep(step - 1)} className="btn-secondary">Voltar</button> : <div />}
        {step < totalSteps ? (
          <button onClick={() => setStep(step + 1)} disabled={step === 1 && !form.name} className="btn-primary disabled:opacity-50">Próximo</button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">{loading ? "Criando..." : "Criar Torneio"}</button>
        )}
      </div>
    </div>
  )
}

function Users({ users, postAction, patchAction }: { users: User[]; postAction: (url: string, body?: Record<string, unknown>) => Promise<void>; patchAction: (url: string, body: Record<string, unknown>) => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", phone: "", city: "", state: "", gameLevel: "", dominantHand: "" })

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditForm({
      name: user.name || "",
      phone: user.phone || "",
      city: user.city || "",
      state: user.state || "",
      gameLevel: user.gameLevel || "",
      dominantHand: user.dominantHand || "",
    })
  }

  const saveEdit = async (userId: string) => {
    await patchAction(`/api/admin/users/${userId}`, editForm)
    setEditingId(null)
  }

  return (
    <div className="space-y-3">
      {users.map(user => (
        <Panel key={user.id}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex-1">
                {editingId === user.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="input text-sm" placeholder="Nome" />
                    <input type="text" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="input text-sm" placeholder="Telefone" />
                    <input type="text" value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} className="input text-sm" placeholder="Cidade" />
                    <select value={editForm.state} onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))} className="input text-sm">
                      <option value="">Estado</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={editForm.gameLevel} onChange={e => setEditForm(p => ({ ...p, gameLevel: e.target.value }))} className="input text-sm">
                      <option value="">Nível</option>
                      <option value="estreante">Estreante</option>
                      <option value="iniciante">Iniciante</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="avancado">Avançado</option>
                      <option value="open">Open</option>
                    </select>
                    <select value={editForm.dominantHand} onChange={e => setEditForm(p => ({ ...p, dominantHand: e.target.value }))} className="input text-sm">
                      <option value="">Mão</option>
                      <option value="destro">Destro</option>
                      <option value="canhoto">Canhoto</option>
                      <option value="ambidestro">Ambidestro</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <p className="font-medium" style={{ color: "var(--text)" }}>{user.name}</p>
                    <p className="text-sm" style={{ color: "var(--neutral-500)" }}>{user.email} · {user.platformRole} · {user.status}</p>
                    <p className="text-xs" style={{ color: "var(--neutral-400)" }}>
                      {user.phone && `${user.phone} · `}{user.city && `${user.city}`}{user.state && `/${user.state}`} · {user._count?.ownedTournaments || 0} torneios · {user.organizerCredits?.filter(c => c.status === "AVAILABLE").length || 0} créditos · {user.manualOrganizerAccess?.enabled ? "Organizador manual" : "Sem liberação"}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {editingId === user.id ? (
                  <>
                    <button className="btn-primary text-xs" onClick={() => saveEdit(user.id)}>Salvar</button>
                    <button className="btn-secondary text-xs" onClick={() => setEditingId(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className="btn-secondary text-xs" onClick={() => startEdit(user)}>Editar</button>
                    <button className="btn-secondary text-xs" onClick={() => patchAction(`/api/admin/users/${user.id}`, { platformRole: user.platformRole === "USER" ? "ADMIN" : "USER" })}>{user.platformRole === "USER" ? "Promover admin" : "Remover admin"}</button>
                    <button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/users/${user.id}/organizer-access`, { action: user.manualOrganizerAccess?.enabled ? "disable_manual" : "enable_manual" })}>{user.manualOrganizerAccess?.enabled ? "Remover organizador" : "Liberar ilimitado"}</button>
                    <button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/users/${user.id}/organizer-access`, { action: "add_credit", quantity: 1 })}>+1 crédito</button>
                    <button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/users/${user.id}/${user.status === "DISABLED" ? "enable" : "disable"}`)}>{user.status === "DISABLED" ? "Reativar" : "Desativar"}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  )
}

function Tournaments({ tournaments, postAction, patchAction }: { tournaments: Tournament[]; postAction: (url: string, body?: Record<string, unknown>) => Promise<void>; patchAction: (url: string, body: Record<string, unknown>) => Promise<void> }) {
  return <div className="space-y-3">{tournaments.map(tournament => <Panel key={tournament.id}><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-medium" style={{ color: "var(--text)" }}>{tournament.name}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{tournament.owner.name} · {tournament.status} · {tournament.visibilityStatus}</p><p className="text-xs" style={{ color: "var(--neutral-400)" }}>{tournament._count.members} participantes · {tournament._count.matches} jogos</p></div><div className="flex flex-wrap gap-2"><Link className="btn-secondary text-xs" href={`/tournaments/${tournament.id}`}>Gerenciar</Link><button className="btn-secondary text-xs" onClick={() => patchAction(`/api/admin/tournaments/${tournament.id}`, { status: tournament.status === "finished" ? "in_progress" : "finished" })}>Alternar status</button><button className="btn-secondary text-xs" onClick={() => postAction(`/api/admin/tournaments/${tournament.id}/${tournament.visibilityStatus === "DISABLED" ? "enable" : "disable"}`)}>{tournament.visibilityStatus === "DISABLED" ? "Reativar" : "Desativar"}</button></div></div></Panel>)}</div>
}

function Payments({ payments, tournaments, headers }: { payments: Payment[]; tournaments: Tournament[]; headers?: { Authorization: string } }) {
  const [mode, setMode] = useState<"organizers" | "athletes">("organizers")
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id || "")
  const [detail, setDetail] = useState<null | {
    name: string
    members: { id: string; paymentStatus?: string | null; amountPaid?: number | null; user: { name: string; email: string } }[]
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
      </div>}
    </div>}
  </div>
}

function PaymentRow({ payment }: { payment: Payment }) {
  return <Panel><div className="flex items-center justify-between gap-3"><div><p className="font-medium" style={{ color: "var(--text)" }}>{payment.user.name}</p><p className="text-sm" style={{ color: "var(--neutral-500)" }}>{payment.type} · {payment.status} · {payment.tournament?.name || "Sem torneio"}</p></div><p className="font-semibold" style={{ color: "var(--text)" }}>R$ {(payment.value / 100).toFixed(2)}</p></div></Panel>
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
