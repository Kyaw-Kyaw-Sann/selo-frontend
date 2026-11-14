import Button from '../ui/button'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
  isRetrying?: boolean
}

export default function ErrorState({
  title = 'Unable to load data',
  message = 'Please try again',
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <section className="rounded-panel border border-border bg-surface px-6 py-10 text-center">
      <div role="alert">
        <h2 className="text-base font-semibold text-heading">{title}</h2>
        <p className="mt-1 text-sm text-danger">{message}</p>
      </div>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? 'Retrying…' : 'Try again'}
        </Button>
      )}
    </section>
  )
}
