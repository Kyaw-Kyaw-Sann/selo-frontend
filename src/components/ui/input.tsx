import type { ComponentProps } from 'react'

export default function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={`min-h-10 w-full rounded-control border border-input-border bg-surface px-3 py-2 text-heading placeholder:text-muted aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted ${className}`}
      {...props}
    />
  )
}
