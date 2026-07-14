"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

export default function AccountDeletionPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [password, setPassword] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError("A senha é obrigatória para confirmar a exclusão")
      return
    }
    setError("")
    setShowModal(true)
  }

  const confirmDeletion = async () => {
    setSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/legal/account-deletion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` || ""
        },
        body: JSON.stringify({ password, reason })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao excluir conta")
        setShowModal(false)
        return
      }

      setSuccess(true)
      setShowModal(false)
      localStorage.removeItem("token")
    } catch {
      setError("Erro ao conectar com o servidor")
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/settings" style={{ color: 'var(--neutral-400)' }} className="hover:opacity-70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Excluir Minha Conta
          </h1>
        </div>

        {success ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Conta excluída com sucesso
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--neutral-400)' }}>
              Sua conta e todos os dados associados foram removidos permanentemente.
            </p>
            <Link href="/" className="btn-primary">
              Voltar para o início
            </Link>
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl p-5 mb-6"
              style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)' }}
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--danger)' }}>
                    Atenção: Esta ação é irreversível
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--neutral-600)' }}>
                    Ao excluir sua conta, todos os seus dados serão permanentemente removidos, incluindo:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs" style={{ color: 'var(--neutral-600)' }}>
                    <li>• Perfil e informações pessoais</li>
                    <li>• Torneios criados e participações</li>
                    <li>• Resultados e histórico de partidas</li>
                    <li>• Consentimentos registrados</li>
                    <li>• Dados de pagamento</li>
                  </ul>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 space-y-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="label">Senha atual *</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--neutral-400)' }}>
                  Confirme sua senha para prosseguir com a exclusão.
                </p>
              </div>

              <div>
                <label htmlFor="reason" className="label">Motivo (opcional)</label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Nos ajude a melhorar contando o motivo da exclusão..."
                />
              </div>

              <button type="submit" className="btn-danger">
                Excluir Minha Conta
              </button>
            </form>
          </>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative rounded-2xl p-6 max-w-sm w-full shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Confirmar exclusão
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--neutral-400)' }}>
              Tem certeza de que deseja excluir sua conta? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletion}
                className="btn-danger"
                disabled={submitting}
              >
                {submitting ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
