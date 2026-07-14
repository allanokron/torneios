import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        background: 'var(--primary)',
        borderTop: '1px solid rgba(184, 224, 0, 0.1)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--accent)' }}>
                <Image src="/images/logo.png" alt="Torneio+" fill className="object-cover" />
              </div>
              <span className="text-lg text-white" style={{ letterSpacing: '-0.02em' }}>
                Torneio<span style={{ color: 'var(--accent)' }}>+</span>
              </span>
            </div>
            <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Plataforma completa para criação e gerenciamento de torneios de tênis.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm text-white/60 mb-3">Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Início
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Torneios
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Criar Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-sm text-white/60 mb-3">Contato</h4>
            <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <li>contato@torneioplus.com.br</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
        </div>

        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} Torneio+. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
