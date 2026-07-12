"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 2MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const token = localStorage.getItem("token")
        const res = await fetch(`/api/users/${user?.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatarUrl: base64 })
        })
        const data = await res.json()
        if (res.ok) {
          setUser(data.user)
          setSuccess("Foto atualizada!")
        } else {
          setError(data.error || "Erro ao-upload foto")
        }
        setUploading(false)
      }
      reader.onerror = () => {
        setError("Erro ao ler arquivo")
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError("Erro ao-upload foto")
      setUploading(false)
    }
  }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h2 className="text-xl font-semibold text-gray-900">Meu Perfil</h2>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-2xl font-bold overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                {uploading ? "Enviando..." : "Alterar foto"}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG ou PNG, máx. 2MB. Recomendado: 400x400px.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={user?.email || ""}
              className="input w-full bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">E-mail não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input w-full"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select name="state" value={formData.state} onChange={handleChange} className="input w-full">
                <option value="">UF</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível de jogo</label>
              <select name="gameLevel" value={formData.gameLevel} onChange={handleChange} className="input w-full">
                <option value="">Selecione</option>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
                <option value="professional">Profissional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mão dominante</label>
              <select name="dominantHand" value={formData.dominantHand} onChange={handleChange} className="input w-full">
                <option value="">Selecione</option>
                <option value="right">Destro</option>
                <option value="left">Canhoto</option>
                <option value="ambidextrous">Ambidestro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="input w-full"
              rows={3}
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
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
