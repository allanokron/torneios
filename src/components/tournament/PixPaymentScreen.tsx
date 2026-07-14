"use client"

import { useState, useEffect, useCallback } from "react"

interface PixPaymentScreenProps {
  tournamentId: string
  tournamentName: string
  paymentId: string
  qrCodeImage: string
  pixPayload: string
  expiresAt: string
  value: number // em centavos
  onPaymentConfirmed?: () => void
  onCancel?: () => void
}

export default function PixPaymentScreen({
  tournamentId,
  tournamentName,
  paymentId,
  qrCodeImage,
  pixPayload,
  expiresAt,
  value,
  onPaymentConfirmed,
  onCancel,
}: PixPaymentScreenProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [isExpired, setIsExpired] = useState(false)
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<"pending" | "checking" | "confirmed" | "expired">("pending")

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100)
  }

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const exp = new Date(expiresAt).getTime()
      const diff = exp - now

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft("00:00")
        setStatus("expired")
        clearInterval(interval)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // Copy PIX payload
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = pixPayload
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [pixPayload])

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    setChecking(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tournaments/${tournamentId}/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.payment.status === "PAID") {
        setStatus("confirmed")
        onPaymentConfirmed?.()
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
    } finally {
      setChecking(false)
    }
  }, [tournamentId, paymentId, onPaymentConfirmed])

  // Auto-check payment status
  useEffect(() => {
    if (status !== "pending") return

    const interval = setInterval(checkPaymentStatus, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [status, checkPaymentStatus])

  if (status === "confirmed") {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#22c55e" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
          Inscrição confirmada!
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--neutral-400)" }}>
          Seu pagamento por PIX foi identificado e sua vaga está garantida.
        </p>
        <button
          onClick={onCancel}
          className="btn-primary"
        >
          Acessar torneio
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
          Pagamento da inscrição
        </h3>
        <p className="text-sm" style={{ color: "var(--neutral-400)" }}>
          {tournamentName}
        </p>
      </div>

      {/* Value */}
      <div className="text-center mb-6">
        <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          {formatCurrency(value)}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--neutral-400)" }}>
          Forma de pagamento: PIX
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-xl" style={{ background: "white" }}>
          <img
            src={`data:image/png;base64,${qrCodeImage}`}
            alt="QR Code PIX"
            className="w-48 h-48"
          />
        </div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-center mb-4" style={{ color: "var(--neutral-400)" }}>
        Escaneie o QR Code com o aplicativo do seu banco ou copie o código PIX abaixo.
      </p>

      {/* PIX Copy/Paste */}
      <div className="mb-4">
        <div
          className="p-3 rounded-xl text-xs break-all"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "monospace",
          }}
        >
          {pixPayload}
        </div>
        <button
          onClick={handleCopy}
          className="w-full mt-2 btn-primary text-sm"
        >
          {copied ? "Copiado!" : "Copiar código PIX"}
        </button>
      </div>

      {/* Countdown */}
      {!isExpired ? (
        <div className="text-center mb-4">
          <p className="text-sm" style={{ color: timeLeft < "05:00" ? "#ef4444" : "var(--neutral-400)" }}>
            Este PIX expira em <span className="font-mono font-semibold">{timeLeft}</span>
          </p>
          {timeLeft < "05:00" && (
            <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
              Seu PIX está próximo de expirar. Conclua o pagamento para garantir sua vaga.
            </p>
          )}
        </div>
      ) : (
        <div className="text-center mb-4">
          <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
            Este PIX expirou.
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--neutral-400)" }}>
            Sua vaga temporária foi liberada. Gere uma nova cobrança para continuar.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {!isExpired && (
          <button
            onClick={checkPaymentStatus}
            disabled={checking}
            className="w-full btn-primary disabled:opacity-50"
          >
            {checking ? "Verificando..." : "Já realizei o pagamento"}
          </button>
        )}

        {isExpired && (
          <button
            onClick={() => window.location.reload()}
            className="w-full btn-primary"
          >
            Gerar novo PIX
          </button>
        )}

        <button
          onClick={onCancel}
          className="w-full text-sm py-2"
          style={{ color: "var(--neutral-400)" }}
        >
          Cancelar
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-center mt-4" style={{ color: "var(--neutral-400)" }}>
        Não é necessário enviar comprovante. A confirmação é feita automaticamente quando o PIX é identificado.
      </p>
    </div>
  )
}
