"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface HeaderProps {
  user?: {
    name: string
    avatarUrl?: string
  } | null
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[var(--court-green)] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
              <span className="text-white font-bold text-xl">🎾</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-[var(--court-green)] transition-colors">
                TennisPro
              </h1>
              <p className="text-[10px] text-gray-500 -mt-1 uppercase tracking-wider">
                Gestão de Torneios
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`nav-tab ${isActive("/") ? "nav-tab-active" : "nav-tab-inactive"}`}
            >
              Início
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`nav-tab ${isActive("/dashboard") ? "nav-tab-active" : "nav-tab-inactive"}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/tournaments"
                  className={`nav-tab ${isActive("/tournaments") ? "nav-tab-active" : "nav-tab-inactive"}`}
                >
                  Torneios
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/tournaments/new"
                  className="hidden sm:flex btn-primary text-sm"
                >
                  <span className="mr-1">+</span> Criar Torneio
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-[var(--court-green)] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.name.split(" ")[0]}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Meu Perfil
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Dashboard
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => {
                        localStorage.removeItem("token")
                        window.location.href = "/"
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-secondary text-sm">
                  Entrar
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden border-t border-gray-100">
          <nav className="flex overflow-x-auto">
            <Link
              href="/dashboard"
              className={`flex-1 text-center py-3 text-xs font-medium ${
                isActive("/dashboard")
                  ? "text-[var(--court-green)] border-b-2 border-[var(--court-green)]"
                  : "text-gray-500"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/tournaments"
              className={`flex-1 text-center py-3 text-xs font-medium ${
                isActive("/tournaments")
                  ? "text-[var(--court-green)] border-b-2 border-[var(--court-green)]"
                  : "text-gray-500"
              }`}
            >
              Torneios
            </Link>
            <Link
              href="/tournaments/new"
              className={`flex-1 text-center py-3 text-xs font-medium ${
                isActive("/tournaments/new")
                  ? "text-[var(--court-green)] border-b-2 border-[var(--court-green)]"
                  : "text-gray-500"
              }`}
            >
              + Criar
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}