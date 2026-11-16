import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import ConfirmDialog from '../../../components/shared/confirm-dialog'
import type { ApiError } from '../../../types/api'
import { useUpdateUnitStatusMutation } from '../units.queries'
import type { Unit } from '../units.types'

type UnitStatusDialogProps = {
  unit: Unit
  onClose: () => void
}

export default function UnitStatusDialog({ unit, onClose }: UnitStatusDialogProps) {
  const statusMutation = useUpdateUnitStatusMutation()
  const action = unit.isActive ? 'Deactivate' : 'Activate'

  const handleConfirm = async () => {
    try {
      // Confirm လုပ်မှ request ပို့သည်။ Request failure မှာ dialog ဆက်ဖွင့်ထားသည်။
      await statusMutation.mutateAsync({ id: unit.id, isActive: !unit.isActive })
      toast.success('Unit status updated successfully')
      onClose()
    } catch {
      // Mutation error ကို အောက်မှာ inline ပြသည်။
    }
  }

  let errorMessage: string | undefined
  if (statusMutation.isError) {
    const error = statusMutation.error
    if (isAxiosError<ApiError>(error)) {
      errorMessage = !error.response
        ? 'Unable to connect. Check your connection and try again'
        : error.response.status === 403
          ? 'You do not have permission to change unit status'
          : error.response.data?.message || 'Unable to change unit status. Please try again'
    } else {
      errorMessage = 'Unable to change unit status. Please try again'
    }
  }

  return (
    <ConfirmDialog
      title={`${action} unit`}
      description={unit.isActive
        ? `Deactivate “${unit.name}”? Existing records will be kept.`
        : `Activate “${unit.name}” again?`}
      confirmLabel={action}
      destructive={unit.isActive}
      pending={statusMutation.isPending}
      error={errorMessage}
      onConfirm={() => void handleConfirm()}
      onClose={onClose}
    />
  )
}
