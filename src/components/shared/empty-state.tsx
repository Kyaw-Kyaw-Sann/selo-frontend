type EmptyStateProps = {
  title: string
  description?: string
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="rounded-panel border border-border bg-surface px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-heading">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </section>
  )
}
