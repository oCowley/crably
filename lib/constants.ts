/** Número de WhatsApp (E.164 sem +). Defina NEXT_PUBLIC_WHATSAPP no .env para o número real. */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP ?? '5511999999999'

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
