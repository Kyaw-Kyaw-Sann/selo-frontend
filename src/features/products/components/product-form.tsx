import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import Button from '../../../components/ui/button'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import type { ApiError } from '../../../types/api'
import type { RootCategory } from '../../categories/categories.types'
import type { Unit } from '../../units/units.types'
import { createProductSchema, productFormSchema } from '../products.schema'
import type { ProductFormValues } from '../products.schema'
import type { ProductFormData, ProductDetail } from '../products.types'
import ProductUnitsFields from './product-units-fields'

type ProductFormProps = {
  product?: ProductDetail
  categories: RootCategory[]
  units: Unit[]
  onSubmit: (input: ProductFormData) => Promise<void>
  onCancel: () => void
}

export default function ProductForm({ product, categories, units, onSubmit, onCancel }: ProductFormProps) {
  // Detail array order ကို မယူဆဘဲ base unit ကို ပထမ row မှာ ထားသည်။
  const existingUnits = product ? [
    ...product.units.filter((unit) => unit.unitId === product.baseUnitId),
    ...product.units.filter((unit) => unit.unitId !== product.baseUnitId),
  ] : []
  // Raw form values နဲ့ resolver ထုတ်ပေးတဲ့ API payload types ကို သီးခြားသတ်မှတ်သည်။
  const form = useForm<ProductFormValues, unknown, ProductFormData>({
    resolver: zodResolver(product ? productFormSchema : createProductSchema),
    defaultValues: {
      sku: product?.sku ?? '', name: product?.name ?? '', categoryId: product?.categoryId ?? '',
      baseUnitId: product?.baseUnitId ?? '', imagePath: product?.imagePath ?? '', minStockLevel: product?.minStockLevel ?? 0,
      units: product ? existingUnits.map((unit) => ({
        unitId: unit.unitId, conversionFactor: unit.conversionFactor, barcode: unit.barcode ?? '',
        sellingPrice: unit.sellingPrice, canSell: unit.canSell, canPurchase: unit.canPurchase,
        isActive: unit.isActive,
      })) : [{ unitId: '', conversionFactor: 1, barcode: '', sellingPrice: '0.00', canSell: true, canPurchase: true }],
    },
  })
  const { register, handleSubmit, setValue, setError, clearErrors, formState: { errors, isSubmitting, isDirty } } = form
  const categoryOptions = categories.flatMap((root) => [
    { ...root, label: root.name },
    ...root.children.map((child) => ({ ...child, label: `${root.name} / ${child.name}` })),
  ]).filter((category) => category.isActive || category.id === product?.categoryId)

  const submit = async (input: ProductFormData) => {
    clearErrors('root')
    // Form ဖွင့်ထားစဉ် references inactive ဖြစ်သွားနိုင်လို့ လက်ရှိ options နဲ့ ပြန်စစ်သည်။
    if (product && input.baseUnitId !== product.baseUnitId) {
      setError('baseUnitId', { message: 'Base unit cannot be changed' })
      return
    }
    if (input.categoryId && input.categoryId !== product?.categoryId && !categoryOptions.some((category) => category.id === input.categoryId && category.isActive)) {
      setError('categoryId', { message: 'Choose an active category or select None' })
      return
    }
    if (input.units.some((row) => !product?.units.some((unit) => unit.unitId === row.unitId) && !units.some((unit) => unit.id === row.unitId && unit.isActive))) {
      setError('units', { message: 'Choose active shared units for all product units' })
      return
    }
    if (input.units.some((row) => {
      const existing = product?.units.find((unit) => unit.unitId === row.unitId)
      return existing && !existing.isActive && row.isActive === true && !units.some((unit) => unit.id === row.unitId && unit.isActive)
    })) {
      setError('units', { message: 'Activate the shared unit before enabling its product unit' })
      return
    }
    try {
      await onSubmit(input)
    } catch (error) {
      if (isAxiosError<ApiError>(error)) {
        if (error.response?.status === 401) return
        const code = error.response?.data?.code
        if (code === 'PRODUCT_SKU_EXISTS') {
          setError('sku', { message: 'SKU already exists' }, { shouldFocus: true })
          return
        }
        if (code === 'CATEGORY_NOT_FOUND' || code === 'CATEGORY_INACTIVE') {
          setError('categoryId', { message: error.response?.data?.message || 'Select an active category' })
          return
        }
        if (code === 'BASE_UNIT_IMMUTABLE') {
          setError('baseUnitId', { message: 'Base unit cannot be changed' })
          return
        }
        if (['BARCODE_EXISTS', 'UNIT_NOT_FOUND', 'UNIT_INACTIVE', 'UNIT_CONVERSION_IN_USE', 'BASE_UNIT_CONVERSION', 'PRODUCT_UNIT_LIMIT'].includes(code ?? '')) {
          // Backend က row index မပေးလို့ ဘယ် row မှားတယ်ဆိုတာ မခန့်မှန်းပါ။
          setError('units', { message: error.response?.data?.message || 'Check product units and barcodes' })
          return
        }
        setError('root', {
          message: !error.response ? 'Unable to connect. Check your connection and try again'
            : error.response.status === 403 ? 'You do not have permission to save products'
              : error.response.data?.message || 'Unable to save product. Please try again',
        })
      } else {
        setError('root', { message: 'Unable to save product. Please try again' })
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} aria-busy={isSubmitting} className="space-y-6">
      <fieldset className="grid gap-4 rounded-panel border border-border bg-surface p-4 md:grid-cols-2 md:p-6">
        <legend className="px-1 text-lg font-semibold text-heading">Product information</legend>
        <div>
          <label htmlFor="product-name" className="mb-1.5 block font-medium">Product name</label>
          <Input id="product-name" maxLength={200} readOnly={isSubmitting} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'product-name-error' : undefined} {...register('name')} />
          {errors.name && <p id="product-name-error" role="alert" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="product-sku" className="mb-1.5 block font-medium">SKU</label>
          <Input id="product-sku" maxLength={80} readOnly={isSubmitting} aria-invalid={Boolean(errors.sku)} aria-describedby={errors.sku ? 'product-sku-error' : undefined} {...register('sku')} />
          {errors.sku && <p id="product-sku-error" role="alert" className="mt-1 text-sm text-danger">{errors.sku.message}</p>}
        </div>
        <div>
          <label htmlFor="product-category" className="mb-1.5 block font-medium">Category (optional)</label>
          <Select id="product-category" disabled={isSubmitting} aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? 'product-category-error' : undefined} {...register('categoryId')}>
            <option value="">None</option>
            {product?.categoryId && !categoryOptions.some((category) => category.id === product.categoryId) && (
              <option value={product.categoryId}>{product.categoryName ?? `Category #${product.categoryId}`} (Current)</option>
            )}
            {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.label}{category.isActive ? '' : ' (Inactive)'}</option>)}
          </Select>
          {errors.categoryId && <p id="product-category-error" role="alert" className="mt-1 text-sm text-danger">{errors.categoryId.message}</p>}
        </div>
        <div>
          {product ? <p className="mb-1.5 font-medium">Base unit</p> : <label htmlFor="product-base-unit" className="mb-1.5 block font-medium">Base unit</label>}
          {product ? (
            <>
              <input type="hidden" {...register('baseUnitId')} />
              <p id="product-base-unit" className="py-2">{product.baseUnitName} ({product.baseUnitCode})</p>
            </>
          ) : <Select
            id="product-base-unit"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.baseUnitId)}
            aria-describedby={errors.baseUnitId ? 'product-base-unit-hint product-base-unit-error' : 'product-base-unit-hint'}
            {...register('baseUnitId', {
              onChange: (event) => {
                // ပထမ row ကို base unit အဖြစ် ထိန်းပြီး conversion ကို 1 သတ်မှတ်သည်။
                setValue('units.0.unitId', event.target.value, { shouldDirty: true })
                setValue('units.0.conversionFactor', 1, { shouldDirty: true })
              },
            })}
          >
            <option value="">Select base unit</option>
            {units.filter((unit) => unit.isActive).map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}
          </Select>}
          <p id="product-base-unit-hint" className="mt-1 text-sm text-muted">Stock is counted in this unit. The base unit cannot change after creation.</p>
          {errors.baseUnitId && <p id="product-base-unit-error" role="alert" className="mt-1 text-sm text-danger">{errors.baseUnitId.message}</p>}
        </div>
        <div>
          <label htmlFor="product-minimum" className="mb-1.5 block font-medium">Minimum stock (base units)</label>
          <Input id="product-minimum" type="number" min={0} max={2147483647} step={1} readOnly={isSubmitting} aria-invalid={Boolean(errors.minStockLevel)} aria-describedby={errors.minStockLevel ? 'product-minimum-error' : undefined} {...register('minStockLevel', { valueAsNumber: true })} />
          {errors.minStockLevel && <p id="product-minimum-error" role="alert" className="mt-1 text-sm text-danger">{errors.minStockLevel.message}</p>}
        </div>
        <div>
          <label htmlFor="product-image" className="mb-1.5 block font-medium">Image path (optional)</label>
          <Input id="product-image" maxLength={500} readOnly={isSubmitting} aria-invalid={Boolean(errors.imagePath)} aria-describedby={errors.imagePath ? 'product-image-hint product-image-error' : 'product-image-hint'} {...register('imagePath')} />
          <p id="product-image-hint" className="mt-1 text-sm text-muted">Use an existing image path. File upload is unavailable.</p>
          {errors.imagePath && <p id="product-image-error" role="alert" className="mt-1 text-sm text-danger">{errors.imagePath.message}</p>}
        </div>
      </fieldset>

      <ProductUnitsFields form={form} units={units} product={product} pending={isSubmitting} />
      {errors.root && <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">{errors.root.message}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" disabled={isSubmitting} onClick={() => { if (!isDirty || window.confirm('Discard unsaved product changes?')) onCancel() }} className="rounded-control border border-input-border bg-surface px-4 py-2 disabled:opacity-50">Cancel</button>
        <Button type="submit" disabled={isSubmitting || Boolean(product && !isDirty)}>{isSubmitting ? 'Saving…' : product ? 'Save changes' : 'Create product'}</Button>
      </div>
    </form>
  )
}
