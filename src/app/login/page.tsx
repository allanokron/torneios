"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [pendingToken, setPendingToken] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentError, setConsentError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login")
        return
      }

      if (data.needsConsent) {
        setPendingToken(data.token)
        setShowConsentModal(true)
        return
      }

      localStorage.setItem("token", data.token)
      router.push("/dashboard")
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleConsent = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      setConsentError("Você deve aceitar os Termos de Uso e a Política de Privacidade")
      return
    }
    setConsentLoading(true)
    setConsentError("")
    try {
      const res = await fetch("/api/legal/consents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pendingToken}`
        },
        body: JSON.stringify({ consents: [
          { documentSlug: "terms-of-use", accepted: acceptedTerms },
          { documentSlug: "privacy-policy", accepted: acceptedPrivacy },
          { documentSlug: "cookies", accepted: marketingConsent }
        ]})
      })
      if (!res.ok) throw new Error("Erro ao salvar consentimentos")
      localStorage.setItem("token", pendingToken)
      router.push("/dashboard")
    } catch {
      setConsentError("Erro ao salvar consentimentos. Tente novamente.")
    } finally {
      setConsentLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header />
      
      <main className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-center text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            Entrar
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--neutral-400)' }}>
            ou{" "}
            <Link href="/register" className="font-medium" style={{ color: 'var(--accent-dark)' }}>
              criar uma conta
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="py-8 px-6 shadow-sm rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="label">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border rounded focus:ring-2"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--neutral-500)' }}>Lembrar de mim</span>
                </label>
                <a href="#" className="text-sm" style={{ color: 'var(--accent-dark)' }}>
                  Esqueceu a senha?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Aceite os Termos
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--neutral-400)' }}>
              Para continuar, aceite nossos documentos legais:
            </p>

            {consentError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {consentError}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--accent-dark)] focus:ring-[var(--accent-dark)]" />
                <span className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                  Aceito os <a href="/legal/terms-of-use" target="_blank" className="underline" style={{ color: 'var(--accent-dark)' }}>Termos de Uso</a> *
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--accent-dark)] focus:ring-[var(--accent-dark)]" />
                <span className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                  Aceito a <a href="/legal/privacy-policy" target="_blank" className="underline" style={{ color: 'var(--accent-dark)' }}>Política de Privacidade</a> *
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--accent-dark)] focus:ring-[var(--accent-dark)]" />
                <span className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                  Quero receber novidades por e-mail (opcional)
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConsentModal(false)} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--neutral-400)' }}>
                Cancelar
              </button>
              <button onClick={handleConsent} disabled={consentLoading} className="flex-1 btn-primary disabled:opacity-50">
                {consentLoading ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
