import type { ComponentProps } from 'react'

type BadgeProps = ComponentProps<'span'> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}

const tones = {
  neutral: 'bg-surface-muted text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export default function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded px-2 py-1 text-xs leading-4 font-medium ${tones[tone]} ${className}`} {...props} />
}
