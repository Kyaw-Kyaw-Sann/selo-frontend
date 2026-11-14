type LoadingStateProps = {
  message?: string
}

export default function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return <p role="status" className="px-6 py-10 text-center text-muted">{message}</p>
}
