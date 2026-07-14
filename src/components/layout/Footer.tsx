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
          className="mt-8 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <h4 className="text-sm text-white/60 mb-3">Documentos Legais</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/privacy-policy" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/legal/terms-of-use" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/legal/lgpd" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  LGPD
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Cookies
                </Link>
              </li>
              <li>
                <a href="mailto:contato@okron.com.br" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  contato@okron.com.br
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-end sm:items-end">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              © {new Date().getFullYear()} Torneio+. Todos os direitos reservados.
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Versão 1.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
