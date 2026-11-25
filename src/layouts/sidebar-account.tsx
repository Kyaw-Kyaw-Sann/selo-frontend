import { isAxiosError } from "axios";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../features/auth/auth.queries";
import type { AuthUser } from "../features/auth/auth.types";

export default function SidebarAccount({ user }: { user: AuthUser }) {
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
    <div className="shrink-0 border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm leading-5 font-semibold text-heading" title={user.name}>{user.name}</p>
          <div className="flex items-center gap-1.5 text-xs leading-5 text-muted">
            <span className="truncate" title={`@${user.username}`}>@{user.username}</span>
            <span className="shrink-0">{user.role === "OWNER" ? "· Owner" : "· Cashier"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={logoutMutation.isPending}
          aria-label={logoutMutation.isPending ? "Signing out" : "Sign out"}
          title={logoutMutation.isPending ? "Signing out" : "Sign out"}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control border border-input-border px-3 text-sm font-medium text-body hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60 md:size-10 md:px-0"
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="md:hidden">{logoutMutation.isPending ? "Signing out…" : "Sign out"}</span>
        </button>
      </div>
      {logoutMutation.isError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {permissionError
            ? "Sign out request denied. Refresh the page and try again"
            : "Unable to sign out. Please try again"}
        </p>
      )}
    </div>
  );
}
