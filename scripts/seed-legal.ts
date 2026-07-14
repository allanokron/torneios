import "dotenv/config";
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const RESPONSIBLE = {
  name: 'Allan Cuxinier de Oliveira',
  cnpj: '39.732.384/0001-72',
  address: 'Parque Residencial São Camillo, Boituva – SP, Brasil',
  email: 'contato@okron.com.br',
  whatsapp: '+55 15 3191-2964',
};

const documents = [
  {
    slug: 'privacy-policy',
    title: 'Política de Privacidade',
    version: '1.0',
    content: `POLÍTICA DE PRIVACIDADE

Última atualização: Versão 1.0

A sua privacidade é importante para nós. Esta Política de Privacidade descreve como o Okron — plataforma de gestão e organização de torneios esportivos — coleta, utiliza, armazena e protege as informações pessoais dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

1. CONTROLADOR DOS DADOS

O controlador dos dados pessoais coletados por meio desta plataforma é:

Nome: Allan Cuxinier de Oliveira
CNPJ: 39.732.384/0001-72
Endereço: Parque Residencial São Camillo, Boituva – SP, Brasil
E-mail: contato@okron.com.br
WhatsApp: +55 15 3191-2964

2. DADOS COLETADOS

O Okron coleta diferentes tipos de dados pessoais, conforme detalhado abaixo:

2.1 Dados Opcionais
- Foto de perfil
- Biografia ou descrição pessoal
- Informações adicionais de contato (WhatsApp, redes sociais)
- Histórico de partidas e desempenho esportivo

2.2 Dados Obrigatórios
- Nome completo
- E-mail válido
- CPF (quando necessário para fins de pagamento ou identificação)
- Dados de pagamento (processados por meio de intermediadores seguros)

2.3 Dados de Geolocalização
- O Okron pode solicitar acesso à localização do dispositivo para facilitar a identificação de torneios próximos. Essa informação é utilizada apenas quando o autorizada pelo usuário e não é compartilhada com terceiros.

2.4 Dados de Pagamento
- Informações de transações financeiras são processadas exclusivamente por meio de provedores de pagamento seguros. O Okron não armazena números de cartão de crédito ou dados bancários diretamente.

2.5 Dados Esportivos
- Informações sobre participações em torneios, resultados, classificações e histórico de partidas são armazenados para fins de funcionalidade da plataforma e melhoria da experiência do usuário.

2.6 Dados de Partidas
- Placares, estatísticas, composição de times e informações sobre partidas são coletados para o funcionamento adequado da plataforma.

2.7 Conteúdo Enviado pelo Usuário
- Fotos, vídeos, comentários e outros conteúdos enviados voluntariamente pelo usuário para profiles, times ou eventos.

3. FINALIDADE DA COLETA

Os dados pessoais são coletados para as seguintes finalidades:

- Cadastro e autenticação de usuários na plataforma;
- Organização e gestão de torneios esportivos;
- Processamento de pagamentos e assinaturas;
- Comunicação entre usuários, organizadores e participantes;
- Envio de notificações relevantes sobre torneios, partidas e atualizações;
- Melhoria da experiência do usuário e desenvolvimento de novas funcionalidades;
- Cumprimento de obrigações legais e regulatórias;
- Prevenção de fraudes e garantia da segurança da plataforma;
- Geração de estatísticas e relatórios agregados (sem identificação individual).

4. BASE LEGAL PARA O TRATAMENTO (LGPD)

O tratamento dos dados pessoais é fundamentado nas seguintes bases legais da LGPD:

- Art. 7º, I — Consentimento do titular para finalidades específicas;
- Art. 7º, V — Execução de contrato ou de procedimentos preliminares relacionados a contrato;
- Art. 7º, VI — Exercício regular de direitos em processo administrativo ou judicial;
- Art. 7º, IX — Tutela da saúde, em caso de necessidade;
- Art. 7º, VII — Proteção da vida ou da incolumidade física do titular ou de terceiro;
- Art. 7º, VIII — Legítimo interesse do controlador, desde que não prevaleçam os direitos e liberdades fundamentais do titular.

5. PERÍODO DE RETENÇÃO

Os dados pessoais são retidos pelo tempo necessário para cumprir as finalidades para as quais foram coletados, observados os seguintes prazos:

- Dados de cadastro: durante toda a vigência da conta do usuário e por até 5 (cinco) anos após o encerramento da conta;
- Dados de pagamento: conforme exigido pela legislação fiscal e financeira, geralmente por até 5 (cinco) anos;
- Dados de torneios e partidas: mantidos indefinidamente em forma agregada, ou deletados a pedido do titular;
- Dados de comunicação: até 2 (dois) anos após o último acesso do usuário;
- Logs de acesso: até 6 (seis) meses, conforme regulamentação.

6. COMPARTILHAMENTO DE INFORMAÇÕES

O Okron não vende nem aluga dados pessoais a terceiros. Os dados podem ser compartilhados apenas nas seguintes situações:

- Com outros participantes do torneio, de forma limitada ao necessário para a organização do evento;
- Com provedores de serviços de pagamento, exclusivamente para processamento de transações;
- Com autoridades competentes, mediante obrigação legal ou determinação judicial;
- Com prestadores de serviços tecnológicos que auxiliam no funcionamento da plataforma, sob acordos de confidencialidade.

7. MEDIDAS DE SEGURANÇA

O Okron adota medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição, incluindo:

- Criptografia de dados em trânsito (TLS/SSL);
- Criptografia de dados sensíveis em repouso;
- Controles de acesso baseados em perfis;
- Monitoramento contínuo de segurança;
- Backup regular dos dados;
- Auditorias periódicas de segurança.

8. COOKIES

O Okron utiliza cookies e tecnologias similares para melhorar a experiência do usuário. Para mais detalhes, consulte nossa Política de Cookies disponível na plataforma.

9. GEOLOCALIZAÇÃO

O uso de dados de geolocalização é restrito à funcionalidade de localização de torneios próximos e é ativado apenas com consentimento explícito do usuário. O usuário pode desativar o acesso à localização a qualquer momento nas configurações do seu dispositivo.

10. DADOS DE PAGAMENTO

As transações financeiras são processadas por meio de intermediadores de pagamento certificados. O Okron não armazena dados completos de cartões de crédito. Apenas informações parciais (últimos quatro dígitos) podem ser retidas para identificação da transação.

11. DADOS ESPORTIVOS E DE PARTIDAS

As informações sobre desempenho esportivo, participações em torneios e resultados de partidas são utilizadas para o funcionamento da plataforma, geração de classificações e melhoria da experiência competitiva. Esses dados podem ser exibidos publicamente na plataforma, a menos que o usuário solicite restrição.

12. CONTEÚDO ENVIADO PELO USUÁRIO

Conteúdos enviados voluntariamente pelo usuário (fotos, vídeos, comentários) podem ser utilizados para fins de promoção da plataforma e dos torneios, respeitando os direitos de imagem do titular. O usuário pode solicitar a remoção de qualquer conteúdo que tenha enviado.

13. DIREITOS DO TITULAR

Em conformidade com a LGPD, o titular dos dados pessoais tem direito a:

- Solicitar confirmação da existência de tratamento de dados;
- Acessar os dados pessoais tratados;
- Corrigir dados incompletos, inexatos ou desatualizados;
- Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;
- Solicitar a portabilidade dos dados;
- Revogar o consentimento a qualquer momento;
- Solicitar informação sobre o compartilhamento de dados;
- Opor-se ao tratamento, nos termos da lei.

14. COMO EXERCER SEUS DIREITOS

Para exercer qualquer dos direitos acima, o titular pode entrar em contato pelo canal:

E-mail: contato@okron.com.br
WhatsApp: +55 15 3191-2964

As solicitações serão atendidas no prazo de até 15 (quinze) dias úteis, conforme previsto na LGPD.

15. CANAL DE CONTATO

Para qualquer dúvida ou solicitação relacionada a esta Política de Privacidade:

E-mail: contato@okron.com.br
WhatsApp: +55 15 3191-2964
Endereço: Parque Residencial São Camillo, Boituva – SP, Brasil

16. PROCEDIMENTO DE EXCLUSÃO DE CONTA

O usuário pode solicitar a exclusão de sua conta e dados pessoais a qualquer momento pelo canal de contato indicado. Após a solicitação:

- Os dados serão removidos ou anonimizados no prazo de até 30 (trinta) dias;
- Dados obrigatórios retidos por obrigação legal poderão ser mantidos pelo prazo necessário;
- Dados de torneios em andamento poderão ser mantidos até a conclusão do evento.

17. ALTERAÇÕES NESTA POLÍTICA

O Okron reserva-se o direito de alterar esta Política de Privacidade a qualquer momento. As alterações serão comunicadas por meio da plataforma ou por e-mail. O uso continuado da plataforma após as alterações constitui aceitação das novas condições.

18. FORO COMPETENTE

Para dirimir quaisquer questões oriundas desta Política de Privacidade, fica eleito o foro da Comarca de Boituva, Estado de São Paulo, com renúncia a qualquer outro, por mais privilegiado que seja.`,
  },
  {
    slug: 'terms-of-use',
    title: 'Termos de Uso',
    version: '1.0',
    content: `TERMOS DE USO

Última atualização: Versão 1.0

Bem-vindo ao Okron. Ao acessar ou utilizar a plataforma Okron, você concorda com estes Termos de Uso. Leia atentamente antes de prosseguir.

1. OBJETO DA PLATAFORMA

O Okron é uma plataforma digital de gestão e organização de torneios esportivos que permite aos usuários criar, participar, gerenciar e acompanhar competições esportivas de diversas modalidades.

2. DEFINIÇÕES

Para fins destes Termos, considera-se:

- "Plataforma" — o sistema Okron, acessível por meio de aplicativo móvel e/ou navegador web;
- "Usuário" — qualquer pessoa física que se cadastre e utilize a plataforma;
- "Organizador" — o usuário que cria e gerencia torneios na plataforma;
- "Participante" — o usuário que se inscreve em torneios como jogador ou equipe;
- "Assinatura" — o plano de acesso premium oferecido pela plataforma;
- "Conteúdo" — qualquer informação, texto, imagem, vídeo ou dado publicado na plataforma;
- "Torreio" — competição esportiva organizada por meio da plataforma;
- "Inscrição" — formalização da participação de um usuário ou equipe em um torneio.

3. CADASTRO

3.1 Para utilizar a plataforma, o usuário deve realizar cadastro fornecendo informações verdadeiras e atualizadas.

3.2 O usuário é responsável por manter a confidencialidade de suas credenciais de acesso.

3.3 É vedado o cadastro com informações falsas ou de terceiros sem autorização.

3.4 O usuário deve ter no mínimo 18 (dezoito) anos de idade, ou contar com a autorização de responsável legal.

3.5 O Okron reserva-se o direito de suspender ou cancelar cadastros que violem estes Termos.

4. RESPONSABILIDADES DO JOGADOR

O participante se compromete a:

- Participar dos torneios de forma ética e respeitosa;
- Cumprir as regras específicas de cada torneio;
- Manter um comportamento adequado durante as partidas;
- Não utilizar meios fraudulentos ou vantagens indevidas;
- Informar-se sobre horários, local e formato das competições;
- Realizar os pagamentos de inscrição nos prazos estabelecidos.

5. RESPONSABILIDADES DO ORGANIZADOR

O organizador se compromete a:

- Criar torneios com informações claras e precisas;
- Definir regras justas e acessíveis a todos os participantes;
- Gerenciar inscrições, escalas e resultados com transparência;
- Respeitar os direitos dos participantes inscritos;
- Cumprir os prazos e compromissos assumidos com os jogadores;
- Manter comunicação adequada com os participantes;
- Responsabilizar-se pela organização prática dos eventos presenciais.

6. RESPONSABILIDADES DA PLATAFORMA

O Okron se compromete a:

- Manter a plataforma disponível e funcionando adequadamente;
- Proteger os dados pessoais dos usuários conforme a Política de Privacidade;
- Disponibilizar suporte técnico para dúvidas e problemas;
- Informar sobre alterações nos Termos e condições de uso;
- Processar pagamentos de forma segura e transparente;
- Não se responsabilizar por decisões de organizadores ou resultados de partidas.

7. CRIAÇÃO DE TORNEIOS

7.1 O organizador deve fornecer informações completas ao criar um torneio, incluindo: nome, modalidade, formato, regras, datas, horários, local (quando aplicável) e valor da inscrição.

7.2 As regras do torneio devem ser claras, justas e respeitar a legislação vigente.

7.3 O Okron não se responsabiliza por torneios criados com informações incorretas ou enganosas.

7.4 O organizador pode definir limites de participação, requisitos de classificação e critérios de elegibilidade.

7.5 Torneios que violem Termos, regras da plataforma ou legislação poderão ser removidos sem aviso prévio.

8. REGRAS DE ASSINATURA

8.1 O Okron oferece planos de assinatura com diferentes níveis de acesso e funcionalidades.

8.2 O valor da assinatura básica é de R$ 9,90 (nove reais e noventa centavos) por mês.

8.3 A assinatura básica inclui a gestão de até 2 (dois) torneios por mês.

8.4 Para organizar torneios além do limite do plano, é necessário adquirir torneios adicionais ao valor de R$ 4,90 (quatro reais e noventa centavos) por torneio.

8.5 A assinatura é renovada automaticamente ao final de cada período, salvo cancelamento prévio.

8.6 O Okron reserva-se o direito de alterar os valores e condições dos planos, com aviso prévio de 30 (trinta) dias.

9. PAGAMENTOS

9.1 Os pagamentos na plataforma são realizados exclusivamente por meio de PIX.

9.2 Para cada inscrição de participante em torneio pago, o organizador recebe o valor da inscrição descontando-se uma taxa de serviço de R$ 1,00 (um real) por inscrição paga.

9.3 Os valores são creditados na conta do organizador conforme o cronóstico de pagamentos definido pela plataforma.

9.4 O Okron não se responsabiliza por atrasos decorrentes de instituições financeiras.

9.5 Transações suspeitas poderão ser retidas para investigação.

10. REEMBOLSOS

10.1 O reembolso de valores pagos está sujeito às seguintes condições:

- Cancelamento do torneio pelo organizador: reembolso integral aos participantes;
- Desistência do participante com mais de 7 (sete) dias antes do início do torneio: reembolso de 50% (cinquenta por cento) do valor pago;
- Desistência do participante com menos de 7 (sete) dias antes do início: sem reembolso;
- Erros de cobrança ou valores indevidos: reembolso integral.

10.2 Solicitações de reembolso devem ser realizadas pelo canal de contato da plataforma.

10.3 Os reembolsos são processados no prazo de até 10 (dez) dias úteis.

11. SUSPENSÃO DE CONTA

O Okron poderá suspender contas de usuários que:

- Viarem qualquer disposição destes Termos de Uso;
- Praticarem condutas antiéticas ou fraudulentas;
- Permitirem o acesso de terceiros às suas credenciais;
- Manipularem resultados ou partidas;
- Realizarem pagamentos fraudulentos ou indevidos;
- Utilizarem a plataforma para fins ilícitos.

12. CANCELAMENTOS

12.1 O usuário pode cancelar sua assinatura a qualquer momento, com efeito ao final do período vigente.

12.2 O cancelamento não gera direito a reembolso proporcional do período em curso, salvo nos casos previstos em lei.

12.3 O organizador pode cancelar um torneio, sendo responsável pela comunicação aos participantes e pelo reembolso conforme as regras estabelecidas.

12.4 O Okron pode cancelar um torneio que viole as regras da plataforma ou a legislação vigente.

13. PENALIDADES

A violação dos Termos de Uso poderá resultar em:

- Advertência formal;
- Restrição temporária de funcionalidades;
- Suspensão da conta por período determinado;
- Exclusão permanente da plataforma;
- Bloqueio do acesso a funcionalidades de pagamento;
- Comunicação às autoridades competentes, quando aplicável.

14. CONTEÚDO DO USUÁRIO

14.1 O usuário é responsável pelo conteúdo que publica na plataforma, incluindo textos, imagens, vídeos e informações pessoais.

14.2 O conteúdo publicado não deve violar direitos de terceiros, incluindo direitos autorais, direitos de imagem ou direitos de privacidade.

14.3 O Okron reserva-se o direito de remover conteúdo que viole estes Termos ou a legislação vigente.

14.4 Ao publicar conteúdo na plataforma, o usuário concede ao Okron licença não exclusiva para utilização do conteúdo nos termos e para as finalidades da plataforma.

15. PROPRIEDADE INTELECTUAL

15.1 O Okron e seus elementos (marca, logotipo, código-fonte, design, funcionalidades) são protegidos por direitos autorais e propriedade intelectual.

15.2 É vedada a reprodução, distribuição, modificação ou exploração comercial de qualquer elemento da plataforma sem autorização prévia e por escrito do Okron.

15.3 Os dados e estatísticas gerados pela plataforma são de propriedade do Okron, sem prejuízo dos direitos dos usuários sobre seus dados pessoais.

16. LIMITAÇÃO DE RESPONSABILIDADE

16.1 O Okron atua como intermediário tecnológico entre organizadores e participantes.

16.2 O Okron não se responsabiliza por:

- Resultados de partidas ou torneios;
- Condutas de usuários ou terceiros;
- Eventos presenciais organizados por terceiros;
- Danos decorrentes do uso inadequado da plataforma;
- Indisponibilidade temporária da plataforma por motivo de força maior;
- Decisões de organizadores sobre regras, premiações ou resultados.

16.3 Em nenhuma hipótese a responsabilidade total do Okron excederá os valores pagos pelo usuário nos últimos 12 (doze) meses.

17. ALTERAÇÕES NOS TERMOS

O Okron reserva-se o direito de alterar estes Termos de Uso a qualquer momento. As alterações serão comunicadas por meio da plataforma ou por e-mail, com antecedência mínima de 15 (quinze) dias para alterações substanciais. O uso continuado da plataforma após as alterações constitui aceitação das novas condições.

18. FORO COMPETENTE

Para dirimir quaisquer questões oriundas destes Termos de Uso, fica eleito o foro da Comarca de Boituva, Estado de São Paulo, com renúncia a qualquer outro, por mais privilegiado que seja.`,
  },
  {
    slug: 'payments',
    title: 'Política de Pagamentos',
    version: '1.0',
    content: `POLÍTICA DE PAGAMENTOS

Última atualização: Versão 1.0

Esta Política de Pagamentos descreve as condições, valores e regras relacionadas às transações financeiras realizadas por meio da plataforma Okron.

1. ASSINATURA

1.1 O plano de assinatura básico do Okron possui o valor de R$ 9,90 (nove reais e noventa centavos) por mês.

1.2 A assinatura básica inclui o direito de organizar e gerenciar até 2 (dois) torneios por mês dentro da plataforma.

1.3 Para organizar torneios além do limite de 2 (dois) por mês, o organizador deve adquirir torneios adicionais ao valor unitário de R$ 4,90 (quatro reais e noventa centavos) por torneio.

1.4 A assinatura é cobrada de forma recorrente, com renovação automática ao final de cada período mensal.

1.5 O cancelamento da assinatura deve ser realizado com antecedência mínima de 3 (três) dias antes da data de renovação para evitar nova cobrança.

2. INSCRIÇÕES EM TORNEIOS

2.1 O organizador pode definir um valor de inscrição para participantes de seus torneios.

2.2 Para cada inscrição paga por um participante, o Okron retém uma taxa de serviço no valor de R$ 1,00 (um real) por inscrição.

2.3 O valor restante da inscrição é creditado ao organizador do torneio, conforme as condições de pagamento descritas nesta política.

2.4 O valor da inscrição é definido exclusivamente pelo organizador, podendo variar conforme o torneio.

3. MÉTODO DE PAGAMENTO

3.1 O Okron aceita exclusivamente pagamentos por meio de PIX (Pagamento Instantâneo).

3.2 Para efetuar um pagamento, o usuário deve utilizar a chave PIX fornecida pela plataforma na tela de pagamento.

3.3 O pagamento é confirmado automaticamente após a compensação junto à instituição financeira.

3.4 Em caso de atraso na compensação, o usuário deve entrar em contato com o canal de suporte da plataforma.

4. CRÉDITOS AO ORGANIZADOR

4.1 Os valores referentes a inscrições de participantes são creditados na conta do organizador conforme o cronograma definido pela plataforma.

4.2 O crédito está sujeito a um período de carência de até 7 (sete) dias úteis após a confirmação do pagamento da inscrição pelo participante.

4.3 O organizador pode solicitar o saque dos valores acumulados, desde que atenda ao valor mínimo de saque definido pela plataforma.

4.4 Saques são processados exclusivamente por meio de PIX, na chave PIX cadastrada pelo organizador.

5. CANCELAMENTO E REEMBOLSO

5.1 Cancelamento pelo organizador:
- O organizador pode cancelar um torneio a qualquer momento antes do seu início;
- Em caso de cancelamento, todos os participantes terão direito a reembolso integral dos valores pagos;
- O reembolso é processado no prazo de até 10 (dez) dias úteis.

5.2 Cancelamento pelo participante:
- Desistência com mais de 7 (sete) dias antes do início do torneio: reembolso de 50% (cinquenta por cento) do valor pago;
- Desistência com menos de 7 (sete) dias antes do início do torneio: não haverá reembolso;
- Desistência após o início do torneio: não haverá reembolso.

5.3 Cancelamento pela plataforma:
- Em caso de cancelamento de torneio por violação de regras ou Termos de Uso, os participantes terão direito a reembolso integral.

5.4 Não haverá reembolso em caso de:
- No-show do participante (ausência sem justificativa);
- Eliminação do participante no decorrer do torneio;
- Decisões do organizador dentro das suas prerrogativas.

6. PRAZO PARA SOLICITAÇÕES

6.1 Solicitações de reembolso devem ser realizadas no prazo máximo de 30 (trinta) dias após a data do pagamento.

6.2 Solicitações de crédito indevido devem ser realizadas no prazo máximo de 90 (noventa) dias após a transação.

6.3 Passado o prazo, não serão aceitas reclamações relativas à transação.

7. SITUAÇÕES DE BLOQUEIO

7.1 O Okron poderá bloquear saques e pagamentos ao organizador nas seguintes situações:

- Indícios de fraude ou lavagem de dinheiro;
- Reclamações múltiplas de participantes sobre o mesmo torneio;
- Violação dos Termos de Uso ou desta Política de Pagamentos;
- Suspensão de conta por determinação judicial ou administrativa;
- Pagamentos com valores indevidos ou fraudulentos.

7.2 O bloqueio será mantido até a resolução da questão que o motivou, sem direito a indenização por perda de receita.

8. CASOS DE FRAUDE

8.1 São considerados casos de fraude, entre outros:
- Utilização de dados bancários de terceiros sem autorização;
- Criação de múltiplas contas para obter vantagens indevidas;
- Manipulação de resultados de partidas;
- Fornecimento de informações falsas para obter reembolsos;
- Uso de métodos de pagamento indevidos.

8.2 Em caso de fraude confirmada, o Okron poderá:
- Suspender ou cancelar a conta do usuário;
- Retiver os valores pendentes de pagamento;
- Comunicar o fato às autoridades competentes;
- Adotar as medidas legais cabíveis.

9. CHARGEBACK

9.1 Em caso de solicitação de chargeback junto à instituição financeira, o Okron realizará investigations interna para apurar a regularidade da transação.

9.2 Caso o chargeback seja confirmado como indevido, o valor será descontado da conta do usuário e poderá resultar em suspensão da conta.

9.3 O Okron se reserva o direito de compartilhar informações com a instituição financeira para fins de investigação.

10. DISPUTAS

10.1 Em caso de disputa entre organizador e participante sobre valores de inscrição, o Okron atuará como mediador, mas não se responsabiliza pela resolução definitiva.

10.2 As disputas devem ser registradas pelo canal de suporte da plataforma, com todas as informações relevantes.

10.3 O Okron tomará as medidas que considerar adequadas para resolver a disputa de forma justa e equilibrada.

10.4 Caso a disputa não seja resolvida pelo Okron, as partes poderão recorrer ao foro competente definido nos Termos de Uso.

11. ALTERAÇÕES

Esta Política de Pagamentos poderá ser alterada a qualquer momento pelo Okron, com aviso prévio de 15 (quinze) dias para alterações que afetem valores ou condições de pagamento. O uso continuado da plataforma após as alterações constitui aceitação das novas condições.`,
  },
  {
    slug: 'cookies',
    title: 'Política de Cookies',
    version: '1.0',
    content: `POLÍTICA DE COOKIES

Última atualização: Versão 1.0

Esta Política de Cookies descreve como o Okron utiliza cookies e tecnologias similares quando você acessa e utiliza a plataforma.

1. O QUE SÃO COOKIES

Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou smartphone) quando você acessa um site ou aplicativo. Eles permitem que a plataforma reconheça o seu dispositivo e armazene informações sobre suas preferências ou ações anteriores.

2. TIPOS DE COOKIES UTILIZADOS

O Okron utiliza os seguintes tipos de cookies:

2.1 Cookies Necessários
- Finalidade: essenciais para o funcionamento básico da plataforma;
- Exemplos: manter a sessão do usuário ativa, lembrar preferências de idioma, garantir a segurança da autenticação;
- Não podem ser desativados, pois comprometeriam o funcionamento da plataforma.

2.2 Cookies de Autenticação
- Finalidade: manter o usuário conectado à plataforma e garantir o acesso seguro;
- Exemplos: tokens de sessão, identificadores de autenticação;
- Permitem que o usuário permaneça logado entre diferentes acessos.

2.3 Cookies de Desempenho
- Finalidade: melhorar a rapidez e eficiência da plataforma;
- Exemplos: cache de páginas, armazenamento temporário de dados para carregamento mais rápido;
- Auxiliam no funcionamento otimizado da plataforma.

2.4 Cookies Analíticos
- Finalidade: coletar informações sobre como os usuários utilizam a plataforma;
- Exemplos: páginas mais visitadas, tempo de permanência, rotas de navegação;
- Utilizados para melhorar a experiência do usuário e o funcionamento da plataforma.

3. DURAÇÃO DOS COOKIES

Os cookies utilizados pelo Okron possuem diferentes durações:

- Cookies de sessão: eliminados quando o navegador é fechado;
- Cookies persistentes: permanecem armazenados por período determinado, conforme finalidade;
- Cookies de autenticação: mantidos enquanto o usuário estiver logado ou por até 30 (trinta) dias;
- Cookies analíticos: mantidos por até 12 (doze) meses.

4. COOKIES DE TERCEIROS

A plataforma pode utilizar cookies de terceiros para funcionalidades específicas, como:

- Ferramentas de análise de tráfego (Google Analytics ou similar);
- Serviços de suporte ao cliente;
- Integradores de pagamento.

O Okron não controla cookies de terceiros e recomenda a consulta das respectivas políticas de privacidade.

5. COMO REMOVER COOKIES

O usuário pode gerenciar e remover cookies por meio das configurações do seu navegador:

- Google Chrome: Configurações > Privacidade e Segurança > Cookies e outros dados de sites;
- Mozilla Firefox: Configurações > Privacidade e Segurança > Cookies e dados de sites;
- Safari: Preferências > Privacidade > Gerenciar dados de sites;
- Microsoft Edge: Configurações > Privacidade, Pesquisa e Serviços > Cookies e permissões de site.

Importante: a desativação de cookies necessários pode comprometer o funcionamento adequado da plataforma.

6. CONSENTIMENTO

Ao utilizar a plataforma pela primeira vez, o usuário será informado sobre o uso de cookies e poderá:

- Aceitar todos os cookies;
- Configurar preferências de cookies;
- Rejeitar cookies não essenciais.

O consentimento pode ser revogado a qualquer momento por meio das configurações de privacidade da plataforma.

7. MAIS INFORMAÇÕES

Para mais informações sobre como o Okron trata seus dados pessoais, consulte nossa Política de Privacidade.

Em caso de dúvidas sobre esta Política de Cookies, entre em contato:

E-mail: contato@okron.com.br
WhatsApp: +55 15 3191-2964`,
  },
  {
    slug: 'cancellation',
    title: 'Política de Cancelamento',
    version: '1.0',
    content: `POLÍTICA DE CANCELAMENTO

Última atualização: Versão 1.0

Esta Política de Cancelamento descreve as regras e procedimentos para cancelamento de assinaturas, torneios e inscrições na plataforma Okron.

1. CANCELAMENTO DE ASSINATURA

1.1 O usuário pode cancelar sua assinatura a qualquer momento, diretamente nas configurações da sua conta ou por meio do canal de suporte.

1.2 O cancelamento terá efeito ao final do período de assinatura vigente, mantendo o acesso até a data de vencimento.

1.3 Não será fornecido reembolso proporcional pelo período restante da assinatura em curso, salvo nos casos previstos em lei.

1.4 Após o cancelamento, o usuário perderá acesso às funcionalidades premium da plataforma ao final do período.

1.5 Os dados da conta serão mantidos conforme a Política de Privacidade, podendo o usuário solicitar a exclusão pelo canal de suporte.

2. REEMBOLSOS

2.1 Reembolso integral:
- Cancelamento de torneio pelo organizador;
- Erro de cobrança ou valor indevido;
- Indisponibilidade prolongada da plataforma por culpa do Okron.

2.2 Reembolso parcial (50%):
- Desistência do participante com mais de 7 (sete) dias antes do início do torneio.

2.3 Sem reembolso:
- Desistência do participante com menos de 7 (sete) dias antes do início do torneio;
- Ausência do participante no dia do torneio (no-show);
- Eliminação do participante durante o torneio;
- Decisões do organizador dentro das suas prerrogativas.

2.4 Reembolsos são processados no prazo de até 10 (dez) dias úteis, por meio do mesmo método de pagamento utilizado na transação.

3. CANCELAMENTO DE TORNEIO

3.1 Pelo organizador:
- O organizador pode cancelar um torneio a qualquer momento antes do seu início;
- Deve comunicar o cancelamento a todos os participantes inscritos;
- É responsável pelo reembolso dos participantes conforme esta política;
- Deve justificar o motivo do cancelamento na plataforma.

3.2 Pela plataforma:
- O Okron pode cancelar torneios que violem os Termos de Uso, regras da plataforma ou legislação vigente;
- Em caso de cancelamento pela plataforma, os participantes terão direito a reembolso integral;
- O organizador será notificado do motivo do cancelamento.

3.3 Consequências do cancelamento:
- Todos os participantes inscritos serão notificados;
- Valores pagos serão reembolsados conforme esta política;
- O organizador perderá o acesso aos dados do torneio após o processamento do reembolso.

4. INSCRIÇÕES

4.1 A desistência de uma inscrição pode ser realizada pelo participante até 7 (sete) dias antes do início do torneio, com direito a reembolso parcial de 50%.

4.2 Após esse prazo, não será admitida desistência com reembolso.

4.3 O participante pode transferir sua inscrição para outro jogador, mediante autorização do organizador.

4.4 Inscrições em torneios gratuitos podem ser canceladas a qualquer momento sem penalidades.

5. PAGAMENTOS E CRÉDITOS

5.1 Cancelamento de assinatura:
- O cancelamento interrompe a cobrança recorrente a partir do próximo período;
- Valores já cobrados pelo período em curso não serão reembolsados.

5.2 Cancelamento de torneio:
- O organizador será penalizado com perda dos créditos acumulados de inscrições canceladas;
- Valores reembolsados serão descontados dos créditos pendentes do organizador.

5.3 Saques pendentes:
- Em caso de cancelamento de conta, saques pendentes serão processados no prazo normal;
- Em caso de violação dos Termos, o Okron poderá reter valores para cobertura de danos.

6. PRAZO PARA SOLICITAÇÕES

6.1 Solicitações de cancelamento de assinatura podem ser realizadas a qualquer momento.

6.2 Solicitações de reembolso devem ser realizadas no prazo máximo de 30 (trinta) dias após o pagamento.

6.3 Solicitações de cancelamento de torneio pelo organizador devem ser realizadas com antecedência mínima de 48 (quarenta e oito) horas do início do evento.

6.4 Passados os prazos, não serão aceitas solicitações de cancelamento ou reembolso.

7. SITUAÇÕES EXCEPCIONAIS

7.1 Em casos de força maior (desastres naturais, pandemias, determinações governamentais), o Okron poderá:

- Permitir cancelamentos sem penalidades;
- Estender prazos de reembolso;
- Criar regras especiais para o evento afetado.

7.2 Situações excepcionais serão avaliadas caso a caso pelo Okron, que tomará as medidas que considerar adequadas para proteger os direitos dos usuários.

7.3 O Okron comunicará as regras especiais aos usuários afetados por meio da plataforma ou por e-mail.

8. CANAL DE CONTATO

Para solicitações de cancelamento, reembolso ou dúvidas:

E-mail: contato@okron.com.br
WhatsApp: +55 15 3191-2964

As solicitações serão atendidas no prazo de até 5 (cinco) dias úteis.

9. ALTERAÇÕES

Esta Política de Cancelamento poderá ser alterada a qualquer momento pelo Okron, com aviso prévio de 15 (quinze) dias para alterações substanciais. O uso continuado da plataforma após as alterações constitui aceitação das novas condições.`,
  },
  {
    slug: 'security',
    title: 'Política de Segurança',
    version: '1.0',
    content: `POLÍTICA DE SEGURANÇA

Última atualização: Versão 1.0

Esta Política de Segurança descreve as medidas adotadas pelo Okron para proteger os dados e informações dos usuários da plataforma contra acessos não autorizados, alterações indevidas, destruição e outros riscos de segurança.

1. CRIPTOGRAFIA

1.1 Todos os dados transmitidos entre o dispositivo do usuário e os servidores do Okron são protegidos por criptografia TLS/SSL (Transport Layer Security/Secure Sockets Layer).

1.2 Dados sensíveis armazenados nos servidores são protegidos por criptografia em repouso, utilizando algoritmos de criptografia reconhecidos e atualizados.

1.3 Informações de pagamento, quando transmitidas, são processadas por intermediadores certificados e não são armazenadas nos servidores do Okron.

1.4 Senhas de usuários são armazenadas com hash unidirecional (bcrypt ou equivalente), impossibilitando a recuperação da senha original.

2. PROTEÇÃO DE DADOS

2.1 O Okron implementa medidas técnicas e organizacionais para proteger os dados pessoais dos usuários, conforme a LGPD (Lei nº 13.709/2018).

2.2 Os dados são classificados por nível de sensibilidade, sendo aplicadas medidas de proteção proporcionais a cada categoria.

2.3 Acesso a dados pessoais é restrito a funcionários autorizados, mediante necessidade de conhecimento (need-to-know).

2.4 Parceiros e prestadores de serviços estão sujeitos a acordos de confidencialidade e proteção de dados.

3. BACKUPS

3.1 Realizamos backups regulares de todos os dados da plataforma para garantir a recuperação em caso de falhas ou incidentes.

3.2 Backups são realizados diariamente e armazenados em localização segura e geograficamente diversificada.

3.3 Testes de restauração de backup são realizados periodicamente para garantir a integridade dos dados.

3.4 Retenção de backups: os backups são mantidos por período mínimo de 30 (trinta) dias, com cópias de segurança adicionais para dados críticos.

4. MONITORAMENTO

4.1 O Okron realiza monitoramento contínuo da infraestrutura para identificar e responder a incidentes de segurança.

4.2 Sistemas de detecção de intrusão monitoram acessos e atividades suspeitas em tempo real.

4.3 Alertas automáticos são configurados para notificar a equipe de segurança sobre atividades anormais.

4.4 Logs de acesso e sistema são monitorados e analisados regularmente.

5. CONTROLE DE ACESSO

5.1 O acesso aos sistemas internos do Okron é controlado por autenticação multifator (MFA) para funcionários e administradores.

5.2 Cada funcionário possui credenciais de acesso individuais, sendo vedado o compartilhamento de contas.

5.3 Princípio do menor privilégio: cada funcionário tem acesso apenas aos dados e sistemas necessários para sua função.

5.4 Revisões periódicas de acesso são realizadas para garantir que apenas pessoas autorizadas tenham acesso.

5.5 Acesso de terceiros (desenvolvedores, prestadores de serviço) é controlado e monitorado.

6. LOGS E AUDITORIA

6.1 Todas as ações realizadas na plataforma são registradas em logs de auditoria.

6.2 Logs incluem: data/hora, usuário, ação realizada, endereço IP e resultado da operação.

6.3 Logs são mantidos por período mínimo de 6 (seis) meses para fins de auditoria e investigação.

6.4 Auditorias periódicas são realizadas para verificar a conformidade com as políticas de segurança.

6.5 Registros de acesso a dados sensíveis são mantidos por período estendido para fins de rastreabilidade.

7. PRÁTICAS RECOMENDADAS AOS USUÁRIOS

7.1 Para manter a segurança de sua conta, o usuário deve:

- Utilizar senhas fortes e únicas para sua conta no Okron;
- Ativar a autenticação de dois fatores quando disponível;
- Não compartilhar suas credenciais de acesso com terceiros;
- Manter o dispositivo e navegador atualizados;
- Não utilizar redes Wi-Fi públicas para acessar a plataforma;
- Encerrar a sessão ao utilizar dispositivos compartilhados;
- Notificar imediatamente o Okron sobre atividades suspeitas na conta.

7.2 O Okron recomenda:

- Utilizar gerenciadores de senhas;
- Verificar regularmente o histórico de acessos à conta;
- Manter o e-mail de cadastro seguro e atualizado.

8. RESPOSTA A INCIDENTES

8.1 O Okron possui um plano de resposta a incidentes de segurança que inclui:

- Identificação e contenção do incidente;
- Avaliação do impacto e dos dados afetados;
- Notificação aos usuários afetados, quando aplicável;
- Comunicação à Autoridade Nacional de Proteção de Dados (ANPD), quando exigido pela LGPD;
- Correção das vulnerabilidades que permitiram o incidente;
- Documentação e lições aprendidas.

8.2 Em caso de incidente que comprometa dados pessoais, os usuários afetados serão notificados no prazo máximo estabelecido pela legislação vigente.

9. CONFORMIDADE

9.1 O Okron opera em conformidade com:

- Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018);
- Marco Civil da Internet (Lei nº 12.965/2014);
- Demais normas e regulamentações aplicáveis.

9.2 Revisões periódicas são realizadas para garantir a conformidade contínua com a legislação e boas práticas de segurança.

10. ATUALIZAÇÕES

Esta Política de Segurança poderá ser atualizada periodicamente para refletir mudanças nas práticas de segurança do Okron. Versões anteriores serão mantidas para referência. Utilizadores serão notificados sobre alterações significativas por meio da plataforma.

11. CONTATO

Em caso de dúvidas ou incidentes de segurança, entre em contato:

E-mail: contato@okron.com.br
WhatsApp: +55 15 3191-2964`,
  },
  {
    slug: 'lgpd',
    title: 'Direitos do Titular (LGPD)',
    version: '1.0',
    content: `DIREITOS DO TITULAR (LGPD)

Última atualização: Versão 1.0

Esta página descreve os direitos dos titulares de dados pessoais no contexto da plataforma Okron, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

1. DIREITO DE ACESSO

1.1 O titular tem direito de obter confirmação da existência de tratamento de dados pessoais que o digam respeito.

1.2 O titular tem direito de acessar os dados pessoais tratados pelo Okron, incluindo:
- Quais dados pessoais são coletados e tratados;
- Como os dados são utilizados;
- Com quem os dados são compartilhados;
- Qual o período de retenção dos dados;
- Quais são as finalidades do tratamento.

1.3 O Okron fornecerá, mediante solicitação, cópia dos dados pessoais do titular em formato legível e estruturado.

2. DIREITO DE CORREÇÃO

2.1 O titular tem direito de solicitar a correção de dados pessoais incompletos, inexatos ou desatualizados.

2.2 A correção poderá ser solicitada a qualquer momento, mediante identificação do titular.

2.3 O Okron realizará a correção no prazo de até 15 (quinze) dias úteis após a solicitação.

2.4 Caso os dados incorretos tenham sido compartilhados com terceiros, o Okron informará os destinatários sobre a correção realizada.

3. DIREITO DE ATUALIZAÇÃO

3.1 O titular tem direito de solicitar a atualização de dados pessoais que estejam desatualizados.

3.2 A atualização pode ser realizada diretamente pelo titular nas configurações da conta, ou mediante solicitação ao Okron.

3.3 Dados como endereço de e-mail, telefone, informações de perfil e dados de pagamento podem ser atualizados a qualquer momento.

3.4 Dados cadastrais que necessitem de verificação adicional poderão exigir documentação complementar.

4. DIREITO DE PORTABILIDADE

4.1 O titular tem direito de solicitar a portabilidade dos dados pessoais para outro fornecedor de serviços, mediante requisição expressa.

4.2 A portabilidade inclui os dados fornecidos pelo titular e os dados gerados pelo uso da plataforma, excluídos dados protegidos por direitos de propriedade intelectual do Okron.

4.3 Os dados serão fornecidos em formato estruturado, de uso comum e legível por máquina (JSON, CSV ou formato equivalente).

4.4 O prazo para atendimento da solicitação de portabilidade é de até 15 (quinze) dias úteis.

5. DIREITO DE ANONIMIZAÇÃO

5.1 O titular tem direito de solicitar a anonimização de dados pessoais que não sejam necessários para as finalidades do tratamento.

5.2 A anonimização consiste na utilização de meios técnicos para que os dados não possam ser associados a um indivíduo identificado ou identificável.

5.3 Dados anonimizados poderão ser mantidos para fins estatísticos, de pesquisa ou de melhoria da plataforma.

6. DIREITO DE ELIMINAÇÃO

6.1 O titular tem direito de solicitar a eliminação de dados pessoais tratados com base em seu consentimento, exceto nas seguintes situações:
- Cumprimento de obrigação legal ou regulatória pelo controlador;
- Estudo por órgão de pesquisa, garantida a anonimização dos dados;
- Transferência a terceiro, respeitados os requisitos legais;
- Uso exclusivo do controlador, desde que anonimizados.

6.2 A eliminação será realizada no prazo de até 30 (trinta) dias após a confirmação da solicitação.

6.3 Dados necessários para cumprimento de obrigações legais poderão ser mantidos pelo prazo exigido pela legislação.

6.4 Após a eliminação, os dados não poderão ser recuperados.

7. DIREITO DE REVOGAÇÃO DO CONSENTIMENTO

7.1 O titular tem direito de revogar o consentimento a qualquer momento, mediante manifestação expressa.

7.2 A revogação do consentimento não afetará a validade dos tratamentos realizados anteriormente.

7.3 Após a revogação, o Okron deixará de tratar os dados pessoais do titular, exceto quando houver outra base legal para o tratamento.

7.4 A revogação poderá ser realizada diretamente nas configurações da conta ou mediante solicitação ao Okron.

7.5 Em caso de revogação de consentimentos essenciais para o uso da plataforma, o Okron informará as consequências da revogação ao titular.

8. DIREITO DE INFORMAÇÃO SOBRE COMPARTILHAMENTO

8.1 O titular tem direito de obter informações sobre a existência de compartilhamento de seus dados pessoais com terceiros.

8.2 O Okron fornecerá informações sobre:
- Quais terceiros receberam os dados pessoais;
- Em que finalidades os dados foram compartilhados;
- Quais dados foram compartilhados;
- Período de retenção dos dados pelos terceiros.

8.3 Essas informações serão fornecidas mediante solicitação expressa do titular, no prazo de até 15 (quinze) dias úteis.

9. DIREITO DE OPOSIÇÃO

9.1 O titular tem direito de se opor ao tratamento de dados pessoais quando:
- O tratamento for realizado em desacordo com a LGPD;
- O tratamento for excessivo ou desnecessário;
- O tratamento violar direitos e liberdades fundamentais.

9.2 A oposição deverá ser fundamentada e dirigida ao Okron pelo canal de contato indicado.

9.3 O Okron avaliará a solicitação de oposição e comunicará o resultado ao titular no prazo de até 15 (quinze) dias úteis.

10. CANAL DE CONTATO

Para exercer qualquer dos direitos acima, o titular deve entrar em contato:

E-mail: contato@okron.com.br
WhatsApp: +55 15 3191-2964
Endereço: Parque Residencial São Camillo, Boituva – SP, Brasil

11. IDENTIFICAÇÃO DO TITULAR

11.1 Para garantir a segurança dos dados, o Okron poderá solicitar a identificação do titular antes de atender qualquer solicitação.

11.2 A identificação poderá ser feita por meio de:
- E-mail cadastrado na conta;
- Dados cadastrais verificados;
- Documento de identidade, quando necessário.

12. PRAZOS DE ATENDIMENTO

12.1 As solicitações serão atendidas no prazo máximo de 15 (quinze) dias úteis, contados a partir da confirmação do recebimento.

12.2 Em caso de complexidade ou volume de solicitações, o prazo poderá ser prorrogado por mais 15 (quinze) dias úteis, mediante justificativa.

12.3 O Okron informará o titular sobre qualquer prorrogação de prazo.

13. AUTORIDADE NACIONAL DE PROTEÇÃO DE DADOS (ANPD)

13.1 Caso o titular não esteja satisfeito com a resposta do Okron, poderá apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).

13.2 A ANPD pode ser acessada pelo site: https://www.gov.br/anpd

14. ALTERAÇÕES

Esta página sobre Direitos do Titular poderá ser atualizada para refletir mudanças na legislação ou nas práticas do Okron. Versões anteriores serão mantidas para referência. Utilizadores serão notificados sobre alterações significativas por meio da plataforma.`,
  },
];

async function main() {
  console.log('Inserindo documentos legais...');

  await prisma.legalDocument.deleteMany();

  for (const doc of documents) {
    await prisma.legalDocument.create({
      data: {
        slug: doc.slug,
        title: doc.title,
        content: doc.content,
        version: doc.version,
      },
    });
    console.log(`  ✓ ${doc.slug} — ${doc.title}`);
  }

  console.log(`\n${documents.length} documentos legais inseridos com sucesso!`);
}

main()
  .catch((e) => {
    console.error('Erro ao inserir documentos legais:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
