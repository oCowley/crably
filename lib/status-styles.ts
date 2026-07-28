export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'

/**
 * Pares light/dark completos para pills de status.
 * Centraliza o contraste: tons -600 no light, -400 no dark.
 */
export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  neutral: 'bg-elevated text-muted border border-border',
  brand: 'bg-brand/10 text-brand border border-brand/25',
}
