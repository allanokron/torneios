import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[var(--graphite-dark)] text-white mt-auto">
      {/* Court Lines Decoration */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white rounded-lg"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--court-green)] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🎾</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">TennisPro</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Gestão de Torneios
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Plataforma completa para criação e gerenciamento de torneios de tênis. 
                Organize, participe e acompanhe competições com facilidade.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Links Rápidos</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-[var(--ball-yellow)] text-sm transition-colors">
                    Início
                  </Link>
                </li>
                <li>
                  <Link href="/tournaments" className="text-gray-400 hover:text-[var(--ball-yellow)] text-sm transition-colors">
                    Torneios
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-gray-400 hover:text-[var(--ball-yellow)] text-sm transition-colors">
                    Criar Conta
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <span>contato@tennispro.com.br</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📍</span>
                  <span>São Paulo, SP</span>
                </li>
              </ul>
              
              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                <a
                  href="#"
                  className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-[var(--court-green)] transition-colors"
                  aria-label="Instagram"
                >
                  <span>📷</span>
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-[var(--court-green)] transition-colors"
                  aria-label="Twitter"
                >
                  <span>🐦</span>
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-[var(--court-green)] transition-colors"
                  aria-label="Facebook"
                >
                  <span>👤</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} TennisPro. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}