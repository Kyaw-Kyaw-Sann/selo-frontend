import { Package } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="border-b border-border bg-surface md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:self-start md:border-r md:border-b-0">
      <Link to="/products" className="flex h-20 shrink-0 items-center gap-2 px-6">
        <img src="/selo.svg" alt="" width={40} height={40} className="size-10 object-contain" />
        <span className="text-3xl font-bold tracking-tight text-primary">
          Selo
        </span>
      </Link>

      <nav aria-label="Main navigation" className="px-3 pb-4 md:overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Catalog
        </p>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 font-medium ${
              isActive
                ? 'bg-primary-soft text-primary'
                : 'text-body hover:bg-surface-muted'
            }`
          }
        >
          <Package size={20} aria-hidden="true" className="shrink-0" />
          <span>Products</span>
        </NavLink>
      </nav>
    </aside>
  )
}
