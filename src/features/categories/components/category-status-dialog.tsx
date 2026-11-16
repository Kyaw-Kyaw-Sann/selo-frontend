import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import ConfirmDialog from '../../../components/shared/confirm-dialog'
import type { ApiError } from '../../../types/api'
import { useUpdateCategoryStatusMutation } from '../categories.queries'
import type { Category } from '../categories.types'

type CategoryStatusDialogProps = {
  category: Category
  onClose: () => void
}

export default function CategoryStatusDialog({ category, onClose }: CategoryStatusDialogProps) {
  const statusMutation = useUpdateCategoryStatusMutation()
  const action = category.isActive ? 'Deactivate' : 'Activate'

  const handleConfirm = async () => {
    try {
      // Confirmation အောင်မှ ရွေးထားတဲ့ category ID တစ်ခုအတွက် request ပို့သည်။
      await statusMutation.mutateAsync({ id: category.id, isActive: !category.isActive })
      toast.success('Category status updated successfully')
      onClose()
    } catch {
      // Failure မှာ dialog ဆက်ဖွင့်ထားပြီး inline error ပြသည်။
    }
  }

  let errorMessage: string | undefined
  if (statusMutation.isError) {
    const error = statusMutation.error
    if (isAxiosError<ApiError>(error)) {
      errorMessage = !error.response
        ? 'Unable to connect. Check your connection and try again'
        : error.response.status === 403
          ? 'You do not have permission to change category status'
          : error.response.data?.message || 'Unable to change category status. Please try again'
    } else {
      errorMessage = 'Unable to change category status. Please try again'
    }
  }

  return (
    <ConfirmDialog
      title={`${action} category`}
      description={`${action} “${category.name}”? Only this category will change. Child categories and products keep their current status.`}
      confirmLabel={action}
      destructive={category.isActive}
      pending={statusMutation.isPending}
      error={errorMessage}
      onConfirm={() => void handleConfirm()}
      onClose={onClose}
    />
  )
}
