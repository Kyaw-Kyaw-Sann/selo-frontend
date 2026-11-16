import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import ConfirmDialog from '../../../components/shared/confirm-dialog'
import type { ApiError } from '../../../types/api'
import { useUpdateProductStatusMutation } from '../products.queries'
import type { Product } from '../products.types'

type ProductStatusDialogProps = {
  product: Product
  onSaved: () => void
  onClose: () => void
}

export default function ProductStatusDialog({ product, onSaved, onClose }: ProductStatusDialogProps) {
  const statusMutation = useUpdateProductStatusMutation()
  const action = product.isActive ? 'Deactivate' : 'Activate'

  const handleConfirm = async () => {
    try {
      // Confirm လုပ်မှ desired Boolean ပို့သည်။ Stock ကို local မှာ မပြောင်းပါ။
      await statusMutation.mutateAsync({ id: product.id, isActive: !product.isActive })
      onSaved()
      toast.success('Product status updated successfully')
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
          ? 'You do not have permission to change product status'
          : error.response.data?.message || 'Unable to change product status. Please try again'
    } else {
      errorMessage = 'Unable to change product status. Please try again'
    }
  }

  return (
    <ConfirmDialog
      title={`${action} product`}
      description={`${action} “${product.name}”? Stock quantities and product-unit status will remain unchanged.`}
      confirmLabel={action}
      destructive={product.isActive}
      pending={statusMutation.isPending}
      error={errorMessage}
      onConfirm={() => void handleConfirm()}
      onClose={onClose}
    />
  )
}
