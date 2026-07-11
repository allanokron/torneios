"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CourtData {
  name: string
  number?: number
  surfaceType?: string
  isCovered: boolean
  availabilities: {
    dayOfWeek: number
    startTime: string
    endTime: string
  }[]
}

export default function NewTournamentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    address: "",
    city: "",
    state: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxParticipants: "",
    isPublic: true,
    inviteCode: "",
    setsPerMatch: 3,
    setsToWin: 2,
    hasTiebreak: true,
    tiebreakScore: 6,
    hasSuperTiebreak: true,
    superTiebreakScore: 10,
    defaultMatchDuration: 120,
    delayTolerance: 15,
    generalRules: "",
    woCriteria: "",
    termsOfResponsibility: "",
    cancellationRules: "",
    autoFinishOnFirstSubmission: false,
    scoringConfig: {
      winWithoutLosingSet: 3,
      winLosingOneSet: 2,
      lossWinningOneSet: 1,
      lossWithoutWinningSet: 0,
      winByWO: 3,
      lossByWO: 0,
      withdrawalPenalty: -1,
      delayPenalty: -1
    },
    tiebreakerConfig: {
      criteriaOrder: [
        "points",
        "wins",
        "direct_confrontation",
        "set_balance",
        "sets_won",
        "games_balance",
        "games_won",
        "fewer_wo",
        "draw"
      ]
    }
  })

  const [courts, setCourts] = useState<CourtData[]>([])
  const [coverPreview, setCoverPreview] = useState("")
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleScoringChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      scoringConfig: {
        ...prev.scoringConfig,
        [field]: value
      }
    }))
  }

  const addCourt = () => {
    setCourts(prev => [...prev, {
      name: `Quadra ${prev.length + 1}`,
      number: prev.length + 1,
      isCovered: false,
      availabilities: [
        { dayOfWeek: 1, startTime: "07:00", endTime: "22:00" },
        { dayOfWeek: 2, startTime: "07:00", endTime: "22:00" },
        { dayOfWeek: 3, startTime: "07:00", endTime: "22:00" },
        { dayOfWeek: 4, startTime: "07:00", endTime: "22:00" },
        { dayOfWeek: 5, startTime: "07:00", endTime: "22:00" },
        { dayOfWeek: 6, startTime: "07:00", endTime: "22:00" },
        { dayOfWeek: 0, startTime: "07:00", endTime: "22:00" }
      ]
    }])
  }

  const updateCourt = (index: number, field: string, value: unknown) => {
    setCourts(prev => prev.map((court, i) => 
      i === index ? { ...court, [field]: value } : court
    ))
  }

  const removeCourt = (index: number) => {
    setCourts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // Create tournament
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          coverImage: coverPreview || undefined,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          setsPerMatch: parseInt(formData.setsPerMatch.toString()),
          setsToWin: parseInt(formData.setsToWin.toString()),
          tiebreakScore: parseInt(formData.tiebreakScore.toString()),
          superTiebreakScore: parseInt(formData.superTiebreakScore.toString()),
          defaultMatchDuration: parseInt(formData.defaultMatchDuration.toString()),
          delayTolerance: parseInt(formData.delayTolerance.toString()),
          scoringConfig: {
            ...formData.scoringConfig,
            winWithoutLosingSet: parseInt(formData.scoringConfig.winWithoutLosingSet.toString()),
            winLosingOneSet: parseInt(formData.scoringConfig.winLosingOneSet.toString()),
            lossWinningOneSet: parseInt(formData.scoringConfig.lossWinningOneSet.toString()),
            lossWithoutWinningSet: parseInt(formData.scoringConfig.lossWithoutWinningSet.toString()),
            winByWO: parseInt(formData.scoringConfig.winByWO.toString()),
            lossByWO: parseInt(formData.scoringConfig.lossByWO.toString()),
            withdrawalPenalty: parseInt(formData.scoringConfig.withdrawalPenalty.toString()),
            delayPenalty: parseInt(formData.scoringConfig.delayPenalty.toString())
          }
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar torneio")
        return
      }

      // Create courts
      if (courts.length > 0) {
        for (const court of courts) {
          await fetch(`/api/tournaments/${data.tournament.id}/courts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(court)
          })
        }
      }

      router.push(`/tournaments/${data.tournament.id}`)
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const states = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO"
  ]

  const daysOfWeek = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda" },
    { value: 2, label: "Terça" },
    { value: 3, label: "Quarta" },
    { value: 4, label: "Quinta" },
    { value: 5, label: "Sexta" },
    { value: 6, label: "Sábado" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🎾</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Torneios</h1>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Torneio</h2>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div
                    className={`h-1 w-12 sm:w-20 ${
                      step > s ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Informações</span>
            <span>Quadras</span>
            <span>Regras</span>
            <span>Pontuação</span>
            <span>Revisão</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: General Information */}
        {step === 1 && (
          <div className="card space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Informações Gerais</h3>
            
            <div>
              <label className="label">Nome do Torneio *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Liga de Tênis 2026"
                required
              />
            </div>

            <div>
              <label className="label">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input"
                rows={3}
                placeholder="Descreva o torneio..."
              />
            </div>

            <div>
              <label className="label">Foto de Capa</label>
              <div className="flex items-center gap-4">
                {coverPreview && (
                  <img src={coverPreview} alt="Capa" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Escolher foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = () => setCoverPreview(reader.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Opcional. Recomendado: 1200x600px</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Local</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ex: Clube Tennis"
                />
              </div>

              <div>
                <label className="label">Endereço</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input"
                  placeholder="Rua, número"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Cidade</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input"
                  placeholder="Sua cidade"
                />
              </div>

              <div>
                <label className="label">Estado</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">UF</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Data de Início *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Data de Término</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Prazo para Inscrições</label>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Máximo de Participantes</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ilimitado"
                  min="2"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Torneio Público</span>
              </label>

              {!formData.isPublic && (
                <div className="flex-1">
                  <input
                    type="text"
                    name="inviteCode"
                    value={formData.inviteCode}
                    onChange={handleChange}
                    className="input"
                    placeholder="Código de convite"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Courts */}
        {step === 2 && (
          <div className="card space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Quadras</h3>
              <button onClick={addCourt} className="btn-secondary text-sm">
                + Adicionar Quadra
              </button>
            </div>

            {courts.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">Nenhuma quadra adicionada</p>
                <button onClick={addCourt} className="btn-primary">
                  Adicionar Primeira Quadra
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {courts.map((court, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Quadra {index + 1}</h4>
                      <button
                        onClick={() => removeCourt(index)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nome</label>
                        <input
                          type="text"
                          value={court.name}
                          onChange={(e) => updateCourt(index, "name", e.target.value)}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="label">Tipo de Piso</label>
                        <select
                          value={court.surfaceType || ""}
                          onChange={(e) => updateCourt(index, "surfaceType", e.target.value)}
                          className="input"
                        >
                          <option value="">Selecione</option>
                          <option value="clay">Terra Batida</option>
                          <option value="hard">Quadra Dura</option>
                          <option value="grass">Grama</option>
                          <option value="carpet">Carpete</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={court.isCovered}
                          onChange={(e) => updateCourt(index, "isCovered", e.target.checked)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Coberta</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Rules */}
        {step === 3 && (
          <div className="card space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Regras da Competição</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Sets por Partida</label>
                <select
                  name="setsPerMatch"
                  value={formData.setsPerMatch}
                  onChange={handleChange}
                  className="input"
                >
                  <option value={3}>Melhor de 3</option>
                  <option value={5}>Melhor de 5</option>
                </select>
              </div>

              <div>
                <label className="label">Sets para Vencer</label>
                <select
                  name="setsToWin"
                  value={formData.setsToWin}
                  onChange={handleChange}
                  className="input"
                >
                  <option value={2}>2 sets</option>
                  <option value={3}>3 sets</option>
                </select>
              </div>

              <div>
                <label className="label">Duração Padrão (min)</label>
                <input
                  type="number"
                  name="defaultMatchDuration"
                  value={formData.defaultMatchDuration}
                  onChange={handleChange}
                  className="input"
                  min="60"
                  max="240"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hasTiebreak"
                  checked={formData.hasTiebreak}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Tiebreak</span>
              </div>

              {formData.hasTiebreak && (
                <div>
                  <label className="label">Placar do Tiebreak</label>
                  <input
                    type="number"
                    name="tiebreakScore"
                    value={formData.tiebreakScore}
                    onChange={handleChange}
                    className="input"
                    min="5"
                    max="10"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hasSuperTiebreak"
                  checked={formData.hasSuperTiebreak}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Super Tiebreak</span>
              </div>

              {formData.hasSuperTiebreak && (
                <div>
                  <label className="label">Pontos do Super Tiebreak</label>
                  <input
                    type="number"
                    name="superTiebreakScore"
                    value={formData.superTiebreakScore}
                    onChange={handleChange}
                    className="input"
                    min="7"
                    max="15"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="label">Tolerância para Atraso (minutos)</label>
              <input
                type="number"
                name="delayTolerance"
                value={formData.delayTolerance}
                onChange={handleChange}
                className="input"
                min="5"
                max="60"
              />
            </div>

            <div>
              <label className="label">Critérios de W.O.</label>
              <textarea
                name="woCriteria"
                value={formData.woCriteria}
                onChange={handleChange}
                className="input"
                rows={2}
                placeholder="Descreva os critérios para W.O..."
              />
            </div>

            <div>
              <label className="label">Regras Gerais</label>
              <textarea
                name="generalRules"
                value={formData.generalRules}
                onChange={handleChange}
                className="input"
                rows={3}
                placeholder="Regras adicionais do torneio..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Scoring */}
        {step === 4 && (
          <div className="card space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Pontuação</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Vitória sem perder sets</label>
                <input
                  type="number"
                  value={formData.scoringConfig.winWithoutLosingSet}
                  onChange={(e) => handleScoringChange("winWithoutLosingSet", parseInt(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Vitória perdendo um set</label>
                <input
                  type="number"
                  value={formData.scoringConfig.winLosingOneSet}
                  onChange={(e) => handleScoringChange("winLosingOneSet", parseInt(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Derrota vencendo um set</label>
                <input
                  type="number"
                  value={formData.scoringConfig.lossWinningOneSet}
                  onChange={(e) => handleScoringChange("lossWinningOneSet", parseInt(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Derrota sem vencer sets</label>
                <input
                  type="number"
                  value={formData.scoringConfig.lossWithoutWinningSet}
                  onChange={(e) => handleScoringChange("lossWithoutWinningSet", parseInt(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Vitória por W.O.</label>
                <input
                  type="number"
                  value={formData.scoringConfig.winByWO}
                  onChange={(e) => handleScoringChange("winByWO", parseInt(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Derrota por W.O.</label>
                <input
                  type="number"
                  value={formData.scoringConfig.lossByWO}
                  onChange={(e) => handleScoringChange("lossByWO", parseInt(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Penalidade por desistência</label>
                <input
                  type="number"
                  value={formData.scoringConfig.withdrawalPenalty}
                  onChange={(e) => handleScoringChange("withdrawalPenalty", parseInt(e.target.value))}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Penalidade por atraso</label>
                <input
                  type="number"
                  value={formData.scoringConfig.delayPenalty}
                  onChange={(e) => handleScoringChange("delayPenalty", parseInt(e.target.value))}
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="card space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Revisão</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{formData.name || "Nome do Torneio"}</h4>
                <p className="text-sm text-gray-600">
                  {formData.location || "Local não informado"} • {formData.city || "Cidade"}, {formData.state || "UF"}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.startDate ? new Date(formData.startDate).toLocaleDateString("pt-BR") : "Data não definida"}
                  {formData.endDate && ` - ${new Date(formData.endDate).toLocaleDateString("pt-BR")}`}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Regras</h4>
                <p className="text-sm text-gray-600">
                  Melhor de {formData.setsPerMatch} sets • {formData.setsToWin} sets para vencer
                </p>
                {formData.hasTiebreak && (
                  <p className="text-sm text-gray-600">
                    Tiebreak em {formData.tiebreakScore} a {formData.tiebreakScore}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Pontuação</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <p>Vitória sem perder sets: {formData.scoringConfig.winWithoutLosingSet} pts</p>
                  <p>Vitória perdendo set: {formData.scoringConfig.winLosingOneSet} pts</p>
                  <p>Derrota vencendo set: {formData.scoringConfig.lossWinningOneSet} pts</p>
                  <p>Derrota sem vencer: {formData.scoringConfig.lossWithoutWinningSet} pts</p>
                </div>
              </div>

              {courts.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Quadras ({courts.length})</h4>
                  <p className="text-sm text-gray-600">
                    {courts.map(c => c.name).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
            >
              Voltar
            </button>
          ) : (
            <Link href="/" className="btn-secondary">
              Cancelar
            </Link>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-primary"
              disabled={step === 1 && !formData.name}
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Torneio"}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}