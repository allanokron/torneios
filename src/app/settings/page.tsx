"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

type Tab = "privacy" | "account"

const privacyLinks = [
  { title: "Política de Privacidade", description: "Como coletamos e usamos seus dados", href: "/legal/privacy-policy", icon: "🔒" },
  { title: "Termos de Uso", description: "Regras e condições da plataforma", href: "/legal/terms-of-use", icon: "📋" },
  { title: "Política de Cookies", description: "Uso de cookies e tecnologias", href: "/legal/cookies", icon: "🍪" },
  { title: "Segurança", description: "Medidas de proteção dos seus dados", href: "/legal/security", icon: "🛡️" },
  { title: "LGPD", description: "Seus direitos como titular de dados", href: "/legal/lgpd", icon: "⚖️" },
  { title: "Solicitação LGPD", description: "Exercite seus direitos de dados", href: "/legal/lgpd-request", icon: "📝" },
  { title: "Histórico de Consentimentos", description: "Veja seus consentimentos registrados", href: "/legal/consent", icon: "📜" },
  { title: "Baixar Meus Dados", description: "Exporte todos os seus dados", href: "/legal/user-data", icon: "📥" },
  { title: "Excluir Minha Conta", description: "Remova permanentemente sua conta", href: "/legal/account-deletion", icon: "🗑️" }
]

const accountLinks = [
  { title: "Alterar Senha", description: "Atualize sua senha de acesso", href: "/profile", icon: "🔑" },
  { title: "Alterar E-mail", description: "Atualize seu endereço de e-mail", href: "/profile", icon: "📧" },
  { title: "Alterar Telefone", description: "Atualize seu número de telefone", href: "/profile", icon: "📱" },
  { title: "Gerenciar Consentimentos", description: "Veja e revogue consentimentos", href: "/legal/consent", icon: "📋" }
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("privacy")

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
      </div>
    )
  }

  const links = activeTab === "privacy" ? privacyLinks : accountLinks

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" style={{ color: 'var(--neutral-400)' }} className="hover:opacity-70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Configurações
          </h1>
        </div>

        <div
          className="flex border-b mb-8"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setActiveTab("privacy")}
            className={`nav-tab ${activeTab === "privacy" ? "nav-tab-active" : ""}`}
          >
            Privacidade
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`nav-tab ${activeTab === "account" ? "nav-tab-active" : ""}`}
          >
            Conta
          </button>
        </div>

        <div className="space-y-3">
          {links.map((link) => (
            <Link
              key={link.href + link.title}
              href={link.href}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow group"
            >
              <span className="text-2xl">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm group-hover:underline"
                  style={{ color: 'var(--text)' }}
                >
                  {link.title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                  {link.description}
                </p>
              </div>
              <svg
                className="w-4 h-4 flex-shrink-0"
                style={{ color: 'var(--neutral-300)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
