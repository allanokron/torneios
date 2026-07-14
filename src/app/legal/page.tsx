"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

interface LegalDocument {
  title: string
  slug: string
  description: string
  version: string
  lastUpdated: string
  icon: string
}

const documents: LegalDocument[] = [
  {
    title: "Política de Privacidade",
    slug: "privacy-policy",
    description: "Como coletamos, usamos e protegemos seus dados pessoais.",
    version: "1.0",
    lastUpdated: "14/07/2026",
    icon: "🔒"
  },
  {
    title: "Termos de Uso",
    slug: "terms-of-use",
    description: "Regras e condições para uso da plataforma Torneio+.",
    version: "1.0",
    lastUpdated: "14/07/2026",
    icon: "📋"
  },
  {
    title: "Política de Cookies",
    slug: "cookies",
    description: "Informações sobre o uso de cookies e tecnologias semelhantes.",
    version: "1.0",
    lastUpdated: "14/07/2026",
    icon: "🍪"
  },
  {
    title: "Política de Pagamentos",
    slug: "payments",
    description: "Termos e condições relacionados a pagamentos e assinaturas.",
    version: "1.0",
    lastUpdated: "14/07/2026",
    icon: "💳"
  },
  {
    title: "Política de Cancelamento",
    slug: "cancellation",
    description: "Regras para cancelamento de assinaturas e reembolsos.",
    version: "1.0",
    lastUpdated: "14/07/2026",
    icon: "❌"
  },
  {
    title: "Segurança da Informação",
    slug: "security",
    description: "Medidas de segurança adotadas para proteção dos seus dados.",
    version: "1.0",
    lastUpdated: "14/07/2026",
    icon: "🛡️"
  },
  {
    title: "LGPD",
    slug: "lgpd",
    description: "Seus direitos como titular de dados sob a Lei Geral de Proteção de Dados.",
    version: "1.0",
    lastUpdated: "14/07/2026",
    icon: "⚖️"
  }
]

export default function LegalCenterPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user)
        })
        .catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" style={{ color: 'var(--neutral-400)' }} className="hover:opacity-70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Central Jurídica
          </h1>
        </div>

        <p className="mb-8 text-sm" style={{ color: 'var(--neutral-400)' }}>
          Acesse nossos documentos legais e políticas da plataforma.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Link
              key={doc.slug}
              href={`/legal/${doc.slug}`}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-sm group-hover:underline"
                    style={{ color: 'var(--text)' }}
                  >
                    {doc.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--neutral-400)' }}>
                {doc.description}
              </p>
              <div
                className="flex items-center justify-between text-xs pt-3"
                style={{ borderTop: '1px solid var(--border)', color: 'var(--neutral-400)' }}
              >
                <span>v{doc.version}</span>
                <span>Atualizado em {doc.lastUpdated}</span>
              </div>
            </Link>
          ))}
        </div>

        <div
          className="mt-8 rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>
            Solicitações LGPD
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--neutral-400)' }}>
            Exercite seus direitos como titular de dados conforme a Lei Geral de Proteção de Dados (LGPD).
          </p>
          <Link href="/legal/lgpd-request" className="btn-primary text-xs">
            Solicitar atendimento LGPD
          </Link>
        </div>
      </main>
    </div>
  )
}
