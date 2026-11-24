import { isAxiosError } from 'axios'
import { z } from 'zod'
import type { ApiError } from '../../types/api'
import { purchaseLineAmountsSchema } from './purchases.form'

const pendingPurchaseSchema = z.object({
  supplierId: z.string().nullable(),
  notes: z.string().nullable(),
  idempotencyKey: z.uuid(),
  items: z.array(purchaseLineAmountsSchema.extend({ productUnitId: z.string().min(1) })).min(1).max(100),
})

export type PendingPurchase = z.infer<typeof pendingPurchaseSchema>

export function readPendingPurchase(storageKey: string): PendingPurchase | null {
  try {
    const saved = sessionStorage.getItem(storageKey)
    if (saved === null) return null
    const parsed = pendingPurchaseSchema.safeParse(JSON.parse(saved))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function getPurchaseFailure(error: unknown) {
  const response = isAxiosError<ApiError>(error) ? error.response : undefined
  const status = response?.status
  const code = response?.data?.code
  const conflict = status === 409 && code === 'IDEMPOTENCY_CONFLICT'
  const rejected = status === 400 || status === 401 || status === 403 || status === 404
    || (status === 409 && ['SUPPLIER_INACTIVE', 'PRODUCT_INACTIVE', 'PURCHASE_UNIT_UNAVAILABLE', 'STOCK_LIMIT_EXCEEDED'].includes(code ?? ''))

  return {
    conflict,
    rejected,
    signedOut: status === 401,
    message: response?.data?.message || 'Unable to confirm whether the purchase was received.',
  }
}
