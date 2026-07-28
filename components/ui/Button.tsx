import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'btn-sheen text-white hover:-translate-y-px active:translate-y-0 active:scale-[0.98] bg-gradient-to-b from-brand-light via-brand via-55% to-brand-hover [box-shadow:inset_0_1px_0_rgba(255,255,255,0.25),var(--glow-sm)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.25),var(--glow-md)]',
      secondary:
        'bg-elevated text-foreground border border-border hover:border-brand/25 active:scale-[0.98]',
      ghost:
        'text-secondary hover:text-foreground hover:bg-foreground/5',
      outline:
        'btn-gradient-border text-foreground hover:text-brand active:scale-[0.98]',
    }

    const sizes = {
      sm: 'h-9 px-4 text-sm rounded-lg',
      md: 'h-11 px-6 text-sm rounded-xl',
      lg: 'h-12 px-8 text-base rounded-xl',
      xl: 'h-14 px-10 text-base rounded-2xl',
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
