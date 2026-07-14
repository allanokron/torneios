"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

const requestTypes = [
  { value: "access", label: "Acesso aos dados" },
  { value: "correction", label: "Correção de dados" },
  { value: "deletion", label: "Exclusão de dados" },
  { value: "portability", label: "Portabilidade de dados" },
  { value: "revocation", label: "Revogação de consentimento" },
  { value: "information", label: "Informações sobre tratamento" },
  { value: "other", label: "Outros" }
]

export default function LGPDRequestPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    requestType: "",
    message: ""
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user)
            setFormData(prev => ({
              ...prev,
              name: data.user.name || "",
              email: data.user.email || ""
            }))
          }
        })
        .catch(() => {})
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/legal/lgpd-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao enviar solicitação")
        return
      }

      setSuccess(true)
      setFormData({ name: "", email: "", cpf: "", requestType: "", message: "" })
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/legal" style={{ color: 'var(--neutral-400)' }} className="hover:opacity-70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Solicitação LGPD
          </h1>
        </div>

        <p className="mb-8 text-sm" style={{ color: 'var(--neutral-400)' }}>
          Exercite seus direitos como titular de dados conforme a Lei Geral de Proteção de Dados (LGPD).
          Preencha o formulário abaixo e entraremos em contato.
        </p>

        {success && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="font-semibold" style={{ color: 'var(--success)' }}>Solicitação enviada!</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--neutral-600)' }}>
              Sua solicitação foi registrada com sucesso. Entraremos em contato pelo e-mail informado em até 15 dias úteis.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="btn-primary text-sm mt-4"
            >
              Nova solicitação
            </button>
          </div>
        )}

        {!success && (
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
              <label htmlFor="name" className="label">Nome completo *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">E-mail *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="cpf" className="label">CPF (opcional)</label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                value={formData.cpf}
                onChange={handleChange}
                className="input"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label htmlFor="requestType" className="label">Tipo de solicitação *</label>
              <select
                id="requestType"
                name="requestType"
                required
                value={formData.requestType}
                onChange={handleChange}
                className="input"
              >
                <option value="">Selecione o tipo de solicitação</option>
                {requestTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="label">Mensagem *</label>
              <textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                className="input"
                rows={5}
                placeholder="Descreva sua solicitação detalhadamente..."
              />
            </div>

            <div
              className="rounded-xl p-4 text-xs"
              style={{ background: 'var(--neutral-50)', color: 'var(--neutral-500)' }}
            >
              <p>
                Ao enviar esta solicitação, você autoriza o tratamento dos dados informados exclusivamente para
                responder à sua demanda. Os dados serão processados conforme a LGPD e eliminados após o atendimento.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
