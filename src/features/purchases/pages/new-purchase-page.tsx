import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/shared/page-header'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import LoadingState from '../../../components/shared/loading-state'
import Button from '../../../components/ui/button'
import Select from '../../../components/ui/select'
import { useSessionQuery } from '../../auth/auth.queries'
import type { ProductDetail } from '../../products/products.types'
import { useUnitOptionsQuery } from '../../units/units.queries'
import PurchaseLineFields from '../components/purchase-line-fields'
import ReceivePurchaseDialog from '../components/receive-purchase-dialog'
import {
  getLineTotalMinor,
  MAX_PURCHASE_AMOUNT_MINOR,
  MAX_PURCHASE_QUANTITY,
  newPurchaseLine,
  purchaseLineAmountsSchema,
  purchaseFormSchema,
  type PurchaseFormValues,
} from '../purchases.form'
import { formatPurchaseMinorUnits } from '../purchases.format'
import { usePurchaseProductsQuery, usePurchaseSuppliersQuery } from '../purchases.queries'
import { readPendingPurchase, type PendingPurchase } from '../purchases.receiving'

export default function NewPurchasePage() {
  const { data: owner } = useSessionQuery()
  return owner ? <NewPurchaseForm key={owner.id} storageKey={`selo.pending-purchase.${owner.id}`} /> : null
}

function NewPurchaseForm({ storageKey }: { storageKey: string }) {
  const queryClient = useQueryClient()
  const [review, setReview] = useState(() => {
    const purchase = readPendingPurchase(storageKey)
    return purchase ? { purchase, recovered: true } : null
  })
  const products = usePurchaseProductsQuery()
  const suppliers = usePurchaseSuppliersQuery()
  const sharedUnits = useUnitOptionsQuery()
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    mode: 'onTouched',
    defaultValues: { supplierId: '', notes: '', items: [newPurchaseLine()] },
  })
  const { register, control, handleSubmit, clearErrors, setError, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = useWatch({ control, name: 'items' })
  const activeUnitIds = new Set(sharedUnits.data?.filter((unit) => unit.isActive).map((unit) => unit.id))
  const activeSuppliers = suppliers.data?.filter((supplier) => supplier.isActive) ?? []
  const selectedSupplierId = useWatch({ control, name: 'supplierId' })

  // Preview က ဖြည့်ပြီးသား line amounts တွေကို decimal precision မပျောက်ဘဲ ပေါင်းသည်။
  let totalMinor = 0n
  let pricedLines = 0
  for (const item of items) {
    const amounts = purchaseLineAmountsSchema.safeParse(item)
    if (item.productId && item.productUnitId && amounts.success) {
      totalMinor += getLineTotalMinor(amounts.data.quantity, amounts.data.unitCost)
      pricedLines++
    }
  }

  const optionsPending = products.isPending || sharedUnits.isPending
  const optionsUnavailable = !products.data || !sharedUnits.data
  const retryOptions = () => {
    if (products.isError) void products.refetch()
    if (sharedUnits.isError) void sharedUnits.refetch()
  }

  const openReview = (values: PurchaseFormValues) => {
    if (review) return
    clearErrors('root')
    if (values.supplierId && !activeSuppliers.some((supplier) => supplier.id === values.supplierId)) {
      setError('supplierId', { message: 'Choose an active supplier or select No supplier' }, { shouldFocus: true })
      return
    }

    let validItems = true
    let amount = 0n
    const lines = values.items.map((item, index) => {
      // Row က ဖတ်ထားတဲ့ detail cache နဲ့ unit ရွေးချယ်မှုကို Review မှာ ပြန်တိုက်စစ်သည်။
      const product = queryClient.getQueryState<ProductDetail>(['products', 'detail', item.productId])
      const unit = product?.status === 'success' && product.data?.isActive
        ? product.data.units.find((entry) => entry.id === item.productUnitId && entry.isActive && entry.canPurchase && activeUnitIds.has(entry.unitId))
        : undefined

      if (!unit || !products.data?.some((entry) => entry.id === item.productId)) {
        setError(`items.${index}.productUnitId`, { message: 'Choose an available purchase unit' })
        validItems = false
      } else if (BigInt(item.quantity) * BigInt(unit.conversionFactor) > BigInt(MAX_PURCHASE_QUANTITY)) {
        setError(`items.${index}.quantity`, { message: 'Base quantity exceeds the supported limit' })
        validItems = false
      }

      amount += getLineTotalMinor(item.quantity, item.unitCost)
      return { productUnitId: item.productUnitId, quantity: item.quantity, unitCost: item.unitCost }
    })
    if (!validItems) return
    if (amount > MAX_PURCHASE_AMOUNT_MINOR) {
      setError('root', { message: 'Purchase total exceeds the supported limit' })
      return
    }
    if (!globalThis.crypto?.randomUUID) {
      setError('root', { message: 'Open Selo over HTTPS or localhost to receive a purchase' })
      return
    }

    const purchase: PendingPurchase = {
      supplierId: values.supplierId || null,
      notes: values.notes || null,
      idempotencyKey: crypto.randomUUID(),
      items: lines,
    }
    setReview({ purchase, recovered: false })
  }

  return (
    <>
      <Link to="/purchases" className="mb-4 inline-flex items-center gap-1.5 rounded-control text-sm font-medium text-muted hover:text-heading"><ArrowLeft size={16} aria-hidden="true" />Back to purchase history</Link>
      <PageHeader title="New purchase" description="Choose purchase units and enter what you paid per unit." />
      {optionsPending && <LoadingState message="Loading product options…" />}
      {!optionsPending && optionsUnavailable && (
        <ErrorState title="Unable to load product options" onRetry={retryOptions} isRetrying={products.isFetching || sharedUnits.isFetching} />
      )}
      {products.data?.length === 0 && !optionsUnavailable && (
        <EmptyState title="No active products" description="Activate a product to prepare a purchase." />
      )}
      {products.data && sharedUnits.data && products.data.length > 0 && (
        <form noValidate onSubmit={handleSubmit(openReview)} className="space-y-5">
          {(products.isError || sharedUnits.isError) && (
            <ErrorState title="Unable to refresh product options" message="Showing previously loaded options." onRetry={retryOptions} isRetrying={products.isFetching || sharedUnits.isFetching} />
          )}
          <section aria-label="Supplier and notes" className="grid gap-4 rounded-panel border border-border bg-surface p-4 sm:grid-cols-2">
            <div>
              <label htmlFor="purchase-supplier" className="mb-1.5 block font-medium">Supplier (optional)</label>
              <Select id="purchase-supplier" aria-invalid={Boolean(errors.supplierId)} aria-describedby={errors.supplierId ? 'purchase-supplier-error' : undefined} {...register('supplierId')}>
                <option value="">No supplier</option>
                {selectedSupplierId && !activeSuppliers.some((supplier) => supplier.id === selectedSupplierId) && (
                  <option value={selectedSupplierId} disabled>Unavailable supplier</option>
                )}
                {activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </Select>
              {errors.supplierId && <p id="purchase-supplier-error" role="alert" className="mt-1 text-xs text-danger">{errors.supplierId.message}</p>}
              {suppliers.isPending && <p role="status" className="mt-1 text-xs text-muted">Loading suppliers…</p>}
              {suppliers.isError && (
                <p role="status" className="mt-1 text-xs text-danger">
                  Unable to load suppliers.{' '}
                  <button type="button" disabled={suppliers.isFetching} onClick={() => void suppliers.refetch()} className="font-medium text-primary underline">Retry</button>
                </p>
              )}
            </div>
            <div>
              <label htmlFor="purchase-notes" className="mb-1.5 block font-medium">Notes (optional)</label>
              <textarea id="purchase-notes" rows={2} maxLength={5000} className="block w-full resize-y rounded-control border border-input-border px-3 py-2 text-sm" {...register('notes')} />
              {errors.notes && <p role="alert" className="mt-1 text-xs text-danger">{errors.notes.message}</p>}
            </div>
          </section>
          <section aria-labelledby="new-purchase-items" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="new-purchase-items" className="text-base font-semibold text-heading">Purchase items</h2>
              <Button disabled={fields.length >= 100} onClick={() => append(newPurchaseLine(), { shouldFocus: false })}>
                <Plus size={16} aria-hidden="true" /> Add item
              </Button>
            </div>
            {fields.map((field, index) => (
              <PurchaseLineFields
                key={field.id}
                index={index}
                form={form}
                products={products.data}
                activeUnitIds={activeUnitIds}
                onRemove={fields.length > 1 ? () => remove(index) : undefined}
              />
            ))}
          </section>
          <div className="rounded-panel border border-border bg-surface p-4 text-right">
            <p className="text-sm text-muted">Estimated total</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-heading">{pricedLines ? formatPurchaseMinorUnits(totalMinor) : '—'}</p>
            {pricedLines < fields.length && <p className="mt-1 text-xs text-muted">Complete all items to see the full total.</p>}
            {totalMinor > MAX_PURCHASE_AMOUNT_MINOR && <p role="alert" className="mt-1 text-sm text-danger">Purchase total exceeds the supported limit.</p>}
            {totalMinor <= MAX_PURCHASE_AMOUNT_MINOR && errors.root?.message && <p role="alert" className="mt-1 text-sm text-danger">{errors.root.message}</p>}
            <Button type="submit" className="mt-3" disabled={totalMinor > MAX_PURCHASE_AMOUNT_MINOR}>Review purchase</Button>
          </div>
        </form>
      )}
      {review && (
        <ReceivePurchaseDialog
          purchase={review.purchase}
          storageKey={storageKey}
          supplierName={review.purchase.supplierId
            ? suppliers.data?.find((supplier) => supplier.id === review.purchase.supplierId)?.name ?? `Supplier #${review.purchase.supplierId}`
            : 'No supplier'}
          recovered={review.recovered}
          onClose={() => setReview(null)}
        />
      )}
    </>
  )
}
