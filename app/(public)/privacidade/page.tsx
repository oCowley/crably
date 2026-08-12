import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como a Crably coleta, usa e protege os seus dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <LegalPage
      eyebrow="Privacidade"
      title="Política de Privacidade"
      intro="Esta política explica quais dados coletamos, como usamos e quais são os seus direitos quando você navega no site da Crably, cria uma conta ou contrata um dos nossos modelos de site."
      updated="12 de agosto de 2026"
      summaryTitle="Resumo em linguagem simples"
      summary={[
        'Coletamos apenas o necessário para criar sua conta, processar o pedido e produzir o seu site.',
        'Pagamentos são processados pela Stripe — não armazenamos os dados do seu cartão.',
        'Não vendemos seus dados e não enviamos spam.',
        'Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento.',
      ]}
      sections={[
        {
          title: 'Quem somos',
          paragraphs: [
            'A Crably é uma plataforma brasileira que vende sites profissionais prontos para empresas, com preço fixo e entrega em prazo definido. Somos os responsáveis pelo tratamento dos dados pessoais descritos nesta política.',
          ],
        },
        {
          title: 'Dados que coletamos',
          paragraphs: ['Coletamos dados em quatro momentos diferentes da sua relação com a Crably:'],
          items: [
            'Conta — nome e e-mail, usados para autenticação (via Google Firebase) e comunicação sobre o seu pedido.',
            'Pedido e pagamento — o pagamento é processado pela Stripe. Não armazenamos números de cartão nos nossos servidores; recebemos da Stripe apenas a confirmação da transação e identificadores do pedido.',
            'Projeto — as informações que você envia para a produção do site: textos, imagens, logotipo e dados de contato da sua empresa.',
            'Dados técnicos — cookies e armazenamento local necessários ao funcionamento do site, como sessão de login e preferência de tema (claro/escuro).',
          ],
        },
        {
          title: 'Como usamos os seus dados',
          items: [
            'Criar e manter a sua conta.',
            'Processar o pedido e emitir as confirmações de pagamento.',
            'Produzir, publicar e entregar o site contratado.',
            'Comunicar o andamento do projeto pelo dashboard, e-mail ou WhatsApp.',
            'Prestar suporte e melhorar a plataforma.',
          ],
          footnote: 'Não vendemos os seus dados a terceiros e não usamos as suas informações para publicidade de terceiros.',
        },
        {
          title: 'Com quem compartilhamos',
          paragraphs: [
            'Compartilhamos dados apenas com os serviços essenciais à operação da plataforma, e somente o necessário para cada um cumprir a sua função:',
          ],
          items: [
            'Stripe — processamento de pagamentos.',
            'Google Firebase — autenticação de usuários e banco de dados.',
            'Vercel — hospedagem da plataforma.',
            'WhatsApp — comunicação, quando você opta por falar com a gente por esse canal.',
          ],
          footnote: 'Cada um desses serviços trata dados conforme as próprias políticas de privacidade.',
        },
        {
          title: 'Cookies e armazenamento local',
          paragraphs: [
            'Usamos apenas cookies e armazenamento local essenciais: manter você conectado à sua conta e lembrar preferências como o tema claro ou escuro. Não usamos cookies de rastreamento de terceiros para fins publicitários.',
          ],
        },
        {
          title: 'Seus direitos (LGPD)',
          paragraphs: [
            'Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a qualquer momento:',
          ],
          items: [
            'Confirmação de que tratamos os seus dados e acesso a eles.',
            'Correção de dados incompletos ou desatualizados.',
            'Exclusão dos dados, ressalvadas as obrigações legais de retenção.',
            'Portabilidade e informações sobre compartilhamento.',
            'Revogação de consentimento.',
          ],
          footnote: 'Para exercer qualquer direito, escreva para contato@crably.com.br. Respondemos no menor prazo possível.',
        },
        {
          title: 'Segurança e retenção',
          paragraphs: [
            'Adotamos medidas técnicas e organizacionais para proteger os seus dados, incluindo criptografia em trânsito e controle de acesso por perfil dentro da equipe. Mantemos os dados enquanto a sua conta existir ou pelo período exigido por obrigações legais e fiscais; depois disso, são excluídos ou anonimizados.',
          ],
        },
        {
          title: 'Alterações desta política',
          paragraphs: [
            'Podemos atualizar esta política para refletir mudanças na plataforma ou na legislação. A data da última atualização aparece no topo da página, e mudanças relevantes serão comunicadas pelos nossos canais.',
          ],
        },
      ]}
      crossLink={{ href: '/termos', label: 'Leia também os Termos de Uso' }}
    />
  )
}
