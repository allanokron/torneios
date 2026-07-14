"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

interface ConsentRecord {
  id: string
  documentTitle: string
  documentSlug: string
  version: string
  acceptedAt: string
  status: "active" | "revoked"
}

export default function ConsentPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null)
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)

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
          fetch("/api/legal/consent", {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(consentData => {
              if (consentData.consents) {
                setConsents(consentData.consents)
              }
              setLoading(false)
            })
            .catch(() => setLoading(false))
        } else {
          setLoading(false)
        }
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
            Histórico de Consentimentos
          </h1>
        </div>

        <p className="mb-8 text-sm" style={{ color: 'var(--neutral-400)' }}>
          Visualize todos os consentimentos que você registrou na plataforma.
        </p>

        {consents.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>
              Nenhum consentimento registrado
            </h3>
            <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
              Quando você aceitar nossos documentos legais, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {consents.map((consent) => (
              <div
                key={consent.id}
                className="rounded-2xl p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/legal/${consent.documentSlug}`}
                        className="font-semibold text-sm hover:underline"
                        style={{ color: 'var(--text)' }}
                      >
                        {consent.documentTitle}
                      </Link>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: consent.status === "active"
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                          color: consent.status === "active"
                            ? 'var(--success)'
                            : 'var(--danger)'
                        }}
                      >
                        {consent.status === "active" ? "Ativo" : "Revogado"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 text-xs"
                      style={{ color: 'var(--neutral-400)' }}
                    >
                      <span>v{consent.version}</span>
                      <span>•</span>
                      <span>
                        Aceito em {new Date(consent.acceptedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
