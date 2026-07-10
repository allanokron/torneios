"use client"

import { useState, useEffect } from "react"

interface Court {
  id: string
  name: string
  number?: number
  surfaceType?: string
}

interface ScheduleProposalFormProps {
  matchId: string
  opponentName: string
  courts: Court[]
  onSuccess: () => void
  onClose: () => void
}

export default function ScheduleProposalForm({
  matchId,
  opponentName,
  courts,
  onSuccess,
  onClose,
}: ScheduleProposalFormProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [courtId, setCourtId] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time || !courtId) {
      setError("Preencha data, horário e quadra")
      return
    }
    if (message.length > 200) {
      setError("Máximo de 200 caracteres na mensagem")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/matches/${matchId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposedDate: date,
          proposedTime: time,
          courtId,
          message: message.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao enviar proposta")
        return
      }

      onSuccess()
    } catch {
      setError("Erro de conexão")
    } finally {
      setSubmitting(false)
    }
  }

  // Set min date to today
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Propor Horário</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Convidar <span className="font-medium text-gray-900">{opponentName}</span> para jogar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quadra</label>
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Selecione a quadra</option>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.surfaceType ? ` (${c.surfaceType})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem <span className="text-gray-400 font-normal">(opcional, máx. 200 caracteres)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={2}
              className="input w-full resize-none"
              placeholder="Ex: Podemos jogar nesse horário?"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/200</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Enviando..." : "Enviar Proposta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
