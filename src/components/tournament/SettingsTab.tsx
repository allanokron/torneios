"use client"

import { useState } from "react"

interface Tournament {
  id: string
  name: string
  description?: string
  coverImage?: string
  location?: string
  city?: string
  state?: string
  startDate: string
  endDate?: string
  status: string
  setsPerMatch: number
  setsToWin: number
  hasTiebreak: boolean
  tiebreakScore: number
  hasSuperTiebreak: boolean
  superTiebreakScore: number
  defaultMatchDuration: number
  delayTolerance: number
  generalRules?: string
  woCriteria?: string
  isPublic: boolean
  maxParticipants?: number
  maxPostponements?: number
  postponementScope?: string
  courts: Array<{
    id: string
    name: string
    number?: number
    surfaceType?: string
    isCovered: boolean
  }>
  scoringConfig?: {
    winWithoutLosingSet: number
    winLosingOneSet: number
    lossWinningOneSet: number
    lossWithoutWinningSet: number
    winByWO: number
    lossByWO: number
    withdrawalPenalty: number
    delayPenalty: number
  }
}

interface SettingsTabProps {
  tournament: Tournament
  onTournamentUpdated: (tournament: Tournament) => void
}

export default function SettingsTab({ tournament, onTournamentUpdated }: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState<"general" | "rules" | "scoring" | "courts">("general")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // General form
  const [name, setName] = useState(tournament.name)
  const [description, setDescription] = useState(tournament.description || "")
  const [coverImage, setCoverImage] = useState(tournament.coverImage || "")
  const [coverPreview, setCoverPreview] = useState(tournament.coverImage || "")
  const [status, setStatus] = useState(tournament.status)
  const [location, setLocation] = useState(tournament.location || "")
  const [city, setCity] = useState(tournament.city || "")
  const [state, setState] = useState(tournament.state || "")
  const [startDate, setStartDate] = useState(tournament.startDate?.split("T")[0] || "")
  const [endDate, setEndDate] = useState(tournament.endDate?.split("T")[0] || "")
  const [maxParticipants, setMaxParticipants] = useState(tournament.maxParticipants?.toString() || "")
  const [isPublic, setIsPublic] = useState(tournament.isPublic)
  const [maxPostponements, setMaxPostponements] = useState(tournament.maxPostponements ?? 3)
  const [postponementScope, setPostponementScope] = useState(tournament.postponementScope || "month")

  // Rules form
  const [setsPerMatch, setSetsPerMatch] = useState(tournament.setsPerMatch)
  const [setsToWin, setSetsToWin] = useState(tournament.setsToWin)
  const [hasTiebreak, setHasTiebreak] = useState(tournament.hasTiebreak)
  const [tiebreakScore, setTiebreakScore] = useState(tournament.tiebreakScore)
  const [hasSuperTiebreak, setHasSuperTiebreak] = useState(tournament.hasSuperTiebreak)
  const [superTiebreakScore, setSuperTiebreakScore] = useState(tournament.superTiebreakScore)
  const [defaultMatchDuration, setDefaultMatchDuration] = useState(tournament.defaultMatchDuration)
  const [delayTolerance, setDelayTolerance] = useState(tournament.delayTolerance)
  const [generalRules, setGeneralRules] = useState(tournament.generalRules || "")
  const [woCriteria, setWoCriteria] = useState(tournament.woCriteria || "")

  // Scoring form
  const [scoring, setScoring] = useState({
    winWithoutLosingSet: tournament.scoringConfig?.winWithoutLosingSet ?? 3,
    winLosingOneSet: tournament.scoringConfig?.winLosingOneSet ?? 2,
    lossWinningOneSet: tournament.scoringConfig?.lossWinningOneSet ?? 1,
    lossWithoutWinningSet: tournament.scoringConfig?.lossWithoutWinningSet ?? 0,
    winByWO: tournament.scoringConfig?.winByWO ?? 3,
    lossByWO: tournament.scoringConfig?.lossByWO ?? 0,
    withdrawalPenalty: tournament.scoringConfig?.withdrawalPenalty ?? -1,
    delayPenalty: tournament.scoringConfig?.delayPenalty ?? -1
  })
  const [scoringChanged, setScoringChanged] = useState(false)
  const [showRankingWarning, setShowRankingWarning] = useState(false)

  // Courts
  const [courts, setCourts] = useState(tournament.courts)
  const [newCourtName, setNewCourtName] = useState("")
  const [newCourtSurface, setNewCourtSurface] = useState("")
  const [editingCourt, setEditingCourt] = useState<string | null>(null)
  const [editCourtName, setEditCourtName] = useState("")
  const [editCourtSurface, setEditCourtSurface] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const clearMessages = () => {
    setSuccess("")
    setError("")
  }

  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem deve ter no máximo 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setCoverImage(base64)
      setCoverPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const removeCoverImage = () => {
    setCoverImage("")
    setCoverPreview("")
  }

  // Save general settings
  const saveGeneral = async () => {
    clearMessages()
    setSaving(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          coverImage: coverImage || null,
          status,
          location,
          city,
          state,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
          isPublic,
          maxPostponements,
          postponementScope
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setSuccess("Configurações gerais salvas!")
      onTournamentUpdated(data.tournament)
    } catch {
      setError("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  // Save rules
  const saveRules = async () => {
    clearMessages()
    setSaving(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          setsPerMatch,
          setsToWin,
          hasTiebreak,
          tiebreakScore,
          hasSuperTiebreak,
          superTiebreakScore,
          defaultMatchDuration,
          delayTolerance,
          generalRules,
          woCriteria
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setSuccess("Regras salvas!")
      onTournamentUpdated(data.tournament)
    } catch {
      setError("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  // Save scoring
  const saveScoring = async () => {
    clearMessages()
    setSaving(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/scoring`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(scoring)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setScoringChanged(false)
      setShowRankingWarning(false)
      if (data.rankingsReset) {
        setSuccess("Pontuação salva! Rankings anteriores foram resetados.")
      } else {
        setSuccess("Pontuação salva!")
      }
    } catch {
      setError("Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  // Add court
  const addCourt = async () => {
    if (!newCourtName.trim()) return
    clearMessages()
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/courts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCourtName,
          number: courts.length + 1,
          surfaceType: newCourtSurface || null,
          isCovered: false
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setCourts([...courts, data.court])
      setNewCourtName("")
      setNewCourtSurface("")
      setSuccess("Quadra adicionada!")
    } catch {
      setError("Erro ao adicionar quadra")
    }
  }

  // Update court
  const updateCourt = async (courtId: string) => {
    clearMessages()
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/courts/${courtId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editCourtName,
          surfaceType: editCourtSurface || null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setCourts(courts.map(c => c.id === courtId ? data.court : c))
      setEditingCourt(null)
      setSuccess("Quadra atualizada!")
    } catch {
      setError("Erro ao atualizar quadra")
    }
  }

  // Delete court
  const deleteCourt = async (courtId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta quadra?")) return
    clearMessages()
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/courts/${courtId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setCourts(courts.filter(c => c.id !== courtId))
      setSuccess("Quadra excluída!")
    } catch {
      setError("Erro ao excluir quadra")
    }
  }

  const sections = [
    { id: "general" as const, label: "Geral" },
    { id: "rules" as const, label: "Regras" },
    { id: "scoring" as const, label: "Pontuação" },
    { id: "courts" as const, label: "Quadras" },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Messages */}
      {success && (
        <div className="mx-5 mt-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mx-5 mt-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Section Tabs */}
      <div className="border-b border-gray-200 px-5 pt-4">
        <nav className="flex gap-1 -mb-px">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); clearMessages() }}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeSection === s.id
                  ? "bg-gray-50 text-green-700 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-5">
        {/* ===== GENERAL ===== */}
        {activeSection === "general" && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="label">Nome do Torneio</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[80px]" />
            </div>
            <div>
              <label className="label">Foto de Capa</label>
              {coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="Capa" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">Clique para enviar uma foto</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG. Máximo 5MB. Recomendado: 1200x400px.</span>
                  <input type="file" accept="image/*" onChange={handleCoverImage} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <label className="label">Status do Torneio</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="input">
                <option value="draft">Rascunho</option>
                <option value="registration_open">Inscrições Abertas</option>
                <option value="registration_closed">Inscrições Encerradas</option>
                <option value="in_progress">Em Andamento</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Local</label>
                <input value={location} onChange={e => setLocation(e.target.value)} className="input" placeholder="Ex: Clube Paulista" />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input value={city} onChange={e => setCity(e.target.value)} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Estado</label>
                <input value={state} onChange={e => setState(e.target.value)} className="input" placeholder="SP" />
              </div>
              <div>
                <label className="label">Data Início</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Data Fim</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Máx. Participantes</label>
                <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="input" placeholder="Ilimitado" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer py-2.5">
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  <span className="text-sm text-gray-700">Torneio público</span>
                </label>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Regras de Adiamento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Máx. adiamentos por jogador</label>
                  <input type="number" min={0} max={10} value={maxPostponements} onChange={e => setMaxPostponements(parseInt(e.target.value) || 0)} className="input" />
                </div>
                <div>
                  <label className="label">Período de contagem</label>
                  <select value={postponementScope} onChange={e => setPostponementScope(e.target.value)} className="input">
                    <option value="month">Por mês</option>
                    <option value="tournament">Por torneio (total)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {postponementScope === "month" 
                  ? "O jogador pode adiar até " + maxPostponements + " vezes por mês. Agendamentos de meses futuros ficam bloqueados até o dia 1º."
                  : "O jogador pode adiar até " + maxPostponements + " vezes no total durante o torneio."}
              </p>
            </div>
            <div className="pt-2">
              <button onClick={saveGeneral} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {/* ===== RULES ===== */}
        {activeSection === "rules" && (
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Sets por partida</label>
                <select value={setsPerMatch} onChange={e => setSetsPerMatch(Number(e.target.value))} className="input">
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>
              <div>
                <label className="label">Sets para vencer</label>
                <select value={setsToWin} onChange={e => setSetsToWin(Number(e.target.value))} className="input">
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tiebreak</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasTiebreak} onChange={e => setHasTiebreak(e.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  <span className="text-sm text-gray-700">Habilitar tiebreak</span>
                </label>
                {hasTiebreak && (
                  <div>
                    <label className="label">Pontuação do tiebreak</label>
                    <input type="number" value={tiebreakScore} onChange={e => setTiebreakScore(Number(e.target.value))} className="input w-24" />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasSuperTiebreak} onChange={e => setHasSuperTiebreak(e.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  <span className="text-sm text-gray-700">Habilitar super tiebreak</span>
                </label>
                {hasSuperTiebreak && (
                  <div>
                    <label className="label">Pontuação do super tiebreak</label>
                    <input type="number" value={superTiebreakScore} onChange={e => setSuperTiebreakScore(Number(e.target.value))} className="input w-24" />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Partida</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duração padrão (min)</label>
                  <input type="number" value={defaultMatchDuration} onChange={e => setDefaultMatchDuration(Number(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="label">Tolerância atraso (min)</label>
                  <input type="number" value={delayTolerance} onChange={e => setDelayTolerance(Number(e.target.value))} className="input" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Regras Gerais</h4>
              <textarea value={generalRules} onChange={e => setGeneralRules(e.target.value)} className="input min-h-[60px]" placeholder="Regras adicionais do torneio..." />
            </div>

            <div>
              <label className="label">Critérios para W.O.</label>
              <textarea value={woCriteria} onChange={e => setWoCriteria(e.target.value)} className="input min-h-[60px]" placeholder="Quando aplicar walkover..." />
            </div>

            <div className="pt-2">
              <button onClick={saveRules} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {/* ===== SCORING ===== */}
        {activeSection === "scoring" && (
          <div className="space-y-5 max-w-xl">
            {showRankingWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Atenção: Rankings serão resetados</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Alterar a pontuação irá apagar todos os rankings e classificações atuais deste torneio.
                      O ranking será recalculado automaticamente com base nas partidas já finalizadas.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={saveScoring} disabled={saving} className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50">
                        {saving ? "Salvando..." : "Confirmar e Salvar"}
                      </button>
                      <button onClick={() => setShowRankingWarning(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Pontuação por resultado</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Vitória (sem perder set)</label>
                    <input type="number" value={scoring.winWithoutLosingSet} onChange={e => { setScoring({...scoring, winWithoutLosingSet: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                  <div>
                    <label className="label">Vitória (perdendo set)</label>
                    <input type="number" value={scoring.winLosingOneSet} onChange={e => { setScoring({...scoring, winLosingOneSet: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Derrota (vencendo set)</label>
                    <input type="number" value={scoring.lossWinningOneSet} onChange={e => { setScoring({...scoring, lossWinningOneSet: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                  <div>
                    <label className="label">Derrota (sem vencer)</label>
                    <input type="number" value={scoring.lossWithoutWinningSet} onChange={e => { setScoring({...scoring, lossWithoutWinningSet: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Walkover e Penalidades</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Pontos por W.O. (vitória)</label>
                    <input type="number" value={scoring.winByWO} onChange={e => { setScoring({...scoring, winByWO: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                  <div>
                    <label className="label">Pontos por W.O. (derrota)</label>
                    <input type="number" value={scoring.lossByWO} onChange={e => { setScoring({...scoring, lossByWO: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Penalidade por desistência</label>
                    <input type="number" value={scoring.withdrawalPenalty} onChange={e => { setScoring({...scoring, withdrawalPenalty: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                  <div>
                    <label className="label">Penalidade por atraso</label>
                    <input type="number" value={scoring.delayPenalty} onChange={e => { setScoring({...scoring, delayPenalty: Number(e.target.value)}); setScoringChanged(true); }} className="input" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {scoringChanged ? (
                <button onClick={() => setShowRankingWarning(true)} className="btn-primary">
                  Salvar Pontuação
                </button>
              ) : (
                <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
                  Nenhuma alteração
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== COURTS ===== */}
        {activeSection === "courts" && (
          <div className="space-y-4 max-w-xl">
            {/* Add new court */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newCourtName}
                onChange={e => setNewCourtName(e.target.value)}
                className="input"
                placeholder="Nome da quadra"
                onKeyDown={e => e.key === "Enter" && addCourt()}
              />
              <select value={newCourtSurface} onChange={e => setNewCourtSurface(e.target.value)} className="input sm:w-36">
                <option value="">Superfície</option>
                <option value="hard">Hard court</option>
                <option value="clay">Saibro</option>
                <option value="grass">Grama</option>
                <option value="carpet">Carpete</option>
              </select>
              <button onClick={addCourt} className="btn-primary sm:whitespace-nowrap">
                Adicionar
              </button>
            </div>

            {/* Courts list */}
            {courts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Nenhuma quadra cadastrada</p>
            ) : (
              <div className="space-y-2">
                {courts.map(court => (
                  <div key={court.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    {editingCourt === court.id ? (
                      <>
                        <input value={editCourtName} onChange={e => setEditCourtName(e.target.value)} className="input text-sm" />
                        <select value={editCourtSurface} onChange={e => setEditCourtSurface(e.target.value)} className="input w-24 text-sm">
                          <option value="">Tipo</option>
                          <option value="hard">Hard</option>
                          <option value="clay">Saibro</option>
                          <option value="grass">Grama</option>
                          <option value="carpet">Carpete</option>
                        </select>
                        <button onClick={() => updateCourt(court.id)} className="text-sm text-green-600 hover:text-green-700 font-medium">
                          Salvar
                        </button>
                        <button onClick={() => setEditingCourt(null)} className="text-sm text-gray-500 hover:text-gray-700">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4zm0 8h16M9 4v16M15 4v16" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{court.name}</p>
                          {court.surfaceType && <p className="text-xs text-gray-500 capitalize">{court.surfaceType}</p>}
                        </div>
                        <button onClick={() => { setEditingCourt(court.id); setEditCourtName(court.name); setEditCourtSurface(court.surfaceType || ""); }} className="text-sm text-gray-500 hover:text-gray-700">
                          Editar
                        </button>
                        <button onClick={() => deleteCourt(court.id)} className="text-sm text-red-500 hover:text-red-600">
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
