"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface HeaderProps {
  user?: {
    name: string
    avatarUrl?: string
  } | null
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  useEffect(() => {
    if (!isProfileMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isProfileMenuOpen])

  const closeProfileMenu = () => setIsProfileMenuOpen(false)

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: 'rgba(7, 28, 51, 0.95)',
        borderBottom: '1px solid rgba(184, 224, 0, 0.1)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--accent)' }}>
              <Image src="/images/logo.png" alt="Torneio+" fill className="object-cover" />
            </div>
            <span className="text-lg text-white hidden sm:block" style={{ letterSpacing: '-0.02em' }}>
              Torneio<span style={{ color: 'var(--accent)' }}>+</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <Link
                  href="/dashboard"
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive("/dashboard")
                      ? "text-white"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}
                  style={isActive("/dashboard") ? { background: 'rgba(184, 224, 0, 0.15)', color: 'var(--accent)' } : {}}
                >
                  Início
                </Link>
                <Link
                  href="/tournaments"
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive("/tournaments")
                      ? "text-white"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}
                  style={isActive("/tournaments") ? { background: 'rgba(184, 224, 0, 0.15)', color: 'var(--accent)' } : {}}
                >
                  Torneios
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/tournaments/new"
                  className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'var(--accent)', color: 'var(--primary)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar Torneio
                </Link>
                
                <div ref={profileMenuRef} className="relative group">
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(open => !open)}
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm overflow-hidden"
                      style={{ background: 'rgba(184, 224, 0, 0.2)', color: 'var(--accent)' }}
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </button>
                  
                  <div
                    role="menu"
                    className={`absolute right-0 mt-1 w-48 rounded-xl shadow-lg border py-1 transition-all duration-150 z-50 ${
                      isProfileMenuOpen
                        ? "opacity-100 visible"
                        : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                    }`}
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>{user.name}</p>
                    </div>
                    <Link href="/dashboard" onClick={closeProfileMenu} className="block px-3 py-2 text-sm hover:bg-black/5" style={{ color: 'var(--neutral-600)' }}>
                      Início
                    </Link>
                    <Link href="/profile" onClick={closeProfileMenu} className="block px-3 py-2 text-sm hover:bg-black/5" style={{ color: 'var(--neutral-600)' }}>
                      Meu Perfil
                    </Link>
                    <hr className="my-1" style={{ borderColor: 'var(--border)' }} />
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

      {user && (
        <div className="md:hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <nav className="flex">
            <Link
              href="/dashboard"
              className="flex-1 text-center py-2.5 text-xs transition-colors"
              style={isActive("/dashboard") ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' } : { color: 'rgba(255,255,255,0.8)' }}
            >
              Início
            </Link>
            <Link
              href="/tournaments"
              className="flex-1 text-center py-2.5 text-xs transition-colors"
              style={isActive("/tournaments") ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' } : { color: 'rgba(255,255,255,0.8)' }}
            >
              Torneios
            </Link>
            <Link
              href="/tournaments/new"
              className="flex-1 text-center py-2.5 text-xs transition-colors"
              style={isActive("/tournaments/new") ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' } : { color: 'rgba(255,255,255,0.8)' }}
            >
              Criar
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
