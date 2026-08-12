/** Número de WhatsApp (E.164 sem +). NEXT_PUBLIC_WHATSAPP sobrescreve em produção. */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP ?? '555198288884'

/** Formato para exibição ao usuário. */
export const WHATSAPP_DISPLAY = '+55 51 9828-8884'

/** Mensagem que já vem digitada quando o cliente abre a conversa. */
export const WHATSAPP_DEFAULT_MESSAGE =
  'Olá! Vim pelo site da Crably e quero saber mais sobre os modelos de site.'

/** Monta o link do WhatsApp com a mensagem pré-preenchida. */
export const whatsappUrl = (message: string = WHATSAPP_DEFAULT_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

export const WHATSAPP_URL = whatsappUrl()
