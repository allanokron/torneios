"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

const dataCategories = [
  {
    title: "Dados do Perfil",
    description: "Nome, e-mail, telefone, cidade, estado, data de nascimento, biografia, foto.",
    icon: "👤"
  },
  {
    title: "Configurações de Jogo",
    description: "Nível de jogo, mão dominante e preferências pessoais.",
    icon: "🎾"
  },
  {
    title: "Torneios",
    description: "Torneios criados e nos quais você participou.",
    icon: "🏆"
  },
  {
    title: "Partidas",
    description: "Resultados, placares e histórico de partidas.",
    icon: "📊"
  },
  {
    title: "Consentimentos",
    description: "Registro de consentimentos de documentos legais.",
    icon: "📋"
  },
  {
    title: "Atividade na Plataforma",
    description: "Datas de acesso, ações realizadas e preferências de uso.",
    icon: "📈"
  }
]

export default function UserDataPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")

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

  const handleDownload = async () => {
    setDownloading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/legal/user-data", {
        headers: { Authorization: `Bearer ${token}` || "" }
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Erro ao baixar dados")
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `torneio-meu-dados-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setDownloading(false)
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
            Baixar Meus Dados
          </h1>
        </div>

        <p className="mb-8 text-sm" style={{ color: 'var(--neutral-400)' }}>
          Solicite a exportação de todos os seus dados pessoais armazenados na plataforma Torneio+.
          Os dados serão fornecidos em formato JSON.
        </p>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
            Dados incluídos na exportação:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dataCategories.map((category) => (
              <div
                key={category.title}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--neutral-50)' }}
              >
                <span className="text-lg">{category.icon}</span>
                <div>
                  <h3 className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {category.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                Exportar dados
              </h3>
              <p className="text-xs" style={{ color: 'var(--neutral-400)' }}>
                O arquivo JSON conterá todos os seus dados pessoais e de uso da plataforma.
              </p>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Baixando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar Meus Dados
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
