import { z } from 'zod'
import type { CreateProductInput, ProductFormData } from './products.types'

const referenceIdSchema = z.string()
  .regex(/^[1-9]\d*$/, 'Select a valid reference')
  .max(19, 'Invalid reference ID')
  .refine((value) => value.length < 19 || value <= '9223372036854775807', 'Invalid reference ID')

const productUnitSchema = z.object({
  unitId: referenceIdSchema,
  conversionFactor: z.number().int('Enter a whole number').min(1).max(2147483647),
  barcode: z.string().trim().max(100, 'Barcode must not exceed 100 characters'),
  sellingPrice: z.string().regex(
    /^(0|[1-9]\d{0,15})(\.\d{1,2})?$/,
    'Enter a nonnegative price with up to 16 integer digits and 2 decimal places',
  ),
  canSell: z.boolean(),
  canPurchase: z.boolean(),
  isActive: z.boolean().optional(),
}).strict().refine(
  // Valid decimal string မှာ nonzero digit ရှိ/မရှိ စစ်ပြီး Number မပြောင်းပါ။
  (unit) => !unit.canSell || /[1-9]/.test(unit.sellingPrice),
  { message: 'Sellable units must have a positive selling price', path: ['sellingPrice'] },
)

export const productFormSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').max(80),
  name: z.string().trim().min(1, 'Product name is required').max(200),
  categoryId: z.union([referenceIdSchema, z.literal('')]),
  baseUnitId: referenceIdSchema,
  imagePath: z.string().trim().max(500, 'Image path must not exceed 500 characters'),
  minStockLevel: z.number().int('Enter a whole number').min(0).max(2147483647),
  units: z.array(productUnitSchema).min(1, 'Add at least one unit').max(3, 'A product can have at most three units'),
}).strict().superRefine((product, context) => {
  const unitIds = new Set<string>()
  const barcodes = new Set<string>()

  product.units.forEach((unit, index) => {
    if (unitIds.has(unit.unitId)) {
      context.addIssue({ code: 'custom', path: ['units', index, 'unitId'], message: 'Product units must not repeat' })
    }
    unitIds.add(unit.unitId)

    if (unit.barcode) {
      if (barcodes.has(unit.barcode)) {
        context.addIssue({ code: 'custom', path: ['units', index, 'barcode'], message: 'Product barcodes must not repeat' })
      }
      barcodes.add(unit.barcode)
    }
  })

  const baseIndex = product.units.findIndex((unit) => unit.unitId === product.baseUnitId)
  if (baseIndex === -1) {
    context.addIssue({ code: 'custom', path: ['baseUnitId'], message: 'Include the base unit in product units' })
  } else if (product.units[baseIndex].conversionFactor !== 1) {
    context.addIssue({ code: 'custom', path: ['units', baseIndex, 'conversionFactor'], message: 'Base unit conversion factor must be 1' })
  }
}).transform((product): ProductFormData => ({
  ...product,
  // Form မှာ blank strings သုံးပြီး API boundary မှာ nullable fields ပြောင်းသည်။
  categoryId: product.categoryId || null,
  imagePath: product.imagePath || null,
  units: product.units.map((unit) => ({ ...unit, barcode: unit.barcode || null })),
}))

export const createProductSchema = productFormSchema.transform((product): CreateProductInput => ({
  ...product,
  // POST /products က product-unit isActive မလက်ခံလို့ explicit fields သာပို့သည်။
  units: product.units.map((unit) => ({
    unitId: unit.unitId,
    conversionFactor: unit.conversionFactor,
    barcode: unit.barcode,
    sellingPrice: unit.sellingPrice,
    canSell: unit.canSell,
    canPurchase: unit.canPurchase,
  })),
}))

// React Hook Form က raw values ကို ထိန်းပြီး resolver က API payload ထုတ်ပေးမည်။
export type CreateProductFormValues = z.input<typeof createProductSchema>
export type ProductFormValues = z.input<typeof productFormSchema>
