import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Condições de uso da plataforma e de contratação dos sites da Crably.',
}

export default function TermosPage() {
  return (
    <LegalPage
      eyebrow="Termos"
      title="Termos de Uso"
      intro="Estes termos regem o uso da plataforma Crably e a contratação dos nossos modelos de site. Ao criar uma conta ou concluir uma compra, você concorda com as condições abaixo."
      updated="12 de agosto de 2026"
      summaryTitle="Resumo em linguagem simples"
      summary={[
        'Você escolhe um modelo com escopo e preço fixos, envia as informações e recebe o site pronto.',
        'O prazo de até 14 dias úteis conta a partir do envio completo das informações.',
        'A personalização é limitada ao escopo do modelo — não há desenvolvimento sob medida nem revisões ilimitadas.',
        'Cancelamento em até 7 dias com reembolso integral, desde que a produção não tenha começado.',
      ]}
      sections={[
        {
          title: 'O serviço',
          paragraphs: [
            'A Crably vende sites profissionais prontos, baseados em modelos com escopo fixo e preço fixo, exibidos antes da contratação. Ao contratar, você escolhe um modelo, envia as informações solicitadas e recebe o site produzido pela nossa equipe, com acompanhamento das etapas pelo seu dashboard.',
          ],
        },
        {
          title: 'Conta',
          paragraphs: [
            'Para contratar e acompanhar um projeto é necessário criar uma conta. Você é responsável pela veracidade dos dados informados e pela guarda das suas credenciais de acesso. A contratação deve ser feita por pessoa maior de 18 anos ou por representante autorizado de empresa.',
          ],
        },
        {
          title: 'Preço e pagamento',
          items: [
            'O preço de cada modelo é exibido na página do produto antes da contratação — sem taxas escondidas nem cobranças surpresa.',
            'Os pagamentos são processados pela Stripe, com parcelamento em até 3x sem juros quando disponível.',
            'Promoções — como o desconto de lançamento na primeira compra — têm condições próprias e podem ser alteradas ou encerradas a qualquer momento, sem afetar compras já concluídas.',
          ],
        },
        {
          title: 'Envio de informações e prazo de entrega',
          paragraphs: [
            'O prazo de entrega de até 14 dias úteis começa a contar a partir do envio completo das informações solicitadas (textos, imagens, logotipo e dados da empresa). Enquanto as informações não forem enviadas, o prazo não corre — e atrasos no envio adiam a entrega na mesma proporção.',
            'Quando contratado, o pacote Express reduz o prazo para até 7 dias úteis, nas mesmas condições.',
          ],
        },
        {
          title: 'Escopo e personalização',
          paragraphs: [
            'Cada modelo tem escopo fixo, descrito na página do produto. A personalização é limitada a textos, imagens, cores e conteúdo dentro da estrutura do modelo escolhido.',
          ],
          items: [
            'Não está incluído desenvolvimento sob medida nem funcionalidades fora do modelo.',
            'Ajustes são limitados ao escopo contratado — não há revisões ilimitadas.',
            'Solicitações fora do escopo podem ser recusadas ou orçadas separadamente.',
          ],
        },
        {
          title: 'Entrega e acompanhamento',
          paragraphs: [
            'As etapas do projeto (pagamento, envio de informações, produção e entrega) ficam visíveis no seu dashboard. O projeto é considerado entregue quando o site é publicado ou disponibilizado a você conforme o escopo do modelo.',
          ],
        },
        {
          title: 'Conteúdo do cliente',
          paragraphs: [
            'Você declara ter os direitos necessários sobre todos os textos, imagens, marcas e demais materiais enviados para a produção do site. A Crably não se responsabiliza por violações de direitos de terceiros decorrentes de conteúdo fornecido por você.',
          ],
        },
        {
          title: 'Propriedade intelectual',
          items: [
            'Após a entrega e o pagamento integral, o site entregue é seu para uso comercial.',
            'A estrutura, o código-base e os modelos permanecem de titularidade da Crably e podem ser reutilizados em outros projetos.',
            'A marca Crably não pode ser usada sem autorização prévia por escrito.',
          ],
        },
        {
          title: 'Cancelamento e reembolso',
          paragraphs: [
            'Você pode cancelar a compra em até 7 dias corridos, com reembolso integral, desde que a produção do site ainda não tenha começado (art. 49 do Código de Defesa do Consumidor).',
            'Se a produção já tiver começado, o reembolso será proporcional ao trabalho ainda não realizado, avaliado caso a caso pela nossa equipe.',
          ],
        },
        {
          title: 'Limitação de responsabilidade',
          paragraphs: [
            'A Crably entrega o site conforme o escopo do modelo contratado, mas não garante resultados comerciais específicos, como volume de vendas, geração de leads ou posicionamento em mecanismos de busca. Em qualquer hipótese, a responsabilidade da Crably fica limitada ao valor efetivamente pago pelo pedido.',
          ],
        },
        {
          title: 'Alterações destes termos',
          paragraphs: [
            'Podemos atualizar estes termos para refletir mudanças no serviço ou na legislação. A versão vigente estará sempre publicada nesta página, com a data da última atualização no topo. Compras concluídas seguem os termos vigentes na data da contratação.',
          ],
        },
        {
          title: 'Legislação e contato',
          paragraphs: [
            'Estes termos são regidos pela legislação brasileira. Para qualquer dúvida, fale com a gente em contato@crably.com.br ou pelo WhatsApp disponível no site.',
          ],
        },
      ]}
      crossLink={{ href: '/privacidade', label: 'Leia também a Política de Privacidade' }}
    />
  )
}
