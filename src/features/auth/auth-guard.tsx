import { Navigate, Outlet } from "react-router-dom";
import ErrorState from "../../components/shared/error-state";
import LoadingState from "../../components/shared/loading-state";
import { useSessionQuery } from "./auth.queries";

export default function AuthGuard() {
  const session = useSessionQuery();

  if (session.isPending) {
    return (
      <main className="p-4 md:p-6">
        <LoadingState message="Checking your session…" />
      </main>
    );
  }

  if (session.isError) {
    return (
      <main className="p-4 md:p-6">
        <ErrorState
          title="Unable to verify your session"
          onRetry={() => void session.refetch()}
          isRetrying={session.isFetching}
        />
      </main>
    );
  }

  return session.data ? <Outlet /> : <Navigate to="/login" replace />;
}
