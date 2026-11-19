import { isAxiosError } from 'axios'
import Dialog from '../../../components/ui/dialog'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import { useInventoryMovementQuery } from '../inventory.queries'
import { formatMovementDate, formatQuantityChange, movementTypeLabels } from '../inventory.format'

type MovementDetailDialogProps = {
  movementId: string
  onClose: () => void
}

export default function MovementDetailDialog({ movementId, onClose }: MovementDetailDialogProps) {
  const movementQuery = useInventoryMovementQuery(movementId)
  let content

  if (movementQuery.isPending) {
    content = <LoadingState message="Loading stock movement…" />
  } else if (movementQuery.isError) {
    const status = isAxiosError(movementQuery.error) ? movementQuery.error.response?.status : undefined
    content = <ErrorState
      title={status === 404 ? 'Movement not found' : status === 403 ? 'Permission denied' : 'Unable to load stock movement'}
      message={status === 404 ? 'This stock movement is no longer available' : status === 403 ? 'You do not have permission to view stock movements' : 'Please try again'}
      onRetry={status === 403 || status === 404 ? undefined : () => void movementQuery.refetch()}
      isRetrying={movementQuery.isFetching}
    />
  } else {
    const movement = movementQuery.data
    content = (
      <div className="space-y-5">
        <div className="border-b border-border pb-4">
          <h3 className="font-semibold wrap-anywhere text-heading">{movement.productName}</h3>
          <p className="mt-1 text-sm wrap-anywhere text-muted">{movement.sku} · Movement #{movement.id}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div><dt className="text-xs text-muted">Type</dt><dd className="mt-1">{movementTypeLabels[movement.movementType]}</dd></div>
          <div><dt className="text-xs text-muted">Base unit</dt><dd className="mt-1">{movement.baseUnitName}</dd></div>
          <div><dt className="text-xs text-muted">Quantity change</dt><dd className={`mt-1 font-semibold tabular-nums ${movement.quantityChange < 0 ? 'text-danger' : movement.quantityChange > 0 ? 'text-success' : 'text-body'}`}>{formatQuantityChange(movement.quantityChange)}</dd></div>
          <div><dt className="text-xs text-muted">Before → After</dt><dd className="mt-1 tabular-nums">{movement.quantityBefore.toLocaleString('en-US')} → {movement.quantityAfter.toLocaleString('en-US')}</dd></div>
          <div className="col-span-2"><dt className="text-xs text-muted">Recorded at (UTC)</dt><dd className="mt-1"><time dateTime={movement.createdAt}>{formatMovementDate(movement.createdAt)}</time></dd></div>
          <div className="col-span-2"><dt className="text-xs text-muted">Performed by</dt><dd className="mt-1 wrap-anywhere">{movement.performedByName}</dd></div>
          <div className="col-span-2"><dt className="text-xs text-muted">Reason</dt><dd className="mt-1 whitespace-pre-wrap wrap-anywhere">{movement.reason ?? 'Not provided'}</dd></div>
          <div className="col-span-2"><dt className="text-xs text-muted">Reference</dt><dd className="mt-1 wrap-anywhere">{movement.referenceType ?? 'None'}{movement.referenceId !== null && ` #${movement.referenceId}`}</dd><p className="mt-1 text-xs text-muted">Purchase, sale and return references identify source items, not transaction headers.</p></div>
          <div className="col-span-2"><dt className="text-xs text-muted">Operation key</dt><dd className="mt-1 font-mono text-xs wrap-anywhere">{movement.operationKey}</dd></div>
        </dl>
      </div>
    )
  }

  return <Dialog title="Stock movement details" onClose={onClose}>{content}</Dialog>
}
