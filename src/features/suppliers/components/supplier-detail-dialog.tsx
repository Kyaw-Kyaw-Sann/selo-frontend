import { isAxiosError } from 'axios'
import Dialog from '../../../components/ui/dialog'
import Badge from '../../../components/ui/badge'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import { useSupplierQuery } from '../suppliers.queries'

type SupplierDetailDialogProps = {
  supplierId: string
  onClose: () => void
}

export default function SupplierDetailDialog({ supplierId, onClose }: SupplierDetailDialogProps) {
  // Edit dialog နဲ့ detail cache တူသုံးပြီး list မှာမပါတဲ့ address/notes ကို ယူသည်။
  const supplierQuery = useSupplierQuery(supplierId)

  let content
  if (supplierQuery.isPending) {
    content = <LoadingState message="Loading supplier…" />
  } else if (supplierQuery.isError) {
    const status = isAxiosError(supplierQuery.error) ? supplierQuery.error.response?.status : undefined
    content = <ErrorState
      title={status === 404 ? 'Supplier not found' : status === 403 ? 'Permission denied' : 'Unable to load supplier'}
      message={status === 404 ? 'This supplier is no longer available' : status === 403 ? 'You do not have permission to view this supplier' : 'Please try again'}
      onRetry={status === 403 || status === 404 ? undefined : () => void supplierQuery.refetch()}
      isRetrying={supplierQuery.isFetching}
    />
  } else {
    const supplier = supplierQuery.data
    content = (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <h3 className="min-w-0 text-lg font-semibold wrap-anywhere text-heading">{supplier.name}</h3>
          <Badge tone={supplier.isActive ? 'success' : 'neutral'}>{supplier.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
        <dl className="space-y-4">
          <div><dt className="text-xs text-muted">Phone</dt><dd className="mt-1 wrap-anywhere tabular-nums">{supplier.phone ?? 'Not provided'}</dd></div>
          <div><dt className="text-xs text-muted">Contact person</dt><dd className="mt-1 wrap-anywhere">{supplier.contactPerson ?? 'Not provided'}</dd></div>
          <div><dt className="text-xs text-muted">Address</dt><dd className="mt-1 whitespace-pre-wrap wrap-anywhere">{supplier.address ?? 'Not provided'}</dd></div>
          <div><dt className="text-xs text-muted">Notes</dt><dd className="mt-1 whitespace-pre-wrap wrap-anywhere">{supplier.notes ?? 'Not provided'}</dd></div>
        </dl>
      </div>
    )
  }

  return <Dialog title="Supplier details" onClose={onClose}>{content}</Dialog>
}
