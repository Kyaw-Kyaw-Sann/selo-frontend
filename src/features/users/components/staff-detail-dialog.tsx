import { isAxiosError } from 'axios'
import ErrorState from '../../../components/shared/error-state'
import LoadingState from '../../../components/shared/loading-state'
import Badge from '../../../components/ui/badge'
import Dialog from '../../../components/ui/dialog'
import { useUserQuery } from '../users.queries'

type Props = {
  userId: string
  onClose: () => void
}

export default function StaffDetailDialog({ userId, onClose }: Props) {
  const user = useUserQuery(userId)

  let content
  if (user.isPending) {
    content = <LoadingState message="Loading staff account…" />
  } else if (user.isError) {
    const status = isAxiosError(user.error) ? user.error.response?.status : undefined
    if (status === 404) {
      content = <ErrorState title="Staff account not found" message="This account is no longer available." />
    } else if (status === 403) {
      content = <ErrorState title="Permission denied" message="You do not have permission to view staff accounts." />
    } else {
      content = <ErrorState title="Unable to load staff account" onRetry={() => void user.refetch()} isRetrying={user.isFetching} />
    }
  } else {
    const staff = user.data
    content = (
      <>
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <h3 className="min-w-0 text-lg font-semibold wrap-anywhere text-heading">{staff.name}</h3>
          <Badge tone={staff.isActive ? 'success' : 'neutral'}>{staff.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-muted">Username</dt><dd className="mt-1 font-medium wrap-anywhere">{staff.username}</dd></div>
          <div><dt className="text-sm text-muted">Role</dt><dd className="mt-1 font-medium">{staff.role === 'OWNER' ? 'Owner' : 'Cashier'}</dd></div>
        </dl>
      </>
    )
  }

  return <Dialog title="Staff account" onClose={onClose}>{content}</Dialog>
}
