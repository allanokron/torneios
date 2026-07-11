"use client"

import { useState, useRef } from "react"

interface MatchResultFormProps {
  matchId: string
  matchStatus: string
  homePlayer: { id: string; name: string }
  awayPlayer: { id: string; name: string }
  setsPerMatch: number
  isOwner: boolean
  existingSets?: Array<{ homeGames: number; awayGames: number }>
  existingStartPhoto?: string | null
  existingEndPhoto?: string | null
  onSuccess: () => void
  onClose: () => void
}

export default function MatchResultForm({
  matchId,
  matchStatus,
  homePlayer,
  awayPlayer,
  setsPerMatch,
  isOwner,
  existingSets,
  existingStartPhoto,
  existingEndPhoto,
  onSuccess,
  onClose,
}: MatchResultFormProps) {
  const [step, setStep] = useState<"start" | "score" | "confirm">(
    matchStatus === "scheduled" ? "start" : "score"
  )
  const [startPhoto, setStartPhoto] = useState<string | null>(existingStartPhoto || null)
  const [endPhoto, setEndPhoto] = useState<string | null>(existingEndPhoto || null)
  const [sets, setSets] = useState<Array<{ homeGames: number; awayGames: number }>>(
    existingSets && existingSets.length > 0
      ? existingSets
      : Array.from({ length: setsPerMatch }, () => ({ homeGames: 0, awayGames: 0 }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const startInputRef = useRef<HTMLInputElement>(null)
  const endInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "start" | "end"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Foto deve ter no máximo 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (type === "start") setStartPhoto(base64)
      else setEndPhoto(base64)
    }
    reader.readAsDataURL(file)
  }

  const updateSet = (index: number, field: "homeGames" | "awayGames", value: number) => {
    const newSets = [...sets]
    newSets[index] = { ...newSets[index], [field]: Math.max(0, value) }
    setSets(newSets)
  }

  const addSet = () => {
    if (sets.length < setsPerMatch) {
      setSets([...sets, { homeGames: 0, awayGames: 0 }])
    }
  }

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index))
    }
  }

  // Auto-calculate sets won
  const homeSetsWon = sets.filter(s => s.homeGames > s.awayGames).length
  const awaySetsWon = sets.filter(s => s.awayGames > s.homeGames).length

  const handleStartMatch = async () => {
    if (!startPhoto) {
      setError("Foto do início é obrigatória")
      return
    }
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "start_match", startPhotoUrl: startPhoto }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao iniciar jogo"); return }
      onSuccess()
    } catch { setError("Erro de conexão") }
    finally { setLoading(false) }
  }

  const handleSubmitResult = async () => {
    const hasValidSets = sets.some(s => s.homeGames > 0 || s.awayGames > 0)
    if (!hasValidSets) { setError("Preencha pelo menos um set"); return }
    if (!endPhoto) { setError("Foto do final é obrigatória"); return }

    const requiredSets = Math.ceil(setsPerMatch / 2)
    if (homeSetsWon < requiredSets && awaySetsWon < requiredSets) {
      setError(`Nenhum jogador atingiu ${requiredSets} sets para vencer`)
      return
    }

    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const cleanSets = sets.filter(s => s.homeGames > 0 || s.awayGames > 0)
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "submit_result", sets: cleanSets, endPhotoUrl: endPhoto }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao enviar resultado"); return }
      onSuccess()
    } catch { setError("Erro de conexão") }
    finally { setLoading(false) }
  }

  const handleEditResult = async () => {
    const hasValidSets = sets.some(s => s.homeGames > 0 || s.awayGames > 0)
    if (!hasValidSets) { setError("Preencha pelo menos um set"); return }

    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const cleanSets = sets.filter(s => s.homeGames > 0 || s.awayGames > 0)
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sets: cleanSets, endPhotoUrl: endPhoto }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao editar resultado"); return }
      onSuccess()
    } catch { setError("Erro de conexão") }
    finally { setLoading(false) }
  }

  const isEditing = matchStatus === "finished" && isOwner

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar Resultado" : step === "start" ? "Iniciar Jogo" : "Registrar Placar"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Players header */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-900">{homePlayer.name}</span>
            <span className="text-gray-400">vs</span>
            <span className="font-medium text-gray-900">{awayPlayer.name}</span>
          </div>

          {/* STEP: Start match */}
          {step === "start" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Início do Jogo *</label>
                <input ref={startInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, "start")} />
                {startPhoto ? (
                  <div className="relative">
                    <img src={startPhoto} alt="Início" className="w-full h-48 object-cover rounded-lg" />
                    <button onClick={() => setStartPhoto(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
                  </div>
                ) : (
                  <button onClick={() => startInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Tirar foto do início</span>
                  </button>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button onClick={handleStartMatch} disabled={loading || !startPhoto} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {loading ? "Iniciando..." : "Iniciar Jogo"}
              </button>
            </>
          )}

          {/* STEP: Score */}
          {(step === "score" || isEditing) && (
            <>
              {/* Sets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Placar (games por set)</label>
                  {sets.length < setsPerMatch && !isEditing && (
                    <button onClick={addSet} className="text-xs text-green-600 hover:text-green-700">+ Adicionar set</button>
                  )}
                </div>
                <div className="space-y-2">
                  {sets.map((set, i) => {
                    const setWon = set.homeGames > set.awayGames ? "home" : set.awayGames > set.homeGames ? "away" : null
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <span className="text-xs font-medium text-gray-500 w-8">Set {i + 1}</span>
                        <input
                          type="number"
                          min={0}
                          value={set.homeGames || ""}
                          onChange={e => updateSet(i, "homeGames", parseInt(e.target.value) || 0)}
                          className={`w-16 text-center text-sm font-medium rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-2 ${
                            setWon === "home" ? "border-green-300 bg-green-50 text-green-700 ring-green-200" : "border-gray-200 focus:ring-green-200"
                          }`}
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-400">x</span>
                        <input
                          type="number"
                          min={0}
                          value={set.awayGames || ""}
                          onChange={e => updateSet(i, "awayGames", parseInt(e.target.value) || 0)}
                          className={`w-16 text-center text-sm font-medium rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-2 ${
                            setWon === "away" ? "border-green-300 bg-green-50 text-green-700 ring-green-200" : "border-gray-200 focus:ring-green-200"
                          }`}
                          placeholder="0"
                        />
                        {sets.length > 1 && !isEditing && (
                          <button onClick={() => removeSet(i)} className="text-gray-400 hover:text-red-500 ml-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Sets summary */}
                <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                  <span className={`font-bold text-lg ${homeSetsWon > awaySetsWon ? "text-green-600" : "text-gray-900"}`}>
                    {homeSetsWon}
                  </span>
                  <span className="text-gray-400">sets</span>
                  <span className={`font-bold text-lg ${awaySetsWon > homeSetsWon ? "text-green-600" : "text-gray-900"}`}>
                    {awaySetsWon}
                  </span>
                </div>
              </div>

              {/* End photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Final do Jogo *</label>
                <input ref={endInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, "end")} />
                {endPhoto ? (
                  <div className="relative">
                    <img src={endPhoto} alt="Final" className="w-full h-48 object-cover rounded-lg" />
                    <button onClick={() => setEndPhoto(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
                  </div>
                ) : (
                  <button onClick={() => endInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Tirar foto do final</span>
                  </button>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={isEditing ? handleEditResult : handleSubmitResult}
                disabled={loading}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Enviar Resultado"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
