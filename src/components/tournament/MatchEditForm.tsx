"use client"

import { useState } from "react"

interface MatchEditFormProps {
  matchId: string
  homePlayer: { id: string; name: string }
  awayPlayer: { id: string; name: string }
  scheduledAt: string | null
  courtId: string | null
  status: string
  duration: number
  members: Array<{ user: { id: string; name: string } }>
  courts: Array<{ id: string; name: string }>
  onSuccess: () => void
  onClose: () => void
}

export default function MatchEditForm({
  matchId,
  homePlayer,
  awayPlayer,
  scheduledAt,
  courtId,
  status,
  duration,
  members,
  courts,
  onSuccess,
  onClose,
}: MatchEditFormProps) {
  const [editDate, setEditDate] = useState(() => {
    if (!scheduledAt) return ""
    const d = new Date(scheduledAt)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [editTime, setEditTime] = useState(() => {
    if (!scheduledAt) return ""
    const d = new Date(scheduledAt)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  })
  const [editHomePlayerId, setEditHomePlayerId] = useState(homePlayer.id)
  const [editAwayPlayerId, setEditAwayPlayerId] = useState(awayPlayer.id)
  const [editCourtId, setEditCourtId] = useState(courtId || "")
  const [editStatus, setEditStatus] = useState(status)
  const [editDuration, setEditDuration] = useState(duration)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const updateData: Record<string, unknown> = {}

      if (editDate && editTime) {
        updateData.scheduledAt = new Date(`${editDate}T${editTime}:00`).toISOString()
      } else if (!editDate && !editTime) {
        updateData.scheduledAt = null
      }

      updateData.homePlayerId = editHomePlayerId
      updateData.awayPlayerId = editAwayPlayerId
      updateData.courtId = editCourtId || null
      updateData.status = editStatus
      updateData.duration = editDuration

      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao editar partida")
        return
      }

      onSuccess()
    } catch {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: "pending_scheduling", label: "Agendar" },
    { value: "scheduled", label: "Agendada" },
    { value: "in_progress", label: "Em Jogo" },
    { value: "finished", label: "Finalizada" },
    { value: "cancelled", label: "Cancelada" },
    { value: "wo", label: "W.O." },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 20 }} className="shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div style={{ borderColor: 'var(--border)' }} className="flex items-center justify-between p-5 border-b">
          <h3 style={{ color: 'var(--text)' }} className="text-lg font-semibold">Editar Partida</h3>
          <button onClick={onClose} style={{ color: 'var(--neutral-400)' }} className="hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Players */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Jogador Casa</label>
              <select
                value={editHomePlayerId}
                onChange={e => setEditHomePlayerId(e.target.value)}
                className="input w-full text-sm"
              >
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Jogador Fora</label>
              <select
                value={editAwayPlayerId}
                onChange={e => setEditAwayPlayerId(e.target.value)}
                className="input w-full text-sm"
              >
                {members.map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Horário</label>
              <input
                type="time"
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
          </div>

          {/* Court */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Quadra</label>
            <select
              value={editCourtId}
              onChange={e => setEditCourtId(e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">Sem quadra</option>
              {courts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Status</label>
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              className="input w-full text-sm"
            >
              {statusOptions.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label style={{ color: 'var(--text)' }} className="block text-sm font-medium mb-1">Duração (minutos)</label>
            <input
              type="number"
              min={30}
              max={300}
              value={editDuration}
              onChange={e => setEditDuration(parseInt(e.target.value) || 120)}
              className="input w-full text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              style={{ background: 'var(--neutral-100)', borderColor: 'var(--border)', color: 'var(--text)' }}
              className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{ background: 'var(--accent)', color: 'var(--primary)' }}
              className="flex-1 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors text-sm hover:bg-[var(--accent-hover)]"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
