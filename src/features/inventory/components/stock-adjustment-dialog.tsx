import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import Dialog from '../../../components/ui/dialog'
import Input from '../../../components/ui/input'
import Button from '../../../components/ui/button'
import type { ApiError } from '../../../types/api'
import { useCreateInventoryAdjustmentMutation } from '../inventory.queries'
import { stockAdjustmentSchema } from '../inventory.schema'
import type { StockAdjustmentFormValues } from '../inventory.schema'
import { isUncertainAdjustmentError } from '../inventory.adjustment'
import { formatQuantityChange } from '../inventory.format'
import type { CreateInventoryAdjustmentInput, InventoryItem } from '../inventory.types'

type StockAdjustmentDialogProps = {
  product: InventoryItem
  onClose: () => void
  onSaved: () => void
}

export default function StockAdjustmentDialog({ product, onClose, onSaved }: StockAdjustmentDialogProps) {
  const mutation = useCreateInventoryAdjustmentMutation()
  const [submission, setSubmission] = useState<CreateInventoryAdjustmentInput | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const inFlight = useRef(false)
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { reason: '' },
    shouldUnregister: false,
  })
  const duplicate = isAxiosError<ApiError>(mutation.error) && mutation.error.response?.data?.code === 'OPERATION_KEY_EXISTS'

  const handleClose = () => {
    if (inFlight.current || mutation.isPending) return
    const message = uncertain
      ? 'This adjustment may already have been saved. Check its stock movements before creating another adjustment. Close anyway?'
      : 'Discard unsaved stock adjustment?'
    if ((!isDirty && !submission) || window.confirm(message)) onClose()
  }

  const review = (values: StockAdjustmentFormValues) => {
    // Confirm/retry အတွက် payload နဲ့ UUID ကို snapshot တစ်ခုအဖြစ် ထိန်းသည်။
    setSubmission({ productId: product.productId, ...values, operationKey: crypto.randomUUID() })
  }

  const confirm = async () => {
    if (!submission || inFlight.current || duplicate) return
    inFlight.current = true
    try {
      const saved = await mutation.mutateAsync(submission)
      onSaved()
      toast.success('Inventory adjusted successfully', {
        description: `${saved.quantityBefore.toLocaleString('en-US')} → ${saved.quantityAfter.toLocaleString('en-US')} ${product.baseUnitName}`,
      })
      onClose()
    } catch (error) {
      // Unknown result ပြီးရင် same key/body နဲ့သာ retry လုပ်နိုင်သည်။ နောက် error က lock ကို မဖြုတ်ပါ။
      if (isUncertainAdjustmentError(error)) setUncertain(true)
    } finally {
      inFlight.current = false
    }
  }

  let errorMessage: string | undefined
  if (mutation.isError) {
    const error = mutation.error
    errorMessage = isAxiosError<ApiError>(error)
      ? !error.response ? 'Unable to confirm the result. Check your connection before retrying the same adjustment.'
        : error.response.status === 403 ? 'You do not have permission to adjust stock'
          : error.response.data?.message || 'Unable to save stock adjustment'
      : 'Unable to confirm the result. Check stock movements before creating another adjustment.'
  }

  return (
    <Dialog title={submission ? 'Confirm stock adjustment' : 'Adjust stock'} onClose={handleClose} closeDisabled={mutation.isPending}>
      <div className="mb-5 border-b border-border pb-4">
        <p className="font-semibold wrap-anywhere text-heading">{product.productName}</p>
        <p className="mt-1 text-xs text-muted">{product.sku} · Base unit: {product.baseUnitName}</p>
        <p className="mt-2 text-sm">Last loaded stock: <span className="font-semibold tabular-nums">{product.stockQuantity.toLocaleString('en-US')} {product.baseUnitName}</span></p>
      </div>
      {!submission ? (
        <form noValidate onSubmit={handleSubmit(review)} className="space-y-4">
          <div>
            <label htmlFor="adjustment-quantity" className="mb-1.5 block font-medium text-heading">Quantity change (base units)</label>
            <Input id="adjustment-quantity" autoFocus type="number" step={1} min={-2147483647} max={2147483647} aria-invalid={Boolean(errors.quantityChange)} aria-describedby={errors.quantityChange ? 'adjustment-quantity-hint adjustment-quantity-error' : 'adjustment-quantity-hint'} {...register('quantityChange', { valueAsNumber: true })} />
            <p id="adjustment-quantity-hint" className="mt-1 text-xs text-muted">Positive adds stock; negative removes stock. Zero is not allowed.</p>
            {errors.quantityChange && <p id="adjustment-quantity-error" role="alert" className="mt-1 text-xs text-danger">{errors.quantityChange.message}</p>}
          </div>
          <div>
            <label htmlFor="adjustment-reason" className="mb-1.5 block font-medium text-heading">Reason</label>
            <textarea id="adjustment-reason" rows={3} maxLength={255} aria-invalid={Boolean(errors.reason)} aria-describedby={errors.reason ? 'adjustment-reason-error' : undefined} className="block w-full resize-y rounded-control border border-input-border px-3 py-2 text-sm aria-invalid:border-danger" {...register('reason')} />
            {errors.reason && <p id="adjustment-reason-error" role="alert" className="mt-1 text-xs text-danger">{errors.reason.message}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button type="button" onClick={handleClose} className="min-h-10 rounded-control border border-input-border px-4 py-2 text-sm font-medium hover:bg-surface-muted">Cancel</button>
            <Button type="submit">Review adjustment</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4" aria-busy={mutation.isPending}>
          <dl className="space-y-3">
            <div><dt className="text-xs text-muted">Quantity change</dt><dd className={`mt-1 font-semibold tabular-nums ${submission.quantityChange < 0 ? 'text-danger' : 'text-success'}`}>{formatQuantityChange(submission.quantityChange)} {product.baseUnitName}</dd></div>
            <div><dt className="text-xs text-muted">Preview stock after adjustment</dt><dd className="mt-1 font-semibold tabular-nums">{(product.stockQuantity + submission.quantityChange).toLocaleString('en-US')} {product.baseUnitName}</dd></div>
            <div><dt className="text-xs text-muted">Reason</dt><dd className="mt-1 whitespace-pre-wrap wrap-anywhere">{submission.reason}</dd></div>
          </dl>
          <p className="text-xs text-muted">Preview uses last loaded stock. The server checks current stock and returns the actual before/after quantities.</p>
          {errorMessage && <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">{errorMessage}</p>}
          {uncertain && (
            <div role="alert" className="space-y-2 rounded-control border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
              <p>Do not create another adjustment until you have checked its movement history.</p>
              <p className="font-mono text-xs wrap-anywhere">Operation: manual:{submission.operationKey}</p>
              <Link to={`/inventory/movements?productId=${product.productId}`} target="_blank" rel="noopener noreferrer" className="inline-block rounded-control font-medium underline">Check stock movements in a new tab</Link>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
            <button type="button" autoFocus disabled={mutation.isPending} onClick={() => {
              if (uncertain) { handleClose(); return }
              if (inFlight.current) return
              mutation.reset()
              setSubmission(null)
            }} className="min-h-10 rounded-control border border-input-border px-4 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-50">{uncertain ? 'Close' : 'Back'}</button>
            <Button disabled={mutation.isPending || duplicate} onClick={() => void confirm()}>{mutation.isPending ? 'Saving…' : duplicate ? 'Operation already exists' : mutation.isError ? 'Retry same adjustment' : 'Confirm adjustment'}</Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
