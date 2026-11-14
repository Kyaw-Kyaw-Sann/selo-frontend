import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useLogoutMutation, useSessionQuery } from '../features/auth/auth.queries'

export default function Header() {
  const { data: user } = useSessionQuery()
  const logoutMutation = useLogoutMutation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      navigate('/login', { replace: true })
    } catch {
      // Keep the session and display the failure so logout can be retried.
    }
  }

  const permissionError = isAxiosError(logoutMutation.error)
    && logoutMutation.error.response?.status === 403

  return (
    <header className="border-b border-border bg-surface px-4 py-4 md:px-6">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-heading">Store management</p>
        <div className="flex min-w-0 items-center gap-4">
          <div className="min-w-0 text-right">
            <p className="break-words font-medium text-heading">{user?.name}</p>
            <p className="text-sm text-muted">{user?.role === 'OWNER' ? 'Owner' : 'Cashier'}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={logoutMutation.isPending}
            className="shrink-0 rounded-control border border-input-border px-3 py-2 font-medium hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
      {logoutMutation.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {permissionError ? 'Sign out request denied. Refresh the page and try again' : 'Unable to sign out. Please try again'}
        </p>
      )}
    </header>
  )
}
