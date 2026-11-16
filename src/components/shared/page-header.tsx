type PageHeaderProps = {
  title: string
  description?: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 min-w-0">
      <h1 className="text-2xl leading-tight font-semibold tracking-tight text-heading md:text-[28px]">{title}</h1>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
    </div>
  )
}
