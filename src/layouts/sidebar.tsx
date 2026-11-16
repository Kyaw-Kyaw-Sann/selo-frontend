import { FolderTree, Package, Ruler } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const catalogLinks = [
  { to: "/products", label: "Products", icon: Package },
  { to: "/units", label: "Units", icon: Ruler },
  { to: "/categories", label: "Categories", icon: FolderTree },
];

export default function Sidebar() {
  return (
    <aside className="border-b border-border bg-surface md:sticky md:top-0 md:flex md:h-dvh md:w-56 md:shrink-0 md:flex-col md:self-start md:border-r md:border-b-0">
      <Link
        to="/products"
        aria-label="Selo products"
        className="flex h-16 shrink-0 items-center gap-2.5 px-4 md:h-18 md:px-6"
      >
        <img
          src="/selo.svg"
          alt=""
          width={32}
          height={32}
          className="size-8 object-contain"
        />
        <span className="text-[28px] leading-none font-semibold tracking-tight text-primary">
          selo
        </span>
      </Link>

      <p className="hidden px-6 pt-6 pb-3 text-xs font-medium text-muted md:block">Catalog</p>
      <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-y-auto md:pb-6">
        {catalogLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-control px-3 py-2.5 text-sm md:justify-start md:gap-3 ${
                isActive
                  ? "bg-primary-soft font-semibold text-primary"
                  : "font-medium text-body hover:bg-surface-muted hover:text-heading"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
