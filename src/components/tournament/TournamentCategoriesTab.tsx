"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CATEGORY_FORMATS,
  CATEGORY_GENDERS,
  CATEGORY_LEVELS,
  CATEGORY_SPORTS,
  CATEGORY_TEAM_SIZES,
  ODD_GROUP_POLICIES,
  getCategoryLabel,
} from "@/lib/category-config"

type Category = {
  id: string
  name: string
  sport: string
  gender: string
  teamSize: string
  level: string
  format: string
  status: string
  enableSilverSeries: boolean
  paymentMode: string
  registrationFee: number | null
  groupSize: number | null
  goldQualifiersPerGroup: number | null
  silverQualifiersPerGroup: number | null
  goldQualifiersTotal: number | null
  silverQualifiersTotal: number | null
  setsPerMatch: number
  normalSetPoints: number
  tiebreakSetPoints: number
  minPointDifference: number
  _count?: {
    teams: number
    groups: number
    matches: number
    bracketMatches: number
  }
}

type FormState = {
  name: string
  sport: string
  gender: string
  teamSize: string
  level: string
  format: string
  enableSilverSeries: boolean
  paymentMode: string
  registrationFee: string
  groupSize: string
  goldQualifiersPerGroup: string
  silverQualifiersPerGroup: string
  goldQualifiersTotal: string
  silverQualifiersTotal: string
  oddGroupPolicy: string
  setsPerMatch: string
  normalSetPoints: string
  tiebreakSetPoints: string
  minPointDifference: string
}

const defaultForm: FormState = {
  name: "",
  sport: "beach_volley",
  gender: "male",
  teamSize: "double",
  level: "open",
  format: "group_ranking_knockout",
  enableSilverSeries: false,
  paymentMode: "manual",
  registrationFee: "",
  groupSize: "4",
  goldQualifiersPerGroup: "2",
  silverQualifiersPerGroup: "",
  goldQualifiersTotal: "",
  silverQualifiersTotal: "",
  oddGroupPolicy: "ranking_byes",
  setsPerMatch: "3",
  normalSetPoints: "21",
  tiebreakSetPoints: "15",
  minPointDifference: "2",
}

export default function TournamentCategoriesTab({
  tournamentId,
  isOwner,
}: {
  tournamentId: string
  isOwner: boolean
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState<FormState>(defaultForm)

  const hasGroupPhase = form.format === "group_ranking_knockout" || form.format === "group_knockout"
  const hasRankingTotals = form.format === "ranking_knockout" || form.format === "group_ranking_knockout"

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tournaments/${tournamentId}/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      setError("Erro ao carregar categorias")
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCategories()
  }, [fetchCategories])

  const updateForm = (field: keyof FormState, value: string | boolean) => {
    setForm(current => ({ ...current, [field]: value }))
    setError("")
    setSuccess("")
  }

  const createCategory = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const token = localStorage.getItem("token")
      const registrationFee = form.registrationFee
        ? Math.round(Number(form.registrationFee.replace(",", ".")) * 100)
        : null

      const res = await fetch(`/api/tournaments/${tournamentId}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          registrationFee,
          groupSize: hasGroupPhase ? form.groupSize : null,
          goldQualifiersPerGroup: hasGroupPhase ? form.goldQualifiersPerGroup : null,
          silverQualifiersPerGroup: hasGroupPhase && form.enableSilverSeries ? form.silverQualifiersPerGroup : null,
          goldQualifiersTotal: hasRankingTotals ? form.goldQualifiersTotal : null,
          silverQualifiersTotal: hasRankingTotals && form.enableSilverSeries ? form.silverQualifiersTotal : null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar categoria")
        return
      }

      setSuccess("Categoria criada com sucesso")
      setForm(defaultForm)
      setShowForm(false)
      void fetchCategories()
    } catch {
      setError("Erro de conexão")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>Categorias e modalidades</h3>
            <p className="text-sm" style={{ color: "var(--neutral-500)" }}>
              Organize disputas como Masculino Open, Feminino Iniciante ou Misto Intermediário dentro do mesmo torneio.
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowForm(open => !open)}
              className="btn-primary text-sm"
            >
              {showForm ? "Fechar" : "Nova categoria"}
            </button>
          )}
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        {showForm && isOwner && (
          <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--neutral-50)" }}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="label">Nome opcional</label>
                <input className="input" value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Ex: Masculino Open" />
              </div>
              <SelectField label="Esporte" value={form.sport} options={CATEGORY_SPORTS} onChange={value => updateForm("sport", value)} />
              <SelectField label="Formato" value={form.format} options={CATEGORY_FORMATS} onChange={value => updateForm("format", value)} />
              <SelectField label="Modalidade" value={form.gender} options={CATEGORY_GENDERS} onChange={value => updateForm("gender", value)} />
              <SelectField label="Equipe" value={form.teamSize} options={CATEGORY_TEAM_SIZES} onChange={value => updateForm("teamSize", value)} />
              <SelectField label="Nível" value={form.level} options={CATEGORY_LEVELS} onChange={value => updateForm("level", value)} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              {hasGroupPhase && (
                <>
                  <NumberField label="Equipes por grupo" value={form.groupSize} onChange={value => updateForm("groupSize", value)} />
                  <NumberField label="Ouro por grupo" value={form.goldQualifiersPerGroup} onChange={value => updateForm("goldQualifiersPerGroup", value)} />
                  <SelectField label="Grupos ímpares" value={form.oddGroupPolicy} options={ODD_GROUP_POLICIES} onChange={value => updateForm("oddGroupPolicy", value)} />
                </>
              )}
              {hasRankingTotals && (
                <NumberField label="Classificados Ouro" value={form.goldQualifiersTotal} onChange={value => updateForm("goldQualifiersTotal", value)} placeholder="Opcional" />
              )}
              <label className="flex items-center gap-2 pt-7 text-sm" style={{ color: "var(--text)" }}>
                <input type="checkbox" checked={form.enableSilverSeries} onChange={e => updateForm("enableSilverSeries", e.target.checked)} />
                Série Prata
              </label>
              {form.enableSilverSeries && hasGroupPhase && (
                <NumberField label="Prata por grupo" value={form.silverQualifiersPerGroup} onChange={value => updateForm("silverQualifiersPerGroup", value)} />
              )}
              {form.enableSilverSeries && hasRankingTotals && (
                <NumberField label="Classificados Prata" value={form.silverQualifiersTotal} onChange={value => updateForm("silverQualifiersTotal", value)} placeholder="Opcional" />
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
              <SelectField
                label="Pagamento"
                value={form.paymentMode}
                options={[
                  { value: "manual", label: "Controle manual" },
                  { value: "online", label: "PIX por atleta" },
                ]}
                onChange={value => updateForm("paymentMode", value)}
              />
              <div>
                <label className="label">Valor por atleta</label>
                <input className="input" value={form.registrationFee} onChange={e => updateForm("registrationFee", e.target.value)} placeholder="Ex: 80,00" />
              </div>
              <NumberField label="Sets" value={form.setsPerMatch} onChange={value => updateForm("setsPerMatch", value)} />
              <NumberField label="Pontos set" value={form.normalSetPoints} onChange={value => updateForm("normalSetPoints", value)} />
              <NumberField label="Tie-break" value={form.tiebreakSetPoints} onChange={value => updateForm("tiebreakSetPoints", value)} />
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={createCategory} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Criando..." : "Criar categoria"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--neutral-500)" }}>Carregando categorias...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border p-5 lg:col-span-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--neutral-500)" }}>
              Nenhuma categoria criada ainda. Crie uma categoria para começar a separar modalidades, níveis e formatos.
            </p>
          </div>
        ) : (
          categories.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))
        )}
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" min={0} className="input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold" style={{ color: "var(--text)" }}>{category.name}</h4>
          <p className="mt-1 text-sm" style={{ color: "var(--neutral-500)" }}>
            {getCategoryLabel(CATEGORY_SPORTS, category.sport)} · {getCategoryLabel(CATEGORY_TEAM_SIZES, category.teamSize)} · {getCategoryLabel(CATEGORY_GENDERS, category.gender)} · {getCategoryLabel(CATEGORY_LEVELS, category.level)}
          </p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "var(--neutral-50)", color: "var(--neutral-600)" }}>
          {category.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Formato" value={getCategoryLabel(CATEGORY_FORMATS, category.format)} />
        <Info label="Equipes" value={String(category._count?.teams ?? 0)} />
        <Info label="Séries" value={category.enableSilverSeries ? "Ouro e Prata" : "Ouro"} />
        <Info label="Pagamento" value={category.paymentMode === "online" ? "PIX por atleta" : "Manual"} />
        <Info label="Placar" value={`${category.setsPerMatch} sets · ${category.normalSetPoints}/${category.tiebreakSetPoints}`} />
        <Info label="Valor" value={category.registrationFee ? `R$ ${(category.registrationFee / 100).toFixed(2)}` : "Gratuito/manual"} />
      </div>

      <div className="mt-4 rounded-lg border border-dashed p-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--neutral-500)" }}>
        Gestão de equipes, grupos, rankings e chaveamento por categoria será exibida aqui conforme as fases forem geradas.
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--neutral-400)" }}>{label}</p>
      <p className="font-medium" style={{ color: "var(--text)" }}>{value}</p>
    </div>
  )
}
