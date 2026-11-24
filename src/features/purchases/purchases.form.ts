import { z } from 'zod'

export const MAX_PURCHASE_QUANTITY = 2147483647
export const MAX_PURCHASE_AMOUNT_MINOR = 999999999999999999n

const requiredId = (message: string) => z.string().min(1, message)
export const purchaseQuantitySchema = z.number({ error: 'Enter a quantity' })
  .int('Enter a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(MAX_PURCHASE_QUANTITY, 'Quantity exceeds the supported limit')
const positiveUnitCost = z.string().trim()
  .regex(/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/, 'Enter a cost with up to 16 whole digits and 2 decimal places')
  .refine((value) => /[1-9]/.test(value), 'Unit cost must be greater than zero')

export const purchaseLineAmountsSchema = z.object({
  quantity: purchaseQuantitySchema,
  unitCost: positiveUnitCost,
})

export const purchaseFormSchema = z.object({
  supplierId: z.string(),
  notes: z.string().trim().max(5000, 'Notes must not exceed 5000 characters'),
  items: z.array(purchaseLineAmountsSchema.extend({
    productId: requiredId('Choose a product'),
    productUnitId: requiredId('Choose a purchase unit'),
  })).min(1).max(100),
})

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>

export function newPurchaseLine(): PurchaseFormValues['items'][number] {
  return { productId: '', productUnitId: '', quantity: 1, unitCost: '' }
}

export function getLineTotalMinor(quantity: number, unitCost: string) {
  const [whole, fraction = ''] = unitCost.split('.')
  const costMinor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  return BigInt(quantity) * costMinor
}
