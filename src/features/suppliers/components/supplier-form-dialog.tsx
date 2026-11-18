import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Dialog from '../../../components/ui/dialog'
import Input from '../../../components/ui/input'
import Button from '../../../components/ui/button'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import type { ApiError } from '../../../types/api'
import { useSaveSupplierMutation, useSupplierQuery } from '../suppliers.queries'
import { supplierSchema } from '../suppliers.schema'
import type { SupplierFormInput, SupplierFormValues } from '../suppliers.schema'
import type { SupplierDetail } from '../suppliers.types'

type SupplierFormDialogProps = {
  supplierId?: string
  onClose: () => void
  onSaved: () => void
}

type SupplierFormProps = Omit<SupplierFormDialogProps, 'supplierId'> & {
  supplier?: SupplierDetail
}

function SupplierForm({ supplier, onClose, onSaved }: SupplierFormProps) {
  // Form ဖွင့်ချိန် detail ကို baseline ထားပြီး background refresh ကြောင့် inputs မပြောင်းပါ။
  const [originalSupplier] = useState(supplier)
  const saveMutation = useSaveSupplierMutation(originalSupplier)
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting, isDirty } } = useForm<SupplierFormValues, unknown, SupplierFormInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: originalSupplier?.name ?? '',
      phone: originalSupplier?.phone ?? '',
      contactPerson: originalSupplier?.contactPerson ?? '',
      address: originalSupplier?.address ?? '',
      notes: originalSupplier?.notes ?? '',
    },
  })
  const pending = isSubmitting || saveMutation.isPending

  const handleClose = () => {
    if (!pending && (!isDirty || window.confirm('Discard unsaved supplier changes?'))) onClose()
  }

  const onSubmit = async (input: SupplierFormInput) => {
    clearErrors('root')
    if (originalSupplier && (['name', 'phone', 'contactPerson', 'address', 'notes'] as const).every((field) => input[field] === originalSupplier[field])) {
      onClose()
      return
    }
    try {
      await saveMutation.mutateAsync(input)
      onSaved()
      toast.success(originalSupplier ? 'Supplier updated successfully' : 'Supplier created successfully')
      onClose()
    } catch (error) {
      if (isAxiosError<ApiError>(error)) {
        if (error.response?.status === 401) return
        setError('root', {
          message: !error.response ? 'Unable to connect. Check your connection and try again'
            : error.response.status === 403 ? 'You do not have permission to save suppliers'
              : error.response.data?.message || 'Unable to save supplier. Please try again',
        })
      } else {
        setError('root', { message: 'Unable to save supplier. Please try again' })
      }
    }
  }

  return (
    <Dialog title={originalSupplier ? 'Edit supplier' : 'Add supplier'} onClose={handleClose} closeDisabled={pending}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} aria-busy={pending} className="space-y-4">
        <div>
          <label htmlFor="supplier-name" className="mb-1.5 block font-medium text-heading">Name</label>
          <Input id="supplier-name" autoFocus maxLength={200} readOnly={pending} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'supplier-name-error' : undefined} {...register('name')} />
          {errors.name && <p id="supplier-name-error" role="alert" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="supplier-phone" className="mb-1.5 block font-medium text-heading">Phone (optional)</label>
          <Input id="supplier-phone" type="tel" maxLength={40} readOnly={pending} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'supplier-phone-error' : undefined} {...register('phone')} />
          {errors.phone && <p id="supplier-phone-error" role="alert" className="mt-1 text-sm text-danger">{errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="supplier-contact" className="mb-1.5 block font-medium text-heading">Contact person (optional)</label>
          <Input id="supplier-contact" maxLength={150} readOnly={pending} aria-invalid={Boolean(errors.contactPerson)} aria-describedby={errors.contactPerson ? 'supplier-contact-error' : undefined} {...register('contactPerson')} />
          {errors.contactPerson && <p id="supplier-contact-error" role="alert" className="mt-1 text-sm text-danger">{errors.contactPerson.message}</p>}
        </div>
        <div>
          <label htmlFor="supplier-address" className="mb-1.5 block font-medium text-heading">Address (optional)</label>
          <textarea id="supplier-address" rows={3} maxLength={5000} readOnly={pending} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'supplier-address-error' : undefined} className="block w-full resize-y rounded-control border border-input-border bg-surface px-3 py-2 text-sm text-heading aria-invalid:border-danger" {...register('address')} />
          {errors.address && <p id="supplier-address-error" role="alert" className="mt-1 text-sm text-danger">{errors.address.message}</p>}
        </div>
        <div>
          <label htmlFor="supplier-notes" className="mb-1.5 block font-medium text-heading">Notes (optional)</label>
          <textarea id="supplier-notes" rows={3} maxLength={5000} readOnly={pending} aria-invalid={Boolean(errors.notes)} aria-describedby={errors.notes ? 'supplier-notes-error' : undefined} className="block w-full resize-y rounded-control border border-input-border bg-surface px-3 py-2 text-sm text-heading aria-invalid:border-danger" {...register('notes')} />
          {errors.notes && <p id="supplier-notes-error" role="alert" className="mt-1 text-sm text-danger">{errors.notes.message}</p>}
        </div>
        {errors.root && <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">{errors.root.message}</p>}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={handleClose} disabled={pending} className="min-h-10 rounded-control border border-input-border px-4 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-50">Cancel</button>
          <Button type="submit" disabled={pending || Boolean(originalSupplier && !isDirty)}>{pending ? 'Saving…' : 'Save supplier'}</Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function SupplierFormDialog({ supplierId, onClose, onSaved }: SupplierFormDialogProps) {
  // List မှာ address/notes မပါလို့ edit မဖွင့်မီ detail ကို ရယူသည်။
  const supplierQuery = useSupplierQuery(supplierId ?? '')
  if (supplierId && supplierQuery.isPending) {
    return <Dialog title="Edit supplier" onClose={onClose}><LoadingState message="Loading supplier…" /></Dialog>
  }

  const status = isAxiosError(supplierQuery.error) ? supplierQuery.error.response?.status : undefined
  if (supplierId && supplierQuery.isError && (!supplierQuery.data || status === 403 || status === 404)) {
    return (
      <Dialog title="Edit supplier" onClose={onClose}>
        <ErrorState
          title={status === 404 ? 'Supplier not found' : status === 403 ? 'Permission denied' : 'Unable to load supplier'}
          message={status === 404 ? 'This supplier is no longer available' : status === 403 ? 'You do not have permission to edit this supplier' : 'Please try again'}
          onRetry={status === 403 || status === 404 ? undefined : () => void supplierQuery.refetch()}
          isRetrying={supplierQuery.isFetching}
        />
      </Dialog>
    )
  }

  return <SupplierForm key={supplierId ?? 'create'} supplier={supplierId ? supplierQuery.data : undefined} onClose={onClose} onSaved={onSaved} />
}
