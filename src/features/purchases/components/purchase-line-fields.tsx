import { useWatch, type UseFormReturn } from 'react-hook-form'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import { useProductQuery } from '../../products/products.queries'
import type { Product } from '../../products/products.types'
import {
  getLineTotalMinor,
  MAX_PURCHASE_QUANTITY,
  newPurchaseLine,
  purchaseLineAmountsSchema,
  purchaseQuantitySchema,
  type PurchaseFormValues,
} from '../purchases.form'
import { formatPurchaseMinorUnits } from '../purchases.format'

type Props = {
  index: number
  form: UseFormReturn<PurchaseFormValues>
  products: Product[]
  activeUnitIds: Set<string>
  onRemove?: () => void
}

export default function PurchaseLineFields({ index, form, products, activeUnitIds, onRemove }: Props) {
  const { register, setValue, control, formState } = form
  const line = useWatch({ control, name: `items.${index}` }) ?? newPurchaseLine()
  const product = useProductQuery(line.productId)
  const errors = formState.errors.items?.[index]
  // Product-unit နဲ့ shared unit နှစ်ခုလုံး active ဖြစ်မှ ဝယ်ယူရန် ရွေးနိုင်သည်။
  const units = product.isSuccess && product.data.isActive
    ? product.data.units.filter((unit) => unit.isActive && unit.canPurchase && activeUnitIds.has(unit.unitId))
    : []
  const selectedUnit = units.find((unit) => unit.id === line.productUnitId)
  const quantity = purchaseQuantitySchema.safeParse(line.quantity)
  const amounts = purchaseLineAmountsSchema.safeParse(line)
  const baseQuantity = selectedUnit && quantity.success
    ? BigInt(quantity.data) * BigInt(selectedUnit.conversionFactor)
    : null
  const prefix = `purchase-line-${index}`
  let unitMessage = errors?.productUnitId?.message
  if (line.productId && product.isSuccess && units.length === 0) {
    unitMessage = 'No units available for purchasing'
  } else if (line.productUnitId && product.isSuccess && !selectedUnit) {
    unitMessage = 'Choose an available purchase unit'
  }
  const quantityMessage = errors?.quantity?.message
    ?? (baseQuantity !== null && baseQuantity > BigInt(MAX_PURCHASE_QUANTITY) ? 'Base quantity exceeds the supported limit' : undefined)

  return (
    <fieldset className="min-w-0 rounded-panel border border-border bg-surface p-4">
      <legend className="px-1 font-semibold text-heading">Item {index + 1}</legend>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor={`${prefix}-product`} className="mb-1.5 block font-medium">Product</label>
          <Select
            id={`${prefix}-product`}
            aria-invalid={Boolean(errors?.productId)}
            aria-describedby={errors?.productId ? `${prefix}-product-error` : undefined}
            {...register(`items.${index}.productId`, {
              onChange: () => {
                setValue(`items.${index}.productUnitId`, '', { shouldDirty: true })
                form.clearErrors(`items.${index}.productUnitId`)
              },
            })}
          >
            <option value="">Choose a product</option>
            {line.productId && !products.some((item) => item.id === line.productId) && <option value={line.productId} disabled>Unavailable product</option>}
            {products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
          </Select>
          {errors?.productId && <p id={`${prefix}-product-error`} className="mt-1 text-xs text-danger">{errors.productId.message}</p>}
        </div>
        <div>
          <label htmlFor={`${prefix}-unit`} className="mb-1.5 block font-medium">Purchase unit</label>
          <Select
            id={`${prefix}-unit`}
            disabled={!product.isSuccess || units.length === 0}
            aria-invalid={Boolean(unitMessage)}
            aria-describedby={unitMessage ? `${prefix}-unit-error` : undefined}
            {...register(`items.${index}.productUnitId`)}
          >
            <option value="">{line.productId && product.isPending ? 'Loading units…' : 'Choose a unit'}</option>
            {line.productUnitId && !selectedUnit && <option value={line.productUnitId} disabled>Unavailable unit</option>}
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitName} (×{unit.conversionFactor})</option>)}
          </Select>
          {unitMessage && <p id={`${prefix}-unit-error`} className="mt-1 text-xs text-danger">{unitMessage}</p>}
          {line.productId && product.isError && (
            <p role="status" className="mt-1 text-xs text-danger">
              Unable to load product units.{' '}
              <button type="button" disabled={product.isFetching} onClick={() => void product.refetch()} className="font-medium text-primary underline">Retry</button>
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${prefix}-quantity`} className="mb-1.5 block font-medium">Quantity</label>
          <Input id={`${prefix}-quantity`} type="number" step={1} min={1} max={MAX_PURCHASE_QUANTITY} aria-invalid={Boolean(quantityMessage)} aria-describedby={quantityMessage ? `${prefix}-quantity-error` : undefined} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
          {quantityMessage && <p id={`${prefix}-quantity-error`} className="mt-1 text-xs text-danger">{quantityMessage}</p>}
        </div>
        <div>
          <label htmlFor={`${prefix}-cost`} className="mb-1.5 block font-medium">Unit cost (MMK)</label>
          <Input id={`${prefix}-cost`} inputMode="decimal" maxLength={19} aria-invalid={Boolean(errors?.unitCost)} aria-describedby={errors?.unitCost ? `${prefix}-cost-error` : undefined} {...register(`items.${index}.unitCost`)} />
          {errors?.unitCost && <p id={`${prefix}-cost-error`} className="mt-1 text-xs text-danger">{errors.unitCost.message}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
        <p className="text-muted">Base quantity <span className="font-medium tabular-nums text-heading">{baseQuantity?.toLocaleString('en-US') ?? '—'}</span></p>
        <p className="text-muted">Line total <span className="font-medium tabular-nums text-heading">{selectedUnit && amounts.success ? formatPurchaseMinorUnits(getLineTotalMinor(amounts.data.quantity, amounts.data.unitCost)) : '—'}</span></p>
        {onRemove && <button type="button" aria-label={`Remove item ${index + 1}`} onClick={onRemove} className="rounded-control px-2 py-1 text-danger hover:bg-danger-soft">Remove</button>}
      </div>
    </fieldset>
  )
}
