import { useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Button from '../../../components/ui/button'
import Dialog from '../../../components/ui/dialog'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import type { ApiError } from '../../../types/api'
import { createStaffSchema, editStaffFormSchema, getStaffUpdates, type StaffFormValues } from '../staff-form.schema'
import { useSaveStaffMutation } from '../users.queries'
import type { StaffUser } from '../users.types'

type Props = {
  staff?: StaffUser
  signedInUserId?: string
  onClose: () => void
}

export default function StaffFormDialog({ staff, signedInUserId, onClose }: Props) {
  const save = useSaveStaffMutation()
  const inFlight = useRef(false)
  const { register, handleSubmit, clearErrors, setError, formState: { errors, isDirty, isSubmitting } } = useForm<StaffFormValues>({
    resolver: zodResolver(staff ? editStaffFormSchema : createStaffSchema),
    defaultValues: { name: staff?.name ?? '', username: staff?.username ?? '', role: staff?.role ?? 'CASHIER', password: '' },
  })
  const pending = isSubmitting || save.isPending

  const onSubmit = async (values: StaffFormValues) => {
    if (inFlight.current) return
    clearErrors('root')
    inFlight.current = true
    try {
      if (staff) {
        const input = getStaffUpdates(staff, values)
        if (Object.keys(input).length === 0) {
          onClose()
          return
        }
        await save.mutateAsync({ mode: 'edit', id: staff.id, input })
      } else {
        await save.mutateAsync({ mode: 'create', input: values })
      }
      toast.success(staff ? 'Staff account updated' : 'Staff account created')
      onClose()
    } catch (error) {
      const response = isAxiosError<ApiError>(error) ? error.response : undefined
      if (response?.status === 401) return
      const { code, message } = response?.data ?? {}
      if (code === 'USERNAME_EXISTS') {
        setError('username', { message: message || 'Username already exists' }, { shouldFocus: true })
      } else if (code === 'LAST_ACTIVE_OWNER') {
        setError('role', { message: message || 'At least one active owner must remain' })
      } else {
        setError('root', { message: message || 'Unable to save staff account. Please try again.' })
      }
    } finally {
      inFlight.current = false
      save.reset()
    }
  }

  const handleClose = () => {
    if (!inFlight.current && !pending && (!isDirty || window.confirm('Discard unsaved staff changes?'))) onClose()
  }

  return (
    <Dialog title={staff ? 'Edit staff account' : 'Add staff account'} onClose={handleClose} closeDisabled={pending}>
      <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)} aria-busy={pending} className="space-y-4">
        <div>
          <label htmlFor="staff-name" className="mb-1.5 block font-medium text-heading">Name</label>
          <Input id="staff-name" autoFocus maxLength={150} readOnly={pending} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'staff-name-error' : undefined} {...register('name')} />
          {errors.name && <p id="staff-name-error" role="alert" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="staff-username" className="mb-1.5 block font-medium text-heading">Username</label>
          <Input id="staff-username" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={80} readOnly={pending} aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'staff-username-error' : undefined} {...register('username')} />
          {errors.username && <p id="staff-username-error" role="alert" className="mt-1 text-sm text-danger">{errors.username.message}</p>}
        </div>
        {!staff && (
          <div>
            <label htmlFor="staff-password" className="mb-1.5 block font-medium text-heading">Password</label>
            <Input id="staff-password" type="password" autoComplete="new-password" readOnly={pending} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'staff-password-hint staff-password-error' : 'staff-password-hint'} {...register('password')} />
            <p id="staff-password-hint" className="mt-1 text-xs text-muted">At least 8 characters and at most 72 UTF-8 bytes.</p>
            {errors.password && <p id="staff-password-error" role="alert" className="mt-1 text-sm text-danger">{errors.password.message}</p>}
          </div>
        )}
        <div>
          <label htmlFor="staff-role" className="mb-1.5 block font-medium text-heading">Role</label>
          <Select id="staff-role" disabled={pending} aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? 'staff-role-error' : undefined} {...register('role')}>
            <option value="CASHIER">Cashier</option>
            <option value="OWNER">Owner</option>
          </Select>
          {errors.role && <p id="staff-role-error" role="alert" className="mt-1 text-sm text-danger">{errors.role.message}</p>}
          {staff && staff.id === signedInUserId && <p className="mt-1 text-xs text-muted">Changing your own role to Cashier removes access to Staff management.</p>}
        </div>
        {errors.root && <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">{errors.root.message}</p>}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" disabled={pending} onClick={handleClose} className="min-h-10 rounded-control border border-input-border px-4 text-sm font-medium hover:bg-surface-muted disabled:opacity-50">Cancel</button>
          <Button type="submit" disabled={pending || Boolean(staff && !isDirty)}>{pending ? 'Saving…' : staff ? 'Save changes' : 'Create account'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
