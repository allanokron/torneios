import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900">TennisPro</span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm">
              Plataforma completa para criação e gerenciamento de torneios de tênis.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Torneios
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Criar Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>contato@tennispro.com.br</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} TennisPro
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
