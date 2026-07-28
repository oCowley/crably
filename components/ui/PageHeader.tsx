interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, action, className = '' }: Props) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 ${className}`}>
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
