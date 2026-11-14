type PageHeaderProps = {
  title: string
  description?: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-heading">{title}</h1>
      {description && <p className="mt-1 text-muted">{description}</p>}
    </div>
  )
}
