"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"

interface DocumentContent {
  title: string
  version: string
  lastUpdated: string
  content: string
}

const documents: Record<string, DocumentContent> = {
  "privacy-policy": {
    title: "Política de Privacidade",
    version: "1.0",
    lastUpdated: "14/07/2026",
    content: `
      <h2>1. Introdução</h2>
      <p>A presente Política de Privacidade descreve como o Torneio+ coleta, usa, armazena e protege as informações dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>

      <h2>2. Dados Coletados</h2>
      <p>Podemos coletar os seguintes tipos de dados:</p>
      <ul>
        <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, data de nascimento, cidade e estado.</li>
        <li><strong>Dados de perfil:</strong> foto, biografia, nível de jogo, mão dominante.</li>
        <li><strong>Dados de uso:</strong> informações sobre como você utiliza a plataforma, incluindo torneios criados, participações e resultados.</li>
        <li><strong>Dados de pagamento:</strong> informações necessárias para processar assinaturas e pagamentos.</li>
      </ul>

      <h2>3. Uso dos Dados</h2>
      <p>Os dados coletados são utilizados para:</p>
      <ul>
        <li>Fornecer e manter os serviços da plataforma;</li>
        <li>Gerenciar torneios e participações;</li>
        <li>Processar pagamentos;</li>
        <li>Comunicar atualizações e informações relevantes;</li>
        <li>Melhorar a experiência do usuário;</li>
        <li>Cumprir obrigações legais.</li>
      </ul>

      <h2>4. Compartilhamento de Dados</h2>
      <p>Não compartilhamos dados pessoais com terceiros, exceto:</p>
      <ul>
        <li>Quando necessário para cumprir obrigações legais;</li>
        <li>Com prestadores de serviços que auxiliam na operação da plataforma;</li>
        <li>Com seu consentimento expresso.</li>
      </ul>

      <h2>5. Segurança dos Dados</h2>
      <p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, alterações, divulgações ou destruição.</p>

      <h2>6. Seus Direitos</h2>
      <p>Conforme a LGPD, você tem direito a:</p>
      <ul>
        <li>Confirmar a existência de tratamento de dados;</li>
        <li>Acessar seus dados;</li>
        <li>Corrigir dados incompletos ou desatualizados;</li>
        <li>Solicitar a exclusão de dados;</li>
        <li>Solicitar a portabilidade de dados;</li>
        <li>Revogar o consentimento.</li>
      </ul>

      <h2>7. Retenção de Dados</h2>
      <p>Seus dados serão mantidos pelo tempo necessário para cumprir as finalidades para as quais foram coletados, salvo exceções previstas em lei.</p>

      <h2>8. Contato</h2>
      <p>Para exercer seus direitos ou esclarecer dúvidas, entre em contato pelo e-mail: contato@torneioplus.com.br</p>
    `
  },
  "terms-of-use": {
    title: "Termos de Uso",
    version: "1.0",
    lastUpdated: "14/07/2026",
    content: `
      <h2>1. Aceitação dos Termos</h2>
      <p>Ao utilizar a plataforma Torneio+, você concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.</p>

      <h2>2. Descrição do Serviço</h2>
      <p>O Torneio+ é uma plataforma online para criação e gerenciamento de torneios de tênis, oferecendo ferramentas para organização, participação e acompanhamento de competições.</p>

      <h2>3. Cadastro</h2>
      <p>Para utilizar a plataforma, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais.</p>

      <h2>4. Uso Aceitável</h2>
      <p>Ao utilizar o Torneio+, você concorda em:</p>
      <ul>
        <li>Não utilizar a plataforma para fins ilícitos;</li>
        <li>Não interferir no funcionamento da plataforma;</li>
        <li>Não acessar dados de outros usuários sem autorização;</li>
        <li>Respeitar os direitos de outros usuários.</li>
      </ul>

      <h2>5. Propriedade Intelectual</h2>
      <p>Todo o conteúdo e tecnologia da plataforma são de propriedade do Torneio+ e protegidos por leis de propriedade intelectual.</p>

      <h2>6. Limitação de Responsabilidade</h2>
      <p>O Torneio+ não se responsabiliza por danos decorrentes do uso inadequado da plataforma ou por eventos realizados por terceiros.</p>

      <h2>7. Modificações</h2>
      <p>Estes termos podem ser atualizados a qualquer momento. O uso continuado da plataforma após alterações constitui aceitação das mudanças.</p>
    `
  },
  "cookies": {
    title: "Política de Cookies",
    version: "1.0",
    lastUpdated: "14/07/2026",
    content: `
      <h2>1. O que são Cookies</h2>
      <p>Cookies são pequenos arquivos armazenados no seu dispositivo quando você visita um site. Eles ajudam a melhorar sua experiência de navegação.</p>

      <h2>2. Como Usamos Cookies</h2>
      <p>Utilizamos cookies para:</p>
      <ul>
        <li><strong>Cookies essenciais:</strong> Necessários para o funcionamento básico da plataforma (autenticação, sessão).</li>
        <li><strong>Cookies de preferências:</strong> Armazenam suas configurações e preferências.</li>
        <li><strong>Cookies de analytics:</strong> Nos ajudam a entender como os usuários utilizam a plataforma.</li>
      </ul>

      <h2>3. Gerenciando Cookies</h2>
      <p>Você pode gerenciar cookies nas configurações do seu navegador. Note que desabilitar cookies essenciais pode afetar o funcionamento da plataforma.</p>

      <h2>4. Cookies de Terceiros</h2>
      <p>Podemos utilizar serviços de terceiros que coletam informações através de cookies, como ferramentas de analytics.</p>
    `
  },
  "payments": {
    title: "Política de Pagamentos",
    version: "1.0",
    lastUpdated: "14/07/2026",
    content: `
      <h2>1. Planos e Assinaturas</h2>
      <p>O Torneio+ oferece diferentes planos de assinatura com funcionalidades variadas. Os valores e condições estão disponíveis na página de planos.</p>

      <h2>2. Formas de Pagamento</h2>
      <p>Aceitamos as seguintes formas de pagamento:</p>
      <ul>
        <li>Cartão de crédito;</li>
        <li>Boleto bancário;</li>
        <li>PIX.</li>
      </ul>

      <h2>3. Cobrança</h2>
      <p>Assinaturas são cobradas mensalmente ou anualmente, conforme o plano escolhido. O primeiro pagamento é efetuado no momento da assinatura.</p>

      <h2>4. Reembolsos</h2>
      <p>Reembolsos podem ser solicitados dentro de 7 dias após a primeira cobrança, conforme o Código de Defesa do Consumidor.</p>

      <h2>5. Cancelamento</h2>
      <p>O cancelamento pode ser solicitado a qualquer momento. O acesso aos serviços premium continua até o final do período já pago.</p>
    `
  },
  "cancellation": {
    title: "Política de Cancelamento",
    version: "1.0",
    lastUpdated: "14/07/2026",
    content: `
      <h2>1. Como Cancelar</h2>
      <p>Para cancelar sua assinatura, acesse as configurações da sua conta em Configurações > Conta > Gerenciar assinatura.</p>

      <h2>2. Efeitos do Cancelamento</h2>
      <p>Após o cancelamento:</p>
      <ul>
        <li>O acesso premium continua até o final do período já pago;</li>
        <li>Seus dados são mantidos por 30 dias após o término do período;</li>
        <li>Após 30 dias, os dados podem ser removidos permanentemente.</li>
      </ul>

      <h2>3. Reembolso</h2>
      <p>O cancelamento não garante reembolso proporcional, salvo nos casos previstos em lei ou na Política de Pagamentos.</p>

      <h2>4. Reativação</h2>
      <p>Você pode reativar sua assinatura a qualquer momento, sujeito à disponibilidade dos planos.</p>
    `
  },
  "security": {
    title: "Segurança da Informação",
    version: "1.0",
    lastUpdated: "14/07/2026",
    content: `
      <h2>1. Compromisso com a Segurança</h2>
      <p>O Torneio+ leva a segurança dos seus dados a sério e adota múltiplas camadas de proteção.</p>

      <h2>2. Medidas Técnicas</h2>
      <ul>
        <li>Criptografia TLS/SSL para todas as transmissões de dados;</li>
        <li>Senhas armazenadas com hashing seguro (bcrypt);</li>
        <li>Autenticação segura com tokens JWT;</li>
        <li>Monitoramento contínuo de vulnerabilidades;</li>
        <li>Backups regulares e criptografados.</li>
      </ul>

      <h2>3. Medidas Organizacionais</h2>
      <ul>
        <li>Acesso restrito a dados pessoais apenas a colaboradores autorizados;</li>
        <li>Treinamento em segurança da informação;</li>
        <li>Políticas de acesso baseadas em necessidade.</li>
      </ul>

      <h2>4. Incidentes de Segurança</h2>
      <p>Em caso de incidente de segurança que afete seus dados, você será notificado em até 72 horas, conforme a LGPD.</p>

      <h2>5. Contato</h2>
      <p>Para reportar vulnerabilidades ou dúvidas sobre segurança, entre em contato: contato@torneioplus.com.br</p>
    `
  },
  "lgpd": {
    title: "LGPD - Lei Geral de Proteção de Dados",
    version: "1.0",
    lastUpdated: "14/07/2026",
    content: `
      <h2>1. Nosso Compromisso</h2>
      <p>O Torneio+ está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e compromete-se a proteger os dados pessoais dos seus usuários.</p>

      <h2>2. Base Legal para Tratamento</h2>
      <p>Tratamos seus dados com base em:</p>
      <ul>
        <li><strong>Consentimento:</strong> Quando você autoriza expressamente;</li>
        <li><strong>Execução de contrato:</strong> Para fornecer os serviços solicitados;</li>
        <li><strong>Legítimo interesse:</strong> Para melhorar nossos serviços;</li>
        <li><strong>Obrigação legal:</strong> Quando exigido por lei.</li>
      </ul>

      <h2>3. Seus Direitos como Titular</h2>
      <p>Conforme a LGPD, você tem direito a:</p>
      <ul>
        <li><strong>Confirmação e acesso:</strong> Confirmar se tratamos seus dados e acessá-los;</li>
        <li><strong>Correção:</strong> Corrigir dados incompletos ou desatualizados;</li>
        <li><strong>Anonimização, bloqueio ou exclusão:</strong> De dados desnecessários ou excessivos;</li>
        <li><strong>Portabilidade:</strong> Solicitar a transferência dos seus dados;</li>
        <li><strong>Eliminação:</strong> Solicitar a exclusão dos dados tratados com consentimento;</li>
        <li><strong>Informação:</strong> Sobre compartilhamento de dados com terceiros;</li>
        <li><strong>Revogação:</strong> Do consentimento, a qualquer momento.</li>
      </ul>

      <h2>4. Como Exercer seus Direitos</h2>
      <p>Para exercer qualquer um dos seus direitos, utilize o formulário de solicitação LGPD disponível em nossa Central Jurídica ou entre em contato pelo e-mail: contato@torneioplus.com.br</p>

      <h2>5. Encarregado de Dados (DPO)</h2>
      <p>O encarregado pelo tratamento de dados pessoais pode ser contactado pelo e-mail: contato@torneioplus.com.br</p>

      <h2>6. Transferência Internacional de Dados</h2>
      <p>Seus dados podem ser transferidos para servidores fora do Brasil apenas quando necessário para prestação dos serviços, com as devidas garantias de proteção.</p>
    `
  }
}

export default function LegalDocumentPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [user, setUser] = useState<{ name: string; avatarUrl?: string } | null>(null)

  const doc = documents[slug]

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user)
        })
        .catch(() => {})
    }
  }, [])

  if (!doc) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
        <Header user={user} />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/legal" style={{ color: 'var(--neutral-400)' }} className="hover:opacity-70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
              Documento não encontrado
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>
            O documento solicitado não foi encontrado.
          </p>
          <Link href="/legal" className="btn-primary text-sm mt-4 inline-flex">
            Voltar para Central Jurídica
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header user={user} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/legal" style={{ color: 'var(--neutral-400)' }} className="hover:opacity-70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            {doc.title}
          </h1>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between text-xs mb-6 pb-4"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--neutral-400)' }}
          >
            <span>Versão {doc.version}</span>
            <span>Última atualização: {doc.lastUpdated}</span>
          </div>

          <div
            className="prose prose-sm max-w-none"
            style={{ color: 'var(--text)' }}
            dangerouslySetInnerHTML={{ __html: doc.content }}
          />
        </div>

        <div className="mt-8">
          <Link href="/legal/lgpd-request" className="btn-primary text-sm">
            Solicitar atendimento LGPD
          </Link>
        </div>
      </main>
    </div>
  )
}
