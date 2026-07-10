"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    state: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta")
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

  const states = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO"
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[var(--court-green)] rounded-2xl flex items-center justify-center court-lines">
              <span className="text-white font-bold text-3xl">🎾</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-[var(--court-green)] hover:text-[var(--court-green-dark)]">
              Entre aqui
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="label">
                  Nome completo *
                </label>
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
                <label htmlFor="email" className="label">
                  E-mail *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Senha *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirmar senha *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input"
                  placeholder="Repita a senha"
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="label">
                    Cidade
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                    placeholder="Sua cidade"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="label">
                    Estado
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">UF</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}