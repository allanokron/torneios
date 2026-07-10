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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">TennisPro</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive("/") ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Início
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive("/dashboard") ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/tournaments"
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive("/tournaments") ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Torneios
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/tournaments/new"
                  className="hidden sm:flex items-center gap-1.5 btn-primary text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar Torneio
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-sm font-medium">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </button>
                  
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    </div>
                    <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Meu Perfil
                    </Link>
                    <Link href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => {
                        localStorage.removeItem("token")
                        window.location.href = "/"
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-xs">
                  Entrar
                </Link>
                <Link href="/register" className="btn-primary text-xs">
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
          <nav className="flex">
            <Link
              href="/dashboard"
              className={`flex-1 text-center py-2.5 text-xs font-medium ${
                isActive("/dashboard") ? "text-green-600 border-b-2 border-green-600" : "text-gray-500"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/tournaments"
              className={`flex-1 text-center py-2.5 text-xs font-medium ${
                isActive("/tournaments") ? "text-green-600 border-b-2 border-green-600" : "text-gray-500"
              }`}
            >
              Torneios
            </Link>
            <Link
              href="/tournaments/new"
              className={`flex-1 text-center py-2.5 text-xs font-medium ${
                isActive("/tournaments/new") ? "text-green-600 border-b-2 border-green-600" : "text-gray-500"
              }`}
            >
              Criar
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
