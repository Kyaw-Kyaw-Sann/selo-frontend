import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import ConfirmDialog from '../../../components/shared/confirm-dialog'
import type { ApiError } from '../../../types/api'
import { useUpdateStaffStatusMutation } from '../users.queries'
import type { StaffUser } from '../users.types'

type Props = {
  staff: StaffUser
  isSelf: boolean
  onClose: () => void
}

export default function StaffStatusDialog({ staff, isSelf, onClose }: Props) {
  const status = useUpdateStaffStatusMutation()
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const isActive = !staff.isActive
  const action = isActive ? 'Activate' : 'Deactivate'
  const consequence = isActive
    ? 'This staff member can sign in again.'
    : isSelf ? 'You will be returned to sign in.' : 'This staff member will lose access to Selo.'

  async function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    setError('')
    try {
      await status.mutateAsync({ id: staff.id, isActive })
      toast.success(isActive ? 'Staff account activated' : 'Staff account deactivated')
      onClose()
    } catch (failure) {
      const response = isAxiosError<ApiError>(failure) ? failure.response : undefined
      if (response?.status === 401) return
      if (response?.data?.code === 'LAST_ACTIVE_OWNER') {
        setError('At least one active Owner must remain.')
      } else {
        setError(response?.data?.message || 'Unable to update staff status. Please try again.')
      }
    } finally {
      inFlight.current = false
    }
  }

  return (
    <ConfirmDialog
      title={`${action} staff account?`}
      description={`${action} “${staff.name}”? ${consequence}`}
      confirmLabel={action}
      destructive={!isActive}
      pending={status.isPending}
      error={error}
      onClose={() => { if (!inFlight.current) onClose() }}
      onConfirm={() => void confirm()}
    />
  )
}
