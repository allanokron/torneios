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
        style={{ background: 'var(--surface)', borderRadius: 20 }}
        className="shadow-lg w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: 'var(--text)' }} className="text-lg font-semibold">Propor Horário</h3>
          <button onClick={onClose} style={{ color: 'var(--neutral-400)' }} className="hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--neutral-400)' }}>
          Convidar <span className="font-medium" style={{ color: 'var(--text)' }}>{opponentName}</span> para jogar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Data</label>
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
              <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Horário</label>
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
            <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Quadra</label>
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Selecione a quadra</option>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.surfaceType ? ` (${c.surfaceType === "hard" ? "Quadra Dura" : c.surfaceType === "clay" ? "Quadra de Saibro" : c.surfaceType === "grass" ? "Quadra de Grama" : c.surfaceType})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">
              Mensagem <span className="font-normal" style={{ color: 'var(--neutral-400)' }}>(opcional, máx. 200 caracteres)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={2}
              className="input w-full resize-none"
              placeholder="Ex: Podemos jogar nesse horário?"
            />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--neutral-400)' }}>{message.length}/200</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'var(--neutral-100)', borderColor: 'var(--border)', color: 'var(--text)' }}
              className="flex-1 px-4 py-2.5 text-sm font-medium border rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: 'var(--accent)', color: 'var(--primary)' }}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors hover:bg-[var(--accent-hover)]"
            >
              {submitting ? "Enviando..." : "Enviar Proposta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
