import { Boxes, FolderTree, Package, Receipt, Ruler, ScanBarcode, ShoppingCart, Truck, Users } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useSessionQuery } from "../features/auth/auth.queries";
import SidebarAccount from "./sidebar-account";

const managementLinks = [
  { to: "/products", label: "Products", icon: Package },
  { to: "/units", label: "Units", icon: Ruler },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/pos", label: "POS", icon: ScanBarcode },
  { to: "/sales", label: "Sales history", icon: Receipt },
  { to: "/staff", label: "Staff", icon: Users, ownerOnly: true },
];

const purchasingLinks = [
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
];

export default function Sidebar() {
  const { data: user } = useSessionQuery();

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
          Selo
        </span>
      </Link>

      <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:min-h-0 md:flex-1 md:space-y-1 md:overflow-x-hidden md:overflow-y-auto md:pb-6">
        <p className="hidden px-3 pt-6 pb-3 text-xs font-medium text-muted md:block">Store operations</p>
        {managementLinks.filter(({ ownerOnly }) => !ownerOnly || user?.role === "OWNER").map(({ to, label, icon: Icon }) => (
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
        {user?.role === "OWNER" && (
          <>
            <p className="hidden px-3 pt-6 pb-3 text-xs font-medium text-muted md:block">Purchasing</p>
            {purchasingLinks.map(({ to, label, icon: Icon }) => (
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
          </>
        )}
      </nav>
      {user && <SidebarAccount user={user} />}
    </aside>
  );
}
