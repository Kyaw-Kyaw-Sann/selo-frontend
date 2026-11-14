import { Outlet } from 'react-router-dom'
import { useSessionQuery } from './auth.queries'

// Nest OwnerGuard inside AuthGuard so session loading/errors are handled there.
export default function OwnerGuard() {
  const { data: user } = useSessionQuery()

  if (user?.role !== 'OWNER') {
    return (
      <div role="alert" className="space-y-1">
        <h1 className="text-2xl font-semibold text-heading">Permission denied</h1>
        <p className="text-muted">This page is available to the owner only</p>
      </div>
    )
  }

  return <Outlet />
}
