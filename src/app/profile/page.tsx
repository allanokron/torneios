"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  city?: string
  state?: string
  birthDate?: string
  bio?: string
  avatarUrl?: string
  gameLevel?: string
  dominantHand?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    state: "",
    birthDate: "",
    bio: "",
    gameLevel: "",
    dominantHand: ""
  })

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
          setFormData({
            name: data.user.name || "",
            phone: data.user.phone || "",
            city: data.user.city || "",
            state: data.user.state || "",
            birthDate: data.user.birthDate ? new Date(data.user.birthDate).toISOString().split("T")[0] : "",
            bio: data.user.bio || "",
            gameLevel: data.user.gameLevel || "",
            dominantHand: data.user.dominantHand || ""
          })
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        router.push("/login")
      })
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao salvar")
        return
      }

      setSuccess("Perfil atualizado com sucesso!")
      setUser(data.user)
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setSaving(false)
    }
  }

  const states = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO"
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--tennis-green)]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[var(--tennis-green)] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🎾</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Torneios</h1>
              </Link>
            </div>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[var(--tennis-green)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="label">Nome completo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Telefone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cidade</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input"
              >
                <option value="">UF</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Data de nascimento</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nível de jogo</label>
              <select
                name="gameLevel"
                value={formData.gameLevel}
                onChange={handleChange}
                className="input"
              >
                <option value="">Selecione</option>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
                <option value="professional">Profissional</option>
              </select>
            </div>

            <div>
              <label className="label">Mão dominante</label>
              <select
                name="dominantHand"
                value={formData.dominantHand}
                onChange={handleChange}
                className="input"
              >
                <option value="">Selecione</option>
                <option value="right">Destro</option>
                <option value="left">Canhoto</option>
                <option value="ambidextrous">Ambidestro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Biografia</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}