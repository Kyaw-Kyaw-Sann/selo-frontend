import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import ConfirmDialog from '../../../components/shared/confirm-dialog'
import type { ApiError } from '../../../types/api'
import { useUpdateSupplierStatusMutation } from '../suppliers.queries'
import type { Supplier } from '../suppliers.types'

type SupplierStatusDialogProps = {
  supplier: Supplier
  onClose: () => void
  onSaved: () => void
}

export default function SupplierStatusDialog({ supplier, onClose, onSaved }: SupplierStatusDialogProps) {
  const statusMutation = useUpdateSupplierStatusMutation()
  const action = supplier.isActive ? 'Deactivate' : 'Activate'

  const handleConfirm = async () => {
    try {
      await statusMutation.mutateAsync({ id: supplier.id, isActive: !supplier.isActive })
      onSaved()
      toast.success('Supplier status updated successfully')
      onClose()
    } catch {
      // Failure မှာ dialog ဆက်ဖွင့်ထားပြီး mutation error ကို inline ပြသည်။
    }
  }

  let errorMessage: string | undefined
  if (statusMutation.isError) {
    const error = statusMutation.error
    if (isAxiosError<ApiError>(error)) {
      errorMessage = !error.response
        ? 'Unable to connect. Check your connection and try again'
        : error.response.status === 403
          ? 'You do not have permission to change supplier status'
          : error.response.data?.message || 'Unable to change supplier status. Please try again'
    } else {
      errorMessage = 'Unable to change supplier status. Please try again'
    }
  }

  return (
    <ConfirmDialog
      title={`${action} supplier`}
      description={supplier.isActive ? `Deactivate “${supplier.name}”? Existing records will be kept.` : `Activate “${supplier.name}” again?`}
      confirmLabel={action}
      destructive={supplier.isActive}
      pending={statusMutation.isPending}
      error={errorMessage}
      onConfirm={() => void handleConfirm()}
      onClose={onClose}
    />
  )
}
