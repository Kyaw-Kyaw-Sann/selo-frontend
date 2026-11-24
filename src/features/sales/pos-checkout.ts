import { isAxiosError } from 'axios'
import { z } from 'zod'
import type { ApiError } from '../../types/api'
import { toPosMinorUnits } from './pos-cart'
import { isSaleReferenceId } from './sales.filters'
import type { CreateSaleInput } from './sales.types'

const cashAmount = z.string().regex(/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/)
const payment = z.discriminatedUnion('method', [
  z.object({ method: z.literal('CASH'), tenderedAmount: cashAmount }),
  z.object({ method: z.literal('QR'), manuallyConfirmed: z.literal(true), referenceNo: z.string().min(1).max(100).nullable() }),
])
const pendingSale = z.object({
  idempotencyKey: z.uuid(),
  items: z.array(z.object({
    productUnitId: z.string().refine(isSaleReferenceId),
    quantity: z.number().int().min(1).max(2147483647),
  })).min(1).max(100),
  payment,
})

export function readPendingSale(key: string): CreateSaleInput | null {
  try {
    const saved = sessionStorage.getItem(key)
    if (saved === null) return null
    const parsed = pendingSale.safeParse(JSON.parse(saved))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function getCashError(value: string, total: bigint) {
  if (!cashAmount.safeParse(value).success) return 'Enter a valid cash amount with up to two decimal places.'
  return toPosMinorUnits(value) < total ? 'Cash tendered must cover the estimated total.' : ''
}

export function getSaleFailure(error: unknown) {
  const response = isAxiosError<ApiError>(error) ? error.response : undefined
  const status = response?.status
  const code = response?.data?.code
  return {
    conflict: status === 409 && code === 'IDEMPOTENCY_CONFLICT',
    rejected: status === 400 || status === 401 || status === 403 || status === 404
      || (status === 409 && ['INSUFFICIENT_STOCK', 'PRODUCT_INACTIVE', 'SALE_UNIT_UNAVAILABLE'].includes(code ?? '')),
    signedOut: status === 401,
    message: response?.data?.message || 'Unable to confirm whether the sale was completed.',
  }
}
