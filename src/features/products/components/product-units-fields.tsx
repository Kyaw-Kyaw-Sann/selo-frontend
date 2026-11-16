import { useFieldArray, useWatch } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import type { Unit } from '../../units/units.types'
import type { ProductFormValues } from '../products.schema'
import type { ProductFormData, ProductDetail } from '../products.types'

type ProductUnitsFieldsProps = {
  form: UseFormReturn<ProductFormValues, unknown, ProductFormData>
  units: Unit[]
  pending: boolean
  product?: ProductDetail
}

export default function ProductUnitsFields({ form, units, pending, product }: ProductUnitsFieldsProps) {
  const { control, register, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'units' })
  const selectedUnits = useWatch({ control, name: 'units' })
  const baseUnitId = useWatch({ control, name: 'baseUnitId' })
  const maxUnitCount = Math.min(3, (product?.units.length ?? 0) + units.filter((unit) => unit.isActive && !product?.units.some((row) => row.unitId === unit.id)).length)

  return (
    <section className="space-y-4 rounded-panel border border-border bg-surface p-4 md:p-6">
      <div>
        <h2 className="text-lg font-semibold text-heading">Product units</h2>
        <p className="text-sm text-muted">Up to three shared units. Quantities are converted to the base unit.</p>
      </div>
      {(errors.units?.message || errors.units?.root?.message) && (
        <p role="alert" className="text-sm text-danger">{errors.units.message || errors.units.root?.message}</p>
      )}
      {fields.map((field, index) => {
        const rowErrors = errors.units?.[index]
        const existing = product?.units.find((unit) => unit.unitId === field.unitId)
        const canReactivate = !existing || existing.isActive || units.some((unit) => unit.id === existing.unitId && unit.isActive)
        return (
          <fieldset key={field.id} disabled={pending} className="space-y-4 rounded-control border border-border p-4">
            <legend className="px-1 font-semibold text-heading">{index === 0 ? 'Base unit' : `Additional unit ${index}`}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                {index === 0 || existing ? <p className="mb-1.5 font-medium">Unit</p> : <label htmlFor={`product-unit-${index}`} className="mb-1.5 block font-medium">Unit</label>}
                {index === 0 || existing ? (
                  <>
                    <input type="hidden" {...register(`units.${index}.unitId`)} />
                    <p id={`product-unit-${index}`} className="py-2">{existing?.unitName ?? units.find((unit) => unit.id === baseUnitId)?.name ?? 'Choose a base unit above'}</p>
                    {existing && <p className="text-xs text-muted">{selectedUnits[index]?.isActive ? 'Active product unit' : 'Inactive product unit'} · Shared unit cannot be replaced</p>}
                  </>
                ) : (
                  <Select id={`product-unit-${index}`} aria-invalid={Boolean(rowErrors?.unitId)} aria-describedby={rowErrors?.unitId ? `product-unit-${index}-error` : undefined} {...register(`units.${index}.unitId`)}>
                    <option value="">Select unit</option>
                    {units.filter((unit) => unit.isActive).map((unit) => <option key={unit.id} value={unit.id} disabled={selectedUnits.some((row, rowIndex) => rowIndex !== index && row.unitId === unit.id)}>{unit.name} ({unit.code})</option>)}
                  </Select>
                )}
                {rowErrors?.unitId && <p id={`product-unit-${index}-error`} role="alert" className="mt-1 text-sm text-danger">{rowErrors.unitId.message}</p>}
              </div>
              <div>
                <label htmlFor={`product-conversion-${index}`} className="mb-1.5 block font-medium">Base units per selected unit</label>
                <Input id={`product-conversion-${index}`} type="number" min={1} max={2147483647} step={1} readOnly={index === 0} aria-invalid={Boolean(rowErrors?.conversionFactor)} aria-describedby={rowErrors?.conversionFactor ? `product-conversion-${index}-error` : undefined} {...register(`units.${index}.conversionFactor`, { valueAsNumber: true })} />
                {rowErrors?.conversionFactor && <p id={`product-conversion-${index}-error`} role="alert" className="mt-1 text-sm text-danger">{rowErrors.conversionFactor.message}</p>}
              </div>
              <div>
                <label htmlFor={`product-price-${index}`} className="mb-1.5 block font-medium">Selling price (MMK)</label>
                {/* Money ကို Number မပြောင်းဘဲ decimal string အဖြစ် ထိန်းသည်။ */}
                <Input id={`product-price-${index}`} inputMode="decimal" aria-invalid={Boolean(rowErrors?.sellingPrice)} aria-describedby={rowErrors?.sellingPrice ? `product-price-${index}-error` : undefined} {...register(`units.${index}.sellingPrice`)} />
                {rowErrors?.sellingPrice && <p id={`product-price-${index}-error`} role="alert" className="mt-1 text-sm text-danger">{rowErrors.sellingPrice.message}</p>}
              </div>
              <div>
                <label htmlFor={`product-barcode-${index}`} className="mb-1.5 block font-medium">Barcode (optional)</label>
                <Input id={`product-barcode-${index}`} maxLength={100} aria-invalid={Boolean(rowErrors?.barcode)} aria-describedby={rowErrors?.barcode ? `product-barcode-${index}-error` : undefined} {...register(`units.${index}.barcode`)} />
                {rowErrors?.barcode && <p id={`product-barcode-${index}-error`} role="alert" className="mt-1 text-sm text-danger">{rowErrors.barcode.message}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" {...register(`units.${index}.canSell`)} />Can sell</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-primary" {...register(`units.${index}.canPurchase`)} />Can purchase</label>
              {existing && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="size-4 accent-primary" disabled={!canReactivate} {...register(`units.${index}.isActive`)} />
                  Active product unit
                </label>
              )}
              {index > 0 && !existing && <button type="button" onClick={() => remove(index)} className="rounded-control px-2 py-1 text-sm font-medium text-danger hover:bg-danger-soft">Remove unit</button>}
            </div>
            {existing && !canReactivate && <p className="text-sm text-muted">Activate the shared unit first to enable this product unit.</p>}
          </fieldset>
        )
      })}
      <button
        type="button"
        disabled={pending || fields.length >= maxUnitCount}
        onClick={() => append({ unitId: '', conversionFactor: 1, barcode: '', sellingPrice: '0.00', canSell: true, canPurchase: true })}
        className="rounded-control border border-input-border px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add another unit
      </button>
    </section>
  )
}
