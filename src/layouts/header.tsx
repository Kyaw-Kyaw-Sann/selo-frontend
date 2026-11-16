import { isAxiosError } from "axios";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useLogoutMutation,
  useSessionQuery,
} from "../features/auth/auth.queries";

export default function Header() {
  const { data: user } = useSessionQuery();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/login", { replace: true });
    } catch {
      // Keep the session and display the failure so logout can be retried.
    }
  };

  const permissionError =
    isAxiosError(logoutMutation.error) &&
    logoutMutation.error.response?.status === 403;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:min-h-18 md:px-6 lg:px-8">
        <p className="hidden text-sm font-medium text-muted sm:block">Store management</p>
        <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
          {/* <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-sm font-semibold text-heading">
            {user?.name.trim().charAt(0).toUpperCase()}
          </span> */}
          <div className="min-w-0 text-right">
            <p className="max-w-40 truncate text-sm leading-5 font-semibold text-heading sm:max-w-60" title={user?.name}>{user?.name}</p>
            {/* <p className="text-xs leading-5 text-muted">
              {user?.role === "OWNER" ? "Owner" : "Cashier"}
            </p> */}
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={logoutMutation.isPending}
            aria-label={logoutMutation.isPending ? "Signing out" : "Sign out"}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control border border-input-border bg-surface px-3 py-2 text-sm leading-5 font-medium text-body hover:bg-surface-muted hover:text-heading disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{logoutMutation.isPending ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
      {logoutMutation.isError && (
        <p role="alert" className="mx-auto max-w-[1440px] px-4 pb-3 text-sm text-danger md:px-6 lg:px-8">
          {permissionError
            ? "Sign out request denied. Refresh the page and try again"
            : "Unable to sign out. Please try again"}
        </p>
      )}
    </header>
  );
}
