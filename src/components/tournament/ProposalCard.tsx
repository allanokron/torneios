"use client"

import { useState } from "react"

interface Proposal {
  id: string
  proposedDate: string
  proposedTime: string
  message?: string | null
  status: string
  responseMessage?: string | null
  sender: { id: string; name: string }
  receiver: { id: string; name: string }
  court: { id: string; name: string }
}

interface ProposalCardProps {
  proposal: Proposal
  currentUserId: string
  matchId: string
  matchStatus: string
  courts: Array<{ id: string; name: string }>
  onAction: () => void
}

export default function ProposalCard({
  proposal,
  currentUserId,
  matchId,
  matchStatus,
  courts,
  onAction,
}: ProposalCardProps) {
  const [rejectMessage, setRejectMessage] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showCounterForm, setShowCounterForm] = useState(false)
  const [counterDate, setCounterDate] = useState("")
  const [counterTime, setCounterTime] = useState("")
  const [counterCourtId, setCounterCourtId] = useState("")
  const [counterMessage, setCounterMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isReceiver = proposal.receiver.id === currentUserId
  const isPending = proposal.status === "pending"
  const isAccepted = proposal.status === "accepted"
  const isRejected = proposal.status === "rejected"

  const proposedDateObj = new Date(proposal.proposedDate)
  const dateStr = proposedDateObj.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })

  const handleAction = async (action: string, body: Record<string, unknown> = {}) => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/matches/${matchId}/schedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ proposalId: proposal.id, action, ...body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao processar")
        return
      }
      onAction()
    } catch {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = () => {
    if (!rejectMessage.trim()) {
      setError("Informe o motivo da recusa")
      return
    }
    handleAction("reject", { responseMessage: rejectMessage.trim() })
  }

  const handleCounter = () => {
    if (!counterDate || !counterTime || !counterCourtId) {
      setError("Preencha data, horário e quadra")
      return
    }
    if (counterMessage.length > 200) {
      setError("Máximo de 200 caracteres")
      return
    }
    handleAction("counter_proposal", {
      proposedDate: counterDate,
      proposedTime: counterTime,
      courtId: counterCourtId,
      responseMessage: counterMessage.trim() || "Contraproposta",
    })
  }

  if (isAccepted) {
    return (
      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-green-800">Proposta Aceita</span>
        </div>
        <p className="text-sm text-green-700">
          {dateStr} às {proposal.proposedTime} — {proposal.court.name}
        </p>
        {proposal.message && (
          <p className="text-xs text-green-600 mt-1 italic">&ldquo;{proposal.message}&rdquo;</p>
        )}
      </div>
    )
  }

  if (isRejected) {
    return (
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Proposta Recusada</span>
        </div>
        <p className="text-xs text-gray-500">
          {proposal.sender.name} propôs {dateStr} às {proposal.proposedTime}
        </p>
        {proposal.responseMessage && (
          <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{proposal.responseMessage}&rdquo;</p>
        )}
      </div>
    )
  }

  // Pending proposal
  return (
    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium text-amber-800">
          Proposta de {proposal.sender.name}
        </span>
      </div>
      <p className="text-sm text-amber-700 mb-2">
        {dateStr} às {proposal.proposedTime} — {proposal.court.name}
      </p>
      {proposal.message && (
        <p className="text-xs text-amber-600 mb-2 italic">&ldquo;{proposal.message}&rdquo;</p>
      )}

      {isReceiver && isPending && !showRejectForm && !showCounterForm && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAction("accept")}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Aceitar"}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={() => setShowCounterForm(true)}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            Contrapor
          </button>
        </div>
      )}

      {showRejectForm && (
        <div className="mt-2 space-y-2">
          <textarea
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
            maxLength={200}
            rows={2}
            className="input w-full resize-none text-sm"
            placeholder="Motivo da recusa..."
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowRejectForm(false); setRejectMessage(""); setError("") }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Voltar
            </button>
            <button
              onClick={handleReject}
              disabled={loading || !rejectMessage.trim()}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "..." : "Confirmar Recusa"}
            </button>
          </div>
        </div>
      )}

      {showCounterForm && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={counterDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setCounterDate(e.target.value)}
              className="input text-sm"
              placeholder="Nova data"
            />
            <input
              type="time"
              value={counterTime}
              onChange={(e) => setCounterTime(e.target.value)}
              className="input text-sm"
              placeholder="Novo horário"
            />
          </div>
          <select
            value={counterCourtId}
            onChange={(e) => setCounterCourtId(e.target.value)}
            className="input text-sm w-full"
          >
            <option value="">Nova quadra</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <textarea
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            maxLength={200}
            rows={2}
            className="input w-full resize-none text-sm"
            placeholder="Mensagem (opcional)..."
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCounterForm(false); setError(""); setCounterDate(""); setCounterTime(""); setCounterCourtId(""); setCounterMessage("") }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Voltar
            </button>
            <button
              onClick={handleCounter}
              disabled={loading || !counterDate || !counterTime || !counterCourtId}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "..." : "Enviar Contraproposta"}
            </button>
          </div>
        </div>
      )}

      {error && !showRejectForm && !showCounterForm && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
