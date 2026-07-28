import { STATUS_TONE_CLASSES, StatusTone } from '@/lib/status-styles'

interface Props {
  tone?: StatusTone
  children: React.ReactNode
  className?: string
}

export default function StatusBadge({ tone = 'neutral', children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
