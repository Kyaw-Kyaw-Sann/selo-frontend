import type { ComponentProps } from 'react'

export default function Button({
  type = 'button',
  className = '',
  ...props
}: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  )
}
